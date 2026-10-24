#!/usr/bin/env tsx
// ============================================================
// SETPIECE — Rebuild player_club_stats from API-Football
//
// Replaces the FBref scrape, which produced:
//   · passes_per90     99% null (and completed, not attempted)
//   · tackles_per90    under-scaled ~2.4x (Rice 0.96 vs a real 2.31)
//   · no position column
//   · 13% of rows with impossible minutes (up to 17,910)
//
// FBref now sits behind Cloudflare so it cannot be fetched from a
// script at all. API-Football carries the same fields, correctly
// scaled, as structured JSON.
//
// REQUIRES A PAID PLAN for seasons 2025+. The free tier is capped at
// 2022-2024 and will return:
//   "Free plans do not have access to this season, try from 2022 to 2024."
//
// Usage:
//   npm run fetch-club-stats -- --season 2025 --leagues epl
//   npm run fetch-club-stats -- --season 2023 --leagues epl --dry-run
// ============================================================

import { createClient } from "@supabase/supabase-js";

const API_BASE = "https://v3.football.api-sports.io";

const LEAGUES: Record<string, { id: number; name: string }> = {
  epl: { id: 39, name: "Premier League" },
  "la-liga": { id: 140, name: "La Liga" },
  bundesliga: { id: 78, name: "Bundesliga" },
  "ligue-1": { id: 61, name: "Ligue 1" },
};

// ── Args ──────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (flag: string, fallback: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const SEASON_YEAR = arg("--season", "2025");
const SEASON_LABEL = `${SEASON_YEAR}-${String(+SEASON_YEAR + 1).slice(2)}`;
const LEAGUE_KEYS = arg("--leagues", "epl").split(",").map((s) => s.trim()).filter(Boolean);
const DRY_RUN = argv.includes("--dry-run");
const MAX_TEAMS = parseInt(arg("--max-teams", "0"), 10); // 0 = all

const apiKey = process.env.API_FOOTBALL_KEY;
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!apiKey) { console.error("Missing API_FOOTBALL_KEY"); process.exit(1); }
if (!sbUrl || !sbKey) { console.error("Missing Supabase credentials"); process.exit(1); }
const supabase = createClient(sbUrl, sbKey);

// ── Rate-limited fetch ────────────────────────────────────
// Free tier allows 10 req/min; paid tiers far more. Pace conservatively
// and back off on 429 rather than burning the daily quota on retries.
let requestCount = 0;
// Free tier allows 10 requests/minute, so default to a spacing that
// stays under it. Paid tiers can override: --pace-ms 200
const PACING_MS = parseInt(arg("--pace-ms", "6500"), 10);

