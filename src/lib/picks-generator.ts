// ============================================================
// SETPIECE — Two-Stage Claude AI Picks Generator
//
// Stage 1 — EARLY (24h before kickoff):
//   Season stats, form, historical data. Lineups not confirmed.
//   Confidence: 60–82.
//
// Stage 2 — FINAL (4h before kickoff):
//   Called by /api/picks/finalize (cron). Receives early picks as
//   context and asks Claude to revise with lineup/injury context.
//   Confidence: 60–91.
//   Updates picks in-place in Supabase via finalizePickInDB.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { RealFixture } from "./api-football";
import { fetchSquadsForFixtures } from "./api-football";
import type { Pick } from "@/types";
import { getOddsForPick } from "./odds-api";
import {
  storePicksInDB,
  getUpcomingPicksFromDB,
  finalizePickInDB,
  picksExistForFixture,
  logClaudeUsage,
} from "./supabase-picks";
import { determinePickStage } from "./pick-stage";
import { generateLineups } from "./lineup-generator";
import { lineupsExistForDate, saveLineups } from "./supabase-lineups";
import { getWcPlayersForTeams, buildWcSquadContext } from "./supabase-wc";
import { getTacticalProfilesForCountries, computeMatchupRating } from "./supabase-wc-analytics";
import { buildWcAnalyticsContext } from "./supabase-wc-analytics";
import { buildClubPlayerStatsContext } from "./supabase-player-stats";
import { parseFixtureId } from "./fixture-id";
import { clubsInFixtures } from "./club-fixtures";
import {
  getRecentClubForm,
  buildFormContext,
  applyFormRules,
  confidenceCap,
  valuesFor,
  MIN_MATCHES_TO_ENFORCE,
  type FormIndex,
} from "./club-form";
import {
  buildRealPlayerStatsContext,
  getInternationalStats,
  buildPlayerTournamentProfile,
  normalizeName,
  type ClubStats,
} from "./supabase-player-stats";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Line guidance per category, emitted only for categories the data supports.
const CATEGORY_SPECS: Record<string, string> = {
  "Shots on Target": '- Shots on Target     (line: 1.5 or 2.5)                         -> most reliable, clear line',
  "Total Shots": '- Total Shots         (line: 3.5 or 4.5)                         -> high-volume shooters only (avg 4+ shots/90)',
  "Passes Attempted": '- Passes Attempted    (line: 55.5, 70.5, 85.5, 100.5, or 115.5) -> high-touch midfielders only (avg 75+ attempted/90)',
  "Tackles": '- Tackles             (line: 1.5 or 2.5)                         -> defenders (CB/RB/LB/WB) and CDMs averaging 2+ tkl/90 only',
  "Total Match Corners": '- Total Match Corners (line: 8.5, 9.5, or 10.5)                  -> match total corners (both teams combined); set player.name="Match", player.team="[HomeTeam] vs [AwayTeam]", player.position="MATCH"',
  "Total Bookings": '- Total Bookings      (line: 2.5)                                 -> match total yellow cards; set player.name="Bookings", player.team="[HomeTeam] vs [AwayTeam]", player.position="MATCH"',
};

interface RawPick {
  player: { name: string; team: string; position: string };
  match: { homeTeam: string; awayTeam: string };
  statCategory: string;
  line: number;
  direction: "MORE" | "LESS";
  confidence: number;
  shortReasoning: string;
  aiReasoning: string;
  recentForm: string;
  keyStats: { label: string; value: string; trend?: "up" | "down" | "neutral" }[];
}

// ── Shared: map a RawPick to a Pick ───────────────────────
function mapRawPick(raw: RawPick, fixture: RealFixture, index: number, stage: "early" | "final"): Pick | null {
  const confidence = Math.min(stage === "final" ? 91 : 82, Math.max(70, raw.confidence));
  // Drop picks that slipped through below 70% or are entirely estimated
  if (raw.confidence < 70) return null;
  const allEstimated = raw.aiReasoning.toLowerCase().includes("est.") &&
    !raw.keyStats.some(s => !s.value.toLowerCase().includes("est.") && s.value.match(/[\d.]+/));
  if (allEstimated) return null;
  return {
    id: `gen-${fixture.fixtureId}-${stage}-${index}`,
    player: {
      id: `player-${index}`,
      name: raw.player.name,
      team: raw.player.team,
      position: raw.player.position,
    },
    match: {
      id: fixture.id,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      competition: fixture.competition,
      kickoff: fixture.kickoff,
      venue: fixture.venue,
    },
    platform: "Setpiece",
    statCategory: raw.statCategory,
    line: raw.line,
    direction: raw.direction,
    confidence,
    confidenceLevel: confidence >= 80 ? "HIGH" : confidence >= 65 ? "MEDIUM" : "LOW",
    shortReasoning: raw.shortReasoning,
    aiReasoning: raw.aiReasoning,
    recentForm: raw.recentForm,
    keyStats: raw.keyStats,
    stage,
    isLocked: false,
    isFeatured: confidence >= 85,
    createdAt: new Date().toISOString(),
  };
}

