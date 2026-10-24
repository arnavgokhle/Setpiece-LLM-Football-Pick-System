#!/usr/bin/env tsx
/**
 * FBref Club Stats Scraper — 2024-25 season
 * Scrapes Big 5 European league stats (standard, shooting, passing, defense)
 * and upserts to player_club_stats table.
 *
 * Covers ~80-90% of WC 2026 players (most play in Big 5 leagues).
 * Run: npm run fetch-fbref-stats
 */

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FBref Big 5 stat pages
const PAGES = {
  standard: "https://fbref.com/en/comps/Big5/stats/players/Big-5-European-Leagues-Stats",
  shooting:  "https://fbref.com/en/comps/Big5/shooting/players/Big-5-European-Leagues-Stats",
  passing:   "https://fbref.com/en/comps/Big5/passing/players/Big-5-European-Leagues-Stats",
  defense:   "https://fbref.com/en/comps/Big5/defense/players/Big-5-European-Leagues-Stats",
} as const;

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const DELAY_MS = 4500; // FBref rate limiting — don't go below 3s

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Name normalization ────────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // Strip diacritics
    .replace(/\bjr\.?\b/gi, "jr")       // Normalise Jr/Jr.
    .replace(/\bii\b/gi, "ii")
    .replace(/['''`]/g, "")             // Strip apostrophes
    .replace(/[^a-z0-9\s-]/g, " ")     // Non-alphanum → space
    .replace(/\s+/g, " ")
    .trim();
}

// ── FBref fetch & parse ───────────────────────────────────────

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Referer": "https://fbref.com/",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      console.error(`  Attempt ${i} failed for ${url}:`, err);
      if (i < retries) await sleep(DELAY_MS * i);
      else throw err;
    }
  }
  throw new Error("All retries exhausted");
}

/**
 * FBref wraps their data tables in HTML comments to deter scrapers.
 * Extract the table HTML from within those comments.
 */
function extractTable(html: string, tableId: string): string {
  // Try: commented-out table
  const commentRe = new RegExp(
    `<!--[\\s\\S]*?(<table[^>]*?\\bid="${tableId}"[^>]*>[\\s\\S]*?<\\/table>)[\\s\\S]*?-->`,
    "g"
  );
  const cm = commentRe.exec(html);
  if (cm?.[1]) return cm[1];

  // Fallback: direct table (sometimes not commented)
  const directRe = new RegExp(
    `<table[^>]*?\\bid="${tableId}"[^>]*>[\\s\\S]*?<\\/table>`,
    "g"
  );
  const dm = directRe.exec(html);
  if (dm?.[0]) return dm[0];

  return "";
}

function findTable(html: string, candidates: string[]): string {
  for (const id of candidates) {
    const t = extractTable(html, id);
    if (t) {
      console.log(`    ✓ Found table: #${id}`);
      return t;
    }
  }
  console.warn(`    ✗ Table not found (tried: ${candidates.join(", ")})`);
  return "";
}

function parseNum(s: string | undefined): number | null {
  if (!s || s === "" || s === "-" || s === "—") return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

type Row = Record<string, string>;

function parseTableRows(tableHtml: string): Row[] {
  if (!tableHtml) return [];
  const $ = cheerio.load(tableHtml);
  const rows: Row[] = [];

  $("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    if ($tr.hasClass("spacer") || $tr.hasClass("partial_table") || $tr.hasClass("thead")) return;

    const data: Row = {};
    $tr.find("td, th").each((_, cell) => {
      const $cell = $(cell);
      const stat = $cell.attr("data-stat");
      if (!stat || stat === "ranker") return;
      // Prefer link text for player name / squad cells
      const $a = $cell.find("a");
      data[stat] = ($a.length ? $a.text() : $cell.text()).trim();
    });

    if (data["player"] && data["player"] !== "Player") rows.push(data);
  });

  return rows;
}

type PageMap = Map<string, Row>; // key = normalizedName__club

function rowsToMap(rows: Row[]): PageMap {
  const m: PageMap = new Map();
  for (const row of rows) {
    const name = (row["player"] || "").trim();
    const club = (row["team"] || row["squad"] || "").trim();
    if (!name || !club) continue;
    const key = `${normalizeName(name)}__${club.toLowerCase()}`;
    m.set(key, row);
  }
  return m;
}

// ── Fetch each page ───────────────────────────────────────────

async function fetchStandard(): Promise<PageMap> {
  console.log("\n  [1/4] Standard stats...");
  const html = await fetchPage(PAGES.standard);
  const t = findTable(html, ["stats_standard_Big5", "stats_standard", "stats"]);
  const rows = parseTableRows(t);
  console.log(`       ${rows.length} rows parsed`);
  return rowsToMap(rows);
}

async function fetchShooting(): Promise<PageMap> {
  console.log("  [2/4] Shooting stats...");
  await sleep(DELAY_MS);
  const html = await fetchPage(PAGES.shooting);
  const t = findTable(html, ["stats_shooting_Big5", "stats_shooting", "shooting"]);
  const rows = parseTableRows(t);
  console.log(`       ${rows.length} rows parsed`);
  return rowsToMap(rows);
}

async function fetchPassing(): Promise<PageMap> {
  console.log("  [3/4] Passing stats...");
  await sleep(DELAY_MS);
  const html = await fetchPage(PAGES.passing);
  const t = findTable(html, ["stats_passing_Big5", "stats_passing", "passing"]);
  const rows = parseTableRows(t);
  console.log(`       ${rows.length} rows parsed`);
  return rowsToMap(rows);
}

async function fetchDefense(): Promise<PageMap> {
  console.log("  [4/4] Defense stats...");
  await sleep(DELAY_MS);
  const html = await fetchPage(PAGES.defense);
  const t = findTable(html, ["stats_defense_Big5", "stats_defense", "defense"]);
  const rows = parseTableRows(t);
  console.log(`       ${rows.length} rows parsed`);
  return rowsToMap(rows);
}

// ── Merge & upsert ────────────────────────────────────────────

interface PlayerClubStat {
  player_name: string;
  normalized_name: string;
  club: string;
  league: string | null;
  season: string;
  matches_played: number | null;
  starts: number | null;
  minutes: number | null;
  goals: number | null;
  assists: number | null;
  shots_per90: number | null;
  shots_on_target_per90: number | null;
  key_passes_per90: number | null;
  passes_per90: number | null;
  tackles_per90: number | null;
  progressive_carries_per90: number | null;
  xg_per90: number | null;
  xag_per90: number | null;
}

function mergeStats(
  std: PageMap,
  shoot: PageMap,
  pass: PageMap,
  def: PageMap
): PlayerClubStat[] {
  const result: PlayerClubStat[] = [];

  for (const [key, s] of std) {
    const sh = shoot.get(key);
    const pa = pass.get(key);
    const de = def.get(key);

    const playerName = s["player"] || "";
    const club       = s["team"] || s["squad"] || "";
    const league     = s["comp_level"] || s["comp"] || null;

    if (!playerName || !club) continue;

    const minutes    = parseNum(s["minutes"]);
    const minutes90  = minutes != null ? minutes / 90 : parseNum(s["minutes_90s"]);

    const per90 = (total: number | null): number | null => {
      if (total == null || !minutes90 || minutes90 < 1) return null;
      return Math.round((total / minutes90) * 1000) / 1000;
    };

    // Shots per 90 — prefer direct field from shooting page
    const shotsPer90 = sh
      ? (parseNum(sh["shots_per90"]) ?? per90(parseNum(sh["shots"])))
      : null;

    // SoT per 90
    const sotPer90 = sh
      ? (parseNum(sh["shots_on_target_per90"]) ?? per90(parseNum(sh["shots_on_target"])))
      : null;

    // Key passes per 90 — FBref field name varies by version
    const kpTotal = pa
      ? (parseNum(pa["key_passes"]) ?? parseNum(pa["assisted_shots"]) ?? parseNum(pa["sca_passlive"]))
      : null;
    const kpPer90 = per90(kpTotal);

    // Passes per 90
    const passTotal  = pa ? parseNum(pa["passes"]) : null;
    const passPer90  = per90(passTotal);

    // Tackles per 90
    const tklTotal   = de ? (parseNum(de["tackles"]) ?? parseNum(de["tackles_won"])) : null;
    const tklPer90   = per90(tklTotal);

    // Progressive carries per 90
    const progTotal  = parseNum(s["progressive_carries"]);
    const progPer90  = per90(progTotal);

    // xG per 90 — prefer shooting page
    const xgTotal    = sh ? parseNum(sh["xg"]) : parseNum(s["xg"]);
    const xgPer90    = sh ? (parseNum(sh["xg_per90"]) ?? per90(xgTotal)) : per90(xgTotal);

    // xAG per 90
    const xagTotal   = parseNum(s["xg_assist"]);
    const xagPer90   = per90(xagTotal);

    result.push({
      player_name:               playerName,
      normalized_name:           normalizeName(playerName),
      club,
      league,
      season:                    "2024-25",
      matches_played:            parseNum(s["games"]),
      starts:                    parseNum(s["games_starts"]),
      minutes,
      goals:                     parseNum(s["goals"]),
      assists:                   parseNum(s["assists"]),
      shots_per90:               shotsPer90,
      shots_on_target_per90:     sotPer90,
      key_passes_per90:          kpPer90,
      passes_per90:              passPer90,
      tackles_per90:             tklPer90,
      progressive_carries_per90: progPer90,
      xg_per90:                  xgPer90,
      xag_per90:                 xagPer90,
    });
  }

  return result;
}

async function upsertToSupabase(stats: PlayerClubStat[]): Promise<{ ok: number; err: number }> {
  let ok = 0; let err = 0;
  const CHUNK = 100;
  for (let i = 0; i < stats.length; i += CHUNK) {
    const { error } = await supabase
      .from("player_club_stats")
      .upsert(stats.slice(i, i + CHUNK), { onConflict: "normalized_name,club,season" });
    if (error) {
      console.error(`  Chunk ${Math.floor(i / CHUNK) + 1} error:`, error.message);
      err += CHUNK;
    } else {
      ok += Math.min(CHUNK, stats.length - i);
      process.stdout.write(`  Upserted ${ok}/${stats.length}...\r`);
    }
  }
  return { ok, err };
}

// ── Coverage check ────────────────────────────────────────────

async function checkWcCoverage(stats: PlayerClubStat[]): Promise<void> {
  const { data: wcPlayers, error } = await supabase
    .from("wc_players")
    .select("name, country, club, position")
    .limit(1000);

  if (error || !wcPlayers?.length) {
    console.warn("  Could not query wc_players:", error?.message);
    return;
  }

  const statsIndex = new Map<string, PlayerClubStat>();
  for (const s of stats) {
    statsIndex.set(s.normalized_name, s);
    statsIndex.set(`${s.normalized_name}__${s.club.toLowerCase()}`, s);
  }

  let found = 0;
  const missing: string[] = [];

  for (const p of wcPlayers) {
    const norm = normalizeName(p.name);
    const clubKey = `${norm}__${(p.club || "").toLowerCase()}`;

    if (statsIndex.has(norm) || statsIndex.has(clubKey)) {
      found++;
    } else {
      // Try partial: first word of name
      const firstWord = norm.split(" ")[0];
      const partial = [...statsIndex.keys()].find(
        (k) => k.startsWith(firstWord) && k.length < firstWord.length + 20
      );
      if (partial) {
        found++;
      } else {
        missing.push(`${p.name} (${p.country}, ${p.club || "club unknown"})`);
      }
    }
  }

  console.log(`\n  Coverage: ${found}/${wcPlayers.length} WC players found in Big 5 data`);
  if (missing.length) {
    console.log(`  Not in Big 5 leagues (${missing.length} players):`);
    missing.slice(0, 30).forEach((m) => console.log(`    - ${m}`));
    if (missing.length > 30) console.log(`    … and ${missing.length - 30} more`);
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║  FBref Club Stats Scraper — 2024-25  ║");
  console.log("╚══════════════════════════════════════╝\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // 1. Fetch all four pages
  console.log("Step 1: Scraping FBref Big 5 pages (4.5s between requests)...");
  const stdMap  = await fetchStandard();
  const shMap   = await fetchShooting();
  const paMap   = await fetchPassing();
  const deMap   = await fetchDefense();

  // 2. Merge
  console.log(`\nStep 2: Merging ${stdMap.size} players from standard stats...`);
  const merged = mergeStats(stdMap, shMap, paMap, deMap);
  console.log(`  Merged: ${merged.length} player records`);

  // 3. Upsert
  console.log("\nStep 3: Upserting to Supabase...");
  const { ok, err } = await upsertToSupabase(merged);
  console.log(`\n  ✓ ${ok} upserted, ${err} errors`);

  // 4. Coverage check
  console.log("\nStep 4: WC 2026 player coverage check...");
  await checkWcCoverage(merged);

  console.log("\n✅ Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
