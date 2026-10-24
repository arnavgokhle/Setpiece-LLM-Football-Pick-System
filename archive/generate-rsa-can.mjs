import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const prompt = `You are Scout, an elite WC 2026 DFS analyst. Generate picks for South Africa vs Canada, Round of 32, June 28 2026, SoFi Stadium, Los Angeles. Kickoff 19:00 UTC.

MATCH CONTEXT:
South Africa (Group A winners, FIFA~55): Shocked South Korea 1-0 (Maseko 63'). Organised 4-4-2 low block. avg_shots=10.4/game, avg_shots_conceded=12.6/game in group — weakest defence in group. Their South Korea win had 10 total corners (RSA 4, KOR 6).
Canada (Group B 2nd, FIFA~36): 1-1 Bosnia, 6-0 Qatar (Jonathan David hat-trick), 1-2 Switzerland. Attacking 4-3-3. avg_shots=12.4/game.

PLAYER DATA:
- Jonathan David (Juventus, FW/CF): Juventus 2024-25 shots/90 ~3.0-3.2. WC: scored hat-trick vs Qatar. Canada's focal point. vs South Africa (concede 12.6 shots/game — worst defence in Group A): Canada will push forward all game in knockout.
  → Total Shots MORE 2.5: club avg 3.0 shots/90, buffer 3.0×0.80=2.4 < 2.5 but WC hat-trick form + knockout push = est. 3-4 shots. Pick at 76%.
- Match corners: South Africa vs South Korea had 10 total corners. Canada attacking team. Both teams use wide play. Knockout game = more corners from set pieces.
  → Total Match Corners MORE 7.5: both teams create from wide, knockout tension = 8-10 corners expected. Pick at 76%.

RULES:
- MIN confidence 75%. Confidence range 75-82.
- Every aiReasoning MUST compare player/team stat vs opponent's conceded stat.
- MAX 2 picks.
- Allowed stat categories: Total Shots (line 2.5), Total Match Corners (line 7.5 or 8.5), Total Bookings (line 2.5).

Return ONLY a JSON array, no other text:
[
  {
    "player": { "name": "string", "team": "string", "position": "string" },
    "match": { "homeTeam": "South Africa", "awayTeam": "Canada" },
    "statCategory": "string",
    "line": number,
    "direction": "MORE",
    "confidence": number,
    "shortReasoning": "string (1 sentence)",
    "aiReasoning": "string (2-3 sentences with exact stats and opponent conceded stat)",
    "recentForm": "string (5 comma-separated values)",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up" },
      { "label": "string", "value": "string", "trend": "neutral" },
      { "label": "string", "value": "string", "trend": "up" }
    ]
  }
]`;

async function main() {
  const { data: existing } = await supabase.from("picks").select("id").eq("fixture_id", 900203);
  if (existing?.length) { console.log("Picks already exist for South Africa vs Canada."); return; }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  let picks;
  try { picks = JSON.parse(raw.trim()); }
  catch { const m = raw.match(/\[[\s\S]*\]/); picks = m ? JSON.parse(m[0]) : []; }

  if (!picks.length) { console.log("No picks generated.\n" + raw); return; }
  picks.forEach(p => console.log(`  Pick: ${p.player.name} ${p.direction} ${p.line} ${p.statCategory} — ${p.confidence}%`));

  const rows = picks.map(p => ({
    fixture_id: 900203,
    home_team: "South Africa",
    away_team: "Canada",
    competition: "FIFA World Cup 2026 — Round of 32",
    kickoff_at: "2026-06-28T19:00:00+00:00",
    venue: "SoFi Stadium, Los Angeles",
    player_name: p.player.name,
    player_team: p.player.team,
    player_position: p.player.position,
    stat_category: p.statCategory,
    line: p.line,
    direction: p.direction,
    confidence: Math.min(82, Math.max(75, p.confidence)),
    confidence_level: p.confidence >= 80 ? "HIGH" : "MEDIUM",
    ai_reasoning: p.aiReasoning,
    short_reasoning: p.shortReasoning,
    recent_form: p.recentForm,
    key_stats: p.keyStats,
    is_featured: p.confidence >= 80,
    result: "pending",
    stage: "early",
  }));

  const { error } = await supabase.from("picks").insert(rows);
  if (error) { console.error("Insert error:", error.message); }
  else { console.log(`✓ Stored ${rows.length} picks for South Africa vs Canada`); }
}

main().catch(console.error);
