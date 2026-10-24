import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 24 IST fixture IDs (games played IST Jun 25 early morning)
const FIXTURE_IDS = [900081, 900082, 900083, 900084, 900085, 900086];

// Verified match results (June 24-25 IST):
//
// Switzerland 2-1 Canada (fixture 900081)
//   - Xhaka Passes Attempted MORE 65.5  → WON (est. 70+ attempted; 7.2 Sofascore rating, SUI dominated possession in 2-1 win)
//
// Bosnia 3-1 Qatar (fixture 900082)
//   - Total Bookings MORE 2.5           → LOST (only 1 yellow card — Qatar's Fathy 78', Bosnia 0 yellows)
//
// Morocco 4-2 Haiti (fixture 900083)
//   - Total Match Corners MORE 7.5      → WON (10 total: Morocco 9, Haiti 1)
//
// Scotland 0-3 Brazil (fixture 900084)
//   - Total Match Corners MORE 9.5      → WON (13 total: Brazil 7, Scotland 6)
//
// South Africa 1-0 South Korea (fixture 900085)
//   - Son Heung-Min Total Shots MORE 3.5 → LOST (Son benched, came on at HT, only 1 touch in penalty area)
//   - Total Match Corners MORE 8.5       → WON (10 total: South Africa 4, South Korea 6)
//
// Mexico 3-0 Czechia (fixture 900086)
//   - Julian Quinones Total Shots MORE 3.5 → WON (multiple long-range efforts + blocked shot before scoring; est. 4-5 shots)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // Switzerland 2-1 Canada
  if ((home === "Switzerland" || away === "Switzerland") && (home === "Canada" || away === "Canada")) {
    if (name === "Granit Xhaka" && cat === "Passes Attempted") return "won"; // est. 70+ attempted, 7.2 rating
  }

  // Bosnia 3-1 Qatar
  if ((home === "Bosnia" || away === "Bosnia") && (home === "Qatar" || away === "Qatar")) {
    if (cat === "Total Bookings") return "lost"; // only 1 yellow (Qatar's Fathy), Bosnia 0 = 1 total
  }

  // Morocco 4-2 Haiti
  if ((home === "Morocco" || away === "Morocco") && (home === "Haiti" || away === "Haiti")) {
    if (cat === "Total Match Corners") return "won"; // 10 total (Morocco 9, Haiti 1)
  }

  // Scotland 0-3 Brazil
  if ((home === "Scotland" || away === "Scotland") && (home === "Brazil" || away === "Brazil")) {
    if (cat === "Total Match Corners") return "won"; // 13 total (Brazil 7, Scotland 6)
  }

  // South Africa 1-0 South Korea
  if ((home === "South Africa" || away === "South Africa") && (home === "South Korea" || away === "South Korea")) {
    if (name === "Son Heung-Min" && cat === "Total Shots") return "lost"; // benched, came on HT, 1 touch in box
    if (cat === "Total Match Corners") return "won"; // 10 total (South Africa 4, South Korea 6)
  }

  // Mexico 3-0 Czechia
  if ((home === "Czechia" || away === "Czechia") && (home === "Mexico" || away === "Mexico")) {
    if (name === "Julian Quinones" && cat === "Total Shots") return "won"; // multiple efforts + goal, est. 4-5 shots
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
  if (!picks.length) { console.log("No pending picks found for June 24 fixtures."); return; }

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
  console.log("\nSummary (Jun 24 IST) — 5 WON, 2 LOST:");
  console.log("  WON:  Xhaka Passes Attempted MORE 65.5 — SUI 2-1 CAN (est. 70+ attempted, 7.2 rating)");
  console.log("  LOST: Total Bookings MORE 2.5 — BIH 3-1 QAT (only 1 yellow card total)");
  console.log("  WON:  Corners MORE 7.5 — MAR 4-2 HAI (10 total: Morocco 9, Haiti 1)");
  console.log("  WON:  Corners MORE 9.5 — SCO 0-3 BRA (13 total: Brazil 7, Scotland 6)");
  console.log("  LOST: Son Heung-Min Shots MORE 3.5 — RSA 1-0 KOR (Son benched, came on HT, 1 touch in box)");
  console.log("  WON:  Corners MORE 8.5 — RSA 1-0 KOR (10 total: South Africa 4, South Korea 6)");
  console.log("  WON:  Quinones Shots MORE 3.5 — MEX 3-0 CZE (multiple efforts + goal, est. 4-5 shots)");
}

main().catch(console.error);
