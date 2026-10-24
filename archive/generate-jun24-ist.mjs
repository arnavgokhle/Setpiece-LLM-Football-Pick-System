import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REAL_STATS = `
════════════════════════════════════════════════════════════
REAL PLAYER STATS — WC 2026 TOURNAMENT FORM + CLUB DATA
════════════════════════════════════════════════════════════
RULES:
1. Total Shots: only players with 4+ shots/90 at club OR 4+ shots/game in WC form.
2. Buffer: line ≤ avg × 0.80 for club data. WC tournament form takes precedence.
3. Passes Attempted: estimated as passes_completed ÷ 0.87 (CMs). Mark "est." in aiReasoning.
4. Hit rate ≥ 7/10. For WC picks, use 2-game tournament form + matchup context.
════════════════════════════════════════════════════════════

SWITZERLAND:
- Granit Xhaka (Sunderland, CM): shots/90=0.65 — no shots pick.
  WC passes_completed: Jun 13 vs Qatar=61, Jun 18 vs Bosnia=75 (90 min both).
  → passes_attempted est.: 70-86/game (avg ~78 attempted).
  → vs Canada (49.4% avg possession): Switzerland slightly dominant at 51.2%. Competitive match.
  → Passes Attempted MORE 65.5: avg ~78 est., even worst-game 70 > 65.5 ✓. Conservative line.
  → Pick at 75%.

CANADA:
- Jonathan David (Juventus): shots/90=2.07 (club), WC: 3 shots Jun 12, 5 shots Jun 18.
  → WC form improving but club threshold fails. Switzerland concedes 9.8 shots/game (decent defense).
  → No shots pick.
- Cyle Larin: WC Jun 12: 4 shots. No club DB data.
  → 1-game tournament sample insufficient. No pick.

BOSNIA AND HERZEGOVINA:
- Edin Dzeko (40yo, veteran striker): No recent FBref data. Bosnia lost 4-1 to Switzerland.
  → Against Qatar (psychologically scarred after 6-0 loss to Canada), Bosnia will dominate.
  → Qatar must win = aggressive pressing → yellow cards. Bosnia target men draw fouls.
  → Total Bookings MORE 2.5: must-win for both teams, Qatar desperate/frustrated, 3+ cards expected.
  → Pick at 76%.

QATAR:
- Akram Afif: creative midfielder but below stat thresholds. Qatar 11.6 shots/game.
  → No individual picks.

MOROCCO:
- Hakim Ziyech: Not in DB. Corner taker for Morocco.
- Youssef En-Nesyri: Not in DB.
- Achraf Hakimi (PSG): shots/90=1.77 — below threshold. RB/wingback.
- Morocco avg_shots: 12.8/game, set_piece_threat: MEDIUM.
  → vs Haiti (FIFA ~108, lowest-ranked team): Haiti will sit in ultra-deep block.
  → Wide attacks from Ziyech/Hakimi → many corners. Morocco 10-14 corners expected.
  → Total Match Corners MORE 7.5: Morocco dominant, Haiti ultra-defensive. 9-13 total expected.
  → Pick at 77%.

SCOTLAND:
- John McGinn (Aston Villa): shots/90=1.18 — no pick. WC Jun 13: 3 shots, Jun 19: null.
- Scott McTominay: WC Jun 19: 2 SoT (null total).
  → No individual picks for Scotland. Outclassed by Brazil entirely.

BRAZIL:
- Vinicius Júnior (Real Madrid): shots/90=3.2 (club) — below 4.0 threshold.
  WC Jun 13 vs Morocco: 2 shots. Jun 19 vs Haiti: null.
  → Buffer fails (3.2×0.80=2.56 < 3.5). No individual shots pick for Vinicius.
  → BUT Brazil 16.8 avg shots/game (highest in Group C), HIGH set piece threat.
  → vs Scotland (11.2 shots conceded/game, FIFA #40). Brazil completely dominant.
  → Expected: Brazil 11-15 corners, Scotland 1-3 = 12-18 total.
  → Total Match Corners MORE 9.5: Brazil vs Scotland, Brazil HIGH set pieces, 12-18 expected.
  → Pick at 79%.

SOUTH AFRICA:
- Teboho Mokoena: WC Jun 18: 39 passes completed. No shots.
  → avg_shots_conceded=12.6/game (weakest defensive record). Will struggle vs South Korea.
  → No individual picks. South Africa defensive-minded.

SOUTH KOREA:
- Son Heung-Min (Tottenham Hotspur): shots/90 NOT in club DB.
  WC Jun 16 vs Mexico (FIFA #10, strong): 6 shots in 69 min = 7.8 shots/90 extrapolated. Exceptional form.
  5.14 shot-creating actions/90 at Spurs (2024-25 best career stat). Elite attacker.
  → vs South Africa (concede 12.6 shots/game, weakest defence): massive mismatch.
  → Total Shots MORE 3.5: WC form 6 shots vs strong Mexico, vs WORST defence in Group A. Near-certain.
  → Pick at 81%.

- Hwang In-Beom (CM): WC Jun 11 vs Czechia: 41 passes (3 shots). Jun 18 vs Mexico: 73 passes (90 min).
  → passes_attempted est.: 47-84 range (avg ~66 attempted).
  → vs South Africa (45.2% possession, very passive): South Korea will dominate 60%+ possession.
  → Hwang as CM gets maximum passing volume vs low-block South Africa.
  → Passes Attempted MORE 65.5: WC avg ~66 est., South Africa passive = Hwang gets 75-85 attempted.
  → Pick at 76%. Mark "est." in aiReasoning.

CZECHIA:
- Patrik Schick (Leverkusen): shots/90=3.26 — buffer 3.26×0.80=2.61 < 3.5. Below threshold.
  WC Jun 18 vs South Africa: 3 shots. Sub-threshold.
  → No shots pick for Schick.

MEXICO:
- Julian Quinones: WC Jun 11 vs South Korea: 4 shots. Jun 18 vs South Korea: 5 shots (90 min both).
  → WC tournament form: 4 shots, 5 shots = avg 4.5/game. Line 3.5 → WON both games.
  → No club data in DB but WC form is consistent: averaging 4+ shots per game vs major opponents.
  → vs Czechia (no profile in DB but mid-table European side). Mexico avg 12.8 shots/game.
  → Total Shots MORE 3.5: WC avg 4.5 shots, buffer 4.5×0.80=3.6 ≥ 3.5 ✓.
  → Pick at 76%.
════════════════════════════════════════════════════════════`;

