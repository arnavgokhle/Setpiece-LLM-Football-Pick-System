-- ============================================================
-- WC 2026 Analytics Database
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. TEAM TACTICAL PROFILES
-- Formation, defensive line, pressing style, scoring patterns per 48 WC nations
CREATE TABLE IF NOT EXISTS team_tactical_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL UNIQUE,
  confederation TEXT NOT NULL,         -- UEFA, CONMEBOL, CAF, AFC, CONCACAF, OFC
  fifa_ranking INTEGER,
  formation TEXT NOT NULL,             -- e.g. "4-3-3", "3-5-2"
  defensive_style TEXT NOT NULL,       -- 'high-press' | 'mid-block' | 'low-block' | 'man-mark'
  pressing_intensity TEXT NOT NULL,    -- 'high' | 'medium' | 'low'
  defensive_line TEXT NOT NULL,        -- 'high' | 'medium' | 'deep'
  attacking_style TEXT NOT NULL,       -- 'possession' | 'counter' | 'direct' | 'wing-play' | 'tiki-taka'
  avg_possession NUMERIC(4,1),         -- % in qualifying
  avg_shots_per_game NUMERIC(4,1),
  avg_shots_conceded_per_game NUMERIC(4,1),
  avg_goals_scored_per_game NUMERIC(4,2),
  avg_goals_conceded_per_game NUMERIC(4,2),
  avg_passes_per_game INTEGER,
  avg_tackles_per_game NUMERIC(4,1),
  avg_key_passes_per_game NUMERIC(4,1),
  set_piece_threat TEXT NOT NULL,      -- 'high' | 'medium' | 'low'
  corner_taker TEXT,                   -- primary corner/free kick taker name
  group_stage TEXT,                    -- WC 2026 group (A-L)
  wc_record TEXT,                      -- e.g. "Previous WC finals appearances: 7"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_tactical_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_tactical_profiles" ON team_tactical_profiles FOR SELECT USING (true);
CREATE POLICY "Service insert team_tactical_profiles" ON team_tactical_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update team_tactical_profiles" ON team_tactical_profiles FOR UPDATE USING (true);

-- 2. PLAYER ROLE PROFILES
-- Top 300 DFS-relevant players with per-90 club stats for WC context
CREATE TABLE IF NOT EXISTS player_role_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  country TEXT NOT NULL,
  club TEXT NOT NULL,
  position TEXT NOT NULL,              -- GK, CB, RB, LB, DM, CM, AM, RW, LW, ST
  dfs_role TEXT NOT NULL,              -- 'shooter' | 'playmaker' | 'tackler' | 'crosser' | 'deep-threat'
  -- Per-90 club season stats (2024-25 / 2025-26)
  shots_per90 NUMERIC(4,2),
  shots_on_target_per90 NUMERIC(4,2),
  key_passes_per90 NUMERIC(4,2),
  assists_per90 NUMERIC(4,2),
  passes_per90 NUMERIC(5,1),
  pass_accuracy NUMERIC(4,1),          -- %
  tackles_per90 NUMERIC(4,2),
  interceptions_per90 NUMERIC(4,2),
  dribbles_per90 NUMERIC(4,2),
  -- International context
  intl_caps INTEGER DEFAULT 0,
  intl_goals INTEGER DEFAULT 0,
  intl_assists INTEGER DEFAULT 0,
  -- DFS line benchmarks
  typical_shots_line NUMERIC(3,1),     -- e.g. 1.5 or 2.5
  typical_passes_line NUMERIC(5,1),    -- e.g. 40.5
  typical_tackles_line NUMERIC(3,1),
  typical_key_passes_line NUMERIC(3,1),
  -- Confidence modifiers
  big_game_rating NUMERIC(3,1),        -- 1-10: how they perform in high-pressure WC-style games
  injury_risk TEXT DEFAULT 'low',      -- 'high' | 'medium' | 'low'
  -- Meta
  wc_squad_confirmed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_name, country)
);

ALTER TABLE player_role_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_role_profiles" ON player_role_profiles FOR SELECT USING (true);
CREATE POLICY "Service insert player_role_profiles" ON player_role_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update player_role_profiles" ON player_role_profiles FOR UPDATE USING (true);

