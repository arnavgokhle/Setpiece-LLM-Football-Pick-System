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
1. Total Shots minimum line: 3.5. Only for players averaging 4+ shots/90.
2. Shots on Target lines: 1.5 or 2.5. Only players with actual SoT data + 4+ shots/90.
3. 20% buffer: line ≤ player_avg × 0.80. HARD RULE — BUT matchup vs Haiti/very weak teams can justify override.
4. Hit rate must be ≥ 7/10. Matchup-adjusted estimates allowed.
5. passes_per90 = NULL for all players tonight — NO passes picks.
════════════════════════════════════════════════════════════

USA:
- Christian Pulisic (AM, Milan): shots/90=3.02, SoT/90=1.40, tkl/90=0.45
  NOTE: 3.02 does NOT reach 4+ threshold. No shots pick.
- Folarin Balogun (ST, Monaco): shots/90=3.11, SoT/90=1.29, tkl/90=0.24
  NOTE: 3.11 does NOT reach 4+ threshold. No shots pick.
- Timothy Weah (MID, Marseille): shots/90=1.16 — no pick
- Weston McKennie (MID, Juventus): shots/90=1.37 — no pick
- Gio Reyna (MID, Gladbach): shots/90=1.21, tkl/90=1.03 — no pick

AUSTRALIA: No key player data in DB. Cannot generate individual picks.

MOROCCO:
- Achraf Hakimi (RWB, PSG): shots/90=1.77, SoT/90=0.59, tkl/90=0.85
  NOTE: 1.77 does NOT reach 4+ threshold.
- Brahim Díaz (AM, Real Madrid): shots/90=1.07 — no pick

SCOTLAND:
- Scott McTominay (MID, Napoli): shots/90=3.26, SoT/90=1.10 — VOIDED (user removed)
- John McGinn (MID, Aston Villa): shots/90=1.18 — no pick

BRAZIL:
- Raphinha (RW, Barcelona): shots/90=4.24, SoT/90=1.57, tkl/90=0.39
  → QUALIFIES for shots picks (4.24 ≥ 4.0 threshold)
  → Total Shots MORE 3.5: strict buffer fails (4.24×0.80=3.39 < 3.5 line)
  → BUT: matchup vs Haiti (extremely weak, concedes ~16+ shots/game) justifies override
  → Against Haiti, Raphinha's actual volume will exceed his 4.24 club avg. Pick at 78%.
  → SoT MORE 1.5: 1.57×0.80=1.26 < 1.5 — strict buffer fails too, but vs Haiti, SoT volume elevated
- Vinícius Júnior (LW, Real Madrid): shots/90=3.20, SoT/90=1.47 — below 4+ threshold
- Gabriel Martinelli (LW, Arsenal): shots/90=2.41 — below threshold

PARAGUAY:
- Julio Enciso (AM, Strasbourg): shots/90=2.92, SoT/90=1.05 — below threshold
- Miguel Almirón: NOT in DB

TÜRKIYE:
- Arda Güler (AM, Real Madrid): shots/90=2.19, SoT/90=0.85 — below threshold
- Hakan Çalhanoğlu (CDM, Inter): shots/90=2.75, SoT/90=0.93 — below threshold
- Kenan Yıldız (LW, Juventus): not in DB
════════════════════════════════════════════════════════════`;

const TACTICAL_PROFILES = `
════════════════════════════════════════════════════════════
TEAM TACTICAL PROFILES
════════════════════════════════════════════════════════════
USA: formation=4-3-3, FIFA=#14, avg_shots=13.2/game, avg_shots_conceded=9.4/game
  Style: High-press hosts, wing-forward attack (Pulisic/Weah), strong set-piece routine
  Corner taker: McKennie / Reyna. Home crowd advantage (AT&T Stadium, Arlington TX)

AUSTRALIA: formation=4-3-3, FIFA=#22, avg_shots=11.8/game, avg_shots_conceded=10.8/game
  Style: High-press, direct, physical. Wing play via Mabil/Robertson. Will compete hard.
  No player with 4+ shots/90 in DB. No individual picks possible.

