import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updates: { player: string; fixture: number; stat: string; newLine: number }[] = [
  { player: "Cristiano Ronaldo", fixture: 900061, stat: "Total Shots",      newLine: 2.5 },
  { player: "Vitinha",           fixture: 900061, stat: "Passes Attempted", newLine: 70.5 },
  { player: "Rúben Neves",       fixture: 900061, stat: "Passes Attempted", newLine: 60.5 },
  { player: "Bernardo Silva",    fixture: 900061, stat: "Passes Attempted", newLine: 55.5 },
  { player: "Bruno Fernandes",   fixture: 900061, stat: "Passes Attempted", newLine: 45.5 },
  { player: "Jude Bellingham",   fixture: 900067, stat: "Passes Attempted", newLine: 45.5 },
  { player: "Declan Rice",       fixture: 900067, stat: "Passes Attempted", newLine: 55.5 },
];

async function run() {
  for (const u of updates) {
    const { data, error } = await sb
      .from("picks")
      .update({ line: u.newLine })
      .eq("fixture_id", u.fixture)
      .eq("stat_category", u.stat)
      .ilike("player_name", `%${u.player.split(" ").pop()}%`)
      .select("player_name,line");

    if (error) console.log(`  ✗  ${u.player}: ${error.message}`);
    else console.log(`  ✓  ${u.player} — ${u.stat} → ${u.newLine} (updated ${data?.length} row)`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
