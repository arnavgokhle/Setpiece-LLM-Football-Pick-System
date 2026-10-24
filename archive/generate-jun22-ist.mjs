import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REAL_STATS = `
════════════════════════════════════════════════════════════
REAL PLAYER STATS — 2024-25 CLUB SEASON (FBref)
════════════════════════════════════════════════════════════
RULES:
1. Total Shots min line: 3.5. Only for players averaging 4+ shots/90.
2. Shots on Target lines: 1.5 or 2.5. Only players with 4+ shots/90 AND real SoT data.
3. 20% buffer: line ≤ player_avg × 0.80. Matchup override allowed vs very weak teams.
4. Hit rate ≥ 7/10. Matchup-adjusted estimates allowed with "est." notation.
5. Passes Attempted estimated as passes_completed/90 ÷ 0.87 (CMs/CDMs).
════════════════════════════════════════════════════════════

ARGENTINA:
- Lionel Messi (Inter Miami): shots/90=5.84, SoT/90=2.64
  → Total Shots MORE 3.5: buffer 5.84×0.80=4.67 ≥ 3.5 ✓ — STRONG PICK.
  → vs Austria (FIFA #24), Argentina heavily favoured. Messi at 38 still leads shots.
  → Pick at 79%.

- Alexis Mac Allister (Liverpool): shots/90=1.76, tkl/90=0.915, passes_completed/90 ≈ 65 (est. FBref)
  → passes_attempted/90 est. = 65÷0.87 = 74.7 (CM, box-to-box)
  → Passes Attempted MORE 65.5: est. average 74.7, matchup vs Austria who press but concede possession to Argentina (55.8% avg).
  → Pick at 76% with "est." notation.

- Rodrigo De Paul (Atletico Madrid): CM, passes_completed/90 ≈ 52 (est.) → attempted ≈ 60. Below line threshold. No pick.
- Lautaro Martinez: no FBref data. No shots pick.
- Julian Alvarez: no FBref data. No shots pick.

AUSTRIA:
- Marcel Sabitzer (Dortmund): shots/90=0.99, tkl/90=0.941 — below thresholds. No pick.
- Marko Arnautovic: no shots data in DB. No pick.
- David Alaba: injured, may not play. No pick.

FRANCE:
- Kylian Mbappé (Real Madrid): shots/90=5.06, SoT/90=2.18
  → Total Shots MORE 3.5: buffer 5.06×0.80=4.05 ≥ 3.5 ✓ — STRONG PICK.
  → vs Iraq (FIFA #52) who concede 11.8 shots/game. France will dominate completely.
  → Pick at 82%.

- Ousmane Dembélé (PSG): shots/90=3.81, SoT/90=1.52
  → Below 4.0 shots/90 threshold. Matchup override vs Iraq? shots/90×0.80=3.05 < 3.5 — buffer FAILS even with override.
  → No shots pick for Dembélé.

- Antoine Griezmann (Atletico Madrid): shots/90=2.86 — below threshold. No individual shots pick.
  Corner taker for France. Set pieces are HIGH threat.

- Adrien Rabiot (Marseille): shots/90=1.62, tkl/90=1.095 — below both thresholds. No pick.

IRAQ: No key players in FBref DB. No individual picks.

NORWAY:
- Erling Haaland (Man City): shots/90=3.84, SoT/90=1.80
  → Below 4.0 threshold: 3.84×0.80=3.07 < 3.5 — buffer FAILS for Total Shots.
  → No individual Haaland shots pick (strict rule).
  → Norway/Senegal is an open game — Haaland + Mané both dangerous. Focus on match-level.

SENEGAL:
- Ismaila Sarr (Crystal Palace): shots/90=1.99 — below threshold. No shots pick.
- Nicolas Jackson (Bayern Munich): shots/90=3.4 — below threshold. No shots pick.

JORDAN / ALGERIA:
- No FBref player data for either team in DB.
- No individual picks possible.
════════════════════════════════════════════════════════════`;

