// ============================================================
// SETPIECE — World Cup 2026 DB Helpers
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";

export interface WcPlayer {
  player_api_id: number | null;
  name: string;
  country: string;
  club: string | null;
  position: string | null;
  age: number | null;
  caps: number;
  international_goals: number;
  international_assists: number;
  stats_per90: {
    shots_per90?: number | null;
    shots_on_target_per90?: number | null;
    key_passes_per90?: number | null;
    assists_per90?: number | null;
    tackles_per90?: number | null;
    passes_per90?: number | null;
    saves_per90?: number | null;
  };
  recent_form: Array<{
    date: string;
    opponent: string;
    goals?: number;
    assists?: number;
    shots_on_target?: number;
    key_passes?: number;
    tackles?: number;
    minutes?: number;
  }>;
  tournament_history: Array<{
    year: number;
    tournament: string;
    stage: string;
    goals?: number;
    assists?: number;
    appearances?: number;
  }>;
  xg_per90: number | null;
  progressive_carries_per90: number | null;
  shot_creating_actions_per90: number | null;
}

// ── Get WC players for a set of national teams ─────────────
export async function getWcPlayersForTeams(
  countries: string[]
): Promise<WcPlayer[]> {
  if (!countries.length) return [];
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("wc_players")
    .select("*")
    .in("country", countries);

  if (error) {
    console.error("[supabase-wc] getWcPlayersForTeams:", error.message);
    return [];
  }
  return (data ?? []) as WcPlayer[];
}

// ── Build a WC squad context string for the Claude prompt ──
export function buildWcSquadContext(players: WcPlayer[]): string {
  if (!players.length) return "";

  const byCountry = new Map<string, WcPlayer[]>();
  for (const p of players) {
    const list = byCountry.get(p.country) ?? [];
    list.push(p);
    byCountry.set(p.country, list);
  }

  const sections: string[] = [];

  for (const [country, squad] of byCountry) {
    const lines = squad.map((p) => {
      const per90Parts: string[] = [];
      const s = p.stats_per90 ?? {};

      if (p.position === "GK") {
        if (s.saves_per90 != null) per90Parts.push(`saves/90: ${s.saves_per90}`);
      } else {
        if (s.shots_on_target_per90 != null) per90Parts.push(`SoT/90: ${s.shots_on_target_per90}`);
        if (s.key_passes_per90 != null)       per90Parts.push(`KP/90: ${s.key_passes_per90}`);
        if (s.assists_per90 != null)           per90Parts.push(`ast/90: ${s.assists_per90}`);
        if (s.tackles_per90 != null)           per90Parts.push(`tkl/90: ${s.tackles_per90}`);
      }

      const stats = per90Parts.length ? ` [${per90Parts.join(", ")}]` : "";
      const caps  = p.caps > 0 ? ` · ${p.caps} caps` : "";
      const goals = p.international_goals > 0 ? ` · ${p.international_goals}G intl` : "";

      return `  ${p.name} (${p.position ?? "?"}, ${p.club ?? "unknown club"})${caps}${goals}${stats}`;
    });

    sections.push(`${country}:\n${lines.join("\n")}`);
  }

  return `\nWORLD CUP 2026 SQUAD DATA:\n${sections.join("\n\n")}\n`;
}
