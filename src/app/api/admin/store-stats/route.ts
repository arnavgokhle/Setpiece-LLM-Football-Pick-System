// POST /api/admin/store-stats
// Stores actual post-game player stats in wc_match_stats for future pick generation.
// Protected by FINALIZE_SECRET.
// Body: { stats: PlayerStat[] }
// PlayerStat: { player_name, team, opponent, match_date, minutes?, shots?, shots_on_target?,
//               passes_completed?, fouls_committed?, corners_won?, yellow_cards?, goals? }

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.FINALIZE_SECRET || auth !== `Bearer ${process.env.FINALIZE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const stats = body.stats as Record<string, unknown>[];

  if (!Array.isArray(stats) || stats.length === 0) {
    return NextResponse.json({ error: "stats array required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("wc_match_stats")
    .upsert(stats, { onConflict: "player_name,match_date,opponent" })
    .select("player_name,match_date,opponent");

  if (error) {
    console.error("[store-stats]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: data?.length ?? 0, players: data?.map((r) => r.player_name) });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.FINALIZE_SECRET || auth !== `Bearer ${process.env.FINALIZE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const player = searchParams.get("player");
  const date = searchParams.get("date");

  const supabase = createServiceClient();
  let query = supabase.from("wc_match_stats").select("*").order("match_date", { ascending: false });
  if (player) query = query.ilike("player_name", `%${player}%`);
  if (date) query = query.eq("match_date", date);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stats: data });
}
