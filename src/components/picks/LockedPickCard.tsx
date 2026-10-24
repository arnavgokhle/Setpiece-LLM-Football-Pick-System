"use client";

import Link from "next/link";
import { Lock, User } from "lucide-react";
import { formatKickoff } from "@/lib/utils";
import type { Pick } from "@/types";

export function LockedPickCard({ pick }: { pick: Pick }) {
  const isMore = pick.direction === "MORE";

  return (
    <div className="relative bg-surface-card border border-outline-variant/50 rounded-sm overflow-hidden">
      {/* Blurred ghost content */}
      <div className="p-stack-md select-none pointer-events-none" aria-hidden>
        <header className="flex items-center gap-stack-md mb-stack-md">
          <div className="w-12 h-12 rounded-sm bg-surface-variant flex items-center justify-center blur-sm flex-shrink-0">
            <User className="h-5 w-5 text-on-surface-variant/40" />
          </div>
          <div className="blur-sm">
            <p className="font-headline-card text-headline-card text-on-surface">
              {pick.player.name}
            </p>
            <p className="font-data-mono text-data-mono text-secondary text-xs">
              {pick.player.team} · {pick.player.position}
            </p>
            <p className="font-data-mono text-[10px] text-on-surface-variant/60 mt-0.5">
              {pick.match.homeTeam} vs {pick.match.awayTeam} · {formatKickoff(pick.match.kickoff)}
            </p>
          </div>
        </header>

        <div className="border-y border-outline-variant/30 py-stack-sm blur-sm">
          <span className="block font-label-caps text-label-caps text-secondary mb-1 uppercase">
            {pick.statCategory}
          </span>
          <div className="flex items-end justify-between">
            <span className="font-hero-sm text-hero-sm text-on-surface leading-none">{pick.line}</span>
            <span className={`font-label-caps text-label-caps px-4 py-2 rounded-sm text-sm font-bold ${isMore ? "bg-primary text-on-primary" : "bg-system-red text-void-black"}`}>
              {pick.direction}
            </span>
          </div>
        </div>

        <div className="mt-stack-sm flex gap-1 blur-sm">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`progress-segment ${s <= 4 ? (isMore ? "active" : "active-red") : ""}`} />
          ))}
        </div>
      </div>

      {/* Sign up overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-card/80 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#55c878]/10 border border-[#55c878]/20">
            <Lock className="h-4 w-4 text-[#55c878]" />
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface mb-1">FREE WORLD CUP ACCESS</p>
            <p className="font-body-sm text-body-sm text-secondary leading-relaxed text-xs">
              Sign up free to unlock every pick until September 20
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 bg-[#55c878] text-[#0b0e0c] font-label-caps text-label-caps px-5 py-2.5 rounded-sm hover:bg-[#46b167] transition-colors font-bold"
          >
            Sign up free →
          </Link>
        </div>
      </div>
    </div>
  );
}
