import Link from "next/link";
import { Lock, Sparkles, ChevronRight } from "lucide-react";

interface PaywallBannerProps {
  lockedCount: number;
}

export function PaywallBanner({ lockedCount }: PaywallBannerProps) {
  return (
    <div className="rounded-2xl border border-accent/20 bg-surface-1 p-6 mb-8">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/30">
            <Lock className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-ink">
              {lockedCount} more pick{lockedCount !== 1 ? "s" : ""} locked
            </p>
            <p className="text-sm text-ink-muted mt-0.5">
              Free plan includes 2 picks per match. Upgrade to unlock all{" "}
              <span className="text-ink font-medium">AI analysis, full reasoning & confidence scores.</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-shrink-0">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-black hover:bg-accent-dim transition-colors shadow-glow-green"
          >
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            Get Edge · ₹299/mo
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </Link>
          <Link
            href="/pricing"
            className="text-center text-xs text-ink-faint hover:text-ink-muted transition-colors"
          >
            US pricing coming soon · join waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
