-- ============================================================
-- SETPIECE — Waitlist Table
-- Stores emails of users waiting for US card payments
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  country    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can read waitlist" ON waitlist FOR SELECT USING (true);
