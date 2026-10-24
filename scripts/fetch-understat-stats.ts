#!/usr/bin/env tsx
/**
 * Understat Club Stats Scraper — 2024-25
 * Fetches player stats for Big 5 leagues from understat.com
 * Data is embedded as JSON in the page — no auth required.
 *
 * Stats: goals, assists, shots, key_passes, xG, xA, games, minutes
 *
 * Run: npm run fetch-understat-stats
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const DELAY_MS = 3000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Understat league keys → display names
const LEAGUES = [
  { key: "EPL",         league: "Premier League" },
  { key: "La_liga",    league: "La Liga" },
  { key: "Bundesliga", league: "Bundesliga" },
  { key: "Serie_A",    league: "Serie A" },
  { key: "Ligue_1",    league: "Ligue 1" },
] as const;

const SEASON = "2024"; // Understat: 2024 = 2024-25 season

// ── Name normalisation (mirrors supabase-player-stats.ts) ────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr")
    .replace(/\bii\b/gi, "ii")
    .replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Types ─────────────────────────────────────────────────────

interface UnderstatPlayer {
  id: string;
  player_name: string;
  games: string;
  time: string;
  goals: string;
  xG: string;
  assists: string;
  xA: string;
  shots: string;
  key_passes: string;
  yellow_cards: string;
  red_cards: string;
  position: string;
  team_title: string;
  npg: string;
  npxG: string;
}

// ── Fetch & parse ─────────────────────────────────────────────

async function fetchLeaguePlayers(leagueKey: string): Promise<UnderstatPlayer[]> {
  const url = `https://understat.com/league/${leagueKey}/${SEASON}`;
  console.log(`  Fetching ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
    });

    if (!res.ok) {
      console.warn(`    HTTP ${res.status} — skipping`);
      return [];
    }

    const html = await res.text();

    // Understat embeds data as: var playersData = JSON.parse('...')
    const match = html.match(
      /var\s+playersData\s*=\s*JSON\.parse\('([\s\S]*?)'\)/
    );
    if (!match?.[1]) {
      console.warn(`    playersData not found in page`);
      return [];
    }

    // Unescape hex/unicode sequences then parse
    const jsonStr = match[1]
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      )
      .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) =>
        String.fromCharCode(parseInt(h, 16))
      )
      .replace(/\\\\/g, "\\")
      .replace(/\\'/g, "'");

    const players: UnderstatPlayer[] = JSON.parse(jsonStr);
    console.log(`    ${players.length} players`);
    return players;
  } catch (err) {
    console.warn(`    Error:`, err);
    return [];
  }
}

function n(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function per90(total: number | null, minutes: number | null): number | null {
  if (total == null || !minutes || minutes < 45) return null;
  return Math.round((total / (minutes / 90)) * 1000) / 1000;
}

// ── Upsert ────────────────────────────────────────────────────

interface DbRecord {
  player_name: string;
  normalized_name: string;
  club: string;
  league: string;
  season: string;
  matches_played: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  passes_per90: number | null;
  tackles_per90: number | null;
  progressive_carries_per90: number | null;
  xg_per90: number | null;
  xag_per90: number | null;
}

async function upsert(records: DbRecord[]): Promise<{ ok: number; err: number }> {
  if (!records.length) return { ok: 0, err: 0 };
  let ok = 0;
  let err = 0;
  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    const { error } = await supabase
      .from("player_club_stats")
      .upsert(chunk, { onConflict: "normalized_name,club,season" });
    if (error) {
      console.error(`    Upsert error: ${error.message}`);
      err += chunk.length;
    } else {
      ok += chunk.length;
    }
  }
  return { ok, err };
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  Understat Club Stats Scraper — 2024-25       ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("ERROR: Missing Supabase env vars");
    process.exit(1);
  }

  let totalOk = 0;
  let totalErr = 0;

  for (let i = 0; i < LEAGUES.length; i++) {
    const { key, league } = LEAGUES[i];
    if (i > 0) await sleep(DELAY_MS);

    console.log(`\n[${i + 1}/${LEAGUES.length}] ${league}`);
    const players = await fetchLeaguePlayers(key);
    if (!players.length) continue;

    const records: DbRecord[] = players.map((p) => {
      const minutes = n(p.time);
      return {
        player_name: p.player_name,
        normalized_name: normalizeName(p.player_name),
        club: p.team_title,
        league,
        season: "2024-25",
        matches_played: n(p.games),
        minutes,
        goals: n(p.goals),
        assists: n(p.assists),
        shots_per90: per90(n(p.shots), minutes),
        shots_on_target_per90: null,   // not in Understat
        key_passes_per90: per90(n(p.key_passes), minutes),
        passes_per90: null,            // not in Understat
        tackles_per90: null,           // not in Understat
        progressive_carries_per90: null, // not in Understat
        xg_per90: per90(n(p.xG), minutes),
        xag_per90: per90(n(p.xA), minutes),
      };
    });

    const { ok, err } = await upsert(records);
    totalOk += ok;
    totalErr += err;
    console.log(`  Upserted: ${ok}  Errors: ${err}`);
  }

  // ── Coverage check against WC squad players ────────────────
  console.log("\n── WC squad coverage ───────────────────────────");
  const { data: profiles } = await supabase
    .from("player_role_profiles")
    .select("player_name")
    .eq("wc_squad_confirmed", true);

  if (profiles?.length) {
    const norms = profiles.map((p) => normalizeName(p.player_name));

    const { data: found } = await supabase
      .from("player_club_stats")
      .select("normalized_name")
      .in("normalized_name", norms)
      .eq("season", "2024-25");

    const foundSet = new Set(found?.map((r) => r.normalized_name) ?? []);
    const withData = profiles.filter((p) =>
      foundSet.has(normalizeName(p.player_name))
    );
    const noData = profiles.filter(
      (p) => !foundSet.has(normalizeName(p.player_name))
    );

    console.log(
      `  Players with stats: ${withData.length} / ${profiles.length}`
    );
    if (noData.length) {
      const sample = noData.slice(0, 30).map((p) => p.player_name);
      console.log(
        `  No match (likely non-Big5 or name mismatch): ${sample.join(", ")}${noData.length > 30 ? ` (+${noData.length - 30} more)` : ""}`
      );
    }
  }

  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  Total upserted: ${String(totalOk).padEnd(18)}║`);
  console.log(`║  Errors:         ${String(totalErr).padEnd(18)}║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
