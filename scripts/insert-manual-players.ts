#!/usr/bin/env tsx
/**
 * Inserts/updates player_club_stats for players outside Big 5 leagues
 * (Saudi Pro League, MLS) sourced from manually copied FBref standard stats rows.
 * Shots/SoT remain null — only goals, assists, minutes are set.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bjr\.?\b/gi, "jr")
    .replace(/['''`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const players = [
  {
    // FBref: 30MP, 2601min, 28.9 90s, 28G, 2A. ESPN shots: 149/69.
    player_name: "Cristiano Ronaldo",
    club: "Al-Nassr",
    league: "Saudi Pro League",
    minutes: 2601,
    goals: 28,
    assists: 2,
    shots_per90: 149 / 28.9,        // 5.16
    shots_on_target_per90: 69 / 28.9, // 2.39
  },
  {
    // FBref: 28MP, 2421min, 26.9 90s, 29G, 16A. ESPN shots: 157/71.
    player_name: "Lionel Messi",
    club: "Inter Miami",
    league: "MLS",
    minutes: 2421,
    goals: 29,
    assists: 16,
    shots_per90: 157 / 26.9,        // 5.84
    shots_on_target_per90: 71 / 26.9, // 2.64
  },
  {
    // FBref: 2124min, 23.6 90s. ESPN (all comps): 14G, 11A, 89 shots, 36 SoT.
    player_name: "Sadio Mané",
    club: "Al-Nassr",
    league: "Saudi Pro League",
    minutes: 2124,
    goals: 14,
    assists: 11,
    shots_per90: 89 / 23.6,         // 3.77
    shots_on_target_per90: 36 / 23.6, // 1.53
  },
  {
    // FBref: 1562min, 17.4 90s. Gls=2 (0.12/90✓), Ast=1 (0.06/90✓). No shots data (DM).
    player_name: "Golo Kanté",
    club: "Al-Ittihad",
    league: "Saudi Pro League",
    minutes: 1562,
    goals: 2,
    assists: 1,
    shots_per90: null as number | null,
    shots_on_target_per90: null as number | null,
  },
];

async function main() {
  for (const p of players) {
    const normalized = normalizeName(p.player_name);
    const record: Record<string, unknown> = {
      normalized_name: normalized,
      player_name: p.player_name,
      club: p.club,
      league: p.league,
      season: "2024-25",
      minutes: p.minutes,
      goals: p.goals,
      assists: p.assists,
      source: "fbref-manual",
    };
    if (p.shots_per90 != null) record.shots_per90 = Math.round(p.shots_per90 * 100) / 100;
    if (p.shots_on_target_per90 != null) record.shots_on_target_per90 = Math.round(p.shots_on_target_per90 * 100) / 100;

    const { error } = await sb.from("player_club_stats").upsert(record, {
      onConflict: "normalized_name,club,season",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Error inserting ${p.player_name}:`, error.message);
    } else {
      console.log(`✓ ${p.player_name} (${p.club}) — ${p.minutes}min, ${p.goals}G ${p.assists}A`);
    }
  }

  // Verify
  const { data } = await sb
    .from("player_club_stats")
    .select("player_name, club, league, minutes, goals, assists, shots_per90, shots_on_target_per90")
    .in("normalized_name", ["cristiano ronaldo", "lionel messi", "sadio mane", "golo kante"]);
  console.log("\nVerification:");
  console.table(data);
}

main().catch(console.error);
