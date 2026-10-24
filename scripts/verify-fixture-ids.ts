#!/usr/bin/env tsx
/**
 * Phase 1 verification — fixture id round trip.
 *
 * Asserts that a club fixture's id survives the trip
 *   club_fixtures.fixture_key → RealFixture.id → parseFixtureId → picks.fixture_id
 * without collapsing to 0 and without colliding across fixtures.
 *
 * Makes no Claude calls and writes nothing.
 */
import { getUpcomingClubFixtures } from "../src/lib/club-fixtures";
import { parseFixtureId } from "../src/lib/fixture-id";

async function main() {
  // Widen the window so the check works outside a matchweek.
  const { fixtures } = await getUpcomingClubFixtures(90, { priorityOnly: false });
  console.log(`fixtures in 90d window: ${fixtures.length}`);
  if (!fixtures.length) {
    console.log("no fixtures — cannot verify");
    process.exit(1);
  }

  let zeros = 0;
  let mismatches = 0;
  const seen = new Map<number, string>();
  const collisions: string[] = [];

  for (const f of fixtures) {
    const parsed = parseFixtureId(f.id);
    if (parsed === 0) zeros++;
    if (parsed !== f.fixtureId) {
      mismatches++;
      if (mismatches <= 3) console.log(`  MISMATCH ${f.id} → ${parsed} ≠ ${f.fixtureId}`);
    }
    const prev = seen.get(parsed);
    if (prev && prev !== f.id) collisions.push(`${prev} vs ${f.id} → ${parsed}`);
    seen.set(parsed, f.id);
  }

  console.log(`\n  sample: ${fixtures[0].homeTeam} v ${fixtures[0].awayTeam}`);
  console.log(`          id=${fixtures[0].id} → fixture_id=${parseFixtureId(fixtures[0].id)}`);
  console.log(`\n  parsed to 0 (the bug):  ${zeros}`);
  console.log(`  id/fixtureId mismatch:  ${mismatches}`);
  console.log(`  distinct ids:           ${seen.size} / ${fixtures.length}`);
  console.log(`  collisions:             ${collisions.length}`);
  collisions.slice(0, 3).forEach((c) => console.log(`    ${c}`));

  // Legacy prefixes must still parse
  const legacy: [string, number][] = [["af_12345", 12345], ["wc_77", 77], ["manual_9", 9]];
  const legacyBad = legacy.filter(([id, want]) => parseFixtureId(id) !== want);
  console.log(`  legacy prefixes ok:     ${legacyBad.length === 0}`);

  const ok = zeros === 0 && mismatches === 0 && collisions.length === 0 && legacyBad.length === 0;
  console.log(ok ? "\nPASS" : "\nFAIL");
  process.exit(ok ? 0 : 1);
}

main();
