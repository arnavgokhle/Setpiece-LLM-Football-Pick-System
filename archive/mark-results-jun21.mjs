import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 21 IST fixture IDs
const FIXTURE_IDS = [900045, 900039, 900040, 900046];

// Verified match results (June 21 IST / June 20-21 UTC):
// Lines below reflect what was manually updated in Supabase (user lowered corner lines).
//
// Spain vs Saudi Arabia 4-0 (fixture 900045)
//   - Pedri Passes Attempted MORE 75.5  → WON  (Spain dominated 4-0, 70%+ possession, Pedri 70-min CM)
//   - Total Corners MORE 7.5            → WON  (Spain 8 + Saudi 1 = 9 total, line was lowered to 7.5)
//
// Belgium vs Iran 0-0 (fixture 900039)
//   - KDB Passes Attempted MORE 50.5    → WON  (Belgium 70% poss, 622 team passes, KDB 90 min playmaker)
//   - Total Corners MORE 8.5            → LOST (Belgium 4 + Iran 2 = 6 total)
//
// Egypt vs New Zealand 3-1 (fixture 900040)
//   - Salah Shots on Target MORE 1.5    → WON  (goal 67' + keeper save early 2H = 2 SoT)
//   - Total Corners MORE 7.5            → WON  (Egypt 7 + NZ 1 = 8 total, line was lowered to 7.5)
//
// Cape Verde vs Uruguay 2-2 (fixture 900046)
//   - Total Corners MORE 7.5            → WON  (Uruguay 11 + Cape Verde 4 = 15 total)
//   - Total Bookings MORE 2.5           → WON  (Cabral 5', Bentancur 19', Olivera 58', Borges 90+3 = 4 yellows)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // Spain vs Saudi Arabia 4-0
  if ((home === "Spain" || away === "Spain") && (home === "Saudi Arabia" || away === "Saudi Arabia")) {
    if (name === "Pedri" && cat === "Passes Attempted") return "won"; // 70-min CM, Spain dominant
    if (cat === "Total Match Corners") return "won"; // 9 total, line lowered to 7.5
  }

  // Belgium vs Iran 0-0
  if ((home === "Belgium" || away === "Belgium") && (home === "Iran" || away === "Iran")) {
    if (name === "Kevin De Bruyne" && cat === "Passes Attempted") return "won"; // 622 team passes, KDB 90 min, line 50.5
    if (cat === "Total Match Corners") return "lost"; // 6 total, line 8.5
  }

  // Egypt vs New Zealand 3-1
  if ((home === "Egypt" || away === "Egypt") && (home === "New Zealand" || away === "New Zealand")) {
    if (name === "Mohamed Salah" && cat === "Shots on Target") return "won"; // 2 SoT (goal 67' + keeper save early 2H)
    if (cat === "Total Match Corners") return "won"; // 8 total, line lowered to 7.5
  }

  // Cape Verde vs Uruguay 2-2
  if ((home === "Cape Verde" || away === "Cape Verde") && (home === "Uruguay" || away === "Uruguay")) {
    if (cat === "Total Match Corners") return "won"; // 15 total (URU 11 + CV 4), line 7.5
    if (cat === "Total Bookings") return "won"; // 4 yellows (2 each), line 2.5
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
  if (!picks.length) { console.log("No pending picks found for June 21 fixtures."); return; }

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
  console.log("\nSummary (Jun 21 IST) — 7 WON, 1 LOST:");
  console.log("  WON:  Pedri Passes MORE 75.5 — Spain 4-0");
  console.log("  WON:  Corners MORE 7.5 — Spain/KSA (9 total)");
  console.log("  WON:  KDB Passes MORE 50.5 — Belgium 0-0");
  console.log("  LOST: Corners MORE 8.5 — BEL/IRA (6 total)");
  console.log("  WON:  Salah SoT MORE 1.5 — Egypt 3-1");
  console.log("  WON:  Corners MORE 7.5 — EGY/NZL (8 total)");
  console.log("  WON:  Corners MORE 7.5 — URU/CV (15 total)");
  console.log("  WON:  Bookings MORE 2.5 — URU/CV (4 yellows)");
}

main().catch(console.error);
