import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const names = ["Konaté", "Upamecano", "Tchouaméni", "Otamendi", "Romero", "De Paul", "Mac Allister", "Koulibaly", "Kanté", "Rabiot"];
  for (const n of names) {
    const { data } = await supabase.from("player_club_stats").select("player_name, club, tackles_per90, passes_per90").ilike("player_name", `%${n}%`);
    console.log(`${n}:`, JSON.stringify(data));
  }

  const { data: withPasses } = await supabase.from("player_club_stats").select("player_name, club, passes_per90").not("passes_per90", "is", null);
  console.log("\nThe 14 players WITH passes_per90 populated:");
  console.log(JSON.stringify(withPasses, null, 2));
}
run().catch(console.error);
