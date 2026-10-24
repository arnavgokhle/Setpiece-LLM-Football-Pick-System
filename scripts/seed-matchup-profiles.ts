/**
 * Seed script: matchup_profiles
 * Attacker style × defender style × stat category = outcome modifier
 * Run: npm run seed-matchup-profiles
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MatchupProfile {
  attacker_style: string;
  defender_style: string;
  stat_category: string;
  outcome_boost: number;
  confidence_modifier: number;
  notes: string;
}

// Attacker styles: dribbler | aerial | link-up | runner | poacher | creative
// Defender styles: high-press | mid-block | low-block | man-mark | zonal
// Stat categories: Shots on Target | Key Passes | Passes | Assists | Tackles

const MATCHUPS: MatchupProfile[] = [
  // ── DRIBBLER vs each defensive style ────────────────────
  {
    attacker_style: "dribbler",
    defender_style: "high-press",
    stat_category: "Shots on Target",
    outcome_boost: 0.18,
    confidence_modifier: 5,
    notes: "High press creates space behind — dribblers exploit with runs into box",
  },
  {
    attacker_style: "dribbler",
    defender_style: "high-press",
    stat_category: "Key Passes",
    outcome_boost: 0.12,
    confidence_modifier: 3,
    notes: "Quick transitions after beating press create key pass opportunities",
  },
  {
    attacker_style: "dribbler",
    defender_style: "mid-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.05,
    confidence_modifier: 1,
    notes: "Compact mid-block limits space — dribbler finds fewer chances but can still create",
  },
  {
    attacker_style: "dribbler",
    defender_style: "mid-block",
    stat_category: "Key Passes",
    outcome_boost: 0.08,
    confidence_modifier: 2,
    notes: "Midblock can be beaten by tight-space dribbling to create for teammates",
  },
  {
    attacker_style: "dribbler",
    defender_style: "low-block",
    stat_category: "Shots on Target",
    outcome_boost: -0.12,
    confidence_modifier: -4,
    notes: "Deep low-block crowds the box — dribblers struggle to find shooting lanes",
  },
  {
    attacker_style: "dribbler",
    defender_style: "low-block",
    stat_category: "Key Passes",
    outcome_boost: 0.10,
    confidence_modifier: 2,
    notes: "Compact defense forces lateral play — dribblers become creative distributors",
  },
  {
    attacker_style: "dribbler",
    defender_style: "man-mark",
    stat_category: "Shots on Target",
    outcome_boost: -0.15,
    confidence_modifier: -5,
    notes: "Elite dribblers disrupted by tight man-marking, especially in WC high-stakes games",
  },
  {
    attacker_style: "dribbler",
    defender_style: "man-mark",
    stat_category: "Key Passes",
    outcome_boost: -0.18,
    confidence_modifier: -6,
    notes: "Man-mark neutralises creative dribblers — key pass numbers drop significantly",
  },
  {
    attacker_style: "dribbler",
    defender_style: "zonal",
    stat_category: "Shots on Target",
    outcome_boost: 0.10,
    confidence_modifier: 3,
    notes: "Zonal schemes have gaps between zones — dribblers exploit the seams",
  },

  // ── AERIAL vs each defensive style ──────────────────────
  {
    attacker_style: "aerial",
    defender_style: "high-press",
    stat_category: "Shots on Target",
    outcome_boost: 0.08,
    confidence_modifier: 2,
    notes: "High press leaves aerial threat in 1v1 situations at set pieces and long balls",
  },
  {
    attacker_style: "aerial",
    defender_style: "mid-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.04,
    confidence_modifier: 1,
    notes: "Neutral — aerial threats get crosses but midblock protects the box",
  },
  {
    attacker_style: "aerial",
    defender_style: "low-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.15,
    confidence_modifier: 4,
    notes: "Low-block deep defense invites crosses — aerial threat flourishes on set pieces",
  },
  {
    attacker_style: "aerial",
    defender_style: "zonal",
    stat_category: "Shots on Target",
    outcome_boost: 0.14,
    confidence_modifier: 4,
    notes: "Zonal marking vulnerable to late runners — aerial threat exploits timing",
  },
  {
    attacker_style: "aerial",
    defender_style: "man-mark",
    stat_category: "Shots on Target",
    outcome_boost: -0.10,
    confidence_modifier: -3,
    notes: "Physical man-marker negates aerial threat's advantage — controlled contest",
  },

  // ── LINK-UP vs each defensive style ─────────────────────
  {
    attacker_style: "link-up",
    defender_style: "high-press",
    stat_category: "Key Passes",
    outcome_boost: -0.12,
    confidence_modifier: -4,
    notes: "High press disrupts link-up play — passes under pressure reduce quality",
  },
  {
    attacker_style: "link-up",
    defender_style: "high-press",
    stat_category: "Passes",
    outcome_boost: -0.20,
    confidence_modifier: -5,
    notes: "High press significantly reduces pass volume for link-up players",
  },
  {
    attacker_style: "link-up",
    defender_style: "mid-block",
    stat_category: "Key Passes",
    outcome_boost: 0.10,
    confidence_modifier: 3,
    notes: "Mid-block gives time on ball — link-up players find pockets and distribute",
  },
  {
    attacker_style: "link-up",
    defender_style: "mid-block",
    stat_category: "Passes",
    outcome_boost: 0.15,
    confidence_modifier: 4,
    notes: "Sitting defense lets link-up player accumulate pass volume",
  },
  {
    attacker_style: "link-up",
    defender_style: "low-block",
    stat_category: "Passes",
    outcome_boost: 0.18,
    confidence_modifier: 5,
    notes: "Deep defense = high possession time — link-up player accumulates passes",
  },
  {
    attacker_style: "link-up",
    defender_style: "low-block",
    stat_category: "Assists",
    outcome_boost: 0.12,
    confidence_modifier: 3,
    notes: "More possession → more chance to create assists in crowded final third",
  },
  {
    attacker_style: "link-up",
    defender_style: "man-mark",
    stat_category: "Key Passes",
    outcome_boost: -0.20,
    confidence_modifier: -7,
    notes: "Man-marking is worst case for creative link-up player — no time or space",
  },
  {
    attacker_style: "link-up",
    defender_style: "zonal",
    stat_category: "Key Passes",
    outcome_boost: 0.08,
    confidence_modifier: 2,
    notes: "Zonal gaps allow link-up player to find pockets between lines",
  },

  // ── RUNNER vs each defensive style ──────────────────────
  {
    attacker_style: "runner",
    defender_style: "high-press",
    stat_category: "Shots on Target",
    outcome_boost: 0.20,
    confidence_modifier: 6,
    notes: "High press creates space in behind — runners with pace have field day",
  },
  {
    attacker_style: "runner",
    defender_style: "high-press",
    stat_category: "Assists",
    outcome_boost: 0.14,
    confidence_modifier: 4,
    notes: "Runner behind press turns turnovers into goals — assists come in transition",
  },
  {
    attacker_style: "runner",
    defender_style: "mid-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.05,
    confidence_modifier: 1,
    notes: "Mid-block limits space but runners can still find channels",
  },
  {
    attacker_style: "runner",
    defender_style: "low-block",
    stat_category: "Shots on Target",
    outcome_boost: -0.15,
    confidence_modifier: -5,
    notes: "Low-block kills space in behind — runner's main weapon neutralised",
  },
  {
    attacker_style: "runner",
    defender_style: "man-mark",
    stat_category: "Shots on Target",
    outcome_boost: -0.08,
    confidence_modifier: -2,
    notes: "Physical tracker can follow runner but risks being beaten for pace",
  },
  {
    attacker_style: "runner",
    defender_style: "zonal",
    stat_category: "Shots on Target",
    outcome_boost: 0.12,
    confidence_modifier: 3,
    notes: "Zonal gaps allow runners to exploit seams between defenders",
  },

  // ── POACHER vs each defensive style ─────────────────────
  {
    attacker_style: "poacher",
    defender_style: "high-press",
    stat_category: "Shots on Target",
    outcome_boost: 0.14,
    confidence_modifier: 4,
    notes: "High press means keeper distribution → second ball → poacher opportunity",
  },
  {
    attacker_style: "poacher",
    defender_style: "mid-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.06,
    confidence_modifier: 2,
    notes: "Mid-block means fewer but cleaner chances — poacher's quality over quantity",
  },
  {
    attacker_style: "poacher",
    defender_style: "low-block",
    stat_category: "Shots on Target",
    outcome_boost: 0.08,
    confidence_modifier: 2,
    notes: "Low-block invites crosses — poacher gets headers but fewer through-balls",
  },
  {
    attacker_style: "poacher",
    defender_style: "man-mark",
    stat_category: "Shots on Target",
    outcome_boost: -0.12,
    confidence_modifier: -4,
    notes: "Tight man-marking in box reduces poacher's sniff opportunities",
  },
  {
    attacker_style: "poacher",
    defender_style: "zonal",
    stat_category: "Shots on Target",
    outcome_boost: 0.15,
    confidence_modifier: 5,
    notes: "Zonal marking worst vs poachers — timing runs through zones generates shots",
  },

  // ── CREATIVE vs each defensive style ────────────────────
  {
    attacker_style: "creative",
    defender_style: "high-press",
    stat_category: "Key Passes",
    outcome_boost: -0.15,
    confidence_modifier: -5,
    notes: "High press disrupts creative player's vision and time on ball",
  },
  {
    attacker_style: "creative",
    defender_style: "high-press",
    stat_category: "Assists",
    outcome_boost: -0.10,
    confidence_modifier: -3,
    notes: "No time to find teammates in transition — creative player nullified",
  },
  {
    attacker_style: "creative",
    defender_style: "mid-block",
    stat_category: "Key Passes",
    outcome_boost: 0.12,
    confidence_modifier: 4,
    notes: "Compact mid-block gives creative player time in front — key passes accumulate",
  },
  {
    attacker_style: "creative",
    defender_style: "mid-block",
    stat_category: "Assists",
    outcome_boost: 0.10,
    confidence_modifier: 3,
    notes: "Creative player chips away at mid-block, eventually creates assist opportunity",
  },
  {
    attacker_style: "creative",
    defender_style: "low-block",
    stat_category: "Key Passes",
    outcome_boost: 0.14,
    confidence_modifier: 4,
    notes: "Deep defense gives most time — creative player probes and generates key passes",
  },
  {
    attacker_style: "creative",
    defender_style: "low-block",
    stat_category: "Passes",
    outcome_boost: 0.20,
    confidence_modifier: 6,
    notes: "Low block invites possession — creative player's pass volume peaks",
  },
  {
    attacker_style: "creative",
    defender_style: "man-mark",
    stat_category: "Key Passes",
    outcome_boost: -0.22,
    confidence_modifier: -8,
    notes: "Man-marking is catastrophic for creative players — shadow marking eliminates them",
  },
  {
    attacker_style: "creative",
    defender_style: "zonal",
    stat_category: "Key Passes",
    outcome_boost: 0.10,
    confidence_modifier: 3,
    notes: "Creative players find the gaps in zonal schemes for through-balls",
  },

  // ── TACKLES — defensive midfielder context ───────────────
  {
    attacker_style: "dribbler",
    defender_style: "high-press",
    stat_category: "Tackles",
    outcome_boost: 0.15,
    confidence_modifier: 5,
    notes: "High press = more tackle attempts from pressing DMs vs dribblers",
  },
  {
    attacker_style: "runner",
    defender_style: "high-press",
    stat_category: "Tackles",
    outcome_boost: 0.12,
    confidence_modifier: 4,
    notes: "Press-and-recover = DMs tracking runners back for tackles",
  },
  {
    attacker_style: "link-up",
    defender_style: "high-press",
    stat_category: "Tackles",
    outcome_boost: 0.18,
    confidence_modifier: 6,
    notes: "High press involves constant tackle attempts to win possession",
  },
  {
    attacker_style: "creative",
    defender_style: "mid-block",
    stat_category: "Tackles",
    outcome_boost: -0.08,
    confidence_modifier: -2,
    notes: "Mid-block DMs more positional — fewer tackles, more blocks",
  },
];

async function main() {
  console.log(`[seed-matchup-profiles] Starting — ${MATCHUPS.length} matchup profiles to seed`);

  // Check if table is already populated
  const { count } = await supabase
    .from("matchup_profiles")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    console.log(`[seed-matchup-profiles] Already seeded (${count} rows). Skipping.`);
    return;
  }

  const { error } = await supabase.from("matchup_profiles").insert(MATCHUPS);
  if (error) {
    console.error("[seed-matchup-profiles] Insert error:", error.message);
    process.exit(1);
  }

  console.log(`[seed-matchup-profiles] Done — ${MATCHUPS.length} matchup profiles inserted`);
}

main().catch((e) => { console.error(e); process.exit(1); });
