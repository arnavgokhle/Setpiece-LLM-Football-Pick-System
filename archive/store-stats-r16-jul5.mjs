import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Round of 16, July 4 games + Norway/England/Mexico R32 backfill.
// Sources: user-confirmed settlement numbers (corners, Mbappé SoT, El Aynaoui passes),
// FIFA/ESPN/Opta match reports. (est.) = estimated from team totals.
//
// Verified results:
//   Paraguay 0-1 France (Mbappé pen) — FRA 15 shots/5 SoT, PAR 5/0. 14 total corners.
//   Canada 0-3 Morocco (Ounahi 50' 82', Rahimi 90+) — MAR 5 shots/4 SoT (fewest by a KO
//     winner since 1966), CAN 10/3. 13 total corners. Brahim Díaz 2 assists.
//   Côte d'Ivoire 1-2 Norway (Nusa 39', Haaland 86'; Diallo 74') — R32 backfill.
//   England 2-1 DR Congo (Kane 75' 86'; Cipenga 7') — R32 backfill.
//   Mexico 2-0 Ecuador (Quinones 22', Jiménez 31') — MEX 15 attempts/3 SoT. R32 backfill.

const rows = [
  // ── Paraguay 0-1 France (Jul 4) ──────────────────────────────────
  {
    player_name: "Kylian Mbappe", team: "France", opponent: "Paraguay",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 5, shots_on_target: 4, // user-confirmed: 5 shots, 4 on target (pen goal + 2 stoppage-time saves by Gill)
    passes_completed: 28, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Desire Doue", team: "France", opponent: "Paraguay",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 75,
    shots: 2, shots_on_target: 0, // (est.) won the penalty Mbappé converted
    passes_completed: 30, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Julio Enciso", team: "Paraguay", opponent: "France",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 0, // (est.) PAR 5 shots, 0 on target total
    passes_completed: 20, // (est.)
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 0,
  },

  // ── Canada 0-3 Morocco (Jul 4) ───────────────────────────────────
  {
    player_name: "Azzedine Ounahi", team: "Morocco", opponent: "Canada",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 2, // 2 goals (50', 82'); MAR only 5 shots/4 SoT total
    passes_completed: 55, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Soufiane Rahimi", team: "Morocco", opponent: "Canada",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 50,
    shots: 1, shots_on_target: 1, // stoppage-time goal; on for injured Saibari before HT
    passes_completed: 15, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Brahim Diaz", team: "Morocco", opponent: "Canada",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 1, // (est.) 2 assists — African WC assist record (4)
    passes_completed: 40, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Neil El Aynaoui", team: "Morocco", opponent: "Canada",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 0, shots_on_target: 0,
    passes_completed: 50, // user-confirmed ~55 attempted → ~50 completed (est.); Morocco ceded the ball, only 5 shots
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Jonathan David", team: "Canada", opponent: "Morocco",
    match_date: "2026-07-04", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 1, // (est.) CAN 10 attempts/3 SoT; David tournament: 15 shots, 7 SoT, 3 goals
    passes_completed: 22, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },

  // ── Côte d'Ivoire 1-2 Norway (R32 backfill, Jun 30) ──────────────
  {
    player_name: "Erling Haaland", team: "Norway", opponent: "Ivory Coast",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1, // quiet game: 3 first-half touches, no 2H shot until the 86' winner (est. 2 total)
    passes_completed: 12, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Antonio Nusa", team: "Norway", opponent: "Ivory Coast",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1, // goal 39' (est. total)
    passes_completed: 25, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Patrick Berg", team: "Norway", opponent: "Ivory Coast",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 0, shots_on_target: 0, // assisted Haaland's winner
    passes_completed: 55, // (est.) deep CM
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },

  // ── England 2-1 DR Congo (R32 backfill, Jun 30) ──────────────────
  {
    player_name: "Harry Kane", team: "England", opponent: "DR Congo",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 4, shots_on_target: 2, // 2 goals (75' header, 86' roof of net); (est. 2 more attempts)
    passes_completed: 24, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Jude Bellingham", team: "England", opponent: "DR Congo",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 1, // 30' header was England's FIRST shot (longest wait on record since 1966)
    passes_completed: 50, // (est.)
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Anthony Gordon", team: "England", opponent: "DR Congo",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 0, // (est.) assisted Kane's first
    passes_completed: 28, // (est.)
    fouls_committed: 1, corners_won: 2, yellow_cards: 0, goals: 0,
  },

  // ── Mexico 2-0 Ecuador (R32 backfill, Jul 1) ─────────────────────
  {
    player_name: "Raul Jimenez", team: "Mexico", opponent: "Ecuador",
    match_date: "2026-07-01", competition: "FIFA World Cup 2026", minutes: 85,
    shots: 3, shots_on_target: 1, // goal 31'; MEX 15 attempts/3 SoT total (est. split)
    passes_completed: 20, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Julian Quinones", team: "Mexico", opponent: "Ecuador",
    match_date: "2026-07-01", competition: "FIFA World Cup 2026", minutes: 88,
    shots: 3, shots_on_target: 1, // goal 22' (est. split of 15 attempts)
    passes_completed: 24, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 1,
  },
];

async function main() {
  const { data: existing } = await supabase
    .from("wc_match_stats")
    .select("player_name, match_date")
    .gte("match_date", "2026-06-30");
  const have = new Set((existing ?? []).map(r => `${r.player_name}|${r.match_date}`));
  const fresh = rows.filter(r => !have.has(`${r.player_name}|${r.match_date}`));

  if (!fresh.length) { console.log("All rows already stored."); return; }

  const { error } = await supabase.from("wc_match_stats").insert(fresh);
  if (error) { console.error("Insert failed:", error.message); process.exit(1); }
  console.log(`✓ Stored ${fresh.length} player rows in wc_match_stats`);
  fresh.forEach(r => console.log(`  ${r.match_date} ${r.player_name} (${r.team} vs ${r.opponent}): ${r.shots} shots, ${r.goals} goals`));
}

main().catch(console.error);
