import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: existing } = await supabase.from("wc_match_stats").select("*").eq("player_name", "Kevin De Bruyne").eq("match_date", "2026-06-15");
  console.log("Current row:", JSON.stringify(existing, null, 2));
  if (existing?.length) {
    // Revert passes_completed to the real completed count (14); attempted (37) has nowhere to live until migration runs
    await supabase.from("wc_match_stats").update({ passes_completed: 14 }).eq("id", existing[0].id);
    console.log("Reverted passes_completed back to 14. passes_attempted=37 will be stored once migration adds the column.");
  }
}
run().catch(console.error);
