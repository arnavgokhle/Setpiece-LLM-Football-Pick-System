#!/usr/bin/env tsx
/**
 * Clears incorrectly computed xG/xAG values from player_club_stats.
 * The original FBref standard stats CSV export had Gls/90 at the xG column position,
 * causing garbage values (e.g. Haaland xG/90 = 0.025 instead of ~0.85).
 * Run once after re-importing the corrected CSV data.
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { count: before } = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("xg_per90", "is", null);
  console.log(`Rows with xg_per90 before: ${before}`);

  // Supabase doesn't support UPDATE without a WHERE clause, use a batch approach
  // Clear in batches by normalized_name ranges
  let cleared = 0;
  let from = 0;
  while (true) {
    const { data: batch } = await sb.from("player_club_stats")
      .select("normalized_name, club, season")
      .not("xg_per90", "is", null)
      .range(from, from + 499);
    if (!batch?.length) break;

    // Update each row in this batch
    for (const row of batch) {
      await sb.from("player_club_stats")
        .update({ xg_per90: null, xag_per90: null })
        .eq("normalized_name", row.normalized_name)
        .eq("club", row.club)
        .eq("season", row.season);
    }
    cleared += batch.length;
    console.log(`  Cleared ${cleared} rows...`);
    if (batch.length < 500) break;
    // Don't increment from — cleared rows fall out of the NOT NULL filter, so always query from 0
  }

  const { count: after } = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("xg_per90", "is", null);
  console.log(`Rows with xg_per90 after: ${after}`);
  console.log("Done.");
}
main().catch(console.error);
