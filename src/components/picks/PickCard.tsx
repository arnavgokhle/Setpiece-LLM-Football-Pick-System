"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle, Clock, Sparkles } from "lucide-react";
import { cn, formatKickoff } from "@/lib/utils";
import type { Pick } from "@/types";

// ── Form helpers ───────────────────────────────────────────
function parseFormNums(recentForm: string): number[] {
  return (recentForm.match(/\d+(?:\.\d+)?/g) ?? []).slice(0, 5).map(Number);
}

function hitCount(nums: number[], line: number, dir: "MORE" | "LESS"): number {
  return nums.filter((n) => (dir === "MORE" ? n > line : n < line)).length;
}

function computeFormScore(pick: Pick): number {
  const nums = parseFormNums(pick.recentForm);
  const hitStat = pick.keyStats.find((s) => /hit.*10|last.*10/i.test(s.label));
  let hits10: number | null = null;
  if (hitStat) {
    const m = hitStat.value.match(/(\d+)\s*\/\s*10/);
    if (m) hits10 = parseInt(m[1]);
  }
  const avgStat = pick.keyStats.find((s) => /season.*avg|avg.*season|avg.*p90|^avg$/i.test(s.label));
  let avgBonus = 0;
  if (avgStat) {
    const avg = parseFloat(avgStat.value.match(/[\d.]+/)?.[0] ?? "");
    if (!isNaN(avg)) avgBonus = (pick.direction === "MORE" ? avg > pick.line : avg < pick.line) ? 10 : 0;
  }
  if (hits10 !== null) return Math.min(100, Math.round((hits10 / 10) * 80 + avgBonus + 10));
  if (!nums.length) return Math.min(100, Math.round(pick.confidence * 0.9));
  const hits5 = hitCount(nums, pick.line, pick.direction);
  return Math.min(100, Math.round((hits5 / nums.length) * 80 + avgBonus + 10));
}

function firstSentence(text: string): string {
  const dashIdx = text.indexOf(" — ");
  if (dashIdx > 20 && dashIdx < 220) return text.slice(0, dashIdx).trim() + ".";
  return text.length > 130 ? text.slice(0, 127).trimEnd() + "…" : text.trim();
}

