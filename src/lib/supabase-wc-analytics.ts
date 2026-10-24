// ============================================================
// SETPIECE — WC 2026 Analytics DB Helpers
// Queries team_tactical_profiles, player_role_profiles,
// matchup_profiles, tournament_pressure_profiles, set_piece_database
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";

// ── Type definitions ──────────────────────────────────────────

export interface TeamTacticalProfile {
  country: string;
  confederation: string;
  fifa_ranking: number | null;
  formation: string;
  defensive_style: string;
  pressing_intensity: string;
  defensive_line: string;
  attacking_style: string;
  avg_possession: number | null;
  avg_shots_per_game: number | null;
  avg_shots_conceded_per_game: number | null;
  avg_goals_scored_per_game: number | null;
  avg_goals_conceded_per_game: number | null;
  avg_passes_per_game: number | null;
  avg_tackles_per_game: number | null;
  avg_key_passes_per_game: number | null;
  set_piece_threat: string;
  corner_taker: string | null;
  group_stage: string | null;
  wc_record: string | null;
  notes: string | null;
  // Defensive vulnerability columns (added in wc-defensive-migration.sql)
  key_passes_conceded_per_game: number | null;
  wide_vulnerability_rating: number | null;
  central_vulnerability_rating: number | null;
  aerial_vulnerability_rating: number | null;
  set_piece_vulnerability_rating: number | null;
}

// ── Matchup rating computation ────────────────────────────────
// Deterministically evaluates whether the opponent's defensive profile
// is favourable, neutral, or unfavourable for a specific stat category.
export function computeMatchupRating(
  statCategory: string,
  playerAvgStat: number | null,
  opponentProfile: TeamTacticalProfile | null
): { rating: 'strong' | 'neutral' | 'tough'; context: string } {
  if (!opponentProfile) return { rating: 'neutral', context: '' };

  const cat = statCategory.toLowerCase();
  let vulnerability = 5; // default neutral
  let concededStat: number | null = null;
  let statLabel = '';

  if (cat.includes('shot')) {
    concededStat = opponentProfile.avg_shots_conceded_per_game;
    statLabel = 'shots conceded/game';
    const wide = opponentProfile.wide_vulnerability_rating ?? 5;
    const central = opponentProfile.central_vulnerability_rating ?? 5;
    vulnerability = Math.round((wide + central) / 2);
    // Bonus/penalty from volume conceded
    if (concededStat !== null) {
      if (concededStat > 13) vulnerability = Math.min(10, vulnerability + 1);
      if (concededStat < 9)  vulnerability = Math.max(1, vulnerability - 1);
    }
  } else if (cat.includes('pass')) {
    concededStat = opponentProfile.key_passes_conceded_per_game;
    statLabel = 'key passes conceded/game';
    const pressureMap: Record<string, number> = { high: 3, medium: 5, low: 7 };
    vulnerability = pressureMap[opponentProfile.pressing_intensity] ?? 5;
  } else if (cat.includes('corner')) {
    concededStat = null;
    statLabel = 'wide vulnerability';
    vulnerability = opponentProfile.wide_vulnerability_rating ?? 5;
  } else if (cat.includes('foul')) {
    vulnerability = 5; // neutral for fouls — opponent's style matters less
    statLabel = '';
  }

  // Build context string
  let context = '';
  if (concededStat !== null && playerAvgStat !== null) {
    const comparison = concededStat > playerAvgStat
      ? 'above player avg — favourable'
      : concededStat < playerAvgStat
        ? 'below player avg — tighter than usual'
        : 'matches player avg';
    context = `${opponentProfile.country} concedes ${concededStat.toFixed(1)} ${statLabel} (${comparison})`;
  } else if (vulnerability >= 7) {
    context = `${opponentProfile.country} rated ${vulnerability}/10 vulnerable in this area`;
  } else if (vulnerability <= 3) {
    context = `${opponentProfile.country} rated ${vulnerability}/10 — defensively strong in this area`;
  }

  const rating: 'strong' | 'neutral' | 'tough' =
    vulnerability >= 7 ? 'strong' : vulnerability <= 3 ? 'tough' : 'neutral';

  return { rating, context };
}

export interface PlayerRoleProfile {
  player_name: string;
  country: string;
  club: string;
  position: string;
  dfs_role: string;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  assists_per90: number | null;
  passes_per90: number | null;
  pass_accuracy: number | null;
  tackles_per90: number | null;
  interceptions_per90: number | null;
  dribbles_per90: number | null;
  intl_caps: number;
  intl_goals: number;
  intl_assists: number;
  typical_shots_line: number | null;
  typical_passes_line: number | null;
  typical_tackles_line: number | null;
  typical_key_passes_line: number | null;
  big_game_rating: number;
  injury_risk: string;
  wc_squad_confirmed: boolean;
}

export interface TournamentPressureProfile {
  player_name: string;
  country: string;
  total_caps: number;
  wc_appearances: number;
  wc_goals: number;
  wc_assists: number;
  pressure_rating: number | null;
  group_stage_avg_shots: number | null;
  knockout_avg_shots: number | null;
  is_clutch_player: boolean;
  minutes_per_game_intl: number | null;
  rotation_risk: string;
  notes: string | null;
}