const TACTICAL_PROFILES = `
════════════════════════════════════════════════════════════
TEAM TACTICAL PROFILES
════════════════════════════════════════════════════════════
ARGENTINA: formation=4-3-3, FIFA=#1
  avg_shots=14.6/game, avg_shots_conceded=7.8/game, avg_possession=55.8%
  Style: Tiki-taka + Messi brilliance. High set piece threat. Corner taker: Messi.
  vs Austria: Argentina should control 55%+ possession. Messi drives shooting volume.
  Austria concedes 8.7 shots/game but this will be exceeded — Argentina generates 14.6+.
  Expected corners: Argentina 8-11, Austria 3-5 → total 11-16.
  Yellow cards: Austria combative (Sabitzer/Laimer style), Argentina tactical foulers. 3-4 likely.

AUSTRIA: formation=4-2-3-1, FIFA=#24
  avg_shots=13.8/game, avg_shots_conceded=8.7/game, avg_possession=55.4%
  Style: High-press, organised. Sabitzer high work-rate. Set piece threat: MEDIUM (Alaba injured).
  vs Argentina: Will press but lack quality to prevent Argentina's dominance. Physical midfield.
  Yellow cards: will foul Argentina's technical players — Sabitzer/Laimer bookings likely.

FRANCE: formation=4-3-3, FIFA=#2
  avg_shots=14.2/game, avg_shots_conceded=8.3/game, avg_possession=54.1%
  Style: Counter-attack. Mbappé pace on break is primary weapon. Set piece threat: HIGH (Griezmann delivers).
  vs Iraq: France will utterly dominate. Iraq sitting in 4-5-1 deep block.
  Mbappé will run at Iraq's defence repeatedly. France wide attacks → many corners.
  Expected corners: France 10-14, Iraq 1-2 → total 11-16.
  Yellow cards: Iraq will foul to slow France — 2-3 Iraqi + 1-2 French = 3-5 total.

IRAQ: formation=4-2-3-1, FIFA=#52
  avg_shots=10.4/game, avg_shots_conceded=11.8/game, avg_possession=46.4%
  Style: Defensive block, counter. Asian Cup quality. Will sit deep vs France.
  vs France: Expect 5-6 Iraqi yellows attempt to stop Mbappé counters. France set pieces = corners.

NORWAY:
  No profile in DB. Norway known for direct play through Haaland, strong physical midfield.
  FIFA ranking ~37. Premier League quality across squad.
  vs Senegal: Open game expected — both teams attack. Haaland and Mané provide focal points.
  Expected corners: 8-12 total between two attack-minded sides.

SENEGAL: formation=4-2-3-1, FIFA=#20
  avg_shots=11.6/game, avg_shots_conceded=10.4/game, avg_possession=48.8%
  Style: Physical, direct. Mané pace, Sarr width. Set piece: MEDIUM.
  vs Norway: Will not sit ultra-deep. Open, physical contest expected.
  Corners: 8-12 total expected in an open game.

JORDAN / ALGERIA: No profiles in DB. Both teams FIFA ~40-80 range. No reliable pick basis.
════════════════════════════════════════════════════════════`;

const prompt = `You are Scout, an elite football DFS analyst. It is World Cup 2026. Generate picks for today's matches (IST June 22).

${REAL_STATS}
${TACTICAL_PROFILES}

MATCHES (all times IST Jun 22-23):
1. Argentina vs Austria — 22:30 IST Jun 22 (17:00 UTC Jun 22) — Group J — AT&T Stadium
2. France vs Iraq — 02:30 IST Jun 23 (21:00 UTC Jun 22) — Group I — Lincoln Financial Field
3. Norway vs Senegal — 05:30 IST Jun 23 (00:00 UTC Jun 23) — Group I — MetLife Stadium
4. Jordan vs Algeria — 08:30 IST Jun 23 (03:00 UTC Jun 23) — Group J — Lumen Field

════════════════════════════════════════════════════════════
ALLOWED STAT CATEGORIES ONLY:
════════════════════════════════════════════════════════════
- Passes Attempted (line: 55.5–115.5) — CMs/CDMs only, estimated as passes_completed÷0.87
- Total Shots (line: 3.5 minimum) — individual players ONLY if avg 4+ shots/90 with buffer check
- Shots on Target (line: 1.5 or 2.5) — individual players ONLY if 4+ shots/90 AND confirmed SoT data
- Total Match Corners (line: 8.5, 9.5, 10.5) — player.name="Match", player.position="MATCH"
- Total Bookings (line: 2.5) — player.name="Bookings", player.position="MATCH"

════════════════════════════════════════════════════════════
PICK GUIDANCE — generate exactly these 5 picks:
════════════════════════════════════════════════════════════
1. ARGENTINA vs AUSTRIA — MESSI TOTAL SHOTS MORE 3.5 (79%):
   shots/90=5.84, buffer: 5.84×0.80=4.67 ≥ 3.5 ✓. Argentina vs Austria, Messi leads attack.
   Reasoning must compare: "Messi averages 5.84 shots/90 and Austria concede 8.7 shots/game — above their average."

2. ARGENTINA vs AUSTRIA — MAC ALLISTER PASSES ATTEMPTED MORE 65.5 (76%):
   est. passes_completed/90≈65 → attempted≈75. CM for Argentina in a possession-dominant game vs Austria.
   Mark "est." in aiReasoning. Reasoning: Mac Allister in Argentina's midfield gets 70-80 passes attempted vs Austrian press.

3. FRANCE vs IRAQ — MBAPPÉ TOTAL SHOTS MORE 3.5 (82%):
   shots/90=5.06, buffer: 5.06×0.80=4.05 ≥ 3.5 ✓. vs Iraq (FIFA #52, concede 11.8 shots/game), massive mismatch.
   Reasoning must compare Mbappé's avg vs Iraq's conceded.

4. FRANCE vs IRAQ — TOTAL BOOKINGS MORE 2.5 (77%):
   player.name="Bookings", player.position="MATCH". Iraq will foul aggressively to stop Mbappé — 3-5 total yellows expected.

5. NORWAY vs SENEGAL — TOTAL CORNERS MORE 7.5 (75%):
   player.name="Match", player.position="MATCH". Open game between two attack-minded sides — Haaland focal point, Mané wide. 8-12 corners expected.

════════════════════════════════════════════════════════════
MIN CONFIDENCE: 75%. Confidence range: 75–82 for early picks.
MAX 2 picks per match.
Use "est." in aiReasoning when passing stats come from estimated (not confirmed) data.

OUTPUT FORMAT (JSON array only, no other text):
[
  {
    "player": { "name": "string", "team": "string", "position": "string" },
    "match": { "homeTeam": "string", "awayTeam": "string" },
    "statCategory": "string",
    "line": number,
    "direction": "MORE",
    "confidence": number,
    "shortReasoning": "string (1 sentence, data-driven)",
    "aiReasoning": "string (2-3 sentences with exact stats, matchup, hit rate — include 'est.' where applicable)",
    "recentForm": "string (5 values comma-separated)",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" }
    ]
  }
]`;

