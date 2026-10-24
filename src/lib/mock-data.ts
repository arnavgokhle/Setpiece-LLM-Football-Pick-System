// ============================================================
// SETPIECE — Mock Data
// Replace with real API calls when keys are available.
// ============================================================

import type { Pick, User, SubscriptionPlan, ChatMessage } from "@/types";

// ── Mock User ──────────────────────────────────────────────
// To simulate a PRO user, change subscriptionTier to "PRO"
export const MOCK_USER: User = {
  id: "user_mock_001",
  email: "demo@setpiecepicks.com",
  name: "Alex Demo",
  subscriptionTier: "PRO", // Change to "PRO" to unlock all picks
  subscriptionEndsAt: undefined,
};

// ── Subscription Plans ─────────────────────────────────────
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "pro_monthly",
    name: "Setpiece Edge",
    price: 9.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ID_MONTHLY || "price_mock",
    features: [
      "Unlimited AI picks — all matches",
      "Full AI reasoning & confidence scores",
      "Real-time pick updates",
      "AI chatbot — ask anything",
      "Player props — goals, assists, shots & more",
      "Early access to parlays & same-game combos",
      "Priority email support",
    ],
  },
];

// ── Today's Picks ──────────────────────────────────────────
export const MOCK_PICKS: Pick[] = [
  // ── MATCH 1: PSG vs Real Madrid (UCL) ──────────────────
  {
    id: "pick_001",
    player: {
      id: "p_mbappe",
      name: "Kylian Mbappé",
      team: "Real Madrid",
      position: "Forward",
      nationality: "🇫🇷",
    },
    match: {
      id: "m_001",
      homeTeam: "PSG",
      awayTeam: "Real Madrid",
      competition: "UEFA Champions League",
      kickoff: "2026-05-17T20:00:00Z",
      venue: "Parc des Princes, Paris",
    },
    platform: "Setpiece",
    statCategory: "Shots on Target",
    line: 2.5,
    direction: "MORE",
    confidence: 87,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Mbappé averages 3.2 shots on target per game in UCL knockout rounds over the last 3 seasons. Playing against his former club adds significant motivation — he's recorded 4+ shots on target in 3 of his last 4 'revenge' fixtures. PSG's high defensive line creates the exact space he exploits with off-the-shoulder runs. The 2.5 line is soft given current form.",
    recentForm: "4, 3, 5, 2, 4 shots on target (last 5 games)",
    keyStats: [
      { label: "Avg SOT (UCL KO)", value: "3.2", trend: "up" },
      { label: "vs Former Clubs", value: "4.1 avg", trend: "up" },
      { label: "Hit line last 5", value: "4/5", trend: "up" },
      { label: "xG this season", value: "22.4", trend: "up" },
    ],
    isLocked: false,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_002",
    player: {
      id: "p_dembele",
      name: "Ousmane Dembélé",
      team: "PSG",
      position: "Winger",
      nationality: "🇫🇷",
    },
    match: {
      id: "m_001",
      homeTeam: "PSG",
      awayTeam: "Real Madrid",
      competition: "UEFA Champions League",
      kickoff: "2026-05-17T20:00:00Z",
      venue: "Parc des Princes, Paris",
    },
    platform: "Setpiece",
    statCategory: "Assists",
    line: 0.5,
    direction: "MORE",
    confidence: 74,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Dembélé leads Ligue 1 in key passes per 90 and has registered an assist in 3 of his last 4 Champions League home appearances. Real Madrid's right flank has allowed more chance creation from wide areas than any other UCL semifinalist. At 0.5 assists, this is excellent value.",
    recentForm: "A, -, A, A, - in last 5 UCL home games",
    keyStats: [
      { label: "Key passes/90", value: "4.8", trend: "up" },
      { label: "UCL home assists", value: "3 last 4", trend: "up" },
      { label: "Chance creation", value: "#1 L1", trend: "up" },
      { label: "Dribble success", value: "68%", trend: "neutral" },
    ],
    isLocked: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_003",
    player: {
      id: "p_vinicius",
      name: "Vinícius Jr.",
      team: "Real Madrid",
      position: "Winger",
      nationality: "🇧🇷",
    },
    match: {
      id: "m_001",
      homeTeam: "PSG",
      awayTeam: "Real Madrid",
      competition: "UEFA Champions League",
      kickoff: "2026-05-17T20:00:00Z",
      venue: "Parc des Princes, Paris",
    },
    platform: "Setpiece",
    statCategory: "Shots on Target",
    line: 1.5,
    direction: "MORE",
    confidence: 81,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Vinícius has been in electric form — scoring in 5 straight UCL matches. PSG's left back Nuno Mendes is nursing a hamstring issue (60% chance of starting per team reports), which would leave Hakimi deputizing at left back — a mismatch Vini will exploit relentlessly. The 1.5 line significantly undervalues his current output.",
    recentForm: "2, 3, 2, 1, 3 shots on target (last 5)",
    keyStats: [
      { label: "SOT avg (UCL)", value: "2.4", trend: "up" },
      { label: "Goals last 5 UCL", value: "5", trend: "up" },
      { label: "Dribbles/game", value: "6.2", trend: "up" },
      { label: "vs weakened LB", value: "3.1 avg SOT", trend: "up" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_004",
    player: {
      id: "p_hakimi",
      name: "Achraf Hakimi",
      team: "PSG",
      position: "Right Back",
      nationality: "🇲🇦",
    },
    match: {
      id: "m_001",
      homeTeam: "PSG",
      awayTeam: "Real Madrid",
      competition: "UEFA Champions League",
      kickoff: "2026-05-17T20:00:00Z",
      venue: "Parc des Princes, Paris",
    },
    platform: "Setpiece",
    statCategory: "Tackles",
    line: 2.5,
    direction: "LESS",
    confidence: 68,
    confidenceLevel: "MEDIUM",
    aiReasoning:
      "Hakimi will likely be pinned back dealing with Vinícius rather than his usual marauding runs, but Real Madrid's narrow shape compresses central space, limiting tackle opportunities on the right flank. LESS 2.5 tackles at 68% confidence.",
    recentForm: "1, 3, 2, 1, 2 tackles (last 5)",
    keyStats: [
      { label: "Avg tackles", value: "1.8/game", trend: "down" },
      { label: "vs top wingers", value: "1.4 avg", trend: "down" },
      { label: "Defensive actions", value: "dropping", trend: "down" },
      { label: "Hit line last 5", value: "2/5 LESS", trend: "neutral" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },

  // ── MATCH 2: Arsenal vs Man City (PL) ──────────────────
  {
    id: "pick_005",
    player: {
      id: "p_saka",
      name: "Bukayo Saka",
      team: "Arsenal",
      position: "Winger",
      nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    },
    match: {
      id: "m_002",
      homeTeam: "Arsenal",
      awayTeam: "Man City",
      competition: "Premier League",
      kickoff: "2026-05-17T16:30:00Z",
      venue: "Emirates Stadium, London",
    },
    platform: "Setpiece",
    statCategory: "Shots on Target",
    line: 1.5,
    direction: "MORE",
    confidence: 79,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Saka has hit MORE 1.5 shots on target in 7 of his last 8 Premier League starts. City's high press creates transition opportunities that Saka thrives in. Arsenal at the Emirates has seen 68% of Saka's shots on target come from counter-attacking sequences this season.",
    recentForm: "2, 2, 3, 1, 2, 2, 3 SOT (last 7 PL starts)",
    keyStats: [
      { label: "SOT avg (PL)", value: "2.1", trend: "up" },
      { label: "Hit 1.5 line", value: "7/8 starts", trend: "up" },
      { label: "vs top 6 SOT", value: "2.3 avg", trend: "up" },
      { label: "xG rank (PL)", value: "Top 5", trend: "up" },
    ],
    isLocked: false,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_006",
    player: {
      id: "p_haaland",
      name: "Erling Haaland",
      team: "Man City",
      position: "Striker",
      nationality: "🇳🇴",
    },
    match: {
      id: "m_002",
      homeTeam: "Arsenal",
      awayTeam: "Man City",
      competition: "Premier League",
      kickoff: "2026-05-17T16:30:00Z",
      venue: "Emirates Stadium, London",
    },
    platform: "Setpiece",
    statCategory: "Goals",
    line: 0.5,
    direction: "MORE",
    confidence: 62,
    confidenceLevel: "MEDIUM",
    aiReasoning:
      "Haaland's record at the Emirates is surprisingly poor — 1 goal in 4 visits. Arsenal's compact defensive block with Saliba marshalling centre-back limits his space. However, any single xG chance for Haaland at 62% confidence at 0.5 line still carries value given his finishing. Moderate confidence pick.",
    recentForm: "1, 0, 2, 0, 1 goals (last 5 PL away)",
    keyStats: [
      { label: "Goals at Emirates", value: "1 in 4", trend: "down" },
      { label: "xG per shot", value: "0.32", trend: "neutral" },
      { label: "Conversion rate", value: "31%", trend: "neutral" },
      { label: "Away form", value: "0.8 gpg", trend: "neutral" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_007",
    player: {
      id: "p_martinelli",
      name: "Gabriel Martinelli",
      team: "Arsenal",
      position: "Winger",
      nationality: "🇧🇷",
    },
    match: {
      id: "m_002",
      homeTeam: "Arsenal",
      awayTeam: "Man City",
      competition: "Premier League",
      kickoff: "2026-05-17T16:30:00Z",
      venue: "Emirates Stadium, London",
    },
    platform: "Setpiece",
    statCategory: "Assists",
    line: 0.5,
    direction: "MORE",
    confidence: 55,
    confidenceLevel: "MEDIUM",
    aiReasoning:
      "Martinelli's assist rate has increased significantly since Arsenal shifted to a 4-3-3 — he's been involved in 8 goals from wide in his last 10. City's right back Kyle Walker has struggled with pace defensively, creating the overlap Martinelli exploits for cutbacks.",
    recentForm: "A, -, -, A, A assists (last 5 PL)",
    keyStats: [
      { label: "Goal involvements", value: "8 last 10", trend: "up" },
      { label: "Cutbacks created", value: "2.4/game", trend: "up" },
      { label: "vs Walker (career)", value: "3A", trend: "up" },
      { label: "Assist rate", value: "23% L10", trend: "up" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },

  // ── MATCH 3: Bayern vs Dortmund (Bundesliga) ───────────
  {
    id: "pick_008",
    player: {
      id: "p_kane",
      name: "Harry Kane",
      team: "Bayern Munich",
      position: "Striker",
      nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    },
    match: {
      id: "m_003",
      homeTeam: "Bayern Munich",
      awayTeam: "Borussia Dortmund",
      competition: "Bundesliga",
      kickoff: "2026-05-17T17:30:00Z",
      venue: "Allianz Arena, Munich",
    },
    platform: "Setpiece",
    statCategory: "Goals",
    line: 0.5,
    direction: "MORE",
    confidence: 83,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Kane has scored in every Der Klassiker since joining Bayern — 3 goals in 3 appearances. He's the Bundesliga's top scorer and Dortmund concede an average of 1.8 goals per game away from home. Bayern's home record is exceptional (W12, D1, L0 at Allianz this season). Kane at 0.5 goals in this fixture is a near lock at current form.",
    recentForm: "G, G, G, G, -, G goals (last 6 BL games)",
    keyStats: [
      { label: "Goals (Klassiker)", value: "3 in 3", trend: "up" },
      { label: "BL top scorer", value: "#1 overall", trend: "up" },
      { label: "Home scoring rate", value: "0.94 gpg", trend: "up" },
      { label: "xG this season", value: "28.7", trend: "up" },
    ],
    isLocked: false,
    isFeatured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_009",
    player: {
      id: "p_musiala",
      name: "Jamal Musiala",
      team: "Bayern Munich",
      position: "Attacking Mid",
      nationality: "🇩🇪",
    },
    match: {
      id: "m_003",
      homeTeam: "Bayern Munich",
      awayTeam: "Borussia Dortmund",
      competition: "Bundesliga",
      kickoff: "2026-05-17T17:30:00Z",
      venue: "Allianz Arena, Munich",
    },
    platform: "Setpiece",
    statCategory: "Shots on Target",
    line: 1.5,
    direction: "MORE",
    confidence: 76,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Musiala's dribbling ability and creativity from deep positions generates high-quality chances. In Bundesliga home games he averages 2.3 shots on target. Dortmund's midfield press often leaves gaps that Musiala's half-turn play exploits. The 1.5 line is appropriate value.",
    recentForm: "2, 1, 3, 2, 2 SOT (last 5 BL home)",
    keyStats: [
      { label: "Avg SOT (BL home)", value: "2.3", trend: "up" },
      { label: "Dribble success", value: "71%", trend: "up" },
      { label: "vs BVB (career)", value: "2.1 SOT", trend: "up" },
      { label: "Key passes/90", value: "3.1", trend: "neutral" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "pick_010",
    player: {
      id: "p_guirassy",
      name: "Serhou Guirassy",
      team: "Borussia Dortmund",
      position: "Striker",
      nationality: "🇬🇳",
    },
    match: {
      id: "m_003",
      homeTeam: "Bayern Munich",
      awayTeam: "Borussia Dortmund",
      competition: "Bundesliga",
      kickoff: "2026-05-17T17:30:00Z",
      venue: "Allianz Arena, Munich",
    },
    platform: "Setpiece",
    statCategory: "Shots on Target",
    line: 2.5,
    direction: "LESS",
    confidence: 71,
    confidenceLevel: "HIGH",
    aiReasoning:
      "Guirassy is dangerous but Bayern's backline is the best in Europe defensively. At the Allianz, opposition strikers average only 0.9 shots on target per game this season. Guirassy himself hit fewer than 2.5 SOT in all 4 of his away Klassiker appearances across his career.",
    recentForm: "1, 2, 0, 1, 2 SOT (last 5 BL away)",
    keyStats: [
      { label: "SOT vs Bayern (away)", value: "1.0 avg", trend: "down" },
      { label: "Allianz opp avg SOT", value: "0.9", trend: "down" },
      { label: "Hit LESS line", value: "4/4 career", trend: "up" },
      { label: "Bayern goals conceded", value: "0.6/home game", trend: "neutral" },
    ],
    isLocked: true,
    createdAt: new Date().toISOString(),
  },
];

// ── Helper: get picks visible to current user ─────────────
export function getVisiblePicks(
  picks: Pick[],
  subscriptionTier: "FREE" | "PRO",
  freePicksPerMatch: number = 2
): Pick[] {
  if (subscriptionTier === "PRO") {
    return picks.map((p) => ({ ...p, isLocked: false }));
  }

  // Group by match, lock after N free picks per match
  const matchCounts: Record<string, number> = {};
  return picks.map((pick) => {
    const matchId = pick.match.id;
    matchCounts[matchId] = (matchCounts[matchId] || 0) + 1;
    const shouldLock = matchCounts[matchId] > freePicksPerMatch;
    return { ...pick, isLocked: shouldLock };
  });
}

// ── Mock chat responses ───────────────────────────────────
export const MOCK_CHAT_RESPONSES: Record<string, string> = {
  default: `Based on my analysis of current form, match conditions, and historical data, here's what the numbers suggest for tonight's picks.

I look at over 40 data points per player including recent xG, shot volumes, defensive matchups, set-piece routines, and head-to-head trends. Always remember: even high-confidence picks carry risk — never stake more than you can afford to lose.

Ask me about a specific player or match for detailed analysis!`,

  mbappe: `**Kylian Mbappé — PSG vs Real Madrid tonight**

This is my highest-confidence pick of the day at **87% confidence**.

Key factors driving the recommendation:
- Mbappé averages **3.2 shots on target** in UCL knockout rounds
- Playing his former club — historically his "revenge" fixtures produce elevated stats
- PSG's high defensive line creates the exact space he exploits with off-shoulder runs
- The 2.5 SOT line is soft given his last 5 game average of 3.2

**Verdict:** MORE 2.5 Shots on Target — strong play.

One caveat: PSG's keeper Donnarumma has an exceptional record vs Mbappé in training, so conversion may be lower. But volume of attempts should clear the line.`,

  haaland: `**Erling Haaland — Arsenal vs Man City**

I'm moderate on Haaland tonight — **62% confidence** on MORE 0.5 goals.

Here's why I'm cautious:
- His record at the Emirates is poor — just **1 goal in 4 visits**
- Arsenal's defensive block with Saliba is elite (0.6 xGA/game at home)
- He's been slightly off his best in away fixtures recently

**Verdict:** Playable but not a strong recommendation. If you're building a lineup, I'd pair a Haaland goal play with a safer pick like Saka shots.`,

  saka: `**Bukayo Saka — Arsenal vs Man City tonight**

Strong play here — **79% confidence**, MORE 1.5 Shots on Target.

Why this stands out:
- Saka has hit MORE in **7 of his last 8 PL starts** — exceptional consistency
- City's press creates exactly the transition moments Saka thrives in
- 68% of his SOT come from counter-attacks at the Emirates this season
- The 1.5 line is conservative relative to his 2.1 season average

**Verdict:** This is one of my top plays today. High floor, good ceiling.`,

  kane: `**Harry Kane — Bayern vs Dortmund (Der Klassiker)**

Kane is my **second highest confidence pick** tonight at **83%** — MORE 0.5 goals.

The data is compelling:
- Scored in every Der Klassiker since joining Bayern — **3 goals in 3 games**
- Bayern's home record this season: W12, D1, L0 — fortress form
- Dortmund concede **1.8 goals away** from home on average
- Kane's xG from expected positions vs Dortmund's defensive shape is exceptional

**Verdict:** Near-lock territory. Strong play.`,
};

export function getMockChatResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("mbapp") || lower.includes("mbappe")) return MOCK_CHAT_RESPONSES.mbappe;
  if (lower.includes("haaland")) return MOCK_CHAT_RESPONSES.haaland;
  if (lower.includes("saka")) return MOCK_CHAT_RESPONSES.saka;
  if (lower.includes("kane")) return MOCK_CHAT_RESPONSES.kane;
  return MOCK_CHAT_RESPONSES.default;
}
