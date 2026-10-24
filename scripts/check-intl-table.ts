#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Check current schema of player_international_stats
  const { data, error } = await sb.from("player_international_stats").select("*").limit(1);
  if (error) {
    console.log("Table error:", error.message);
  } else {
    console.log("Table exists. Sample columns:", data?.length ? Object.keys(data[0]) : "(empty)");
    const { count } = await sb.from("player_international_stats").select("*", { count: "exact", head: true });
    console.log("Row count:", count);
  }

  // Try inserting a test row to see what columns exist
  const testRow = {
    player_name: "Test Player",
    normalized_name: "test player",
    country: "Test Country",
    tournament: "WC2022",
    tournament_year: 2022,
    matches_played: 3,
    starts: 3,
    minutes: 270,
    goals: 1,
    assists: 0,
    intl_form_score: 40.5,
    is_tournament_performer: false,
    source: "test",
  };
  const { error: insertError } = await sb.from("player_international_stats").upsert(testRow, { onConflict: "normalized_name,tournament" });
  if (insertError) {
    console.log("Insert error:", insertError.message);
  } else {
    console.log("Test insert succeeded — table schema is compatible!");
    // Clean up
    await sb.from("player_international_stats").delete().eq("normalized_name", "test player");
  }
}
main().catch(console.error);
