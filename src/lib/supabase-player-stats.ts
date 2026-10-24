// ============================================================
// SETPIECE — Real Player Stats DB Helpers
// Queries player_club_stats + player_international_stats
// scraped from FBref.com
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";

// ── Name normalization (mirrors scripts/fetch-fbref-stats.ts) ─

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr")
    .replace(/\bii\b/gi, "ii")
    .replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Variants of a name to try when matching (handles Jr/Junior, short vs full names) */
function nameVariants(name: string): string[] {
  const base = normalizeName(name);
  const variants = new Set<string>([base]);

  // Jr ↔ Junior
  variants.add(base.replace(/\bjr\b/, "junior"));
  variants.add(base.replace(/\bjunior\b/, "jr"));

  // Drop suffix particles (de, da, van, etc.)
  variants.add(base.replace(/\b(de|da|van|von|del|dos|el|al)\b/g, "").replace(/\s+/g, " ").trim());

  // First + last name only (drop middle)
  const parts = base.split(" ");
  if (parts.length >= 3) variants.add(`${parts[0]} ${parts[parts.length - 1]}`);

  return [...variants];
}

// ── Types ─────────────────────────────────────────────────────

export interface ClubStats {
  player_name: string;
  club: string;
  league: string | null;
  matches_played: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  passes_per90: number | null;
  tackles_per90: number | null;
  progressive_carries_per90: number | null;
  xg_per90: number | null;
  xag_per90: number | null;
}

export interface IntlStats {
  player_name: string;
  country: string;
  total_caps: number | null;
  international_goals: number | null;
  international_assists: number | null;
  shots_per90_intl: number | null;
  shots_on_target_per90_intl: number | null;
  key_passes_per90_intl: number | null;
  passes_per90_intl: number | null;
  tackles_per90_intl: number | null;
  xg_per90_intl: number | null;
  minutes_per_game_intl: number | null;
  wc_appearances: number;
  wc_goals: number;
  wc_assists: number;
}

/** One row per player per tournament from player_international_stats */
export interface TournamentStats {
  player_name: string;
  normalized_name: string;
  country: string;
  tournament: string;         // 'WC2022', 'WC2018', 'Euro2024', 'Copa2024', 'Copa2021'
  tournament_year: number;
  matches_played: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  xg_per90: number | null;
  progressive_carries_per90: number | null;
  intl_form_score: number | null;
  is_tournament_performer: boolean;
}

/** All tournament rows for a player, keyed by tournament */
export interface PlayerTournamentProfile {
  rows: TournamentStats[];
  bestScore: number;
  isTournamentPerformer: boolean;
  /** True if club shots/90 > 2x best intl shots/90 (shows player underperforms intl) */
  isClubDependent: boolean;
  /** Summary: e.g. "WC22:3apps/2G/0A | Euro24:6apps/3G/1A" */
  summary: string;
}

export interface PlayerStats {
  club: ClubStats | null;
  intl: IntlStats | null;
}

// ── Lookups ───────────────────────────────────────────────────

/**
 * Find club stats for a player by name (tries multiple name variants).
 * Prefers the record with most minutes if multiple clubs exist.
 */
export async function findClubStats(playerName: string): Promise<ClubStats | null> {
  const supabase = createServiceClient();
  const variants = nameVariants(playerName);

  const { data, error } = await supabase
    .from("player_club_stats")
    .select("*")
    .in("normalized_name", variants)
    .eq("season", "2024-25")
    .order("minutes", { ascending: false })
    .limit(5);

  if (error || !data?.length) return null;

  // Return the record with most minutes
  return data[0] as ClubStats;
}

/**
 * Find international stats for a player+country combination.
 */
export async function findIntlStats(playerName: string, country: string): Promise<IntlStats | null> {
  const supabase = createServiceClient();
  const variants = nameVariants(playerName);

  const { data, error } = await supabase
    .from("player_international_stats")
    .select("*")
    .in("normalized_name", variants)
    .eq("country", country)
    .limit(1);

  if (error || !data?.length) {
    // Try without country filter (some country names may not match exactly)
    const { data: anyCountry } = await supabase
      .from("player_international_stats")
      .select("*")
      .in("normalized_name", variants)
      .limit(1);
    return (anyCountry?.[0] as IntlStats) ?? null;
  }

  return data[0] as IntlStats;
}

