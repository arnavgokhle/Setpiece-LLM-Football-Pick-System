import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data: haaland } = await supabase.from("player_role_profiles").select("*").ilike("player_name", "%Haaland%");
  console.log("Haaland role profile:", JSON.stringify(haaland, null, 2));

  const { data: norway } = await supabase.from("player_role_profiles").select("player_name, country, wc_squad_confirmed").eq("country", "Norway");
  console.log(`\nNorway players in player_role_profiles: ${norway?.length}`);
  console.log(JSON.stringify(norway, null, 2));

  const { data: iraq } = await supabase.from("player_role_profiles").select("player_name, country, wc_squad_confirmed").eq("country", "Iraq");
  console.log(`\nIraq players in player_role_profiles: ${iraq?.length}`);

  for (const c of ["France", "Argentina", "Mexico", "South Korea"]) {
    const { data } = await supabase.from("player_role_profiles").select("player_name, wc_squad_confirmed").eq("country", c).eq("wc_squad_confirmed", true);
    console.log(`${c}: ${data?.length} confirmed`);
  }
}
run().catch(console.error);
