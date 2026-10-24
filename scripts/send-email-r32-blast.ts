// Send Round of 32 Openers email to all confirmed users
// Run: npx tsx --env-file=.env.local scripts/send-email-r32-blast.ts
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { matchdayEmailHtml } from "../src/lib/email-templates/matchday";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "Scout <scout@setpiecepicks.com>";

const WINDOW_START = "2026-06-28T18:00:00Z";
const WINDOW_END   = "2026-06-29T23:00:00Z";

async function run() {
  const { data: picks } = await supabase
    .from("picks")
    .select("player_name,player_team,stat_category,line,direction,confidence,home_team,away_team,kickoff_at,ai_reasoning,recent_form,is_featured,result")
    .gte("kickoff_at", WINDOW_START)
    .lte("kickoff_at", WINDOW_END)
    .eq("result", "pending")
    .gte("confidence", 75)
    .order("confidence", { ascending: false });

  if (!picks || picks.length === 0) { console.log("No picks found."); return; }

  function toSummary(p: typeof picks[0]) {
    const vals = (p.recent_form ?? "").split(",").map((v: string) => parseFloat(v.trim())).filter((v: number) => !isNaN(v));
    const hits = vals.filter((v: number) => p.direction === "MORE" ? v > p.line : v < p.line).length;
    return {
      player: p.player_name, team: p.player_team, stat: p.stat_category,
      line: p.line, direction: p.direction as "MORE" | "LESS", confidence: p.confidence,
      match: `${p.home_team} vs ${p.away_team}`,
      reasoning: p.ai_reasoning ?? undefined,
      formHit: vals.length ? `${hits}/${vals.length}` : undefined,
    };
  }

  const powerPickRaw = picks.find(p => p.is_featured) ?? picks[0];
  const powerPlay = toSummary(powerPickRaw);
  const rest = picks.filter(p => p.player_name !== powerPickRaw.player_name || p.stat_category !== powerPickRaw.stat_category);
  const regularPicks = rest.slice(0, 3).map(toSummary);
  const matchNames = [...new Set(picks.map(p => `${p.home_team} vs ${p.away_team}`))];
  const matchLabel = matchNames.join(" · ");
  const html = matchdayEmailHtml({ picks: regularPicks, powerPlay, matchLabel });
  const subject = `Scout's Round of 32 Openers — ${matchLabel}`;

  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emails = (users ?? [])
    .filter(u => u.email && u.email_confirmed_at)
    .map(u => u.email as string);

  console.log(`Subject: ${subject}`);
  console.log(`Sending to ${emails.length} users...\n`);

  let sent = 0;
  for (let i = 0; i < emails.length; i += 50) {
    const batch = emails.slice(i, i + 50);
    const { error } = await resend.emails.send({ from: FROM, to: batch, subject, html });
    if (error) { console.error(`Batch error:`, error.message); }
    else { sent += batch.length; }
  }

  console.log(`\n✓ Sent to ${sent}/${emails.length} users:\n`);
  emails.forEach(e => console.log("  " + e));
}

run().catch(err => { console.error("Fatal:", err); process.exit(1); });