/**
 * Fetch real stats for all players from a list of countries.
 * Returns map of normalizedName → { club, intl }.
 */
export async function getPlayerStatsForCountries(
  countries: string[]
): Promise<Map<string, PlayerStats>> {
  if (!countries.length) return new Map();
  const supabase = createServiceClient();

  // Get top DFS players from player_role_profiles for these countries
  const { data: profiles } = await supabase
    .from("player_role_profiles")
    .select("player_name, country, club")
    .in("country", countries)
    .eq("wc_squad_confirmed", true)
    .order("big_game_rating", { ascending: false });

  if (!profiles?.length) return new Map();

  // Batch query club stats by normalized name
  const allNorms = profiles.flatMap((p) => nameVariants(p.player_name));
  const { data: clubData } = await supabase
    .from("player_club_stats")
    .select("*")
    .in("normalized_name", [...new Set(allNorms)])
    .eq("season", "2024-25")
    .order("minutes", { ascending: false })
    .limit(5000);

  // Batch query international stats
  const { data: intlData } = await supabase
    .from("player_international_stats")
    .select("*")
    .in("country", countries)
    .in("normalized_name", [...new Set(allNorms)]);

  // Index by normalized name
  const clubIndex = new Map<string, ClubStats>();
  for (const row of (clubData ?? [])) {
    if (!clubIndex.has(row.normalized_name)) {
      clubIndex.set(row.normalized_name, row as ClubStats);
    }
  }

  const intlIndex = new Map<string, IntlStats>();
  for (const row of (intlData ?? [])) {
    intlIndex.set(row.normalized_name, row as IntlStats);
  }

  // Build result map keyed by original player_name normalized
  const result = new Map<string, PlayerStats>();
  for (const p of profiles) {
    const variants = nameVariants(p.player_name);
    let club: ClubStats | null = null;
    let intl: IntlStats | null = null;

    for (const v of variants) {
      if (!club && clubIndex.has(v)) club = clubIndex.get(v)!;
      if (!intl && intlIndex.has(v)) intl = intlIndex.get(v)!;
    }

    result.set(normalizeName(p.player_name), { club, intl });
  }

  return result;
}

// ── Context builders ──────────────────────────────────────────

/**
 * Build the real-stats context string for injection into Claude picks prompt.
 * Returns context text + lists of players with/without data.
 */
export async function buildRealPlayerStatsContext(
  countries: string[]
): Promise<{
  context: string;
  playersWithData: string[];
  playersWithoutData: string[];
}> {
  if (!countries.length) {
    return { context: "", playersWithData: [], playersWithoutData: [] };
  }

  const supabase = createServiceClient();

  // Get DFS player list for these countries
  const { data: profiles } = await supabase
    .from("player_role_profiles")
    .select("player_name, country, position, dfs_role, big_game_rating")
    .in("country", countries)
    .eq("wc_squad_confirmed", true)
    .order("big_game_rating", { ascending: false });

  if (!profiles?.length) {
    return { context: "", playersWithData: [], playersWithoutData: [] };
  }

  const statsMap = await getPlayerStatsForCountries(countries);

  const withData: string[] = [];
  const withoutData: string[] = [];
  const lines: string[] = [];

  // Group by country
  const byCountry = new Map<string, typeof profiles>();
  for (const p of profiles) {
    const list = byCountry.get(p.country) ?? [];
    list.push(p);
    byCountry.set(p.country, list);
  }

  for (const country of countries) {
    const players = byCountry.get(country);
    if (!players?.length) continue;

    lines.push(`\n${country.toUpperCase()} PLAYERS:`);

    for (const p of players) {
      const norm = normalizeName(p.player_name);
      const stats = statsMap.get(norm);

      if (!stats?.club && !stats?.intl) {
        withoutData.push(`${p.player_name} (${p.position})`);
        continue;
      }

      const c = stats.club;
      const intl = stats.intl;
      const parts: string[] = [];

      if (c) {
        if (c.shots_per90 != null)             parts.push(`shots/90:${c.shots_per90}`);
        if (c.shots_on_target_per90 != null)   parts.push(`SoT/90:${c.shots_on_target_per90}`);
        if (c.key_passes_per90 != null)        parts.push(`KP/90:${c.key_passes_per90}`);
        if (c.passes_per90 != null)            parts.push(`passes/90:${c.passes_per90}`);
        if (c.tackles_per90 != null)           parts.push(`tkl/90:${c.tackles_per90}`);
        if (c.xg_per90 != null)               parts.push(`xG/90:${c.xg_per90}`);
        const clubNote = c.goals != null && c.assists != null
          ? ` [${c.goals}G ${c.assists}A in ${c.matches_played ?? "?"} games at ${c.club}]`
          : ` [${c.club}]`;
        lines.push(
          `  ${p.player_name} (${p.position}): ${parts.join(" | ")}${clubNote}`
        );
      }

      if (intl) {
        const intlParts: string[] = [];
        if (intl.shots_on_target_per90_intl != null) intlParts.push(`SoT/90:${intl.shots_on_target_per90_intl}`);
        if (intl.key_passes_per90_intl != null)      intlParts.push(`KP/90:${intl.key_passes_per90_intl}`);
        if (intl.wc_appearances > 0)
          intlParts.push(`WC ${intl.wc_appearances} apps/${intl.wc_goals}G/${intl.wc_assists}A`);
        if (intl.total_caps)
          intlParts.push(`${intl.total_caps} caps`);
        if (intlParts.length) {
          lines.push(`    Intl: ${intlParts.join(" | ")}`);
        }
      }

      withData.push(p.player_name);
    }
  }

  if (withoutData.length) {
    lines.push(`\nNO DB STATS (training knowledge will be used — note "est." in aiReasoning):`);
    lines.push(withoutData.join(", "));
  }

  const context = lines.join("\n");
  return { context, playersWithData: withData, playersWithoutData: withoutData };
}

