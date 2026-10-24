"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchFollowButtonProps {
  fixtureId: number;
  initialFollowing?: boolean;
}

export function MatchFollowButton({
  fixtureId,
  initialFollowing = false,
}: MatchFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [justChanged, setJustChanged] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follows", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
      });

      if (res.status === 401) {
        // Not logged in — show login nudge
        window.location.href = "/auth/login";
        return;
      }

      if (res.ok) {
        setFollowing(!following);
        setJustChanged(true);
        setTimeout(() => setJustChanged(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={following ? "Unfollow match" : "Follow for final pick alert"}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        following
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-surface-border bg-surface-2 text-ink-muted hover:border-accent/30 hover:text-ink"
      )}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : following ? (
        <BellOff className="h-3 w-3" />
      ) : (
        <Bell className="h-3 w-3" />
      )}
      {justChanged && following
        ? "Following!"
        : justChanged && !following
        ? "Unfollowed"
        : following
        ? "Following"
        : "Alert me"}
    </button>
  );
}
