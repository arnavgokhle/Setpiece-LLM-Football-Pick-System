#!/usr/bin/env tsx
/**
 * FBref International Stats Scraper
 * Scrapes:
 *   1. WC 2022 stats page — WC history for all WC 2022 players
 *   2. FBref national team pages — recent international form for WC 2026 nations
 *
 * Upserts to player_international_stats table.
 * Run: npm run fetch-fbref-international
 */

import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { normalizeName } from "./fetch-fbref-stats";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const DELAY_MS = 5000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── WC 2022 page ──────────────────────────────────────────────
const WC_2022_URL = "https://fbref.com/en/comps/1/2022/stats/players/2022-FIFA-World-Cup-Stats";

// ── FBref national team IDs for WC 2026 nations ───────────────
// Format: country name (matching wc_players.country) → FBref squad ID
const NATIONAL_TEAM_IDS: Record<string, string> = {
  "Argentina":          "f9fddd6e",
  "Australia":          "5c36e0a5",
  "Belgium":            "18f5f09d",
  "Brazil":             "9a273865",
  "Canada":             "bf04dd72",
  "Colombia":           "7bc809d9",
  "Croatia":            "2d0e7d7e",
  "Ecuador":            "8c2c7bf3",
  "England":            "cce90f5c",
  "France":             "fff4ae78",
  "Germany":            "3b47b620",
  "Japan":              "4a2e4e7f",
  "Mexico":             "c41e7adb",
  "Morocco":            "b2dac4dd",
  "Netherlands":        "0cc15f37",
  "Portugal":           "34c5c019",
  "Senegal":            "55e7b2c6",
  "South Korea":        "e0f3f7c1",
  "Spain":              "67e23cb3",
  "Switzerland":        "50b12a1f",
  "United States":      "7e3f0e45",
  "Uruguay":            "60b5e2d1",
  "Iran":               "b5b4a03a",
  "Saudi Arabia":       "cd04c86e",
  "Qatar":              "c8c21c73",
  "Ghana":              "e8ff1f7e",
  "Cameroon":           "7b6e9e1f",
  "Tunisia":            "ba3e7c15",
  "Ivory Coast":        "e0f24a28",
  "Nigeria":            "be4e28db",
  "Algeria":            "e9b32e0f",
  "Egypt":              "ae9c38b5",
  "Austria":            "7ca13b52",
  "Denmark":            "21a66f6a",
  "Poland":             "7eb99060",
  "Serbia":             "7d0e9b9a",
  "Turkey":             "f47badd6",
  "Ukraine":            "2bbd5d03",
};

// National team stats URL (2025 calendar year)
function ntUrl(id: string, country: string): string {
  const slug = country.replace(/\s+/g, "-");
  return `https://fbref.com/en/squads/${id}/2025/${slug}-Stats`;
}

// ── Fetch & parse helpers ─────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
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
    if (res.status === 404) { console.log("    404 — skipping"); return null; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn("    Fetch error:", err);
    return null;
  }
}

function extractTable(html: string, tableId: string): string {
  const commentRe = new RegExp(
    `<!--[\\s\\S]*?(<table[^>]*?\\bid="${tableId}"[^>]*>[\\s\\S]*?<\\/table>)[\\s\\S]*?-->`,
    "g"
  );
  const cm = commentRe.exec(html);
  if (cm?.[1]) return cm[1];

  const directRe = new RegExp(
    `<table[^>]*?\\bid="${tableId}"[^>]*>[\\s\\S]*?<\\/table>`,
    "g"
  );
  const dm = directRe.exec(html);
  return dm?.[0] ?? "";
}

function findTable(html: string, candidates: string[]): string {
  for (const id of candidates) {
    const t = extractTable(html, id);
    if (t) return t;
  }
  return "";
}

type Row = Record<string, string>;

function parseRows(tableHtml: string): Row[] {
  if (!tableHtml) return [];
  const $ = cheerio.load(tableHtml);
  const rows: Row[] = [];
  $("tbody tr").each((_, tr) => {
    const $tr = $(tr);
    if ($tr.hasClass("spacer") || $tr.hasClass("partial_table") || $tr.hasClass("thead")) return;
    const data: Row = {};
    $tr.find("td, th").each((_, cell) => {
      const $c = $(cell);
      const stat = $c.attr("data-stat");
      if (!stat || stat === "ranker") return;
      const $a = $c.find("a");
      data[stat] = ($a.length ? $a.text() : $c.text()).trim();
    });
    if (data["player"] && data["player"] !== "Player") rows.push(data);
  });
  return rows;
}

