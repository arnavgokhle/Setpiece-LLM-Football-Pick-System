import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: fixtures } = await supabase
    .from("wc_fixtures")
    .select("*")
    .gte("kickoff_at", "2026-06-16T00:00:00Z")
    .lt("kickoff_at", "2026-06-17T00:00:00Z")
    .order("kickoff_at");
  console.log("Today's fixtures:", JSON.stringify(fixtures, null, 2));

  const { data: existingPicks } = await supabase
    .from("picks")
    .select("fixture_id,home_team,away_team,result")
    .gte("kickoff_at", "2026-06-16T00:00:00Z")
    .lt("kickoff_at", "2026-06-17T00:00:00Z");
  console.log("\nExisting picks for today:", JSON.stringify(existingPicks, null, 2));
}
run().catch(console.error);
