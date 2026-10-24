-- ============================================================
-- SETPIECE — Lineups Schema
-- Run in Supabase SQL Editor after picks-schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchday DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('safe', 'power', 'jackpot')),
  combined_edge NUMERIC,
  estimated_payout NUMERIC,
  confidence INTEGER,
  reasoning TEXT,
  result TEXT DEFAULT 'pending' CHECK (result IN ('won', 'lost', 'pending', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lineup_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID REFERENCES public.lineups(id) ON DELETE CASCADE,
  pick_db_id UUID NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lineups_matchday ON public.lineups(matchday);
CREATE INDEX IF NOT EXISTS idx_lineup_picks_lineup_id ON public.lineup_picks(lineup_id);

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lineup_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read lineups" ON public.lineups;
DROP POLICY IF EXISTS "Public can read lineup_picks" ON public.lineup_picks;

CREATE POLICY "Public can read lineups" ON public.lineups FOR SELECT USING (true);
CREATE POLICY "Public can read lineup_picks" ON public.lineup_picks FOR SELECT USING (true);
