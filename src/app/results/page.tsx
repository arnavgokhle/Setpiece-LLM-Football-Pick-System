import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCompletedPicksFromDB, getTrackRecord } from "@/lib/supabase-picks";
import { formatKickoff } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";
import type { Pick } from "@/types";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const [allPicks, trackRecord] = await Promise.all([
    getCompletedPicksFromDB(),
    getTrackRecord(),
  ]);

  const resultOrder: Record<string, number> = { won: 0, lost: 1, void: 2 };
  const picks = [...allPicks].sort((a, b) => {
    const ra = resultOrder[a.result ?? "void"] ?? 2;
    const rb = resultOrder[b.result ?? "void"] ?? 2;
    if (ra !== rb) return ra - rb;
    return new Date(b.match.kickoff).getTime() - new Date(a.match.kickoff).getTime();
  });

  return (
    <div className="min-h-screen bg-[#0b0e0c] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">

          {/* Header */}
          <div className="mb-10 pt-4">
            <span className="font-mono text-[11px] text-[#55c878] uppercase tracking-[0.1em] block mb-3">
              Track Record
            </span>
            <h1 className="font-display text-[34px] md:text-[44px] font-extrabold text-[#f2f5f0] tracking-tight mb-2">
              Every pick. Every result.
            </h1>
            <p className="text-[14px] text-[#93a196]">
              Scout&apos;s full call history. No cherry-picking.
            </p>
          </div>

          {/* KPI row */}
          {trackRecord.total > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-[4px] overflow-hidden mb-10">
              {[
                { label: "Hit Rate",     value: `${trackRecord.hitRate}%`, color: "#55c878" },
                { label: "Total Picks",  value: String(trackRecord.total), color: "#f2f5f0" },
                { label: "Won",          value: String(trackRecord.won),   color: "#55c878" },
                { label: "Lost",         value: String(trackRecord.lost),  color: "#e0574f" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#121714] px-6 py-5 text-center">
                  <div
                    className="font-display text-[40px] md:text-[56px] font-extrabold leading-none mb-2"
                    style={{ color, letterSpacing: "-0.02em" }}
                  >
                    {value}
                  </div>
                  <div className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.14em]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-white/[0.07] rounded-[4px] bg-[#121714] p-10 text-center mb-10">
              <p className="font-mono text-[12px] text-[#76837a] uppercase tracking-widest">
                No completed picks yet. Check back after matches finish.
              </p>
            </div>
          )}

          {/* Picks table */}
          {picks.length > 0 && (
            <div>
              <h2 className="font-display text-[17px] font-bold tracking-tight text-[#f2f5f0] mb-4">
                All Picks
              </h2>
              <div className="border border-white/[0.06] rounded-[4px] overflow-hidden">
                {/* Column headers */}
                <div className="hidden md:grid grid-cols-[40px_1fr_1fr_120px_64px] gap-0 px-5 py-2.5 border-b border-white/[0.06] bg-[#121714]">
                  {["", "Player", "Pick", "Match", "Conf"].map((h) => (
                    <span key={h} className="font-mono text-[9px] text-[#76837a] uppercase tracking-[0.15em]">{h}</span>
                  ))}
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {picks.map((pick) => (
                    <PickRow key={pick.id} pick={pick} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="font-mono text-[10px] text-[#76837a] text-center mt-10 uppercase tracking-widest">
            Past performance is not a guarantee of future results ·
            Picks are AI-generated analysis, not financial advice
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function PickRow({ pick }: { pick: Pick }) {
  const isMore = pick.direction === "MORE";
  const result = pick.result ?? "pending";

  const ResultIcon = () => {
    if (result === "won")
      return (
        <div className="w-6 h-6 rounded-[3px] bg-[#55c878]/10 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-[#55c878]" />
        </div>
      );
    if (result === "lost")
      return (
        <div className="w-6 h-6 rounded-[3px] bg-[#e0574f]/10 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-[#e0574f]" />
        </div>
      );
    return (
      <div className="w-6 h-6 rounded-[3px] bg-white/[0.04] flex items-center justify-center">
        <Minus className="w-3.5 h-3.5 text-[#76837a]" />
      </div>
    );
  };

  return (
    <div className="flex md:grid md:grid-cols-[40px_1fr_1fr_120px_64px] gap-3 md:gap-0 items-start md:items-center px-5 py-3.5 hover:bg-white/[0.015] transition-colors duration-100">
      <div className="flex-shrink-0 pt-0.5 md:pt-0">
        <ResultIcon />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-mono text-[13px] text-[#f2f5f0]">{pick.player.name}</span>
      </div>
      <div>
        <span
          className="font-mono text-[11px] font-bold mr-2"
          style={{ color: isMore ? "#55c878" : "#e0574f" }}
        >
          {isMore ? "MORE" : "LESS"}
        </span>
        <span className="font-mono text-[11px] text-[#a7b3a9]">
          {pick.line} {pick.statCategory}
        </span>
      </div>
      <div className="hidden md:block">
        <span className="font-mono text-[11px] text-[#76837a]">
          {pick.match.homeTeam} vs {pick.match.awayTeam}
        </span>
        <span className="font-mono text-[10px] text-[#76837a] block">
          {formatKickoff(pick.match.kickoff)}
        </span>
      </div>
      <div className="hidden md:block text-right">
        <span className="font-mono text-[12px] text-[#76837a]">{pick.confidence}%</span>
      </div>
    </div>
  );
}
