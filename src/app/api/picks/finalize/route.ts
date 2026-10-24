// ============================================================
// SETPIECE — Picks Finalization Route
// Called every 30 minutes by cron (or manually for testing).
// Finds early picks whose kickoff is within 4h, re-asks Claude
// with lineup context, and updates picks in-place to 'final'.
//
// Protected by FINALIZE_SECRET env var.
// Triggered by GitHub Actions cron (see .github/workflows/cron-daily.yml).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getEarlyPicksForFinalization, finalizePickInDB, getUpcomingPicksFromDB } from "@/lib/supabase-picks";
import { createServiceClient } from "@/lib/supabase/service";
import { generateFinalPicks } from "@/lib/picks-generator";
import { getOddsForPick } from "@/lib/odds-api";
import { createFinalPickNotifications } from "@/lib/supabase-notifications";
import { generateLineups } from "@/lib/lineup-generator";
import { saveLineups, lineupsExistForDate } from "@/lib/supabase-lineups";
import type { Pick } from "@/types";
import { parseFixtureId } from "@/lib/fixture-id";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verify secret
  const auth = req.headers.get("authorization");
  const secret = process.env.FINALIZE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runFinalization();
}

// Also handle GET for easy Vercel Cron compatibility
export async function GET(req: NextRequest) {
  const secret = process.env.FINALIZE_SECRET;
  const url = new URL(req.url);
  const token = url.searchParams.get("secret");
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runFinalization();
}

// ── Tavily lineup + injury check ──────────────────────────────────────────────
// Returns { lineupContext, nonStarters } for a given match.
// nonStarters is a lowercase set of player names confirmed not starting.
async function fetchLineupIntel(
  homeTeam: string,
  awayTeam: string,
  competition?: string
): Promise<{
  lineupContext: string;
  nonStarters: Set<string>;
}> {
  const empty = { lineupContext: "", nonStarters: new Set<string>() };
  if (!process.env.TAVILY_API_KEY) return empty;

  try {
    // Competition-scoped: the hardcoded "World Cup 2026" returned nothing
    // useful for club fixtures, so finalization ran without lineup intel.
    const query = [
      `${homeTeam} vs ${awayTeam}`,
      competition?.trim() || "",
      "predicted starting lineup team news injury suspension",
    ]
      .filter(Boolean)
      .join(" ");
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        search_depth: "basic",
      }),
    });
    const data = await res.json();
    const content = (data.results ?? [])
      .map((r: { title: string; content: string }) => `${r.title}\n${r.content}`)
      .join("\n\n")
      .slice(0, 5000);

    if (!content) return empty;

    // Claude Haiku extracts non-starters and lineup notes
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Match: ${homeTeam} vs ${awayTeam}${competition ? ` (${competition})` : ""}

News search results:
${content}

Extract:
1. Players confirmed NOT starting (injured, rested, suspended, or on bench)
2. Players confirmed starting
3. Any relevant injury or fitness doubts

Return JSON only:
{"nonStarters":["exact player name as known"],"starters":["name"],"notes":"1-2 sentence summary of key lineup news"}`,
      }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, ""));
    const nonStarters = new Set<string>(
      (parsed.nonStarters ?? []).map((n: string) => n.toLowerCase())
    );
    const lineupContext = [
      parsed.notes ?? "",
      parsed.starters?.length ? `Confirmed starters: ${parsed.starters.join(", ")}` : "",
      parsed.nonStarters?.length ? `NOT starting: ${parsed.nonStarters.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    return { lineupContext, nonStarters };
  } catch (err) {
    console.error("[finalize] lineup intel error:", err);
    return empty;
  }
}

