// ============================================================
// SETPIECE — Early pick generation (shared pipeline stage)
//
// Single implementation of "generate early picks for upcoming
// fixtures", used by both entry points:
//   · GET /api/picks/generate      — manual / external trigger
//   · /api/cron/daily job0         — the 30-minute GitHub Actions loop
//
// These were previously two separate implementations. The cron copy
// read wc_fixtures and hardcoded competition "World Cup 2026", so the
// only generator that actually ran on schedule could never produce a
// club pick. Keep this the one place that knows how generation works.
// ============================================================

import { getUpcomingClubFixtures } from "@/lib/club-fixtures";
import { generateEarlyPicks } from "@/lib/picks-generator";
import { determinePickStage } from "@/lib/pick-stage";
import {
  picksExistForFixture,
  storePicksInDB,
  getUpcomingPicksFromDB,
} from "@/lib/supabase-picks";
import { getOddsForPick } from "@/lib/odds-api";
import { generateLineups } from "@/lib/lineup-generator";
import { lineupsExistForDate, saveLineups } from "@/lib/supabase-lineups";
import type { Pick } from "@/types";

export interface GenerateResult {
  generated: number;
  skipped: number;
  fixtures: { fixtureId: number; match: string; kickoff: string }[];
  log: string[];
}

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
        // Odds are optional — a pick without them is still valid
      }
      return pick;
    })
  );
}

/**
 * Generate and store early picks for upcoming club fixtures.
 *
 * Fixtures that already have picks are skipped outright — CLAUDE.md
 * forbids more than one Claude call per fixture per day, and
 * picksExistForFixture() is the guard that enforces it.
 */
export async function runEarlyPickGeneration(
  daysAhead = 7,
  trigger = "cron"
): Promise<GenerateResult> {
  const log: string[] = [];
  const { fixtures: inWindow } = await getUpcomingClubFixtures(daysAhead);

  // Only generate once a fixture is inside the EARLY window (36h out).
  // Without this a 7-day scan generates picks a week ahead on stale form,
  // and picksExistForFixture() then blocks any refresh closer to kickoff —
  // so the pick users see was built on data that is six days old.
  const fixtures = inWindow.filter((f) => determinePickStage(f.kickoff) !== null);
  const tooEarly = inWindow.length - fixtures.length;

  if (!fixtures.length) {
    log.push(
      `picks_generate: no fixtures in the generation window (${tooEarly} still too far out)`
    );
    return { generated: 0, skipped: 0, fixtures: [], log };
  }

  const existenceChecks = await Promise.all(
    fixtures.map((f) => picksExistForFixture(f.fixtureId))
  );
  const toGenerate = fixtures.filter((_, i) => !existenceChecks[i]);
  const skipped = fixtures.length - toGenerate.length;

  if (!toGenerate.length) {
    log.push(`picks_generate: all ${skipped} fixtures already have picks`);
    return { generated: 0, skipped, fixtures: [], log };
  }

  process.env.CLAUDE_TRIGGER = trigger;

  let generated = 0;
  try {
    const picks = await generateEarlyPicks(toGenerate);
    if (picks.length) {
      const enriched = await enrichWithOdds(picks);
      await storePicksInDB(enriched);
      generated = enriched.length;
      log.push(
        `picks_generate: stored ${generated} picks across ${toGenerate.length} fixtures`
      );
    } else {
      log.push(
        `picks_generate: no qualifying picks for ${toGenerate
          .map((f) => `${f.homeTeam} vs ${f.awayTeam}`)
          .join(", ")}`
      );
    }
  } catch (err) {
    log.push(
      `picks_generate: error — ${err instanceof Error ? err.message : String(err)}`
    );
    return { generated: 0, skipped, fixtures: [], log };
  }

  // Lineups are a nice-to-have; never let them fail the generation stage
  if (generated > 0) {
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      if (!(await lineupsExistForDate(todayDate))) {
        const storedPicks = (await getUpcomingPicksFromDB()).filter((p) => p.dbId);
        if (storedPicks.length >= 2) {
          const rawLineups = await generateLineups(storedPicks);
          if (rawLineups.length > 0) await saveLineups(rawLineups, storedPicks);
        }
      }
    } catch (err) {
      log.push(
        `picks_generate: lineup generation failed (non-critical) — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return {
    generated,
    skipped,
    fixtures: toGenerate.map((f) => ({
      fixtureId: f.fixtureId,
      match: `${f.homeTeam} vs ${f.awayTeam}`,
      kickoff: f.kickoff,
    })),
    log,
  };
}
