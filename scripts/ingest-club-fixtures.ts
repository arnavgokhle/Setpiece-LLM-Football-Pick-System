#!/usr/bin/env tsx
// ============================================================
// SETPIECE — Ingest 2026-27 club fixtures into Supabase
//
// Source: fixturedownload.com published season fixture lists
//   (free, no auth, full season released). API-Football is not
//   used here — the account is suspended and fixtures don't need it.
//
// UCL is NOT ingested: the league-phase draw is 27 Aug 2026, so
// those fixtures do not exist yet. Re-run with --ucl after the draw.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/ingest-club-fixtures.ts
//   npx tsx --env-file=.env.local scripts/ingest-club-fixtures.ts --dry-run
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SEASON = "2026-27";
const SOURCE_YEAR = "2026";
const DRY_RUN = process.argv.includes("--dry-run");

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!sbUrl || !sbKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(sbUrl, sbKey);

// ── Competitions ──────────────────────────────────────────
interface LeagueSpec {
  code: string;
  slug: string;        // fixturedownload slug
  name: string;
  apiLeagueId: number; // API-Football league id, for later reconciliation
}

const LEAGUES: LeagueSpec[] = [
  { code: "epl",        slug: "epl",        name: "Premier League", apiLeagueId: 39 },
  { code: "la-liga",    slug: "la-liga",    name: "La Liga",        apiLeagueId: 140 },
  { code: "bundesliga", slug: "bundesliga", name: "Bundesliga",     apiLeagueId: 78 },
  { code: "ligue-1",    slug: "ligue-1",    name: "Ligue 1",        apiLeagueId: 61 },
];

// Non-PL clubs we still want picks for. Every PL fixture is priority by
// default; a non-PL fixture is priority only if one of these is involved.
// Canonical (post-alias) names. Edit this list to widen coverage.
const MARQUEE_CLUBS = new Set([
  "Bayern Munich",
  "Barcelona",
  "Real Madrid",
  "Paris Saint-Germain",
]);

// ── Team name aliases → canonical (player_club_stats.club, FBref naming) ──
// Clubs promoted for 2026-27 have no top-flight stats history; they are
// mapped to a sensible canonical name and flagged by the coverage report.
const TEAM_ALIASES: Record<string, string> = {
  // Premier League
  "Man City": "Manchester City",
  "Man Utd": "Manchester Utd",
  "Newcastle": "Newcastle United",
  "Nott'm Forest": "Nottingham Forest",
  "Spurs": "Tottenham Hotspur",
  "Leeds": "Leeds United",
  "Coventry": "Coventry City",
  "Hull": "Hull City",
  "Ipswich": "Ipswich Town",

  // La Liga
  "Atlético de Madrid": "Atlético Madrid",
  "CA Osasuna": "Osasuna",
  "Celta": "Celta Vigo",
  "Deportivo Alavés": "Alavés",
  "Elche CF": "Elche",
  "FC Barcelona": "Barcelona",
  "Getafe CF": "Getafe",
  "Levante UD": "Levante",
  "RCD Espanyol de Barcelona": "Espanyol",
  "Sevilla FC": "Sevilla",
  "Valencia CF": "Valencia",
  "Villarreal CF": "Villarreal",
  "Málaga CF": "Málaga",
  "R. Racing Club": "Racing Santander",
  "RC Deportivo": "Deportivo La Coruña",

  // Bundesliga
  "1. FC Köln": "Köln",
  "1. FC Union Berlin": "Union Berlin",
  "1. FSV Mainz 05": "Mainz 05",
  "Bayer 04 Leverkusen": "Leverkusen",
  "Borussia Dortmund": "Dortmund",
  "Borussia Mönchengladbach": "Gladbach",
  "FC Augsburg": "Augsburg",
  "FC Bayern München": "Bayern Munich",
  "FC Schalke 04": "Schalke 04",
  "SC Paderborn 07": "Paderborn 07",
  "Sport-Club Freiburg": "Freiburg",
  "SV Elversberg": "Elversberg",
  "SV Werder Bremen": "Werder Bremen",
  "TSG Hoffenheim": "Hoffenheim",
  "VfB Stuttgart": "Stuttgart",

  // Ligue 1
  "AJ Auxerre": "Auxerre",
  "Angers SCO": "Angers",
  "AS Monaco": "Monaco",
  "Estac Troyes": "Troyes",
  "FC Lorient": "Lorient",
  "Havre Athletic Club": "Le Havre",
  "Le Mans FC": "Le Mans",
  "LOSC Lille": "Lille",
  "OGC Nice": "Nice",
  "Olympique de Marseille": "Marseille",
  "Olympique Lyonnais": "Lyon",
  "RC Lens": "Lens",
  "RC Strasbourg Alsace": "Strasbourg",
  "Stade Brestois 29": "Brest",
  "Stade Rennais FC": "Rennes",
  "Toulouse FC": "Toulouse",
};

