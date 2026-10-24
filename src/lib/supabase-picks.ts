// ============================================================
// SETPIECE — Picks CRUD (Supabase)
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";
import type { Pick, PickResult, PickStage, KeyStat } from "@/types";
import { parseFixtureId } from "./fixture-id";

// ── DB row shape ───────────────────────────────────────────
interface PickRow {
  id: string;
  fixture_id: number;
  home_team: string;
  away_team: string;
  competition: string;
  kickoff_at: string;
  venue: string;
  player_name: string;
  player_team: string;
  player_position: string;
  stat_category: string;
  line: number;
  direction: "MORE" | "LESS";
  confidence: number;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  ai_reasoning: string;
  short_reasoning: string | null;
  recent_form: string;
  key_stats: { label: string; value: string; trend?: "up" | "down" | "neutral" }[];
  is_featured: boolean;
  odds: number | null;
  implied_probability: number | null;
  edge_score: number | null;
  matchup_rating: 'strong' | 'neutral' | 'tough' | null;
  matchup_context: string | null;
  result: PickResult;
  // Stage columns (added in schema v2)
  stage: PickStage;
  early_confidence: number | null;
  early_reasoning: string | null;
  finalized_at: string | null;
  pick_date: string;
  created_at: string;
}

function rowToPick(row: PickRow): Pick {
  return {
    id: `db-${row.id}`,
    dbId: row.id,
    player: {
      id: `player-${row.id}`,
      name: row.player_name,
      team: row.player_team,
      position: row.player_position,
    },
    match: {
      id: `af_${row.fixture_id}`,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      competition: row.competition,
      kickoff: row.kickoff_at,
      venue: row.venue,
    },
    platform: "Setpiece",
    statCategory: row.stat_category,
    line: row.line,
    direction: row.direction,
    confidence: row.confidence,
    confidenceLevel: row.confidence_level,
    aiReasoning: row.ai_reasoning,
    shortReasoning: row.short_reasoning ?? undefined,
    recentForm: row.recent_form,
    keyStats: row.key_stats ?? [],
    isFeatured: row.is_featured,
    odds: row.odds ?? undefined,
    impliedProbability: row.implied_probability ?? undefined,
    edgeScore: row.edge_score ?? undefined,
    matchupRating: row.matchup_rating ?? undefined,
    matchupContext: row.matchup_context ?? undefined,
    result: row.result,
    // Stage
    stage: row.stage ?? "early",
    earlyConfidence: row.early_confidence ?? undefined,
    earlyReasoning: row.early_reasoning ?? undefined,
    finalizedAt: row.finalized_at ?? undefined,
    isLocked: false,
    createdAt: row.created_at,
  };
}

// ── Get upcoming picks from DB ─────────────────────────────
// Shows picks from last 24h + future so live/recent matches stay visible
export async function getUpcomingPicksFromDB(): Promise<Pick[]> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("result", "pending")
    .gte("kickoff_at", cutoff)
    .gte("confidence", 75)
    .order("kickoff_at", { ascending: true });

  if (error) {
    console.error("[supabase-picks] getUpcomingPicksFromDB:", error.message);
    return [];
  }
  return (data as PickRow[]).map(rowToPick);
}

// ── Get completed picks (for results page — final stage only) ──
// IDs of picks hidden from public results (sub-appearance picks not suitable for display)
const HIDDEN_PICK_IDS = [
  "5b252978-8c14-47f0-98f3-3f367783b905", // Álvarez Booking (came on 76')
  "afb64c21-56b5-480f-b1a3-f07e968ca85a", // Álvarez Passes (came on 76')
  // Brazil vs Morocco void duplicates
  "ca91c5f5-5e88-4b72-98a1-1300d5eccbe7", // Hakimi passes (wrong 19:00 KO)
  "46529707-cad9-4cf0-827b-4d9d5c1320b8", // Richarlison SOT (wrong 19:00 KO)
  "1592cb1e-ba05-4c03-afd0-1b86d612388c", // Morocco Bookings void
  "5a3dad01-9b90-4ff6-91e6-b70073401f18", // Hakimi passes duplicate
  "db91b1e3-845b-4f8d-9169-d0c8340aabcb", // Vinicius Jr duplicate
  "00ee6edf-4145-4199-979f-c23b2af222cb", // Over 10.5 Total Corners duplicate
  "ccb24df8-0ff1-4677-a940-f9427c8145ea", // Total Bookings void
  "cd88f6e3-68b3-4fd6-8151-86130243dabb", // Brazil Over 6.5 Corners — removed yesterday
];