MOROCCO: formation=4-3-3, FIFA=#14, avg_shots=12.8/game, avg_shots_conceded=9.2/game
  Style: Compact defensive block, dangerous counter-attack. Hakimi overlapping.
  Set piece threat: medium. Will defend deep vs physical Scotland.

SCOTLAND: formation=3-5-2, FIFA=#38, avg_shots=11.4/game, avg_shots_conceded=11.2/game
  Style: High-energy press, wing-backs push forward aggressively (Robertson/Patterson).
  Physical midfield - McGinn, McLean battle. Get lots of corners from wing-back crosses.
  Bookings: Scotland average ~2.8 yellow cards/game due to pressing intensity.

BRAZIL: formation=4-2-3-1, FIFA=#5, avg_shots=16.8/game, avg_shots_conceded=7.2/game
  Style: Attacking, fluid, possession-based. Vinicius/Raphinha on wings.
  Set piece threat: HIGH. Average 10-12 corners/game vs weaker opponents.
  vs Haiti: expect Brazil to dominate with 20+ shots, 12+ corners.

HAITI: FIFA=#88, avg_shots=6.8/game, avg_shots_conceded=16.4/game
  Style: Low-block defensive, physical fouls, very limited attacking quality.
  Will foul repeatedly to slow Brazil = multiple yellow cards.
  Cannot hold Brazil — expect 3-5 cards across both teams.

PARAGUAY: formation=4-4-2, FIFA=#64, avg_shots=10.2/game, avg_shots_conceded=12.1/game
  Style: Counter-attacking, physical, disciplined defense. Almirón danger on break.
  CONMEBOL-style fouls. Paraguay average 2.6 yellows/game (cynical defense).

TÜRKIYE: formation=4-2-3-1, FIFA=#29, avg_shots=12.6/game, avg_shots_conceded=10.1/game
  Style: Organised, high-press, attacking midfield. Güler/Calhanoglu creative hub.
  Both teams physically competitive = bookings expected.
════════════════════════════════════════════════════════════`;

const prompt = `You are Scout, an elite football DFS analyst. It is World Cup 2026. Generate picks for tonight's 4 matches (all June 20 IST early morning).

${REAL_STATS}
${TACTICAL_PROFILES}

MATCHES (all times IST Jun 20, all upcoming):
1. United States vs Australia — 00:30 IST (19:00 UTC Jun 19) — Group D
2. Morocco vs Scotland — 03:30 IST (22:00 UTC Jun 19) — Group C
3. Brazil vs Haiti — 06:00 IST (20:30 UTC Jun 20) — Group C
4. Paraguay vs Türkiye — 08:30 IST (03:00 UTC Jun 20) — Group D

════════════════════════════════════════════════════════════
ALLOWED STAT CATEGORIES ONLY:
════════════════════════════════════════════════════════════
- Total Shots     (line: 3.5 or 4.5) — individual players only, requires 4+ shots/90
- Shots on Target (line: 1.5 or 2.5) — individual players only, 4+ shots/90 AND verified SoT data
- Total Match Corners (line: 8.5, 9.5, 10.5) — player.name="Match", player.position="MATCH"
- Total Bookings  (line: 2.5) — player.name="Bookings", player.position="MATCH"

STRICTLY BANNED: Passes (all NULL), individual Corners Won, Goals, individual Tackles (none qualify).

════════════════════════════════════════════════════════════
PICK SELECTION RULES — enforced strictly:
════════════════════════════════════════════════════════════
1. NO SHOTS PICKS for USA, Australia, Morocco, Scotland, Paraguay, Türkiye individual players — none hit 4+ threshold.
2. RAPHINHA (Brazil) ONLY INDIVIDUAL PICK: 4.24 shots/90 qualifies. vs Haiti override justified.
   → Generate: Raphinha Total Shots MORE 3.5 at 78% (matchup-adjusted).
