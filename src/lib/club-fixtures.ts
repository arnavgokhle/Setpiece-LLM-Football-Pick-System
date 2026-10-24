// ============================================================
// SETPIECE — Club fixture reader (2026-27)
//
// Replaces the API-Football fixture calls for the club season.
// Fixtures are ingested into club_fixtures by
// scripts/ingest-club-fixtures.ts and read from here, so the
// pipeline no longer depends on an API-Football subscription
// for scheduling.
// ============================================================

import { createServiceClient } from "./supabase/service";
import type { RealFixture } from "./api-football";

// club_fixtures.league_code → API-Football league id, so downstream
// code that branches on leagueId keeps working.
const LEAGUE_IDS: Record<string, number> = {
  epl: 39,
  "la-liga": 140,
  bundesliga: 78,
  "ligue-1": 61,
  ucl: 2,
};

interface ClubFixtureRow {
  fixture_key: string;
  league_code: string;
  league_name: string;
  api_league_id: number | null;
  kickoff_at: string;
  match_date: string;
  home_team: string;
  away_team: string;
  venue: string | null;
  status: string;
  is_priority: boolean;
  kickoff_confirmed: boolean;
}

const FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "P", "LIVE"]);

/**
 * Stable positive integer id derived from the fixture key.
 *
 * picks.fixture_id is an integer column and picksExistForFixture()
 * dedupes on it, so club fixtures need a deterministic numeric id.
 * Collisions across 1,372 rows are vanishingly unlikely at 2^31, and
 * a collision would only cause a duplicate-pick skip, never bad data.
 */
export function clubFixtureId(fixtureKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < fixtureKey.length; i++) {
    h ^= fixtureKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2_000_000_000;
}

function toRealFixture(r: ClubFixtureRow): RealFixture {
  return {
    fixtureId: clubFixtureId(r.fixture_key),
    id: `cf_${clubFixtureId(r.fixture_key)}`,
    homeTeam: r.home_team,
    awayTeam: r.away_team,
    competition: r.league_name,
    kickoff: r.kickoff_at,
    venue: r.venue ?? "Venue TBC",
    status: r.status,
    leagueId: r.api_league_id ?? LEAGUE_IDS[r.league_code] ?? 0,
    isFinished: FINISHED.has(r.status),
    isLive: LIVE.has(r.status),
  };
}

/**
 * Upcoming club fixtures within the next `daysAhead` days.
 *
 * Defaults to priority fixtures only (Premier League + marquee clubs),
 * which is the published coverage for this season.
 */
export async function getUpcomingClubFixtures(
  daysAhead = 7,
  opts: { priorityOnly?: boolean; confirmedKickoffOnly?: boolean } = {}
): Promise<{ fixtures: RealFixture[]; nextMatchDate: string | null }> {
  // Pick staging keys off kickoff time, so by default only surface fixtures
  // whose published time is trustworthy. Non-PL leagues publish date-only
  // placeholders and will return nothing here until reconciled.
  const { priorityOnly = true, confirmedKickoffOnly = true } = opts;

  try {
    const supabase = createServiceClient();
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 86400000);

    let query = supabase
      .from("club_fixtures")
      .select("*")
      .gte("kickoff_at", now.toISOString())
      .lte("kickoff_at", until.toISOString())
      .order("kickoff_at", { ascending: true });

    if (priorityOnly) query = query.eq("is_priority", true);
    if (confirmedKickoffOnly) query = query.eq("kickoff_confirmed", true);

    const { data, error } = await query;
    if (error) {
      console.error("[club-fixtures] query failed:", error.message);
      return { fixtures: [], nextMatchDate: null };
    }

    const fixtures = (data as ClubFixtureRow[]).map(toRealFixture).filter((f) => !f.isFinished);
    return {
      fixtures,
      nextMatchDate: fixtures.length ? fixtures[0].kickoff.split("T")[0] : null,
    };
  } catch (err) {
    console.error("[club-fixtures] getUpcomingClubFixtures failed:", err);
    return { fixtures: [], nextMatchDate: null };
  }
}

/** Distinct club names involved in a set of fixtures. */
export function clubsInFixtures(fixtures: RealFixture[]): string[] {
  return [...new Set(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))];
}