// Track record starts at the World Cup. Picks before this date came from
// the pre-calibration engine (May 2026, confidence floor below 75% and the
// old stat categories) and are not representative of what ships now.
// Raise this to the club-season opener if you'd rather reset the record.
export const TRACK_RECORD_FROM = "2026-06-01T00:00:00Z";

export async function getCompletedPicksFromDB(): Promise<Pick[]> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .in("result", ["won", "lost"])
    .gte("kickoff_at", TRACK_RECORD_FROM)
    .not("id", "in", `(${HIDDEN_PICK_IDS.join(",")})`)
    .lte("kickoff_at", now)
    .order("kickoff_at", { ascending: false });

  if (error) {
    console.error("[supabase-picks] getCompletedPicksFromDB:", error.message);
    return [];
  }
  return (data as PickRow[]).map(rowToPick);
}

// ── Get pending picks for admin (all stages) ──────────────
export async function getPendingPicksFromDB(): Promise<Pick[]> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("result", "pending")
    .lt("kickoff_at", cutoff)
    .order("kickoff_at", { ascending: false });

  if (error) {
    console.error("[supabase-picks] getPendingPicksFromDB:", error.message);
    return [];
  }
  return (data as PickRow[]).map(rowToPick);
}

// ── Picks the auto-grader could not resolve ───────────────
// result='void' keeps them out of the published hit rate (getTrackRecord
// counts only won/lost), so nothing here can move the number while it
// waits for a human call.
export async function getPicksNeedingReview(): Promise<
  (Pick & { gradingEvidence: string | null })[]
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("grading_status", "needs_review")
    .order("kickoff_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[supabase-picks] getPicksNeedingReview:", error.message);
    return [];
  }
  return (data as (PickRow & { grading_evidence: string | null })[]).map((row) => ({
    ...rowToPick(row),
    gradingEvidence: row.grading_evidence ?? null,
  }));
}

// ── Get early picks eligible for finalization ─────────────
// Returns all stage='early' picks whose kickoff is within the next 4h.
export async function getEarlyPicksForFinalization(): Promise<Pick[]> {
  const supabase = createServiceClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select("*")
    .eq("stage", "early")
    .eq("result", "pending")
    .gte("kickoff_at", now.toISOString())
    .lte("kickoff_at", cutoff)
    .order("kickoff_at", { ascending: true });

  if (error) {
    console.error("[supabase-picks] getEarlyPicksForFinalization:", error.message);
    return [];
  }
  return (data as PickRow[]).map(rowToPick);
}

// ── Store generated picks in DB ────────────────────────────
export async function storePicksInDB(picks: Pick[]): Promise<void> {
  if (!picks.length) return;
  const supabase = createServiceClient();

  const rows = picks.map((p) => ({
    fixture_id:          parseFixtureId(p.match.id),
    home_team:           p.match.homeTeam,
    away_team:           p.match.awayTeam,
    competition:         p.match.competition,
    kickoff_at:          p.match.kickoff,
    venue:               p.match.venue,
    player_name:         p.player.name,
    player_team:         p.player.team,
    player_position:     p.player.position,
    stat_category:       p.statCategory,
    line:                p.line,
    direction:           p.direction,
    confidence:          p.confidence,
    confidence_level:    p.confidenceLevel,
    ai_reasoning:        p.aiReasoning,
    short_reasoning:     p.shortReasoning ?? null,
    recent_form:         p.recentForm,
    key_stats:           p.keyStats,
    is_featured:         p.isFeatured ?? false,
    odds:                p.odds ?? null,
    implied_probability: p.impliedProbability ?? null,
    edge_score:          p.edgeScore ?? null,
    result:              "pending",
    stage:               p.stage ?? "early",
    early_confidence:    null,
    early_reasoning:     null,
    finalized_at:        null,
  }));

  const { error } = await supabase.from("picks").insert(rows);
  if (error) console.error("[supabase-picks] storePicksInDB:", error.message);
}