function canonicalTeam(raw: string): string {
  const name = raw.trim();
  return TEAM_ALIASES[name] ?? name;
}

// ── Fetch a league's fixture table ────────────────────────
//
// Deliberately NOT using the /download/csv route. Two reasons:
//   1. Its timezone suffix is not honoured consistently — the La Liga
//      export came back 9h adrift of the site's own rendering.
//   2. The results page accepts a POST that pins the timezone, so we
//      can force UTC and know exactly what we are reading.
//
// Returns rows of [Round, Date, Location, Home, Away, Result] as
// rendered in UTC.
async function fetchLeagueRows(slug: string): Promise<string[][]> {
  const res = await fetch(`https://fixturedownload.com/results/${slug}-${SOURCE_YEAR}`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (setpiece-ingest)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "timezone=UTC",
  });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const htmlText = await res.text();

  // Confirm the server actually applied the UTC selection.
  const selected = htmlText.match(/<option[^>]*selected[^>]*>([^<]*)<\/option>/)?.[1] ?? "";
  if (!/Coordinated Universal/i.test(selected)) {
    throw new Error(`${slug}: timezone not pinned to UTC (got "${selected.trim()}")`);
  }

  const decode = (s: string) =>
    s.replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
      .replace(/&nbsp;/g, " ")
      .trim();

  return [...htmlText.matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((m) => [...m[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/g)].map((c) => decode(c[0])))
    .filter((cells) => cells.length >= 6 && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(cells[1]));
}