function parseNum(s: string | undefined): number | null {
  if (!s || s === "" || s === "-" || s === "—") return null;
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? null : n;
}

// ── WC 2022 page ──────────────────────────────────────────────

interface WcEntry {
  normalizedName: string;
  playerName: string;
  country: string;
  wcAppearances: number;
  wcGoals: number;
  wcAssists: number;
  minutes: number | null;
}

async function scrapeWc2022(): Promise<Map<string, WcEntry>> {
  console.log("  Scraping WC 2022 stats page...");
  const html = await fetchPage(WC_2022_URL);
  if (!html) return new Map();

  const t = findTable(html, ["stats_standard_1", "stats_standard", "stats"]);
  const rows = parseRows(t);
  console.log(`    ${rows.length} rows found`);

  const map = new Map<string, WcEntry>();
  for (const row of rows) {
    const name    = row["player"] || "";
    const country = row["nationality"] || row["team"] || row["squad"] || "";
    if (!name) continue;

    const norm = normalizeName(name);
    map.set(norm, {
      normalizedName:  norm,
      playerName:      name,
      country:         country.replace(/^[a-z]{2}\s/i, "").trim(), // Remove ISO prefix like "en ENG"
      wcAppearances:   parseNum(row["games"]) ?? 0,
      wcGoals:         parseNum(row["goals"]) ?? 0,
      wcAssists:       parseNum(row["assists"]) ?? 0,
      minutes:         parseNum(row["minutes"]),
    });
  }

  return map;
}

// ── National team page ────────────────────────────────────────

interface IntlStats {
  playerName: string;
  normalizedName: string;
  country: string;
  totalCaps: number | null;
  intlGoals: number | null;
  intlAssists: number | null;
  shotsPer90: number | null;
  sotPer90: number | null;
  kpPer90: number | null;
  passesPer90: number | null;
  tacklesPer90: number | null;
  xgPer90: number | null;
  minutesPerGame: number | null;
}

async function scrapeNationalTeam(country: string, teamId: string): Promise<IntlStats[]> {
  const url = ntUrl(teamId, country);
  console.log(`  [${country}] ${url}`);
  const html = await fetchPage(url);
  if (!html) return [];

  const t = findTable(html, [
    `stats_standard_${teamId}`,
    "stats_standard",
    "stats",
  ]);
  const rows = parseRows(t);
  if (!rows.length) {
    console.log(`    No rows found for ${country}`);
    return [];
  }
  console.log(`    ${rows.length} players found`);

  return rows.map((row) => {
    const name = row["player"] || "";
    const minutes = parseNum(row["minutes"]);
    const games   = parseNum(row["games"]) ?? 0;
    const m90     = minutes != null ? minutes / 90 : null;

    const per90 = (total: number | null): number | null => {
      if (total == null || !m90 || m90 < 0.5) return null;
      return Math.round((total / m90) * 1000) / 1000;
    };

    return {
      playerName:     name,
      normalizedName: normalizeName(name),
      country,
      totalCaps:      games || null,
      intlGoals:      parseNum(row["goals"]),
      intlAssists:    parseNum(row["assists"]),
      shotsPer90:     per90(parseNum(row["shots"])),
      sotPer90:       per90(parseNum(row["shots_on_target"])),
      kpPer90:        per90(parseNum(row["key_passes"]) ?? parseNum(row["assisted_shots"])),
      passesPer90:    per90(parseNum(row["passes"])),
      tacklesPer90:   per90(parseNum(row["tackles"]) ?? parseNum(row["tackles_won"])),
      xgPer90:        per90(parseNum(row["xg"])),
      minutesPerGame: games > 0 && minutes != null ? Math.round(minutes / games) : null,
    } as IntlStats;
  });
}

// ── Upsert ────────────────────────────────────────────────────

