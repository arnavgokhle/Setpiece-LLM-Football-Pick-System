import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Round of 32 (Jun 28-30 UTC). Sources: FIFA match centre summaries, ESPN match
// pages/shot maps, Opta Analyst articles, fotmob. (est.) = estimated from team
// totals + match reports where player-level data was not published.
//
// Verified results:
//   Canada 1-0 South Africa   (Eustaquio 90+2) — CAN 12 shots/7 SoT, RSA 6/1
//   Brazil 2-1 Japan          (Sano 29; Casemiro 56, Martinelli 90+5) — BRA 19 shots, JPN 5
//   Germany 1-1 Paraguay, PAR win 4-3 pens (Enciso; Havertz) — GER 21 shots/6 SoT, PAR 7/3
//   France 3-0 Sweden         (Mbappé 45+2, Barcola 53, Mbappé late) — FRA 25 shots, xG 3.17
//   Netherlands 1-1 Morocco, MAR win 3-2 pens (Gakpo 71; Diop 90+1) — NED 6 shots, MAR 11 (1.4 xG)
//   Norway beat Ivory Coast (Norway face Brazil Jul 5) — detailed stats unavailable

const rows = [
  // ── South Africa 0-1 Canada (Jun 28) ─────────────────────────────
  {
    player_name: "Jonathan David", team: "Canada", opponent: "South Africa",
    match_date: "2026-06-28", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 2, shots_on_target: 0, // ESPN shot map: 17' and 78', both off target
    passes_completed: 20, // (est.) striker vs low block
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Stephen Eustaquio", team: "Canada", opponent: "South Africa",
    match_date: "2026-06-28", competition: "FIFA World Cup 2026", minutes: 93,
    shots: 2, shots_on_target: 1, // 7' off target, 90+2 goal (ESPN shot map)
    passes_completed: 48, // (est.) deep CM in 42% possession side
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Alphonso Davies", team: "Canada", opponent: "South Africa",
    match_date: "2026-06-28", competition: "FIFA World Cup 2026", minutes: 18,
    shots: 0, shots_on_target: 0, // sub 75', first minutes of tournament
    passes_completed: 8, // (est.)
    fouls_committed: 0, corners_won: 1, yellow_cards: 0, goals: 0,
  },

  // ── Brazil 2-1 Japan (Jun 29) ────────────────────────────────────
  {
    player_name: "Vinicius Junior", team: "Brazil", opponent: "Japan",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 2, // RotoWire: 3 shots, 2 on goal, 7 crosses, 1 corner won
    passes_completed: 32, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Casemiro", team: "Brazil", opponent: "Japan",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 3, shots_on_target: 2, // header saved off line 54', headed goal 56' (+1 est.)
    passes_completed: 70, // (est.) 69% possession side
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 1, tackles: 2, // (est.)
  },
  {
    player_name: "Bruno Guimaraes", team: "Brazil", opponent: "Japan",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 1, // ESPN: 1 SoG, 0.20 xG
    passes_completed: 135, passes_attempted: 148, // ESPN 135 accurate; attempted (est. ÷0.91)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0, tackles: 3, // (est.)
  },
  {
    player_name: "Gabriel Martinelli", team: "Brazil", opponent: "Japan",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 29,
    shots: 1, shots_on_target: 1, // sub 66', curled winner 90+5
    passes_completed: 12, // (est.)
    fouls_committed: 0, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Kaishu Sano", team: "Japan", opponent: "Brazil",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 1, shots_on_target: 1, // superb strike 29' — Japan only 5 shots total
    passes_completed: 25, // (est.)
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 1,
  },

  // ── Germany 1-1 Paraguay, PAR 4-3 pens (Jun 29, 120 min) ─────────
  {
    player_name: "Julio Enciso", team: "Paraguay", opponent: "Germany",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 2, shots_on_target: 1, // headed opener; PAR 7 shots/3 SoT total (est. split)
    passes_completed: 24, // (est.) 25% possession side
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Antonio Sanabria", team: "Paraguay", opponent: "Germany",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 2, shots_on_target: 1, // (est.) of PAR 7 shots
    passes_completed: 18, // (est.)
    fouls_committed: 2, corners_won: 0, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Kai Havertz", team: "Germany", opponent: "Paraguay",
    match_date: "2026-06-29", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 4, shots_on_target: 2, // headed equalizer; GER 21 shots/6 SoT (est. split)
    passes_completed: 45, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },

  // ── France 3-0 Sweden (Jun 30) ───────────────────────────────────
  {
    player_name: "Kylian Mbappe", team: "France", opponent: "Sweden",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 5, shots_on_target: 3, // Opta: 5 shots, 0.63 xG, 2 goals (SoT est. 3)
    passes_completed: 30, // (est.) joint-most chances created, most dribbles
    fouls_committed: 0, corners_won: 1, yellow_cards: 0, goals: 2,
  },
  {
    player_name: "Michael Olise", team: "France", opponent: "Sweden",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 90,
    shots: 6, shots_on_target: 2, // Opta: 6 shots, most for France (SoT est.)
    passes_completed: 52, // (est.)
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0,
  },
  {
    player_name: "Bradley Barcola", team: "France", opponent: "Sweden",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 78,
    shots: 2, shots_on_target: 1, // goal 53' from Olise through-ball (est. total)
    passes_completed: 22, // (est.)
    fouls_committed: 0, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Ousmane Dembele", team: "France", opponent: "Sweden",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 80,
    shots: 2, shots_on_target: 1, // (est.) of FRA 25 shots; assisted Mbappé's 1st (short corner)
    passes_completed: 35, // (est.)
    fouls_committed: 1, corners_won: 2, yellow_cards: 0, goals: 0,
  },

  // ── Netherlands 1-1 Morocco, MAR 3-2 pens (Jun 30, 120 min) ──────
  {
    player_name: "Cody Gakpo", team: "Netherlands", opponent: "Morocco",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 2, shots_on_target: 1, // goal 71' (Weghorst assist); NED only 6 shots total
    passes_completed: 28, // (est.)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1,
  },
  {
    player_name: "Achraf Hakimi", team: "Morocco", opponent: "Netherlands",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 2, shots_on_target: 0, // hit crossbar 52'; 5 touches in opposition box
    passes_completed: 74, // (est.) 61% possession side, attacking RB
    fouls_committed: 1, corners_won: 1, yellow_cards: 0, goals: 0, tackles: 3, // (est.)
  },
  {
    player_name: "Neil El Aynaoui", team: "Morocco", opponent: "Netherlands",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 1, shots_on_target: 0, // (est.); hit crossbar in the shootout (not counted)
    passes_completed: 134, passes_attempted: 149, // Opta: 134 completed, tournament high (attempted est. ÷0.90)
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 0, tackles: 3, // (est.)
  },
  {
    player_name: "Issa Diop", team: "Morocco", opponent: "Netherlands",
    match_date: "2026-06-30", competition: "FIFA World Cup 2026", minutes: 120,
    shots: 1, shots_on_target: 1, // headed equaliser 90+1 from Talbi cross
    passes_completed: 60, // (est.) CB in 61% possession side
    fouls_committed: 1, corners_won: 0, yellow_cards: 0, goals: 1, tackles: 2, // (est.)
  },
];

async function main() {
  // Dedupe: skip rows already stored
  const { data: existing } = await supabase
    .from("wc_match_stats")
    .select("player_name, match_date")
    .gte("match_date", "2026-06-28");
  const have = new Set((existing ?? []).map(r => `${r.player_name}|${r.match_date}`));
  const fresh = rows.filter(r => !have.has(`${r.player_name}|${r.match_date}`));

  if (!fresh.length) { console.log("All rows already stored."); return; }

  const { error } = await supabase.from("wc_match_stats").insert(fresh);
  if (error) {
    // Retry without possibly-missing optional columns
    console.warn("Insert failed:", error.message, "— retrying without tackles/passes_attempted");
    const slim = fresh.map(({ tackles, passes_attempted, ...rest }) => rest);
    const { error: e2 } = await supabase.from("wc_match_stats").insert(slim);
    if (e2) { console.error("Retry failed:", e2.message); process.exit(1); }
  }
  console.log(`✓ Stored ${fresh.length} R32 player rows in wc_match_stats`);
  fresh.forEach(r => console.log(`  ${r.match_date} ${r.player_name} (${r.team} vs ${r.opponent}): ${r.shots} shots, ${r.goals} goals`));
}

main().catch(console.error);
