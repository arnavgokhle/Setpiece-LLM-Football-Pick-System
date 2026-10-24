import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// July 5-6 R16 day 2 — user-confirmed final corner counts:
//   Mexico 2-3 England (fixture 900304): 14 total corners → MORE 8.5 Total Match Corners WON
//   Brazil 1-2 Norway (fixture 900303): 10 total corners → MORE 8.5 Total Match Corners WON
//
// Other pending picks for these fixtures (Vinicius shots, Bruno passes, Kane shots/SOT)
// are left untouched — only corners picks are being settled in this pass.

const FIXTURE_IDS = [900303, 900304];

async function main() {
  const { data: picks, error } = await supabase
    .from("picks")
    .select("id, home_team, away_team, player_name, stat_category, line, direction, result, fixture_id")
    .in("fixture_id", FIXTURE_IDS)
    .eq("stat_category", "Total Match Corners")
    .eq("result", "pending");

  if (error) { console.error("Query error:", error.message); return; }
  if (!picks.length) { console.log("No pending corners picks for these fixtures."); return; }

  let won = 0;
  for (const pick of picks) {
    const { error: e } = await supabase.from("picks").update({ result: "won" }).eq("id", pick.id);
    if (e) {
      console.error(`   update failed for ${pick.id}:`, e.message);
    } else {
      won++;
      console.log(`  [✓ WON] ${pick.direction} ${pick.line} ${pick.stat_category} — ${pick.home_team} vs ${pick.away_team}`);
    }
  }
  console.log(`\n✓ July 5 R16 corners: ${won}W settled.`);
}

main().catch(console.error);
