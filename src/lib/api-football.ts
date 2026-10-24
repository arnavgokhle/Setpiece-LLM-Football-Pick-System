// ============================================================
// SETPIECE — API-Football Client (server-side only)
// Key: API_FOOTBALL_KEY (never exposed to browser)
// Docs: https://www.api-football.com/documentation-v3
// ============================================================

const API_BASE = "https://v3.football.api-sports.io";

// Team name → API-Football team ID (for squad lookups)
const TEAM_NAME_TO_ID: Record<string, number> = {
  // Premier League
  arsenal: 42, "aston villa": 66, brentford: 55, brighton: 51, bournemouth: 35,
  chelsea: 49, "crystal palace": 52, everton: 45, fulham: 43, ipswich: 57,
  leicester: 46, liverpool: 40, "manchester city": 50, "manchester united": 33,
  newcastle: 34, "nottingham forest": 65, southampton: 41, tottenham: 47,
  "west ham": 48, wolverhampton: 39, wolves: 39,
  // Champions League / European
  "real madrid": 541, barcelona: 529, "atletico madrid": 530,
  "bayern munich": 157, "borussia dortmund": 165, dortmund: 165,
  psg: 85, "paris saint-germain": 85, juventus: 496,
  "inter milan": 505, "ac milan": 489, napoli: 492,
  // Ligue 1
  "olympique marseille": 81, lyon: 80, monaco: 91, lille: 79,
  // Bundesliga
  "bayer leverkusen": 168, "rb leipzig": 173,
  // La Liga
  sevilla: 536, "real sociedad": 548, "athletic bilbao": 531, villarreal: 533,
};

export function getTeamId(teamName: string): number | null {
  return TEAM_NAME_TO_ID[teamName.toLowerCase()] ?? null;
}

export async function fetchTeamSquad(teamId: number, season = 2025): Promise<string[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`${API_BASE}/players/squads?team=${teamId}&season=${season}`, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: 3600 }, // cache 1h
    });
    if (!res.ok) return [];
    const data = await res.json();
    const players: { name: string }[] = data.response?.[0]?.players ?? [];
    return players.map((p) => p.name);
  } catch {
    return [];
  }
}

export async function fetchSquadsForFixtures(
  fixtures: { homeTeam: string; awayTeam: string }[]
): Promise<Map<string, string[]>> {
  const teamNames = [...new Set(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))];
  const squadMap = new Map<string, string[]>();
  await Promise.all(
    teamNames.map(async (name) => {
      const id = getTeamId(name);
      if (!id) return;
      const squad = await fetchTeamSquad(id);
      if (squad.length > 0) squadMap.set(name, squad);
    })
  );
  return squadMap;
}

// League IDs we display picks for
const FEATURED_LEAGUE_IDS = new Set([
  1,   // FIFA World Cup
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  39,  // Premier League
  61,  // Ligue 1
  78,  // Bundesliga
  135, // Serie A
  140, // La Liga
]);

// Match statuses considered "finished"
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "WO", "AWD", "ABD"]);
// Match statuses considered "live" (happening now)
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"]);

export interface RealFixture {
  fixtureId: number;
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string; // ISO 8601
  venue: string;
  status: string; // NS, 1H, HT, 2H, FT, etc.
  leagueId: number;
  isFinished: boolean;
  isLive: boolean;
}

interface ApiResponse {
  response: ApiFixtureRaw[];
  errors: Record<string, string>;
  results: number;
}

interface ApiFixtureRaw {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null; city: string | null };
    status: { short: string; long: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

function toRealFixture(f: ApiFixtureRaw): RealFixture {
  return {
    fixtureId: f.fixture.id,
    id: `af_${f.fixture.id}`,
    homeTeam: f.teams.home.name,
    awayTeam: f.teams.away.name,
    competition: f.league.name,
    kickoff: f.fixture.date,
    venue:
      [f.fixture.venue.name, f.fixture.venue.city].filter(Boolean).join(", ") ||
      "Venue TBC",
    status: f.fixture.status.short,
    leagueId: f.league.id,
    isFinished: FINISHED_STATUSES.has(f.fixture.status.short),
    isLive: LIVE_STATUSES.has(f.fixture.status.short),
  };
}

async function fetchFixturesByDate(date: string): Promise<RealFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${API_BASE}/fixtures?date=${date}`, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return [];

    const data: ApiResponse = await res.json();
    if (!Array.isArray(data.response)) return [];

    return data.response
      .filter((f) => FEATURED_LEAGUE_IDS.has(f.league.id))
      .map(toRealFixture)
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );
  } catch (err) {
    console.error("[API-Football] fetchFixturesByDate failed:", err);
    return [];
  }
}

// ── Today's fixtures ─────────────────────────────────────
export async function fetchTodayFixtures(): Promise<RealFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  return fetchFixturesByDate(today);
}

// ── Upcoming fixtures (today + daysAhead) ────────────────
// Fetches day-by-day to be compatible with the free API plan
// (the from/to range query requires a paid plan).
export async function fetchUpcomingFixtures(
  daysAhead = 7
): Promise<{ fixtures: RealFixture[]; nextMatchDate: string | null }> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return { fixtures: [], nextMatchDate: null };

  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }

  try {
    const perDay = await Promise.all(dates.map((date) => fetchFixturesByDate(date)));
    const all = perDay.flat();

    const fixtures = all
      .filter((f) => !f.isFinished)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

    const nextMatchDate = fixtures.length > 0 ? fixtures[0].kickoff.split("T")[0] : null;
    return { fixtures, nextMatchDate };
  } catch (err) {
    console.error("[API-Football] fetchUpcomingFixtures failed:", err);
    return { fixtures: [], nextMatchDate: null };
  }
}

// ── Fuzzy-match a pick's match to a real fixture ─────────
export function matchFixture(
  mockHome: string,
  mockAway: string,
  realFixtures: RealFixture[]
): RealFixture | null {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace("parissg", "psg")
      .replace("parissaintgermain", "psg")
      .replace("manchestercity", "mancity")
      .replace("manchesterunited", "manutd")
      .replace("bayernmunich", "bayernmunchen")
      .replace("borussiadortmund", "dortmund");

  const normHome = norm(mockHome);
  const normAway = norm(mockAway);

  for (const fix of realFixtures) {
    const fixHome = norm(fix.homeTeam);
    const fixAway = norm(fix.awayTeam);

    const homeMatch =
      fixHome.includes(normHome) ||
      normHome.includes(fixHome) ||
      fixHome.startsWith(normHome.slice(0, 4));
    const awayMatch =
      fixAway.includes(normAway) ||
      normAway.includes(fixAway) ||
      fixAway.startsWith(normAway.slice(0, 4));

    if (homeMatch && awayMatch) return fix;
  }
  return null;
}
