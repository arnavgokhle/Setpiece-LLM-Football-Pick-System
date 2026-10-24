/**
 * Seed script: tournament_pressure_profiles
 * Players with 20+ caps — WC performance history and pressure ratings
 * Run: npm run seed-tournament-pressure
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PressureProfile {
  player_name: string;
  country: string;
  total_caps: number;
  wc_appearances: number;
  wc_goals: number;
  wc_assists: number;
  pressure_rating: number;
  group_stage_avg_shots?: number;
  knockout_avg_shots?: number;
  is_clutch_player: boolean;
  minutes_per_game_intl: number;
  rotation_risk: string;
  notes?: string;
}

const PRESSURE_PROFILES: PressureProfile[] = [
  // ── Elite (10/10 pressure rating) ─────────────────────────
  { player_name: "Lionel Messi", country: "Argentina", total_caps: 180, wc_appearances: 26, wc_goals: 13, wc_assists: 8, pressure_rating: 10.0, group_stage_avg_shots: 3.8, knockout_avg_shots: 4.2, is_clutch_player: true, minutes_per_game_intl: 84, rotation_risk: "low", notes: "GOAT at WC. 2022 winner. Every stat peaks in knockout rounds." },
  { player_name: "Cristiano Ronaldo", country: "Portugal", total_caps: 205, wc_appearances: 22, wc_goals: 8, wc_assists: 3, pressure_rating: 9.0, group_stage_avg_shots: 4.1, knockout_avg_shots: 3.8, is_clutch_player: true, minutes_per_game_intl: 82, rotation_risk: "low", notes: "Still scores from set pieces. SoT volume remains high even at 40." },
  { player_name: "Kylian Mbappé", country: "France", total_caps: 85, wc_appearances: 14, wc_goals: 12, wc_assists: 3, pressure_rating: 9.5, group_stage_avg_shots: 4.5, knockout_avg_shots: 5.1, is_clutch_player: true, minutes_per_game_intl: 87, rotation_risk: "low", notes: "Knockout monster. SoT rockets in must-win games. 2026 is his WC." },
  { player_name: "Vinicius Jr", country: "Brazil", total_caps: 42, wc_appearances: 5, wc_goals: 0, wc_assists: 1, pressure_rating: 8.5, group_stage_avg_shots: 3.6, knockout_avg_shots: 3.2, is_clutch_player: true, minutes_per_game_intl: 80, rotation_risk: "low", notes: "World class at club level, still building WC legacy. 2026 is peak time." },
  { player_name: "Jude Bellingham", country: "England", total_caps: 48, wc_appearances: 7, wc_goals: 3, wc_assists: 2, pressure_rating: 9.0, group_stage_avg_shots: 3.2, knockout_avg_shots: 4.1, is_clutch_player: true, minutes_per_game_intl: 89, rotation_risk: "low", notes: "Clutch in knockout rounds. Box-to-box style generates SoT from midfield." },
  { player_name: "Kevin De Bruyne", country: "Belgium", total_caps: 104, wc_appearances: 12, wc_goals: 2, wc_assists: 6, pressure_rating: 9.0, group_stage_avg_shots: 2.8, knockout_avg_shots: 3.4, is_clutch_player: true, minutes_per_game_intl: 78, rotation_risk: "medium", notes: "Key pass volume peaks in WC. Age 34 but still elite. Monitor fitness." },
  { player_name: "Luka Modric", country: "Croatia", total_caps: 175, wc_appearances: 22, wc_goals: 2, wc_assists: 5, pressure_rating: 9.5, group_stage_avg_shots: 1.8, knockout_avg_shots: 2.1, is_clutch_player: true, minutes_per_game_intl: 81, rotation_risk: "medium", notes: "Legendary at WC. Pass volume reliable. Age 40 now — starter status uncertain." },

  // ── High (8.0–8.9 pressure rating) ────────────────────────
  { player_name: "Harry Kane", country: "England", total_caps: 91, wc_appearances: 14, wc_goals: 9, wc_assists: 1, pressure_rating: 8.5, group_stage_avg_shots: 4.2, knockout_avg_shots: 4.8, is_clutch_player: true, minutes_per_game_intl: 88, rotation_risk: "low", notes: "Golden Boot 2018. SoT volume consistently high regardless of pressure." },
  { player_name: "Neymar Jr", country: "Brazil", total_caps: 124, wc_appearances: 13, wc_goals: 8, wc_assists: 3, pressure_rating: 8.0, group_stage_avg_shots: 4.0, knockout_avg_shots: 4.3, is_clutch_player: true, minutes_per_game_intl: 75, rotation_risk: "high", notes: "If fit, elite. Injury risk is perpetual concern — monitor pre-tournament." },
  { player_name: "Son Heung-min", country: "South Korea", total_caps: 120, wc_appearances: 14, wc_goals: 4, wc_assists: 3, pressure_rating: 8.5, group_stage_avg_shots: 3.4, knockout_avg_shots: 4.0, is_clutch_player: true, minutes_per_game_intl: 85, rotation_risk: "low", notes: "Consistent across pressure levels. SoT and key passes both high." },
  { player_name: "Mohamed Salah", country: "Egypt", total_caps: 92, wc_appearances: 3, wc_goals: 2, wc_assists: 1, pressure_rating: 8.0, group_stage_avg_shots: 3.8, knockout_avg_shots: 4.0, is_clutch_player: true, minutes_per_game_intl: 86, rotation_risk: "low", notes: "Limited WC experience but dominant across all formats. Every stat is high." },
  { player_name: "Pedri", country: "Spain", total_caps: 36, wc_appearances: 5, wc_goals: 0, wc_assists: 2, pressure_rating: 8.0, group_stage_avg_shots: 1.4, knockout_avg_shots: 1.8, is_clutch_player: false, minutes_per_game_intl: 82, rotation_risk: "medium", notes: "High pass volume, assists, key passes. Elevates under pressure." },
  { player_name: "Lamine Yamal", country: "Spain", total_caps: 18, wc_appearances: 0, wc_goals: 0, wc_assists: 0, pressure_rating: 8.5, group_stage_avg_shots: 3.2, knockout_avg_shots: 3.8, is_clutch_player: true, minutes_per_game_intl: 75, rotation_risk: "low", notes: "2024 Euros winner at 16. First WC. Natural big-game player based on club + international form." },
  { player_name: "Rodri", country: "Spain", total_caps: 58, wc_appearances: 7, wc_goals: 1, wc_assists: 2, pressure_rating: 8.5, group_stage_avg_shots: 1.2, knockout_avg_shots: 1.4, is_clutch_player: false, minutes_per_game_intl: 90, rotation_risk: "low", notes: "Ballon d'Or winner. Pass volume peaks in big tournaments. Injury risk from 2024 knee." },
  { player_name: "Federico Valverde", country: "Uruguay", total_caps: 58, wc_appearances: 7, wc_goals: 1, wc_assists: 3, pressure_rating: 8.0, group_stage_avg_shots: 2.8, knockout_avg_shots: 3.4, is_clutch_player: true, minutes_per_game_intl: 86, rotation_risk: "low", notes: "Box-to-box relentless. SoT from midfield in big games reliable." },
  { player_name: "Achraf Hakimi", country: "Morocco", total_caps: 74, wc_appearances: 7, wc_goals: 1, wc_assists: 2, pressure_rating: 8.0, group_stage_avg_shots: 2.4, knockout_avg_shots: 2.8, is_clutch_player: false, minutes_per_game_intl: 90, rotation_risk: "low", notes: "2022 hero. Attacks + crosses from RB. Key passes and SoT consistent." },
  { player_name: "Heung-min Kubo", country: "Japan", total_caps: 28, wc_appearances: 0, wc_goals: 0, wc_assists: 0, pressure_rating: 7.5, group_stage_avg_shots: 2.6, knockout_avg_shots: 2.4, is_clutch_player: false, minutes_per_game_intl: 78, rotation_risk: "medium", notes: "Real Sociedad — elite key pass numbers, improving WC-level experience" },

  // ── Medium-High (7.0–7.9) ──────────────────────────────────
  { player_name: "Phil Foden", country: "England", total_caps: 48, wc_appearances: 7, wc_goals: 0, wc_assists: 2, pressure_rating: 7.5, group_stage_avg_shots: 2.4, knockout_avg_shots: 2.8, is_clutch_player: false, minutes_per_game_intl: 72, rotation_risk: "low", notes: "Inconsistent in major tournaments but club form translates." },
  { player_name: "Bukayo Saka", country: "England", total_caps: 50, wc_appearances: 7, wc_goals: 3, wc_assists: 2, pressure_rating: 7.5, group_stage_avg_shots: 2.8, knockout_avg_shots: 3.2, is_clutch_player: false, minutes_per_game_intl: 83, rotation_risk: "low", notes: "Right wing reliable source of SoT and key passes in every game." },
  { player_name: "Antonee Robinson", country: "USA", total_caps: 36, wc_appearances: 5, wc_goals: 0, wc_assists: 2, pressure_rating: 7.0, group_stage_avg_shots: 1.6, knockout_avg_shots: 1.8, is_clutch_player: false, minutes_per_game_intl: 90, rotation_risk: "low", notes: "LB who attacks. Crosses + tackles consistent." },
  { player_name: "Christian Pulisic", country: "USA", total_caps: 72, wc_appearances: 9, wc_goals: 2, wc_assists: 3, pressure_rating: 7.5, group_stage_avg_shots: 2.6, knockout_avg_shots: 3.0, is_clutch_player: true, minutes_per_game_intl: 82, rotation_risk: "low", notes: "USMNT captain. Key passes and SoT consistent across all formats." },
  { player_name: "Hirving Lozano", country: "Mexico", total_caps: 75, wc_appearances: 9, wc_goals: 3, wc_assists: 2, pressure_rating: 7.0, group_stage_avg_shots: 2.8, knockout_avg_shots: 2.6, is_clutch_player: false, minutes_per_game_intl: 74, rotation_risk: "medium", notes: "Pace threat on right wing. SoT numbers moderate but reliable." },
  { player_name: "Richarlison", country: "Brazil", total_caps: 52, wc_appearances: 5, wc_goals: 3, wc_assists: 1, pressure_rating: 7.5, group_stage_avg_shots: 3.4, knockout_avg_shots: 3.8, is_clutch_player: false, minutes_per_game_intl: 76, rotation_risk: "medium", notes: "Physical striker, SoT from crossing situations. Injury risk noted." },
  { player_name: "Granit Xhaka", country: "Switzerland", total_caps: 125, wc_appearances: 12, wc_goals: 3, wc_assists: 3, pressure_rating: 7.0, group_stage_avg_shots: 1.4, knockout_avg_shots: 1.8, is_clutch_player: false, minutes_per_game_intl: 88, rotation_risk: "low", notes: "Pass volume and tackles reliable in every tournament." },
  { player_name: "Ilkay Gundogan", country: "Germany", total_caps: 74, wc_appearances: 12, wc_goals: 6, wc_assists: 3, pressure_rating: 7.5, group_stage_avg_shots: 2.2, knockout_avg_shots: 2.8, is_clutch_player: false, minutes_per_game_intl: 80, rotation_risk: "medium", notes: "Reliable midfield key pass source even in high-pressure environments." },
  { player_name: "Hakim Ziyech", country: "Morocco", total_caps: 54, wc_appearances: 7, wc_goals: 1, wc_assists: 3, pressure_rating: 7.5, group_stage_avg_shots: 2.4, knockout_avg_shots: 3.0, is_clutch_player: false, minutes_per_game_intl: 76, rotation_risk: "medium", notes: "2022 standout. Key passes and set piece delivery elite." },
  { player_name: "Marco Asensio", country: "Spain", total_caps: 44, wc_appearances: 5, wc_goals: 4, wc_assists: 2, pressure_rating: 7.0, group_stage_avg_shots: 2.6, knockout_avg_shots: 2.4, is_clutch_player: false, minutes_per_game_intl: 68, rotation_risk: "medium", notes: "Supersub tendency but SoT numbers high when starting." },
  { player_name: "Yoshida Maya", country: "Japan", total_caps: 135, wc_appearances: 14, wc_goals: 2, wc_assists: 1, pressure_rating: 7.0, group_stage_avg_shots: 0.8, knockout_avg_shots: 1.2, is_clutch_player: false, minutes_per_game_intl: 90, rotation_risk: "low", notes: "Veteran leader — presence elevates younger players' performance." },
  { player_name: "Darwin Nunez", country: "Uruguay", total_caps: 38, wc_appearances: 5, wc_goals: 2, wc_assists: 1, pressure_rating: 7.5, group_stage_avg_shots: 3.6, knockout_avg_shots: 3.2, is_clutch_player: false, minutes_per_game_intl: 72, rotation_risk: "medium", notes: "Liverpool striker — physical SoT machine but clinical finishing inconsistent." },
  { player_name: "Luis Diaz", country: "Colombia", total_caps: 44, wc_appearances: 5, wc_goals: 2, wc_assists: 3, pressure_rating: 7.5, group_stage_avg_shots: 3.0, knockout_avg_shots: 3.4, is_clutch_player: false, minutes_per_game_intl: 82, rotation_risk: "low", notes: "Liverpool left wing. SoT and key passes reliable across formats." },
  { player_name: "Jordan Henderson", country: "England", total_caps: 81, wc_appearances: 7, wc_goals: 0, wc_assists: 1, pressure_rating: 7.0, group_stage_avg_shots: 1.0, knockout_avg_shots: 1.4, is_clutch_player: false, minutes_per_game_intl: 82, rotation_risk: "medium", notes: "Tackles and passes reliable in tournament pressure situations." },

  // ── WC Debutants with strong club pressure performance ─────
  { player_name: "Kobbie Mainoo", country: "England", total_caps: 16, wc_appearances: 0, wc_goals: 0, wc_assists: 0, pressure_rating: 7.5, group_stage_avg_shots: 1.6, knockout_avg_shots: 1.4, is_clutch_player: false, minutes_per_game_intl: 68, rotation_risk: "medium", notes: "Man Utd midfielder — excellent WC debut expected, tackle + pass volumes" },
  { player_name: "Jamal Musiala", country: "Germany", total_caps: 42, wc_appearances: 5, wc_goals: 1, wc_assists: 2, pressure_rating: 8.0, group_stage_avg_shots: 2.8, knockout_avg_shots: 3.2, is_clutch_player: true, minutes_per_game_intl: 78, rotation_risk: "low", notes: "Bayern's jewel. Dribbles + key passes + SoT all elite. Big game elevates." },
  { player_name: "Gavi", country: "Spain", total_caps: 46, wc_appearances: 5, wc_goals: 0, wc_assists: 3, pressure_rating: 8.0, group_stage_avg_shots: 1.2, knockout_avg_shots: 1.6, is_clutch_player: false, minutes_per_game_intl: 84, rotation_risk: "medium", notes: "High pass volume, key passes reliable. Recovery from injury key." },
  { player_name: "Ferran Torres", country: "Spain", total_caps: 44, wc_appearances: 5, wc_goals: 4, wc_assists: 2, pressure_rating: 7.0, group_stage_avg_shots: 2.4, knockout_avg_shots: 2.2, is_clutch_player: false, minutes_per_game_intl: 65, rotation_risk: "medium", notes: "Rotation option but productive when starting." },
  { player_name: "Leroy Sane", country: "Germany", total_caps: 58, wc_appearances: 7, wc_goals: 0, wc_assists: 3, pressure_rating: 7.0, group_stage_avg_shots: 2.6, knockout_avg_shots: 2.2, is_clutch_player: false, minutes_per_game_intl: 72, rotation_risk: "medium", notes: "Left wing pace. SoT from wide. Inconsistent across high-pressure games." },
];

async function main() {
  console.log(`[seed-tournament-pressure] Starting — ${PRESSURE_PROFILES.length} profiles to seed`);

  const { data: existing } = await supabase
    .from("tournament_pressure_profiles")
    .select("player_name, country");
  const seededKeys = new Set(
    (existing ?? []).map((r: { player_name: string; country: string }) => `${r.player_name}|${r.country}`)
  );
  const toInsert = PRESSURE_PROFILES.filter(
    (p) => !seededKeys.has(`${p.player_name}|${p.country}`)
  );

  if (toInsert.length === 0) {
    console.log("[seed-tournament-pressure] All profiles already seeded. Done.");
    return;
  }
  console.log(`[seed-tournament-pressure] Inserting ${toInsert.length} profiles (${seededKeys.size} already exist)`);

  const { error } = await supabase.from("tournament_pressure_profiles").insert(toInsert);
  if (error) {
    console.error("[seed-tournament-pressure] Insert error:", error.message);
    process.exit(1);
  }

  console.log(`[seed-tournament-pressure] Done — ${toInsert.length} profiles inserted`);
}

main().catch((e) => { console.error(e); process.exit(1); });
