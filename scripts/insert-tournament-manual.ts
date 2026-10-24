#!/usr/bin/env tsx
/**
 * Manual insert of Euro 2024 and Copa 2024 tournament stats for key players.
 * Data sourced from ESPN/FoxSports since FBref CSVs are empty.
 * Minutes estimated as: starts * 80 + (apps - starts) * 20
 *
 * Only covers players with goals, assists, or 5+ appearances (scorers + key contributors).
 * Run AFTER parse-international-csv.ts for WC22/WC18/Copa21.
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeName(name: string): string {
  return name
    .toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr").replace(/\bii\b/gi, "ii")
    .replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function estimateMinutes(apps: number, starts: number): number {
  return starts * 80 + (apps - starts) * 20;
}

function computeScore(apps: number, goals: number, assists: number, minutes: number, maxApps: number): number {
  const participation = Math.min(apps / maxApps, 1.0) * 30;
  const goalScore     = Math.min(goals / 3, 1.0) * 35;
  const assistScore   = Math.min(assists / 2, 1.0) * 20;
  const avgMins       = apps > 0 ? minutes / apps : 0;
  const starterScore  = avgMins >= 67.5 ? 15 : avgMins >= 45 ? 7 : 0;
  return Math.round((participation + goalScore + assistScore + starterScore) * 100) / 100;
}

interface TournamentPlayer {
  player_name: string;
  country: string;
  apps: number;    // games played
  starts: number;
  goals: number;
  assists: number;
}

// ── Euro 2024 key players ──────────────────────────────────────
// Source: ESPN + FoxSports. Max apps = 7 (Spain/England reached final).
const euro2024: TournamentPlayer[] = [
  // Top scorers (3 goals each)
  { player_name: "Harry Kane",         country: "England",     apps: 7, starts: 7, goals: 3, assists: 0 },
  { player_name: "Cody Gakpo",         country: "Netherlands", apps: 6, starts: 6, goals: 3, assists: 0 },
  { player_name: "Dani Olmo",          country: "Spain",       apps: 6, starts: 3, goals: 3, assists: 2 },
  { player_name: "Jamal Musiala",      country: "Germany",     apps: 5, starts: 5, goals: 3, assists: 0 },
  { player_name: "Georges Mikautadze", country: "Georgia",     apps: 4, starts: 4, goals: 3, assists: 0 },
  { player_name: "Ivan Schranz",       country: "Slovakia",    apps: 4, starts: 4, goals: 3, assists: 0 },
  // 2-goal scorers
  { player_name: "Fabian Ruiz",        country: "Spain",       apps: 6, starts: 6, goals: 2, assists: 2 },
  { player_name: "Nico Williams",      country: "Spain",       apps: 6, starts: 6, goals: 2, assists: 1 },
  { player_name: "Michel Aebischer",   country: "Switzerland", apps: 5, starts: 5, goals: 1, assists: 2 },
  // Assist leaders (from FoxSports table)
  { player_name: "Lamine Yamal",       country: "Spain",       apps: 7, starts: 6, goals: 1, assists: 4 },
  { player_name: "Xavi Simons",        country: "Netherlands", apps: 6, starts: 5, goals: 1, assists: 2 },
  { player_name: "Joshua Kimmich",     country: "Germany",     apps: 5, starts: 5, goals: 0, assists: 2 },
  { player_name: "Nathan Ake",         country: "Netherlands", apps: 6, starts: 6, goals: 0, assists: 2 },
  { player_name: "Arda Guler",         country: "Turkey",      apps: 5, starts: 4, goals: 1, assists: 2 },
  { player_name: "Dennis Man",         country: "Romania",     apps: 4, starts: 3, goals: 0, assists: 2 },
  { player_name: "Remo Freuler",       country: "Switzerland", apps: 5, starts: 5, goals: 1, assists: 2 },
  { player_name: "Kylian Mbappe",      country: "France",      apps: 5, starts: 5, goals: 1, assists: 1 },
  { player_name: "Mikel Oyarzabal",    country: "Spain",       apps: 7, starts: 1, goals: 1, assists: 1 },
  { player_name: "Cristiano Ronaldo",  country: "Portugal",    apps: 5, starts: 5, goals: 0, assists: 1 },
  { player_name: "Ruben Vargas",       country: "Switzerland", apps: 5, starts: 4, goals: 1, assists: 1 },
  // 1-goal, 1-assist
  { player_name: "Wout Weghorst",      country: "Netherlands", apps: 6, starts: 0, goals: 1, assists: 1 },
  // Key players in finals/SFs with notable minutes
  { player_name: "Jude Bellingham",    country: "England",     apps: 7, starts: 7, goals: 2, assists: 0 },
  { player_name: "Bukayo Saka",        country: "England",     apps: 7, starts: 7, goals: 1, assists: 0 },
  { player_name: "Phil Foden",         country: "England",     apps: 7, starts: 5, goals: 0, assists: 0 },
  { player_name: "Toni Kroos",         country: "Germany",     apps: 5, starts: 5, goals: 0, assists: 1 },
  { player_name: "Florian Wirtz",      country: "Germany",     apps: 5, starts: 5, goals: 1, assists: 0 },
  { player_name: "Virgil van Dijk",    country: "Netherlands", apps: 6, starts: 6, goals: 0, assists: 0 },
  { player_name: "Memphis Depay",      country: "Netherlands", apps: 6, starts: 4, goals: 1, assists: 0 },
  { player_name: "Alvaro Morata",      country: "Spain",       apps: 6, starts: 5, goals: 1, assists: 0 },
  { player_name: "Rodri",              country: "Spain",       apps: 7, starts: 7, goals: 0, assists: 0 },
  { player_name: "Granit Xhaka",       country: "Switzerland", apps: 5, starts: 5, goals: 0, assists: 1 },
  { player_name: "Breel Embolo",       country: "Switzerland", apps: 5, starts: 4, goals: 1, assists: 0 },
  { player_name: "Nicolo Barella",     country: "Italy",       apps: 3, starts: 3, goals: 0, assists: 1 },
  { player_name: "Bryan Cristante",    country: "Italy",       apps: 3, starts: 3, goals: 1, assists: 0 },
  { player_name: "Vitinha",            country: "Portugal",    apps: 5, starts: 5, goals: 0, assists: 0 },
  { player_name: "Bruno Fernandes",    country: "Portugal",    apps: 5, starts: 5, goals: 0, assists: 0 },
  { player_name: "Bernardo Silva",     country: "Portugal",    apps: 5, starts: 5, goals: 0, assists: 0 },
  { player_name: "Robert Lewandowski", country: "Poland",      apps: 3, starts: 3, goals: 0, assists: 0 },
  { player_name: "Antoine Griezmann",  country: "France",      apps: 5, starts: 5, goals: 0, assists: 0 },
  { player_name: "Ousmane Dembele",    country: "France",      apps: 5, starts: 5, goals: 0, assists: 0 },
  { player_name: "Marcus Thuram",      country: "France",      apps: 5, starts: 4, goals: 1, assists: 0 },
];

// ── Copa America 2024 key players ─────────────────────────────
// Source: FoxSports standard + goals tables. Max apps = 6 (Argentina reached final).
const copa2024: TournamentPlayer[] = [
  // Top goal scorer
  { player_name: "Lautaro Martinez",   country: "Argentina",  apps: 6, starts: 6, goals: 5, assists: 0 },
  // Top assist leader
  { player_name: "James Rodriguez",    country: "Colombia",   apps: 6, starts: 6, goals: 1, assists: 6 },
  // 2+ goals
  { player_name: "Salomon Rondon",     country: "Venezuela",  apps: 4, starts: 4, goals: 3, assists: 1 },
  { player_name: "Darwin Nunez",       country: "Uruguay",    apps: 6, starts: 6, goals: 2, assists: 0 },
  { player_name: "Vinicius Junior",    country: "Brazil",     apps: 3, starts: 3, goals: 2, assists: 0 },
  { player_name: "Julian Alvarez",     country: "Argentina",  apps: 5, starts: 5, goals: 2, assists: 0 },
  { player_name: "Jhon Cordoba",       country: "Colombia",   apps: 6, starts: 6, goals: 2, assists: 1 },
  { player_name: "Jefferson Lerma",    country: "Colombia",   apps: 5, starts: 5, goals: 2, assists: 0 },
  { player_name: "Daniel Munoz",       country: "Colombia",   apps: 5, starts: 5, goals: 2, assists: 1 },
  { player_name: "Luis Diaz",          country: "Colombia",   apps: 6, starts: 6, goals: 2, assists: 0 },
  { player_name: "Jonathan David",     country: "Canada",     apps: 6, starts: 6, goals: 2, assists: 0 },
  { player_name: "Rodrigo Bentancur",  country: "Uruguay",    apps: 6, starts: 6, goals: 2, assists: 0 },
  { player_name: "Maximiliano Araujo", country: "Uruguay",    apps: 6, starts: 6, goals: 2, assists: 1 },
  { player_name: "Eduard Bello",       country: "Venezuela",  apps: 4, starts: 4, goals: 2, assists: 0 },
  { player_name: "Folarin Balogun",    country: "USA",        apps: 3, starts: 3, goals: 2, assists: 0 },
  { player_name: "Jose Fajardo",       country: "Panama",     apps: 4, starts: 4, goals: 2, assists: 0 },
  { player_name: "Davinson Sanchez",   country: "Colombia",   apps: 6, starts: 6, goals: 1, assists: 0 },
  // Assist contributors
  { player_name: "Lionel Messi",       country: "Argentina",  apps: 5, starts: 5, goals: 1, assists: 1 },
  { player_name: "Alexis Mac Allister",country: "Argentina",  apps: 5, starts: 5, goals: 0, assists: 2 },
  { player_name: "Nicolas De La Cruz", country: "Uruguay",    apps: 5, starts: 4, goals: 0, assists: 2 },
  { player_name: "Jon Aramburu",       country: "Venezuela",  apps: 3, starts: 3, goals: 0, assists: 2 },
  { player_name: "Angel Di Maria",     country: "Argentina",  apps: 5, starts: 4, goals: 0, assists: 1 },
  { player_name: "Rodrigo De Paul",    country: "Argentina",  apps: 5, starts: 5, goals: 0, assists: 1 },
  { player_name: "Enzo Fernandez",     country: "Argentina",  apps: 5, starts: 4, goals: 0, assists: 1 },
  { player_name: "Giovani Lo Celso",   country: "Argentina",  apps: 5, starts: 1, goals: 0, assists: 1 },
  { player_name: "Facundo Pellistri",  country: "Uruguay",    apps: 6, starts: 6, goals: 1, assists: 1 },
  { player_name: "Moise Bombito",      country: "Canada",     apps: 6, starts: 6, goals: 0, assists: 1 },
  { player_name: "Matias Vina",        country: "Uruguay",    apps: 5, starts: 5, goals: 1, assists: 1 },
  { player_name: "Giorgian De Arrascaeta", country: "Uruguay", apps: 5, starts: 1, goals: 0, assists: 1 },
  // Key players with significant minutes
  { player_name: "Emiliano Martinez",  country: "Argentina",  apps: 6, starts: 6, goals: 0, assists: 0 },
  { player_name: "Rodrigo Muniz",      country: "Brazil",     apps: 3, starts: 3, goals: 1, assists: 0 },
  { player_name: "Raphinha",           country: "Brazil",     apps: 4, starts: 4, goals: 1, assists: 0 },
  { player_name: "Richarlison",        country: "Brazil",     apps: 3, starts: 3, goals: 1, assists: 0 },
  { player_name: "Luis Suarez",        country: "Uruguay",    apps: 5, starts: 3, goals: 1, assists: 0 },
];

async function insertTournament(
  players: TournamentPlayer[],
  tournament: string,
  tournamentYear: number,
  maxApps: number
): Promise<void> {
  const records = players.map((p) => {
    const minutes = estimateMinutes(p.apps, p.starts);
    const score = computeScore(p.apps, p.goals, p.assists, minutes, maxApps);
    return {
      player_name: p.player_name,
      normalized_name: normalizeName(p.player_name),
      country: p.country,
      tournament,
      tournament_year: tournamentYear,
      matches_played: p.apps,
      starts: p.starts,
      minutes,
      goals: p.goals,
      assists: p.assists,
      shots_per90: null,
      shots_on_target_per90: null,
      key_passes_per90: null,
      xg_per90: null,
      progressive_carries_per90: null,
      intl_form_score: score,
      is_tournament_performer: score >= 55,
      source: "manual-web",
    };
  });

  const performers = records.filter((r) => r.is_tournament_performer);
  console.log(`\n── ${tournament} (${records.length} players, ${performers.length} performers) ─`);
  performers.forEach((r) =>
    console.log(`  ✓ ${r.player_name} (${r.country}) — ${r.goals}G ${r.assists}A, score=${r.intl_form_score}`)
  );

  let ok = 0, err = 0;
  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    const { error } = await sb
      .from("player_international_stats")
      .upsert(chunk, { onConflict: "normalized_name,tournament" });
    if (error) { console.error(`  Error:`, error.message); err += chunk.length; }
    else ok += chunk.length;
  }
  console.log(`  Upserted: ${ok} | Errors: ${err}`);
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Insert Tournament Data (Euro2024 + Copa2024)    ║");
  console.log("╚══════════════════════════════════════════════════╝");

  await insertTournament(euro2024, "Euro2024", 2024, 7);
  await insertTournament(copa2024, "Copa2024", 2024, 6);

  // Verify totals
  const { data } = await sb
    .from("player_international_stats")
    .select("tournament")
    .in("tournament", ["Euro2024", "Copa2024"]);

  const counts: Record<string, number> = {};
  for (const r of data ?? []) {
    counts[r.tournament] = (counts[r.tournament] ?? 0) + 1;
  }
  console.log("\nDB verification:");
  Object.entries(counts).forEach(([t, c]) => console.log(`  ${t}: ${c} rows`));
  console.log("\nDone!");
}

main().catch(console.error);
