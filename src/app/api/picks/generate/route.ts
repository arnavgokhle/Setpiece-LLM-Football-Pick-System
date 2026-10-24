// GET /api/picks/generate
// Manual / external trigger for early pick generation.
// The scheduled path is /api/cron/daily job0 — both call the same
// pipeline stage so the two can never drift apart again.

import { NextRequest, NextResponse } from "next/server";
import { runEarlyPickGeneration } from "@/lib/pipeline/generate-picks";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5-minute timeout for cron

export async function GET(req: NextRequest) {
  // Auth: Bearer token must match FINALIZE_SECRET
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.FINALIZE_SECRET ?? "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEarlyPickGeneration(7, "manual");
    for (const line of result.log) console.log(`[picks/generate] ${line}`);

    return NextResponse.json({
      generated: result.generated,
      skipped: result.skipped,
      fixtures: result.fixtures,
    });
  } catch (error) {
    console.error("[picks/generate] Error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
