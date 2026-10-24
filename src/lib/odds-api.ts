// ============================================================
// SETPIECE — The Odds API Client
// Fetches real betting odds for football matches and player props
// Key: ODDS_API_KEY
// Docs: https://the-odds-api.com/lol-of-the-api/
// ============================================================

const ODDS_BASE = "https://api.the-odds-api.com/v4";

// Map our competition names → Odds API sport keys
const COMPETITION_TO_SPORT: Record<string, string> = {
  "Premier League":            "soccer_epl",
  "UEFA Champions League":     "soccer_uefa_champions_league",
  "UEFA Europa League":        "soccer_uefa_europa_league",
  "La Liga":                   "soccer_spain_la_liga",
  "Bundesliga":                "soccer_germany_bundesliga",
  "Serie A":                   "soccer_italy_serie_a",
  "Ligue 1":                   "soccer_france_ligue_one",
  "FIFA World Cup":            "soccer_fifa_world_cup",
  "World Cup":                 "soccer_fifa_world_cup",
};

// Map our stat categories → Odds API player prop market keys
const STAT_TO_MARKET: Record<string, string> = {
  "Goals":            "player_goal_scorer_anytime",
  "Shots on Target":  "player_shots_on_target",
  "Assists":          "player_assists",
  "Cards":            "player_cards",
};

export interface OddsEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
}

export interface PlayerPropOdds {
  playerName: string;
  market: string;
  line: number;
  overOdds: number;  // decimal odds for MORE/over
  underOdds: number; // decimal odds for LESS/under
}

export interface MatchOdds {
  homeOdds: number;
  awayOdds: number;
  drawOdds?: number;
}

// ── Fetch upcoming events for a given sport ────────────────
async function fetchEvents(sport: string): Promise<OddsEvent[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `${ODDS_BASE}/sports/${sport}/events?apiKey=${key}&dateFormat=iso`,
      { next: { revalidate: 3600 } } // Cache 1 hour
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data as { id: string; home_team: string; away_team: string; sport_key: string; commence_time: string }[]).map((e) => ({
      id: e.id,
      homeTeam: e.home_team,
      awayTeam: e.away_team,
      sport: e.sport_key,
      commenceTime: e.commence_time,
    }));
  } catch {
    return [];
  }
}

// ── Fuzzy match team names between APIs ───────────────────
function normTeam(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
    .replace("manchestercity", "mancity")
    .replace("manchesterunited", "manutd")
    .replace("parissaintgermain", "psg")
    .replace("parissaintger", "psg")
    .replace("borussiadortmund", "dortmund")
    .replace("atleticomadrid", "atletico")
    .replace("internazionale", "inter")
    .replace("acmilan", "milan");
}

function teamsMatch(a: string, b: string): boolean {
  const na = normTeam(a);
  const nb = normTeam(b);
  return na === nb || na.includes(nb) || nb.includes(na) ||
    na.startsWith(nb.slice(0, 5)) || nb.startsWith(na.slice(0, 5));
}

// ── Find the Odds API event matching our fixture ───────────
async function findEvent(
  homeTeam: string,
  awayTeam: string,
  competition: string
): Promise<OddsEvent | null> {
  const sport = COMPETITION_TO_SPORT[competition];
  if (!sport) return null;

  const events = await fetchEvents(sport);

  // Exact home/away match first
  const exact = events.find(
    (e) => teamsMatch(e.homeTeam, homeTeam) && teamsMatch(e.awayTeam, awayTeam)
  );
  if (exact) return exact;

  // Flexible: both teams present regardless of home/away position
  return events.find(
    (e) =>
      (teamsMatch(e.homeTeam, homeTeam) || teamsMatch(e.awayTeam, homeTeam)) &&
      (teamsMatch(e.homeTeam, awayTeam) || teamsMatch(e.awayTeam, awayTeam))
  ) ?? null;
}

