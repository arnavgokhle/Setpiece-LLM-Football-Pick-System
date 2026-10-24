// Store post-game player stats for June 16 (US) WC matches
// France 3-1 Senegal | Argentina 3-0 Algeria | Mexico 1-1 South Korea | Iraq 1-4 Norway
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stats = [
  // France 3-1 Senegal
  { player_name: "Kylian Mbappé",   team: "France",      opponent: "Senegal",  match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 90, shots: 7,  shots_on_target: 5, goals: 2, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },
  { player_name: "Bradley Barcola", team: "France",      opponent: "Senegal",  match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 90, shots: 3,  shots_on_target: 1, goals: 1, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },

  // Argentina 3-0 Algeria
  { player_name: "Lionel Messi",    team: "Argentina",   opponent: "Algeria",  match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 90, shots: 5,  shots_on_target: 4, goals: 3, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },

  // Mexico 1-1 South Korea
  { player_name: "Son Heung-Min",   team: "South Korea", opponent: "Mexico",   match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 69, shots: 6,  shots_on_target: 1, goals: 0, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },

  // Iraq 1-4 Norway
  { player_name: "Erling Haaland",  team: "Norway",      opponent: "Iraq",     match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 90, shots: 4,  shots_on_target: 3, goals: 2, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },
  { player_name: "Leo Ostigard",    team: "Norway",      opponent: "Iraq",     match_date: "2026-06-16", competition: "FIFA World Cup 2026", minutes: 90, shots: 1,  shots_on_target: 1, goals: 1, passes_completed: null, fouls_committed: 0, corners_won: 0, yellow_cards: 0, red_cards: 0 },
];

async function run() {
  // Check for existing rows to avoid duplicates
  const { data: existing } = await sb
    .from("wc_match_stats")
    .select("player_name")
    .eq("match_date", "2026-06-16");

  const existingNames = new Set((existing ?? []).map((r: any) => r.player_name));
  const toInsert = stats.filter(s => !existingNames.has(s.player_name));

  if (!toInsert.length) {
    console.log("Stats already stored for June 16 — nothing to insert.");
    return;
  }

  const { error } = await sb.from("wc_match_stats").insert(toInsert);

  if (error) {
    console.error("insert error:", error.message);
    process.exit(1);
  }

  console.log(`Stored ${toInsert.length} player stat rows for June 16 matches.`);
  toInsert.forEach(s =>
    console.log(`  ${s.player_name} (${s.team} vs ${s.opponent}) — ${s.shots} shots, ${s.shots_on_target} SoT, ${s.goals} goals`)
  );
}

run().catch(err => { console.error(err); process.exit(1); });
