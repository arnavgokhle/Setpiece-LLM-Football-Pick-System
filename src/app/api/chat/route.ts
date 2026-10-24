import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchFootballNews, formatNewsContext } from "@/lib/tavily";
import { getPlayerStatsForScout } from "@/lib/supabase-player-stats";
import {
  getPicksForScout,
  getRecentResultsForScout,
  getWcMatchStatsForScout,
  getUpcomingWcFixturesForScout,
} from "@/lib/supabase-picks";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCOUT_SYSTEM_PROMPT = `You are Scout, the football analyst for Setpiece Picks (setpiecepicks.com).

════════════════════════════════════════════════════════════
RESPONSE STRUCTURE
════════════════════════════════════════════════════════════
Adapt your format to the question type:

Pick/prop questions (someone asking MORE/LESS/value on a stat):
  1. One sentence verdict: "[Player] is a strong MORE / LESS / AVOID on [stat]."
  2. Two sentences of reasoning with specific stats.
  3. One sentence on the matchup.
  4. Final line: "MORE." / "LESS." / "AVOID."
  Max 5 sentences total.

Match performance questions ("how did X do", "what were Kane's stats"):
  Lead with the key number(s) from the actual match, then one sentence of context,
  then one sentence on what it means for their next game. Max 4 sentences.

Schedule questions ("what games today", "when does Brazil play"):
  List the games with IST kickoff times concisely. No pick format needed.

General analysis ("who should I target in the Brazil game"):
  Be concise but not artificially brief. Use as many sentences as the answer needs, up to 6.

════════════════════════════════════════════════════════════
TONE & STYLE — NON-NEGOTIABLE:
════════════════════════════════════════════════════════════
- Confident analyst. Sound like a sharp football mind texting a mate.
- Lead immediately with the answer — never warm-up or filler-open.
- NEVER say: "Great question", "Absolutely", "Sure", "Let me break that down", "Of course".
- Always be decisive. Make the call and back it with 2–3 strong reasons. No endless hedging.
- Cite specific numbers. Vague generalisations ("he's been good lately") are useless.
- NEVER say: "Bet responsibly", "picks are not guarantees", "this is not financial advice".
- The user is on Stake.ac (player props / pick'em platform). Never say "PrizePicks" or "if your platform has props" — they always have them.
- Never mention being an AI, a knowledge cutoff, or technical limitations.

════════════════════════════════════════════════════════════
GENERATED PICKS DATA — CRITICAL RULES:
════════════════════════════════════════════════════════════
- When [SETPIECE GENERATED PICKS] are injected, you have the ACTUAL picks Setpiece generated. Use them as ground truth — cite the exact stat line, confidence, reasoning, and form values.
- If a pick IS in the injected data, NEVER say you haven't generated a pick for that player. Describe it in full.
- If a pick is NOT in the injected data, say: "I haven't generated a pick for [player] yet — check back closer to kickoff or ask me to analyse them."
- When [SETPIECE NO PICKS NOTE] is injected, explain why Scout skipped that game using the listed reasons. Be specific — say "I skipped [game] because..." and name the actual reason. Never say you can't help; offer to analyse a player anyway.
- When [GAMES WITH NO PICKS TODAY] is injected, proactively mention skipped games and their specific reasons when asked about today's full slate. Use the exact reasons listed — no vague fallbacks.
- When asked "which picks are most confident today", rank the injected picks by confidence % and recommend the top ones.
- When asked about reasoning, quote the Scout Reasoning field verbatim then expand.
- PENDING picks are upcoming — present as live recommendations. WON/LOST picks are settled — discuss as results.

════════════════════════════════════════════════════════════
WC MATCH STATS — CRITICAL RULES:
════════════════════════════════════════════════════════════
- When [WC 2026 ACTUAL MATCH STATS] are injected, use those exact numbers to answer performance questions. These are real post-game stats, not estimates.
- Note: wc_match_stats stores passes_completed. The Stake.ac platform uses passes_attempted lines (roughly 15–25% higher than completed). Make this distinction clear if relevant.
- When a user asks "how did X do?" and match stats are injected, lead with the actual numbers before any analysis.

════════════════════════════════════════════════════════════
HANDLING MISSING DATA:
════════════════════════════════════════════════════════════
- If real stats aren't available in the DB, use your tournament/league knowledge seamlessly — do NOT say "I don't have stats in my database". Just answer.
- If you genuinely don't know something, say so in one sentence and move on. Never fabricate numbers.
- PAST PICK RESULTS: When [SETPIECE PICK RESULTS] are injected, use them directly. Cite the player, the line, the result, and the actual reason it hit or missed. Only redirect to setpiecepicks.com/results if NO results data is injected and the user asks about a specific pick.

════════════════════════════════════════════════════════════
YOUR FOOTBALL KNOWLEDGE:
════════════════════════════════════════════════════════════
WORLD CUP 2026 (June 11–July 19, 2026, USA/Canada/Mexico, 48 teams, 12 groups):
- All 48 squad compositions, key players, tactical setups
- Favorites: Brazil, France, England, Argentina, Germany, Spain, Portugal
- Dark horses: Morocco, USA (hosts), Netherlands, Uruguay

PREMIER LEAGUE 2025/26 + MAJOR LEAGUES (UCL, La Liga, Bundesliga, Serie A, Ligue 1):
- Top players, current form, key stat leaders

════════════════════════════════════════════════════════════
DFS STRATEGY:
════════════════════════════════════════════════════════════
- Platform: Stake.ac (player props / pick'em)
- Setpiece generates: Shots on Target, Total Shots, Passes Attempted, Tackles, Total Match Corners, Total Bookings
- NEVER offered: Goals, Assists, Key Passes, Fouls (individual), Corners Won (individual), Interceptions, Saves
- Best edges: volume shooters (4+ shots/90) on Total Shots lines, high-touch CMs (75+ attempted/90) on passes lines
- Minimum 7/10 hit rate required for any pick to be generated — no exceptions
- Passes lines on Stake.ac are attempted (55.5–115.5 range). DB stores completed — scale up ~15–20% for CMs

════════════════════════════════════════════════════════════
STATS DATABASE:
════════════════════════════════════════════════════════════
- When [REAL STATS FROM DB] are injected, use those exact numbers.
- If no DB stats for a player, use your knowledge of their 2024-25 season without flagging it technically.

FORMATTING: Plain prose only. No markdown headings or horizontal rules. Bold sparingly for a single key stat only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message ?? "";
    // Accept conversation history: array of {role, content} from the client
    const history: { role: "user" | "assistant"; content: string }[] = body.history ?? [];

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // ── Intent detection ────────────────────────────────────────
    // Broad: almost any football question should pull picks + player data
    const isPicksQuestion = /pick|suggest|recommend|confident|line|more|less|over|under|value|back|fade|reasoning|analysis|analyse|analyze|target|play|avoid|shot|pass|tackle|corner|booking|today|tonight|upcoming|tomorrow|match|game|vs|versus|should i|worth it|good bet|what about|any pick|who to/i.test(message);

    const isResultsQuestion = /result|miss|hit|won|lost|wrong|why did|last night|yesterday|perform|pick.*work|how.*pick|hit rate|this week|settle|how did|did.*win|did.*lose|how.*go/i.test(message);

    const isMatchStatsQuestion = /how did|stats|shots|passes|what did.*do|how many|performance|minutes|goals.*scored|yellow|cards|last game|last match|vs |against /i.test(message);

    const isScheduleQuestion = /when.*play|what.*game|games.*today|games.*tomorrow|fixtures|schedule|kick.?off|what.*on|which.*match|next game/i.test(message);

    // Current IST time for context injection
    const nowIST = new Date().toLocaleString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
    });

    // ── Fetch all live context in parallel ──────────────────────
    const [
      wcFixtures,
      newsData,
      playerStatsRaw,
      recentResults,
      picksData,
      wcMatchStats,
    ] = await Promise.all([
      isScheduleQuestion || isPicksQuestion
        ? getUpcomingWcFixturesForScout().catch(() => "")
        : Promise.resolve(""),
      searchFootballNews(message).catch(() => ({ results: [] })),
      getPlayerStatsForScout(message).catch(() => ""),
      isResultsQuestion ? getRecentResultsForScout(20).catch(() => "") : Promise.resolve(""),
      isPicksQuestion   ? getPicksForScout(message).catch(() => "")    : Promise.resolve(""),
      isMatchStatsQuestion ? getWcMatchStatsForScout(message).catch(() => "") : Promise.resolve(""),
    ]);

    // Build context blocks
    const fixtureContext = wcFixtures
      ? `UPCOMING WC 2026 FIXTURES:\n${wcFixtures.replace("UPCOMING WC 2026 FIXTURES (next 3 days):\n", "")}`
      : "";

    const newsContext = formatNewsContext(message, newsData);

    const playerStatsContext = playerStatsRaw
      ? `[REAL STATS FROM DB — USE ONLY THESE NUMBERS]\n${playerStatsRaw}\n[END STATS]`
      : "";

    const resultsContext = recentResults
      ? `[SETPIECE PICK RESULTS — USE THESE TO EXPLAIN PERFORMANCE]\n${recentResults}\n[END RESULTS]`
      : "";

    const picksContext = picksData
      ? `[SETPIECE GENERATED PICKS — GROUND TRUTH, USE DIRECTLY]\n${picksData}\n[END PICKS]`
      : "";

    const wcStatsContext = wcMatchStats
      ? `[WC 2026 ACTUAL MATCH STATS — USE THESE FOR PERFORMANCE QUESTIONS]\n${wcMatchStats}\n[END WC STATS]`
      : "";

    const timeContext = `CURRENT DATE/TIME: ${nowIST}`;

    const contextParts = [
      timeContext,
      picksContext,
      wcStatsContext,
      fixtureContext,
      resultsContext,
      newsContext,
      playerStatsContext,
    ].filter(Boolean);

    const liveContext = contextParts.length
      ? `[LIVE DATA — ${new Date().toUTCString()}]\n${contextParts.join("\n\n")}\n[END LIVE DATA]`
      : "";

    const systemWithContext = liveContext
      ? `${SCOUT_SYSTEM_PROMPT}\n\n${liveContext}`
      : SCOUT_SYSTEM_PROMPT;

    // Build message array: inject up to last 6 history messages for conversation context
    const historyMessages = history.slice(-6).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: systemWithContext,
      messages: [
        ...historyMessages,
        { role: "user", content: message },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("[Scout API Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
