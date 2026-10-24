// ============================================================
// SETPIECE — Result grading (shared pipeline stage)
//
// Runs on the 30-minute loop. Finds picks whose match has finished,
// searches for the actual match stats, and resolves each pick.
//
// The hard rule here: a pick is only marked won/lost when the model
// can quote the actual number it graded against. Anything else is
// void + needs_review, which keeps it out of the published hit rate
// and puts it in the admin queue for a human call. Grading a pick as
// a loss on a guess corrupts the track record the product is sold on,
// and a wrong number would also poison club_match_stats, which feeds
// future pick generation.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/service";

const FINISHED_AFTER_MS = 110 * 60 * 1000; // 90' + stoppage + half time
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

interface PendingPick {
  id: string;
  player_name: string;
  player_team: string;
  stat_category: string;
  line: number;
  direction: string;
  home_team: string;
  away_team: string;
  competition: string | null;
  kickoff_at: string;
}

export interface GradedPick {
  id: string;
  result: "won" | "lost" | "void";
  /** The actual figure the model graded against, or "unknown". */
  actual: string;
  /** Short quote from the source that supports `actual`. */
  evidence?: string;
  /** Model's own claim that it found a real number. Verified below. */
  cited?: boolean;
}

/** Maps a stat category to its club_match_stats column. */
function statColumn(statCategory: string): string | null {
  switch (statCategory) {
    case "Total Shots":         return "shots";
    case "Shots on Target":     return "shots_on_target";
    case "Passes Attempted":    return "passes_attempted";
    case "Tackles":             return "tackles";
    case "Total Match Corners": return "match_corners";
    case "Total Bookings":      return "match_bookings";
    default:                    return null;
  }
}

/**
 * Search query tuned to the competition.
 *
 * The World Cup wording was hardcoded, so club matches were searched
 * as if they were WC ties — which mostly returned nothing useful.
 */
export function buildSearchQuery(match: {
  homeTeam: string;
  awayTeam: string;
  competition: string | null;
  matchDate: string;
}): string {
  const comp = match.competition?.trim();
  const compHint = comp && comp.length > 0 ? comp : "";
  return [
    `${match.homeTeam} vs ${match.awayTeam}`,
    compHint,
    match.matchDate,
    "player match stats shots on target passes tackles corners yellow cards",
  ]
    .filter(Boolean)
    .join(" ");
}

async function tavilySearch(query: string): Promise<string> {
  if (!process.env.TAVILY_API_KEY) return "";
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 6,
      search_depth: "advanced",
    }),
  });
  const data = await res.json();
  return (data.results ?? [])
    .map((r: { title: string; content: string }) => `${r.title}\n${r.content}`)
    .join("\n\n")
    .slice(0, 8000);
}

/**
 * A pick is safe to score only if the model returned a real number and
 * backed it with a quote. `cited` alone is not trusted — the model can
 * claim confidence it doesn't have, so the numeric check is applied here
 * rather than left to the prompt.
 */
export function isCited(g: GradedPick): boolean {
  if (g.cited === false) return false;
  const actual = (g.actual ?? "").trim().toLowerCase();
  if (!actual || actual === "unknown" || actual === "n/a") return false;
  if (!/\d/.test(actual)) return false;
  return Boolean(g.evidence && g.evidence.trim().length > 0);
}

export interface GradeResult {
  log: string[];
  graded: number;
  needsReview: number;
}

