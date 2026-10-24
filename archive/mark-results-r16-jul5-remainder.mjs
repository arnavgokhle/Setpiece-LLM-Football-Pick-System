import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// July 5-6 R16 day 2 — user-confirmed non-corners results:
//   Brazil 1-2 Norway (fixture 900303): Vinícius ≤2 shots → LOST; Bruno ≤84 passes attempted → LOST
//   Mexico 2-3 England (fixture 900304): Kane ≤2 shots → LOST; Kane ≤1 shot on target → LOST

const FIXTURE_IDS = [900303, 900304];

function determineResult(pick) {
  const teams = [pick.home_team, pick.away_team];

  if (teams.includes("Brazil") && teams.includes("Norway")) {
    if (pick.player_name.includes("Vinícius") && pick.stat_category === "Total Shots") return "lost";
    if (pick.player_name.includes("Bruno") && pick.stat_category === "Passes Attempted") return "lost";
  }

  if (teams.includes("Mexico") && teams.includes("England")) {
    if (pick.player_name.includes("Kane") && pick.stat_category === "Total Shots") return "lost";
    if (pick.player_name.includes("Kane") && pick.stat_category === "Shots on Target") return "lost";
  }

  return null;
}

async function main() {
  const { data: picks, error } = await supabase
    .from("picks")
    .select("id, home_team, away_team, player_name, stat_category, line, direction, result, fixture_id")
    .in("fixture_id", FIXTURE_IDS)
    .eq("result", "pending");

  if (error) { console.error("Query error:", error.message); return; }
  if (!picks.length) { console.log("No pending picks left for these fixtures."); return; }

  let lost = 0;
  for (const pick of picks) {
    const result = determineResult(pick);
    if (!result) { console.log(`  [? SKIP] ${pick.player_name} — ${pick.stat_category}`); continue; }
    const { error: e } = await supabase.from("picks").update({ result }).eq("id", pick.id);
    if (e) {
      console.error(`   update failed for ${pick.id}:`, e.message);
    } else {
      lost++;
      console.log(`  [✗ LOST] ${pick.direction} ${pick.line} ${pick.stat_category} — ${pick.player_name} — ${pick.home_team} vs ${pick.away_team}`);
    }
  }
  console.log(`\n✓ July 5 R16 remainder: ${lost}L settled.`);
}

main().catch(console.error);
