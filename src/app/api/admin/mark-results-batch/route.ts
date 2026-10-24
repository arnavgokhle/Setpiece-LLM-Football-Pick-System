import { NextRequest, NextResponse } from "next/server";
import { markPickResult } from "@/lib/supabase-picks";
import type { PickResult } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.FINALIZE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { results } = await req.json() as { results: { pickId: string; result: PickResult }[] };
  if (!Array.isArray(results)) {
    return NextResponse.json({ error: "results array required" }, { status: 400 });
  }

  const valid: PickResult[] = ["won", "lost", "void", "pending"];
  let marked = 0;
  const errors: string[] = [];

  for (const { pickId, result } of results) {
    if (!valid.includes(result)) { errors.push(`${pickId}: invalid result ${result}`); continue; }
    try {
      await markPickResult(pickId, result);
      marked++;
    } catch (e) {
      errors.push(`${pickId}: ${e}`);
    }
  }

  return NextResponse.json({ marked, errors });
}
