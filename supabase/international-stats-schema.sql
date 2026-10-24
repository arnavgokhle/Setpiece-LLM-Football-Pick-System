-- ============================================================
-- SETPIECE — International Tournament Stats Schema
-- One row per player per tournament (WC2022, WC2018, Euro2024, etc.)
-- Parsed from FBref tournament CSVs
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop old single-row-per-player table and replace with per-tournament rows
DROP TABLE IF EXISTS player_international_stats;

CREATE TABLE player_international_stats (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name                 TEXT NOT NULL,
  normalized_name             TEXT NOT NULL,
  country                     TEXT NOT NULL,
  tournament                  TEXT NOT NULL,  -- 'WC2022', 'WC2018', 'Euro2024', 'Copa2024', 'Copa2021', 'Euro2021'
  tournament_year             INTEGER,
  matches_played              INTEGER,
  starts                      INTEGER,
  minutes                     INTEGER,
  goals                       INTEGER,
  assists                     INTEGER,
  shots_per90                 NUMERIC(6, 3),
  shots_on_target_per90       NUMERIC(6, 3),
  key_passes_per90            NUMERIC(6, 3),
  xg_per90                    NUMERIC(6, 4),
  progressive_carries_per90   NUMERIC(6, 3),
  intl_form_score             NUMERIC(5, 2),    -- 0-100, computed at parse time
  is_tournament_performer     BOOLEAN DEFAULT FALSE,  -- score >= 55
  source                      TEXT DEFAULT 'fbref',
  scraped_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (normalized_name, tournament)
);

CREATE INDEX IF NOT EXISTS idx_pis_normalized  ON player_international_stats (normalized_name);
CREATE INDEX IF NOT EXISTS idx_pis_country     ON player_international_stats (country);
CREATE INDEX IF NOT EXISTS idx_pis_tournament  ON player_international_stats (tournament);
CREATE INDEX IF NOT EXISTS idx_pis_performer   ON player_international_stats (is_tournament_performer)
  WHERE is_tournament_performer = TRUE;

ALTER TABLE player_international_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_international_stats"
  ON player_international_stats FOR SELECT USING (true);
CREATE POLICY "Service insert player_international_stats"
  ON player_international_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update player_international_stats"
  ON player_international_stats FOR UPDATE USING (true);
CREATE POLICY "Service delete player_international_stats"
  ON player_international_stats FOR DELETE USING (true);
