// One-shot matchday blast — protected by FINALIZE_SECRET, no session required.
// Sends all upcoming early/final picks for today's matches to all confirmed users.
// One-off blast route kept from the World Cup run; delete if unused this season.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUpcomingPicksFromDB } from "@/lib/supabase-picks";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { matchdayEmailHtml, matchdayEmailText } from "@/lib/email-templates/matchday";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.FINALIZE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testOnly: string | null = body.testEmail ?? null;

    const allPicks = await getUpcomingPicksFromDB();
    const today = new Date().toISOString().slice(0, 10);

    // Include both early and final picks for today
    const todayPicks = allPicks
      .filter((p) => p.match.kickoff.startsWith(today) && p.result === "pending")
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.confidence - a.confidence;
      });

    if (todayPicks.length === 0) {
      return NextResponse.json({ error: "No picks for today" }, { status: 400 });
    }

    function toPickSummary(p: typeof todayPicks[0]) {
      // Compute form hit rate from recentForm string (e.g. "7, 8, 6, 9, 7")
      let formHit: string | undefined;
      try {
        const vals = (p.recentForm ?? "").split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v));
        if (vals.length > 0) {
          const hits = vals.filter((v: number) => p.direction === "MORE" ? v > p.line : v < p.line).length;
          formHit = `${hits}/${vals.length} hit`;
        }
      } catch {}
      return {
        player: p.player.name,
        team: p.player.team,
        stat: p.statCategory,
        line: p.line,
        direction: p.direction,
        confidence: p.confidence,
        match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
        reasoning: p.aiReasoning ?? undefined,
        formHit,
      };
    }

    // Power play: highest-confidence featured pick
    const powerPickRaw = todayPicks.find((p) => p.isFeatured) ?? todayPicks[0];
    const powerPlay = toPickSummary(powerPickRaw);

    // Regular picks: exclude the power play by id, then prefer shots first, then highest confidence
    const remaining = todayPicks.filter((p) => p.id !== powerPickRaw.id);
    const shotsCategories = ["Total Shots", "Shots on Target"];
    const topShots = remaining.find((p) => shotsCategories.includes(p.statCategory));
    const otherTop = remaining.filter((p) => !shotsCategories.includes(p.statCategory))[0];
    const regularPicks = [topShots, otherTop].filter((p): p is typeof todayPicks[0] => !!p).slice(0, 2).map(toPickSummary);

    const matchNames = [...new Set(todayPicks.map((p) => `${p.match.homeTeam} vs ${p.match.awayTeam}`))];
    const matchLabel = matchNames.slice(0, 2).join(" · ");

    const noPickMatches = (body.noPickMatches ?? []) as { homeTeam: string; awayTeam: string; reason: string }[];
    const emailOpts = { picks: regularPicks, powerPlay, matchLabel, noPickMatches };
    const html = matchdayEmailHtml(emailOpts);
    const text = matchdayEmailText(emailOpts);
    const topPick = powerPlay ?? regularPicks[0];
    const subject = topPick
      ? `${topPick.player} ${topPick.direction.toLowerCase()} ${topPick.line} ${topPick.stat} tonight`
      : `Tonight's picks — ${matchLabel}`;

    // Test mode: send only to the provided email
    if (testOnly) {
      const { error } = await getResend().emails.send({ from: FROM_ADDRESS, to: testOnly, subject, html, text });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, sent: 1, mode: "test", to: testOnly });
    }

    // Full blast: all confirmed users
    const serviceClient = createServiceClient();
    const { data, error: listError } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return NextResponse.json({ error: "Failed to list users" }, { status: 500 });

    const emails = data.users.filter((u) => u.email && u.email_confirmed_at).map((u) => u.email as string);

    let sent = 0;
    for (let i = 0; i < emails.length; i += 100) {
      const batch = emails.slice(i, i + 100).map((to) => ({ from: FROM_ADDRESS, to, subject, html, text }));
      const { error } = await getResend().batch.send(batch);
      if (!error) sent += batch.length;
    }

    return NextResponse.json({ ok: true, sent, total: emails.length });
  } catch (err) {
    console.error("[email/send-picks]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
