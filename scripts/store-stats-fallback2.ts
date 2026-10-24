import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const rows = [
    { player_name: "Kevin De Bruyne", team: "Belgium", opponent: "Egypt", match_date: "2026-06-15", passes_completed: 14, shots: 1, shots_on_target: 0, yellow_cards: 1 },
    { player_name: "Pedri", team: "Spain", opponent: "Cape Verde", match_date: "2026-06-15", passes_completed: 86, shots: 2, shots_on_target: 1 },
  ];
  for (const row of rows) {
    const { data: existing } = await supabase.from("wc_match_stats").select("id").eq("player_name", row.player_name).eq("match_date", row.match_date);
    if (existing?.length) {
      await supabase.from("wc_match_stats").update(row).eq("id", existing[0].id);
      console.log(`Updated existing row for ${row.player_name}`);
    } else {
      const { error } = await supabase.from("wc_match_stats").insert(row);
      if (error) console.log(`Insert error for ${row.player_name}:`, error.message);
      else console.log(`Inserted ${row.player_name}`);
    }
  }
}
run().catch(console.error);
