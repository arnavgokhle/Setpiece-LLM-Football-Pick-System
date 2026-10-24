import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESULTS: { name: string; result: "won" | "lost" }[] = [
  { name: "Ousmane Dembélé", result: "lost" },  // 1 SoT (penalty goal only) — needed >1.5
  { name: "Vitinha",          result: "won"  },  // 75% PSG possession over 120min — cleared 40.5 easily
  { name: "João Neves",       result: "won"  },  // 120min + yellow card for tactical foul — 2+ tackles
  { name: "Bukayo Saka",      result: "lost" },  // Arsenal had 1 SoT total — couldn't clear 1.5
  { name: "Martin Ødegaard",  result: "lost" },  // Subbed off early, 24.7% possession — <1.5 key passes
];

async function main() {
  console.log("\nMarking CL Final pick results...\n");

  const { data: picks, error } = await sb
    .from("picks")
    .select("id, player_name, stat_category, direction, line, result")
    .eq("fixture_id", 999001);

  if (error) { console.error(error.message); process.exit(1); }
  if (!picks?.length) { console.log("No picks found for fixture 999001"); process.exit(0); }

  for (const { name, result } of RESULTS) {
    const pick = picks.find((p: any) =>
      p.player_name.toLowerCase().includes(name.toLowerCase().split(" ").pop()!.toLowerCase())
    );
    if (!pick) { console.log(`  ⚠  Not found: ${name}`); continue; }

    const { error: updateErr } = await sb
      .from("picks")
      .update({ result })
      .eq("id", pick.id);

    if (updateErr) {
      console.log(`  ✗  ${name}: ${updateErr.message}`);
    } else {
      const icon = result === "won" ? "✓" : "✗";
      console.log(`  ${icon}  ${pick.player_name} — ${pick.direction} ${pick.line} ${pick.stat_category} → ${result.toUpperCase()}`);
    }
  }

  // Also mark lineup results
  const { data: lineups } = await sb
    .from("lineups")
    .select("id, type")
    .eq("matchday", "2026-05-30");

  if (lineups?.length) {
    console.log("\nUpdating lineup results...");
    for (const lineup of lineups) {
      // Safe (2 picks): Dembélé LOST + Saka LOST → lost
      // Power (3 picks): Dembélé LOST — any loss = lineup lost
      // Jackpot (5 picks): 3 lost — lost
      const { error: le } = await sb.from("lineups").update({ result: "lost" }).eq("id", lineup.id);
      if (!le) console.log(`  ✗  ${lineup.type} lineup → lost`);
    }
  }

  console.log("\nDone. Results published.");
}

main().catch((e) => { console.error(e); process.exit(1); });
