import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await sb
    .from("picks")
    .select("player_name,player_team,stat_category,line,direction,confidence,stage,kickoff_at,result")
    .order("kickoff_at", { ascending: false })
    .limit(15);

  if (error) { console.error(error.message); process.exit(1); }

  console.log(`\n${data.length} picks found:\n`);
  data.forEach((p: any) => {
    const ko = new Date(p.kickoff_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
    console.log(`  ${p.player_name.padEnd(22)} ${p.player_team.padEnd(25)} ${p.direction} ${String(p.line).padEnd(5)} ${p.stat_category.padEnd(20)} ${p.confidence}%  [${p.stage}/${p.result}]  KO: ${ko}`);
  });
}

main();
