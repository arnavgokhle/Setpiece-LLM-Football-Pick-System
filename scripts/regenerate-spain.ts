import { createClient } from "@supabase/supabase-js";
import { generateEarlyPicks } from "../src/lib/picks-generator";
import { storePicksInDB } from "../src/lib/supabase-picks";
import type { RealFixture } from "../src/lib/api-football";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EXCLUDED_PLAYERS = new Set(["lamine yamal", "yamal"]);

const SPAIN_FIXTURE: RealFixture = {
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
};

async function run() {
  // Delete all Spain picks for this fixture (including void ones)
  const { count } = await supabase.from("picks").delete({ count: "exact" }).eq("fixture_id", 900043);
  console.log(`Deleted ${count} existing Spain picks (including voided).\n`);

  console.log("Generating Spain vs Cape Verde picks (Yamal excluded)...\n");
  let picks = await generateEarlyPicks([SPAIN_FIXTURE]);

  picks = picks.filter(p => !EXCLUDED_PLAYERS.has(p.player.name.toLowerCase()));
  console.log(`${picks.length} picks after Yamal exclusion.\n`);

  if (!picks.length) {
    console.log("No qualifying picks.");
    return;
  }

  await storePicksInDB(picks);
  console.log("Stored picks:\n");
  for (const p of picks) {
    console.log(`  ${p.player.name} (${p.player.team}) | ${p.direction} ${p.line} ${p.statCategory} | ${p.confidence}%`);
    console.log(`  ${p.shortReasoning}\n`);
  }
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
