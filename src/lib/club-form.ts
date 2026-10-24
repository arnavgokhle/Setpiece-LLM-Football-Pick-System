// ============================================================
// SETPIECE — Rolling club form from logged matches
//
// CLAUDE.md requires a pick only when the player has hit the line in
// at least 7 of their last 10 matches. Until now that rule could not
// actually be checked for club football: the only data available was
// a season per-90 average, so "7 of 10" was something the model was
// asked to assert rather than something the system could verify.
//
// club_match_stats accumulates real per-match figures as picks are
// graded (see pipeline/grade-results.ts). This module reads them back
// and turns the rule into a deterministic post-filter, plus a
// confidence ceiling that lifts as a player's sample grows.
// ============================================================

import { createServiceClient } from "./supabase/service";
import { normalizeName } from "./supabase-player-stats";
import type { Pick } from "@/types";

/** Stat category → club_match_stats column. */
export const STAT_COLUMN: Record<string, string> = {
  "Total Shots": "shots",
  "Shots on Target": "shots_on_target",
  "Passes Attempted": "passes_attempted",
  Tackles: "tackles",
  "Total Match Corners": "match_corners",
  "Total Bookings": "match_bookings",
};

const LOOKBACK_MATCHES = 10;

/** The 7-of-10 threshold, expressed as a rate so short samples scale. */
const REQUIRED_HIT_RATE = 0.7;

/**
 * Below this many logged matches the rule cannot be judged, so picks are
 * allowed through on season priors and carry a lower confidence ceiling
 * instead. Three is the point where a hit rate stops being noise.
 */
export const MIN_MATCHES_TO_ENFORCE = 3;

export interface MatchLogRow {
  player_name: string;
  club: string;
  match_date: string;
  [col: string]: string | number | null;
}

export interface PlayerForm {
  playerName: string;
  club: string;
  /** Most recent first. */
  matches: MatchLogRow[];
}

export type FormIndex = Map<string, PlayerForm>;

function key(playerName: string, club: string): string {
  return `${normalizeName(playerName)}|${club.toLowerCase()}`;
}

/**
 * Recent logged matches for every player at the given clubs.
 * Returns an empty index when the table is missing or empty — early in a
 * season that is the normal case, not an error.
 */
export async function getRecentClubForm(clubs: string[]): Promise<FormIndex> {
  const index: FormIndex = new Map();
  if (!clubs.length) return index;

  const supabase = createServiceClient();
  // Widened lookback: 10 matches per player across a full matchweek is
  // well inside one query, and ordering is applied per player below.
  const { data, error } = await supabase
    .from("club_match_stats")
    .select("*")
    .in("club", clubs)
    .order("match_date", { ascending: false })
    .limit(4000);

  if (error) {
    console.error("[club-form] getRecentClubForm:", error.message);
    return index;
  }
  if (!data?.length) return index;

  for (const row of data as MatchLogRow[]) {
    const k = key(row.player_name, row.club);
    const entry = index.get(k) ?? {
      playerName: row.player_name,
      club: row.club,
      matches: [],
    };
    if (entry.matches.length < LOOKBACK_MATCHES) entry.matches.push(row);
    index.set(k, entry);
  }
  return index;
}

