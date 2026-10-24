import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const PLAYERS = ["Kevin De Bruyne", "Mohamed Salah", "Pedri", "Lamine Yamal", "Rodri"];

async function run() {
  const { data } = await supabase
    .from("player_club_stats")
    .select("player_name,club,matches_played,minutes,shots_per90,shots_on_target_per90,passes_per90,tackles_per90,goals,assists")
    .ilike("player_name", `%${PLAYERS.join("%")
      .split("%").map(_ => "%" ).join("")}`)
    .eq("season", "2024-25");

  // Broader search
  for (const name of PLAYERS) {
    const { data: row } = await supabase
      .from("player_club_stats")
      .select("player_name,normalized_name,club,matches_played,minutes,shots_per90,shots_on_target_per90,passes_per90,tackles_per90,goals,assists")
      .eq("season", "2024-25")
      .ilike("player_name", `%${name.split(" ").pop()}%`)
      .limit(3);
    if (row?.length) {
      console.log(`\n${name}:`);
      row.forEach(r => console.log(`  ${r.player_name} @ ${r.club} | ${r.matches_played}apps ${r.minutes}min | shots/90:${r.shots_per90} SoT/90:${r.shots_on_target_per90} passes/90:${r.passes_per90} tkl/90:${r.tackles_per90} | ${r.goals}G ${r.assists}A`));
    } else {
      console.log(`\n${name}: NO DB ENTRY`);
    }
  }
}
run().catch(console.error);