/**
 * Look up player stats for Scout chatbot — searches by free-text name.
 * Returns a formatted string or empty string if nothing found.
 */
export async function getPlayerStatsForScout(query: string): Promise<string> {
  const supabase = createServiceClient();

  // Extract candidates: multi-word capitalized phrases + any 5+ char word (handles "salah", "mbappe")
  const multiWord = query.match(/\b[A-Z][a-zA-Z'-]+(?:\s+[A-Za-z'-]+){1,3}/g) ?? [];
  const allWords = query
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z'-]/g, ""))
    .filter((w) => w.length >= 5);
  const candidates = [...new Set([...multiWord, ...allWords])];

  if (!candidates.length) return "";

  const results: string[] = [];
  const seen = new Set<string>();

  for (const token of candidates.slice(0, 4)) {
    const variants = nameVariants(token);

    const [{ data: clubRows }, { data: intlRows }] = await Promise.all([
      supabase
        .from("player_club_stats")
        .select("*")
        .in("normalized_name", variants)
        .eq("season", "2024-25")
        .order("minutes", { ascending: false })
        .limit(1),
      supabase
        .from("player_international_stats")
        .select("*")
        .in("normalized_name", variants)
        .order("tournament_year", { ascending: false })
        .limit(5),
    ]);

    if (!clubRows?.length && !intlRows?.length) continue;

    const playerName = clubRows?.[0]?.player_name ?? intlRows?.[0]?.player_name ?? token;
    const dedupKey = normalizeName(playerName);
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const parts: string[] = [];

    // Club stats — 2024-25 season
    if (clubRows?.[0]) {
      const c = clubRows[0];
      const statParts: string[] = [];
      if (c.goals != null)                       statParts.push(`${c.goals}G ${c.assists ?? 0}A in ${c.matches_played ?? "?"}apps`);
      if (c.shots_per90 != null)                 statParts.push(`${Number(c.shots_per90).toFixed(2)} shots/90`);
      if (c.shots_on_target_per90 != null)       statParts.push(`${Number(c.shots_on_target_per90).toFixed(2)} SoT/90`);
      if (c.key_passes_per90 != null)            statParts.push(`${Number(c.key_passes_per90).toFixed(2)} KP/90`);
      if (c.xg_per90 != null)                   statParts.push(`${Number(c.xg_per90).toFixed(3)} xG/90`);
      if (c.passes_per90 != null)               statParts.push(`${Number(c.passes_per90).toFixed(1)} passes/90`);
      if (c.tackles_per90 != null)              statParts.push(`${Number(c.tackles_per90).toFixed(2)} tkl/90`);
      if (c.progressive_carries_per90 != null)  statParts.push(`${Number(c.progressive_carries_per90).toFixed(2)} prog/90`);
      parts.push(`${c.player_name} | ${c.club} (${c.league ?? "?"}) 2024-25: ${statParts.join(", ")}`);
    }

    // Tournament history — new per-tournament schema
    if (intlRows?.length) {
      const tLines = (intlRows as TournamentStats[]).map((r) => {
        const tParts: string[] = [];
        if (r.goals != null) tParts.push(`${r.goals}G/${r.assists ?? 0}A in ${r.matches_played ?? "?"}apps`);
        if (r.shots_per90 != null) tParts.push(`${Number(r.shots_per90).toFixed(2)} shots/90`);
        if (r.intl_form_score != null) tParts.push(`form:${Number(r.intl_form_score).toFixed(0)}`);
        return `${r.tournament}(${r.country}): ${tParts.join(", ")}${r.is_tournament_performer ? " ★" : ""}`;
      });
      parts.push(`Tournament history: ${tLines.join(" | ")}`);
    }

    if (parts.length) results.push(parts.join("\n"));
  }

  return results.join("\n\n");
}

