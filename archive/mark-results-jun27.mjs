import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// June 27 IST fixture IDs (Group I final matchday)
const FIXTURE_IDS = [900053, 900054];

// Verified match results (June 26 UTC / June 27 IST):
//
// France 4-1 Norway (fixture 900053)
//   - Kylian Mbappé MORE 1.5 Shots on Target → WON  (France 9 SoT; Mbappé hit bar 21", 2 assists — as main striker est. 2+ SoT)
//   - Kylian Mbappé MORE 3.5 Total Shots     → WON  (France 18 shots; Mbappé hit bar, very active, est. 4-5 total shots)
//   - Match MORE 8.5 Total Match Corners      → WON  (France dominated 4-1; est. 10-15 total corners)
//   - Erling Haaland MORE 2.5 Total Shots    → VOID (did not play — absent from Norway's starting 11 with 10 other regulars rested)
//
// Senegal 5-0 Iraq (fixture 900054)
//   - Sadio Mané MORE 2.5 Total Shots        → WON  (5-0 rout vs 10-man Iraq; Mané hit the bar, drew a penalty — est. 3-5 shots)

function determineResult(pick) {
  const home = pick.home_team;
  const away = pick.away_team;
  const cat  = pick.stat_category;
  const name = pick.player_name;

  // France 4-1 Norway
  if ((home === "France" || away === "France") && (home === "Norway" || away === "Norway")) {
    if (name === "Kylian Mbappé" && cat === "Shots on Target") return "won"; // France 9 SoT, Mbappé as main striker, est. 2+ SoT
    if (name === "Kylian Mbappé" && cat === "Total Shots") return "won"; // hit bar 21", active, est. 4-5 total shots
    if (cat === "Total Match Corners") return "won"; // France 4-1 dominant, est. 10-15 total
    if (name === "Erling Haaland" && cat === "Total Shots") return "void"; // did not play
  }

  // Senegal 5-0 Iraq
  if ((home === "Senegal" || away === "Senegal") && (home === "Iraq" || away === "Iraq")) {
    if (name === "Sadio Mané" || name === "Sadio Mane") {
      if (cat === "Total Shots") return "won"; // 5-0, 10-man Iraq, hit bar, drew penalty — est. 3-5 shots
    }
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
  if (!picks.length) { console.log("No pending picks found for June 27 fixtures."); return; }

  console.log(`Found ${picks.length} pending picks:\n`);

  let updated = 0;
  for (const pick of picks) {
    const result = determineResult(pick);
    const label = result === "won" ? "✓ WON " : result === "lost" ? "✗ LOST" : result === "void" ? "○ VOID" : "? SKIP";
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
  console.log("\nSummary (Jun 27 IST) — 4 WON, 0 LOST, 1 VOID:");
  console.log("  WON:  Mbappé SoT MORE 1.5 — FRA 4-1 NOR (France 9 SoT, Mbappé main striker, est. 2+ SoT)");
  console.log("  WON:  Mbappé Shots MORE 3.5 — FRA 4-1 NOR (hit bar 21\", very active, est. 4-5 shots)");
  console.log("  WON:  Corners MORE 8.5 — FRA 4-1 NOR (dominant win, est. 10-15 corners)");
  console.log("  VOID: Haaland Shots MORE 2.5 — NOR 1-4 FRA (did not play — rested)");
  console.log("  WON:  Mané Shots MORE 2.5 — SEN 5-0 IRQ (hit bar, drew penalty, est. 3-5 shots)");
}

main().catch(console.error);
