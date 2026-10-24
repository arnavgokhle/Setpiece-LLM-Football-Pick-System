#!/usr/bin/env tsx
/**
 * Phase 3 verification — the 7-of-10 rule and the confidence ceiling.
 *
 * These are the guarantees the product's hit rate depends on, so they
 * are tested against constructed logs rather than trusted to the prompt.
 * No network, no DB.
 */
import {
  applyFormRules,
  confidenceCap,
  hitCount,
  MIN_MATCHES_TO_ENFORCE,
  type FormIndex,
  type PlayerForm,
} from "../src/lib/club-form";
import type { Pick } from "../src/types";

function mkPick(name: string, cat: string, line: number, dir: "MORE" | "LESS", conf: number): Pick {
  return {
    id: name, player: { id: name, name, team: "Arsenal", position: "FW" },
    match: { id: "cf_1", homeTeam: "Arsenal", awayTeam: "Everton", competition: "Premier League", kickoff: "2026-08-22T14:00:00Z", venue: "Emirates" },
    platform: "Setpiece", statCategory: cat, line, direction: dir,
    confidence: conf, confidenceLevel: "HIGH", aiReasoning: "", recentForm: "1, 1, 1",
    keyStats: [{ label: "Hit Last 10", value: "9/10", trend: "up" }, { label: "Avg", value: "3.1", trend: "up" }],
    stage: "early",
  } as unknown as Pick;
}

function mkForm(name: string, col: string, values: number[]): [string, PlayerForm] {
  return [
    `${name.toLowerCase()}|arsenal`,
    { playerName: name, club: "Arsenal",
      matches: values.map((v, i) => ({ player_name: name, club: "Arsenal", match_date: `2026-08-${20 - i}`, [col]: v })) },
  ];
}

const form: FormIndex = new Map([
  // 8 of 10 above 1.5 → passes
  mkForm("Saka", "shots_on_target", [3, 2, 2, 1, 2, 3, 2, 2, 0, 2]),
  // 4 of 10 above 1.5 → must be dropped
  mkForm("Havertz", "shots_on_target", [2, 0, 1, 1, 3, 0, 0, 2, 1, 1]),
  // only 2 logged → cannot judge, keep but cap at 78
  mkForm("Rice", "shots_on_target", [2, 3]),
]);

const picks = [
  mkPick("Saka", "Shots on Target", 1.5, "MORE", 82),
  mkPick("Havertz", "Shots on Target", 1.5, "MORE", 80),
  mkPick("Rice", "Shots on Target", 1.5, "MORE", 82),
  mkPick("Unknown Player", "Shots on Target", 1.5, "MORE", 82),
];

const { kept, dropped, adjusted } = applyFormRules(picks, form);

console.log("  kept:");
for (const k of kept) {
  const hit = k.keyStats?.find((s) => s.label === "Hit Last 10")?.value;
  console.log(`    ${k.player.name.padEnd(16)} conf=${k.confidence}  HitLast10=${hit}  form="${k.recentForm}"`);
}
console.log("  dropped:");
for (const d of dropped) console.log(`    ${d.pick.player.name.padEnd(16)} ${d.reason}`);

const bySaka = kept.find((k) => k.player.name === "Saka");
const byRice = kept.find((k) => k.player.name === "Rice");
const byUnknown = kept.find((k) => k.player.name === "Unknown Player");

const checks: [string, boolean][] = [
  ["Havertz dropped (4/10 < 7/10)", !kept.some((k) => k.player.name === "Havertz")],
  ["Saka kept at 8/10", !!bySaka],
  ["Saka keeps 82 (10 logged)", bySaka?.confidence === 82],
  ["Saka Hit Last 10 corrected to 8/10", bySaka?.keyStats?.[0].value === "8/10"],
  ["Saka recentForm from real log", bySaka?.recentForm === "3, 2, 2, 1, 2"],
  ["Rice capped to 78 (2 logged)", byRice?.confidence === 78],
  ["Unlogged player capped to 78", byUnknown?.confidence === 78],
  ["adjusted count = 2", adjusted === 2],
  ["cap ladder 0→78 3→80 6→81 10→82",
    confidenceCap(0) === 78 && confidenceCap(3) === 80 && confidenceCap(6) === 81 && confidenceCap(10) === 82],
  ["hitCount LESS direction", hitCount([1, 2, 3], 2.5, "LESS") === 2],
  ["enforce threshold is 3", MIN_MATCHES_TO_ENFORCE === 3],
  ["unlogged Hit Last 10 marked est.",
    byUnknown?.keyStats?.some((k) => k.label === "Hit Last 10 (est.)") === true],
  ["logged Hit Last 10 not marked est.",
    bySaka?.keyStats?.some((k) => k.label === "Hit Last 10 (est.)") !== true],
];

console.log();
let fail = 0;
for (const [name, ok] of checks) {
  if (!ok) fail++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${name}`);
}
console.log(fail === 0 ? "\nPASS" : `\nFAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
