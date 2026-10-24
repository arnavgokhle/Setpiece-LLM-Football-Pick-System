#!/usr/bin/env tsx
// Smoke-test the club fixture + stats path without calling Claude.
//   npx tsx --env-file=.env.local scripts/verify-club-pipeline.ts
import { getUpcomingClubFixtures, clubsInFixtures } from "../src/lib/club-fixtures";
import { buildClubPlayerStatsContext } from "../src/lib/supabase-player-stats";

async function main() {
  const { fixtures, nextMatchDate } = await getUpcomingClubFixtures(14);
  console.log(`fixtures next 14d: ${fixtures.length} | nextMatchDate: ${nextMatchDate}`);
  for (const f of fixtures.slice(0, 8)) {
    console.log(`  ${f.kickoff.slice(0, 16).replace("T", " ")}Z  [lg ${f.leagueId}] ${f.homeTeam} v ${f.awayTeam}`);
  }
  const ids = new Set(fixtures.map((f) => f.fixtureId));
  console.log(`unique fixtureIds: ${ids.size}/${fixtures.length}`);

  const clubs = clubsInFixtures(fixtures.slice(0, 6));
  console.log(`\nclubs sampled: ${clubs.join(", ")}`);
  const cov = await buildClubPlayerStatsContext(clubs);
  console.log(`players with usable stats: ${cov.playersWithData}`);
  console.log(`usable categories : ${JSON.stringify(cov.usableCategories)}`);
  console.log(`clubs without data: ${cov.clubsWithoutData.join(", ") || "none"}`);
  console.log("suppressed:");
  for (const s of cov.suppressedCategories) console.log(`  - ${s.category}: ${s.reason}`);
  console.log(`\ncontext sample:\n${cov.context.split("\n").slice(0, 9).join("\n")}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
