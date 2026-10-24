import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// R32 corners picks (Brazil-Japan 9.5, South Africa-Canada 7.5): official corner
// counts never surfaced in any accessible source — voided per owner decision.
const { data: picks, error } = await supabase
  .from("picks")
  .select("id, home_team, away_team, stat_category, line, result")
  .in("fixture_id", [900201, 900203])
  .eq("stat_category", "Total Match Corners")
  .eq("result", "pending");
if (error) { console.error(error.message); process.exit(1); }
for (const p of picks) {
  const { error: e } = await supabase.from("picks").update({ result: "void" }).eq("id", p.id);
  console.log(e ? `FAILED: ${e.message}` : `○ VOID — MORE ${p.line} ${p.stat_category} — ${p.home_team} vs ${p.away_team}`);
}
console.log(`Voided ${picks.length} picks.`);
