import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const teams = ["France", "Senegal", "Mexico", "South Korea", "Argentina", "Algeria", "South Africa", "Czechia", "Iraq", "Norway", "Austria", "Jordan"];

  console.log("=== player_club_stats coverage (midfielders/defenders only) ===");
  const { data: stats } = await supabase
    .from("player_club_stats")
    .select("player_name, position, team, tackles_per90, passes_per90")
    .in("team", teams);
  console.log(JSON.stringify(stats, null, 2));

  console.log("\n=== wc_players for these teams (squad list) ===");
  const { data: players } = await supabase
    .from("wc_players")
    .select("player_name, position, team")
    .in("team", teams)
    .in("position", ["MID", "DEF", "CDM", "CM", "CB", "RB", "LB"]);
  console.log(`Found ${players?.length} mid/def players`);
  console.log(JSON.stringify(players?.slice(0, 30), null, 2));
}
run().catch(console.error);
