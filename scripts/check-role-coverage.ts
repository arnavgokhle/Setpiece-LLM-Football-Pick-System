import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, count } = await supabase.from("player_role_profiles").select("country", { count: "exact" });
  const byCountry = new Map<string, number>();
  data?.forEach(d => byCountry.set(d.country, (byCountry.get(d.country) ?? 0) + 1));
  console.log(`Total rows: ${count}`);
  console.log(`Countries covered: ${byCountry.size}`);
  console.log(JSON.stringify([...byCountry.entries()].sort(), null, 2));

  // All 48 WC teams (from wc_fixtures)
  const { data: fixtures } = await supabase.from("wc_fixtures").select("home_team, away_team");
  const allTeams = new Set<string>();
  fixtures?.forEach(f => { allTeams.add(f.home_team); allTeams.add(f.away_team); });
  const missing = [...allTeams].filter(t => !byCountry.has(t));
  console.log(`\nTotal WC teams: ${allTeams.size}`);
  console.log(`Missing from player_role_profiles entirely: ${missing.length}`);
  console.log(JSON.stringify(missing.sort()));
}
run().catch(console.error);
