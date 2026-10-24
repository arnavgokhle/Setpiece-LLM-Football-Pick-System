// ============================================================
// SETPIECE — Match Follows CRUD
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";

export async function followMatch(userId: string, fixtureId: number): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("match_follows")
    .insert({ user_id: userId, fixture_id: fixtureId });
  // Ignore unique constraint errors (already following)
  if (error && !error.message.includes("duplicate")) {
    console.error("[supabase-follows] followMatch:", error.message);
  }
}

export async function unfollowMatch(userId: string, fixtureId: number): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("match_follows")
    .delete()
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId);
  if (error) console.error("[supabase-follows] unfollowMatch:", error.message);
}

export async function isFollowingMatch(
  userId: string,
  fixtureId: number
): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("match_follows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("fixture_id", fixtureId);
  return (count ?? 0) > 0;
}

export async function getUserFollows(userId: string): Promise<number[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("match_follows")
    .select("fixture_id")
    .eq("user_id", userId);
  if (error) {
    console.error("[supabase-follows] getUserFollows:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.fixture_id as number);
}

// Returns all user_ids following a given fixture
export async function getFollowersForFixture(fixtureId: number): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("match_follows")
    .select("user_id")
    .eq("fixture_id", fixtureId);
  if (error) {
    console.error("[supabase-follows] getFollowersForFixture:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.user_id as string);
}
