"use client";

import Link from "next/link";
import { Shield, Zap, Flame, Lock, ArrowRight } from "lucide-react";
import type { LineupType } from "@/types";

const TYPE_CONFIG: Record<LineupType, { icon: React.ReactNode; label: string; flagship?: boolean }> = {
  safe:    { icon: <Shield className="h-4 w-4" />, label: "Safe Play"  },
  power:   { icon: <Zap    className="h-4 w-4" />, label: "Power Play", flagship: true },
  jackpot: { icon: <Flame  className="h-4 w-4" />, label: "Jackpot"    },
};

interface LockedLineupCardProps {
  type: LineupType;
  pickCount: number;
  estimatedPayout: number;
}

export function LockedLineupCard({ type, pickCount, estimatedPayout }: LockedLineupCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div className="bg-surface-card border border-outline-variant/50 rounded-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-stack-md pt-stack-md pb-stack-sm border-b border-outline-variant/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-3 py-1 rounded-sm font-label-caps text-label-caps text-primary">
              {config.icon}
              {config.label}
            </span>
            {config.flagship && (
              <span className="bg-primary text-on-primary px-2 py-0.5 rounded-sm font-label-caps text-[9px] uppercase">
                Flagship
              </span>
            )}
          </div>
          <span className="border border-outline-variant/40 bg-surface-variant/20 px-3 py-1 rounded-sm font-label-caps text-label-caps text-secondary">
            Est. {estimatedPayout}x
          </span>
        </div>
        <p className="font-data-mono text-data-mono text-secondary text-xs mt-2">{pickCount} picks included</p>
      </div>

      {/* Blurred picks + lock overlay */}
      <div className="relative px-stack-md py-stack-sm flex-1 min-h-[140px]">
        <div className="blur-sm pointer-events-none space-y-3 select-none">
          {Array.from({ length: pickCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-sm bg-surface-variant/30 border border-outline-variant/20" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 rounded-sm bg-surface-variant/30" />
                <div className="h-2 w-20 rounded-sm bg-surface-variant/20" />
              </div>
              <div className="h-5 w-10 rounded-sm bg-surface-variant/30" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 bg-surface-card/70 backdrop-blur-[2px]">
          <div className="h-10 w-10 rounded-sm bg-surface-variant/30 border border-outline-variant/40 flex items-center justify-center">
            <Lock className="h-4 w-4 text-secondary" />
          </div>
          <p className="font-label-caps text-label-caps text-on-surface text-center">
            UNLOCK WITH SETPIECE EDGE
          </p>
          <Link
            href="/pricing"
            className="bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 rounded-sm hover:bg-primary-fixed-dim transition-colors shadow-edge"
          >
            Go Edge — ₹299/mo <ArrowRight className="inline h-3 w-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-stack-md py-stack-sm border-t border-outline-variant/20">
        <div className="h-3 w-24 rounded-sm bg-surface-variant/20" />
      </div>
    </div>
  );
}