async function api<T = unknown>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (requestCount > 0) await new Promise((r) => setTimeout(r, PACING_MS));
    requestCount++;
    const res = await fetch(`${API_BASE}/${path}`, { headers: { "x-apisports-key": apiKey! } });

    if (res.status === 429) {
      const wait = 60_000 * (attempt + 1);
      console.log(`\n  rate limited — waiting ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) { console.error(`  HTTP ${res.status} for ${path}`); return null; }

    const body = await res.json();
    const errors = body.errors;
    const hasError = Array.isArray(errors) ? errors.length > 0 : errors && Object.keys(errors).length > 0;
    if (hasError) {
      const msg = JSON.stringify(errors);
      // Rate limiting is reported in-band with a 200 status.
      if (msg.includes("rate limit") || msg.includes("rateLimit")) {
        const wait = 60_000;
        console.log(`\n  rate limited — waiting ${wait / 1000}s then retrying`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (msg.includes("do not have access to this season")) {
        console.error(
          `\n⚠  Plan does not cover season ${SEASON_YEAR}.\n` +
          `   ${msg}\n` +
          `   Upgrade at dashboard.api-football.com, or pass --season 2023 to rehearse.\n`
        );
        process.exit(1);
      }
      console.error(`  API error on ${path}: ${msg}`);
      return null;
    }
    return body as T;
  }
  return null;
}

// ── Shapes ────────────────────────────────────────────────
interface TeamsResponse { response: { team: { id: number; name: string } }[] }
interface PlayerStatLine {
  team: { id: number; name: string };
  league: { id: number };
  games: { appearences: number | null; lineups: number | null; minutes: number | null; position: string | null };
  shots: { total: number | null; on: number | null };
  goals: { total: number | null; assists: number | null };
  passes: { total: number | null; key: number | null };
  tackles: { total: number | null };
  cards: { yellow: number | null };
  fouls: { committed: number | null };
}
interface PlayersResponse {
  paging: { current: number; total: number };
  response: { player: { id: number; name: string }; statistics: PlayerStatLine[] }[];
}

function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, "").trim();
}

/** A single league season cannot exceed 38 x 90. Guards the old minutes bug. */
const MAX_SEASON_MINUTES = 3420 * 1.6; // allow cup/European minutes in aggregate lines

/**
 * Minimum minutes before a per-90 rate is meaningful.
 *
 * Without this, a player with 10 minutes and one tackle reads 9.0 tkl/90
 * and tops the leaderboard. That artefact is exactly what made the old
 * Tackles data select low-minute outliers. Raw totals are still stored,
 * so the rate can be recomputed later once a player accumulates minutes.
 */
const MIN_MINUTES_FOR_RATES = 270; // three full matches

interface StatRow {
  api_player_id: number;
  player_name: string;
  normalized_name: string;
  club: string;
  league: string;
  season: string;
  position: string | null;
  matches_played: number | null;
  starts: number | null;
  minutes: number;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  passes_attempted_per90: number | null;
  tackles_per90: number | null;
  yellow_cards_per90: number | null;
  fouls_per90: number | null;
  total_shots: number | null;
  total_shots_on_target: number | null;
  total_passes_attempted: number | null;
  total_tackles: number | null;
  total_yellow_cards: number | null;
  total_fouls_committed: number | null;
  source: string;
  scraped_at: string;
}

function buildRow(
  playerId: number, playerName: string, s: PlayerStatLine, leagueName: string
): StatRow | null {
  const minutes = s.games.minutes ?? 0;
  if (minutes <= 0 || minutes > MAX_SEASON_MINUTES) return null;
  const rateable = minutes >= MIN_MINUTES_FOR_RATES;
  const per90 = (v: number | null) =>
    v == null || !rateable ? null : +((v / minutes) * 90).toFixed(3);

  return {
    api_player_id: playerId,
    player_name: playerName,
    normalized_name: normalizeName(playerName),
    club: s.team.name,
    league: leagueName,
    season: SEASON_LABEL,
    position: s.games.position ?? null,
    matches_played: s.games.appearences ?? null,
    starts: s.games.lineups ?? null,
    minutes,
    goals: s.goals.total ?? null,
    assists: s.goals.assists ?? null,
    shots_per90: per90(s.shots.total),
    shots_on_target_per90: per90(s.shots.on),
    passes_attempted_per90: per90(s.passes.total),
    tackles_per90: per90(s.tackles.total),
    yellow_cards_per90: per90(s.cards.yellow),
    fouls_per90: per90(s.fouls.committed),
    total_shots: s.shots.total,
    total_shots_on_target: s.shots.on,
    total_passes_attempted: s.passes.total,
    total_tackles: s.tackles.total,
    total_yellow_cards: s.cards.yellow,
    total_fouls_committed: s.fouls.committed,
    source: "api-football",
    scraped_at: new Date().toISOString(),
  };
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log(`Season ${SEASON_LABEL} · leagues: ${LEAGUE_KEYS.join(", ")}${DRY_RUN ? " · DRY RUN" : ""}\n`);
  const all: StatRow[] = [];

  for (const key of LEAGUE_KEYS) {
    const league = LEAGUES[key];
    if (!league) { console.error(`Unknown league "${key}"`); continue; }

    const teamsRes = await api<TeamsResponse>(`teams?league=${league.id}&season=${SEASON_YEAR}`);
    let teams = teamsRes?.response.map((t) => t.team) ?? [];
    if (!teams.length) { console.error(`  no teams for ${league.name}`); continue; }
    if (MAX_TEAMS > 0) teams = teams.slice(0, MAX_TEAMS);

    console.log(`${league.name}: ${teams.length} teams`);

    for (const team of teams) {
      const rows: StatRow[] = [];
      let page = 1, totalPages = 1;

      do {
        const res = await api<PlayersResponse>(
          `players?team=${team.id}&season=${SEASON_YEAR}&page=${page}`
        );
        if (!res) break;
        totalPages = res.paging.total || 1;

        for (const entry of res.response) {
          // A player can have lines for several competitions; keep the
          // one for this league so per-90s aren't mixed across formats.
          const line = entry.statistics.find((s) => s.league.id === league.id);
          if (!line) continue;
          const row = buildRow(entry.player.id, entry.player.name, line, league.name);
          if (row) rows.push(row);
        }
        page++;
      } while (page <= totalPages);

      all.push(...rows);
      process.stdout.write(`\r  ${team.name.padEnd(24)} ${String(rows.length).padStart(3)} players · ${requestCount} reqs used   `);
    }
    console.log();
  }

  if (!all.length) { console.error("\nNo rows built."); process.exit(1); }

  // ── Quality report ──────────────────────────────────────
  const cov = (k: keyof StatRow) => Math.round(all.filter((r) => r[k] != null).length / all.length * 100);
  console.log(`\n── Coverage across ${all.length} players ──`);
  for (const k of ["position", "shots_per90", "shots_on_target_per90", "passes_attempted_per90", "tackles_per90", "yellow_cards_per90"] as (keyof StatRow)[]) {
    console.log(`  ${String(k).padEnd(24)} ${cov(k)}%`);
  }
  const tk = all.map((r) => r.tackles_per90).filter((v): v is number => v != null).sort((a, b) => a - b);
  if (tk.length) {
    const q = (p: number) => tk[Math.floor(tk.length * p)];
    console.log(`\n  tackles_per90  p50=${q(0.5)} p90=${q(0.9)} p99=${q(0.99)} max=${tk[tk.length - 1]}`);
    console.log(`  players >= 2.0 tkl/90: ${tk.filter((v) => v >= 2).length}`);
  }
  const pa = all.map((r) => r.passes_attempted_per90).filter((v): v is number => v != null).sort((a, b) => a - b);
  if (pa.length) console.log(`  passes_attempted_per90 p50=${pa[Math.floor(pa.length / 2)]} max=${pa[pa.length - 1]}`);
  console.log(`  minutes max: ${Math.max(...all.map((r) => r.minutes))} (hard cap ${MAX_SEASON_MINUTES})`);
  console.log(`\n  API requests used: ${requestCount}`);

  if (DRY_RUN) { console.log("\n--dry-run: nothing written.\n"); return; }

  console.log(`\n── Upserting ──`);
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < all.length; i += CHUNK) {
    const chunk = all.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("player_club_stats")
      .upsert(chunk, { onConflict: "api_player_id,club,season" });
    if (error) { console.error(`  chunk failed: ${error.message}`); process.exit(1); }
    written += chunk.length;
    process.stdout.write(`\r  ${written}/${all.length}`);
  }
  console.log(`\n  Done — ${written} rows for ${SEASON_LABEL}.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
