#!/usr/bin/env tsx
/**
 * FBref International Tournament CSV Parser
 * Parses standard stats CSVs from FBref tournament pages and upserts to
 * player_international_stats (one row per player per tournament).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/parse-international-csv.ts \
 *     path/to/file.csv --tournament WC2022
 *
 * Supported tournament values:
 *   WC2022, WC2018, Euro2024, Copa2024, Copa2021, Euro2021
 *
 * CSV format notes:
 *   - WC2022/Copa/Euro: header has Club column → Squad=col3, Club=col5
 *   - WC2018:           header has NO Club column → Squad=col3, no club col
 *   - Squad values have ISO prefix: "us United States" → strip to "United States"
 *   - Club values have rank prefix: "1.eng Leeds United" → ignored (we don't use club here)
 *   - FBref repeats the header row every ~25 lines — skip them
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Tournament config ─────────────────────────────────────────

const TOURNAMENT_YEARS: Record<string, number> = {
  WC2022: 2022,
  WC2018: 2018,
  Euro2024: 2024,
  Copa2024: 2024,
  Copa2021: 2021,
  Euro2021: 2021,
};

const VALID_TOURNAMENTS = Object.keys(TOURNAMENT_YEARS);

// ── Name normalisation ────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr")
    .replace(/\bii\b/gi, "ii")
    .replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip ISO 2-3 letter prefix from FBref Squad values: "us United States" / "eng England" → country name
function stripIsoPrefix(squad: string): string {
  return squad.replace(/^[a-z]{2,3}\s+/i, "").trim();
}

// ── CSV parsing ───────────────────────────────────────────────

function n(v: string | undefined): number | null {
  if (!v || v === "" || v === "-" || v === "—" || v === "N/A") return null;
  const parsed = parseFloat(v.replace(/,/g, ""));
  return isNaN(parsed) ? null : parsed;
}

function per90(total: number | null, minutes: number | null): number | null {
  if (total == null || !minutes || minutes < 45) return null;
  return Math.round((total / (minutes / 90)) * 1000) / 1000;
}

interface TournamentRecord {
  player_name: string;
  normalized_name: string;
  country: string;
  tournament: string;
  tournament_year: number;
  matches_played: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  xg_per90: number | null;
  progressive_carries_per90: number | null;
  intl_form_score: number;
  is_tournament_performer: boolean;
  source: string;
}

function computeIntlFormScore(rec: TournamentRecord): number {
  const mp = rec.matches_played ?? 0;
  const maxApps = rec.tournament.startsWith("WC") ? 7 : 6;
  const goals = rec.goals ?? 0;
  const assists = rec.assists ?? 0;
  const avgMins = mp > 0 && rec.minutes != null ? rec.minutes / mp : 0;

  const participation = Math.min(mp / maxApps, 1.0) * 30;   // 30 pts for playing full tournament
  const goalScore     = Math.min(goals / 3, 1.0) * 35;       // 35 pts for 3+ goals
  const assistScore   = Math.min(assists / 2, 1.0) * 20;     // 20 pts for 2+ assists
  const starterScore  = avgMins >= 67.5 ? 15 : avgMins >= 45 ? 7 : 0; // 15 pts for regular starter

  return Math.round((participation + goalScore + assistScore + starterScore) * 100) / 100;
}

function parseTournamentCsv(raw: string, tournament: string): TournamentRecord[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (!lines.length) return [];

  // Find the header row: field[0]=="Rk" AND field[1]=="Player"
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split("\t");
    if (
      fields.length >= 5 &&
      fields[0].trim().toLowerCase() === "rk" &&
      fields[1].trim().toLowerCase() === "player"
    ) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    console.warn("  Could not find header row (Rk + Player). File may be empty or wrong format.");
    return [];
  }

  const headerFields = lines[headerIdx].split("\t").map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_+]/g, "")
  );

  // Detect if Club column is present (WC2022+ has it, WC2018 does not)
  const hasClubCol = headerFields.includes("club");

  // Column indices from header
  const col = (name: string) => headerFields.indexOf(name);
  const playerCol = col("player");
  const squadCol  = col("squad");
  const mpCol     = col("mp");
  const startsCol = col("starts");
  const minCol    = col("min");
  const ninesCol  = col("90s");
  // First occurrence of "gls" and "ast" (FBref repeats them for per-90 section)
  const glsCol    = col("gls");
  const astCol    = col("ast");

  const year = TOURNAMENT_YEARS[tournament];
  const records: TournamentRecord[] = [];

  // Dedup by normalized_name + tournament
  const seen = new Set<string>();

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = lines[i].split("\t").map((v) => v.trim());
    if (!values.length || values[0] === "") continue;

    // Skip repeated header rows
    const first = values[0].toLowerCase();
    if (first === "rk" || first === "player") continue;
    if (isNaN(parseInt(values[0]))) continue;

    const playerName = values[playerCol]?.trim() ?? "";
    const squadRaw   = values[squadCol]?.trim() ?? "";
    if (!playerName || playerName.toLowerCase() === "player") continue;

    const country = stripIsoPrefix(squadRaw);
    if (!country) continue;

    // Minutes: prefer "Min" column; fall back to "90s" × 90
    let minutes = n(values[minCol]);
    if (minutes == null) {
      const nineties = n(values[ninesCol]);
      if (nineties != null) minutes = Math.round(nineties * 90);
    }
    if (minutes != null && minutes < 200 && minutes > 0) {
      // Likely stored as 90s value — convert
      minutes = Math.round(minutes * 90);
    }

    const goals   = n(values[glsCol]);
    const assists = n(values[astCol]);
    const mp      = n(values[mpCol]);
    const starts  = n(values[startsCol]);

    const normalized = normalizeName(playerName);
    const dedupeKey  = `${normalized}||${tournament}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const rec: TournamentRecord = {
      player_name: playerName,
      normalized_name: normalized,
      country,
      tournament,
      tournament_year: year,
      matches_played: mp,
      starts,
      minutes,
      goals,
      assists,
      shots_per90: null,             // requires separate shooting CSV
      shots_on_target_per90: null,
      key_passes_per90: null,
      xg_per90: null,
      progressive_carries_per90: null,
      intl_form_score: 0,            // computed below
      is_tournament_performer: false,
      source: "fbref-csv",
    };

    rec.intl_form_score = computeIntlFormScore(rec);
    rec.is_tournament_performer = rec.intl_form_score >= 55;

    records.push(rec);
  }

  return records;
}

// ── Shooting stats from a shooting CSV ───────────────────────
// FBref shooting CSV for tournaments has: Player, Squad, 90s, Sh, SoT, Sh/90, SoT/90, xG, etc.

interface ShootingRow {
  normalized_name: string;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  xg_per90: number | null;
}

function parseShootingCsv(raw: string): ShootingRow[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split("\t");
    if (
      fields.length >= 5 &&
      fields[0].trim().toLowerCase() === "rk" &&
      fields[1].trim().toLowerCase() === "player"
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const headers = lines[headerIdx].split("\t").map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_+]/g, "")
  );

  const playerCol = headers.indexOf("player");
  // Shooting per-90 columns (cleaned: "Sh/90"→"sh90", "SoT/90"→"sot90")
  const sh90Col   = headers.findIndex((h) => h === "sh90"   || h.replace(/[^a-z0-9]/g, "") === "sh90");
  const sot90Col  = headers.findIndex((h) => h === "sot90"  || h.replace(/[^a-z0-9]/g, "") === "sot90");
  const xgCol     = headers.findIndex((h) => h === "xg"     || h === "xgoals");
  const ninesCol  = headers.indexOf("90s");

  const rows: ShootingRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = lines[i].split("\t").map((v) => v.trim());
    if (!values.length || !values[0] || isNaN(parseInt(values[0]))) continue;
    const first = values[0].toLowerCase();
    if (first === "rk" || first === "player") continue;

    const playerName = values[playerCol]?.trim() ?? "";
    if (!playerName) continue;

    const nineties = n(values[ninesCol]);
    const xgRaw   = xgCol >= 0 ? n(values[xgCol]) : null;

    rows.push({
      normalized_name: normalizeName(playerName),
      shots_per90:           sh90Col  >= 0 ? n(values[sh90Col])  : null,
      shots_on_target_per90: sot90Col >= 0 ? n(values[sot90Col]) : null,
      xg_per90: nineties && xgRaw != null ? per90(xgRaw, nineties * 90) : null,
    });
  }
  return rows;
}

// ── Upsert ────────────────────────────────────────────────────

async function upsertRecords(
  records: TournamentRecord[]
): Promise<{ ok: number; err: number }> {
  if (!records.length) return { ok: 0, err: 0 };
  let ok = 0, err = 0;

  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    const { error } = await supabase
      .from("player_international_stats")
      .upsert(chunk, { onConflict: "normalized_name,tournament" });
    if (error) {
      console.error(`  Upsert error (chunk ${i}):`, error.message);
      err += chunk.length;
    } else {
      ok += chunk.length;
    }
  }
  return { ok, err };
}

async function updateShootingStats(
  tournament: string,
  shootingRows: ShootingRow[]
): Promise<{ ok: number; err: number; missing: number }> {
  if (!shootingRows.length) return { ok: 0, err: 0, missing: 0 };
  let ok = 0, err = 0, missing = 0;

  for (const row of shootingRows) {
    const cols: Record<string, number | null> = {};
    if (row.shots_per90 != null)           cols.shots_per90 = row.shots_per90;
    if (row.shots_on_target_per90 != null) cols.shots_on_target_per90 = row.shots_on_target_per90;
    if (row.xg_per90 != null)             cols.xg_per90 = row.xg_per90;
    if (!Object.keys(cols).length) continue;

    const { error, count } = await supabase
      .from("player_international_stats")
      .update(cols)
      .eq("normalized_name", row.normalized_name)
      .eq("tournament", tournament);

    if (error) err++;
    else if (count != null && count === 0) missing++;
    else ok++;
  }
  return { ok, err, missing };
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find((a) => !a.startsWith("--"));
  const tournamentIdx = args.indexOf("--tournament");
  const shootingIdx   = args.indexOf("--shooting");
  const tournament    = tournamentIdx !== -1 ? args[tournamentIdx + 1] : undefined;
  const isShootingCsv = shootingIdx !== -1;

  if (!csvPath || !tournament) {
    console.error("Usage: npx tsx --env-file=.env.local scripts/parse-international-csv.ts <file.csv> --tournament <NAME>");
    console.error(`  Valid names: ${VALID_TOURNAMENTS.join(", ")}`);
    console.error("  Add --shooting flag when parsing a shooting stats CSV");
    process.exit(1);
  }

  if (!VALID_TOURNAMENTS.includes(tournament)) {
    console.error(`Unknown tournament: ${tournament}. Valid: ${VALID_TOURNAMENTS.join(", ")}`);
    process.exit(1);
  }

  const absPath = path.resolve(csvPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: Missing Supabase env vars");
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");

  if (!raw.trim()) {
    console.log(`  ⚠ File is empty — skipping ${tournament}`);
    process.exit(0);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  International Tournament CSV Parser              ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  File:       ${path.basename(absPath)}`);
  console.log(`  Tournament: ${tournament}`);
  console.log(`  Mode:       ${isShootingCsv ? "shooting stats (UPDATE only)" : "standard stats (UPSERT)"}\n`);

  if (isShootingCsv) {
    const shootingRows = parseShootingCsv(raw);
    console.log(`  Shooting rows parsed: ${shootingRows.length}`);
    const { ok, err, missing } = await updateShootingStats(tournament, shootingRows);
    console.log(`  Updated: ${ok} | Errors: ${err} | Missing: ${missing}`);
  } else {
    const records = parseTournamentCsv(raw, tournament);

    if (!records.length) {
      console.log("  No records parsed — file may be empty or wrong format.");
      process.exit(0);
    }

    console.log(`  Records parsed: ${records.length}`);
    const performers = records.filter((r) => r.is_tournament_performer).length;
    console.log(`  Tournament performers (score≥55): ${performers}`);

    const topScorers = records
      .filter((r) => (r.goals ?? 0) > 0)
      .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
      .slice(0, 5);
    if (topScorers.length) {
      console.log("  Top scorers:");
      topScorers.forEach((r) =>
        console.log(`    ${r.player_name} (${r.country}) — ${r.goals}G ${r.assists}A in ${r.matches_played} games`)
      );
    }

    console.log("\n── Writing to player_international_stats ──────────");
    const { ok, err } = await upsertRecords(records);
    console.log(`  Upserted: ${ok} | Errors: ${err}`);

    // Verify
    const { count } = await supabase
      .from("player_international_stats")
      .select("*", { count: "exact", head: true })
      .eq("tournament", tournament);
    console.log(`  Rows in DB for ${tournament}: ${count}`);
  }

  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
