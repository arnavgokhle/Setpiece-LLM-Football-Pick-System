import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { followMatch, unfollowMatch, getUserFollows } from "@/lib/supabase-follows";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ follows: [] });

  const follows = await getUserFollows(user.id);
  return NextResponse.json({ follows });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fixtureId } = await req.json();
  if (!fixtureId) return NextResponse.json({ error: "fixtureId required" }, { status: 400 });

  await followMatch(user.id, Number(fixtureId));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fixtureId } = await req.json();
  if (!fixtureId) return NextResponse.json({ error: "fixtureId required" }, { status: 400 });

  await unfollowMatch(user.id, Number(fixtureId));
  return NextResponse.json({ success: true });
}