// ── International tournament stats ────────────────────────────

/**
 * Batch-fetch all tournament rows from player_international_stats for a list of players.
 * Returns Map<normalizedName, TournamentStats[]> — all tournaments per player.
 */
export async function getInternationalStats(
  playerNames: string[]
): Promise<Map<string, TournamentStats[]>> {
  if (!playerNames.length) return new Map();
  const supabase = createServiceClient();

  const allNorms = [...new Set(playerNames.flatMap((n) => nameVariants(n)))];

  const { data, error } = await supabase
    .from("player_international_stats")
    .select("*")
    .in("normalized_name", allNorms);

  if (error || !data?.length) return new Map();

  const result = new Map<string, TournamentStats[]>();
  for (const row of data as TournamentStats[]) {
    const key = row.normalized_name;
    if (!result.has(key)) result.set(key, []);
    result.get(key)!.push(row);
  }
  return result;
}

/**
 * Build a PlayerTournamentProfile for a player from their tournament rows + club stats.
 */
export function buildPlayerTournamentProfile(
  tournamentRows: TournamentStats[],
  clubStats: ClubStats | null
): PlayerTournamentProfile {
  const rows = tournamentRows.sort((a, b) => (b.tournament_year ?? 0) - (a.tournament_year ?? 0));
  const bestScore = Math.max(0, ...rows.map((r) => r.intl_form_score ?? 0));
  const isTournamentPerformer = rows.some((r) => r.is_tournament_performer) || bestScore >= 55;

  // Club-dependent: club shots/90 > 2× best intl shots/90
  const bestIntlShots = Math.max(0, ...rows.map((r) => r.shots_per90 ?? 0));
  const clubShots = clubStats?.shots_per90 ?? 0;
  const isClubDependent =
    bestIntlShots > 0 && clubShots > 0 && clubShots > bestIntlShots * 2;

  const summaryParts = rows
    .filter((r) => (r.matches_played ?? 0) > 0)
    .map((r) => {
      const t = r.tournament.replace("20", "'"); // "WC2022" → "WC'22"
      return `${t}:${r.matches_played}apps/${r.goals ?? 0}G/${r.assists ?? 0}A`;
    });

  return {
    rows,
    bestScore,
    isTournamentPerformer,
    isClubDependent,
    summary: summaryParts.join(" | "),
  };
}

// ── Club-season context (2026-27 pivot) ───────────────────────
//
// The World Cup path keys everything off `country` via
// player_role_profiles. Club football has no equivalent roster table,
// so this reads player_club_stats directly by club.

export interface ClubStatsCoverage {
  context: string;
  /** Categories the data can actually support right now. */
  usableCategories: string[];
  /** Categories suppressed, with the reason, for prompt honesty. */
  suppressedCategories: { category: string; reason: string }[];
  playersWithData: number;
  clubsWithoutData: string[];
}

/** Minutes above a single league season are corrupt scrape rows. */
const MAX_SEASON_MINUTES = 3420;
/** Below this, per-90 rates are too noisy to support a hit-rate claim. */
const MIN_MINUTES_FOR_PICKS = 600;

/**
 * Build the real-stats context for a set of clubs.
 *
 * Deliberately conservative: rows with impossible minutes are dropped,
 * low-minute players are excluded, and any stat column that is broadly
 * null is reported as unusable rather than silently producing picks
 * the underlying data cannot justify.
 */
