// GET /api/cron/daily
// Called every 30 minutes by GitHub Actions.
// Job 0: Auto-generate early picks for upcoming club fixtures (if not done).
// Job 1: Send picks email 4h before first match of the day (once per day).
// Job 2: Welcome + today's picks to newly confirmed users (within last 31 min).
// Job 3: Auto-grade finished matches; uncertain ones become void + needs_review.
// Protected by FINALIZE_SECRET.

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { getUpcomingPicksFromDB } from "@/lib/supabase-picks";
import { runEarlyPickGeneration } from "@/lib/pipeline/generate-picks";
import { runResultGrading } from "@/lib/pipeline/grade-results";
import { matchdayEmailHtml } from "@/lib/email-templates/matchday";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://setpiecepicks.com";

// ── Helpers ────────────────────────────────────────────────────────────────────

function toPickSummary(p: Awaited<ReturnType<typeof getUpcomingPicksFromDB>>[0]) {
  let formHit: string | undefined;
  try {
    const vals = (p.recentForm ?? "").split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v));
    if (vals.length > 0) {
      const hits = vals.filter((v: number) => p.direction === "MORE" ? v > p.line : v < p.line).length;
      formHit = `${hits}/${vals.length} hit`;
    }
  } catch {}
  return {
    player: p.player.name, team: p.player.team, stat: p.statCategory,
    line: p.line, direction: p.direction as "MORE" | "LESS",
    confidence: p.confidence, match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
    reasoning: p.aiReasoning ?? undefined, formHit, id: p.id,
  };
}

type StoredPick = Awaited<ReturnType<typeof getUpcomingPicksFromDB>>[0];

/** Kickoff grouping key — the ISO minute, so a 15:00 block is one email. */
function kickoffKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}

async function buildEmailPayload(
  picks: StoredPick[],
  supabase: ReturnType<typeof createServiceClient>
) {
  const sorted = [...picks].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.confidence - a.confidence;
  });

  if (sorted.length === 0) return null;

  const powerPickRaw = sorted.find((p) => p.isFeatured) ?? sorted[0];
  const powerPlay = toPickSummary(powerPickRaw);
  const remaining = sorted.filter((p) => p.id !== powerPickRaw.id);
  const shotsCategories = ["Total Shots", "Shots on Target"];
  const topShots = remaining.find((p) => shotsCategories.includes(p.statCategory));
  const otherTop = remaining.filter((p) => !shotsCategories.includes(p.statCategory))[0];
  const regularPicks = [topShots, otherTop]
    .filter((p): p is StoredPick => !!p)
    .slice(0, 2)
    .map(toPickSummary);

  // Fixtures kicking off in the same block that produced no pick, so the
  // email can say why rather than silently omitting them.
  const kickoffs = [...new Set(sorted.map((p) => kickoffKey(p.match.kickoff)))];
  const windowStart = new Date(`${kickoffs[0]}:00.000Z`);
  const { data: fixtures } = await supabase
    .from("club_fixtures")
    .select("home_team,away_team,kickoff_at")
    .gte("kickoff_at", new Date(windowStart.getTime() - 60_000).toISOString())
    .lte("kickoff_at", new Date(windowStart.getTime() + 60_000).toISOString())
    .eq("is_priority", true)
    .order("kickoff_at", { ascending: true });

  const matchesWithPicks = new Set(
    sorted.map((p) => `${p.match.homeTeam}|${p.match.awayTeam}`)
  );
  const noPickMatches = (fixtures ?? [])
    .filter((f) => !matchesWithPicks.has(`${f.home_team}|${f.away_team}`))
    .map((f) => ({
      homeTeam: f.home_team,
      awayTeam: f.away_team,
      reason: "No player line cleared Scout's 75% confidence floor for this fixture.",
    }));

  const matchNames = [...new Set(sorted.map((p) => `${p.match.homeTeam} vs ${p.match.awayTeam}`))];
  const matchLabel = matchNames.slice(0, 2).join(" · ");
  return {
    html: matchdayEmailHtml({ picks: regularPicks, powerPlay, matchLabel, noPickMatches }),
    subject: `Scout's picks are live — ${matchLabel}`,
    matchLabel,
  };
}

async function sendToAddresses(
  emails: string[],
  picks: StoredPick[],
  supabase: ReturnType<typeof createServiceClient>
) {
  const payload = await buildEmailPayload(picks, supabase);
  if (!payload) return { sent: 0, reason: "no picks" };
  const resend = getResend();
  let sent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS, to: batch, subject: payload.subject, html: payload.html,
    });
    if (!error) sent += batch.length;
  }
  return { sent, matchLabel: payload.matchLabel };
}

async function confirmedUserEmails(supabase: ReturnType<typeof createServiceClient>) {
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return (users?.users ?? [])
    .filter((u) => u.email && u.email_confirmed_at)
    .map((u) => u.email as string);
}

// ── Job 1: One picks email per kickoff block, ~4h before ───────────────────────
//
// The World Cup version sent a single email 4h before the first match of the
// day, which worked because WC matchdays were one block. A Premier League
// Saturday is 12:30 / 15:00 / 17:30 — a single send is 9h early for the last
// block, by which point the picks it announced have already been finalised or
// voided. Each block now gets its own email, deduped per kickoff.

