// ============================================================
// SETPIECE — Core TypeScript Types
// ============================================================

export type Direction = "MORE" | "LESS";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type SubscriptionTier = "FREE" | "PRO";
export type Sport = "football" | "basketball" | "baseball";
export type Platform = "Setpiece";
export type PickResult = "won" | "lost" | "pending" | "void";
export type PickStage = "early" | "final";

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  imageUrl?: string;
  nationality?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string; // ISO string
  venue: string;
}

export interface Pick {
  id: string;
  dbId?: string;        // Supabase row UUID
  player: Player;
  match: Match;
  platform: Platform;
  statCategory: string;
  line: number;
  direction: Direction;
  confidence: number;   // 0–100
  confidenceLevel: ConfidenceLevel;
  aiReasoning: string;
  shortReasoning?: string;  // 1-sentence summary for card display
  recentForm: string;
  keyStats: KeyStat[];
  // Odds data
  odds?: number;              // decimal odds e.g. 1.54
  impliedProbability?: number; // % e.g. 65
  edgeScore?: number;         // aiConfidence - impliedProbability e.g. +22
  // Matchup analysis
  matchupRating?: 'strong' | 'neutral' | 'tough'; // opponent defensive matchup for this stat
  matchupContext?: string;    // e.g. "Opponent concedes 12.3 shots/game — above Mbappé's avg"
  // Stage tracking
  stage?: PickStage;
  earlyConfidence?: number;
  earlyReasoning?: string;
  finalizedAt?: string;
  // Meta
  isLocked: boolean;
  isFeatured?: boolean;
  result?: PickResult;
  createdAt: string;
}

export interface MatchFollow {
  id: string;
  userId: string;
  fixtureId: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  fixtureId: number;
  type: "final_picks_ready";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface KeyStat {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  subscriptionEndsAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  stripePriceId: string;
}

// ---- Power Plays (Lineups) ----

export type LineupType = "safe" | "power" | "jackpot";
export type LineupResult = "won" | "lost" | "pending" | "void";

export interface Lineup {
  id: string;
  matchday: string;
  type: LineupType;
  picks: Pick[];
  combinedEdge: number;
  estimatedPayout: number;
  confidence: number;
  reasoning: string;
  result: LineupResult;
  createdAt: string;
}

export interface LineupStat {
  total: number;
  won: number;
  hitRate: number;
}
