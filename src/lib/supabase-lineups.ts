// ============================================================
// SETPIECE — Lineups DB Operations
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { Lineup, LineupType, LineupStat, Pick } from "@/types";

// Shape returned by the generate function before DB insert
export interface RawLineup {
  type: LineupType;
  pickDbIds: string[];
  combinedEdge: number;
  estimatedPayout: number;
  confidence: number;
  reasoning: string;
}

// ---- Reads ----

export async function lineupsExistForDate(date: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("lineups")
    .select("id", { count: "exact", head: true })
    .eq("matchday", date);
  return (count ?? 0) > 0;
}

export async function getLineupsForDate(date: string): Promise<Lineup[]> {
  const supabase = createServiceClient();

  // Step 1: fetch lineups
  const { data: lineupRows, error } = await supabase
    .from("lineups")
    .select("id, matchday, type, combined_edge, estimated_payout, confidence, reasoning, result, created_at")
    .eq("matchday", date)
    .order("type");

  if (error || !lineupRows?.length) return [];

  // Step 2: fetch lineup_picks for all lineups
  const lineupIds = lineupRows.map((r) => r.id as string);
  const { data: lpRows } = await supabase
    .from("lineup_picks")
    .select("lineup_id, pick_db_id, position")
    .in("lineup_id", lineupIds)
    .order("position");

  // Step 3: fetch picks by ID
  const pickIds = [...new Set((lpRows ?? []).map((lp) => lp.pick_db_id as string))];
  const pickMap = new Map<string, Pick>();
  if (pickIds.length > 0) {
    const { data: pickRows } = await supabase
      .from("picks")
      .select("*")
      .in("id", pickIds);
    for (const row of pickRows ?? []) {
      pickMap.set(row.id as string, rowToPick(row as Record<string, unknown>));
    }
  }

  // Step 4: assemble
  return lineupRows.map((row) => {
    const myLps = (lpRows ?? [])
      .filter((lp) => lp.lineup_id === row.id)
      .sort((a, b) => (a.position as number) - (b.position as number));

    const picks: Pick[] = myLps
      .map((lp) => pickMap.get(lp.pick_db_id as string) ?? null)
      .filter((p): p is Pick => p !== null);

    return {
      id: row.id as string,
      matchday: row.matchday as string,
      type: row.type as LineupType,
      picks,
      combinedEdge: (row.combined_edge as number) ?? 0,
      estimatedPayout: (row.estimated_payout as number) ?? 0,
      confidence: (row.confidence as number) ?? 0,
      reasoning: (row.reasoning as string) ?? "",
      result: (row.result as Lineup["result"]) ?? "pending",
      createdAt: row.created_at as string,
    };
  });
}

export async function getLineupStats(): Promise<Record<LineupType, LineupStat>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lineups")
    .select("type, result")
    .neq("result", "pending")
    .neq("result", "void");

  const init = (): LineupStat => ({ total: 0, won: 0, hitRate: 0 });
  const stats: Record<LineupType, LineupStat> = {
    safe: init(),
    power: init(),
    jackpot: init(),
  };

  for (const row of data ?? []) {
    const t = row.type as LineupType;
    if (!stats[t]) continue;
    stats[t].total++;
    if (row.result === "won") stats[t].won++;
  }

  for (const t of ["safe", "power", "jackpot"] as LineupType[]) {
    const s = stats[t];
    s.hitRate = s.total > 0 ? Math.round((s.won / s.total) * 100) : 0;
  }

  return stats;
}

// ---- Writes ----

export async function deleteLineupsForDate(date: string): Promise<void> {
  const service = createServiceClient();
  // Delete junction rows first (FK constraint)
  const { data: lineupRows } = await service
    .from("lineups")
    .select("id")
    .eq("matchday", date);
  const ids = (lineupRows ?? []).map((r) => r.id as string);
  if (ids.length > 0) {
    await service.from("lineup_picks").delete().in("lineup_id", ids);
    await service.from("lineups").delete().eq("matchday", date);
  }
}

export async function saveLineups(
  rawLineups: RawLineup[],
  allPicks: Pick[]
): Promise<void> {
  const service = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  for (const raw of rawLineups) {
    // Insert lineup row
    const { data: lineupRow, error } = await service
      .from("lineups")
      .insert({
        matchday: today,
        type: raw.type,
        combined_edge: raw.combinedEdge,
        estimated_payout: raw.estimatedPayout,
        confidence: raw.confidence,
        reasoning: raw.reasoning,
        result: "pending",
      })
      .select("id")
      .single();

    if (error || !lineupRow) {
      console.error("[saveLineups] Failed to insert lineup:", error);
      continue;
    }

    // Insert lineup_picks junction rows
    const pickRows = raw.pickDbIds.map((dbId, i) => ({
      lineup_id: lineupRow.id,
      pick_db_id: dbId,
      position: i + 1,
    }));

    const { error: lpError } = await service.from("lineup_picks").insert(pickRows);
    if (lpError) {
      console.error("[saveLineups] Failed to insert lineup_picks:", lpError);
    }
  }
}

// ---- Helpers ----

// Convert a picks DB row to the Pick interface (mirrors rowToPick in supabase-picks.ts)
function rowToPick(row: Record<string, unknown>): Pick {
  return {
    id: row.id as string,
    dbId: row.id as string,
    player: {
      id: row.player_name as string,
      name: row.player_name as string,
      team: row.player_team as string,
      position: (row.player_position as string) ?? "",
      nationality: (row.nationality as string) ?? undefined,
    },
    match: {
      id: `af_${row.fixture_id}`,
      homeTeam: (row.home_team as string) ?? "",
      awayTeam: (row.away_team as string) ?? "",
      competition: (row.competition as string) ?? "",
      kickoff: (row.kickoff_at as string) ?? "",
      venue: (row.venue as string) ?? "",
    },
    platform: "Setpiece",
    statCategory: row.stat_category as string,
    line: row.line as number,
    direction: row.direction as Pick["direction"],
    confidence: row.confidence as number,
    confidenceLevel: row.confidence_level as Pick["confidenceLevel"],
    aiReasoning: (row.ai_reasoning as string) ?? "",
    recentForm: (row.recent_form as string) ?? "",
    keyStats: (row.key_stats as Pick["keyStats"]) ?? [],
    odds: (row.odds as number) ?? undefined,
    impliedProbability: (row.implied_probability as number) ?? undefined,
    edgeScore: (row.edge_score as number) ?? undefined,
    stage: (row.stage as Pick["stage"]) ?? "final",
    isLocked: false,
    result: (row.result as Pick["result"]) ?? undefined,
    createdAt: row.created_at as string,
  };
}
