import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: picks } = await supabase
    .from("picks")
    .select("id,player_name,player_team,stat_category,line,direction,home_team,away_team,kickoff_at,result")
    .in("home_team", ["Belgium", "Spain"]);

  console.log("All picks found:", picks?.length);
  picks?.forEach(p => console.log(` - ${p.id} | ${p.home_team} vs ${p.away_team} | ${p.player_name} ${p.direction} ${p.line} ${p.stat_category} | result=${p.result}`));

  if (!picks?.length) return;

  const resolutions: Record<string, { result: string; actual: number }> = {};
  for (const p of picks) {
    if (p.home_team === "Belgium") {
      if (p.player_name === "Kevin De Bruyne") resolutions[p.id] = { result: "lost", actual: 19 };
      else if (p.player_name === "Match") resolutions[p.id] = { result: "lost", actual: 0 };
    } else if (p.home_team === "Spain") {
      if (p.player_name === "Pedri") resolutions[p.id] = { result: "won", actual: 98 };
      else if (p.player_name === "Match") resolutions[p.id] = { result: "won", actual: 11 };
    }
  }

  for (const p of picks) {
    const r = resolutions[p.id];
    if (!r) { console.log(`  SKIP (no resolution mapped, likely Yamal/excluded): ${p.player_name}`); continue; }
    await supabase.from("picks").update({ result: r.result }).eq("id", p.id);
    console.log(`  Updated ${p.player_name} (${p.home_team} vs ${p.away_team}) ${p.direction} ${p.line} ${p.stat_category} -> ${r.result} (actual: ${r.actual})`);
  }

  const statsRows = [
    { player_name: "Kevin De Bruyne", team: "Belgium", opponent: "Egypt", match_date: "2026-06-15", passes_attempted: 19, passes_completed: 14, shots: 1, shots_on_target: 0, yellow_cards: 1 },
    { player_name: "Pedri", team: "Spain", opponent: "Cape Verde", match_date: "2026-06-15", passes_attempted: 98, passes_completed: 86, shots: 2, shots_on_target: 1 },
  ];
  const { error } = await supabase.from("wc_match_stats").upsert(statsRows, { onConflict: "player_name,match_date" });
  if (error) console.log("wc_match_stats upsert error:", error.message);
  else console.log(`Stored ${statsRows.length} player stat rows`);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