// ── Find fixture for a raw pick ────────────────────────────
function matchFixtureForPick(raw: RawPick, fixtures: RealFixture[], fallbackIndex: number): RealFixture {
  return (
    fixtures.find(
      (f) =>
        f.homeTeam.toLowerCase().includes(raw.match.homeTeam.toLowerCase().split(" ")[0]) ||
        raw.match.homeTeam.toLowerCase().includes(f.homeTeam.toLowerCase().split(" ")[0]) ||
        f.awayTeam.toLowerCase().includes(raw.match.awayTeam.toLowerCase().split(" ")[0]) ||
        raw.match.awayTeam.toLowerCase().includes(f.awayTeam.toLowerCase().split(" ")[0])
    ) ?? fixtures[Math.floor(fallbackIndex / 3) % fixtures.length]
  );
}

// ── International form context builder ────────────────────
function buildIntlFormContext(
  intlMap: Map<string, import("./supabase-player-stats").TournamentStats[]>,
  clubMap: Map<string, ClubStats>
): string {
  if (!intlMap.size) return "";

  const lines: string[] = ["INTERNATIONAL TOURNAMENT FORM:"];

  for (const [normName, rows] of intlMap) {
    const club = clubMap.get(normName) ?? null;
    const profile = buildPlayerTournamentProfile(rows, club);
    if (!profile.summary && !profile.isTournamentPerformer) continue;

    const flags: string[] = [];
    if (profile.isTournamentPerformer) flags.push("TOURNAMENT-PERFORMER");
    if (profile.isClubDependent)       flags.push("CLUB-DEPENDENT");

    const score = profile.bestScore > 0 ? `Score:${profile.bestScore}` : null;
    const parts = [
      ...(score ? [score] : []),
      ...(profile.summary ? [profile.summary] : []),
      ...(flags.length ? [`[${flags.join(",")}]`] : []),
    ];
    // Use display name from first row
    const displayName = rows[0]?.player_name ?? normName;
    lines.push(`  ${displayName}: ${parts.join(" | ")}`);
  }

  return lines.length > 1 ? lines.join("\n") : "";
}