// ── Finalize a pick in-place ────────────────────────────────
// Snapshots early confidence/reasoning, updates to final stage.
export async function finalizePickInDB(
  dbId: string,
  update: {
    confidence: number;
    confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
    aiReasoning: string;
    recentForm: string;
    keyStats: KeyStat[];
    isFeatured: boolean;
    earlyConfidence: number;
    earlyReasoning: string;
    odds?: number | null;
    impliedProbability?: number | null;
    edgeScore?: number | null;
  }
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("picks")
    .update({
      stage:               "final",
      confidence:          update.confidence,
      confidence_level:    update.confidenceLevel,
      ai_reasoning:        update.aiReasoning,
      recent_form:         update.recentForm,
      key_stats:           update.keyStats,
      is_featured:         update.isFeatured,
      early_confidence:    update.earlyConfidence,
      early_reasoning:     update.earlyReasoning,
      finalized_at:        new Date().toISOString(),
      ...(update.odds !== undefined && {
        odds: update.odds,
        implied_probability: update.impliedProbability,
        edge_score: update.edgeScore,
      }),
    })
    .eq("id", dbId);

  if (error) console.error("[supabase-picks] finalizePickInDB:", error.message);
}

// ── Check if picks exist for a fixture (any stage) ─────────
export async function picksExistForFixture(fixtureId: number): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("picks")
    .select("id", { count: "exact", head: true })
    .eq("fixture_id", fixtureId);
  return (count ?? 0) > 0;
}

// ── Check if picks exist for a fixture at a specific stage ──
export async function picksExistForFixtureAtStage(
  fixtureId: number,
  stage: PickStage
): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("picks")
    .select("id", { count: "exact", head: true })
    .eq("fixture_id", fixtureId)
    .eq("stage", stage);
  return (count ?? 0) > 0;
}