/** Numeric values for one stat across a player's logged matches, recent first. */
export function valuesFor(form: PlayerForm | undefined, statCategory: string): number[] {
  if (!form) return [];
  const col = STAT_COLUMN[statCategory];
  if (!col) return [];
  return form.matches
    .map((m) => m[col])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

/** How many of `values` cleared the line in the pick's direction. */
export function hitCount(values: number[], line: number, direction: string): number {
  return values.filter((v) => (direction === "MORE" ? v > line : v < line)).length;
}

/**
 * Confidence ceiling for a pick, based on how much real evidence backs it.
 *
 * The opening-weeks cap of 78 was a blanket assumption. Once a player has
 * a logged sample the pick is no longer resting on last season's average,
 * so the ceiling lifts toward the normal early-stage maximum of 82.
 */
export function confidenceCap(matchesLogged: number): number {
  if (matchesLogged >= 10) return 82;
  if (matchesLogged >= 6) return 81;
  if (matchesLogged >= MIN_MATCHES_TO_ENFORCE) return 80;
  return 78;
}

export interface FormFilterResult {
  kept: Pick[];
  dropped: { pick: Pick; reason: string }[];
  adjusted: number;
}

/**
 * Enforce the 7-of-10 rule and the sample-size confidence ceiling.
 *
 * Only applied where a player actually has MIN_MATCHES_TO_ENFORCE logged
 * matches; below that there is nothing to test against and the pick keeps
 * the conservative ceiling instead of being dropped.
 */
export function applyFormRules(picks: Pick[], form: FormIndex): FormFilterResult {
  const kept: Pick[] = [];
  const dropped: { pick: Pick; reason: string }[] = [];
  let adjusted = 0;

  for (const pick of picks) {
    // Match-level markets are not player-keyed.
    const isMatchMarket = pick.player.position === "MATCH";
    const playerForm = isMatchMarket
      ? undefined
      : form.get(key(pick.player.name, pick.player.team));

    const values = valuesFor(playerForm, pick.statCategory);
    const logged = values.length;

    if (logged >= MIN_MATCHES_TO_ENFORCE) {
      const hits = hitCount(values, pick.line, pick.direction);
      if (hits / logged < REQUIRED_HIT_RATE) {
        dropped.push({
          pick,
          reason: `${hits}/${logged} logged matches cleared ${pick.direction} ${pick.line} ${pick.statCategory} — below the 7-of-10 rule`,
        });
        continue;
      }
    }

    // CLAUDE.md requires a "Hit Last 10" stat on every pick. When the model
    // supplies it from a season average it is an estimate presented as a
    // count; where a real log exists, overwrite it with the true figure.
    const others = (pick.keyStats ?? []).filter(
      (k) => !k.label.toLowerCase().startsWith("hit last 10")
    );
    let next = pick;
    if (logged > 0) {
      const hits = hitCount(values, pick.line, pick.direction);
      const real = { label: "Hit Last 10", value: `${hits}/${logged}`, trend: "neutral" as const };
      next = { ...pick, keyStats: [real, ...others].slice(0, 3) };
      // recentForm is rendered as the form string on the card.
      if (values.length >= MIN_MATCHES_TO_ENFORCE) {
        next = { ...next, recentForm: values.slice(0, 5).join(", ") };
      }
    } else {
      // No log to check against, so whatever the model returned here is a
      // guess derived from a season average. CLAUDE.md forbids presenting
      // an estimate as a verified fact — label it rather than drop it.
      const claimed = (pick.keyStats ?? []).find((k) =>
        k.label.toLowerCase().startsWith("hit last 10")
      );
      if (claimed) {
        next = {
          ...pick,
          keyStats: [
            { ...claimed, label: "Hit Last 10 (est.)" },
            ...others,
          ].slice(0, 3),
        };
      }
    }

    const cap = confidenceCap(logged);
    if (next.confidence > cap) {
      adjusted++;
      kept.push({ ...next, confidence: cap });
    } else {
      kept.push(next);
    }
  }

  return { kept, dropped, adjusted };
}

/**
 * Prompt block listing each player's real recent figures.
 *
 * Given to the model so it reasons from actual match values rather than
 * from a season average, and can quote them in aiReasoning honestly.
 */
export function buildFormContext(form: FormIndex, statCategories: string[]): string {
  if (!form.size) return "";

  const byClub = new Map<string, string[]>();
  for (const entry of form.values()) {
    const parts: string[] = [];
    for (const cat of statCategories) {
      const vals = valuesFor(entry, cat);
      if (vals.length >= MIN_MATCHES_TO_ENFORCE) {
        parts.push(`${cat}: ${vals.join(", ")} (last ${vals.length})`);
      }
    }
    if (!parts.length) continue;
    const list = byClub.get(entry.club) ?? [];
    list.push(`  ${entry.playerName} — ${parts.join(" | ")}`);
    byClub.set(entry.club, list);
  }

  if (!byClub.size) return "";

  const lines: string[] = [
    "",
    "════════════════════════════════════════════════════════════",
    "ACTUAL 2026-27 MATCH LOG (most recent first — real figures)",
    "════════════════════════════════════════════════════════════",
    "These are verified per-match numbers, not averages. Where a player",
    "appears here, base the pick and the line on these figures and cite",
    "them in aiReasoning. A pick must clear the line in at least 7 of the",
    "last 10 logged matches; picks that fail this are removed automatically.",
  ];
  for (const [club, players] of byClub) {
    lines.push(`\n${club.toUpperCase()}:`);
    lines.push(...players);
  }
  lines.push("════════════════════════════════════════════════════════════");
  return lines.join("\n");
}
