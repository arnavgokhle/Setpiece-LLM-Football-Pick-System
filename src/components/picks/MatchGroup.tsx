"use client";

import { useState } from "react";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { PickCard } from "./PickCard";
import { LockedPickCard } from "./LockedPickCard";
import { MatchFollowButton } from "./MatchFollowButton";
import { formatKickoff, formatDate } from "@/lib/utils";
import type { Pick, Match } from "@/types";
import { parseFixtureId } from "@/lib/fixture-id";

interface MatchGroupProps {
  match: Match;
  picks: Pick[];
  followedFixtureIds?: number[];
}

export function MatchGroup({ match, picks, followedFixtureIds = [] }: MatchGroupProps) {
  const [open, setOpen] = useState(true);

  const fixtureId = parseFixtureId(match.id);
  const isFollowing = followedFixtureIds.includes(fixtureId);
  const hasFinal = picks.some((p) => p.stage === "final");
  const hasEarly = picks.some((p) => p.stage === "early");

  const sortedPicks = [...picks].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.confidence - a.confidence;
  });

  return (
    <div className="mb-6">
      {/* Clickable match header / dropdown trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)}
        className="w-full cursor-pointer select-none"
        aria-expanded={open}
        style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 rounded-lg transition-colors"
          style={{
            backgroundColor: open ? "#171d18" : "#0e120f",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        >
          {/* Left: competition + teams + time */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "#76837a" }}>
                {match.competition}
              </span>
              {hasFinal && (
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded-[3px] uppercase tracking-wide"
                  style={{ backgroundColor: "rgba(85,200,120,0.08)", border: "1px solid rgba(85,200,120,0.2)", color: "#55c878" }}
                >
                  Final ✓
                </span>
              )}
              {!hasFinal && hasEarly && (
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded-[3px] uppercase tracking-wide"
                  style={{ backgroundColor: "rgba(217,161,63,0.08)", border: "1px solid rgba(217,161,63,0.2)", color: "#d9a13f" }}
                >
                  Early
                </span>
              )}
            </div>
            <p className="font-display text-[18px] md:text-[21px] font-bold tracking-tight leading-tight mt-0.5" style={{ color: "#f2f5f0" }}>
              {match.homeTeam}{" "}
              <span className="font-semibold" style={{ color: "#515c54" }}>vs</span>{" "}
              {match.awayTeam}
            </p>
            <div className="flex items-center gap-3 font-mono text-[10.5px] mt-1" style={{ color: "#68756c" }}>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(match.kickoff)} · {formatKickoff(match.kickoff)}
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {match.venue}
              </span>
            </div>
          </div>

          {/* Right: picks count badge + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {fixtureId > 0 && (
              <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                <MatchFollowButton fixtureId={fixtureId} initialFollowing={isFollowing} />
              </div>
            )}
            <div
              className="flex items-center px-2.5 py-1 rounded-[3px]"
              style={{ backgroundColor: "rgba(85,200,120,0.1)" }}
            >
              <span className="font-mono text-[10.5px] font-medium" style={{ color: "#55c878" }}>
                {picks.length} pick{picks.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              className="h-4 w-4 flex-shrink-0 transition-transform duration-200"
              style={{ color: "#4d5850", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </div>

      {/* Pick cards — collapsible */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter mt-3">
          {sortedPicks.map((pick) =>
            pick.isLocked ? (
              <LockedPickCard key={pick.id} pick={pick} />
            ) : (
              <PickCard key={pick.id} pick={pick} />
            )
          )}
        </div>
      )}
    </div>
  );
}