// ── Mark a pick result ─────────────────────────────────────
export async function markPickResult(
  pickId: string,
  result: PickResult,
  gradingStatus: "auto" | "needs_review" | "human_confirmed" = "human_confirmed"
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/picks?id=eq.${pickId}`, {
    method: "PATCH",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      result,
      grading_status: gradingStatus,
      graded_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) console.error("[supabase-picks] markPickResult:", res.status, await res.text());
}

// ── Claude usage logging ───────────────────────────────────
export async function logClaudeUsage(params: {
  fixtureCount: number;
  stage: string;
  promptTokens: number;
  completionTokens: number;
  triggeredBy: string;
}): Promise<void> {
  const supabase = createServiceClient();
  const costUsd =
    (params.promptTokens / 1_000_000) * 3 +
    (params.completionTokens / 1_000_000) * 15;
  const { error } = await supabase.from("claude_api_calls").insert({
    fixture_count: params.fixtureCount,
    stage: params.stage,
    prompt_tokens: params.promptTokens,
    completion_tokens: params.completionTokens,
    cost_usd: costUsd,
    triggered_by: params.triggeredBy,
  });
  if (error) console.error("[supabase-picks] logClaudeUsage:", error.message);
}

export async function getDailyClaudeSpend(): Promise<number> {
  const supabase = createServiceClient();
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("claude_api_calls")
    .select("cost_usd")
    .gte("called_at", todayUtc.toISOString());

  if (error) {
    console.error("[supabase-picks] getDailyClaudeSpend:", error.message);
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
}

// ── Track record — final picks only ───────────────────────
// ── Scout context: recent results for AI analysis ─────────
// Returns a compact text summary of the last N settled picks
// so Scout can answer "why did X miss?" without hallucinating.
// ── Search generated picks for Scout ─────────────────────────
// Returns formatted pick data matching a player, team, or match query.
// Also handles "today", "best", "most confident" style questions.
export async function getPicksForScout(query: string): Promise<string> {
  const supabase = createServiceClient();

  // Fetch picks from last 3 days + next 14 days
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("picks")
    .select(
      "player_name, player_team, player_position, home_team, away_team, competition, kickoff_at, stat_category, line, direction, confidence, ai_reasoning, recent_form, key_stats, result, stage, pick_date"
    )
    .gte("kickoff_at", cutoff)
    .lte("kickoff_at", future)
    .order("confidence", { ascending: false });

  if (error || !data?.length) return "";

  const q = query.toLowerCase();
  const today = new Date().toISOString().split("T")[0];

  // Detect intent
  const wantsToday  = /today|tonight|now|this match|current|upcoming/i.test(query);
  const wantsBest   = /best|top|most confident|highest|strongest|recommend/i.test(query);
  const wantsAll    = wantsToday || wantsBest;

  // Extract meaningful search words (length > 3, skip stop-words)
  const stopWords = new Set(["what","your","pick","does","have","with","that","this","show","about","tell","more","less","more","pick","picks","for","the","and","why","did","you","suggest","are","most","tonight"]);
  const words = q.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));

  let relevant: typeof data;

  if (wantsAll) {
    relevant = data.filter(p => p.kickoff_at >= today || p.pick_date === today);
    if (!relevant.length) relevant = data.slice(0, 8);
  } else {
    relevant = data.filter(p =>
      words.some(w =>
        p.player_name.toLowerCase().includes(w) ||
        p.home_team.toLowerCase().includes(w) ||
        p.away_team.toLowerCase().includes(w) ||
        p.player_team.toLowerCase().includes(w) ||
        p.competition.toLowerCase().includes(w)
      )
    );
  }

  if (!relevant.length) {
    // If the user asked about a specific game/player but nothing was found, return a context note
    // so Scout can explain WHY there are no picks rather than staying silent.
    if (words.length > 0 && !wantsAll) {
      return `SETPIECE NO PICKS NOTE: No picks have been generated for this match or player.\nReasons Scout skips a game: (1) No verified FBref per-90 club stats in the DB for the key players in this fixture — estimates alone are never enough. (2) No player cleared the 7/10 historical hit rate filter at a qualifying line. (3) Data constraints: if the only available pass, shot, or tackle numbers are estimates, Scout passes rather than guessing. (4) The match may be too far out or lineups have not been announced. Tell the user exactly this when they ask why.`;
    }
    return "";
  }

  const lines = relevant.slice(0, 8).map(p => {
    const kickoff = new Date(p.kickoff_at).toLocaleString("en-IN", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }) + " IST";
    const keyStatsStr = Array.isArray(p.key_stats)
      ? (p.key_stats as { label: string; value: string }[]).map(k => `${k.label}: ${k.value}`).join(" | ")
      : "";
    const resultStr = p.result && p.result !== "pending" ? ` | Result: ${p.result.toUpperCase()}` : " | Result: PENDING";

    return [
      `PICK: ${p.player_name} (${p.player_team}, ${p.player_position}) — ${p.direction} ${p.line} ${p.stat_category}`,
      `Match: ${p.home_team} vs ${p.away_team} | ${p.competition} | ${kickoff}`,
      `Confidence: ${p.confidence}% | Stage: ${p.stage}${resultStr}`,
      `Scout Reasoning: ${p.ai_reasoning}`,
      `Recent Form (last 5 values): ${p.recent_form}`,
      keyStatsStr ? `Key Stats: ${keyStatsStr}` : "",
    ].filter(Boolean).join("\n");
  });

  const header = wantsAll
    ? `SETPIECE GENERATED PICKS (today / upcoming — ${relevant.length} picks, sorted by confidence):`
    : `SETPIECE GENERATED PICKS matching query (${relevant.length} found):`;

  const picksSection = `${header}\n${"=".repeat(60)}\n${lines.join("\n" + "-".repeat(40) + "\n")}`;

  // When showing today's picks, also append which games were skipped and why
  if (wantsAll) {
    const skippedSection = await getUnpickedGamesContext(relevant);
    if (skippedSection) return `${picksSection}\n\n${skippedSection}`;
  }

  return picksSection;
}

async function getUnpickedGamesContext(pickedRows: { home_team: string; away_team: string }[]): Promise<string> {
  const supabase = createServiceClient();

  // Today's window in UTC (±1 day to account for IST offset)
  const windowStart = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const windowEnd   = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

  const { data: fixtures } = await supabase
    .from("wc_fixtures")
    .select("home_team, away_team, kickoff_at, group_name")
    .gte("kickoff_at", windowStart)
    .lte("kickoff_at", windowEnd)
    .order("kickoff_at", { ascending: true });

  if (!fixtures?.length) return "";

  // Which games already have picks?
  const pickedKeys = new Set(pickedRows.map(p => `${p.home_team}|${p.away_team}`));

  const unpicked = fixtures.filter(
    f => !pickedKeys.has(`${f.home_team}|${f.away_team}`) &&
         !pickedKeys.has(`${f.away_team}|${f.home_team}`)
  );

  if (!unpicked.length) return "";

  // For each unpicked game, check how many wc_players from those teams have FBref data
  const unpickedTeams = [...new Set(unpicked.flatMap(f => [f.home_team, f.away_team]))];

  const { data: wcPlayers } = await supabase
    .from("wc_players")
    .select("name, country, position")
    .in("country", unpickedTeams);

  const playerNames = (wcPlayers ?? []).map(p => p.name.toLowerCase());

  const { data: fbrefPlayers } = playerNames.length
    ? await supabase
        .from("player_club_stats")
        .select("player_name, normalized_name, shots_per90, passes_per90, tackles_per90")
        .in("normalized_name", playerNames)
    : { data: [] };

  const fbrefByName = new Map((fbrefPlayers ?? []).map(p => [p.normalized_name, p]));

  // Build per-game summary
  const gameNotes = unpicked.map(f => {
    const kickoffIST = new Date(f.kickoff_at).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }) + " IST";

    const analyze = (team: string) => {
      const squad = (wcPlayers ?? []).filter(p => p.country === team);
      const withData = squad.filter(p => fbrefByName.has(p.name.toLowerCase()));
      const outfielders = withData.filter(p => p.position !== "GK");
      const bestShooter = outfielders
        .map(p => ({ ...p, shots: fbrefByName.get(p.name.toLowerCase())?.shots_per90 ?? 0 }))
        .sort((a, b) => b.shots - a.shots)[0];
      return { total: squad.length, withData: withData.length, bestShooter };
    };

    const home = analyze(f.home_team);
    const away = analyze(f.away_team);

    const reasons: string[] = [];

    if (home.withData === 0) reasons.push(`${f.home_team}: no FBref club data in DB`);
    else if (home.bestShooter && home.bestShooter.shots < 3)
      reasons.push(`${f.home_team}: best shooter (${home.bestShooter.name}) averages only ${home.bestShooter.shots.toFixed(1)} shots/90 — below 3.5 line threshold`);

    if (away.withData === 0) reasons.push(`${f.away_team}: no FBref club data in DB`);
    else if (away.bestShooter && away.bestShooter.shots < 3)
      reasons.push(`${f.away_team}: best shooter (${away.bestShooter.name}) averages only ${away.bestShooter.shots.toFixed(1)} shots/90 — below 3.5 line threshold`);

    if (!reasons.length) reasons.push("No player cleared the 7/10 hit rate filter at a qualifying line with verified data");

    return `• ${f.home_team} vs ${f.away_team} (${kickoffIST}): ${reasons.join("; ")}`;
  });

  return `GAMES WITH NO PICKS TODAY (Scout passed on these — explain each reason when asked):\n${gameNotes.join("\n")}`;
}

export async function getRecentResultsForScout(limit = 20): Promise<string> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("picks")
    .select(
      "player_name, player_team, stat_category, line, direction, confidence, ai_reasoning, result, kickoff_at, home_team, away_team, competition"
    )
    .in("result", ["won", "lost"])
    .order("kickoff_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return "";

  const lines = data.map((p) => {
    const date = new Date(p.kickoff_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const icon = p.result === "won" ? "✓" : "✗";
    return `${icon} ${p.player_name} (${p.player_team}) — ${p.direction} ${p.line} ${p.stat_category} [${p.confidence}%] — ${p.result.toUpperCase()} — ${p.home_team} vs ${p.away_team} (${p.competition}, ${date}) — Reasoning at pick time: "${p.ai_reasoning}"`;
  });

  const won = data.filter((p) => p.result === "won").length;
  const total = data.length;

  return `RECENT PICK RESULTS (last ${total} settled picks — ${won}W/${total - won}L, ${Math.round((won / total) * 100)}% hit rate):\n${lines.join("\n")}`;
}

// ── WC actual match stats for Scout ───────────────────────────
// Returns real in-game stats from wc_match_stats for players/teams
// mentioned in the query — used when user asks how someone performed.
export async function getWcMatchStatsForScout(query: string): Promise<string> {
  const supabase = createServiceClient();

  const q = query.toLowerCase();

  // Extract candidate tokens: 4+ char words excluding stop words
  const stopWords = new Set(["what","that","this","with","have","they","does","their","from","about","how","did","the","and","for","was","get","got","shots","passes","stats","game","match","play","today","yesterday","last","night"]);
  const tokens = q.split(/\s+/).map(w => w.replace(/[^a-z'-]/g, "")).filter(w => w.length >= 4 && !stopWords.has(w));

  if (!tokens.length) return "";

  // Query last 30 days of match stats
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("wc_match_stats")
    .select("player_name, team, opponent, match_date, minutes, shots, shots_on_target, passes_completed, yellow_cards, goals")
    .gte("match_date", since)
    .order("match_date", { ascending: false });

  if (error || !data?.length) return "";

  // Filter rows matching any token against player name or team
  const relevant = data.filter(r =>
    tokens.some(t =>
      r.player_name.toLowerCase().includes(t) ||
      r.team.toLowerCase().includes(t) ||
      r.opponent.toLowerCase().includes(t)
    )
  );

  if (!relevant.length) return "";

  const lines = relevant.slice(0, 10).map(r => {
    const statParts: string[] = [];
    if (r.shots != null)           statParts.push(`${r.shots} shots`);
    if (r.shots_on_target != null) statParts.push(`${r.shots_on_target} SoT`);
    if (r.passes_completed != null) statParts.push(`${r.passes_completed} passes completed`);
    if (r.yellow_cards)            statParts.push(`${r.yellow_cards} yellow card(s)`);
    if (r.goals)                   statParts.push(`${r.goals} goal(s)`);
    return `${r.player_name} (${r.team}) vs ${r.opponent} on ${r.match_date}: ${statParts.join(", ")} in ${r.minutes ?? 90} min`;
  });

  return `WC 2026 ACTUAL MATCH STATS:\n${lines.join("\n")}`;
}

// ── Upcoming WC fixtures for Scout ────────────────────────────
// Replaces the dead API-Football call — pulls from wc_fixtures table.
export async function getUpcomingWcFixturesForScout(): Promise<string> {
  const supabase = createServiceClient();

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("wc_fixtures")
    .select("home_team, away_team, kickoff_at, group_name")
    .gte("kickoff_at", now.toISOString())
    .lte("kickoff_at", windowEnd)
    .order("kickoff_at", { ascending: true });

  if (error || !data?.length) return "";

  const lines = data.map(f => {
    const kickoff = new Date(f.kickoff_at).toLocaleString("en-IN", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    }) + " IST";
    return `• ${f.home_team} vs ${f.away_team} — Group ${f.group_name} — ${kickoff}`;
  });

  return `UPCOMING WC 2026 FIXTURES (next 3 days):\n${lines.join("\n")}`;
}

export async function getTrackRecord(): Promise<{
  total: number;
  won: number;
  lost: number;
  hitRate: number;
}> {
  const supabase = createServiceClient();

  // All competitions from TRACK_RECORD_FROM onward, voids excluded from
  // win %, hidden picks excluded
  const { data } = await supabase
    .from("picks")
    .select("result")
    .in("result", ["won", "lost"])
    .gte("kickoff_at", TRACK_RECORD_FROM)
    .not("id", "in", `(${HIDDEN_PICK_IDS.join(",")})`);

  const total = data?.length ?? 0;
  const won = data?.filter((p) => p.result === "won").length ?? 0;
  const lost = total - won;
  const hitRate = total > 0 ? Math.round((won / total) * 100) : 0;

  return { total, won, lost, hitRate };
}