async function runFinalization() {
  try {
    // 1. Find all early picks eligible for finalization (kickoff within 4h)
    const earlyPicks = await getEarlyPicksForFinalization();

    if (!earlyPicks.length) {
      return NextResponse.json({ finalized: 0, message: "No picks eligible for finalization" });
    }

    console.log(`[finalize] Found ${earlyPicks.length} early picks to finalize`);

    // 2. Group by fixture
    const byFixture = new Map<number, Pick[]>();
    for (const pick of earlyPicks) {
      const fixtureId = parseFixtureId(pick.match.id);
      if (!byFixture.has(fixtureId)) byFixture.set(fixtureId, []);
      byFixture.get(fixtureId)!.push(pick);
    }

    let totalFinalized = 0;
    const fixturesFinalized: number[] = [];
    const matchNames: Record<number, string> = {};
    const pickCounts: Record<number, number> = {};

    for (const [fixtureId, picks] of byFixture) {
      const samplePick = picks[0];
      const { homeTeam, awayTeam } = samplePick.match;
      matchNames[fixtureId] = `${homeTeam} vs ${awayTeam}`;

      // 3. Fetch live lineup + injury intel via Tavily
      const { lineupContext, nonStarters } = await fetchLineupIntel(
        homeTeam,
        awayTeam,
        samplePick.match.competition
      );

      // 4. Void picks for confirmed non-starters immediately
      if (nonStarters.size > 0) {
        const supabase = createServiceClient();
        for (const pick of picks) {
          if (nonStarters.has(pick.player.name.toLowerCase()) && pick.dbId) {
            await supabase.from("picks").update({ result: "void" }).eq("id", pick.dbId);
            console.log(`[finalize] Voided ${pick.player.name} — confirmed non-starter`);
          }
        }
      }

      // Only finalize picks for players still in the lineup
      const activePicks = picks.filter(
        (p) => !nonStarters.has(p.player.name.toLowerCase())
      );
      if (!activePicks.length) continue;

      // 5. Generate final picks via Claude with lineup context injected
      const finalPicks = await generateFinalPicks(activePicks, lineupContext || undefined);
      if (!finalPicks.length) continue;

      // 6. Update each pick in-place, matched by player name + stat category
      let fixtureFinalized = 0;
      for (const finalPick of finalPicks) {
        const earlyPick = activePicks.find(
          (ep) =>
            ep.player.name.toLowerCase() === finalPick.player.name.toLowerCase() &&
            ep.statCategory === finalPick.statCategory
        );
        if (!earlyPick?.dbId) continue;

        // Refresh odds for the final pick
        let odds = earlyPick.odds;
        let impliedProbability = earlyPick.impliedProbability;
        let edgeScore: number | undefined;
        try {
          const oddsData = await getOddsForPick(
            finalPick.player.name,
            finalPick.statCategory,
            finalPick.direction,
            finalPick.match.homeTeam,
            finalPick.match.awayTeam,
            finalPick.match.competition,
            finalPick.confidence
          );
          if (oddsData) {
            odds = oddsData.odds;
            impliedProbability = oddsData.impliedProbability;
            edgeScore = oddsData.edgeScore;
          }
        } catch {
          // Odds refresh failed — keep existing values
        }

        await finalizePickInDB(earlyPick.dbId, {
          confidence: finalPick.confidence,
          confidenceLevel: finalPick.confidenceLevel,
          aiReasoning: finalPick.aiReasoning,
          recentForm: finalPick.recentForm,
          keyStats: finalPick.keyStats,
          isFeatured: finalPick.isFeatured ?? false,
          earlyConfidence: earlyPick.confidence,
          earlyReasoning: earlyPick.aiReasoning,
          odds: odds ?? null,
          impliedProbability: impliedProbability ?? null,
          edgeScore: edgeScore ?? null,
        });

        fixtureFinalized++;
        totalFinalized++;
      }

      if (fixtureFinalized > 0) {
        fixturesFinalized.push(fixtureId);
        pickCounts[fixtureId] = fixtureFinalized;
        console.log(`[finalize] ${fixtureId} (${matchNames[fixtureId]}): ${fixtureFinalized} picks finalized`);
      }
    }

    // 5. Create in-app notifications for followers
    if (fixturesFinalized.length) {
      await createFinalPickNotifications(fixturesFinalized, matchNames, pickCounts);
    }

    // 6. Generate Power Play lineups if not yet created today
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      if (!(await lineupsExistForDate(todayDate))) {
        const allPicks = await getUpcomingPicksFromDB();
        const storedPicks = allPicks.filter((p) => p.dbId);
        if (storedPicks.length >= 2) {
          const rawLineups = await generateLineups(storedPicks);
          if (rawLineups.length > 0) {
            await saveLineups(rawLineups, storedPicks);
          }
        }
      }
    } catch (lineupError) {
      console.error("[finalize] Lineup generation failed (non-critical):", lineupError);
    }

    return NextResponse.json({
      finalized: totalFinalized,
      fixtures: fixturesFinalized,
      matchNames,
    });
  } catch (error) {
    console.error("[finalize] Error:", error);
    return NextResponse.json({ error: "Finalization failed" }, { status: 500 });
  }
}
