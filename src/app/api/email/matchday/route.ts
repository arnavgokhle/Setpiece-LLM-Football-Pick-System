import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUpcomingPicksFromDB } from "@/lib/supabase-picks";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { matchdayEmailHtml } from "@/lib/email-templates/matchday";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function POST(req: NextRequest) {
  // Admin-only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get today's final picks sorted by confidence
    const allPicks = await getUpcomingPicksFromDB();
    const today = new Date().toISOString().slice(0, 10);
    const todayPicks = allPicks
      .filter((p) => p.stage === "final" && p.match.kickoff.startsWith(today))
      .sort((a, b) => b.confidence - a.confidence);

    if (todayPicks.length === 0) {
      return NextResponse.json({ error: "No final picks for today" }, { status: 400 });
    }

    const top3 = todayPicks.slice(0, 3).map((p) => ({
      player: p.player.name,
      team: p.player.team,
      stat: p.statCategory,
      line: p.line,
      direction: p.direction,
      confidence: p.confidence,
      match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
    }));

    const powerPlay = (todayPicks.find((p) => p.isFeatured) ?? todayPicks[0]);
    const powerPlaySummary = {
      player: powerPlay.player.name,
      team: powerPlay.player.team,
      stat: powerPlay.statCategory,
      line: powerPlay.line,
      direction: powerPlay.direction,
      confidence: powerPlay.confidence,
      match: `${powerPlay.match.homeTeam} vs ${powerPlay.match.awayTeam}`,
    };

    // Build match label for subject
    const matchNames = [...new Set(todayPicks.map((p) => `${p.match.homeTeam} vs ${p.match.awayTeam}`))];
    const matchLabel = matchNames.slice(0, 3).join(" · ");

    // Get all auth users via service role
    const serviceClient = createServiceClient();
    const { data: usersPage, error: listError } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      console.error("[email/matchday] listUsers error:", listError);
      return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
    }

    const emails = usersPage.users
      .filter((u) => u.email && u.email_confirmed_at)
      .map((u) => u.email as string);

    if (emails.length === 0) {
      return NextResponse.json({ error: "No confirmed users found" }, { status: 400 });
    }

    const html = matchdayEmailHtml({ picks: top3, powerPlay: powerPlaySummary, matchLabel });

    // Resend supports up to 50 recipients per call — batch if needed
    const BATCH_SIZE = 50;
    let sent = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const { error } = await getResend().emails.send({
        from: FROM_ADDRESS,
        to: batch,
        subject: `Scout's picks are live — ${matchLabel}`,
        html,
      });
      if (error) {
        console.error(`[email/matchday] batch ${i} error:`, error);
      } else {
        sent += batch.length;
      }
    }

    return NextResponse.json({ ok: true, sent, total: emails.length });
  } catch (err) {
    console.error("[email/matchday]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