const fixtures = {
  "Argentina": {
    fixture_id: 900057,
    home_team: "Argentina",
    away_team: "Austria",
    kickoff_at: "2026-06-22T17:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "AT&T Stadium",
  },
  "France": {
    fixture_id: 900059,
    home_team: "France",
    away_team: "Iraq",
    kickoff_at: "2026-06-22T21:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Lincoln Financial Field",
  },
  "Norway": {
    fixture_id: 900060,
    home_team: "Norway",
    away_team: "Senegal",
    kickoff_at: "2026-06-23T00:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "MetLife Stadium",
  },
  "Jordan": {
    fixture_id: 900058,
    home_team: "Algeria",
    away_team: "Jordan",
    kickoff_at: "2026-06-23T03:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Lumen Field",
  },
};

function getFixture(homeTeam, awayTeam) {
  if (fixtures[homeTeam]) return fixtures[homeTeam];
  for (const [, fix] of Object.entries(fixtures)) {
    if (fix.away_team === homeTeam || fix.home_team === awayTeam || fix.away_team === awayTeam) return fix;
  }
  return fixtures["Argentina"];
}

async function main() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: anthropicKey });

  console.log("Calling Claude for picks (Argentina/Austria, France/Iraq, Norway/Senegal)...");
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  let picks;
  try {
    picks = JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) picks = JSON.parse(match[0]);
    else { console.log("RAW:", raw); throw new Error("Could not parse JSON"); }
  }

  console.log(`\nClaude generated ${picks.length} picks:`);
  picks.forEach(p =>
    console.log(`  ${p.player.name} (${p.player.team}) — ${p.direction} ${p.line} ${p.statCategory} — ${p.confidence}% — ${p.match.homeTeam} vs ${p.match.awayTeam}`)
  );

  if (!picks.length) { console.log("No picks generated."); return; }

  const rows = picks.map(p => {
    const fix = getFixture(p.match.homeTeam, p.match.awayTeam);
    const confidence = Math.min(82, Math.max(75, p.confidence));
    return {
      fixture_id: fix.fixture_id,
      home_team: fix.home_team,
      away_team: fix.away_team,
      competition: fix.competition,
      kickoff_at: fix.kickoff_at,
      venue: fix.venue,
      player_name: p.player.name,
      player_team: p.player.team,
      player_position: p.player.position,
      stat_category: p.statCategory,
      line: p.line,
      direction: p.direction,
      confidence,
      confidence_level: confidence >= 80 ? "HIGH" : confidence >= 65 ? "MEDIUM" : "LOW",
      ai_reasoning: p.aiReasoning,
      short_reasoning: p.shortReasoning,
      recent_form: p.recentForm,
      key_stats: p.keyStats,
      is_featured: confidence >= 85,
      result: "pending",
      stage: "early",
    };
  });

  const { error } = await supabase.from("picks").insert(rows);
  if (error) {
    console.error("Insert error:", error.message);
  } else {
    console.log(`\n✓ Stored ${rows.length} picks in Supabase`);
    console.log("\nPick summary:");
    rows.forEach(r => {
      console.log(`  [${r.confidence}%] ${r.player_name} ${r.direction} ${r.line} ${r.stat_category} — ${r.home_team} vs ${r.away_team}`);
    });
  }
}

main().catch(console.error);
