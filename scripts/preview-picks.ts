// Preview picks without storing — shows what new engine would generate
// Run: npx tsx --env-file=.env.local scripts/preview-picks.ts
import { generateEarlyPicks } from "../src/lib/picks-generator";
import type { RealFixture } from "../src/lib/api-football";

const FIXTURES: RealFixture[] = [
  {
    fixtureId: 900037,
    id: "wc_900037",
    homeTeam: "Belgium",
    awayTeam: "Egypt",
    competition: "World Cup 2026",
    kickoff: "2026-06-15T19:00:00+00:00",
    venue: "Lumen Field",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
  {
    fixtureId: 900043,
    id: "wc_900043",
    homeTeam: "Spain",
    awayTeam: "Cape Verde",
    competition: "World Cup 2026",
    kickoff: "2026-06-15T22:00:00+00:00",
    venue: "Mercedes-Benz Stadium",
    status: "NS",
    leagueId: 1,
    isFinished: false,
    isLive: false,
  },
];

async function run() {
  console.log("Generating preview picks (not stored)...\n");

  // Temporarily bypass the picksExistForFixture check by calling generateEarlyPicks directly
  // with a fake fixture ID offset so the exist-check finds nothing
  const fakeFixtures = FIXTURES.map(f => ({
    ...f,
    fixtureId: f.fixtureId + 99990000,
    id: `wc_${f.fixtureId + 99990000}`,
  }));

  const picks = await generateEarlyPicks(fakeFixtures);

  if (!picks.length) {
    console.log("No qualifying picks generated.");
    return;
  }

  console.log(`${picks.length} picks generated:\n`);
  for (const p of picks) {
    const match = `${p.match.homeTeam} vs ${p.match.awayTeam}`.replace(
      FIXTURES.find(f => f.fixtureId + 99990000 === parseInt(p.match.id.replace("wc_", "")))?.homeTeam ?? "",
      FIXTURES.find(f => f.fixtureId + 99990000 === parseInt(p.match.id.replace("wc_", "")))?.homeTeam ?? ""
    );
    console.log(`  ${p.player.name} (${p.player.team}) | ${p.direction} ${p.line} ${p.statCategory} | ${p.confidence}%`);
    console.log(`    ${p.shortReasoning}`);
    console.log();
  }
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
