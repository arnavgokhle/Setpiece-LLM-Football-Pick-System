import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data } = await supabase
    .from("picks")
    .select("id,player_name,player_team,stat_category,line,direction,home_team,away_team,result")
    .eq("home_team", "Belgium")
    .eq("away_team", "Egypt");
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