// ── Stage 1: Generate early picks ─────────────────────────
export async function generateEarlyPicks(
  fixtures: RealFixture[],
  preloadedSquads?: Map<string, string[]>
): Promise<Pick[]> {
  if (!fixtures.length) return [];

  // Hard stop: filter out fixtures that already have picks in DB
  const existenceChecks = await Promise.all(
    fixtures.map((f) => picksExistForFixture(f.fixtureId))
  );
  const toGenerate = fixtures.filter((_, i) => !existenceChecks[i]);
  if (!toGenerate.length) {
    console.log("[picks-generator] generateEarlyPicks: all fixtures already have picks, skipping");
    return [];
  }
  if (toGenerate.length < fixtures.length) {
    console.log(`[picks-generator] generateEarlyPicks: skipping ${fixtures.length - toGenerate.length} fixtures with existing picks`);
    fixtures = toGenerate;
  }

  // Split into batches of 3 first — fetch squads once for ALL fixtures before batching
  if (fixtures.length > 3) {
    const squadMap = preloadedSquads ?? await fetchSquadsForFixtures(fixtures);
    const batches: RealFixture[][] = [];
    for (let i = 0; i < fixtures.length; i += 3) {
      batches.push(fixtures.slice(i, i + 3));
    }
    const results: Pick[] = [];
    for (const batch of batches) {
      const batchPicks = await generateEarlyPicks(batch, squadMap);
      results.push(...batchPicks);
    }
    return results;
  }

  // League 1 is the FIFA World Cup; everything else this season is club
  // football, which uses a different context builder entirely.
  const isWcBatch = fixtures.some((f) => f.leagueId === 1);
  const isClubBatch = !isWcBatch;

  // ── Club path ───────────────────────────────────────────
  // Built separately rather than bolted onto the WC branch: club
  // fixtures have no national squads, no international tournament
  // history, and (for now) no team tactical profiles.
  let clubCoverage: Awaited<ReturnType<typeof buildClubPlayerStatsContext>> | null = null;
  let clubForm: FormIndex = new Map();
  if (isClubBatch) {
    const clubs = clubsInFixtures(fixtures);
    // Season per-90s are the prior; club_match_stats is the real sample.
    // Empty early in the season, which is expected, not an error.
    [clubCoverage, clubForm] = await Promise.all([
      buildClubPlayerStatsContext(clubs),
      getRecentClubForm(clubs),
    ]);
    if (!clubCoverage.usableCategories.length) {
      console.warn(
        "[picks-generator] club batch has no usable stat categories — skipping. " +
        clubCoverage.suppressedCategories.map((s) => `${s.category}: ${s.reason}`).join("; ")
      );
      return [];
    }
    console.log(
      `[picks-generator] club batch: ${clubCoverage.playersWithData} players with usable stats, ` +
      `categories [${clubCoverage.usableCategories.join(", ")}]` +
      (clubCoverage.clubsWithoutData.length ? `, no data for ${clubCoverage.clubsWithoutData.join(", ")}` : "")
    );
  }

  // Fetch squads for this batch (or use pre-loaded ones)
  const squadMap = preloadedSquads ?? (isWcBatch ? new Map<string, string[]>() : await fetchSquadsForFixtures(fixtures));

  // For WC fixtures: load player profiles + advanced analytics + real scraped stats from DB
  let wcSquadContext = "";
  let wcAnalyticsContext = "";
  let realStatsContext = "";
  let intlFormContext = "";
  let h2hContext = "";
  let playersWithoutData: string[] = [];
  if (isWcBatch) {
    const countries = [...new Set(fixtures.flatMap((f) => [f.homeTeam, f.awayTeam]))];
    const [wcPlayers, realStats, ...analyticsContexts] = await Promise.all([
      getWcPlayersForTeams(countries),
      buildRealPlayerStatsContext(countries),
      ...fixtures.map((f) => buildWcAnalyticsContext(f.homeTeam, f.awayTeam)),
    ]);
    wcSquadContext = buildWcSquadContext(wcPlayers);
    realStatsContext = realStats.context;
    playersWithoutData = realStats.playersWithoutData;
    if (playersWithoutData.length > 0) {
      console.log(`[picks-generator] ${playersWithoutData.length} players have no real DB stats — Claude will use training knowledge for them`);
    }
    if (realStats.playersWithData.length > 0) {
      console.log(`[picks-generator] Real stats loaded for ${realStats.playersWithData.length} players`);
    }
    // Merge per-fixture analytics contexts (deduplicated)
    const seen = new Set<string>();
    wcAnalyticsContext = (analyticsContexts as string[])
      .filter((ctx) => { if (seen.has(ctx)) return false; seen.add(ctx); return true; })
      .join("\n");

    // International tournament stats: fetch all-time tournament history for players
    const allPlayerNames = [...new Set(
      (wcPlayers as { name: string }[]).map((p) => p.name)
    )];
    const intlMap = await getInternationalStats(allPlayerNames);

    // Build club stats lookup (normalizedName → ClubStats) from realStats context
    // We need to re-fetch because buildRealPlayerStatsContext doesn't expose the map
    const { getPlayerStatsForCountries } = await import("./supabase-player-stats");
    const statsMap = await getPlayerStatsForCountries(countries);
    const clubMap = new Map<string, ClubStats>();
    for (const [norm, ps] of statsMap) {
      if (ps.club) clubMap.set(norm, ps.club);
    }

    // Also index intlMap by all name variants for lookup
    const intlMapExpanded = new Map<string, import("./supabase-player-stats").TournamentStats[]>();
    for (const name of allPlayerNames) {
      const variants = [normalizeName(name)];
      for (const v of variants) {
        const rows = intlMap.get(v);
        if (rows?.length) { intlMapExpanded.set(v, rows); break; }
      }
    }

    intlFormContext = buildIntlFormContext(intlMapExpanded, clubMap);
    if (intlFormContext) {
      console.log(`[picks-generator] International tournament data loaded for ${intlMapExpanded.size} players`);
    }

    // H2H context — check wc_fixtures for recent meetings between these nations
    try {
      const { createServiceClient } = await import("./supabase/service");
      const supabase = createServiceClient();
      const h2hLines: string[] = [];
      for (const fix of fixtures) {
        const { data: h2hMatches } = await supabase
          .from("wc_fixtures")
          .select("match_date, home_team, away_team, home_score, away_score, stage")
          .or(
            `and(home_team.eq.${fix.homeTeam},away_team.eq.${fix.awayTeam}),and(home_team.eq.${fix.awayTeam},away_team.eq.${fix.homeTeam})`
          )
          .gte("match_date", new Date(Date.now() - 4 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("match_date", { ascending: false })
          .limit(4);
        if (h2hMatches?.length) {
          h2hLines.push(`H2H ${fix.homeTeam} vs ${fix.awayTeam} (last 4 years):`);
          for (const m of h2hMatches) {
            h2hLines.push(
              `  ${m.match_date} — ${m.home_team} ${m.home_score ?? '?'}–${m.away_score ?? '?'} ${m.away_team} [${m.stage}]`
            );
          }
        }
      }
      if (h2hLines.length) h2hContext = h2hLines.join("\n");
    } catch { /* H2H fetch failed — non-critical */ }
  }

  const squadContext = isClubBatch
    ? `\nSQUAD & REAL 2025-26 CLUB STATS (from FBref — only pick players listed here):\n${clubCoverage!.context}\n`
    : isWcBatch
    ? wcSquadContext || "\n(WC squad data not yet loaded — only pick players you are certain are in this national team; skip if unsure.)\n"
    : squadMap.size > 0
      ? `\nCURRENT 2025-26 REGISTERED SQUADS (from official API — only pick these players):\n${
          [...squadMap.entries()]
            .filter(([team]) => fixtures.some(f => f.homeTeam === team || f.awayTeam === team))
            .map(([team, players]) => `${team}: ${players.join(", ")}`)
            .join("\n")
        }\n`
      : "\n(Squad API unavailable — only pick players you are certain are at this club in 2025-26; if unsure, skip the player.)\n";

  const isWc = isWcBatch;
  const seasonContext = isWc
    ? "World Cup 2026 (June–July 2026, hosted USA/Canada/Mexico, 48 teams)"
    : "2026-27 European club season (opening weeks — no current-season sample yet)";
  // The ceiling rises as real match logs accumulate. Enforced in code by
  // applyFormRules(); stated here so the model aims at the right range.
  const bestLoggedSample = isClubBatch
    ? Math.max(
        0,
        ...[...clubForm.values()].flatMap((f) =>
          (clubCoverage?.usableCategories ?? []).map((c) => valuesFor(f, c).length)
        )
      )
    : 0;
  const clubCap = confidenceCap(bestLoggedSample);
  const confidenceNote = isWc
    ? "Confidence range: 60–82 (tournament football — squad rotation and pressure factors are higher)"
    : bestLoggedSample >= MIN_MATCHES_TO_ENFORCE
      ? `Confidence range: 70–${clubCap}. Players with a 2026-27 match log below may be `
        + `assessed on those real figures; players without one rest on 2025-26 averages `
        + `and must stay at or below 78. Do not exceed ${clubCap}.`
      : "Confidence range: 70–78. This is the opening of a new season: the injected stats are from 2025-26, "
        + "squads have changed in the summer window, and no 2026-27 sample exists yet. Do not exceed 78.";

  const matchList = fixtures
    .map(
      (f, i) =>
        `${i + 1}. ${f.homeTeam} vs ${f.awayTeam} (${f.competition}) — Kickoff: ${new Date(f.kickoff).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST — Venue: ${f.venue}`
    )
    .join("\n");

  const wcStatGuidance = isWc ? `
${realStatsContext
    ? `════════════════════════════════════════════════════════════
REAL PLAYER STATS — SCRAPED FROM FBREF.COM (2024-25 CLUB SEASON)
════════════════════════════════════════════════════════════
STAT USAGE RULES:
1. For players listed below with real data: cite those exact numbers in aiReasoning and use them as the basis for picks.
2. For players NOT listed below: use your training knowledge of the 2024-25 club season — note "est." in aiReasoning when doing so.
3. Players under "NO DATA" may still be picked using your training knowledge; note "est." in aiReasoning.
4. For aiReasoning, cite stats from below when available (e.g. "2.8 shots/90 at Real Madrid this season").
5. For recentForm values, use the shots/90 or relevant stat from below as baseline when available.
════════════════════════════════════════════════════════════
${realStatsContext}
════════════════════════════════════════════════════════════`
    : `No real stats in database yet — use your training knowledge of the 2024-25 club season. Note "est." in aiReasoning when estimating stats.`}

ADDITIONAL CONTEXT (use for tactical reasoning, not raw statistics):
1. Tactical Profiles injected below — formation, pressing style, defensive line, possession%, shots/game for each team, AND defensive vulnerability ratings (wide/central/aerial/set-piece, 1-10 scale, 10=most exposed). Use to determine whose stats are enhanced vs suppressed.
2. Set Piece Data injected below — corner takers, FK takers, penalty takers, DFS set piece scores. Use for Shots on Target and Key Passes picks on set piece specialists.
3. Tournament Pressure Profiles injected below — WC history, pressure ratings (1-10), clutch player flags. Boost confidence 2-5% for pressure_rating ≥ 8.
4. WC Squad Data injected above — caps, international goals/assists per player.
${h2hContext ? `5. HEAD-TO-HEAD (last 4 years):\n${h2hContext}` : ""}

MATCHUP REASONING RULE — MANDATORY:
For EVERY pick, aiReasoning MUST include an explicit matchup sentence comparing player stats to opponent defensive stats. Format:
  "[Player] averages [X] [stat] and today's opponent concedes [Y] [stat]/game — [above/below] their average, [strong/neutral/tough] matchup."
Example: "Vinicius averages 4.1 shots/90 and today's opponent (France) concedes 5.8 shots/game — above his average, strong positive matchup."
Example: "De Bruyne averages 65 passes/90 and today's opponent (Germany) applies high press — tougher passing environment than usual."
Use the 'key_passes_conceded_per_game', 'avg_shots_conceded_per_game', 'wide_vulnerability_rating', 'central_vulnerability_rating' from the Tactical Profiles above.
Never write aiReasoning without referencing the specific opponent's defensive numbers.

For recentForm: derive 5 values from the real stats above (shots/90 or relevant per-90 as baseline ± variance).
For keyStats:
  - "Season Avg": use the exact season stat from the real data above (e.g. "2.8 shots/90 at Real Madrid")
  - "Intl Avg": use intl per-90 from real data above if available; otherwise use club stat as proxy
  - "Hit Last 10": estimate based on the real per-90 stat vs the line — must be 7/10 minimum to generate the pick

TACTICAL CONTEXT RULES:
- High-press defence vs possession attacker: reduce passes line by 1 tier, reduce key passes confidence -3
- Low-block defence: increase shots from aerial/poacher types +10% confidence, reduce runner SoT confidence -5
- Set piece DFS score ≥ 7: always include at least 1 set piece taker prop (SoT or Total Shots) per match
- High-press vs possession player: reduce Passes Attempted line by 1 tier (e.g. 100.5 → 85.5)
- Big-game rating ≥ 9: boost confidence +5 for that player in group stage, +8 in knockout rounds
${intlFormContext ? `
════════════════════════════════════════════════════════════
INTERNATIONAL TOURNAMENT FORM (WC2022 / WC2018 / Euro2024 / Copa2024 / Copa2021)
════════════════════════════════════════════════════════════
Rules for using this data:
- TOURNAMENT-PERFORMER: player scored intl_form_score ≥ 55 in at least one tournament. Boost confidence +3 for their attacking/shooting props. In knockout rounds boost +5.
- CLUB-DEPENDENT: club shots/90 > 2× best intl shots/90. This player outperforms their international record at club level. Reduce attacking prop confidence -5; note in aiReasoning.
- Score (0–100): weight = 20% intl / 80% club in group stage; 35% intl / 65% club in knockout rounds.
- When citing stats in aiReasoning: reference the specific tournament (e.g. "3 goals in 5 WC22 apps shows World Cup pedigree").
- For players with no international data below: rely entirely on club stats and your training knowledge.
${intlFormContext}
════════════════════════════════════════════════════════════` : ""}
` : "";

  const clubStatGuidance = isClubBatch ? `
════════════════════════════════════════════════════════════
CLUB SEASON DATA RULES — READ BEFORE PICKING
════════════════════════════════════════════════════════════
1. The per-90 numbers above are 2025-26 club-season stats. The 2026-27
   season has not produced any data yet. Treat them as a prior, not as
   current form, and never claim a 2026-27 sample you do not have.
2. Players who changed clubs in the 2026 summer window carry a per-90
   earned in a different team and role. If the player's listed club is
   not the club they are playing for in this fixture, SKIP them.
3. Do NOT reference opponent defensive numbers. Club team-level
   defensive data is not available in this prompt, so any "opponent
   concedes X per game" claim would be invented. Base the pick on the
   player's own verified per-90 and minutes instead.
4. Players below 600 minutes last season have been excluded already;
   do not introduce players who are not listed above.
${clubCoverage!.clubsWithoutData.length ? `5. These clubs have NO usable stats and must not receive any pick: ${clubCoverage!.clubsWithoutData.join(", ")}.` : ""}
════════════════════════════════════════════════════════════` : "";

  const formContext = isClubBatch
    ? buildFormContext(clubForm, clubCoverage!.usableCategories)
    : "";

  const allowedCategories = isClubBatch
    ? clubCoverage!.usableCategories
    : ["Shots on Target", "Total Shots", "Passes Attempted", "Tackles", "Total Match Corners", "Total Bookings"];

  const suppressedNote = isClubBatch && clubCoverage!.suppressedCategories.length
    ? `\nCATEGORIES DISABLED THIS WEEK (the underlying data cannot support them — do not generate any):\n`
      + clubCoverage!.suppressedCategories.map((s) => `  - ${s.category}: ${s.reason}`).join("\n") + "\n"
    : "";

  const prompt = `You are Scout, an elite football DFS analyst. It is the ${seasonContext}. Generate EARLY player prop picks for these matches using current season data and tournament context. Lineups NOT yet confirmed — use season-long stats, tactical setup, and historical matchup data.
${squadContext}${wcAnalyticsContext}${wcStatGuidance}${clubStatGuidance}${formContext}${suppressedNote}
MATCHES:
${matchList}

════════════════════════════════════════════════════════════
ALLOWED STAT CATEGORIES ONLY — do not use any others:
════════════════════════════════════════════════════════════
${allowedCategories.map((c) => CATEGORY_SPECS[c] ?? `- ${c}`).join("\n")}

BANNED STAT CATEGORIES — never generate these:
- Goals Scored, Assists, Key Passes, Passes Completed, Fouls Committed (individual), Corners Won (individual), Interceptions, Saves

PASSES ATTEMPTED NOTE: The passes/90 values in the stats below are PASSES COMPLETED. To estimate Passes Attempted, divide by the player's completion rate: use 0.87 for CMs/CDMs (elite passers), 0.83 for wingers/attacking mids, 0.80 for defenders. Only generate a Passes Attempted pick if the estimated attempted average supports a 7/10 hit rate at the chosen line.

════════════════════════════════════════════════════════════
PICK SELECTION RULES — mandatory, no exceptions:
════════════════════════════════════════════════════════════
1. HIT RATE REQUIREMENT: Only pick a player if they have hit this line in at least 7 of their last 10 matches. If hit rate < 7/10, DO NOT generate the pick — skip that player entirely.
2. LINE BUFFER: The chosen line must be at least 20% below the player's average for MORE picks (e.g. if avg is 4.5 shots, line must be ≤ 3.6). Never pick a line that's within 20% of the player's average — there must be a clear buffer.
3. SHOT PICKS: Only pick Total Shots or Shots on Target for players averaging 4+ shots per 90 minutes. Minimum line for Total Shots is 3.5 — never generate a Total Shots pick at 2.5.
4. PASS PICKS: Only pick Passes Attempted for players averaging 75+ passes attempted per 90 minutes (i.e. ~65+ completed/90). Do not pick pass props for players who don't see heavy volume.
5. TACKLE PICKS: Only pick Tackles for defenders (CB, RB, LB, WB) or CDMs averaging 2+ tackles per 90 (tkl/90 in the stats below). Lines are 1.5 or 2.5 only. Do not pick tackles for forwards or attacking midfielders.
6. MATCH PICKS (Corners/Bookings): For Total Match Corners, base the pick on team-level corner rates and formation — teams that press high and attack wide generate more corners. For Total Bookings, pick MORE 2.5 only in high-stakes, physical, or derby-style matchups with tactical fouling. Set player.name="Match" (for corners) or "Bookings" (for bookings), player.team="[HomeTeam] vs [AwayTeam]" with actual team names, player.position="MATCH". Include 1 match pick per fixture maximum.
7. MINIMUM CONFIDENCE: Never generate a pick with confidence below 70. If you cannot justify 70%+ confidence with real data, skip entirely — do not generate the pick.
8. ESTIMATED DATA RULE: If you have no real stats from the DB for a player and must rely entirely on estimated training knowledge, DO NOT generate a pick for them. Only generate picks where at least one real stat (season avg, hit rate, or per-90) is verified from the injected data above. Mark "est." is acceptable as a qualifier for secondary stats, but the primary line justification must be from real data.
9. NO PICK IS BETTER THAN A WEAK PICK: If no player in a match meets all requirements with real data and 70%+ confidence, return [] for that match. Never force a pick to fill a slot.
10. Generate 2-3 picks per match maximum. Quality over quantity — fewer strong picks beat more weak ones.
11. ${confidenceNote}

════════════════════════════════════════════════════════════
OUTPUT RULES:
════════════════════════════════════════════════════════════
${isClubBatch ? "- Every reasoning field must cite ONLY the player's own verified per-90 and minutes from the data above. Do not reference opponent defensive statistics — they are not provided.\n" : ""}- shortReasoning: EXACTLY 1 sentence. One key stat + one contextual factor. Example: "Averaging 3.8 shots/90 this season and faces a side conceding 12.6 shots/game — strong positive matchup." NEVER exceed one sentence.
- aiReasoning: 2–3 sentences. Full analysis — cite stat, line buffer, hit rate, matchup context.
- recentForm: ONLY the last 5 numeric values, comma-separated — NO units or labels. Example: "3, 2, 4, 2, 3"
- keyStats: exactly 3 stats. Always include "Hit Last 10" as one of the three.
- Prefer real stats injected above when available; for players with no DB entry, use your training knowledge and note "est." in aiReasoning.
- If no player meets all requirements for a match, return an empty array [] — do NOT explain why in text.
- NEVER respond with explanatory text. Your entire response must be parseable JSON. No preamble, no explanation.

Return ONLY a valid JSON array (or [] if no picks qualify):
[
  {
    "player": { "name": "string", "team": "string", "position": "string" },
    "match": { "homeTeam": "string", "awayTeam": "string" },
    "statCategory": "string",
    "line": number,
    "direction": "MORE" | "LESS",
    "confidence": number,
    "shortReasoning": "string",
    "aiReasoning": "string",
    "recentForm": "string",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" },
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" },
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" }
    ]
  }
]`;

  const picks = await callClaudeForPicks(prompt, fixtures, "early");
  if (!isClubBatch || !picks.length) return picks;

  // The 7-of-10 rule is enforced here rather than trusted to the prompt:
  // a model asked to self-certify a hit rate will assert one it cannot
  // check. Picks whose logged matches contradict the line are dropped,
  // and confidence is capped by how much real evidence backs each pick.
  const { kept, dropped, adjusted } = applyFormRules(picks, clubForm);
  for (const d of dropped) {
    console.log(
      `[picks-generator] dropped ${d.pick.player.name} (${d.pick.statCategory}): ${d.reason}`
    );
  }
  if (dropped.length || adjusted) {
    console.log(
      `[picks-generator] form rules: ${kept.length} kept, ${dropped.length} dropped, ${adjusted} confidence-capped`
    );
  }
  return kept;
}

// ── Stage 2: Generate final picks (lineup-aware revision) ──
export async function generateFinalPicks(earlyPicks: Pick[], lineupContext?: string): Promise<Pick[]> {
  if (!earlyPicks.length) return [];

  // Group by fixture for cleaner prompt structure
  const fixtureMap = new Map<string, Pick[]>();
  for (const p of earlyPicks) {
    const key = p.match.id;
    if (!fixtureMap.has(key)) fixtureMap.set(key, []);
    fixtureMap.get(key)!.push(p);
  }

  const earlyPicksSummary = earlyPicks
    .map(
      (p) =>
        `- ${p.player.name} (${p.player.team}) | ${p.direction} ${p.line} ${p.statCategory} | Confidence: ${p.confidence}% | Match: ${p.match.homeTeam} vs ${p.match.awayTeam}\n  Early reasoning: ${p.aiReasoning}`
    )
    .join("\n");

  const prompt = `You are Scout. Starting lineups are NOW CONFIRMED. Update the following EARLY picks with final lineup context, injury news, and realistic confidence adjustments.
${lineupContext ? `\nCONFIRMED LINEUP & INJURY INTELLIGENCE (from live news search — treat as authoritative):\n${lineupContext}\n` : ""}
EARLY PICKS TO UPDATE:
${earlyPicksSummary}

ALLOWED STAT CATEGORIES (same as early stage — only these):
Shots on Target, Total Shots, Passes Attempted, Tackles, Total Match Corners, Total Bookings
BANNED: Goals, Assists, Key Passes, Passes Completed, Fouls Committed (individual), Corners Won (individual), Interceptions, Saves

Instructions for FINAL picks:
- Confidence range: 60–91 (you now have confirmed lineup data)
- Increase confidence if the player is confirmed starting + matchup is favourable
- Decrease confidence significantly if the player is benched, injured, or rotation risk is high
- If a player is not starting, drop confidence to 60–65 or switch direction if appropriate
- Update aiReasoning to reflect confirmed lineup + cite hit rate: "Hit X/10 in last 10"
- Keep the same statCategory, line, and direction UNLESS lineup news fundamentally changes the pick
- If a pick no longer meets the 7/10 hit rate rule due to lineup change, drop confidence below 65 and add "AVOID" to reasoning
- Include 3 updated key stats — always include "Hit Last 10" as one

Return ONLY a valid JSON array matching the EXACT same players and picks (one entry per early pick):
[
  {
    "player": { "name": "string", "team": "string", "position": "string" },
    "match": { "homeTeam": "string", "awayTeam": "string" },
    "statCategory": "string",
    "line": number,
    "direction": "MORE" | "LESS",
    "confidence": number,
    "aiReasoning": "string",
    "recentForm": "string",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" },
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" },
      { "label": "string", "value": "string", "trend": "up" | "down" | "neutral" }
    ]
  }
]`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    // Log usage asynchronously (non-blocking)
    logClaudeUsage({
      fixtureCount: fixtureMap.size,
      stage: "final",
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      triggeredBy: process.env.CLAUDE_TRIGGER ?? "unknown",
    }).catch((err) => console.error("[picks-generator] logClaudeUsage failed:", err));

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    const rawPicks: RawPick[] = JSON.parse(clean);

    return rawPicks.map((raw, i): Pick => {
      const earlyPick =
        earlyPicks.find(
          (ep) =>
            ep.player.name.toLowerCase() === raw.player.name.toLowerCase() &&
            ep.statCategory === raw.statCategory
        ) ?? earlyPicks[i] ?? earlyPicks[0];

      const confidence = Math.min(91, Math.max(60, raw.confidence));
      return {
        ...earlyPick,
        confidence,
        confidenceLevel: confidence >= 80 ? "HIGH" : confidence >= 65 ? "MEDIUM" : "LOW",
        aiReasoning: raw.aiReasoning,
        recentForm: raw.recentForm,
        keyStats: raw.keyStats,
        stage: "final",
        isFeatured: confidence >= 85,
        direction: raw.direction,
        line: raw.line,
      };
    });
  } catch (err) {
    console.error("[picks-generator] generateFinalPicks error:", err);
    return [];
  }
}

// ── Internal: call Claude and parse picks ──────────────────
async function callClaudeForPicks(
  prompt: string,
  fixtures: RealFixture[],
  stage: "early" | "final"
): Promise<Pick[]> {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    // Log usage asynchronously (non-blocking)
    logClaudeUsage({
      fixtureCount: fixtures.length,
      stage,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      triggeredBy: process.env.CLAUDE_TRIGGER ?? "unknown",
    }).catch((err) => console.error("[picks-generator] logClaudeUsage failed:", err));

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
    let clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    if (!clean.startsWith("[")) {
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        clean = match[0];
      } else {
        console.warn(`[picks-generator] Claude returned non-JSON for ${stage}:`, clean.slice(0, 120));
        clean = "[]";
      }
    }
    const rawPicks: RawPick[] = JSON.parse(clean);

    return rawPicks
      .map((raw, index) => {
        const fixture = matchFixtureForPick(raw, fixtures, index);
        return mapRawPick(raw, fixture, index, stage);
      })
      .filter((p): p is Pick => p !== null);
  } catch (err) {
    console.error(`[picks-generator] callClaudeForPicks (${stage}) error:`, err);
    return [];
  }
}

