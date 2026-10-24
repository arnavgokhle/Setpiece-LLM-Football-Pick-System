"use client";

import { useState } from "react";
import { Shield, Zap, Flame, Copy, Check, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import type { Lineup, LineupType, LineupResult } from "@/types";

const TYPE_CONFIG: Record<LineupType, { icon: React.ReactNode; label: string; flagship?: boolean; payout: number }> = {
  safe:    { icon: <Shield className="h-4 w-4" />, label: "Safe Play",  payout: 3  },
  power:   { icon: <Zap    className="h-4 w-4" />, label: "Power Play", payout: 5, flagship: true },
  jackpot: { icon: <Flame  className="h-4 w-4" />, label: "Jackpot",    payout: 20 },
};

function parseFormNums(recentForm: string): number[] {
  return (recentForm.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 5).map(Number);
}

function pickFormScore(pick: Lineup["picks"][number]): number {
  const nums = parseFormNums(pick.recentForm ?? "");
  const hitStat = (pick.keyStats ?? []).find((s) => /hit.*10|last.*10/i.test(s.label));
  let hits10: number | null = null;
  if (hitStat) {
    const m = hitStat.value.match(/(\d+)\s*\/\s*10/);
    if (m) hits10 = parseInt(m[1]);
  }
  const avgStat = (pick.keyStats ?? []).find((s) => /season.*avg|avg.*season|avg.*p90|^season avg$/i.test(s.label));
  let avgBonus = 0;
  if (avgStat) {
    const avg = parseFloat(avgStat.value.match(/[\d.]+/)?.[0] ?? "");
    if (!isNaN(avg)) avgBonus = (pick.direction === "MORE" ? avg > pick.line : avg < pick.line) ? 10 : 0;
  }
  if (hits10 !== null) return Math.min(100, Math.round((hits10 / 10) * 80 + avgBonus + 10));
  if (!nums.length) return Math.min(100, Math.round((pick.confidence ?? 70) * 0.9));
  const hits5 = nums.filter((n) => (pick.direction === "MORE" ? n > pick.line : n < pick.line)).length;
  return Math.min(100, Math.round((hits5 / nums.length) * 80 + avgBonus + 10));
}

function avgFormScore(picks: Lineup["picks"]): number {
  if (!picks.length) return 0;
  return Math.round(picks.reduce((sum, p) => sum + pickFormScore(p), 0) / picks.length);
}

function formSegments(score: number): number {
  return Math.max(1, Math.round(score / 20));
}

function ResultBadge({ result }: { result: LineupResult }) {
  if (result === "won") return (
    <span className="flex items-center gap-1 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-sm font-label-caps text-[9px] text-primary uppercase">
      <TrendingUp className="h-3 w-3" /> Won
    </span>
  );
  if (result === "lost") return (
    <span className="flex items-center gap-1 bg-system-red/10 border border-system-red/30 px-2 py-0.5 rounded-sm font-label-caps text-[9px] text-system-red uppercase">
      <TrendingDown className="h-3 w-3" /> Lost
    </span>
  );
  if (result === "void") return (
    <span className="flex items-center gap-1 bg-surface-variant/30 border border-outline-variant/40 px-2 py-0.5 rounded-sm font-label-caps text-[9px] text-secondary uppercase">
      <Minus className="h-3 w-3" /> Void
    </span>
  );
  return null;
}

export function LineupCard({ lineup }: { lineup: Lineup }) {
  const [copied, setCopied] = useState(false);
  const config = TYPE_CONFIG[lineup.type];
  const formScore = avgFormScore(lineup.picks);
  const segs = formSegments(formScore);

  const isJackpot = lineup.type === "jackpot";
  const colonIdx = isJackpot ? lineup.reasoning.indexOf(":") : -1;
  const jackpotTheme = colonIdx > 0 ? lineup.reasoning.slice(0, colonIdx).trim() : null;
  const jackpotExplanation = colonIdx > 0 ? lineup.reasoning.slice(colonIdx + 1).trim() : lineup.reasoning;

  function buildCopyText(): string {
    const pickLines = lineup.picks
      .map((p, i) => `${i + 1}. ${p.player.name} — ${p.statCategory} ${p.direction} ${p.line} (${p.confidence}%)`)
      .join("\n");
    return `Setpiece ${config.label} — ${lineup.picks.length} Picks\n\n${pickLines}\n\nForm Score: ${formScore}/100 | Payout: ${config.payout}x\nsetpiecepicks.com`;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="bg-surface-card border border-outline-variant/50 rounded-sm overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="px-stack-md pt-stack-md pb-stack-sm border-b border-outline-variant/20">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
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
            {jackpotTheme && (
              <span className="bg-surface-variant/30 border border-outline-variant/40 px-2 py-0.5 rounded-sm font-label-caps text-[9px] text-secondary">
                {jackpotTheme}
              </span>
            )}
            {lineup.result !== "pending" && <ResultBadge result={lineup.result} />}
          </div>
          <span className="border border-outline-variant/40 bg-surface-variant/20 px-3 py-1 rounded-sm font-label-caps text-label-caps text-secondary">
            {config.payout}x payout
          </span>
        </div>

        {/* Segmented form bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-label-caps text-[9px] text-on-surface-variant/60">FORM SCORE</span>
            <span className="font-data-mono text-data-mono text-on-surface text-xs">{formScore}/100</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`progress-segment ${s <= segs ? "active" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Picks list */}
      <div className="px-stack-md py-stack-sm flex-1 space-y-3">
        {lineup.picks.map((pick, i) => {
          const isMore = pick.direction === "MORE";
          const pfs = pickFormScore(pick);
          return (
            <div key={pick.id} className="flex items-center gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-sm bg-surface-variant/30 border border-outline-variant/30 flex items-center justify-center font-data-mono text-[10px] text-secondary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                  {pick.player.name}
                  <span className="text-on-surface-variant mx-1.5">—</span>
                  <span className="text-secondary font-normal">{pick.statCategory} {pick.direction} {pick.line}</span>
                </p>
                <p className="font-data-mono text-[10px] text-on-surface-variant/60 mt-0.5">
                  {pick.match.homeTeam} vs {pick.match.awayTeam}
                </p>
              </div>
              <span className="flex-shrink-0 font-data-mono text-[10px] text-secondary tabular-nums">
                {pfs}/100
              </span>
              <span className={`flex-shrink-0 font-label-caps text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                isMore ? "bg-primary/10 border border-primary/30 text-primary" : "bg-system-red/10 border border-system-red/30 text-system-red"
              }`}>
                {pick.confidence}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Reasoning */}
      {lineup.reasoning && (
        <div className="mx-stack-md mb-stack-sm rounded-sm bg-primary/5 border border-primary/15 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="font-label-caps text-[10px] text-primary uppercase tracking-wide">AI Reasoning</span>
          </div>
          <p className="font-body-sm text-body-sm text-secondary leading-relaxed text-xs">{jackpotExplanation}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-stack-md py-stack-sm border-t border-outline-variant/20 flex items-center justify-between gap-3">
        <span className="font-data-mono text-data-mono text-secondary text-xs">
          {lineup.confidence}% avg confidence
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 border border-outline-variant/40 bg-surface-variant/20 px-3 py-1.5 rounded-sm font-label-caps text-label-caps text-secondary hover:text-on-surface hover:border-primary/30 transition-colors"
        >
          {copied
            ? <><Check className="h-3.5 w-3.5 text-primary" /> COPIED</>
            : <><Copy className="h-3.5 w-3.5" /> COPY</>}
        </button>
      </div>
    </div>
  );
}
