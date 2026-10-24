import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// July 4 Round of 16 — user-confirmed settlement numbers:
//
// Paraguay 0-1 France (fixture 900302): 14 total corners; Mbappé 5 shots, 4 on target.
//   - Mbappé MORE 3.5 Total Shots      → WON  (5 > 3.5)
//   - Mbappé MORE 1.5 Shots on Target  → WON  (4 > 1.5)
//   - Match MORE 8.5 Total Match Corners → WON (14 > 8.5)
//
// Canada 0-3 Morocco (fixture 900301): 13 total corners; El Aynaoui only 55 passes.
//   - Match MORE 7.5 Total Match Corners → WON (13 > 7.5)
//   - El Aynaoui MORE 79.5 Passes Attempted → LOST (55 < 79.5 — Morocco ceded possession and
//     won on 5 shots; the possession profile from the Netherlands game did not repeat)

const FIXTURE_IDS = [900301, 900302];

function determineResult(pick) {
  const teams = [pick.home_team, pick.away_team];

  if (teams.includes("Paraguay") && teams.includes("France")) {
    if (pick.player_name.startsWith("Kylian") && pick.stat_category === "Total Shots") return "won";
    if (pick.player_name.startsWith("Kylian") && pick.stat_category === "Shots on Target") return "won";
    if (pick.stat_category === "Total Match Corners") return "won"; // 14
  }

  if (teams.includes("Canada") && teams.includes("Morocco")) {
    if (pick.stat_category === "Total Match Corners") return "won"; // 13
    if (pick.player_name.includes("Aynaoui") && pick.stat_category === "Passes Attempted") return "lost"; // 55
  }

  return null;
}

async function main() {
  const { data: picks, error } = await supabase
    .from("picks")
    .select("id, home_team, away_team, player_name, stat_category, line, direction, confidence, result")
    .in("fixture_id", FIXTURE_IDS)
    .eq("result", "pending");

  if (error) { console.error("Query error:", error.message); return; }
  if (!picks.length) { console.log("No pending picks for July 4 fixtures."); return; }

  let won = 0, lost = 0;
  for (const pick of picks) {
    const result = determineResult(pick);
    const label = result === "won" ? "✓ WON " : result === "lost" ? "✗ LOST" : "? SKIP";
    console.log(`  [${label}] ${pick.player_name} — ${pick.direction} ${pick.line} ${pick.stat_category} — ${pick.home_team} vs ${pick.away_team}`);
    if (!result) continue;
    const { error: e } = await supabase.from("picks").update({ result }).eq("id", pick.id);
    if (e) console.error("   update failed:", e.message);
    else result === "won" ? won++ : lost++;
  }
  console.log(`\n✓ July 4 R16: ${won}W / ${lost}L`);
}

main().catch(console.error);