const TACTICAL_PROFILES = `
════════════════════════════════════════════════════════════
TEAM TACTICAL PROFILES (from DB + research)
════════════════════════════════════════════════════════════
SWITZERLAND: formation=4-2-3-1, FIFA=#12
  avg_shots=12.1/game, avg_shots_conceded=9.8, avg_possession=51.2%, set_piece_threat=MEDIUM
  Won 4-1 vs Bosnia, drew vs Qatar. Xhaka CM pivot, set piece: Embolo/Shaqiri delivery.
  vs Canada: Competitive group stage decider. Switzerland slightly dominant in possession.

CANADA: formation=4-3-3, FIFA=#36
  avg_shots=12.4/game, avg_shots_conceded=10.6, avg_possession=49.4%, set_piece_threat=MEDIUM
  Crushed Qatar 6-0. David + Larin dangerous. vs Switzerland: must-win pressure match.

BOSNIA AND HERZEGOVINA: formation=4-4-2, FIFA=#64
  Last 2 results: 1-1 vs Canada (MD1), 1-4 vs Switzerland (MD2).
  Dzeko (40yo) as target man. Physical, direct. Clear advantage over Qatar.

QATAR: formation=4-3-3, FIFA=#49
  Psychologically broken — lost 6-0 to Canada. 2 suspended players. Afif creative.
  avg_shots_conceded: very high. Will foul Bosnia's Dzeko repeatedly.
  Yellow card risk: Qatar must win = desperate pressing → 3-4 bookings expected.

MOROCCO: formation=4-3-3, FIFA=#15
  avg_shots=12.8/game, avg_shots_conceded=9.2, avg_possession=51.4%, set_piece_threat=MEDIUM
  Ziyech corner taker. Hakimi wing threat. Amrabat CDM shields back 4.
  vs Haiti (FIFA ~108): Haiti will sit in 4-5-1 deep block. 0 attacking threat.
  Wide attacks from Ziyech/Hakimi → 9-14 corners expected total.

HAITI: FIFA~108. No profile in DB. First/only World Cup. Will defend deep vs Morocco.
  avg_shots_conceded: ~14/game est. Very limited technical quality.

SCOTLAND: formation=4-3-3, FIFA=#40
  avg_shots=11.4/game, avg_shots_conceded=11.2, avg_possession=47.8%, set_piece_threat=MEDIUM
  McTominay/McGinn energetic but outclassed by Brazil. Defensive approach expected.
  vs Brazil: Will sit in 4-5-1, absorb pressure, hope for counter. Many corners from Brazil.

BRAZIL: formation=4-3-3, FIFA=#1
  avg_shots=16.8/game (highest in Group C), avg_shots_conceded=7.2, avg_possession=57.4%, set_piece_threat=HIGH
  Vinicius corner taker (left). Rodrygo/Endrick wide threats. Will batter Scotland.
  vs Scotland: Expected 11-15 corners for Brazil, 1-3 for Scotland → 12-18 total.
  Brazil HIGH set pieces = corners from constant wide pressure.

SOUTH AFRICA: formation=4-4-2, FIFA=#69
  avg_shots=10.4/game, avg_shots_conceded=12.6 (HIGHEST CONCEDED in Group A), avg_possession=45.2%, set_piece_threat=LOW
  Very weak defensively. Will sit in low block vs South Korea. Limited counterattack.
  Corner taker: unknown. Won't generate many corners themselves (10.4 shots only).

SOUTH KOREA: formation=4-3-3, FIFA=#23
  avg_shots=12.4/game, avg_shots_conceded=10.2, avg_possession=50.4%, set_piece_threat=MEDIUM
  Son Heung-Min left wing, Lee Kang-In creative CM. Hwang In-Beom box-to-box CM.
  vs South Africa: Should dominate 55-60% possession. Son hunts shooting positions constantly.
  Expected: South Korea 8-12 corners, South Africa 1-3 → 9-15 total.

CZECHIA: formation=4-2-3-1, FIFA=#27
  No profile in DB. Schick striker. Quality European side. Group A runners-up candidate.
  vs Mexico: Competitive match. Mexico avg 12.8 shots/game.

MEXICO: formation=4-3-3, FIFA=#20
  avg_shots=12.8/game, avg_shots_conceded=9.7, avg_possession=51.6%, set_piece_threat=MEDIUM
  Quinones left winger: 4 shots (Jun 11), 5 shots (Jun 18) in WC — avg 4.5/game.
  vs Czechia: Mexico should control possession. Quinones wide threat generates shots.
════════════════════════════════════════════════════════════`;

