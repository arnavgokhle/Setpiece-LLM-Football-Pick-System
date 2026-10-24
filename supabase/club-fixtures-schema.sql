-- ============================================================
-- SETPIECE — Club football fixtures (2026-27)
-- Run in Supabase SQL Editor, then:
--   npm run ingest-club-fixtures
--
-- Replaces wc_fixtures as the fixture source for club season.
-- wc_fixtures is left intact (historical WC results + H2H lookup).
-- ============================================================

CREATE TABLE IF NOT EXISTS club_fixtures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deterministic natural key: '<league_code>-<season>-<match_number>'
  -- e.g. 'epl-2026-27-1'. Lets the ingest script re-run idempotently
  -- without an API-Football fixture id (account currently suspended).
  fixture_key     TEXT UNIQUE NOT NULL,

  league_code     TEXT NOT NULL,          -- epl | la-liga | bundesliga | ligue-1 | ucl
  league_name     TEXT NOT NULL,          -- 'Premier League'
  api_league_id   INTEGER,                -- API-Football league id, for later reconciliation
  season          TEXT NOT NULL DEFAULT '2026-27',

  round           INTEGER,                -- matchday number
  match_number    INTEGER,                -- source match number within the season

  kickoff_at      TIMESTAMPTZ NOT NULL,   -- always UTC; convert to IST at display time
  match_date      DATE NOT NULL,          -- UTC calendar date, for cheap day grouping

  -- Canonical names, aligned to player_club_stats.club (FBref naming)
  home_team       TEXT NOT NULL,
  away_team       TEXT NOT NULL,
  -- Names exactly as published, kept so re-ingests can be audited
  home_team_raw   TEXT,
  away_team_raw   TEXT,

  venue           TEXT,
  home_score      INTEGER,
  away_score      INTEGER,
  status          TEXT NOT NULL DEFAULT 'NS',   -- NS | FT | PST | CANC

  -- FALSE where the published time is a date-only placeholder or is not
  -- yet trustworthy (currently everything outside the Premier League).
  -- Pick staging (generate 24h out, finalise 4h out) must not rely on
  -- kickoff_at until this is TRUE.
  kickoff_confirmed BOOLEAN NOT NULL DEFAULT FALSE,

  -- TRUE for every Premier League fixture, plus any fixture involving a
  -- marquee club (see MARQUEE_CLUBS in scripts/ingest-club-fixtures.ts).
  -- The picks pipeline reads only is_priority fixtures.
  is_priority     BOOLEAN NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_fixtures_kickoff   ON club_fixtures (kickoff_at);
CREATE INDEX IF NOT EXISTS idx_club_fixtures_date      ON club_fixtures (match_date);
CREATE INDEX IF NOT EXISTS idx_club_fixtures_league    ON club_fixtures (league_code);
CREATE INDEX IF NOT EXISTS idx_club_fixtures_priority  ON club_fixtures (is_priority, kickoff_at);
CREATE INDEX IF NOT EXISTS idx_club_fixtures_teams     ON club_fixtures (home_team, away_team);

-- Read-only to the browser; all writes go through the service client.
ALTER TABLE club_fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "club_fixtures public read" ON club_fixtures;
CREATE POLICY "club_fixtures public read"
  ON club_fixtures FOR SELECT
  USING (true);
