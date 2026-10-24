import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: all } = await supabase.from("player_club_stats").select("player_name, club, tackles_per90, passes_per90, shots_per90");
  console.log(`Total player_club_stats rows: ${all?.length}`);
  all?.forEach(p => console.log(`  ${p.player_name} (${p.club}) shots/90=${p.shots_per90} passes/90=${p.passes_per90} tackles/90=${p.tackles_per90}`));
}
run().catch(console.error);
