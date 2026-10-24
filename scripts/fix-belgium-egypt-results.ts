import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  // Corners: line was actually 8.5 (not 9.5), actual = 9 -> WON
  await supabase.from("picks")
    .update({ line: 8.5, result: "won" })
    .eq("id", "31e33bbb-ff2f-4da9-8ed9-a789cf12ba02");
  console.log("Updated Match Total Corners: line 9.5 -> 8.5, result -> won (actual 9)");

  // De Bruyne: actual passes attempted = 37 (corrected from 19), still well under 85.5 line -> lost (unchanged)
  await supabase.from("picks")
    .update({ result: "lost" })
    .eq("id", "40b09fea-8722-4a50-9671-29fff9b780be");
  console.log("Confirmed De Bruyne Passes Attempted: result -> lost (actual 37, line 85.5)");

  // Correct stored stat
  const { data: existing } = await supabase.from("wc_match_stats").select("id").eq("player_name", "Kevin De Bruyne").eq("match_date", "2026-06-15");
  if (existing?.length) {
    await supabase.from("wc_match_stats").update({ passes_completed: 37 }).eq("id", existing[0].id);
    console.log("Corrected De Bruyne wc_match_stats passes figure to 37");
  }
}
run().catch(console.error);
