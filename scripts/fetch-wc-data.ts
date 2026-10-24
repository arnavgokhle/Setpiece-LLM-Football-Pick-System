#!/usr/bin/env tsx
// ============================================================
// SETPIECE — WC 2026 Data Collection Script
//
// Populates wc_fixtures and wc_players in Supabase from
// API-Football (league ID 1, season 2026).
//
// Usage:
//   API_FOOTBALL_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
//     npx tsx scripts/fetch-wc-data.ts
//
// Or with dotenv:
//   npx tsx --env-file=.env.local scripts/fetch-wc-data.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";

const API_BASE = "https://v3.football.api-sports.io";
const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

const apiKey   = process.env.API_FOOTBALL_KEY!;
const sbUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey    = process.env.SUPABASE_SERVICE_ROLE_KEY
               ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!apiKey || !sbUrl || !sbKey) {
  console.error("Missing env vars: API_FOOTBALL_KEY, NEXT_PUBLIC_SUPABASE_URL, and one of SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);

// ── API-Football helpers ────────────────────────────────────

async function apiFetch(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) throw new Error(`API-Football ${path} → ${res.status}`);
  return res.json();
}

// Sleep to respect rate limits (100 req/day on free plan; 10/min on pro)
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1: Fetch and upsert WC 2026 fixtures ───────────────

async function fetchAndSaveFixtures(): Promise<number[]> {
  console.log("\n[1/3] Fetching WC 2026 fixtures...");
  const data = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`) as {
    response: Array<{
      fixture: { id: number; date: string; venue: { name: string | null; city: string | null }; status: { short: string } };
      league: { round: string };
      teams: { home: { id: number; name: string }; away: { id: number; name: string } };
      goals: { home: number | null; away: number | null };
    }>;
  };

  const fixtures = data.response ?? [];
  console.log(`  Found ${fixtures.length} fixtures`);

  const rows = fixtures.map((f) => {
    const round: string = f.league.round ?? "";
    // Determine stage and group_name
    let stage = round;
    let group_name: string | null = null;
    const groupMatch = round.match(/Group\s+([A-L])/i);
    if (groupMatch) {
      group_name = groupMatch[1].toUpperCase();
      stage = `Group ${group_name}`;
    } else if (/round of 32/i.test(round)) {
      stage = "R32";
    } else if (/round of 16/i.test(round)) {
      stage = "R16";
    } else if (/quarter/i.test(round)) {
      stage = "QF";
    } else if (/semi/i.test(round)) {
      stage = "SF";
    } else if (/3rd/i.test(round) || /third/i.test(round)) {
      stage = "3rd";
    } else if (/final/i.test(round)) {
      stage = "Final";
    }

    return {
      fixture_id:   f.fixture.id,
      match_date:   f.fixture.date.split("T")[0],
      kickoff_at:   f.fixture.date,
      home_team:    f.teams.home.name,
      away_team:    f.teams.away.name,
      home_team_id: f.teams.home.id,
      away_team_id: f.teams.away.id,
      venue:        f.fixture.venue.name ?? null,
      city:         f.fixture.venue.city ?? null,
      stage,
      group_name,
      home_score:   f.goals.home ?? null,
      away_score:   f.goals.away ?? null,
      status:       f.fixture.status.short ?? "NS",
      updated_at:   new Date().toISOString(),
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("wc_fixtures")
      .upsert(rows, { onConflict: "fixture_id" });
    if (error) throw new Error(`Supabase wc_fixtures upsert: ${error.message}`);
  }

  console.log(`  Saved ${rows.length} fixtures`);

  // Return unique team IDs for squad fetching
  const teamIds = [...new Set(fixtures.flatMap((f) => [f.teams.home.id, f.teams.away.id]))];
  return teamIds;
}

// ── Step 2: Fetch squads for all WC teams ───────────────────

async function fetchAndSaveSquads(teamIds: number[]): Promise<void> {
  console.log(`\n[2/3] Fetching squads for ${teamIds.length} WC teams...`);
  let total = 0;

  for (const teamId of teamIds) {
    try {
      const data = await apiFetch(`/players/squads?team=${teamId}`) as {
        response: Array<{
          team: { name: string; country: string };
          players: Array<{ id: number; name: string; age: number; number: number | null; pos: string }>;
        }>;
      };

      const entry = data.response?.[0];
      if (!entry) { await sleep(200); continue; }

      const country = entry.team.country ?? entry.team.name;
      const rows = entry.players.map((p) => ({
        player_api_id: p.id,
        name:          p.name,
        country,
        position:      mapPosition(p.pos),
        age:           p.age ?? null,
        shirt_number:  p.number ?? null,
        updated_at:    new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("wc_players")
          .upsert(rows, { onConflict: "player_api_id", ignoreDuplicates: false });
        if (error) console.error(`  Squad upsert for team ${teamId}: ${error.message}`);
        else total += rows.length;
      }

      process.stdout.write(`  Team ${teamId}: ${rows.length} players\n`);
      await sleep(150); // ~7 req/sec — stay under rate limit
    } catch (err) {
      console.error(`  Failed for team ${teamId}:`, err);
      await sleep(500);
    }
  }

  console.log(`  Total players saved: ${total}`);
}

// ── Step 3: Fetch per-player stats for WC 2026 ──────────────

async function fetchAndSavePlayerStats(): Promise<void> {
  console.log("\n[3/3] Fetching WC 2026 player statistics...");

  let page = 1;
  let total = 0;

  // API-Football paginates player stats — each page has 20 players
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let data: {
      response: Array<{
        player: { id: number; name: string; age: number };
        statistics: Array<{
          team: { name: string };
          games: { appearences: number | null; minutes: number | null };
          goals: { total: number | null; assists: number | null };
          shots: { total: number | null; on: number | null };
          passes: { total: number | null; key: number | null };
          tackles: { total: number | null };
          goals_conceded?: number | null;
          saves?: number | null;
        }>;
      }>;
      paging: { current: number; total: number };
    };

    try {
      data = await apiFetch(
        `/players?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&page=${page}`
      ) as typeof data;
    } catch (err) {
      console.error(`  Page ${page} failed:`, err);
      break;
    }

    const players = data.response ?? [];
    if (!players.length) break;

    for (const entry of players) {
      const stats = entry.statistics?.[0];
      if (!stats) continue;

      const apps = stats.games.appearences ?? 0;
      const mins = stats.games.minutes ?? 0;
      const per90 = (n: number | null) =>
        n !== null && mins > 0 ? Math.round((n / mins) * 90 * 100) / 100 : null;

      const stats_per90 = {
        shots_per90:          per90(stats.shots.total),
        shots_on_target_per90: per90(stats.shots.on),
        key_passes_per90:     per90(stats.passes.key),
        assists_per90:        per90(stats.goals.assists),
        tackles_per90:        per90(stats.tackles.total),
        passes_per90:         per90(stats.passes.total),
        saves_per90:          per90(stats.saves ?? null),
      };

      const { error } = await supabase
        .from("wc_players")
        .update({
          club:          stats.team.name,
          caps:          apps,
          international_goals:   stats.goals.total ?? 0,
          international_assists: stats.goals.assists ?? 0,
          stats_per90,
          updated_at:    new Date().toISOString(),
        })
        .eq("player_api_id", entry.player.id);

      if (error) console.error(`  Stats update for player ${entry.player.id}: ${error.message}`);
      else total++;
    }

    process.stdout.write(`  Page ${page}/${data.paging.total} — ${players.length} players\n`);

    if (page >= data.paging.total) break;
    page++;
    await sleep(200);
  }

  console.log(`  Stats updated for ${total} players`);
}

// ── Helpers ─────────────────────────────────────────────────

function mapPosition(pos: string): string {
  switch (pos?.toUpperCase()) {
    case "G":  return "GK";
    case "D":  return "DEF";
    case "M":  return "MID";
    case "F":  return "FWD";
    default:   return pos ?? "MID";
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log("=== Setpiece WC 2026 Data Collection ===");
  console.log(`League: ${WC_LEAGUE_ID} (FIFA World Cup), Season: ${WC_SEASON}`);

  try {
    const teamIds = await fetchAndSaveFixtures();
    await fetchAndSaveSquads(teamIds);
    await fetchAndSavePlayerStats();
    console.log("\nDone!");
  } catch (err) {
    console.error("\nFatal error:", err);
    process.exit(1);
  }
}

main();