// ── Enrich picks with matchup ratings ─────────────────────
async function enrichWithMatchupRatings(picks: Pick[]): Promise<Pick[]> {
  if (!picks.length) return picks;
  // Get all unique opponent teams
  const allTeams = [...new Set(picks.flatMap((p) => [p.match.homeTeam, p.match.awayTeam]))];
  let profiles: import("./supabase-wc-analytics").TeamTacticalProfile[] = [];
  try {
    profiles = await getTacticalProfilesForCountries(allTeams);
  } catch { /* non-critical */ }

  return picks.map((pick) => {
    // Opponent is the team that isn't the player's team
    const opponentTeam =
      pick.player.team === pick.match.homeTeam ? pick.match.awayTeam : pick.match.homeTeam;
    const opponentProfile = profiles.find((p) => p.country === opponentTeam) ?? null;

    // Estimate player's avg stat from recentForm
    const formNums = pick.recentForm
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((n) => !isNaN(n));
    const playerAvg = formNums.length ? formNums.reduce((a, b) => a + b, 0) / formNums.length : null;

    const { rating, context } = computeMatchupRating(pick.statCategory, playerAvg, opponentProfile);
    return { ...pick, matchupRating: rating, matchupContext: context || undefined };
  });
}

// ── Enrich picks with odds ─────────────────────────────────
async function enrichWithOdds(picks: Pick[]): Promise<Pick[]> {
  return Promise.all(
    picks.map(async (pick) => {
      try {
        const oddsData = await getOddsForPick(
          pick.player.name,
          pick.statCategory,
          pick.direction,
          pick.match.homeTeam,
          pick.match.awayTeam,
          pick.match.competition,
          pick.confidence,
          pick.line
        );
        if (oddsData) {
          return {
            ...pick,
            odds: oddsData.odds,
            impliedProbability: oddsData.impliedProbability,
            edgeScore: oddsData.edgeScore,
          };
        }
      } catch {
        // Odds not available — fine
      }
      return pick;
    })
  );
}

