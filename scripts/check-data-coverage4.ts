import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data } = await supabase.from("wc_players").select("name, position, country, stats_per90").in("name", ["L. Messi", "K. Mbappé", "Son Heung-Min", "Lionel Messi", "Kylian Mbappé"]);
  console.log(JSON.stringify(data, null, 2));

  // Check overall stats_per90 population rate across all wc_players
  const { data: all } = await supabase.from("wc_players").select("name, position, stats_per90");
  const populated = all?.filter(p => p.stats_per90 && Object.keys(p.stats_per90).length > 0);
  console.log(`\n${populated?.length} / ${all?.length} wc_players have any stats_per90 data`);
  const populatedMidDef = populated?.filter(p => ["MID","DEF"].includes((p.position||"").toUpperCase()));
  console.log(`Of those, ${populatedMidDef?.length} are MID/DEF`);
}
run().catch(console.error);
