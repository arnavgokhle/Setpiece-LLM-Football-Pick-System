import { NextResponse } from "next/server";
import { getUpcomingPicksFromDB } from "@/lib/supabase-picks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const picks = await getUpcomingPicksFromDB();
    return NextResponse.json({ picks, count: picks.length });
  } catch (error) {
    console.error("[/api/picks] Error:", error);
    return NextResponse.json({ error: "Failed to fetch picks" }, { status: 500 });
  }
}
