import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const teams = ["France", "Senegal", "Mexico", "South Korea", "Argentina", "Algeria"];

  const r1 = await supabase.from("player_club_stats").select("player_name, club, tackles_per90, passes_per90").in("club", teams);
  console.log("player_club_stats (by club=country, likely 0 since club field is real club not country):", r1.error?.message, r1.data?.length);

  const r2 = await supabase.from("wc_players").select("name, position, club, country, stats_per90").in("country", teams);
  console.log("\nwc_players error:", r2.error?.message);
  console.log("wc_players rows:", r2.data?.length);
  const midDef = r2.data?.filter(p => ["MID","DEF","CDM","CM","CB","RB","LB","DM","MF"].includes((p.position||"").toUpperCase()));
  console.log(`Mid/def players: ${midDef?.length}`);
  midDef?.forEach(p => console.log(`  ${p.name} (${p.country}, ${p.position}) tackles_per90=${(p.stats_per90 as any)?.tackles_per90} passes_per90=${(p.stats_per90 as any)?.passes_per90}`));
}
run().catch(console.error);