const prompt = `You are Scout, an elite football DFS analyst. It is World Cup 2026. Generate picks for today's 6 matches (IST June 24-25).

${REAL_STATS}
${TACTICAL_PROFILES}

MATCHES (all times IST Jun 24-25):
1. Switzerland vs Canada     — 00:30 IST Jun 25 (19:00 UTC Jun 24) — Group B — Levi's Stadium
2. Bosnia vs Qatar           — 00:30 IST Jun 25 (19:00 UTC Jun 24) — Group B — Lumen Field
3. Morocco vs Haiti          — 03:30 IST Jun 25 (22:00 UTC Jun 24) — Group C — MetLife Stadium
4. Scotland vs Brazil        — 03:30 IST Jun 25 (22:00 UTC Jun 24) — Group C — SoFi Stadium
5. South Africa vs South Korea — 06:30 IST Jun 25 (01:00 UTC Jun 25) — Group A — Gillette Stadium
6. Czechia vs Mexico         — 06:30 IST Jun 25 (01:00 UTC Jun 25) — Group A — AT&T Stadium

════════════════════════════════════════════════════════════
ALLOWED STAT CATEGORIES ONLY:
════════════════════════════════════════════════════════════
- Passes Attempted (line: 55.5–115.5) — CMs/CDMs only, estimated as passes_completed÷0.87
- Total Shots (line: 3.5) — individual players ONLY with WC form avg 4+ shots/game
- Total Match Corners (line: 7.5, 8.5, 9.5) — player.name="Match", player.position="MATCH"
- Total Bookings (line: 2.5) — player.name="Bookings", player.position="MATCH"

════════════════════════════════════════════════════════════
PICK GUIDANCE — generate exactly these 7 picks:
════════════════════════════════════════════════════════════
1. SWITZERLAND vs CANADA — XHAKA PASSES ATTEMPTED MORE 65.5 (75%):
   player.name="Granit Xhaka", player.team="Switzerland", player.position="CM"
   WC passes_completed: 61 (Jun 13), 75 (Jun 18). est. attempted: 70-86. vs Canada (49.4% poss), Switzerland slightly dominant.
   Even worst-game est. (70) > 65.5 ✓. Conservative line. Mark "est." in aiReasoning.

2. BOSNIA vs QATAR — BOOKINGS MORE 2.5 (76%):
   player.name="Bookings", player.position="MATCH"
   Qatar must-win after 6-0 humiliation, 2 suspended. Dzeko as target man draws fouls. 3-4 cards expected.

3. MOROCCO vs HAITI — TOTAL CORNERS MORE 7.5 (77%):
   player.name="Match", player.position="MATCH"
   Morocco 12.8 shots vs Haiti (FIFA ~108, ultra-deep block). Ziyech/Hakimi wide → 9-13 total corners.

4. SCOTLAND vs BRAZIL — TOTAL CORNERS MORE 9.5 (79%):
   player.name="Match", player.position="MATCH"
   Brazil 16.8 shots/game, HIGH set pieces vs Scotland (11.2 conceded). 12-18 total corners expected.

5. SOUTH AFRICA vs SOUTH KOREA — SON HEUNG-MIN TOTAL SHOTS MORE 3.5 (81%):
   player.name="Son Heung-Min", player.team="South Korea", player.position="FW"
   WC Jun 16: 6 shots in 69 min vs Mexico (strong). vs South Africa (concede 12.6 shots/game — worst in group).
   Reasoning: "Son averaged 5.14 shot-creating actions/90 this season at Spurs and hit 6 shots in 69 min vs Mexico — today's opponent South Africa concedes 12.6 shots/game, the highest in Group A."

6. SOUTH AFRICA vs SOUTH KOREA — TOTAL CORNERS MORE 8.5 (77%):
   player.name="Match", player.position="MATCH"
   South Korea 12.4 shots vs South Africa (12.6 conceded). South Korea dominant 60%+ possession expected. 9-15 corners.

7. CZECHIA vs MEXICO — QUINONES TOTAL SHOTS MORE 3.5 (76%):
   player.name="Julian Quinones", player.team="Mexico", player.position="FW"
   WC: 4 shots (Jun 11 vs South Korea), 5 shots (Jun 18 vs South Korea) — avg 4.5/game. Buffer: 4.5×0.80=3.6 ≥ 3.5 ✓.
   Mexico 12.8 shots/game. Quinones left winger, constant threat.

════════════════════════════════════════════════════════════
MIN CONFIDENCE: 75%. Confidence range: 75–82.
MAX 2 picks per match.
Mark "est." in aiReasoning when passing stats are estimated.
Every pick's aiReasoning MUST compare the player/team stat vs the opponent's conceded stat.

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
    "aiReasoning": "string (2-3 sentences with exact stats, matchup, hit rate — include est. where applicable)",
    "recentForm": "string (5 values comma-separated)",
    "keyStats": [
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" },
      { "label": "string", "value": "string", "trend": "up|down|neutral" }
    ]
  }
]`;

