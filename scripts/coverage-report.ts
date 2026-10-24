#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeName(name: string): string {
  return name.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr").replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
function nameVariants(name: string): string[] {
  const b = normalizeName(name);
  const v = new Set<string>([b]);
  v.add(b.replace(/\bjr\b/, "junior")); v.add(b.replace(/\bjunior\b/, "jr"));
  v.add(b.replace(/\b(de|da|van|von|del|dos|el|al)\b/g, "").replace(/\s+/g, " ").trim());
  const p = b.split(" "); if (p.length >= 3) v.add(`${p[0]} ${p[p.length-1]}`);
  return [...v].filter(Boolean);
}

async function main() {
  // ── Table totals ──────────────────────────────────────────
  const { count: totalRows } = await sb.from("player_club_stats").select("*", { count: "exact", head: true });
  const { count: withShots }  = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("shots_per90", "is", null);
  const { count: withSot }    = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("shots_on_target_per90", "is", null);
  const { count: withXg }     = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("xg_per90", "is", null);
  const { count: withKp }     = await sb.from("player_club_stats").select("*", { count: "exact", head: true }).not("key_passes_per90", "is", null);

  // All stats rows — paginate to bypass Supabase's 1000-row default limit
  const COLS = "normalized_name, player_name, shots_per90, shots_on_target_per90, xg_per90, key_passes_per90, tackles_per90, league, goals, assists, minutes";
  const allRowsList: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const { data: batch } = await sb.from("player_club_stats")
      .select(COLS)
      .range(from, from + 999);
    if (!batch?.length) break;
    allRowsList.push(...batch);
    if (batch.length < 1000) break;
    from += 1000;
  }
  const allRows = allRowsList as Array<{ normalized_name: string; player_name: string; shots_per90: number|null; shots_on_target_per90: number|null; xg_per90: number|null; key_passes_per90: number|null; tackles_per90: number|null; league: string|null; goals: number|null; assists: number|null; minutes: number|null }>;

  // Merge: for each normalized name keep best (most complete) stats across all rows
  const merged = new Map<string, typeof allRows[0] & { leagues: string[] }>();
  for (const r of allRows) {
    const key = r.normalized_name;
    if (!merged.has(key)) {
      merged.set(key, { ...r, leagues: [r.league].filter((l): l is string => l != null) });
    } else {
      const m = merged.get(key)!;
      if (r.shots_per90 != null && m.shots_per90 == null)         m.shots_per90 = r.shots_per90;
      if (r.shots_on_target_per90 != null && m.shots_on_target_per90 == null) m.shots_on_target_per90 = r.shots_on_target_per90;
      if (r.xg_per90 != null && m.xg_per90 == null)               m.xg_per90 = r.xg_per90;
      if (r.key_passes_per90 != null && m.key_passes_per90 == null) m.key_passes_per90 = r.key_passes_per90;
      if (r.minutes != null && (m.minutes == null || r.minutes > m.minutes)) { m.goals = r.goals; m.assists = r.assists; m.minutes = r.minutes; }
      if (r.league && !m.leagues.includes(r.league)) m.leagues.push(r.league);
    }
  }

  const uniquePlayers = merged.size;
  const mergedWithShots = [...merged.values()].filter(r => r.shots_per90 != null).length;
  const mergedWithSot   = [...merged.values()].filter(r => r.shots_on_target_per90 != null).length;
  const mergedWithXg    = [...merged.values()].filter(r => r.xg_per90 != null).length;

  // ── WC coverage via player_role_profiles (what picks engine uses) ──
  const { data: profiles } = await sb.from("player_role_profiles")
    .select("player_name, country, position, dfs_role")
    .eq("wc_squad_confirmed", true)
    .order("big_game_rating", { ascending: false });

  const matchedProfiles: { name: string; country: string; pos: string; role: string; hasSot: boolean; hasShots: boolean; hasXg: boolean; hasKp: boolean }[] = [];
  const byCountry = new Map<string, number>();

  for (const p of profiles ?? []) {
    const vs = nameVariants(p.player_name);
    let found = null;
    for (const v of vs) { if (merged.has(v)) { found = merged.get(v); break; } }
    if (found) {
      matchedProfiles.push({ name: p.player_name, country: p.country, pos: p.position, role: p.dfs_role,
        hasSot: found.shots_on_target_per90 != null, hasShots: found.shots_per90 != null,
        hasXg: found.xg_per90 != null, hasKp: found.key_passes_per90 != null });
      byCountry.set(p.country, (byCountry.get(p.country) ?? 0) + 1);
    }
  }

  const unmatchedProfiles = (profiles ?? []).filter(p => {
    const vs = nameVariants(p.player_name);
    return !vs.some(v => merged.has(v));
  });

  // ── Print ────────────────────────────────────────────────
  console.log("════════════════════════════════════════════════════");
  console.log("  PLAYER_CLUB_STATS — COVERAGE REPORT");
  console.log("════════════════════════════════════════════════════\n");
  console.log("  RAW TABLE");
  console.log(`    Total rows:               ${totalRows}`);
  console.log(`    Unique players:           ${uniquePlayers}`);
  console.log(`    Rows with shots/90:       ${withShots}`);
  console.log(`    Rows with SoT/90:         ${withSot}`);
  console.log(`    Rows with xG/90:          ${withXg}`);
  console.log(`    Rows with key passes/90:  ${withKp}`);
  console.log("");
  console.log("  MERGED PER PLAYER (after cross-row stat merge)");
  console.log(`    Players with shots/90:    ${mergedWithShots}`);
  console.log(`    Players with SoT/90:      ${mergedWithSot}`);
  console.log(`    Players with xG/90:       ${mergedWithXg}`);
  console.log("");
  console.log("  WC SQUAD COVERAGE (via player_role_profiles)");
  console.log(`    Total WC profiles:        ${profiles?.length}`);
  console.log(`    Matched with any stats:   ${matchedProfiles.length} / ${profiles?.length}`);
  console.log(`    Matched with SoT/90:      ${matchedProfiles.filter(p=>p.hasSot).length}`);
  console.log(`    Matched with shots/90:    ${matchedProfiles.filter(p=>p.hasShots).length}`);
  console.log(`    Matched with xG/90:       ${matchedProfiles.filter(p=>p.hasXg).length}`);
  console.log(`    Unmatched:                ${unmatchedProfiles.length}`);

  console.log("\n── By country ───────────────────────────────────────");
  const sorted = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);
  for (const [country, count] of sorted) {
    console.log(`  ${country.padEnd(22)} ${String(count).padStart(2)}`);
  }

  console.log("\n── Key players WITH SoT/90 (shooting stats) ─────────");
  for (const p of matchedProfiles.filter(p => p.hasSot)) {
    console.log(`  ✓ ${p.name.padEnd(26)} ${p.country.padEnd(16)} ${p.role}`);
  }

  console.log("\n── Players with xG only (no shooting CSV yet) ───────");
  for (const p of matchedProfiles.filter(p => p.hasXg && !p.hasShots)) {
    console.log(`  ~ ${p.name.padEnd(26)} ${p.country.padEnd(16)} ${p.role}`);
  }

  console.log("\n── Unmatched WC players (no club stats) ─────────────");
  for (const p of unmatchedProfiles) {
    console.log(`  ✗ ${p.player_name.padEnd(26)} ${p.country}`);
  }
  console.log("\n════════════════════════════════════════════════════");
}

main().catch(console.error);
