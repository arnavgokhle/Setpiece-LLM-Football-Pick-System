"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

interface DashboardTabsProps {
  pickContent: React.ReactNode;
  lineupContent: React.ReactNode;
}

export function DashboardTabs({ pickContent, lineupContent }: DashboardTabsProps) {
  const [tab, setTab] = useState<"picks" | "lineups">("picks");

  return (
    <>
      <div className="flex items-center gap-1 mb-gutter border-b border-outline-variant/30 font-label-caps text-label-caps">
        <TabButton active={tab === "picks"} onClick={() => setTab("picks")} label="Today's Picks" />
        <TabButton active={tab === "lineups"} onClick={() => setTab("lineups")} label="Power Plays" icon={<Zap className="h-3 w-3" />} />
      </div>
      {tab === "picks" ? pickContent : lineupContent}
    </>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-colors -mb-px cursor-pointer ${
        active ? "border-primary text-primary" : "border-transparent text-secondary hover:text-on-surface"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
