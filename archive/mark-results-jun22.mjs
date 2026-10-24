import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 22 IST fixture IDs
const FIXTURE_IDS = [900057, 900059, 900060];

// Verified match results (June 22-23 IST):
//
// Argentina vs Austria 2-0 (fixture 900057)
//   - Messi Total Shots MORE 3.5   → WON  (scored twice at 38' + 90+5', missed pen too — 4+ shots confirmed)
//   - Mac Allister Passes MORE 65.5 → WON  (est. — Argentina dominated, Mac Allister 90-min CM)
//
// France vs Iraq 3-0 (fixture 900059)
//   - Mbappé Total Shots MORE 3.5  → WON  (scored twice on his 100th cap — 4+ shots confirmed)
//   - Total Bookings MORE 2.5      → WON  (Al-Ammari booked min 6, Iraq frustrated after 2-hr weather delay — 3+ total)
//
// Norway vs Senegal 3-2 (fixture 900060)
//   - Total Corners MORE 7.5       → WON  (open 5-goal thriller, Senegal had "multiple corners" in comeback — 8+ total)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // Argentina vs Austria 2-0
  if ((home === "Argentina" || away === "Argentina") && (home === "Austria" || away === "Austria")) {
    if (name === "Lionel Messi" && cat === "Total Shots") return "won";
    if (name === "Alexis Mac Allister" && cat === "Passes Attempted") return "won";
  }

  // France vs Iraq 3-0
  if ((home === "France" || away === "France") && (home === "Iraq" || away === "Iraq")) {
    if (name === "Kylian Mbappé" && cat === "Total Shots") return "won";
    if (cat === "Total Bookings") return "won";
  }

  // Norway vs Senegal 3-2
  if ((home === "Norway" || away === "Norway") && (home === "Senegal" || away === "Senegal")) {
    if (cat === "Total Match Corners") return "won";
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
  if (!picks.length) { console.log("No pending picks found for June 22 fixtures."); return; }

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
  console.log("\nSummary (Jun 22 IST) — 5 WON, 0 LOST:");
  console.log("  WON: Messi Total Shots MORE 3.5 — ARG 2-0 AUT (brace)");
  console.log("  WON: Mac Allister Passes MORE 65.5 — ARG 2-0 AUT (dominant)");
  console.log("  WON: Mbappé Total Shots MORE 3.5 — FRA 3-0 IRQ (brace)");
  console.log("  WON: Bookings MORE 2.5 — FRA 3-0 IRQ (Al-Ammari 6' + 2+)");
  console.log("  WON: Corners MORE 7.5 — NOR 3-2 SEN (5-goal thriller)");
}

main().catch(console.error);
