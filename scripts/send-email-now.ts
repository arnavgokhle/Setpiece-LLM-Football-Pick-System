// Send today's matchday email immediately to all confirmed users
// Run: npx tsx --env-file=.env.local scripts/send-email-now.ts
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { matchdayEmailHtml } from "../src/lib/email-templates/matchday";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "Scout <scout@setpiecepicks.com>";
const BASE_URL = "https://setpiecepicks.com";
// Window covers all of "tonight" IST — kickoffs span 19:00 UTC Jun 17 through ~05:00 UTC Jun 18
const WINDOW_START = "2026-06-17T18:00:00Z";
const WINDOW_END = "2026-06-18T06:00:00Z";

async function run() {
  // 1. Get tonight's pending picks from DB
  const { data: picks } = await supabase
    .from("picks")
    .select("player_name,player_team,stat_category,line,direction,confidence,home_team,away_team,kickoff_at,ai_reasoning,recent_form,is_featured,result")
    .gte("kickoff_at", WINDOW_START)
    .lte("kickoff_at", WINDOW_END)
    .eq("result", "pending")
    .gte("confidence", 75)
    .order("confidence", { ascending: false });

  if (!picks || picks.length === 0) {
    console.log("No pending picks today — nothing to send.");
    return;
  }

  const safePicks = picks;

  console.log(`Found ${safePicks.length} picks for today.\n`);

  function toSummary(p: typeof safePicks[0]) {
    const vals = (p.recent_form ?? "").split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v));
    const hits = vals.filter((v: number) => p.direction === "MORE" ? v > p.line : v < p.line).length;
    return {
      player: p.player_name,
      team: p.player_team,
      stat: p.stat_category,
      line: p.line,
      direction: p.direction as "MORE" | "LESS",
      confidence: p.confidence,
      match: `${p.home_team} vs ${p.away_team}`,
      reasoning: p.ai_reasoning ?? undefined,
      formHit: vals.length ? `${hits}/${vals.length}` : undefined,
    };
  }

  const powerPickRaw = safePicks.find(p => p.is_featured) ?? safePicks[0];
  const powerPlay = toSummary(powerPickRaw);
  const rest = safePicks.filter(p => p.player_name !== powerPickRaw.player_name || p.stat_category !== powerPickRaw.stat_category);
  const regularPicks = rest.slice(0, 2).map(toSummary);

  const matchNames = [...new Set(safePicks.map(p => `${p.home_team} vs ${p.away_team}`))];
  const matchLabel = matchNames.slice(0, 2).join(" · ");

  const html = matchdayEmailHtml({ picks: regularPicks, powerPlay, matchLabel });
  const subject = `Scout's picks are live — ${matchLabel}`;

  // 2. Get all confirmed users
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emails = (users?.users ?? [])
    .filter(u => u.email && u.email_confirmed_at)
    .map(u => u.email as string);

  console.log(`Sending to ${emails.length} users: ${emails.slice(0, 3).join(", ")}${emails.length > 3 ? "..." : ""}`);
  console.log(`Subject: ${subject}`);
  console.log(`Picks: ${safePicks.map(p => `${p.player_name} ${p.direction} ${p.line} ${p.stat_category}`).join(" | ")}\n`);

  // 3. Send in batches of 50
  let sent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    const { error } = await resend.emails.send({ from: FROM, to: batch, subject, html });
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error.message);
    } else {
      sent += batch.length;
    }
  }

  console.log(`Done — sent to ${sent} users.`);
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
