import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const teams = ["France", "Senegal", "Mexico", "South Korea", "Argentina", "Algeria"];

  const r1 = await supabase.from("player_club_stats").select("player_name, position, team, tackles_per90, passes_per90").in("team", teams);
  console.log("player_club_stats error:", r1.error?.message);
  console.log("player_club_stats rows:", r1.data?.length, JSON.stringify(r1.data, null, 2));

  const r2 = await supabase.from("wc_players").select("player_name, position, team").in("team", teams);
  console.log("\nwc_players error:", r2.error?.message);
  console.log("wc_players rows:", r2.data?.length);
  const midDef = r2.data?.filter(p => ["MID","DEF","CDM","CM","CB","RB","LB","DM","MF"].includes((p.position||"").toUpperCase()));
  console.log("Mid/def subset:", JSON.stringify(midDef, null, 2));
  console.log("All distinct positions found:", [...new Set(r2.data?.map(p=>p.position))]);
}
run().catch(console.error);