const fixtures = {
  "Switzerland": {
    fixture_id: 900081,
    home_team: "Switzerland",
    away_team: "Canada",
    kickoff_at: "2026-06-24T19:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Levi's Stadium",
  },
  "Bosnia": {
    fixture_id: 900082,
    home_team: "Bosnia",
    away_team: "Qatar",
    kickoff_at: "2026-06-24T19:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Lumen Field",
  },
  "Morocco": {
    fixture_id: 900083,
    home_team: "Morocco",
    away_team: "Haiti",
    kickoff_at: "2026-06-24T22:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "MetLife Stadium",
  },
  "Scotland": {
    fixture_id: 900084,
    home_team: "Scotland",
    away_team: "Brazil",
    kickoff_at: "2026-06-24T22:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "SoFi Stadium",
  },
  "South Africa": {
    fixture_id: 900085,
    home_team: "South Africa",
    away_team: "South Korea",
    kickoff_at: "2026-06-25T01:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "Gillette Stadium",
  },
  "Czechia": {
    fixture_id: 900086,
    home_team: "Czechia",
    away_team: "Mexico",
    kickoff_at: "2026-06-25T01:00:00+00:00",
    competition: "FIFA World Cup 2026",
    venue: "AT&T Stadium",
  },
};

function getFixture(homeTeam, awayTeam) {
  if (fixtures[homeTeam]) return fixtures[homeTeam];
  for (const [, fix] of Object.entries(fixtures)) {
    if (fix.away_team === homeTeam || fix.home_team === awayTeam || fix.away_team === awayTeam) return fix;
  }
  return null;
}

async function main() {
  // Check for existing picks
  const ids = Object.values(fixtures).map(f => f.fixture_id);
  const { data: existing } = await supabase.from("picks").select("fixture_id, player_name").in("fixture_id", ids);
  if (existing && existing.length > 0) {
    console.log("Existing picks found — aborting to prevent duplicates:");
    existing.forEach(p => console.log(" ", p.fixture_id, p.player_name));
    return;
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey: anthropicKey });

  console.log("Calling Claude for picks (6 games: Switzerland/Canada, Bosnia/Qatar, Morocco/Haiti, Scotland/Brazil, South Africa/South Korea, Czechia/Mexico)...");
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
    if (!fix) { console.warn("No fixture for", p.match.homeTeam, "vs", p.match.awayTeam); return null; }
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
  }).filter(Boolean);

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