export interface SetPieceData {
  country: string;
  primary_corner_taker: string | null;
  secondary_corner_taker: string | null;
  corner_delivery_style: string;
  corner_target_player: string | null;
  corners_per_game: number;
  corner_to_shot_conversion: number;
  primary_fk_taker: string | null;
  secondary_fk_taker: string | null;
  fk_delivery_style: string;
  direct_fk_threat: string;
  primary_penalty_taker: string | null;
  set_piece_vulnerability: string;
  set_piece_dfs_score: number;
  notes: string | null;
}

// ── Query functions ───────────────────────────────────────────

export async function getTacticalProfilesForCountries(
  countries: string[]
): Promise<TeamTacticalProfile[]> {
  if (!countries.length) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_tactical_profiles")
    .select("*")
    .in("country", countries);
  if (error) {
    console.error("[supabase-wc-analytics] getTacticalProfiles:", error.message);
    return [];
  }
  return (data ?? []) as TeamTacticalProfile[];
}

export async function getTacticalProfileForCountry(
  country: string
): Promise<TeamTacticalProfile | null> {
  const profiles = await getTacticalProfilesForCountries([country]);
  return profiles[0] ?? null;
}

export async function getPlayerRoleProfilesForCountries(
  countries: string[]
): Promise<PlayerRoleProfile[]> {
  if (!countries.length) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("player_role_profiles")
    .select("*")
    .in("country", countries)
    .eq("wc_squad_confirmed", true)
    .order("big_game_rating", { ascending: false });
  if (error) {
    console.error("[supabase-wc-analytics] getPlayerRoleProfiles:", error.message);
    return [];
  }
  return (data ?? []) as PlayerRoleProfile[];
}

export async function getTournamentPressureProfilesForCountries(
  countries: string[]
): Promise<TournamentPressureProfile[]> {
  if (!countries.length) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tournament_pressure_profiles")
    .select("*")
    .in("country", countries)
    .order("pressure_rating", { ascending: false });
  if (error) {
    console.error("[supabase-wc-analytics] getTournamentPressure:", error.message);
    return [];
  }
  return (data ?? []) as TournamentPressureProfile[];
}

export async function getSetPieceDataForCountries(
  countries: string[]
): Promise<SetPieceData[]> {
  if (!countries.length) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("set_piece_database")
    .select("*")
    .in("country", countries);
  if (error) {
    console.error("[supabase-wc-analytics] getSetPieceData:", error.message);
    return [];
  }
  return (data ?? []) as SetPieceData[];
}

// ── Context builders (for Claude prompt injection) ────────────

export function buildTacticalContext(
  homeTeam: string,
  awayTeam: string,
  profiles: TeamTacticalProfile[]
): string {
  const home = profiles.find((p) => p.country === homeTeam);
  const away = profiles.find((p) => p.country === awayTeam);
  if (!home && !away) return "";

  const lines: string[] = ["\nTACTICAL PROFILES:"];

  for (const t of [home, away]) {
    if (!t) continue;
    const vulnLine = [
      t.wide_vulnerability_rating != null     ? `wide-vuln:${t.wide_vulnerability_rating}/10` : null,
      t.central_vulnerability_rating != null  ? `central-vuln:${t.central_vulnerability_rating}/10` : null,
      t.aerial_vulnerability_rating != null   ? `aerial-vuln:${t.aerial_vulnerability_rating}/10` : null,
      t.set_piece_vulnerability_rating != null ? `setpiece-vuln:${t.set_piece_vulnerability_rating}/10` : null,
    ].filter(Boolean).join(' | ');
    lines.push(
      `${t.country}: Formation ${t.formation} | ${t.attacking_style} style | ${t.defensive_style} defence | ${t.pressing_intensity}-press | Poss avg ${t.avg_possession}% | ${t.avg_shots_per_game} shots/game (concede ${t.avg_shots_conceded_per_game}) | KP conceded/game ${t.key_passes_conceded_per_game ?? 'N/A'} | Goals conceded/game ${t.avg_goals_conceded_per_game ?? 'N/A'} | Set piece threat: ${t.set_piece_threat}${vulnLine ? ` | Defensive vuln: ${vulnLine}` : ''}`
    );
  }

  // Matchup insight: who will dominate
  if (home && away) {
    const possessionAdvantage =
      (home.avg_possession ?? 50) > (away.avg_possession ?? 50)
        ? `${home.country} likely to dominate ball (${home.avg_possession}% vs ${away.avg_possession}%)`
        : `${away.country} likely to dominate ball (${away.avg_possession}% vs ${home.avg_possession}%)`;
    lines.push(`Possession edge: ${possessionAdvantage}`);

    const pressVuln =
      home.pressing_intensity === "high" && away.attacking_style === "possession"
        ? `${home.country} high-press may disrupt ${away.country} build-up — counter-press opportunities`
        : away.pressing_intensity === "high" && home.attacking_style === "possession"
          ? `${away.country} high-press may disrupt ${home.country} build-up — counter-press opportunities`
          : "Balanced pressing duel expected";
    lines.push(`Press matchup: ${pressVuln}`);
  }

  return lines.join("\n");
}