// ── Component ─────────────────────────────────────────────
export function PickCard({ pick }: { pick: Pick }) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const isMore = pick.direction === "MORE";
  const formScore = computeFormScore(pick);
  const nums = parseFormNums(pick.recentForm);
  const hits5 = nums.length > 0 ? hitCount(nums, pick.line, pick.direction) : null;

  const shortReasoning = pick.shortReasoning ?? firstSentence(pick.aiReasoning);

  const seasonAvgStat = pick.keyStats.find((s) => /season.*avg|avg.*season|avg.*p90|^season avg$/i.test(s.label)) ?? pick.keyStats[0];
  const hitLast10Stat = pick.keyStats.find((s) => /hit.*10|last.*10/i.test(s.label)) ?? pick.keyStats[2];

  return (
    <article
      className={cn(
        "rounded-lg flex flex-col relative overflow-hidden transition-all duration-200",
        pick.isFeatured
          ? "border border-[#55c878]/30"
          : "border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]"
      )}
      style={{ backgroundColor: "#121714" }}
    >
      {pick.isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#55c878]/60" />
      )}

      {/* ── Main content ──────────────────────────────────── */}
      <div className="p-5">

        {/* Player + direction badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <h3
                className="font-display font-bold text-[16px] leading-tight tracking-tight"
                style={{ color: "#f2f5f0" }}
              >
                {pick.player.name}
              </h3>
              {pick.isFeatured && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm font-mono text-[9px] uppercase"
                  style={{ backgroundColor: "rgba(85,200,120,0.10)", border: "1px solid rgba(85,200,120,0.25)", color: "#55c878" }}
                >
                  <Sparkles className="h-2.5 w-2.5" /> Top Pick
                </span>
              )}
            </div>

            <p className="text-[12px]" style={{ color: "#93a196" }}>
              {pick.player.team} · {pick.player.position}
            </p>

            <div className="flex items-center gap-2 mt-1">
              {pick.stage === "final" ? (
                <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#55c878" }}>
                  <CheckCircle className="h-2.5 w-2.5" /> Final
                </span>
              ) : (
                <span className="flex items-center gap-1 font-mono text-[9px]" style={{ color: "#9db2a4" }}>
                  <Clock className="h-2.5 w-2.5" /> Early
                </span>
              )}
              {/* Kickoff time — blue */}
              <span className="font-mono text-[9px]" style={{ color: "rgba(157,178,164,0.6)" }}>
                {formatKickoff(pick.match.kickoff)}
              </span>
              <span className="font-mono text-[9px]" style={{ color: "#515c54" }}>
                {pick.match.homeTeam} vs {pick.match.awayTeam}
              </span>
            </div>
          </div>

          {/* Direction + confidence */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className="font-mono text-[13px] font-bold px-3 py-1 rounded-[3px]"
              style={
                isMore
                  ? { backgroundColor: "rgba(85,200,120,0.12)", color: "#55c878" }
                  : { backgroundColor: "rgba(224,87,79,0.12)", color: "#e0574f" }
              }
            >
              {pick.direction}
            </span>
            <span className="font-mono text-[11px]" style={{ color: isMore ? "#55c878" : "#e0574f" }}>
              {pick.confidence}%
            </span>
          </div>
        </div>

        {/* Stat line + form score */}
        <div
          className="flex items-end justify-between py-3 mb-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] block mb-1" style={{ color: "#76837a" }}>
              {pick.statCategory}
            </span>
            <span
              className="font-mono font-semibold text-[32px] leading-none"
              style={{ color: "#f2f5f0", letterSpacing: "-0.02em" }}
            >
              {pick.line}
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest block mb-0.5" style={{ color: "#515c54" }}>Form</span>
            <span className="font-mono text-[18px] font-bold leading-none" style={{ color: "#f2f5f0" }}>{formScore}</span>
            <span className="font-mono text-[10px]" style={{ color: "#515c54" }}>/100</span>
            {hits5 !== null && (
              <p className="font-mono text-[10px] mt-0.5" style={{ color: "#55c878" }}>{hits5}/{nums.length} last 5</p>
            )}
          </div>
        </div>

        {/* Short reasoning */}
        <p
          className="text-[13px] leading-relaxed mb-3"
          style={{ fontFamily: "var(--font-sans), sans-serif", color: "#93a196" }}
        >
          {shortReasoning}
        </p>

        {/* Expand: full analysis */}
        <button
          onClick={() => setAnalysisOpen(!analysisOpen)}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider mb-2 transition-colors cursor-pointer"
          style={{ color: "#55c878" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#46b167")}
          onMouseLeave={e => (e.currentTarget.style.color = "#55c878")}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", analysisOpen && "rotate-180")} />
          {analysisOpen ? "Hide analysis" : "View full analysis"}
        </button>

        {analysisOpen && (
          <div
            className="rounded-[3px] p-3 mb-2"
            style={{ backgroundColor: "rgba(85,200,120,0.04)", border: "1px solid rgba(85,200,120,0.12)" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3 w-3" style={{ color: "#55c878" }} />
              <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "#55c878" }}>Scout Analysis</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-sans), sans-serif", color: "#93a196" }}>
              {pick.aiReasoning}
            </p>
          </div>
        )}

        {/* Expand: stats */}
        <button
          onClick={() => setStatsOpen(!statsOpen)}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          style={{ color: "#515c54" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#93a196")}
          onMouseLeave={e => (e.currentTarget.style.color = "#515c54")}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", statsOpen && "rotate-180")} />
          {statsOpen ? "Hide stats" : "View stats"}
        </button>

        {statsOpen && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Last 5 */}
            {nums.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#9db2a4" }}>Last 5 matches</p>
                <div className="flex gap-1.5">
                  {nums.map((n, i) => {
                    const hit = pick.direction === "MORE" ? n > pick.line : n < pick.line;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm py-1.5 text-center font-mono text-[12px]"
                        style={{
                          backgroundColor: hit ? "rgba(85,200,120,0.08)" : "rgba(255,255,255,0.02)",
                          border: hit ? "1px solid rgba(85,200,120,0.25)" : "1px solid rgba(255,255,255,0.08)",
                          color: hit ? "#55c878" : "#515c54",
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-1.5">
              {[seasonAvgStat, hitLast10Stat].map((stat) =>
                stat ? (
                  <div
                    key={stat.label}
                    className="rounded-sm px-3 py-2 text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="font-mono text-[9px] mb-0.5 uppercase tracking-widest" style={{ color: "#515c54" }}>{stat.label}</p>
                    <p className="font-mono text-[13px] font-bold" style={{ color: "#f2f5f0" }}>{stat.value}</p>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
