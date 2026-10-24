-- ============================================================
-- SETPIECE — Picks Table Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.picks (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id          INTEGER       NOT NULL,
  home_team           TEXT          NOT NULL,
  away_team           TEXT          NOT NULL,
  competition         TEXT          NOT NULL,
  kickoff_at          TIMESTAMPTZ   NOT NULL,
  venue               TEXT          DEFAULT 'Venue TBC',

  player_name         TEXT          NOT NULL,
  player_team         TEXT          NOT NULL,
  player_position     TEXT          NOT NULL,

  stat_category       TEXT          NOT NULL,
  line                DECIMAL(6,2)  NOT NULL,
  direction           TEXT          NOT NULL CHECK (direction IN ('MORE', 'LESS')),

  confidence          INTEGER       NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  confidence_level    TEXT          NOT NULL CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),

  ai_reasoning        TEXT          NOT NULL,
  recent_form         TEXT          NOT NULL,
  key_stats           JSONB         DEFAULT '[]',
  is_featured         BOOLEAN       DEFAULT FALSE,

  odds                DECIMAL(8,4),
  implied_probability INTEGER,
  edge_score          INTEGER,

  result              TEXT          DEFAULT 'pending' CHECK (result IN ('won', 'lost', 'pending', 'void')),
  pick_date           DATE          DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS picks_kickoff_at_idx  ON public.picks (kickoff_at);
CREATE INDEX IF NOT EXISTS picks_pick_date_idx   ON public.picks (pick_date);
CREATE INDEX IF NOT EXISTS picks_result_idx      ON public.picks (result);
CREATE INDEX IF NOT EXISTS picks_fixture_id_idx  ON public.picks (fixture_id);

-- Row Level Security
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

-- Anyone can read picks (results page is public)
CREATE POLICY "Public can view picks"
  ON public.picks FOR SELECT
  USING (true);

-- Allow inserts from server (picks generation)
CREATE POLICY "Service can insert picks"
  ON public.picks FOR INSERT
  WITH CHECK (true);

-- Allow updates from server (mark result, odds refresh)
CREATE POLICY "Service can update picks"
  ON public.picks FOR UPDATE
  USING (true);

-- Allow deletes (regeneration / admin)
CREATE POLICY "Service can delete picks"
  ON public.picks FOR DELETE
  USING (true);
