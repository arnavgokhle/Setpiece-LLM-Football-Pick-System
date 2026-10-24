-- ============================================================
-- SETPIECE — Result grading for the club season
-- Run in Supabase SQL Editor.
--
-- Two changes:
--
-- 1. picks.grading_status — separates a genuine void ("player was
--    rested") from an ungraded one ("the search didn't contain a
--    number"). Both stay result='void' so neither can move the
--    published hit rate, but only the second lands in the admin
--    review queue. Without this split the two are indistinguishable
--    and there is nothing to review against.
--
-- 2. club_match_stats — per-match actuals for club fixtures, the
--    club equivalent of wc_match_stats. This is what closes the
--    loop: graded picks write real match numbers back, and pick
--    generation reads them as rolling form. Without it the 7-of-10
--    rule is checked against season averages forever.
-- ============================================================

-- ── 1. Grading provenance on picks ──────────────────────────
ALTER TABLE picks
  ADD COLUMN IF NOT EXISTS grading_status   TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS grading_evidence TEXT,
  ADD COLUMN IF NOT EXISTS graded_at        TIMESTAMPTZ;

-- auto            — machine-graded with a cited number
-- needs_review    — machine could not cite a number; awaiting a human call
-- human_confirmed — a human set this result
ALTER TABLE picks
  DROP CONSTRAINT IF EXISTS picks_grading_status_check;
ALTER TABLE picks
  ADD CONSTRAINT picks_grading_status_check
  CHECK (grading_status IN ('auto', 'needs_review', 'human_confirmed'));

-- The review queue is read on every admin page load.
CREATE INDEX IF NOT EXISTS idx_picks_grading_status
  ON picks (grading_status, kickoff_at DESC)
  WHERE grading_status = 'needs_review';

-- ── 2. Per-match actuals for club fixtures ──────────────────
CREATE TABLE IF NOT EXISTS club_match_stats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name       TEXT NOT NULL,
  club              TEXT NOT NULL,
  opponent          TEXT,
  competition       TEXT,
  match_date        DATE NOT NULL,
  fixture_id        BIGINT,

  minutes           INTEGER,
  shots             INTEGER,
  shots_on_target   INTEGER,
  passes_attempted  INTEGER,
  tackles           INTEGER,
  yellow_cards      INTEGER,
  fouls_committed   INTEGER,
  -- Match-level markets (player_name = 'Match' / 'Bookings')
  match_corners     INTEGER,
  match_bookings    INTEGER,

  -- Provenance: never let a guessed number become training data.
  source            TEXT NOT NULL DEFAULT 'auto',   -- auto | human
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- One row per player per match, so re-grading updates in place.
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_match_stats_identity
  ON club_match_stats (player_name, match_date, club);

CREATE INDEX IF NOT EXISTS idx_club_match_stats_lookup
  ON club_match_stats (club, match_date DESC);

CREATE INDEX IF NOT EXISTS idx_club_match_stats_player
  ON club_match_stats (player_name, match_date DESC);

ALTER TABLE club_match_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club_match_stats_public_read" ON club_match_stats;
CREATE POLICY "club_match_stats_public_read"
  ON club_match_stats FOR SELECT USING (true);
