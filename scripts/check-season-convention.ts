import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabase.from("player_club_stats").select("season").limit(2000);
  console.log([...new Set(data?.map(d => d.season))]);
}
run().catch(console.error);
