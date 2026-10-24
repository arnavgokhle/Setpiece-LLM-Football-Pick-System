// Clears old picks for tonight's fixtures and regenerates with new engine.
// Run: npx tsx --env-file=.env.local scripts/regenerate-tonight.ts
import { createClient } from "@supabase/supabase-js";
import { generateEarlyPicks } from "../src/lib/picks-generator";
import { storePicksInDB } from "../src/lib/supabase-picks";
import type { RealFixture } from "../src/lib/api-football";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FIXTURE_IDS = [900037, 900043];

// Players confirmed not playing tonight — will be excluded before generation
const EXCLUDED_PLAYERS = new Set([
  "lamine yamal",
  "yamal",
]);

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
  // 1. Delete old pending picks for these fixtures
  console.log(`Deleting old picks for fixture IDs: ${FIXTURE_IDS.join(", ")}...`);
  const { error, count } = await supabase
    .from("picks")
    .delete({ count: "exact" })
    .in("fixture_id", FIXTURE_IDS)
    .eq("result", "pending");

  if (error) {
    console.error("Delete failed:", error.message);
    process.exit(1);
  }
  console.log(`Deleted ${count ?? 0} old picks.\n`);

  // 2. Generate new picks
  console.log("Generating new picks with updated engine...\n");
  let picks = await generateEarlyPicks(FIXTURES);

  // 3. Filter out excluded players
  const before = picks.length;
  picks = picks.filter(p => !EXCLUDED_PLAYERS.has(p.player.name.toLowerCase()));
  if (before !== picks.length) {
    console.log(`Excluded ${before - picks.length} pick(s) for injured/resting players.`);
  }

  if (!picks.length) {
    console.log("No qualifying picks after exclusions.");
    return;
  }

  // 4. Store
  await storePicksInDB(picks);
  console.log(`\nStored ${picks.length} picks:\n`);
  for (const p of picks) {
    console.log(`  ${p.player.name} (${p.player.team}) | ${p.direction} ${p.line} ${p.statCategory} | ${p.confidence}%`);
    console.log(`  ${p.shortReasoning}`);
    console.log();
  }
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
