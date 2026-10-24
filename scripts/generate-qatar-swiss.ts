import { generateEarlyPicks } from "../src/lib/picks-generator";
import { storePicksInDB } from "../src/lib/supabase-picks";
import type { RealFixture } from "../src/lib/api-football";

const fixture: RealFixture = {
  fixtureId: 900008,
  id: "wc_900008",
  homeTeam: "Qatar",
  awayTeam: "Switzerland",
  competition: "World Cup 2026",
  kickoff: "2026-06-12T22:00:00+00:00",
  venue: "Levi's Stadium",
  status: "NS",
  leagueId: 1,
  isFinished: false,
  isLive: false,
};

async function run() {
  console.log("Generating picks for Qatar vs Switzerland...");
  const picks = await generateEarlyPicks([fixture]);
  if (!picks.length) {
    console.log("No picks generated");
    return;
  }
  await storePicksInDB(picks);
  picks.forEach(p => console.log(p.player.name, p.direction, p.line, p.statCategory, p.confidence + "%"));
  console.log("Done —", picks.length, "picks stored");
}

run().catch(console.error);
