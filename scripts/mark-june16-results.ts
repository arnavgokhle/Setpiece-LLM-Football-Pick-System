import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Fetch all pending picks for the three June 16 matches (IST June 17 kickoffs)
  const { data: picks, error } = await sb
    .from("picks")
    .select("id, player_name, home_team, away_team, stat_category, direction, line, result")
    .eq("result", "pending")
    .gte("kickoff_at", "2026-06-16T18:00:00Z")
    .lte("kickoff_at", "2026-06-17T06:00:00Z");

  if (error) { console.error(error.message); process.exit(1); }
  if (!picks?.length) { console.log("No pending picks found in range."); process.exit(0); }

  console.log(`\nFound ${picks.length} pending picks:\n`);
  picks.forEach((p: any) =>
    console.log(`  [${p.id}] ${p.player_name} | ${p.home_team} vs ${p.away_team} | ${p.direction} ${p.line} ${p.stat_category}`)
  );

  // Hard-delete: Argentina corners + Son
  const toDelete = picks.filter((p: any) =>
    (p.home_team === "Argentina" && p.stat_category.toLowerCase().includes("corner")) ||
    p.player_name.includes("Son")
  );

  for (const p of toDelete) {
    const { error: delErr } = await sb.from("picks").delete().eq("id", p.id);
    if (delErr) console.log(`  ✗ DELETE failed for ${p.player_name}: ${delErr.message}`);
    else console.log(`\n  🗑  DELETED: [${p.id}] ${p.player_name} — ${p.direction} ${p.line} ${p.stat_category}`);
  }

  // Mark results
  const MARKS: { match: string; player: string; stat: string; result: "won" | "lost" }[] = [
    { match: "France",    player: "Match",          stat: "corner",         result: "won"  }, // 10 corners > 9.5
    { match: "France",    player: "Mbappé",         stat: "Total Shots",    result: "won"  }, // 5+ shots > 3.5
    { match: "France",    player: "Mbappé",         stat: "Shots on Target",result: "won"  }, // 5 SoT > 1.5
    { match: "Argentina", player: "Messi",          stat: "Shots on Target",result: "won"  }, // hat-trick = ≥3 SoT > 1.5
    { match: "Argentina", player: "Messi",          stat: "Total Shots",    result: "won"  }, // hat-trick + disallowed > 3.5
  ];

  console.log("\nMarking results...\n");

  for (const mark of MARKS) {
    const pick = picks.find((p: any) =>
      p.home_team.includes(mark.match) &&
      p.player_name.toLowerCase().includes(mark.player.toLowerCase()) &&
      p.stat_category.toLowerCase().includes(mark.stat.toLowerCase())
    );

    if (!pick) {
      console.log(`  ⚠  Not found: ${mark.player} ${mark.stat} (${mark.match})`);
      continue;
    }

    const { error: upErr } = await sb.from("picks").update({ result: mark.result }).eq("id", pick.id);
    if (upErr) {
      console.log(`  ✗  ${pick.player_name} ${pick.stat_category}: ${upErr.message}`);
    } else {
      console.log(`  ✓  ${pick.player_name} — ${pick.direction} ${pick.line} ${pick.stat_category} → ${mark.result.toUpperCase()}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
