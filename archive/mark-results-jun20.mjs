import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 20 fixture IDs
const FIXTURE_IDS = [900021, 900016, 900015, 900033];

// Results determined from actual match data:
// USA vs Australia: 11 corners total (7+4)       → Corners MORE 8.5  = WON
// Morocco vs Scotland: 2 yellows (Diop + Robertson) → Bookings MORE 2.5 = LOST
// Brazil vs Haiti: Raphinha subbed off 39' injury   → Shots MORE 3.5   = LOST
// Brazil vs Haiti: 8 corners total (4+4)            → Corners MORE 9.5  = LOST
// Paraguay vs Türkiye: 2 yellows (Galarza + Elmali, Almirón straight red) → Bookings MORE 2.5 = LOST

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // USA vs Australia — Corners MORE 8.5 → WON (11 total)
  if (home === "United States" && away === "Australia" && cat === "Total Match Corners") return "won";

  // Morocco vs Scotland — Bookings MORE 2.5 → LOST (2 yellows only)
  if ((home === "Morocco" || away === "Morocco") && cat === "Total Bookings") return "lost";

  // Brazil vs Haiti — Raphinha Total Shots MORE 3.5 → LOST (off injured 39')
  if ((home === "Brazil" || away === "Brazil") && name === "Raphinha" && cat === "Total Shots") return "lost";

  // Brazil vs Haiti — Corners MORE 9.5 → LOST (8 total)
  if ((home === "Brazil" || away === "Brazil") && cat === "Total Match Corners") return "lost";

  // Paraguay vs Türkiye — Bookings MORE 2.5 → LOST (2 yellows only)
  if ((home === "Paraguay" || away === "Paraguay") && cat === "Total Bookings") return "lost";

  return null; // unknown
}

async function main() {
  const { data: picks, error } = await supabase
    .from("picks")
    .select("id, home_team, away_team, player_name, stat_category, line, direction, confidence, result")
    .in("fixture_id", FIXTURE_IDS)
    .eq("result", "pending");

  if (error) { console.error("Query error:", error.message); return; }
  if (!picks.length) { console.log("No pending picks found for these fixtures."); return; }

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
}

main().catch(console.error);