export function buildPlayerRoleContext(
  countries: string[],
  profiles: PlayerRoleProfile[]
): string {
  if (!profiles.length) return "";

  const byCountry = new Map<string, PlayerRoleProfile[]>();
  for (const p of profiles) {
    const list = byCountry.get(p.country) ?? [];
    list.push(p);
    byCountry.set(p.country, list);
  }

  const lines: string[] = ["\nDFS PLAYER ROLE PROFILES (top rated, confirmed squad):"];
  for (const country of countries) {
    const players = byCountry.get(country);
    if (!players?.length) continue;
    lines.push(`${country}:`);
    for (const p of players.slice(0, 8)) {
      const stats: string[] = [];
      if (p.shots_on_target_per90 != null) stats.push(`SoT/90:${p.shots_on_target_per90}`);
      if (p.key_passes_per90 != null) stats.push(`KP/90:${p.key_passes_per90}`);
      if (p.passes_per90 != null) stats.push(`pass/90:${p.passes_per90}`);
      if (p.tackles_per90 != null) stats.push(`tkl/90:${p.tackles_per90}`);
      const lines2 = `  ${p.player_name} (${p.position}, ${p.club}) | role:${p.dfs_role} | ${stats.join(" ")} | big-game:${p.big_game_rating}/10 | injury:${p.injury_risk}`;
      lines.push(lines2);
    }
  }
  return lines.join("\n");
}

export function buildPressureContext(
  countries: string[],
  profiles: TournamentPressureProfile[]
): string {
  if (!profiles.length) return "";

  const byCountry = new Map<string, TournamentPressureProfile[]>();
  for (const p of profiles) {
    const list = byCountry.get(p.country) ?? [];
    list.push(p);
    byCountry.set(p.country, list);
  }

  const lines: string[] = ["\nTOURNAMENT PRESSURE PROFILES (clutch players):"];
  for (const country of countries) {
    const players = byCountry.get(country);
    if (!players?.length) continue;
    const clutch = players.filter((p) => p.is_clutch_player);
    if (!clutch.length) continue;
    lines.push(`${country} clutch players:`);
    for (const p of clutch) {
      lines.push(
        `  ${p.player_name}: pressure ${p.pressure_rating}/10 | WC ${p.wc_appearances} games, ${p.wc_goals}G ${p.wc_assists}A | GS shots avg:${p.group_stage_avg_shots ?? "n/a"} | KO shots avg:${p.knockout_avg_shots ?? "n/a"} | rotation:${p.rotation_risk}`
      );
    }
  }
  return lines.join("\n");
}

export function buildSetPieceContext(
  countries: string[],
  data: SetPieceData[]
): string {
  if (!data.length) return "";

  const lines: string[] = ["\nSET PIECE DATA:"];
  for (const country of countries) {
    const sp = data.find((d) => d.country === country);
    if (!sp) continue;
    lines.push(
      `${country}: Corners/game:${sp.corners_per_game} (→shot ${(sp.corner_to_shot_conversion * 100).toFixed(0)}%) | Corner taker:${sp.primary_corner_taker ?? "?"} (${sp.corner_delivery_style}) | Target:${sp.corner_target_player ?? "?"} | FK:${sp.primary_fk_taker ?? "?"} (${sp.fk_delivery_style}, direct threat:${sp.direct_fk_threat}) | Pen:${sp.primary_penalty_taker ?? "?"} | DFS score:${sp.set_piece_dfs_score}/10`
    );
  }
  return lines.join("\n");
}

// ── Master context builder ────────────────────────────────────
// Returns a single enriched context string for injection into Claude prompt

export async function buildWcAnalyticsContext(
  homeTeam: string,
  awayTeam: string
): Promise<string> {
  const countries = [homeTeam, awayTeam];

  const [tacticalProfiles, playerRoles, pressureProfiles, setpieceData] =
    await Promise.all([
      getTacticalProfilesForCountries(countries),
      getPlayerRoleProfilesForCountries(countries),
      getTournamentPressureProfilesForCountries(countries),
      getSetPieceDataForCountries(countries),
    ]);

  const tacticalCtx = buildTacticalContext(homeTeam, awayTeam, tacticalProfiles);
  const playerCtx = buildPlayerRoleContext(countries, playerRoles);
  const pressureCtx = buildPressureContext(countries, pressureProfiles);
  const setpieceCtx = buildSetPieceContext(countries, setpieceData);

  const parts = [tacticalCtx, playerCtx, pressureCtx, setpieceCtx].filter(Boolean);
  if (!parts.length) return "";

  return `\n${"=".repeat(60)}\nWC 2026 ADVANCED ANALYTICS\n${"=".repeat(60)}\n${parts.join("\n")}\n${"=".repeat(60)}\n`;
}