export async function buildClubPlayerStatsContext(
  clubs: string[]
): Promise<ClubStatsCoverage> {
  const empty: ClubStatsCoverage = {
    context: "",
    usableCategories: [],
    suppressedCategories: [],
    playersWithData: 0,
    clubsWithoutData: clubs,
  };
  if (!clubs.length) return empty;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("player_club_stats")
    .select("player_name, club, minutes, matches_played, shots_per90, shots_on_target_per90, passes_per90, tackles_per90")
    .in("club", clubs)
    .order("minutes", { ascending: false })
    .limit(2000);

  if (error || !data?.length) {
    if (error) console.error("[player-stats] buildClubPlayerStatsContext:", error.message);
    return empty;
  }

  type Row = {
    player_name: string; club: string;
    minutes: number | null; matches_played: number | null;
    shots_per90: number | null; shots_on_target_per90: number | null;
    passes_per90: number | null; tackles_per90: number | null;
  };

  const rows = (data as Row[]).filter(
    (r) =>
      typeof r.minutes === "number" &&
      r.minutes >= MIN_MINUTES_FOR_PICKS &&
      r.minutes <= MAX_SEASON_MINUTES
  );

  // Column-level coverage decides which categories may be generated.
  const cov = (k: keyof Row) => rows.filter((r) => typeof r[k] === "number" && (r[k] as number) > 0).length / (rows.length || 1);
  const shotsCov = cov("shots_per90");
  const sotCov = cov("shots_on_target_per90");
  const passCov = cov("passes_per90");
  const tackleCov = cov("tackles_per90");

  const usable: string[] = [];
  const suppressed: { category: string; reason: string }[] = [];

  if (sotCov >= 0.5) usable.push("Shots on Target");
  else suppressed.push({ category: "Shots on Target", reason: `only ${Math.round(sotCov * 100)}% of players have shots_on_target_per90` });

  if (shotsCov >= 0.5) usable.push("Total Shots");
  else suppressed.push({ category: "Total Shots", reason: `only ${Math.round(shotsCov * 100)}% of players have shots_per90` });

  if (passCov >= 0.5) usable.push("Passes Attempted");
  else suppressed.push({ category: "Passes Attempted", reason: `passes_per90 is ${Math.round((1 - passCov) * 100)}% null — cannot estimate attempted passes` });

  // Tackle rates in the current scrape sit around half their true value
  // (p99 = 2.29 tkl/90 where real elite ball-winners exceed 3.5), so the
  // "2+ tkl/90" rule only ever selects low-minute outliers.
  if (tackleCov >= 0.5 && rows.filter((r) => (r.tackles_per90 ?? 0) >= 2).length >= 10) {
    usable.push("Tackles");
  } else {
    suppressed.push({ category: "Tackles", reason: "tackles_per90 is under-scaled and player_club_stats has no position column, so the defender/CDM restriction cannot be enforced" });
  }

  // Match-level markets need team-level conceded/discipline data, which
  // has no club rows yet (team_tactical_profiles is national teams only).
  suppressed.push({ category: "Total Match Corners", reason: "no club-level team data in team_tactical_profiles" });
  suppressed.push({ category: "Total Bookings", reason: "no club-level team data in team_tactical_profiles" });

  const byClub = new Map<string, Row[]>();
  for (const r of rows) {
    const list = byClub.get(r.club) ?? [];
    list.push(r);
    byClub.set(r.club, list);
  }

  const lines: string[] = [];
  for (const club of clubs) {
    const players = byClub.get(club);
    if (!players?.length) continue;
    lines.push(`\n${club.toUpperCase()}:`);
    for (const p of players.slice(0, 14)) {
      const parts = [
        `${p.minutes}min/${p.matches_played ?? "?"}app`,
        p.shots_per90 != null ? `${p.shots_per90} sh/90` : null,
        p.shots_on_target_per90 != null ? `${p.shots_on_target_per90} sot/90` : null,
        p.tackles_per90 != null ? `${p.tackles_per90} tkl/90` : null,
      ].filter(Boolean);
      lines.push(`  ${p.player_name}: ${parts.join(" | ")}`);
    }
  }

  return {
    context: lines.join("\n"),
    usableCategories: usable,
    suppressedCategories: suppressed,
    playersWithData: rows.length,
    clubsWithoutData: clubs.filter((c) => !byClub.has(c)),
  };
}
