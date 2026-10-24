-- ============================================================
-- SETPIECE — player_club_stats columns for the club season
-- Run in Supabase SQL Editor, then:
--   npm run fetch-club-stats
--
-- Adds the fields the FBref scrape never captured, which is why
-- Passes Attempted, Tackles and Total Bookings could not generate:
--   · position              — no position column existed at all
--   · passes_attempted_per90 — passes_per90 was 99% null, and was
--                              completed passes anyway; the platform
--                              prices attempted
--   · tackles_per90          — refilled from a correctly scaled source
--   · yellow_cards_per90 / fouls_per90 — for booking markets
--
-- Raw season totals are stored alongside the per-90 rates so hit-rate
-- checks can be recomputed without re-fetching.
-- ============================================================

ALTER TABLE player_club_stats
  ADD COLUMN IF NOT EXISTS api_player_id          INTEGER,
  ADD COLUMN IF NOT EXISTS position               TEXT,
  ADD COLUMN IF NOT EXISTS passes_attempted_per90 NUMERIC,
  ADD COLUMN IF NOT EXISTS yellow_cards_per90     NUMERIC,
  ADD COLUMN IF NOT EXISTS fouls_per90            NUMERIC,
  -- Season totals (nullable: not every provider reports every field)
  ADD COLUMN IF NOT EXISTS total_shots            INTEGER,
  ADD COLUMN IF NOT EXISTS total_shots_on_target  INTEGER,
  ADD COLUMN IF NOT EXISTS total_passes_attempted INTEGER,
  ADD COLUMN IF NOT EXISTS total_tackles          INTEGER,
  ADD COLUMN IF NOT EXISTS total_yellow_cards     INTEGER,
  ADD COLUMN IF NOT EXISTS total_fouls_committed  INTEGER;

-- One row per player per club per season, so re-runs update in place
-- instead of duplicating. Partial index skips legacy rows that predate
-- api_player_id.
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_club_stats_identity
  ON player_club_stats (api_player_id, club, season)
  WHERE api_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_club_stats_club_season
  ON player_club_stats (club, season);

CREATE INDEX IF NOT EXISTS idx_player_club_stats_position
  ON player_club_stats (position);
