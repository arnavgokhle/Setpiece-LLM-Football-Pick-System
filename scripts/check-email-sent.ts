import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: logs } = await supabase
    .from("cron_log")
    .select("*")
    .gte("created_at", "2026-06-16T00:00:00Z")
    .order("created_at", { ascending: false });
  console.log("=== cron_log entries today ===");
  console.log(JSON.stringify(logs, null, 2));
  console.log("\nCurrent time (server):", new Date().toISOString());
}
run().catch(console.error);
