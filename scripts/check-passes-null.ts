import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { count: total } = await supabase.from("player_club_stats").select("*", { count: "exact", head: true });
  const { count: withPasses } = await supabase.from("player_club_stats").select("*", { count: "exact", head: true }).not("passes_per90", "is", null);
  const { count: withTackles } = await supabase.from("player_club_stats").select("*", { count: "exact", head: true }).not("tackles_per90", "is", null).gt("tackles_per90", 0);
  console.log(`Total rows: ${total}`);
  console.log(`Rows with passes_per90 NOT null: ${withPasses}`);
  console.log(`Rows with tackles_per90 > 0: ${withTackles}`);
}
run().catch(console.error);