async function upsertIntlStats(
  stats: IntlStats[],
  wc2022: Map<string, WcEntry>
): Promise<{ ok: number; err: number }> {
  const records = stats.map((s) => {
    const wc = wc2022.get(s.normalizedName);
    return {
      player_name:                 s.playerName,
      normalized_name:             s.normalizedName,
      country:                     s.country,
      total_caps:                  s.totalCaps,
      international_goals:         s.intlGoals,
      international_assists:       s.intlAssists,
      shots_per90_intl:            s.shotsPer90,
      shots_on_target_per90_intl:  s.sotPer90,
      key_passes_per90_intl:       s.kpPer90,
      passes_per90_intl:           s.passesPer90,
      tackles_per90_intl:          s.tacklesPer90,
      xg_per90_intl:               s.xgPer90,
      minutes_per_game_intl:       s.minutesPerGame,
      wc_appearances:              wc?.wcAppearances ?? 0,
      wc_goals:                    wc?.wcGoals ?? 0,
      wc_assists:                  wc?.wcAssists ?? 0,
    };
  });

  if (!records.length) return { ok: 0, err: 0 };

  const { error } = await supabase
    .from("player_international_stats")
    .upsert(records, { onConflict: "normalized_name,country" });

  if (error) {
    console.error("    Upsert error:", error.message);
    return { ok: 0, err: records.length };
  }
  return { ok: records.length, err: 0 };
}

// ── Also seed WC 2022 players who aren't in national team pages ─

async function upsertWc2022Only(
  wc2022: Map<string, WcEntry>,
  alreadyUpserted: Set<string>
): Promise<{ ok: number; err: number }> {
  const toInsert = [...wc2022.values()]
    .filter((e) => !alreadyUpserted.has(e.normalizedName))
    .map((e) => ({
      player_name:             e.playerName,
      normalized_name:         e.normalizedName,
      country:                 e.country,
      total_caps:              null,
      international_goals:     null,
      international_assists:   null,
      shots_per90_intl:        null,
      shots_on_target_per90_intl: null,
      key_passes_per90_intl:   null,
      passes_per90_intl:       null,
      tackles_per90_intl:      null,
      xg_per90_intl:           null,
      minutes_per_game_intl:   e.minutes && e.wcAppearances
        ? Math.round(e.minutes / e.wcAppearances)
        : null,
      wc_appearances:          e.wcAppearances,
      wc_goals:                e.wcGoals,
      wc_assists:              e.wcAssists,
    }));

  if (!toInsert.length) return { ok: 0, err: 0 };

  const { error } = await supabase
    .from("player_international_stats")
    .upsert(toInsert, { onConflict: "normalized_name,country" });

  if (error) {
    console.error("  WC-only upsert error:", error.message);
    return { ok: 0, err: toInsert.length };
  }
  return { ok: toInsert.length, err: 0 };
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  FBref International Stats Scraper            ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: Missing Supabase env vars");
    process.exit(1);
  }

  // Step 1: WC 2022
  console.log("Step 1: WC 2022 historical stats...");
  const wc2022 = await scrapeWc2022();
  console.log(`  WC 2022 entries: ${wc2022.size}\n`);

  // Step 2: National team pages
  console.log("Step 2: Scraping national team pages (5s between each)...\n");
  const upsertedNames = new Set<string>();
  let totalOk = 0;
  let totalErr = 0;
  const summary: Record<string, number> = {};

  const teams = Object.entries(NATIONAL_TEAM_IDS);
  for (let i = 0; i < teams.length; i++) {
    const [country, id] = teams[i];
    await sleep(DELAY_MS);

    const intlStats = await scrapeNationalTeam(country, id);
    const { ok, err } = await upsertIntlStats(intlStats, wc2022);
    totalOk += ok;
    totalErr += err;
    summary[country] = ok;
    intlStats.forEach((s) => upsertedNames.add(s.normalizedName));

    console.log(`    ↳ ${ok} upserted for ${country}\n`);
  }

  // Step 3: WC 2022 players not covered by national team pages
  console.log("Step 3: Seeding WC 2022 history for remaining players...");
  await sleep(DELAY_MS);
  const { ok: wcOk, err: wcErr } = await upsertWc2022Only(wc2022, upsertedNames);
  console.log(`  ${wcOk} WC 2022-only entries seeded\n`);

  totalOk += wcOk;
  totalErr += wcErr;

  // Summary
  console.log("╔══════════════════════════════════════╗");
  console.log(`║  Total upserted: ${String(totalOk).padEnd(18)}║`);
  console.log(`║  Errors:         ${String(totalErr).padEnd(18)}║`);
  console.log("╚══════════════════════════════════════╝");
  console.log("\nPer-country breakdown:");
  for (const [country, count] of Object.entries(summary)) {
    console.log(`  ${country.padEnd(20)} ${count} players`);
  }

  console.log("\n✅ Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
