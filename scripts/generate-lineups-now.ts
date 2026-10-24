import { getUpcomingPicksFromDB } from "../src/lib/supabase-picks";
import { generateLineups } from "../src/lib/lineup-generator";
import { saveLineups, lineupsExistForDate, deleteLineupsForDate } from "../src/lib/supabase-lineups";

async function main() {
  const todayDate = new Date().toISOString().split("T")[0];
  console.log(`\nGenerating Power Play lineups for ${todayDate}...\n`);

  // Clear existing so we can regenerate
  await deleteLineupsForDate(todayDate);

  const picks = await getUpcomingPicksFromDB();
  const storedPicks = picks.filter((p) => p.dbId);
  console.log(`Found ${storedPicks.length} picks in DB:`);
  storedPicks.forEach((p) =>
    console.log(`  ${p.player.name} (${p.player.team}) — ${p.direction} ${p.line} ${p.statCategory} [${p.confidence}%]`)
  );

  if (storedPicks.length < 2) {
    console.log("\n✗ Not enough picks to generate lineups.");
    return;
  }

  console.log("\nCalling Claude to generate lineups...");
  const rawLineups = await generateLineups(storedPicks);

  if (!rawLineups.length) {
    console.log("✗ Claude returned no lineups.");
    return;
  }

  await saveLineups(rawLineups, storedPicks);
  console.log(`\n✓ ${rawLineups.length} lineup(s) saved for ${todayDate}`);
  rawLineups.forEach((l) =>
    console.log(`  ${l.type.toUpperCase()} — ${l.pickDbIds.length} picks — ${l.confidence}% conf — ${l.estimatedPayout}x payout`)
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
