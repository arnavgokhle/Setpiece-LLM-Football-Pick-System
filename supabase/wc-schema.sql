-- ============================================================
-- SETPIECE — World Cup 2026 Player Database
-- Run in Supabase SQL Editor
-- ============================================================

-- ── WC Fixtures ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_fixtures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id      INTEGER UNIQUE NOT NULL,       -- API-Football fixture ID
  match_date      DATE NOT NULL,
  kickoff_at      TIMESTAMPTZ NOT NULL,
  home_team       TEXT NOT NULL,
  away_team       TEXT NOT NULL,
  home_team_id    INTEGER,                       -- API-Football team ID
  away_team_id    INTEGER,
  venue           TEXT,
  city            TEXT,
  stage           TEXT NOT NULL,                 -- 'Group A' … 'Group L', 'R32', 'R16', 'QF', 'SF', '3rd', 'Final'
  group_name      TEXT,                          -- 'A'–'L' for group stage, NULL for knockout
  home_score      INTEGER,
  away_score      INTEGER,
  status          TEXT NOT NULL DEFAULT 'NS',   -- NS, 1H, HT, 2H, FT, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WC Players ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wc_players (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_api_id               INTEGER UNIQUE,    -- API-Football player ID
  name                        TEXT NOT NULL,
  country                     TEXT NOT NULL,     -- e.g. 'England', 'Brazil'
  club                        TEXT,              -- club team in 2025-26
  position                    TEXT,              -- GK, DEF, MID, FWD
  age                         INTEGER,
  shirt_number                INTEGER,
  -- International career totals
  caps                        INTEGER DEFAULT 0,
  international_goals         INTEGER DEFAULT 0,
  international_assists       INTEGER DEFAULT 0,
  -- Per-90 stats (season averages from club + international)
  stats_per90                 JSONB NOT NULL DEFAULT '{}',
  -- Example:
  -- {
  --   "shots_per90": 2.1,
  --   "shots_on_target_per90": 0.9,
  --   "key_passes_per90": 1.4,
  --   "assists_per90": 0.3,
  --   "tackles_per90": 2.2,
  --   "saves_per90": null,
  --   "passes_per90": 42.1
  -- }
  -- Last 15 international match stats (array, most recent first)
  recent_form                 JSONB NOT NULL DEFAULT '[]',
  -- Example element:
  -- { "date": "2026-03-26", "opponent": "Germany", "goals": 1, "assists": 0, "shots_on_target": 2, "key_passes": 3, "tackles": 1, "minutes": 90 }
  -- Tournament history
  tournament_history          JSONB NOT NULL DEFAULT '[]',
  -- Example element:
  -- { "year": 2022, "tournament": "FIFA World Cup", "stage": "Quarter-finals", "goals": 3, "assists": 1, "appearances": 5 }
  -- Advanced stats (FBref / calculated)
  xg_per90                    NUMERIC(6, 3),
  progressive_carries_per90   NUMERIC(6, 2),
  shot_creating_actions_per90 NUMERIC(6, 2),
  -- Metadata
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wc_fixtures_date       ON wc_fixtures (match_date);
CREATE INDEX IF NOT EXISTS idx_wc_fixtures_kickoff    ON wc_fixtures (kickoff_at);
CREATE INDEX IF NOT EXISTS idx_wc_fixtures_stage      ON wc_fixtures (stage);
CREATE INDEX IF NOT EXISTS idx_wc_players_country     ON wc_players (country);
CREATE INDEX IF NOT EXISTS idx_wc_players_position    ON wc_players (position);
CREATE INDEX IF NOT EXISTS idx_wc_players_api_id      ON wc_players (player_api_id);

-- ── Row Level Security ─────────────────────────────────────
ALTER TABLE wc_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_players  ENABLE ROW LEVEL SECURITY;

-- Public read access (fixtures and player profiles are public data)
CREATE POLICY "Public read wc_fixtures" ON wc_fixtures FOR SELECT USING (true);
CREATE POLICY "Public read wc_players"  ON wc_players  FOR SELECT USING (true);

-- Service role write access
CREATE POLICY "Service insert wc_fixtures" ON wc_fixtures FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update wc_fixtures" ON wc_fixtures FOR UPDATE USING (true);
CREATE POLICY "Service insert wc_players"  ON wc_players  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update wc_players"  ON wc_players  FOR UPDATE USING (true);
CREATE POLICY "Service delete wc_players"  ON wc_players  FOR DELETE USING (true);
