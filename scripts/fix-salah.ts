// Remove Salah pick (based on bad DB data) and update Salah's real 2024-25 stats
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  // 1. Delete the Salah pick
  const { count } = await supabase.from("picks").delete({ count: "exact" })
    .eq("player_name", "Mohamed Salah").eq("result", "pending");
  console.log(`Deleted ${count} Salah pick(s).`);

  // 2. Update Salah's real 2024-25 stats (FBref: 28G 18A in 38 PL apps, 3289min)
  // shots/90: 3.85, SoT/90: 1.98, passes/90: 42.1 (unchanged), goals: 28, assists: 18
  const { error } = await supabase.from("player_club_stats")
    .update({
      shots_per90: 3.85,
      shots_on_target_per90: 1.98,
      goals: 28,
      assists: 18,
      matches_played: 38,
      minutes: 3289,
    })
    .eq("player_name", "Mohamed Salah")
    .eq("season", "2024-25");

  console.log(error ? `Stats update error: ${error.message}` : "Salah stats corrected: 3.85 shots/90, 1.98 SoT/90, 28G 18A in 38 apps.");
}
run().catch(console.error);
