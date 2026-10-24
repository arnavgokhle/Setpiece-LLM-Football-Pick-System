#!/usr/bin/env tsx
/**
 * FBref CSV Parser
 * Parses a CSV exported from any FBref stats page and upserts to player_club_stats.
 *
 * Usage:
 *   npm run parse-fbref-csv -- path/to/file.csv
 *   npm run parse-fbref-csv -- path/to/file.csv --league "La Liga"
 *
 * How to get the CSV:
 *   1. Open any FBref stats page (e.g. Big5 standard stats)
 *   2. Scroll to the table → click "Share & Export" → "Get table as CSV"
 *   3. Copy the text and save as a .csv file
 *   4. Run this script with the file path
 *
 * Stat types auto-detected:
 *   standard  — goals, assists, minutes (positional columns; col 20-24 = per-90 derived goals, NOT xG)
 *   shooting  — shots/90, SoT/90 (header row; col "Sh/90", "SoT/90")
 *   passing   — key_passes/90 (header row; col "KP")
 *   defense   — tackles/90, interceptions/90 (header row; col "TklW", "Int")
 *
 * Upsert strategy:
 *   standard  → full INSERT/UPDATE (base row)
 *   shooting/passing/defense → UPDATE-only for relevant columns (preserves other stats)
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function nameVariants(name: string): string[] {
  const base = normalizeName(name);
  const variants = new Set<string>([base]);
  variants.add(base.replace(/\bjr\b/, "junior"));
  variants.add(base.replace(/\bjunior\b/, "jr"));
  variants.add(
    base
      .replace(/\b(de|da|van|von|del|dos|el|al)\b/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
  const parts = base.split(" ");
  if (parts.length >= 3) variants.add(`${parts[0]} ${parts[parts.length - 1]}`);
  return [...variants].filter(Boolean);
}

// ── FBref standard stats positional columns (TSV, no header) ─
// NOTE: These are for the "Get table as CSV" export of the Big 5 standard stats page.
// VERIFIED column layout (26 cols):
//   0=Rk  1=Player  2=Nation  3=Pos  4=Squad  5=Comp  6=Age  7=Born
//   8=MP  9=Starts  10=Min  11=90s
//   12=Gls  13=Ast  14=G+A  15=G-PK  16=PK  17=PKatt  18=CrdY  19=CrdR
//   20=Gls/90  21=Ast/90  22=G+A/90  23=G-PK/90  24=(xG+xAG)/90  25=Matches
// Col 20-24 are per-90 DERIVED stats, NOT raw xG/xAG/PrgC.
// Do not map xg/xag/prog_car from positional cols — there's no standalone xG here.
const FBREF_POS: Record<string, number> = {
  player: 1, squad: 4, comp: 5, games: 8, starts: 9,
  minutes: 10, goals: 12, assists: 13,
};

// ── CSV/TSV parsing ───────────────────────────────────────────

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());

  if (!lines.length) return [];

  // FBref pages often start with navigation text, competition summary tables, etc.
  // Strategy: scan for the actual player data table, which is identified by:
  //   a) A row starting with "Rk" (or a small integer) AND containing "Player" — that's the header
  //   b) Or just rows starting with small integers with many tab fields — that's headerless data
  // We prefer the first row where field[0]=="Rk" and field[1]=="Player" (the player table header).
  // Fall back to first multi-tab line if no such row exists.

  let dataStartIdx = 0;
  let hasHeader = false;

  // Pass 1: look for explicit player header row (Rk + Player)
  for (let i = 0; i < lines.length; i++) {
    const fields = lines[i].split("\t");
    if (fields.length >= 5 &&
        fields[0].trim().toLowerCase() === "rk" &&
        fields[1].trim().toLowerCase() === "player") {
      dataStartIdx = i;
      hasHeader = true;
      break;
    }
  }

  // Pass 2: if no header found, find first line with ≥5 numeric-starting tab fields
  if (!hasHeader) {
    for (let i = 0; i < Math.min(lines.length, 200); i++) {
      const fields = lines[i].split("\t");
      if (fields.length >= 5 && !isNaN(parseInt(fields[0].trim()))) {
        dataStartIdx = i;
        break;
      }
    }
  }

  const firstDataLine = lines[dataStartIdx];

  // Detect separator using the actual data row
  const tabCount = (firstDataLine.match(/\t/g) ?? []).length;
  const commaCount = (firstDataLine.match(/,/g) ?? []).length;
  const sep = tabCount > commaCount ? "\t" : ",";

  const splitLine = (line: string): string[] =>
    sep === "\t"
      ? line.split("\t").map((v) => v.trim())
      : parseCsvCommaLine(line);

  let headers: string[] | null = null;
  let dataStart = dataStartIdx;

  if (hasHeader) {
    headers = splitLine(lines[dataStartIdx]).map((h) =>
      h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_+]/g, "")
    );
    dataStart = dataStartIdx + 1;
  }

  const rows: Record<string, string>[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    if (!values.length || values[0] === "") continue;

    // Skip mid-table sub-header rows FBref inserts ("Rk", "Player")
    const first = values[0].toLowerCase().trim();
    if (first === "rk" || first === "player") continue;
    // Skip rows where rank is non-numeric (another header pattern) when no headers
    if (isNaN(parseInt(values[0])) && !headers) continue;

    const row: Record<string, string> = {};

    if (headers) {
      headers.forEach((h, idx) => {
        // Keep FIRST occurrence of each column name (FBref repeats "Gls", "Ast" for per-90 section)
        if (!(h in row)) {
          row[h] = (values[idx] ?? "").trim();
        }
      });
    } else {
      // No headers — use FBref positional mapping
      for (const [field, pos] of Object.entries(FBREF_POS)) {
        row[field] = (values[pos] ?? "").trim();
      }
      // Mark as positional so rowToRecord knows there's no xG column
      row["_positional"] = "1";
    }

    rows.push(row);
  }

  return rows;
}

function parseCsvCommaLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Column helpers ────────────────────────────────────────────

function n(v: string | undefined): number | null {
  if (!v || v === "" || v === "-" || v === "—" || v === "N/A") return null;
  const parsed = parseFloat(v.replace(/,/g, ""));
  return isNaN(parsed) ? null : parsed;
}

function per90(total: number | null, minutes: number | null): number | null {
  if (total == null || !minutes || minutes < 45) return null;
  return Math.round((total / (minutes / 90)) * 1000) / 1000;
}

// Map of possible FBref column names → our field names
// Note: header processing strips /  →  "sh/90" becomes "sh90"
const COL_ALIASES: Record<string, string[]> = {
  player:      ["player", "name"],
  squad:       ["squad", "team", "club"],
  comp:        ["comp", "league", "competition"],
  games:       ["mp", "games", "matches", "appearances", "matchesplayed"],
  starts:      ["starts", "gs"],
  // "90s" column appears in shooting/passing/defensive pages instead of "Min"
  minutes:     ["min", "minutes", "mins"],
  nineties:    ["90s"],  // handled separately — value needs ×90
  goals:       ["gls", "goals"],
  assists:     ["ast", "assists"],
  shots:       ["sh", "shots"],
  shots_on:    ["sot", "shots_on_target"],
  key_passes:  ["kp", "key_passes", "keypasses", "assisted_shots"],
  passes:      ["cmp", "passes", "total_cmp"],
  tackles:     ["tklw", "tackles_won"],
  interceptions: ["int", "interceptions"],
  prog_car:    ["prgc", "progressive_carries", "progc"],
  xg:          ["xg", "xgoals", "expected_goals"],
  xag:         ["xag", "xassists", "expected_assists"],
  shots_p90:   ["sh90", "shots90"],       // "Sh/90" header → cleaned to "sh90"
  sot_p90:     ["sot90"],                 // "SoT/90" header → cleaned to "sot90"
};

function findCol(row: Record<string, string>, aliases: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const match = keys.find(
      (k) => k === alias ||
             k.replace(/[^a-z0-9]/g, "") === alias.replace(/[^a-z0-9]/g, "")
    );
    if (match !== undefined) return row[match];
  }
  return undefined;
}

function get(row: Record<string, string>, field: keyof typeof COL_ALIASES): string | undefined {
  if (field in row) return row[field];
  return findCol(row, COL_ALIASES[field]);
}

// ── Detect stat type from first data row ──────────────────────

function detectStatType(firstRow: Record<string, string>): string {
  const keys = Object.keys(firstRow).join(" ").toLowerCase();
  // Shooting: has "sh90" or "sot90" (from Sh/90, SoT/90 headers)
  if (keys.includes("sh90") || keys.includes("sot90")) return "shooting";
  // Passing: has "kp" (key passes)
  if (keys.includes(" kp ") || keys.includes("kp\t") || findCol(firstRow, ["kp"]) !== undefined) return "passing";
  // Defense: has "tklw" (tackles won) or "int"
  if (keys.includes("tklw") || keys.includes("tkl")) return "defense";
  // Positional standard stats
  if ("_positional" in firstRow) return "standard";
  // Fallback
  return "standard";
}

// ── DB record types ───────────────────────────────────────────

interface BaseRecord {
  player_name: string;
  normalized_name: string;
  club: string;
  league: string;
  season: string;
  source: string;
}

interface StandardRecord extends BaseRecord {
  matches_played: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
}

interface ShootingRecord extends BaseRecord {
  shots_per90: number | null;
  shots_on_target_per90: number | null;
}

interface PassingRecord extends BaseRecord {
  key_passes_per90: number | null;
  passes_per90: number | null;
}

interface DefenseRecord extends BaseRecord {
  tackles_per90: number | null;
  progressive_carries_per90: number | null;
}

type DbRecord = StandardRecord | ShootingRecord | PassingRecord | DefenseRecord;

// ── Build DB record from a row ────────────────────────────────

function rowToRecord(
  row: Record<string, string>,
  defaultLeague: string,
  season: string,
  statType: string
): DbRecord | null {
  const playerName = get(row, "player") ?? "";
  const club = get(row, "squad") ?? "";

  if (!playerName || !club || playerName === "Player") return null;
  if (playerName.toLowerCase() === "player" || playerName.toLowerCase() === "total") return null;

  // Normalise league name (FBref uses "eng Premier League", "es La Liga", etc.)
  let league = get(row, "comp") ?? defaultLeague;
  league = league.replace(/^[a-z]{2,3}\s+/i, "").trim();
  if (!league) league = defaultLeague;

  const base: BaseRecord = {
    player_name: playerName,
    normalized_name: normalizeName(playerName),
    club,
    league,
    season,
    source: "fbref-csv",
  };

  // Minutes: handle both "Min" (actual minutes) and "90s" (90-minute periods)
  let minutes = n(get(row, "minutes"));
  if (minutes == null) {
    const nineties = n(get(row, "nineties"));
    if (nineties != null) minutes = Math.round(nineties * 90);
  }
  // If minutes value < 200, it's likely in 90s format, convert
  if (minutes != null && minutes < 200) {
    minutes = Math.round(minutes * 90);
  }

  if (statType === "shooting") {
    const shots = n(get(row, "shots"));
    const shotsOn = n(get(row, "shots_on"));
    // Prefer pre-computed per-90 columns if present (always are in FBref shooting CSV)
    const shots90Raw = n(get(row, "shots_p90"));
    const sot90Raw = n(get(row, "sot_p90"));
    return {
      ...base,
      shots_per90: shots90Raw ?? per90(shots, minutes),
      shots_on_target_per90: sot90Raw ?? per90(shotsOn, minutes),
    } as ShootingRecord;
  }

  if (statType === "passing") {
    const keyPasses = n(get(row, "key_passes"));
    const passes = n(get(row, "passes"));
    return {
      ...base,
      key_passes_per90: per90(keyPasses, minutes),
      passes_per90: per90(passes, minutes),
    } as PassingRecord;
  }

  if (statType === "defense") {
    const tackles = n(get(row, "tackles"));
    return {
      ...base,
      tackles_per90: per90(tackles, minutes),
      progressive_carries_per90: null,  // not available in defensive CSV
    } as DefenseRecord;
  }

  // Standard stats
  return {
    ...base,
    matches_played: n(get(row, "games")),
    starts: n(get(row, "starts")),
    minutes,
    goals: n(get(row, "goals")),
    assists: n(get(row, "assists")),
  } as StandardRecord;
}

// ── WC player matching ────────────────────────────────────────

async function getWcPlayerNorms(): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("wc_players")
    .select("name")
    .limit(2000);

  const map = new Map<string, string>();
  for (const p of data ?? []) {
    for (const v of nameVariants(p.name)) {
      map.set(v, p.name);
    }
  }
  return map;
}

// ── Upsert ────────────────────────────────────────────────────
// For standard: full INSERT/UPDATE (creates new rows, updates all base fields)
// For shooting/passing/defense: UPDATE-only (only touches stat columns, preserves rest)

async function upsertStandard(records: StandardRecord[]): Promise<{ ok: number; err: number }> {
  if (!records.length) return { ok: 0, err: 0 };

  // Deduplicate: keep first occurrence per (normalized_name, club, season)
  const seen = new Set<string>();
  const deduped = records.filter((r) => {
    const key = `${r.normalized_name}||${r.club}||${r.season}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (deduped.length < records.length) {
    console.log(`  Deduped: removed ${records.length - deduped.length} duplicate rows`);
  }

  let ok = 0, err = 0;
  for (let i = 0; i < deduped.length; i += 100) {
    const chunk = deduped.slice(i, i + 100);
    const { error } = await supabase
      .from("player_club_stats")
      .upsert(chunk, { onConflict: "normalized_name,club,season" });
    if (error) { console.error(`  Upsert error: ${error.message}`); err += chunk.length; }
    else ok += chunk.length;
  }
  return { ok, err };
}

async function updateStatColumns(
  records: DbRecord[],
  statType: "shooting" | "passing" | "defense"
): Promise<{ ok: number; err: number; missing: number }> {
  if (!records.length) return { ok: 0, err: 0, missing: 0 };
  let ok = 0, err = 0, missing = 0;

  // Build column map per stat type
  const getUpdateCols = (rec: DbRecord): Record<string, number | null | string> => {
    if (statType === "shooting") {
      const r = rec as ShootingRecord;
      return { shots_per90: r.shots_per90, shots_on_target_per90: r.shots_on_target_per90 };
    }
    if (statType === "passing") {
      const r = rec as PassingRecord;
      return { key_passes_per90: r.key_passes_per90, passes_per90: r.passes_per90 };
    }
    // defense — only update tackles_per90
    const r = rec as DefenseRecord;
    return { tackles_per90: r.tackles_per90 };
  };

  for (const rec of records) {
    const cols = getUpdateCols(rec);
    // Skip if all stat values are null (nothing to update)
    if (Object.values(cols).every((v) => v == null)) continue;

    const { error, count } = await supabase
      .from("player_club_stats")
      .update(cols)
      .eq("normalized_name", rec.normalized_name)
      .eq("club", rec.club)
      .eq("season", rec.season);

    if (error) { err++; }
    else if (count != null && count === 0) { missing++; }
    else ok++;
  }
  return { ok, err, missing };
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find((a) => !a.startsWith("--"));
  const leagueIdx = args.indexOf("--league");
  const seasonIdx = args.indexOf("--season");
  const leagueArg = leagueIdx !== -1 ? (args[leagueIdx + 1] ?? "") : "";
  const seasonArg = seasonIdx !== -1 ? (args[seasonIdx + 1] ?? "2024-25") : "2024-25";

  if (!csvPath) {
    console.error("Usage: npm run parse-fbref-csv -- <path/to/file.csv> [--league 'La Liga'] [--season '2024-25']");
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

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  FBref CSV Parser                             ║");
  console.log("╚═══════════════════════════════════════════════╝\n");
  console.log(`  File:   ${absPath}`);
  console.log(`  Season: ${seasonArg}`);

  const raw = fs.readFileSync(absPath, "utf-8");
  const allRows = parseCsv(raw);

  if (!allRows.length) {
    console.error("No rows found in CSV. Make sure the file is in FBref CSV format.");
    process.exit(1);
  }

  const statType = detectStatType(allRows[0]);
  console.log(`  Rows:   ${allRows.length}`);
  console.log(`  Type:   ${statType} (auto-detected)`);
  console.log(`  League: ${leagueArg || "(from CSV comp column)"}`);
  console.log(`  Mode:   ${statType === "standard" ? "INSERT/UPDATE (base row)" : "UPDATE stat columns only"}\n`);

  // Build records
  const records: DbRecord[] = [];
  const skipped: string[] = [];

  for (const row of allRows) {
    const rec = rowToRecord(row, leagueArg, seasonArg, statType);
    if (rec) {
      records.push(rec);
    } else {
      const name = row["player"] ?? row["name"] ?? "";
      if (name) skipped.push(name);
    }
  }

  console.log(`  Valid records: ${records.length}`);
  if (skipped.length) {
    console.log(`  Skipped rows:  ${skipped.length} (headers/blanks)`);
  }

  // Upsert / update
  console.log("\n── Writing to player_club_stats ────────────────");
  let ok = 0, err = 0, missing = 0;

  if (statType === "standard") {
    const result = await upsertStandard(records as StandardRecord[]);
    ok = result.ok; err = result.err;
  } else {
    const result = await updateStatColumns(records, statType as "shooting" | "passing" | "defense");
    ok = result.ok; err = result.err; missing = result.missing;
    if (missing > 0) {
      console.log(`  Note: ${missing} players not found in DB (run standard stats CSV first to create base rows)`);
    }
  }

  console.log(`  Updated: ${ok}`);
  if (err) console.log(`  Errors:  ${err}`);

  // Match against wc_players
  console.log("\n── Matching against WC squad players ───────────");
  const wcNorms = await getWcPlayerNorms();
  const matched: string[] = [];

  for (const rec of records) {
    const variants = nameVariants(rec.player_name);
    const wcName = variants.map((v) => wcNorms.get(v)).find(Boolean);
    if (wcName) matched.push(`${wcName} → ${rec.club} (${rec.league})`);
  }

  console.log(`  WC squad matches: ${matched.length} / ${records.length}`);
  if (matched.length) {
    matched.slice(0, 30).forEach((m) => console.log(`    ✓ ${m}`));
    if (matched.length > 30) console.log(`    ... and ${matched.length - 30} more`);
  }

  console.log("\n╔══════════════════════════════════════╗");
  console.log(`║  Rows processed: ${String(records.length).padEnd(16)}║`);
  console.log(`║  DB updated:     ${String(ok).padEnd(16)}║`);
  console.log(`║  WC players hit: ${String(matched.length).padEnd(16)}║`);
  if (err) console.log(`║  Errors:         ${String(err).padEnd(16)}║`);
  console.log("╚══════════════════════════════════════╝");
  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
