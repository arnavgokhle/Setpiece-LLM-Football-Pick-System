import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("pick_tracker")
    .select("*")
    .eq("user_id", user.id)
    .order("match_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ picks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { player_name, match, stat_line, direction, odds, match_date } = body;

  if (!player_name?.trim() || !match?.trim() || !stat_line?.trim() || !direction || !match_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!["MORE", "LESS"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("pick_tracker")
    .insert({
      user_id: user.id,
      player_name: player_name.trim(),
      match: match.trim(),
      stat_line: stat_line.trim(),
      direction,
      odds: odds ? parseFloat(odds) : null,
      match_date,
      result: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pick: data }, { status: 201 });
}
