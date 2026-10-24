// ============================================================
// SETPIECE — Lineup Generator
// Generates 3 Power Play lineups (safe/power/jackpot) from
// today's picks using the Anthropic API.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { Pick } from "@/types";
import type { RawLineup } from "@/lib/supabase-lineups";

const client = new Anthropic();

// Fixed payouts — PrizePicks standard model
const FIXED_PAYOUT: Record<string, number> = {
  safe: 3,
  power: 5,
  jackpot: 20,
};

// Server-side form score (mirrors PickCard client logic)
function pickFormScore(pick: Pick): number {
  const nums = (pick.recentForm.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 5).map(Number);
  const hitStat = (pick.keyStats ?? []).find((s) => /hit.*10|last.*10/i.test(s.label));
  let hits10: number | null = null;
  if (hitStat) {
    const m = hitStat.value.match(/(\d+)\s*\/\s*10/);
    if (m) hits10 = parseInt(m[1]);
  }
  const avgStat = (pick.keyStats ?? []).find((s) =>
    /season.*avg|avg.*season|avg.*p90|^season avg$/i.test(s.label)
  );
  let avgBonus = 0;
  if (avgStat) {
    const avg = parseFloat(avgStat.value.match(/[\d.]+/)?.[0] ?? "");
    if (!isNaN(avg)) avgBonus = (pick.direction === "MORE" ? avg > pick.line : avg < pick.line) ? 10 : 0;
  }
  if (hits10 !== null) return Math.min(100, Math.round((hits10 / 10) * 80 + avgBonus + 10));
  if (!nums.length) return Math.min(100, Math.round(pick.confidence * 0.9));
  const hits5 = nums.filter((n) => (pick.direction === "MORE" ? n > pick.line : n < pick.line)).length;
  return Math.min(100, Math.round((hits5 / nums.length) * 80 + avgBonus + 10));
}

export async function generateLineups(picks: Pick[]): Promise<RawLineup[]> {
  const storedPicks = picks.filter((p) => p.dbId);

  if (storedPicks.length < 2) {
    console.log("[lineup-generator] Not enough stored picks to generate lineups");
    return [];
  }

  // Pre-filter: exclude goals props — only keep allowed stat categories
  const ALLOWED_CATS = ["shots on target", "total shots", "passes completed", "passes", "fouls committed", "fouls", "corners won", "corners"];
  const eligible = storedPicks.filter((p) => {
    const cat = p.statCategory.toLowerCase();
    if (cat.includes("goal")) return false;
    return ALLOWED_CATS.some((allowed) => cat.includes(allowed));
  });

  if (eligible.length < 2) {
    console.log("[lineup-generator] Not enough eligible picks after filtering");
    return [];
  }

  // Detect single-match scenario — relax cross-match constraint
  const uniqueMatches = new Set(eligible.map((p) => p.match.id));
  const singleMatch = uniqueMatches.size === 1;

  const picksJson = JSON.stringify(
    eligible.map((p) => ({
      dbId: p.dbId,
      player: p.player.name,
      team: p.player.team,
      matchId: p.match.id,
      match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
      statCategory: p.statCategory,
      line: p.line,
      direction: p.direction,
      confidence: p.confidence,
      formScore: pickFormScore(p),
    })),
    null,
    2
  );

  const crossMatchRule = singleMatch
    ? `NOTE: All picks today are from the same match (${eligible[0]?.match.homeTeam} vs ${eligible[0]?.match.awayTeam}). The cross-match rule is WAIVED — picks within the same match are allowed. Focus on picking the best individual player props by formScore and confidence.`
    : `- matchId must be unique within each lineup (no two picks from the same match)`;

  const prompt = `You are Setpiece's lineup builder for pick'em parlay contests.

Today's eligible picks (high-probability stats only: Shots on Target, Total Shots, Passes Completed, Fouls Committed, Corners Won):
${picksJson}

formScore (0–100) measures how consistently a player hits this line. 70+ is strong. Picks with formScore below 60 should only appear in Jackpot.

${crossMatchRule}

Build exactly 3 lineups.

────────────────────────────────────────────
SAFE PLAY — 2 picks — fixed payout: 3x
────────────────────────────────────────────
- MINIMUM confidence: 75% AND formScore ≥ 70
- Choose the two highest-confidence, highest-formScore picks only
- Both picks must represent players who hit the line 7+ of last 10 matches
- reasoning: one sentence with specific stat volume and hit rate confirmation

────────────────────────────────────────────
POWER PLAY — 3 picks — fixed payout: 5x
────────────────────────────────────────────
- MINIMUM confidence: 70% AND formScore ≥ 65
- Choose 3 picks that combine high confidence with high form consistency
- reasoning: one sentence with stat volume and form context

────────────────────────────────────────────
JACKPOT — all available picks — fixed payout: 20x
────────────────────────────────────────────
- Include ALL eligible picks
- Theme must reflect the stat type (e.g. "Volume Shooters", "Pass Masters", "Set Piece Earners")
- reasoning format: "Theme Name: one sentence tying picks together by stat type and form data"

────────────────────────────────────────────
RULES:
- No player in more than one lineup
- NEVER include Goals, Assists, Key Passes, Tackles, Interceptions
- confidence: simple average of pick confidences
- estimatedPayout: 0 — overwritten server-side
────────────────────────────────────────────

Output ONLY valid JSON:
{
  "lineups": [
    {
      "type": "safe",
      "pickDbIds": ["uuid1", "uuid2"],
      "estimatedPayout": 0,
      "confidence": 79,
      "reasoning": "One sentence using form/match context only"
    },
    {
      "type": "power",
      "pickDbIds": ["uuid3", "uuid4", "uuid5"],
      "estimatedPayout": 0,
      "confidence": 73,
      "reasoning": "One sentence using form/match context only"
    },
    {
      "type": "jackpot",
      "pickDbIds": ["uuid6", "uuid7", "uuid8", "uuid9", "uuid10"],
      "estimatedPayout": 0,
      "confidence": 67,
      "reasoning": "Theme Name: one sentence explanation using form data"
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as { lineups: RawLineup[] };

    // Validate each lineup has valid pickDbIds referencing eligible picks
    const validLineups = parsed.lineups.filter(
      (l) =>
        Array.isArray(l.pickDbIds) &&
        l.pickDbIds.length >= 2 &&
        l.pickDbIds.every((id) => eligible.some((p) => p.dbId === id))
    );

    // Post-process: fixed payouts and recalculated confidence
    const processed = validLineups.map((lineup) => {
      const linePicks = lineup.pickDbIds
        .map((id) => eligible.find((p) => p.dbId === id))
        .filter((p): p is Pick => p !== undefined);

      const estimatedPayout = FIXED_PAYOUT[lineup.type] ?? 5;

      const confidence =
        linePicks.length > 0
          ? Math.round(
              linePicks.reduce((sum, p) => sum + p.confidence, 0) / linePicks.length
            )
          : lineup.confidence;

      return { ...lineup, estimatedPayout, confidence, combinedEdge: 0 };
    });

    console.log(`[lineup-generator] Generated ${processed.length} lineups`);
    return processed;
  } catch (error) {
    console.error("[lineup-generator] Failed to generate lineups:", error);
    return [];
  }
}