// ── Main export: Get or generate picks for upcoming fixtures ─
export async function getOrGeneratePicks(fixtures: RealFixture[]): Promise<Pick[]> {
  // 1. Return existing DB picks
  const existingPicks = await getUpcomingPicksFromDB();

  // 2. Find which fixtures need picks generated now
  const existingFixtureIds = new Set(
    existingPicks.map((p) => parseFixtureId(p.match.id))
  );

  const fixturesToGenerate = fixtures.filter((f) => {
    if (existingFixtureIds.has(f.fixtureId)) {
      // 12-hour staleness check — skip if picks are fresh
      const existingPick = existingPicks.find(
        (p) => parseFixtureId(p.match.id) === f.fixtureId
      );
      if (existingPick) {
        const age = Date.now() - new Date(existingPick.createdAt).getTime();
        if (age < 12 * 60 * 60 * 1000) return false; // fresh — skip
      } else {
        return false;
      }
    }
    const stage = determinePickStage(f.kickoff);
    return stage !== null; // null = too early or match started
  });

  if (!fixturesToGenerate.length) {
    return existingPicks;
  }

  // 3. Separate by stage
  const earlyFixtures = fixturesToGenerate.filter(
    (f) => determinePickStage(f.kickoff) === "early"
  );
  const directFinalFixtures = fixturesToGenerate.filter(
    (f) => determinePickStage(f.kickoff) === "final"
  );

  const generated: Pick[] = [];

  // Generate early picks
  if (earlyFixtures.length) {
    console.log(`[picks-generator] Generating EARLY picks for ${earlyFixtures.length} fixtures`);
    const picks = await generateEarlyPicks(earlyFixtures);
    const withMatchup = await enrichWithMatchupRatings(picks);
    const enriched = await enrichWithOdds(withMatchup);
    await storePicksInDB(enriched);
    generated.push(...enriched);
  }

  // Generate directly-as-final picks (fixture is within 4h, no prior picks)
  if (directFinalFixtures.length) {
    console.log(`[picks-generator] Generating FINAL picks for ${directFinalFixtures.length} fixtures (no early stage)`);
    // Generate as early first, then immediately finalize inline
    const earlyVersions = await generateEarlyPicks(directFinalFixtures);
    const finalVersions = await generateFinalPicks(earlyVersions);
    const markedFinal = finalVersions.map((p) => ({ ...p, stage: "final" as const }));
    const withMatchup = await enrichWithMatchupRatings(markedFinal);
    const enriched = await enrichWithOdds(withMatchup);
    await storePicksInDB(enriched);
    generated.push(...enriched);
  }

  const allPicks = [...existingPicks, ...generated];

  // Auto-generate lineups alongside picks (once per day)
  if (generated.length > 0) {
    const todayDate = new Date().toISOString().split("T")[0];
    const storedPicks = allPicks.filter((p) => p.dbId);
    if (storedPicks.length >= 2 && !(await lineupsExistForDate(todayDate))) {
      try {
        const rawLineups = await generateLineups(storedPicks);
        if (rawLineups.length > 0) await saveLineups(rawLineups, storedPicks);
      } catch (err) {
        console.error("[picks-generator] lineup auto-generation failed:", err);
      }
    }
  }

  return allPicks;
}

