-- Claude API usage tracking table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS claude_api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  called_at TIMESTAMPTZ DEFAULT NOW(),
  fixture_count INTEGER,
  stage TEXT,            -- 'early' | 'final' | 'lineups'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd NUMERIC(10, 6),
  triggered_by TEXT      -- 'cron' | 'admin' | 'force-picks'
);

ALTER TABLE claude_api_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read claude_api_calls" ON claude_api_calls
  FOR SELECT USING (true);

CREATE POLICY "Service can insert claude_api_calls" ON claude_api_calls
  FOR INSERT WITH CHECK (true);