async function job1_matchdayEmails(
  supabase: ReturnType<typeof createServiceClient>,
  now: Date,
  log: string[]
) {
  const allPicks = await getUpcomingPicksFromDB();
  const pending = allPicks.filter(
    (p) => p.result === "pending" && new Date(p.match.kickoff).getTime() > now.getTime()
  );
  if (!pending.length) return;

  const blocks = new Map<string, StoredPick[]>();
  for (const p of pending) {
    const k = kickoffKey(p.match.kickoff);
    if (!blocks.has(k)) blocks.set(k, []);
    blocks.get(k)!.push(p);
  }

  for (const [key, blockPicks] of blocks) {
    const kickoff = new Date(`${key}:00.000Z`);
    const minsUntil = (kickoff.getTime() - now.getTime()) / 60000;
    // 30-minute tick, so a 30-minute window fires exactly once per block.
    if (minsUntil < 225 || minsUntil > 255) continue;

    const jobKey = `picks_email_${key}`;
    const runDate = key.slice(0, 10);
    const { data: alreadySent } = await supabase
      .from("cron_log").select("id").eq("job", jobKey).eq("run_date", runDate).limit(1);
    if (alreadySent?.length) {
      log.push(`picks_email: already sent for ${key}`);
      continue;
    }

    const emails = await confirmedUserEmails(supabase);
    const result = await sendToAddresses(emails, blockPicks, supabase);
    await supabase.from("cron_log").insert({ job: jobKey, run_date: runDate, meta: result });
    log.push(`picks_email: ${key} → sent to ${result.sent} (${result.matchLabel ?? ""})`);
  }
}

// ── Job 0: Auto-generate picks for upcoming club fixtures ────────────

async function job0_generatePicks(log: string[]) {
  // Delegates to the shared pipeline stage, which reads club_fixtures.
  // A 2-day window matches the EARLY stage (picks land ~24h before
  // kickoff); picksExistForFixture() inside the stage keeps this to one
  // Claude call per fixture per day across all 48 ticks.
  try {
    const result = await runEarlyPickGeneration(2, "cron");
    log.push(...result.log);
  } catch (err) {
    log.push(
      `picks_generate: error — ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.FINALIZE_SECRET || auth !== `Bearer ${process.env.FINALIZE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const log: string[] = [];

  // ── Job 0: Auto-generate picks ────────────────────────────
  await job0_generatePicks(log);

  // ── Job 1: Matchday emails, per kickoff block ─────────────
  await job1_matchdayEmails(supabase, now, log);

  // ── Job 2: Welcome newly confirmed users ──────────────────
  const windowStart = new Date(now.getTime() - 31 * 60 * 1000).toISOString();
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const newUsers = (allUsers?.users ?? []).filter(
    (u) => u.email && u.email_confirmed_at && u.email_confirmed_at > windowStart
  );

  for (const user of newUsers) {
    const resend = getResend();
    const welcomeHtml = `<!DOCTYPE html><html><body bgcolor="#000000" style="margin:0;padding:0;background:#000;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000"><tr><td align="center" bgcolor="#000000" style="padding:40px 20px;">
<table width="520" cellpadding="0" cellspacing="0"><tr><td bgcolor="#000000" style="font-family:Inter,sans-serif;">
  <p style="margin:0 0 4px;font-size:11px;font-family:monospace;letter-spacing:0.18em;text-transform:uppercase;color:#55c878;">Setpiece Scout</p>
  <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#f2f5f0;">You're in.</h1>
  <p style="font-size:14px;color:#475569;line-height:1.6;">Scout analyses squad data, club form, and season-long numbers to find high-confidence player prop edges — corners, shots, passes, bookings. No goals, no xG hype.</p>
  <div style="margin:28px 0;text-align:center;">
    <a href="${BASE_URL}/dashboard" style="display:inline-block;padding:13px 28px;background:#55c878;color:#000;font-size:13px;font-weight:700;text-decoration:none;border-radius:3px;letter-spacing:0.05em;text-transform:uppercase;">See today's picks →</a>
  </div>
  <p style="font-size:11px;color:#1d241e;text-align:center;font-family:monospace;">Setpiece · ${BASE_URL}<br/>For entertainment only. · <a href="mailto:support@setpiecepicks.com" style="color:#1d241e;">support@setpiecepicks.com</a></p>
</td></tr></table></td></tr></table></body></html>`;

    await resend.emails.send({ from: FROM_ADDRESS, to: user.email!, subject: "You're in — Scout's picks are ready", html: welcomeHtml });
    const todaysPicks = (await getUpcomingPicksFromDB()).filter(
      (p) => p.result === "pending" && p.match.kickoff.startsWith(todayStr)
    );
    if (todaysPicks.length) await sendToAddresses([user.email!], todaysPicks, supabase);
    log.push(`new_user: welcomed ${user.email}`);
  }

  // ── Job 3: Auto-mark results ──────────────────────────────
  const grading = await runResultGrading(now);
  log.push(...grading.log);

  if (log.length === 0) log.push("no jobs triggered this tick");
  return NextResponse.json({ ok: true, log, checkedAt: now.toISOString() });
}
