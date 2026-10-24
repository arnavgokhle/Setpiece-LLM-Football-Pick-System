import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 23 IST fixture IDs
const FIXTURE_IDS = [900063, 900069, 900070, 900064];

// Verified match results (June 23-24 IST):
//
// Portugal vs Uzbekistan 5-0 (fixture 900063)
//   - Ronaldo Total Shots MORE 1.5    → WON  (scored brace, 4+ shots total)
//   - Total Corners MORE 7.5          → LOST (5 corners total)
//
// England vs Ghana 0-0 (fixture 900069)
//   - Kane Total Shots MORE 3.5       → WON  (4 shots: deflected, saved, fired over, 1 more)
//   - Total Corners MORE 7.5          → WON  (England 9, Ghana 2 = 11 total)
//
// Croatia vs Panama 1-0 (fixture 900070)
//   - Modrić Passes Attempted MORE 50.5 → WON (78 attempted, 69 completed — 200th cap)
//   - Total Corners MORE 8.5          → WON  (9 corners total)
//
// DR Congo vs Colombia 0-1 (fixture 900064)
//   - Total Corners MORE 8.5          → WON  (9 corners total)
//   - Total Bookings MORE 2.5         → WON  (3 yellow cards — Lucumi + 2 others)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // Portugal vs Uzbekistan 5-0
  if ((home === "Portugal" || away === "Portugal") && (home === "Uzbekistan" || away === "Uzbekistan")) {
    if (name === "Cristiano Ronaldo" && cat === "Total Shots") return "won";
    if (cat === "Total Match Corners") return "lost"; // only 5 corners total
  }

  // England vs Ghana 0-0
  if ((home === "England" || away === "England") && (home === "Ghana" || away === "Ghana")) {
    if (name === "Harry Kane" && cat === "Total Shots") return "won"; // 4 shots
    if (cat === "Total Match Corners") return "won"; // 11 total (ENG 9, GHA 2)
  }

  // Croatia vs Panama 1-0
  if ((home === "Croatia" || away === "Croatia") && (home === "Panama" || away === "Panama")) {
    if (name === "Luka Modrić" && cat === "Passes Attempted") return "won"; // 78 attempted
    if (cat === "Total Match Corners") return "won"; // 9 total
  }

  // DR Congo vs Colombia 0-1
  if ((home === "DR Congo" || away === "DR Congo") && (home === "Colombia" || away === "Colombia")) {
    if (cat === "Total Match Corners") return "won"; // 9 total
    if (cat === "Total Bookings") return "won"; // 3 yellow cards
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
  if (!picks.length) { console.log("No pending picks found for June 23 fixtures."); return; }

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
  console.log("\nSummary (Jun 23 IST) — 7 WON, 1 LOST:");
  console.log("  WON:  Ronaldo Total Shots MORE 1.5 — POR 5-0 UZB (brace)");
  console.log("  LOST: Corners MORE 7.5 — POR/UZB (5 total)");
  console.log("  WON:  Kane Total Shots MORE 3.5 — ENG 0-0 GHA (4 shots)");
  console.log("  WON:  Corners MORE 7.5 — ENG/GHA (11 total)");
  console.log("  WON:  Modrić Passes MORE 50.5 — CRO 1-0 PAN (78 attempted)");
  console.log("  WON:  Corners MORE 8.5 — CRO/PAN (9 total)");
  console.log("  WON:  Corners MORE 8.5 — COL/COD (9 total)");
  console.log("  WON:  Bookings MORE 2.5 — COL/COD (3 yellow cards)");
}

main().catch(console.error);
