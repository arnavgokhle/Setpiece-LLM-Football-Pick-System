// ============================================================
// SETPIECE — Force Pick Generation (Testing Only)
// Bypasses the 36h window — generates picks for any fixture.
// Protected by FINALIZE_SECRET (same as finalize route).
// DELETE this file before going to production.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { type RealFixture } from "@/lib/api-football";
import { getUpcomingClubFixtures } from "@/lib/club-fixtures";
import { generateEarlyPicks } from "@/lib/picks-generator";
import { storePicksInDB, picksExistForFixture } from "@/lib/supabase-picks";
import { getOddsForPick } from "@/lib/odds-api";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — pick generation is slow

// Premier League league ID in API-Football
const PL_LEAGUE_ID = 39;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.FINALIZE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const targetDate = url.searchParams.get("date") ?? getThisSunday();
  const leagueId = parseInt(url.searchParams.get("league") ?? String(PL_LEAGUE_ID));

  // Optional: accept hardcoded fixtures in body (for when API plan blocks the date)
  let body: {
    fixtures?: {
      homeTeam: string;
      awayTeam: string;
      kickoff: string;
      competition?: string;
      venue?: string;
      leagueId?: number;
      fixtureId?: number;
    }[];
  } = {};
  try { body = await req.json(); } catch { /* no body */ }

  let targets: RealFixture[];

  if (body.fixtures?.length) {
    // Use caller-supplied fixtures directly
    targets = body.fixtures.map((f, i) => ({
      fixtureId: f.fixtureId ?? 900000 + i,
      id: `manual_${f.fixtureId ?? 900000 + i}`,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      competition: f.competition ?? "Premier League",
      kickoff: f.kickoff,
      venue: f.venue ?? "Venue TBC",
      status: "NS",
      leagueId: f.leagueId ?? 1,
      isFinished: false,
      isLive: false,
    }));
  } else {
    // Fetch from API
    const { fixtures } = await getUpcomingClubFixtures(7);
    targets = fixtures.filter((f) => {
      const fixtureDate = new Date(f.kickoff).toISOString().split("T")[0];
      return fixtureDate === targetDate && f.leagueId === leagueId;
    });
  }

  if (!targets.length) {
    return NextResponse.json({
      error: `No fixtures found for league ${leagueId} on ${targetDate}`,
    });
  }

  // Skip fixtures that already have picks
  const needsPicks = await Promise.all(
    targets.map(async (f) => ({
      fixture: f,
      hasExisting: await picksExistForFixture(f.fixtureId),
    }))
  );
  const toGenerate = needsPicks.filter((x) => !x.hasExisting).map((x) => x.fixture);
  const skipped = needsPicks.filter((x) => x.hasExisting).map((x) => x.fixture);

  console.log(`[force-picks] Generating for ${toGenerate.length} fixtures, skipping ${skipped.length} (already have picks)`);

  // Generate picks bypassing the time window
  const rawPicks = await generateEarlyPicks(toGenerate);

  // Enrich with odds
  const enriched = await Promise.all(
    rawPicks.map(async (pick) => {
      try {
        const odds = await getOddsForPick(
          pick.player.name,
          pick.statCategory,
          pick.direction,
          pick.match.homeTeam,
          pick.match.awayTeam,
          pick.match.competition,
          pick.confidence,
          pick.line
        );
        if (odds) return { ...pick, ...odds };
      } catch { /* odds unavailable */ }
      return pick;
    })
  );

  // Store in Supabase
  await storePicksInDB(enriched);

  return NextResponse.json({
    targetDate,
    fixturesFound: targets.length,
    fixturesGenerated: toGenerate.length,
    fixturesSkipped: skipped.map((f) => `${f.homeTeam} vs ${f.awayTeam}`),
    picksGenerated: enriched.length,
    fixtures: toGenerate.map((f) => ({
      match: `${f.homeTeam} vs ${f.awayTeam}`,
      competition: f.competition,
      kickoff: f.kickoff,
    })),
    picks: enriched.map((p) => ({
      player: p.player.name,
      team: p.player.team,
      pick: `${p.direction} ${p.line} ${p.statCategory}`,
      confidence: `${p.confidence}%`,
      edge: p.edgeScore != null ? `+${p.edgeScore}` : "—",
      reasoning: p.aiReasoning,
    })),
  });
}

function getThisSunday(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
  return sunday.toISOString().split("T")[0];
}
