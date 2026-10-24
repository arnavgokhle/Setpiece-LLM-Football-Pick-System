-- ============================================================
-- SETPIECE — Real Player Stats Schema
-- Scraped from FBref.com — replaces Claude-generated statistics
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Club stats (2024-25 season, Big 5 European leagues) ────
CREATE TABLE IF NOT EXISTS player_club_stats (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name               TEXT NOT NULL,
  normalized_name           TEXT NOT NULL,  -- lowercase, no diacritics, for matching
  club                      TEXT NOT NULL,
  league                    TEXT,
  season                    TEXT NOT NULL DEFAULT '2024-25',
  matches_played            INTEGER,
  starts                    INTEGER,
  minutes                   INTEGER,
  goals                     INTEGER,
  assists                   INTEGER,
  shots_per90               NUMERIC(6, 3),
  shots_on_target_per90     NUMERIC(6, 3),
  key_passes_per90          NUMERIC(6, 3),
  passes_per90              NUMERIC(6, 1),
  tackles_per90             NUMERIC(6, 3),
  progressive_carries_per90 NUMERIC(6, 3),
  xg_per90                  NUMERIC(6, 4),
  xag_per90                 NUMERIC(6, 4),
  source                    TEXT DEFAULT 'fbref',
  scraped_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (normalized_name, club, season)
);

CREATE INDEX IF NOT EXISTS idx_pcs_normalized ON player_club_stats (normalized_name);
CREATE INDEX IF NOT EXISTS idx_pcs_club       ON player_club_stats (club);
CREATE INDEX IF NOT EXISTS idx_pcs_season     ON player_club_stats (season);

ALTER TABLE player_club_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_club_stats"    ON player_club_stats FOR SELECT USING (true);
CREATE POLICY "Service insert player_club_stats" ON player_club_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update player_club_stats" ON player_club_stats FOR UPDATE USING (true);

-- ── International stats (from FBref national team / WC pages) ─
CREATE TABLE IF NOT EXISTS player_international_stats (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name                 TEXT NOT NULL,
  normalized_name             TEXT NOT NULL,
  country                     TEXT NOT NULL,
  total_caps                  INTEGER,
  international_goals         INTEGER,
  international_assists       INTEGER,
  shots_per90_intl            NUMERIC(6, 3),
  shots_on_target_per90_intl  NUMERIC(6, 3),
  key_passes_per90_intl       NUMERIC(6, 3),
  passes_per90_intl           NUMERIC(6, 1),
  tackles_per90_intl          NUMERIC(6, 3),
  xg_per90_intl               NUMERIC(6, 4),
  minutes_per_game_intl       NUMERIC(6, 1),
  wc_appearances              INTEGER DEFAULT 0,
  wc_goals                    INTEGER DEFAULT 0,
  wc_assists                  INTEGER DEFAULT 0,
  source                      TEXT DEFAULT 'fbref',
  scraped_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (normalized_name, country)
);

CREATE INDEX IF NOT EXISTS idx_pis_normalized ON player_international_stats (normalized_name);
CREATE INDEX IF NOT EXISTS idx_pis_country    ON player_international_stats (country);

ALTER TABLE player_international_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_international_stats"    ON player_international_stats FOR SELECT USING (true);
CREATE POLICY "Service insert player_international_stats" ON player_international_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update player_international_stats" ON player_international_stats FOR UPDATE USING (true);
