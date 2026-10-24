import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data: fixtures } = await supabase
    .from("wc_fixtures")
    .select("home_team, away_team, kickoff_at")
    .gte("kickoff_at", "2026-06-16T18:00:00Z")
    .lte("kickoff_at", "2026-06-20T23:59:59Z")
    .order("kickoff_at");

  const { data: covered } = await supabase.from("player_role_profiles").select("country");
  const coveredSet = new Set(covered?.map(c => c.country));

  console.log("Fixtures in next ~4 days, flagging teams with NO player_role_profiles coverage:\n");
  fixtures?.forEach(f => {
    const homeOk = coveredSet.has(f.home_team);
    const awayOk = coveredSet.has(f.away_team);
    if (!homeOk || !awayOk) {
      const ist = new Date(f.kickoff_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
      console.log(`${f.home_team}${homeOk ? "" : " [MISSING]"} vs ${f.away_team}${awayOk ? "" : " [MISSING]"} — ${ist} IST`);
    }
  });
}
run().catch(console.error);
