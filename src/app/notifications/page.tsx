import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getUserNotifications, markAllNotificationsRead } from "@/lib/supabase-notifications";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@/types";

export const dynamic = "force-dynamic";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const notifications = await getUserNotifications(user.id);

  // Mark all as read when page is viewed
  await markAllNotificationsRead(user.id);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Bell className="h-5 w-5 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-ink">Notifications</h1>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-ink-faint">
                <CheckCheck className="h-3.5 w-3.5" />
                All marked as read
              </div>
            )}
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface-1 p-12 text-center">
              <Bell className="h-8 w-8 text-ink-faint mx-auto mb-3" />
              <p className="text-ink-muted font-medium">No notifications yet</p>
              <p className="text-sm text-ink-faint mt-1">
                Follow a match on the dashboard to get alerted when final picks drop.
              </p>
              <a
                href="/dashboard"
                className="inline-block mt-4 text-sm text-accent hover:underline"
              >
                Browse today's picks →
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-surface-border bg-surface-1 overflow-hidden divide-y divide-surface-border">
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mt-0.5">
        <Bell className="h-4 w-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{notification.title}</p>
        <p className="text-sm text-ink-muted mt-0.5">{notification.body}</p>
        <p className="text-xs text-ink-faint mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      <a
        href="/dashboard"
        className="flex-shrink-0 text-xs text-accent hover:underline mt-1"
      >
        View picks →
      </a>
    </div>
  );
}
