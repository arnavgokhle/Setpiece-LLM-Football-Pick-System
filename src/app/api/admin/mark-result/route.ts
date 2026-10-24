import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { markPickResult } from "@/lib/supabase-picks";
import type { PickResult } from "@/types";

// No fallback: with ADMIN_EMAIL unset, nobody is admin.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/** Stat category → club_match_stats column. */
function statColumn(statCategory: string): string | null {
  switch (statCategory) {
    case "Total Shots":         return "shots";
    case "Shots on Target":     return "shots_on_target";
    case "Passes Attempted":    return "passes_attempted";
    case "Tackles":             return "tackles";
    case "Total Match Corners": return "match_corners";
    case "Total Bookings":      return "match_bookings";
    default:                    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!ADMIN_EMAIL || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pickId, result, actual } = await req.json();

    if (!pickId || !result) {
      return NextResponse.json({ error: "pickId and result required" }, { status: 400 });
    }

    const validResults: PickResult[] = ["won", "lost", "void", "pending"];
    if (!validResults.includes(result)) {
      return NextResponse.json({ error: "Invalid result" }, { status: 400 });
    }

    await markPickResult(pickId, result as PickResult, "human_confirmed");

    // A human-supplied figure is the most reliable data the system gets —
    // store it so it feeds rolling form, not just this one pick's result.
    let statStored = false;
    const numeric = parseFloat(String(actual ?? "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(numeric)) {
      const service = createServiceClient();
      const { data: pick } = await service
        .from("picks")
        .select("player_name,player_team,stat_category,home_team,away_team,competition,kickoff_at")
        .eq("id", pickId)
        .single();

      const col = pick ? statColumn(pick.stat_category) : null;
      if (pick && col) {
        const { error } = await service.from("club_match_stats").upsert(
          {
            player_name: pick.player_name,
            club: pick.player_team,
            opponent:
              pick.player_team === pick.home_team ? pick.away_team : pick.home_team,
            competition: pick.competition,
            match_date: pick.kickoff_at.slice(0, 10),
            [col]: numeric,
            source: "human",
          },
          { onConflict: "player_name,match_date,club" }
        );
        if (error) console.error("[admin/mark-result] club_match_stats:", error.message);
        else statStored = true;
      }
    }

    return NextResponse.json({ success: true, statStored });
  } catch (error) {
    console.error("[admin/mark-result] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
