#!/usr/bin/env tsx
/**
 * Phase 2 verification — the void gate.
 *
 * The gate exists so a pick is never scored won/lost on a guess.
 * These cases are the ones that would corrupt the published hit rate.
 * No network, no DB writes.
 */
import { isCited, buildSearchQuery, type GradedPick } from "../src/lib/pipeline/grade-results";

const cases: { name: string; g: GradedPick; want: boolean }[] = [
  { name: "cited number + quote",       g: { id: "1", result: "won",  actual: "3 shots on target", evidence: "Saka had 3 shots on target", cited: true },  want: true },
  { name: "model says unknown",         g: { id: "2", result: "void", actual: "unknown", evidence: "", cited: false }, want: false },
  { name: "number but no quote",        g: { id: "3", result: "won",  actual: "4 shots", evidence: "", cited: true },  want: false },
  { name: "quote but no number",        g: { id: "4", result: "won",  actual: "several shots", evidence: "he shot often", cited: true }, want: false },
  { name: "cited=false overrides",      g: { id: "5", result: "won",  actual: "2 tackles", evidence: "made 2 tackles", cited: false }, want: false },
  { name: "empty actual",               g: { id: "6", result: "lost", actual: "", evidence: "quote", cited: true },  want: false },
  { name: "n/a actual",                 g: { id: "7", result: "lost", actual: "N/A", evidence: "quote", cited: true }, want: false },
  { name: "cited omitted, valid data",  g: { id: "8", result: "won",  actual: "68 passes", evidence: "68 passes attempted" }, want: true },
];

let fail = 0;
for (const c of cases) {
  const got = isCited(c.g);
  const ok = got === c.want;
  if (!ok) fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${c.name.padEnd(24)} → cited=${got} (want ${c.want})`);
}

console.log("\n  search queries:");
console.log(`    club: ${buildSearchQuery({ homeTeam: "Arsenal", awayTeam: "Everton", competition: "Premier League", matchDate: "2026-08-22" })}`);
console.log(`    none: ${buildSearchQuery({ homeTeam: "Bayern Munich", awayTeam: "Barcelona", competition: null, matchDate: "2026-09-15" })}`);

console.log(fail === 0 ? "\nPASS" : `\nFAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
