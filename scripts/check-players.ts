#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const names = ["cristiano ronaldo", "lionel messi", "vinicius junior", "vinicius jr"];
  const { data, error } = await sb.from("player_club_stats")
    .select("player_name, normalized_name, club, league, shots_per90, shots_on_target_per90, minutes, season")
    .in("normalized_name", names);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
