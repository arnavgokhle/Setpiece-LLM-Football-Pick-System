-- Run in Supabase SQL Editor
-- Adds columns needed for platform-calibrated stat categories (Passes Attempted, Tackles)

ALTER TABLE wc_match_stats
  ADD COLUMN IF NOT EXISTS passes_attempted INTEGER,
  ADD COLUMN IF NOT EXISTS tackles INTEGER;

ALTER TABLE player_club_stats
  ADD COLUMN IF NOT EXISTS passes_attempted_per90 NUMERIC(5, 2);
