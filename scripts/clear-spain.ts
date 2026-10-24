import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { count, error } = await supabase.from("picks").delete({ count: "exact" })
    .eq("home_team", "Spain").eq("result", "pending");
  console.log(`Deleted ${count} Spain picks`, error?.message ?? "");
  const { count: c2 } = await supabase.from("picks").select("id", { count: "exact", head: true }).eq("fixture_id", 900043);
  console.log(`Remaining fixture_id=900043 picks: ${c2}`);
}
run().catch(console.error);
