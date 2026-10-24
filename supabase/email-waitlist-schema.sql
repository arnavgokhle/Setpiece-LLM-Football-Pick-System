-- Email capture popup — opening day picks waitlist
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL UNIQUE,
  source     TEXT        NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_waitlist_email ON email_waitlist (email);
CREATE INDEX IF NOT EXISTS idx_email_waitlist_created ON email_waitlist (created_at DESC);

ALTER TABLE email_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert" ON email_waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read"  ON email_waitlist FOR SELECT USING (true);
