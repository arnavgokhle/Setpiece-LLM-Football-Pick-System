import { Zap } from "lucide-react";
import { LineupCard } from "@/components/lineups/LineupCard";
import { LockedLineupCard } from "@/components/lineups/LockedLineupCard";
import type { Lineup, LineupType } from "@/types";

const TYPE_ORDER: LineupType[] = ["power", "safe", "jackpot"];

interface PowerPlaysTabProps {
  lineups: Lineup[];
  subscriptionTier: "FREE" | "PRO";
}

export function PowerPlaysTab({ lineups, subscriptionTier }: PowerPlaysTabProps) {
  const isEdge = subscriptionTier === "PRO";

  if (lineups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-14 w-14 rounded-sm bg-surface-card border border-outline-variant/40 flex items-center justify-center mb-5">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-headline-card text-headline-card text-on-surface mb-2">No lineups yet</h3>
        <p className="font-body-sm text-body-sm text-secondary max-w-xs">
          Power Play lineups generate when today&apos;s picks are finalised. Check back closer to kick-off.
        </p>
      </div>
    );
  }

  const sorted = [...lineups].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a.type);
    const bi = TYPE_ORDER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
      {sorted.map((lineup) =>
        isEdge ? (
          <LineupCard key={lineup.id} lineup={lineup} />
        ) : (
          <LockedLineupCard
            key={lineup.id}
            type={lineup.type}
            pickCount={lineup.picks.length}
            estimatedPayout={lineup.estimatedPayout}
          />
        )
      )}
    </div>
  );
}
