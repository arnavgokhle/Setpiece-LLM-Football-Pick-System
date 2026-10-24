// ============================================================
// SETPIECE — Notifications CRUD
// ============================================================

import { createServiceClient } from "@/lib/supabase/service";
import { getFollowersForFixture } from "./supabase-follows";
import type { Notification } from "@/types";

interface NotificationRow {
  id: string;
  user_id: string;
  fixture_id: number;
  type: "final_picks_ready";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    fixtureId: row.fixture_id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

// ── Create final-pick notifications for all followers ──────
export async function createFinalPickNotifications(
  fixtureIds: number[],
  matchNames: Record<number, string>, // fixtureId → "Home vs Away"
  pickCounts: Record<number, number>  // fixtureId → count
): Promise<void> {
  const supabase = createServiceClient();

  const rows: {
    user_id: string;
    fixture_id: number;
    type: string;
    title: string;
    body: string;
  }[] = [];

  for (const fixtureId of fixtureIds) {
    const followers = await getFollowersForFixture(fixtureId);
    if (!followers.length) continue;

    const matchName = matchNames[fixtureId] ?? "Upcoming match";
    const count = pickCounts[fixtureId] ?? 0;

    for (const userId of followers) {
      rows.push({
        user_id: userId,
        fixture_id: fixtureId,
        type: "final_picks_ready",
        title: `Final picks ready: ${matchName}`,
        body: `Scout has finalized ${count} pick${count !== 1 ? "s" : ""} with confirmed lineups. Kickoff soon.`,
      });
    }
  }

  if (!rows.length) return;

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("[supabase-notifications] createFinalPickNotifications:", error.message);

  // TODO: Send email via Resend when connected
  // rows.forEach(r => sendFinalPicksEmail(r.user_id, r.title, r.body));
}

// ── Get unread count for navbar dot ───────────────────────
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

// ── Get all notifications for a user ──────────────────────
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[supabase-notifications] getUserNotifications:", error.message);
    return [];
  }
  return (data as NotificationRow[]).map(rowToNotification);
}

// ── Mark a single notification read ───────────────────────
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
  if (error) console.error("[supabase-notifications] markNotificationRead:", error.message);
}

// ── Mark all notifications read for a user ─────────────────
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) console.error("[supabase-notifications] markAllNotificationsRead:", error.message);
}