// ── Fetch player prop odds for a specific event ────────────
async function fetchPlayerPropOdds(
  eventId: string,
  sport: string,
  market: string
): Promise<PlayerPropOdds[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `${ODDS_BASE}/sports/${sport}/events/${eventId}/odds?apiKey=${key}&markets=${market}&regions=eu&oddsFormat=decimal`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const results: PlayerPropOdds[] = [];

    for (const bookmaker of (data.bookmakers ?? [])) {
      for (const mkt of (bookmaker.markets ?? [])) {
        if (mkt.key !== market) continue;

        // Group by player+line key to handle multiple lines per player
        const byKey: Record<string, { over?: number; under?: number; point: number }> = {};

        for (const outcome of (mkt.outcomes ?? [])) {
          const playerName: string = outcome.description ?? outcome.name;

          if (market === "player_goal_scorer_anytime" && outcome.name === "Yes") {
            // Anytime scorer has no Over/Under — "Yes" price IS the over odds
            const k = `${playerName}|0.5`;
            if (!byKey[k]) byKey[k] = { point: 0.5 };
            byKey[k].over = outcome.price;
            // Synthetic under: implied prob of NOT scoring = 1 - (1/price); under = 1/(that prob)
            const impliedOver = 1 / outcome.price;
            byKey[k].under = parseFloat((1 / Math.max(0.01, 1 - impliedOver)).toFixed(2));

          } else if (outcome.name === "Over" && outcome.point !== undefined) {
            const k = `${playerName}|${outcome.point}`;
            if (!byKey[k]) byKey[k] = { point: outcome.point };
            byKey[k].over = outcome.price;

          } else if (outcome.name === "Under" && outcome.point !== undefined) {
            const k = `${playerName}|${outcome.point}`;
            if (!byKey[k]) byKey[k] = { point: outcome.point };
            byKey[k].under = outcome.price;
          }
        }

        for (const [k, odds] of Object.entries(byKey)) {
          const playerName = k.split("|")[0];
          if (odds.over) {
            results.push({
              playerName,
              market,
              line: odds.point,
              overOdds: odds.over,
              underOdds: odds.under ?? parseFloat((odds.over / (odds.over - 1)).toFixed(2)),
            });
          }
        }
        break; // First bookmaker only
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ── Fetch h2h match odds (fallback when no player props) ──
async function fetchMatchOdds(
  eventId: string,
  sport: string
): Promise<MatchOdds | null> {
  const key = process.env.ODDS_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `${ODDS_BASE}/sports/${sport}/events/${eventId}/odds?apiKey=${key}&markets=h2h&regions=eu&oddsFormat=decimal`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const bookie = data.bookmakers?.[0];
    if (!bookie) return null;

    const market = bookie.markets?.find((m: { key: string }) => m.key === "h2h");
    if (!market) return null;

    const outcomes: { name: string; price: number }[] = market.outcomes ?? [];
    const home = outcomes.find((o) => o.name === data.home_team)?.price;
    const away = outcomes.find((o) => o.name === data.away_team)?.price;
    const draw = outcomes.find((o) => o.name === "Draw")?.price;

    if (!home || !away) return null;
    return { homeOdds: home, awayOdds: away, drawOdds: draw };
  } catch {
    return null;
  }
}

// ── Main export: Get best odds for a pick ─────────────────
export interface PickOdds {
  odds: number;           // best decimal odds
  impliedProbability: number; // % e.g. 65
  edgeScore: number;      // aiConfidence - impliedProbability
}

export async function getOddsForPick(
  playerName: string,
  statCategory: string,
  direction: "MORE" | "LESS",
  homeTeam: string,
  awayTeam: string,
  competition: string,
  aiConfidence: number,
  line?: number
): Promise<PickOdds | null> {
  try {
    const event = await findEvent(homeTeam, awayTeam, competition);
    if (!event) return null;

    const market = STAT_TO_MARKET[statCategory];
    if (market) {
      const playerProps = await fetchPlayerPropOdds(event.id, event.sport, market);

      // Find props for this player, preferring an exact line match
      const nameMatch = (p: PlayerPropOdds) =>
        teamsMatch(p.playerName, playerName) ||
        playerName.toLowerCase().split(" ").some((part) =>
          p.playerName.toLowerCase().includes(part) && part.length > 3
        );

      const playerEntries = playerProps.filter(nameMatch);
      const prop = line !== undefined
        ? (playerEntries.find((p) => p.line === line) ?? playerEntries[0])
        : playerEntries[0];

      if (prop) {
        const odds = direction === "MORE" ? prop.overOdds : prop.underOdds;
        const implied = Math.round((1 / odds) * 100);
        return { odds, impliedProbability: implied, edgeScore: aiConfidence - implied };
      }
    }

    // Fallback: use match h2h odds
    const matchOdds = await fetchMatchOdds(event.id, event.sport);
    if (matchOdds) {
      // Use the team's win odds as a proxy for player value
      const isHomePlayer = teamsMatch(homeTeam, playerName) || true; // default home odds
      const odds = isHomePlayer ? matchOdds.homeOdds : matchOdds.awayOdds;
      const implied = Math.round((1 / odds) * 100);
      return { odds, impliedProbability: implied, edgeScore: aiConfidence - implied };
    }

    return null;
  } catch {
    return null;
  }
}
