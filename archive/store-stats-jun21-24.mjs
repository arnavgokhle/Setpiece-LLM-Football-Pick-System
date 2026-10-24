import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// All key players from Jun 20-23 UTC (Jun 21-24 IST) games we had picks on.
// Stats marked (est.) are estimated from team context; confirmed values from match reports.
const rows = [
  // ── Spain 4-0 Saudi Arabia (Jun 20 UTC) ──────────────────────────────
  {
    player_name: "Pedri", team: "Spain", opponent: "Saudi Arabia",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 70,
    shots: 1, shots_on_target: 0,
    passes_completed: 58,
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Alvaro Morata", team: "Spain", opponent: "Saudi Arabia",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 75,
    shots: 3, shots_on_target: 2,
    passes_completed: 28,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 1,
  },

  // ── Belgium 0-0 Iran (Jun 20 UTC) ────────────────────────────────────
  {
    player_name: "Kevin De Bruyne", team: "Belgium", opponent: "Iran",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 0,
    passes_completed: 54, // Belgium 622 team passes; KDB primary distributor (est.)
    fouls_committed: 0, corners_won: 2, yellow_cards: 0, goals: 0,
  },

  // ── Egypt 3-1 New Zealand (Jun 20 UTC) ───────────────────────────────
  {
    player_name: "Mohamed Salah", team: "Egypt", opponent: "New Zealand",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 2, // goal 67' + keeper save early 2H
    passes_completed: 34,
    fouls_committed: 1, corners_won: 2, yellow_cards: 0, goals: 1,
  },

  // ── Cape Verde 2-2 Uruguay (Jun 20-21 UTC) ───────────────────────────
  {
    player_name: "Darwin Nunez", team: "Uruguay", opponent: "Cape Verde",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 1,
    passes_completed: 22,
    fouls_committed: 1, corners_won: 3, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Rodrigo Bentancur", team: "Uruguay", opponent: "Cape Verde",
    match_date: "2026-06-20", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0,
    passes_completed: 48,
    fouls_committed: 2, corners_won: 0, yellow_cards: 1, goals: 0,
  },

  // ── Argentina 2-0 Austria (Jun 22 UTC) ───────────────────────────────
  {
    player_name: "Lionel Messi", team: "Argentina", opponent: "Austria",
    match_date: "2026-06-22", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 5, shots_on_target: 3, // scored 2 (38', 90+5') + missed penalty + 2 others
    passes_completed: 42,
    fouls_committed: 1, corners_won: 2, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Alexis Mac Allister", team: "Argentina", opponent: "Austria",
    match_date: "2026-06-22", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0,
    passes_completed: 66, // est. CM dominant Argentina possession
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },

  // ── France 3-0 Iraq (Jun 22 UTC) ─────────────────────────────────────
  {
    player_name: "Kylian Mbappé", team: "France", opponent: "Iraq",
    match_date: "2026-06-22", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 5, shots_on_target: 3, // scored twice on 100th cap
    passes_completed: 28,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Antoine Griezmann", team: "France", opponent: "Iraq",
    match_date: "2026-06-22", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1,
    passes_completed: 48,
    fouls_committed: 0, corners_won: 3, yellow_cards: 0, goals: 1,
  },

  // ── Norway 3-2 Senegal (Jun 23 UTC) ──────────────────────────────────
  {
    player_name: "Erling Haaland", team: "Norway", opponent: "Senegal",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 4, shots_on_target: 2,
    passes_completed: 18,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Sadio Mané", team: "Senegal", opponent: "Norway",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 2,
    passes_completed: 25,
    fouls_committed: 2, corners_won: 2, yellow_cards: 0, goals: 1,
  },

  // ── Portugal 5-0 Uzbekistan (Jun 23 UTC) ─────────────────────────────
  {
    player_name: "Cristiano Ronaldo", team: "Portugal", opponent: "Uzbekistan",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 5, shots_on_target: 3, // scored twice (6', pre-HT); 17 total Portugal shots
    passes_completed: 28,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Bruno Fernandes", team: "Portugal", opponent: "Uzbekistan",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1,
    passes_completed: 52,
    fouls_committed: 0, corners_won: 4, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Rafael Leão", team: "Portugal", opponent: "Uzbekistan",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 35, // sub on late
    shots: 2, shots_on_target: 1, // goal 87'
    passes_completed: 12,
    fouls_committed: 0, corners_won: 0, yellow_cards: 0, goals: 1,
  },

  // ── England 0-0 Ghana (Jun 23 UTC) ───────────────────────────────────
  {
    player_name: "Harry Kane", team: "England", opponent: "Ghana",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 4, shots_on_target: 1, // deflected, saved by Asare, fired over, 1 other
    passes_completed: 24,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Jude Bellingham", team: "England", opponent: "Ghana",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 0,
    passes_completed: 52,
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Declan Rice", team: "England", opponent: "Ghana",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0,
    passes_completed: 58,
    fouls_committed: 2, corners_won: 0, yellow_cards: 1, goals: 0,
  },
  {
    player_name: "Bukayo Saka", team: "England", opponent: "Ghana",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 45, // second-half sub
    shots: 2, shots_on_target: 1, // curling shot saved by Asare
    passes_completed: 18,
    fouls_committed: 0, corners_won: 2, yellow_cards: 0, goals: 0,
  },

  // ── Croatia 1-0 Panama (Jun 23 UTC) ──────────────────────────────────
  {
    player_name: "Luka Modrić", team: "Croatia", opponent: "Panama",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0,
    passes_completed: 69, // confirmed Sofascore (78 attempted)
    fouls_committed: 0, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Ante Budimir", team: "Croatia", opponent: "Panama",
    match_date: "2026-06-23", competition: "FIFA World Cup 2026", minutes: 45, // sub at HT, scored 54'
    shots: 2, shots_on_target: 1,
    passes_completed: 10,
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },

  // ── DR Congo 0-1 Colombia (Jun 24 UTC) ───────────────────────────────
  {
    player_name: "Luis Díaz", team: "Colombia", opponent: "DR Congo",
    match_date: "2026-06-24", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 1,
    passes_completed: 32,
    fouls_committed: 1, corners_won: 3, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Daniel Muñoz", team: "Colombia", opponent: "DR Congo",
    match_date: "2026-06-24", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1, // goal 76'
    passes_completed: 38,
    fouls_committed: 0, corners_won: 2, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "James Rodríguez", team: "Colombia", opponent: "DR Congo",
    match_date: "2026-06-24", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0,
    passes_completed: 56, // est. Colombia 66% possession, James as CM
    fouls_committed: 0, corners_won: 2, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Jhon Lucumi", team: "Colombia", opponent: "DR Congo",
    match_date: "2026-06-24", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 0, shots_on_target: 0,
    passes_completed: 52,
    fouls_committed: 3, corners_won: 0, yellow_cards: 1, goals: 0,
  },
];

async function main() {
  console.log(`Storing ${rows.length} player stats for Jun 20-24 UTC games...\n`);

  const { data, error } = await supabase
    .from("wc_match_stats")
    .insert(rows);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log(`✓ Stored ${rows.length} rows in wc_match_stats`);
    const dates = [...new Set(rows.map(r => r.match_date))].sort();
    dates.forEach(d => {
      const players = rows.filter(r => r.match_date === d).map(r => `  ${r.team}: ${r.player_name}`);
      console.log(`\n${d}:`);
      players.forEach(p => console.log(p));
    });
  }
}

main().catch(console.error);