-- 3. MATCHUP PROFILES
-- Attacker style vs defender style expected outcome modifiers
CREATE TABLE IF NOT EXISTS matchup_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_style TEXT NOT NULL,        -- 'dribbler' | 'aerial' | 'link-up' | 'runner' | 'poacher' | 'creative'
  defender_style TEXT NOT NULL,        -- 'high-press' | 'mid-block' | 'low-block' | 'man-mark' | 'zonal'
  stat_category TEXT NOT NULL,         -- 'Shots on Target' | 'Key Passes' | 'Passes' | 'Assists' | 'Tackles'
  -- Expected outcome modifier
  outcome_boost NUMERIC(3,2) DEFAULT 0.00,  -- positive = more likely to beat line, negative = less likely
  -- e.g. dribbler vs high-press: shots_on_target outcome_boost = +0.15 (press opens space)
  -- e.g. creative vs man-mark: key_passes outcome_boost = -0.20 (tight marking reduces creativity)
  confidence_modifier INTEGER DEFAULT 0,    -- +/- to apply to base confidence
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE matchup_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read matchup_profiles" ON matchup_profiles FOR SELECT USING (true);
CREATE POLICY "Service insert matchup_profiles" ON matchup_profiles FOR INSERT WITH CHECK (true);

-- 4. TOURNAMENT PRESSURE PROFILES
-- Players with 20+ caps — how they perform under WC-level pressure
CREATE TABLE IF NOT EXISTS tournament_pressure_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  country TEXT NOT NULL,
  total_caps INTEGER NOT NULL,
  -- WC specific history
  wc_appearances INTEGER DEFAULT 0,    -- total WC group stage + knockout games
  wc_goals INTEGER DEFAULT 0,
  wc_assists INTEGER DEFAULT 0,
  -- Pressure performance rating (1-10 scale, based on historical big game stats)
  pressure_rating NUMERIC(3,1),        -- 1-10 how they perform in must-win / high-stakes games
  -- Group stage vs knockout split (if available)
  group_stage_avg_shots NUMERIC(3,1),
  knockout_avg_shots NUMERIC(3,1),
  -- Clutch marker
  is_clutch_player BOOLEAN DEFAULT false,  -- known to elevate in big moments
  -- Fatigue / rotation risk at WC
  minutes_per_game_intl NUMERIC(4,1),
  rotation_risk TEXT DEFAULT 'low',    -- 'high' | 'medium' | 'low'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_name, country)
);

ALTER TABLE tournament_pressure_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tournament_pressure_profiles" ON tournament_pressure_profiles FOR SELECT USING (true);
CREATE POLICY "Service insert tournament_pressure_profiles" ON tournament_pressure_profiles FOR INSERT WITH CHECK (true);

-- 5. SET PIECE DATABASE
-- Set piece takers, routines, and threat levels for all 48 WC nations
CREATE TABLE IF NOT EXISTS set_piece_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL UNIQUE,
  -- Corner routines
  primary_corner_taker TEXT,
  secondary_corner_taker TEXT,
  corner_delivery_style TEXT,          -- 'inswing' | 'outswing' | 'short' | 'mixed'
  corner_target_player TEXT,           -- main aerial threat in the box
  corners_per_game NUMERIC(3,1),
  corner_to_shot_conversion NUMERIC(4,2),    -- % of corners resulting in shot
  -- Free kicks
  primary_fk_taker TEXT,
  secondary_fk_taker TEXT,
  fk_delivery_style TEXT,              -- 'direct' | 'cross' | 'short' | 'mixed'
  direct_fk_threat TEXT,               -- 'high' | 'medium' | 'low' (dangerous from range)
  -- Penalty kicks
  primary_penalty_taker TEXT,
  -- Set piece conceded context
  set_piece_vulnerability TEXT,        -- 'high' | 'medium' | 'low' (how much they concede from set pieces)
  -- Overall DFS relevance
  set_piece_dfs_score INTEGER,         -- 1-10: how many DFS-relevant stats come from set pieces
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE set_piece_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read set_piece_database" ON set_piece_database FOR SELECT USING (true);
CREATE POLICY "Service insert set_piece_database" ON set_piece_database FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update set_piece_database" ON set_piece_database FOR UPDATE USING (true);

-- Indexes for fast lookups in picks engine
CREATE INDEX IF NOT EXISTS idx_team_tactical_country ON team_tactical_profiles(country);
CREATE INDEX IF NOT EXISTS idx_player_role_country ON player_role_profiles(country);
CREATE INDEX IF NOT EXISTS idx_player_role_name ON player_role_profiles(player_name);
CREATE INDEX IF NOT EXISTS idx_tournament_pressure_country ON tournament_pressure_profiles(country);
CREATE INDEX IF NOT EXISTS idx_set_piece_country ON set_piece_database(country);
CREATE INDEX IF NOT EXISTS idx_matchup_attacker_style ON matchup_profiles(attacker_style, defender_style, stat_category);