// ── "DD/MM/YYYY HH:mm" already in UTC → Date ──────────────
function parseUtc(dmyHm: string): Date {
  const m = dmyHm.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Unrecognised date format: "${dmyHm}"`);
  const [, dd, mm, yyyy, hh, min] = m;
  return new Date(Date.UTC(+yyyy, +mm - 1, +dd, +hh, +min));
}

// Canary: a fixture whose real kickoff is independently known.
// Arsenal v Coventry, 21 Aug 2026, 20:00 BST == 19:00 UTC.
// If the upstream timezone handling ever shifts, this fails loudly
// instead of quietly poisoning every kickoff in the table.
const CANARY = {
  league: "epl",
  home: "Arsenal",
  away: "Coventry",
  expectedUtc: "2026-08-21T19:00:00.000Z",
};

interface FixtureRow {
  fixture_key: string;
  league_code: string;
  league_name: string;
  api_league_id: number;
  season: string;
  round: number | null;
  match_number: number | null;
  kickoff_at: string;
  match_date: string;
  home_team: string;
  away_team: string;
  home_team_raw: string;
  away_team_raw: string;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  is_priority: boolean;
  kickoff_confirmed: boolean;
}

// Rendered table columns: Round | Date | Location | Home | Away | Result
function buildRows(league: LeagueSpec, rows: string[][]): FixtureRow[] {
  return rows.map((r, i) => {
    const [roundRaw, dateRaw, venueRaw, homeRaw, awayRaw, resultRaw] = r;
    const home = canonicalTeam(homeRaw);
    const away = canonicalTeam(awayRaw);
    const kickoff = parseUtc(dateRaw);

    // Blank or "-" until played; "2 - 1" once finished.
    const scoreMatch = (resultRaw ?? "").trim().match(/^(\d+)\s*-\s*(\d+)$/);

    return {
      // Round + teams is stable across re-runs; the source's own match
      // numbers are not exposed in the rendered table.
      fixture_key: `${league.code}-${SEASON}-${roundRaw || "x"}-${homeRaw}-${awayRaw}`
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      league_code: league.code,
      league_name: league.name,
      api_league_id: league.apiLeagueId,
      season: SEASON,
      round: roundRaw && /^\d+$/.test(roundRaw) ? parseInt(roundRaw, 10) : null,
      match_number: i + 1,
      kickoff_at: kickoff.toISOString(),
      match_date: kickoff.toISOString().slice(0, 10),
      home_team: home,
      away_team: away,
      home_team_raw: homeRaw,
      away_team_raw: awayRaw,
      venue: venueRaw || null,
      home_score: scoreMatch ? +scoreMatch[1] : null,
      away_score: scoreMatch ? +scoreMatch[2] : null,
      status: scoreMatch ? "FT" : "NS",
      is_priority:
        league.code === "epl" ||
        MARQUEE_CLUBS.has(home) ||
        MARQUEE_CLUBS.has(away),
      // Only the Premier League table carries trustworthy kickoff times
      // (verified against the official PL fixture release). The other
      // three leagues publish date-only placeholders for most of the
      // season, and La Liga's opening-weekend times disagree with the
      // official announcement — so those are dates, not times, until
      // reconciled against a live fixture API.
      kickoff_confirmed: league.code === "epl",
    };
  });
}

// ── Coverage check: which fixture teams have no stats rows? ──
async function reportStatsCoverage(rows: FixtureRow[]): Promise<void> {
  // PostgREST caps a response at 1000 rows regardless of .limit(),
  // so page through explicitly or the coverage report lies.
  const known = new Set<string>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("player_club_stats")
      .select("club")
      .range(from, from + PAGE - 1);
    if (error) {
      console.log(`\n  (coverage check skipped: ${error.message})`);
      return;
    }
    for (const d of data ?? []) if (d.club) known.add(d.club as string);
    if (!data || data.length < PAGE) break;
  }
  const fixtureTeams = new Set(rows.flatMap((r) => [r.home_team, r.away_team]));
  const missing = [...fixtureTeams].filter((t) => !known.has(t)).sort();

  console.log(`\n── Stats coverage ─────────────────────────────`);
  console.log(`  ${fixtureTeams.size - missing.length}/${fixtureTeams.size} fixture teams have player_club_stats rows`);
  if (missing.length) {
    console.log(`  No 2025-26 stats (promoted / renamed) — picks must be suppressed for these:`);
    for (const t of missing) console.log(`    · ${t}`);
  }
}

// ── Main ──────────────────────────────────────────────────
async function main(): Promise<void> {
  const { error: tableErr } = await supabase.from("club_fixtures").select("id").limit(1);
  if (tableErr && !DRY_RUN) {
    console.error(
      `\n⚠  club_fixtures is not accessible: ${tableErr.message}` +
      `\n   Run supabase/club-fixtures-schema.sql in the Supabase SQL Editor first.\n`
    );
    process.exit(1);
  }

  const all: FixtureRow[] = [];

  for (const league of LEAGUES) {
    process.stdout.write(`  ${league.name.padEnd(16)} `);
    try {
      const rows = buildRows(league, await fetchLeagueRows(league.slug));
      if (!rows.length) throw new Error("no fixture rows parsed");

      if (league.code === CANARY.league) {
        const c = rows.find((r) => r.home_team_raw === CANARY.home && r.away_team_raw === CANARY.away);
        if (!c) throw new Error(`canary fixture ${CANARY.home} v ${CANARY.away} not found`);
        if (c.kickoff_at !== CANARY.expectedUtc) {
          throw new Error(
            `canary kickoff mismatch — expected ${CANARY.expectedUtc}, got ${c.kickoff_at}. ` +
            `Upstream timezone handling changed; do not trust these times.`
          );
        }
      }

      all.push(...rows);
      const first = rows.reduce((a, b) => (a.kickoff_at < b.kickoff_at ? a : b));
      console.log(
        `${String(rows.length).padStart(3)} fixtures  ` +
        `· first ${first.kickoff_at.slice(0, 16).replace("T", " ")}Z ` +
        `${first.home_team} v ${first.away_team}` +
        `${league.code === CANARY.league ? "  [canary ok]" : "  [times unconfirmed]"}`
      );
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }

  if (!all.length) {
    console.error("\nNo fixtures parsed. Aborting.");
    process.exit(1);
  }

  const priority = all.filter((r) => r.is_priority);
  console.log(`\n  Total ${all.length} fixtures · ${priority.length} flagged priority (PL + marquee)`);

  await reportStatsCoverage(all);

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written.\n");
    return;
  }

  console.log(`\n── Upserting ──────────────────────────────────`);
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < all.length; i += CHUNK) {
    const chunk = all.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("club_fixtures")
      .upsert(chunk, { onConflict: "fixture_key" });
    if (error) {
      console.error(`  chunk ${i / CHUNK + 1} failed: ${error.message}`);
      process.exit(1);
    }
    written += chunk.length;
    process.stdout.write(`\r  ${written}/${all.length}`);
  }
  console.log(`\n  Done — ${written} fixtures in club_fixtures.\n`);
  console.log("  UCL not included: league-phase draw is 27 Aug 2026.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
