import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data: wc } = await supabase.from("wc_players").select("name, country, position").in("name", ["K. Mbappé", "Kylian Mbappé", "L. Messi", "Lionel Messi"]);
  console.log(JSON.stringify(wc, null, 2));
}
run().catch(console.error);
