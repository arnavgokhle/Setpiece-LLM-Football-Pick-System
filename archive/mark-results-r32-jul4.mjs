import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Round of 32 results (verified):
//
// Brazil 2-1 Japan (fixture 900201, Jun 29)
//   - Vinícius Júnior MORE 3.5 Total Shots → LOST (3 shots, 2 on target — RotoWire/CBS match data)
//   - Match MORE 9.5 Total Match Corners  → LEFT PENDING (official corner count not published
//     in any accessible source; HT was 2-2 corners, Brazil finished with 19 shots. Too close to call.)
//
// South Africa 0-1 Canada (fixture 900203, Jun 28)
//   - Jonathan David MORE 2.5 Total Shots → LOST (2 shots: 17' and 78', both off target — ESPN shot map)
//   - Match MORE 7.5 Total Match Corners  → LEFT PENDING (corner count not published; Canada
//     12 shots vs SA 6, but SA held 58% possession — genuinely uncertain either side of 7.5.)

const FIXTURE_IDS = [900201, 900203];

function determineResult(pick) {
  const teams = [pick.home_team, pick.away_team];

  // Brazil 2-1 Japan
  if (teams.includes("Brazil") && teams.includes("Japan")) {
    if (pick.player_name.startsWith("Vin") && pick.stat_category === "Total Shots") return "lost"; // 3 shots < 3.5
    if (pick.stat_category === "Total Match Corners") return null; // unverifiable — keep pending
  }

  // South Africa 0-1 Canada
  if (teams.includes("South Africa") && teams.includes("Canada")) {
    if (pick.player_name === "Jonathan David" && pick.stat_category === "Total Shots") return "lost"; // 2 shots < 2.5
    if (pick.stat_category === "Total Match Corners") return null; // unverifiable — keep pending
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
  if (!picks.length) { console.log("No pending picks for R32 fixtures."); return; }

  let updated = 0;
  for (const pick of picks) {
    const result = determineResult(pick);
    const label = result === "won" ? "✓ WON " : result === "lost" ? "✗ LOST" : "… PENDING (corner count unavailable)";
    console.log(`  [${label}] ${pick.player_name} — ${pick.direction} ${pick.line} ${pick.stat_category} — ${pick.home_team} vs ${pick.away_team}`);
    if (!result) continue;
    const { error: e } = await supabase.from("picks").update({ result }).eq("id", pick.id);
    if (e) console.error("   update failed:", e.message);
    else updated++;
  }
  console.log(`\n✓ Marked ${updated} picks. Corners picks stay pending until official counts surface (check FBref match reports in a day or two).`);
}

main().catch(console.error);
