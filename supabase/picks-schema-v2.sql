-- ============================================================
-- SETPIECE — Two-Stage Pick System — Schema Migration v2
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to run on existing picks table (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ── 1. Extend picks table with stage columns ─────────────────
ALTER TABLE public.picks
  ADD COLUMN IF NOT EXISTS stage             TEXT        NOT NULL DEFAULT 'early'
    CHECK (stage IN ('early', 'final')),
  ADD COLUMN IF NOT EXISTS early_confidence  INTEGER,
  ADD COLUMN IF NOT EXISTS early_reasoning   TEXT,
  ADD COLUMN IF NOT EXISTS finalized_at      TIMESTAMPTZ;

-- Index for the finalization cron query
CREATE INDEX IF NOT EXISTS picks_stage_kickoff_idx
  ON public.picks (stage, kickoff_at);

-- ── 2. Match follows table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_follows (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  fixture_id  INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT match_follows_user_fixture_uidx UNIQUE (user_id, fixture_id)
);

ALTER TABLE public.match_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows"
  ON public.match_follows FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. Notifications table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  fixture_id  INTEGER     NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'final_picks_ready',
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON public.notifications (user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own notifications
CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role inserts notifications on finalization
CREATE POLICY "Service inserts notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
