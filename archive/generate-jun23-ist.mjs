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
3. 20% buffer: line ≤ player_avg × 0.80. Matchup override allowed vs weak teams.
4. Hit rate ≥ 7/10.
5. Passes Attempted estimated as passes_completed/90 ÷ 0.87 (CMs). Mark "est." in aiReasoning.
════════════════════════════════════════════════════════════

PORTUGAL:
- Cristiano Ronaldo (Al-Nassr): shots/90=5.16, SoT/90=2.39
  → Total Shots MORE 3.5: buffer 5.16×0.80=4.13 ≥ 3.5 ✓ — STRONG PICK.
  → vs Uzbekistan (FIFA ~75, very weak). Ronaldo will shoot heavily in a dominant Portugal win.
  → Pick at 81%.

- Bruno Fernandes (Man Utd): shots/90=2.5 — below threshold. Corner taker for Portugal.
  → No individual shots pick. Set piece delivery role noted.

- Rafael Leão (Milan): shots/90=3.06 — below 4.0 threshold. No shots pick.

UZBEKISTAN: No players in FBref DB. No individual picks possible.

ENGLAND:
- Harry Kane (Bayern Munich): shots/90=4.51, SoT/90=2.54
  → Total Shots MORE 3.5: buffer 4.51×0.80=3.61 ≥ 3.5 ✓ — STRONG PICK.
  → vs Ghana (FIFA #54, concede 11.6 shots/game). Kane will be England's focal point.
  → Pick at 80%.

- Bukayo Saka (Arsenal): shots/90=2.88 — below threshold. No shots pick.
- Jude Bellingham (Real Madrid): shots/90=2.40 — below threshold. No shots pick.
- Declan Rice (Arsenal): shots/90=1.16, tkl/90=0.959 — below 2/90 tackles threshold. No pick.

GHANA: No players in FBref DB with sufficient data. No individual picks.

CROATIA:
- Luka Modrić (Milan): shots/90=0.64 — no shots pick.
  PASSES: passes_completed/90 ≈ 65 (est. from FBref at Milan, CM role)
  → passes_attempted/90 est. = 65÷0.87 = 74.7 (CM)
  → Passes Attempted MORE 65.5: est. avg 74.7, matchup override vs Panama (FIFA #72, 40.2% possession, very defensive).
  → Croatia will dominate 65%+ possession vs Panama. Modric as CM pivot gets 80-90 passes attempted.
  → Pick at 76% with "est." notation.

- Mateo Kovačić (Man City): shots/90=1.38 — no shots pick.

PANAMA: No players in FBref DB. No individual picks.

COLOMBIA:
- Luis Díaz (Bayern Munich): shots/90=3.24 — below 4.0 threshold. Buffer 3.24×0.80=2.59 < 3.5. No shots pick.
- James Rodríguez: Not in FBref DB. No pick.

DR CONGO: No players in FBref DB. No individual picks.
════════════════════════════════════════════════════════════`;

const TACTICAL_PROFILES = `
════════════════════════════════════════════════════════════
TEAM TACTICAL PROFILES
════════════════════════════════════════════════════════════
PORTUGAL: formation=4-3-3, FIFA=#6
  avg_shots=15.4/game, avg_shots_conceded=7.1, avg_possession=55.6%, set_piece_threat=HIGH
  Corner taker: Bruno Fernandes. Ronaldo aerially dominant on corners.
  vs Uzbekistan: Portugal will dominate entirely. Ronaldo hunts records. Wide attacks → many corners.
  Expected corners: Portugal 10-14, Uzbekistan 1-2 → total 11-16.
  Bookings: Uzbekistan will foul to slow Portugal — 2-3 Uzbek yellows likely.

UZBEKISTAN: FIFA ~75. First/second major tournament. Defensive-minded vs Portugal.
  avg_shots_conceded=~13/game (estimated). Will sit deep, invite Portugal pressure.

ENGLAND: formation=4-2-3-1, FIFA=#5
  avg_shots=16.1/game (highest today), avg_shots_conceded=7.4, avg_possession=57.8%, set_piece_threat=HIGH
  Corner taker: Trippier (right). Kane aerial threat on every corner.
  vs Ghana: England completely dominant. Ghana (FIFA #54) concedes 11.6 shots/game.
  England will pepper Ghana's goal. Kane penalty box presence = shots and corners.
  Expected corners: England 10-14, Ghana 2-4 → total 12-18.

GHANA: formation=4-2-3-1, FIFA=#54
  avg_shots=10.8/game, avg_shots_conceded=11.6/game, avg_possession=46.4%
  Kudus creative threat but outclassed vs England. Will defend deep, counter on break.
  Yellow card risk: Ghana will foul England's wide players (Saka/Foden) to stop counters.

CROATIA: formation=4-3-3, FIFA=#10
  avg_shots=12.4/game, avg_shots_conceded=9.2, avg_possession=56.1%, set_piece_threat=MEDIUM
  Corner taker: Modrić. Gvardiol threat from corners.
  vs Panama: Croatia will dominate possession (likely 65%+). Panama (FIFA #72, possession=40.2%) sit in two banks.
  Modrić as deep CM gets maximum passing volume vs such a passive opponent.
  Expected corners: Croatia 9-13, Panama 1-3 → total 10-16.
  Bookings: Panama foul Croatian technical players — 2-4 yellows expected.

PANAMA: formation=4-4-2, FIFA=#72
  avg_shots=8.6/game, avg_shots_conceded=13.8/game (very weak), avg_possession=40.2%
  Very defensive, limited quality. Will absorb pressure and counter.

COLOMBIA: formation=4-2-3-1, FIFA=#12
  avg_shots=13.4/game, avg_shots_conceded=9.1, avg_possession=52.6%, set_piece_threat=MEDIUM
  Corner taker: James Rodríguez. Luis Díaz left wing threat.
  vs DR Congo: Colombia should control. DR Congo (FIFA #65) concedes 12.4 shots/game.
  Wide play from Díaz and Cuadrado → corners. James deliveries.
  Expected corners: Colombia 8-12, DR Congo 2-4 → total 10-16.
  Bookings: DR Congo physical, Colombia counter-fouled. 3-4 yellows expected.

DR CONGO: formation=4-3-3, FIFA=#65
  avg_shots=9.8/game, avg_shots_conceded=12.4/game, avg_possession=44.6%
  Physical, direct play. Limited top-level experience. Will foul Colombia's creative players.
════════════════════════════════════════════════════════════`;

const prompt = `You are Scout, an elite football DFS analyst. It is World Cup 2026. Generate picks for today's 4 matches (IST June 23-24).

${REAL_STATS}
${TACTICAL_PROFILES}

MATCHES (all times IST Jun 23-24):
1. Portugal vs Uzbekistan  — 22:30 IST Jun 23 (17:00 UTC Jun 23) — Group K — SoFi Stadium
2. England vs Ghana        — 01:30 IST Jun 24 (20:00 UTC Jun 23) — Group L — AT&T Stadium
3. Croatia vs Panama       — 04:30 IST Jun 24 (23:00 UTC Jun 23) — Group L — Gillette Stadium
4. DR Congo vs Colombia    — 07:30 IST Jun 24 (02:00 UTC Jun 24) — Group K — NRG Stadium

════════════════════════════════════════════════════════════
ALLOWED STAT CATEGORIES ONLY:
════════════════════════════════════════════════════════════
- Passes Attempted (line: 55.5–115.5) — CMs/CDMs only, estimated as passes_completed÷0.87
- Total Shots (line: 3.5 minimum) — individual players ONLY if avg 4+ shots/90 with buffer check
- Total Match Corners (line: 8.5, 9.5, 10.5) — player.name="Match", player.position="MATCH"
- Total Bookings (line: 2.5) — player.name="Bookings", player.position="MATCH"

════════════════════════════════════════════════════════════
PICK GUIDANCE — generate exactly these 8 picks:
════════════════════════════════════════════════════════════
1. PORTUGAL vs UZBEKISTAN — RONALDO TOTAL SHOTS MORE 3.5 (81%):
   shots/90=5.16, buffer 5.16×0.80=4.13 ≥ 3.5 ✓. vs Uzbekistan (FIFA ~75), dominant Portugal. Ronaldo hunts records.

2. PORTUGAL vs UZBEKISTAN — TOTAL CORNERS MORE 9.5 (77%):
   player.name="Match", position="MATCH". Portugal HIGH set pieces, Fernandes delivers. vs deep Uzbekistan — 11-16 corners expected.

3. ENGLAND vs GHANA — KANE TOTAL SHOTS MORE 3.5 (80%):
   shots/90=4.51, buffer 4.51×0.80=3.61 ≥ 3.5 ✓. England avg 16.1 shots/game vs Ghana (concede 11.6). Kane is the focal point.

4. ENGLAND vs GHANA — TOTAL CORNERS MORE 9.5 (78%):
   player.name="Match", position="MATCH". England avg 16.1 shots + HIGH set pieces + Trippier delivery. 12-18 corners expected vs Ghana.

5. CROATIA vs PANAMA — MODRIĆ PASSES ATTEMPTED MORE 65.5 (76%):
   est. passes_completed/90≈65 → attempted≈75. vs Panama (FIFA #72, possession=40.2%), Croatia 65%+ possession. Modrić CM pivot gets 80-90 passes. Mark "est." in aiReasoning.

6. CROATIA vs PANAMA — TOTAL CORNERS MORE 8.5 (77%):
   player.name="Match", position="MATCH". Croatia vs very weak Panama (shots_conceded=13.8/game). Wide attacks from Perisic/Kramarić → 10-16 corners.

7. DR CONGO vs COLOMBIA — TOTAL CORNERS MORE 8.5 (76%):
   player.name="Match", position="MATCH". Colombia avg 13.4 shots vs DR Congo (concede 12.4). Wide play from Díaz → 10-16 corners.

8. DR CONGO vs COLOMBIA — TOTAL BOOKINGS MORE 2.5 (75%):
   player.name="Bookings", position="MATCH". DR Congo physical approach + Colombia foul counters. 3-4 yellows expected.

════════════════════════════════════════════════════════════
MIN CONFIDENCE: 75%. Confidence range: 75–82.
MAX 2 picks per match.
Mark "est." in aiReasoning when passing stats are estimated.

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
    "aiReasoning": "string (2-3 sentences with exact stats, matchup, hit rate)",
    "recentForm": "string (5 values comma-separated)",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" }
    ]
  }
]`;

const fixtures = {
  "Portugal": {
    fixture_id: 900063,
    home_team: "Portugal",
    away_team: "Uzbekistan",
    kickoff_at: "2026-06-23T17:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "SoFi Stadium",
  },
  "England": {
    fixture_id: 900069,
    home_team: "England",
    away_team: "Ghana",
    kickoff_at: "2026-06-23T20:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "AT&T Stadium",
  },
  "Croatia": {
    fixture_id: 900070,
    home_team: "Croatia",
    away_team: "Panama",
    kickoff_at: "2026-06-23T23:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Gillette Stadium",
  },
  "DR Congo": {
    fixture_id: 900064,
    home_team: "DR Congo",
    away_team: "Colombia",
    kickoff_at: "2026-06-24T02:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "NRG Stadium",
  },
};

function getFixture(homeTeam, awayTeam) {
  if (fixtures[homeTeam]) return fixtures[homeTeam];
  for (const [, fix] of Object.entries(fixtures)) {
    if (fix.away_team === homeTeam || fix.home_team === awayTeam || fix.away_team === awayTeam) return fix;
  }
  return fixtures["Portugal"];
}

async function main() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: anthropicKey });

  console.log("Calling Claude for picks (Portugal/Uzbekistan, England/Ghana, Croatia/Panama, DR Congo/Colombia)...");
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
