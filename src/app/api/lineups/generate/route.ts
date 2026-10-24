// ============================================================
// SETPIECE — Lineup Generation Route
// POST — Protected by FINALIZE_SECRET
// Generates Power Play lineups from today's stored picks.
// POST ?force=true — deletes existing lineups and regenerates.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getUpcomingPicksFromDB } from "@/lib/supabase-picks";
import { generateLineups } from "@/lib/lineup-generator";
import { saveLineups, lineupsExistForDate, deleteLineupsForDate } from "@/lib/supabase-lineups";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.FINALIZE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayDate = new Date().toISOString().split("T")[0];
  const force = req.nextUrl.searchParams.get("force") === "true";

  if (force) {
    await deleteLineupsForDate(todayDate);
  } else if (await lineupsExistForDate(todayDate)) {
    return NextResponse.json({ generated: 0, matchday: todayDate, message: "Already generated" });
  }

  const picks = await getUpcomingPicksFromDB();
  const storedPicks = picks.filter((p) => p.dbId);

  if (storedPicks.length < 2) {
    return NextResponse.json({ generated: 0, matchday: todayDate, message: "Not enough picks" });
  }

  const rawLineups = await generateLineups(storedPicks);
  if (rawLineups.length === 0) {
    return NextResponse.json({ generated: 0, matchday: todayDate, message: "Generation failed" });
  }

  await saveLineups(rawLineups, storedPicks);

  return NextResponse.json({ generated: rawLineups.length, matchday: todayDate });
}
