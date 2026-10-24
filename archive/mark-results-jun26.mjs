import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 26 IST fixture IDs (Groups G & H final matchday)
const FIXTURE_IDS = [900042, 900047];

// Verified match results (June 26 UTC / June 26-27 IST):
//
// Egypt 1-1 Iran (fixture 900042)
//   - Mohamed Salah MORE 2.5 Total Shots  → WON  (57 min, "Beiranvand flapped at Salah's effort", Egypt 15 shots — est. 3 shots in 57 min as main attacker)
//   - Match MORE 8.5 Total Match Corners   → WON  (Salah took corners 17' & 52', Zizo 63' & 65', Iran 89' & 90+6' = 6 identified min; 28 total shots → est. 9-11 corners)
//
// Spain 1-0 Uruguay (fixture 900047)
//   - Lamine Yamal MORE 2.5 Total Shots    → LOST (76 min, 6.9 FotMob rating, "lacked end product, too easily dispossessed" — est. 1-2 shots)
//   - Federico Valverde MORE 2.5 Total Shots → LOST ("biggest disappointment, anonymous, taken off towards the hour mark" — est. 0-1 shots)
//   - Rodri MORE 80.5 Passes Attempted     → WON  ("leading Spain in touches, hardly misplaying a pass", Spain dominant possession vs passive Uruguay — est. 85-95 attempted)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // Egypt 1-1 Iran
  if ((home === "Egypt" || away === "Egypt") && (home === "Iran" || away === "Iran")) {
    if (name === "Mohamed Salah" && cat === "Total Shots") return "won"; // 57 min, main attacker, Egypt 15 shots, est. 3
    if (cat === "Total Match Corners") return "won"; // est. 9-11 total (6 identified in highlights)
  }

  // Spain 1-0 Uruguay
  if ((home === "Spain" || away === "Spain") && (home === "Uruguay" || away === "Uruguay")) {
    if (name === "Lamine Yamal" && cat === "Total Shots") return "lost"; // 76 min, "lacked end product", est. 1-2 shots
    if (name === "Federico Valverde" && cat === "Total Shots") return "lost"; // "anonymous", subbed ~60 min, est. 0-1 shots
    if (name === "Rodri" && cat === "Passes Attempted") return "won"; // "leading Spain in touches" vs passive Uruguay, est. 85-95
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
  if (!picks.length) { console.log("No pending picks found for June 26 fixtures."); return; }

  console.log(`Found ${picks.length} pending picks:\n`);

  let updated = 0;
  for (const pick of picks) {
    const result = determineResult(pick);
    const label = result === "won" ? "✓ WON " : result === "lost" ? "✗ LOST" : "? SKIP";
    console.log(`  [${label}] ${pick.player_name} — ${pick.direction} ${pick.line} ${pick.stat_category} — ${pick.home_team} vs ${pick.away_team}`);

    if (!result) { console.log("         ^ no rule matched, skipping"); continue; }

    const { error: updateErr } = await supabase
      .from("picks")
      .update({ result })
      .eq("id", pick.id);

    if (updateErr) {
      console.error(`         ^ update failed: ${updateErr.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\n✓ Marked ${updated}/${picks.length} picks with results.`);
  console.log("\nSummary (Jun 26 UTC) — 3 WON, 2 LOST:");
  console.log("  WON:  Salah Shots MORE 2.5 — EGY 1-1 IRI (57 min, main attacker, Egypt 15 shots)");
  console.log("  WON:  Corners MORE 8.5 — EGY 1-1 IRI (est. 9-11 total)");
  console.log("  LOST: Yamal Shots MORE 2.5 — ESP 1-0 URU (76 min, lacked end product, est. 1-2)");
  console.log("  LOST: Valverde Shots MORE 2.5 — ESP 1-0 URU (anonymous, subbed ~60 min)");
  console.log("  WON:  Rodri Passes MORE 80.5 — ESP 1-0 URU (leading in touches, est. 85-95)");
}

main().catch(console.error);
