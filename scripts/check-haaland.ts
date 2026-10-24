import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabase.from("player_club_stats").select("*").ilike("player_name", "%Haaland%");
  console.log(JSON.stringify(data, null, 2));
  const { data: wc } = await supabase.from("wc_players").select("name, country, position, stats_per90").ilike("name", "%Haaland%");
  console.log(JSON.stringify(wc, null, 2));
}
run().catch(console.error);
