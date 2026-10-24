#!/usr/bin/env tsx
/**
 * Migrates player_international_stats from old schema to new tournament-based schema.
 * Since we can't run raw DDL via Supabase JS SDK, this script:
 *   1. Checks if the table has the 'tournament' column
 *   2. If not, reports exactly what SQL to run in the Supabase Dashboard
 *   3. If yes, confirms ready to proceed
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Probe for 'tournament' column by attempting a select with it
  const { data, error } = await sb
    .from("player_international_stats")
    .select("tournament")
    .limit(1);

  if (error?.message.includes("column") || error?.message.includes("tournament")) {
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║  MIGRATION REQUIRED — Run this SQL in Supabase Dashboard:    ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    console.log("Go to: Supabase Dashboard → SQL Editor → paste and run:\n");
    console.log(`-- Drop old table and create new tournament-per-row schema
DROP TABLE IF EXISTS player_international_stats;

CREATE TABLE player_international_stats (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name                 TEXT NOT NULL,
  normalized_name             TEXT NOT NULL,
  country                     TEXT NOT NULL,
  tournament                  TEXT NOT NULL,
  tournament_year             INTEGER,
  matches_played              INTEGER,
  starts                      INTEGER,
  minutes                     INTEGER,
  goals                       INTEGER,
  assists                     INTEGER,
  shots_per90                 NUMERIC(6, 3),
  shots_on_target_per90       NUMERIC(6, 3),
  key_passes_per90            NUMERIC(6, 3),
  xg_per90                    NUMERIC(6, 4),
  progressive_carries_per90   NUMERIC(6, 3),
  intl_form_score             NUMERIC(5, 2),
  is_tournament_performer     BOOLEAN DEFAULT FALSE,
  source                      TEXT DEFAULT 'fbref',
  scraped_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (normalized_name, tournament)
);

CREATE INDEX idx_pis_normalized  ON player_international_stats (normalized_name);
CREATE INDEX idx_pis_country     ON player_international_stats (country);
CREATE INDEX idx_pis_tournament  ON player_international_stats (tournament);

ALTER TABLE player_international_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_international_stats"    ON player_international_stats FOR SELECT USING (true);
CREATE POLICY "Service insert player_international_stats" ON player_international_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update player_international_stats" ON player_international_stats FOR UPDATE USING (true);
CREATE POLICY "Service delete player_international_stats" ON player_international_stats FOR DELETE USING (true);`);
    console.log("\nThen run this script again to verify, then run parse-international-csv.ts");
    process.exit(1);
  }

  if (!error) {
    console.log("✓ Table already has 'tournament' column — schema is ready.");
    const { count } = await sb.from("player_international_stats").select("*", { count: "exact", head: true });
    console.log(`  Current row count: ${count}`);

    // Test insert
    const testRow = {
      player_name: "Test Player",
      normalized_name: "__test__",
      country: "Test",
      tournament: "WC2022",
      tournament_year: 2022,
      matches_played: 3,
      goals: 1,
      assists: 0,
      intl_form_score: 40,
      is_tournament_performer: false,
      source: "test",
    };
    const { error: insertErr } = await sb
      .from("player_international_stats")
      .upsert(testRow, { onConflict: "normalized_name,tournament" });
    if (insertErr) {
      console.error("  Insert test failed:", insertErr.message);
      process.exit(1);
    }
    await sb.from("player_international_stats").delete().eq("normalized_name", "__test__");
    console.log("  Insert test passed. Ready to parse CSVs.");
  }
}

main().catch(console.error);
