import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabase.from("picks")
    .select("id,player_name,stat_category,line,direction,fixture_id,home_team,away_team,result,created_at")
    .eq("fixture_id", 900043);
  console.log(JSON.stringify(data, null, 2));

  // Also check fixture_id=0 picks
  const { data: d2 } = await supabase.from("picks")
    .select("id,player_name,stat_category,line,direction,fixture_id,home_team,away_team,result,created_at")
    .eq("fixture_id", 0).order("created_at", { ascending: false }).limit(10);
  console.log("fixture_id=0 picks:", JSON.stringify(d2, null, 2));
}
run().catch(console.error);
