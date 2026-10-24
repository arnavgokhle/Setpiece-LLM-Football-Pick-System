import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: fixtures } = await supabase
    .from("wc_fixtures")
    .select("*")
    .gte("kickoff_at", "2026-06-16T00:00:00Z")
    .lt("kickoff_at", "2026-06-17T12:00:00Z")
    .order("kickoff_at");
  console.log("=== FIXTURES (today through tomorrow noon UTC) ===");
  fixtures?.forEach(f => {
    const ist = new Date(f.kickoff_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
    console.log(`${f.home_team} vs ${f.away_team} — ${ist} IST (fixture_id ${f.fixture_id})`);
  });

  const { data: picks } = await supabase
    .from("picks")
    .select("*")
    .gte("kickoff_at", "2026-06-16T00:00:00Z")
    .lt("kickoff_at", "2026-06-17T12:00:00Z")
    .order("kickoff_at");
  console.log("\n=== PICKS ===");
  console.log(JSON.stringify(picks, null, 2));
}
run().catch(console.error);