3. CORNERS rules:
   - Use combined shot volumes to estimate corner volume: ~1 corner per 3-4 shots.
   - USA (13.2) + Australia (11.8) = ~25 shots combined → 7-9 corners → line 8.5 appropriate.
   - Morocco (12.8) + Scotland (11.4) = ~24 shots + Scotland 3-5-2 wing-backs = 8-10 corners → line 8.5 or 9.5.
   - Brazil (16.8) vs Haiti: Brazil dominates → 12-15 corners from Brazil, Haiti ~1-2 = total 13-17 → line 9.5 STRONG.
   - Paraguay (10.2) + Türkiye (12.6) with Türkiye attacking, Paraguay deep-sitting = 8-11 corners → line 8.5.
4. BOOKINGS rules:
   - Haiti vs Brazil: Haiti fouls aggressively = 3-4 yellows easy. MORE 2.5 at 76%.
   - Scotland vs Morocco: Scotland physical 3-5-2, Morocco high-press = 3+ likely. MORE 2.5 at 75%.
   - Paraguay vs Türkiye: CONMEBOL cynical defending + Turkish pressing = 3+ yellows. MORE 2.5 at 76%.
   - USA vs Australia: more athletic, less cynical — skip bookings pick for this match.
5. MAX 2-3 picks per match. Prioritise highest confidence picks.
6. MIN CONFIDENCE: 70%. Skip if can't justify.
7. Confidence range: 70–82 (early picks, no final data).
8. DIVERSITY: Do NOT pick Corners + Bookings for EVERY match. Vary.
   - USA/Australia: Corners only
   - Morocco/Scotland: Bookings only
   - Brazil/Haiti: Raphinha Shots + Corners (or Bookings — pick best one)
   - Paraguay/Türkiye: Bookings only

PICK GUIDANCE SUMMARY:
• Generate exactly these picks (you may adjust lines/confidence within rules):
  1. USA vs Australia: Match Total Match Corners MORE 8.5 (~75%)
  2. Morocco vs Scotland: Bookings Total Bookings MORE 2.5 (~75%)
  3. Brazil vs Haiti: Raphinha Total Shots MORE 3.5 (~78%)
  4. Brazil vs Haiti: Match Total Match Corners MORE 9.5 (~77%)
  5. Paraguay vs Türkiye: Bookings Total Bookings MORE 2.5 (~76%)

════════════════════════════════════════════════════════════
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
    "recentForm": "string (5 values comma-separated, realistic estimates)",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" }
    ]
  }
]`;

const fixtures = {
  "United States": {
    fixture_id: 900021,
    home_team: "United States",
    away_team: "Australia",
    kickoff_at: "2026-06-19T19:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "AT&T Stadium",
  },
  "Morocco": {
    fixture_id: 900016,
    home_team: "Morocco",
    away_team: "Scotland",
    kickoff_at: "2026-06-19T22:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Levi's Stadium",
  },
  "Brazil": {
    fixture_id: 900015,
    home_team: "Brazil",
    away_team: "Haiti",
    kickoff_at: "2026-06-20T00:30:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "SoFi Stadium",
  },
  "Paraguay": {
    fixture_id: 900033,
    home_team: "Paraguay",
    away_team: "Türkiye",
    kickoff_at: "2026-06-20T03:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Arrowhead Stadium",
  },
};

function getFixture(homeTeam, awayTeam) {
  if (fixtures[homeTeam]) return fixtures[homeTeam];
  for (const [, fix] of Object.entries(fixtures)) {
    if (fix.away_team === homeTeam || fix.home_team === awayTeam || fix.away_team === awayTeam) return fix;
  }
  return fixtures["United States"];
}

async function main() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: anthropicKey });

  console.log("Calling Claude for picks (USA/Australia, Morocco/Scotland, Brazil/Haiti, Paraguay/Turkey)...");
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
    const confidence = Math.min(82, Math.max(70, p.confidence));
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
      const koIST = new Date(r.kickoff_at);
      koIST.setMinutes(koIST.getMinutes() + 330); // IST offset
      console.log(`  [${r.confidence}%] ${r.player_name} ${r.direction} ${r.line} ${r.stat_category} — ${r.home_team} vs ${r.away_team}`);
    });
  }
}

main().catch(console.error);
