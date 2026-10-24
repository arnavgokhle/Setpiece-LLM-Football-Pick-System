// Run: npx tsx --env-file=.env.local scripts/generate-wc-picks.ts
import { generateEarlyPicks } from "../src/lib/picks-generator";
import { storePicksInDB, picksExistForFixture } from "../src/lib/supabase-picks";
import { getOddsForPick } from "../src/lib/odds-api";
import type { Pick } from "../src/types";
import type { RealFixture } from "../src/lib/api-football";

const EXCLUDED_PLAYERS = new Set(["lamine yamal", "yamal"]);

const FIXTURES: RealFixture[] = [
  {
    fixtureId: 900061,
    id: "wc_900061",
    homeTeam: "Portugal",
    awayTeam: "DR Congo",
    competition: "World Cup 2026",
    kickoff: "2026-06-17T19:00:00+00:00",
    venue: "NRG Stadium",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
  {
    fixtureId: 900062,
    id: "wc_900062",
    homeTeam: "Uzbekistan",
    awayTeam: "Colombia",
    competition: "World Cup 2026",
    kickoff: "2026-06-17T22:00:00+00:00",
    venue: "Estadio Azteca",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
  {
    fixtureId: 900067,
    id: "wc_900067",
    homeTeam: "England",
    awayTeam: "Croatia",
    competition: "World Cup 2026",
    kickoff: "2026-06-18T01:00:00+00:00",
    venue: "AT&T Stadium",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
  {
    fixtureId: 900068,
    id: "wc_900068",
    homeTeam: "Ghana",
    awayTeam: "Panama",
    competition: "World Cup 2026",
    kickoff: "2026-06-18T04:00:00+00:00",
    venue: "BMO Field",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
];

async function enrichWithOdds(picks: Pick[]): Promise<Pick[]> {
  return Promise.all(
    picks.map(async (pick) => {
      try {
        const odds = await getOddsForPick(
          pick.player.name,
          pick.statCategory,
          pick.direction,
          pick.match.homeTeam,
          pick.match.awayTeam,
          pick.match.competition,
          pick.confidence,
          pick.line
        );
        if (odds) return { ...pick, ...odds };
      } catch { /* odds unavailable */ }
      return pick;
    })
  );
}

async function run() {
  // Filter to only fixtures without existing picks
  const toGenerate: RealFixture[] = [];
  for (const f of FIXTURES) {
    const exists = await picksExistForFixture(f.fixtureId);
    if (exists) {
      console.log(`[skip] ${f.homeTeam} vs ${f.awayTeam} — picks already exist`);
    } else {
      console.log(`[queue] ${f.homeTeam} vs ${f.awayTeam}`);
      toGenerate.push(f);
    }
  }

  if (!toGenerate.length) {
    console.log("All fixtures already have picks.");
    return;
  }

  console.log(`\nGenerating picks for ${toGenerate.length} fixtures (this takes a few minutes)...\n`);

  const rawPicks = await generateEarlyPicks(toGenerate);
  const picks = rawPicks.filter(p => !EXCLUDED_PLAYERS.has(p.player.name.toLowerCase()));

  if (!picks.length) {
    console.log("No picks generated — check Claude API key and player data.");
    return;
  }

  console.log(`\nEnriching ${picks.length} picks with odds...`);
  const enriched = await enrichWithOdds(picks);

  console.log(`\nStoring ${enriched.length} picks in Supabase...`);
  await storePicksInDB(enriched);

  console.log("\n✓ Done. Picks generated:");
  enriched.forEach(p =>
    console.log(` ${p.player.name} (${p.player.team}) — ${p.direction} ${p.line} ${p.statCategory} — ${p.confidence}% — ${p.match.homeTeam} vs ${p.match.awayTeam}`)
  );
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