export async function runResultGrading(now: Date = new Date()): Promise<GradeResult> {
  const log: string[] = [];
  const supabase = createServiceClient();
  let graded = 0;
  let needsReview = 0;

  const finishedCutoff = new Date(now.getTime() - FINISHED_AFTER_MS).toISOString();
  const recentCutoff = new Date(now.getTime() - LOOKBACK_MS).toISOString();

  const { data: pendingPicks } = await supabase
    .from("picks")
    .select(
      "id,player_name,player_team,stat_category,line,direction,home_team,away_team,competition,kickoff_at"
    )
    .eq("result", "pending")
    .lt("kickoff_at", finishedCutoff)
    .gte("kickoff_at", recentCutoff);

  if (!pendingPicks?.length) {
    log.push("auto_results: no finished matches with pending picks");
    return { log, graded, needsReview };
  }

  // Group by match — one search and one Claude call per fixture
  const matchMap = new Map<
    string,
    {
      homeTeam: string;
      awayTeam: string;
      competition: string | null;
      kickoff: string;
      picks: PendingPick[];
    }
  >();
  for (const pick of pendingPicks as PendingPick[]) {
    const key = `${pick.home_team}|${pick.away_team}`;
    if (!matchMap.has(key)) {
      matchMap.set(key, {
        homeTeam: pick.home_team,
        awayTeam: pick.away_team,
        competition: pick.competition,
        kickoff: pick.kickoff_at,
        picks: [],
      });
    }
    matchMap.get(key)!.picks.push(pick);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  for (const [key, match] of matchMap) {
    const matchDate = match.kickoff.slice(0, 10);
    const jobKey = `results_${key.replace("|", "_")}`;

    const { data: alreadyDone } = await supabase
      .from("cron_log")
      .select("id")
      .eq("job", jobKey)
      .eq("run_date", matchDate)
      .limit(1);
    if (alreadyDone?.length) continue;

    let searchContent = "";
    try {
      searchContent = await tavilySearch(
        buildSearchQuery({ ...match, matchDate })
      );
    } catch {
      log.push(`auto_results: search failed for ${match.homeTeam} v ${match.awayTeam}`);
      continue;
    }

    // No source at all — leave pending so the next tick can retry rather
    // than burning the once-per-match cron_log entry on a transient miss.
    if (!searchContent) {
      log.push(`auto_results: no search results for ${match.homeTeam} v ${match.awayTeam}`);
      continue;
    }

    const picksDesc = match.picks
      .map(
        (p) =>
          `ID:${p.id} | ${p.player_name} (${p.player_team}) | ${p.direction} ${p.line} ${p.stat_category}`
      )
      .join("\n");

    let results: GradedPick[];
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Match: ${match.homeTeam} vs ${match.awayTeam}${
              match.competition ? ` (${match.competition})` : ""
            }, ${matchDate}

Picks to resolve:
${picksDesc}

Source material:
${searchContent}

For each pick ID, resolve the result from the player's ACTUAL stats in this match.

Rules — follow exactly:
- "won"  = the line was hit (MORE = strictly above the line, LESS = strictly below)
- "lost" = the line was not hit
- "void" = the player did not appear, OR the source does not state the number

CRITICAL: Only return "won" or "lost" when the source material explicitly
states the player's figure for that stat. Do NOT infer it from goals, from a
match report's narrative, from the player's typical output, or from your own
knowledge of this fixture. If the number is not written in the source, return
"void" with cited=false. Returning "void" is always correct when unsure — a
wrong won/lost corrupts a published track record, an unnecessary void costs
nothing.

Fields:
- actual:   the figure you graded against, e.g. "3 shots on target". "unknown" if absent.
- evidence: a short verbatim quote from the source containing that figure. Empty if absent.
- cited:    true only if the figure appears in the source material.

Return ONLY a valid JSON array, no other text:
[{"id":"...","result":"won"|"lost"|"void","actual":"...","evidence":"...","cited":true|false}]`,
          },
        ],
      });

      const raw =
        response.content[0].type === "text" ? response.content[0].text.trim() : "";
      results = JSON.parse(
        raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "")
      );
    } catch (err) {
      log.push(
        `auto_results: parse error for ${match.homeTeam} v ${match.awayTeam} — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      continue;
    }

    let matchGraded = 0;
    let matchReview = 0;
    const statsToStore: Record<string, unknown>[] = [];

    for (const r of results) {
      if (!["won", "lost", "void"].includes(r.result)) continue;
      const pick = match.picks.find((p) => p.id === r.id);
      if (!pick) continue;

      const cited = isCited(r);

      // A won/lost without a citable number is downgraded to a review item.
      const scored = r.result !== "void" && cited;
      const finalResult = scored ? r.result : "void";

      // A void backed by a source ("unused substitute") is settled — it can
      // never move the hit rate, so routing it to the queue would only add
      // noise and make the genuinely uncertain items harder to spot.
      const hasEvidence = Boolean(r.evidence && r.evidence.trim().length > 0);
      const autoVoid = r.result === "void" && hasEvidence;
      const gradingStatus = scored || autoVoid ? "auto" : "needs_review";

      await supabase
        .from("picks")
        .update({
          result: finalResult,
          grading_status: gradingStatus,
          grading_evidence: (r.evidence ?? "").slice(0, 1000) || null,
          graded_at: new Date().toISOString(),
        })
        .eq("id", pick.id);

      if (gradingStatus === "needs_review") matchReview++;
      else matchGraded++;

      // Only cited numbers become training data.
      const col = statColumn(pick.stat_category);
      const numeric = cited ? parseFloat((r.actual ?? "").replace(/[^\d.]/g, "")) : NaN;
      if (col && Number.isFinite(numeric)) {
        statsToStore.push({
          player_name: pick.player_name,
          club: pick.player_team,
          opponent:
            pick.player_team === match.homeTeam ? match.awayTeam : match.homeTeam,
          competition: match.competition,
          match_date: matchDate,
          [col]: numeric,
          source: "auto",
        });
      }
    }

    if (statsToStore.length) {
      const { error } = await supabase
        .from("club_match_stats")
        .upsert(statsToStore, { onConflict: "player_name,match_date,club" });
      if (error) console.error("[grade-results] club_match_stats:", error.message);
    }

    await supabase.from("cron_log").insert({
      job: jobKey,
      run_date: matchDate,
      meta: { match: key, graded: matchGraded, needsReview: matchReview },
    });

    graded += matchGraded;
    needsReview += matchReview;
    log.push(
      `auto_results: ${match.homeTeam} v ${match.awayTeam} — ${matchGraded} graded, ${matchReview} need review`
    );
  }

  // Surfaces a degrading source before it quietly eats a season of picks.
  const total = graded + needsReview;
  if (total > 0) {
    const pct = Math.round((needsReview / total) * 100);
    log.push(`auto_results: review rate ${pct}% (${needsReview}/${total})`);
  }

  return { log, graded, needsReview };
}
