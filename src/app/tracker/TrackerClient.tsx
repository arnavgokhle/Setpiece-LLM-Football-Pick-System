"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Share2, Check, X, Minus, Trash2, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface TrackerPick {
  id: string;
  player_name: string;
  match: string;
  stat_line: string;
  direction: "MORE" | "LESS";
  odds: number | null;
  match_date: string;
  result: "pending" | "win" | "loss" | "push";
  created_at: string;
}

interface FormState {
  player_name: string;
  match: string;
  stat_line: string;
  direction: "MORE" | "LESS";
  odds: string;
  match_date: string;
}

type ResultFilter = "all" | "pending" | "win" | "loss" | "push";

// ── Helpers ──────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const parts = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
}

function computeStats(picks: TrackerPick[]) {
  const won = picks.filter(p => p.result === "win").length;
  const lost = picks.filter(p => p.result === "loss").length;
  const push = picks.filter(p => p.result === "push").length;
  const pending = picks.filter(p => p.result === "pending").length;
  const settled = won + lost + push;
  const hitRate = (won + lost) > 0 ? Math.round((won / (won + lost)) * 100) : 0;
  const units = picks.reduce<number>((sum, p) => {
    if (p.result === "win") return sum + (p.odds != null ? p.odds - 1 : 1);
    if (p.result === "loss") return sum - 1;
    return sum;
  }, 0);
  return { won, lost, push, pending, settled, hitRate, units };
}

// ── Result icon ───────────────────────────────────────────────

function ResultIcon({ result }: { result: TrackerPick["result"] }) {
  if (result === "win") return (
    <div className="w-6 h-6 rounded-[3px] bg-[#55c878]/10 flex items-center justify-center flex-shrink-0">
      <Check className="w-3.5 h-3.5 text-[#55c878]" />
    </div>
  );
  if (result === "loss") return (
    <div className="w-6 h-6 rounded-[3px] bg-[#e0574f]/10 flex items-center justify-center flex-shrink-0">
      <X className="w-3.5 h-3.5 text-[#e0574f]" />
    </div>
  );
  if (result === "push") return (
    <div className="w-6 h-6 rounded-[3px] bg-[#d9a13f]/10 flex items-center justify-center flex-shrink-0">
      <Minus className="w-3.5 h-3.5 text-[#d9a13f]" />
    </div>
  );
  return (
    <div className="w-6 h-6 rounded-[3px] bg-white/[0.04] flex items-center justify-center flex-shrink-0">
      <Minus className="w-3.5 h-3.5 text-[#76837a]" />
    </div>
  );
}

// ── Pick Row ─────────────────────────────────────────────────

function PickRow({
  pick,
  onUpdateResult,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  pick: TrackerPick;
  onUpdateResult: (id: string, result: TrackerPick["result"]) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const isMore = pick.direction === "MORE";

  const selectClass = cn(
    "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-1.5 rounded-[3px] border cursor-pointer outline-none transition-colors",
    pick.result === "win"
      ? "border-[#55c878]/30 text-[#55c878]"
      : pick.result === "loss"
      ? "border-[#e0574f]/30 text-[#e0574f]"
      : pick.result === "push"
      ? "border-[#d9a13f]/30 text-[#d9a13f]"
      : "border-white/[0.1] text-[#76837a]"
  );

  const selectBg =
    pick.result === "win"   ? "rgba(85,200,120,0.08)"  :
    pick.result === "loss"  ? "rgba(224,87,79,0.08)"   :
    pick.result === "push"  ? "rgba(217,161,63,0.08)"  :
    "rgba(255,255,255,0.03)";

  return (
    <div className={cn(
      "px-5 py-3.5 hover:bg-white/[0.015] transition-colors duration-100",
      isDeleting && "opacity-40 pointer-events-none"
    )}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5 flex-shrink-0">
          <ResultIcon result={pick.result} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono text-[13px] text-[#dfe6df]">{pick.player_name}</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: isMore ? "#55c878" : "#e0574f" }}
                >
                  {pick.direction}
                </span>
                <span className="font-mono text-[11px] text-[#a7b3a9]">{pick.stat_line}</span>
                <span className="font-mono text-[10px] text-[#76837a]">· {pick.match}</span>
                <span className="font-mono text-[10px] text-[#76837a]">
                  ·{pick.odds != null ? ` ${pick.odds.toFixed(2)} ·` : ""} {formatDate(pick.match_date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isUpdating ? (
                <span className="font-mono text-[10px] text-[#76837a] px-2">...</span>
              ) : (
                <select
                  value={pick.result}
                  onChange={e => onUpdateResult(pick.id, e.target.value as TrackerPick["result"])}
                  className={selectClass}
                  style={{ backgroundColor: selectBg }}
                >
                  <option value="pending">Pending</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="push">Push</option>
                </select>
              )}
              <button
                onClick={() => onDelete(pick.id)}
                disabled={isDeleting}
                className="w-7 h-7 flex items-center justify-center text-[#76837a] hover:text-[#e0574f] transition-colors duration-100 disabled:opacity-30 flex-shrink-0"
                title="Delete pick"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.1em] block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.1] rounded-[3px] px-3 py-2.5 font-mono text-[13px] text-[#dfe6df] placeholder:text-[#76837a] outline-none focus:border-[#55c878]/40 transition-colors";

// ── Add Pick Modal ────────────────────────────────────────────

function AddPickModal({
  form,
  setForm,
  onSubmit,
  onClose,
  submitting,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const isValid =
    form.player_name.trim() &&
    form.match.trim() &&
    form.stat_line.trim() &&
    form.match_date;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#101411] border border-white/[0.1] rounded-[4px] w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <span className="font-mono text-[11px] text-[#55c878] uppercase tracking-[0.15em]">
            Add Pick
          </span>
          <button
            onClick={onClose}
            className="text-[#76837a] hover:text-[#a7b3a9] transition-colors p-1 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <Field label="Player Name">
            <input
              type="text"
              placeholder="e.g. Rodrigo De Paul"
              value={form.player_name}
              onChange={e => setForm(f => ({ ...f, player_name: e.target.value }))}
              className={inputClass}
              autoFocus
            />
          </Field>

          <Field label="Match">
            <input
              type="text"
              placeholder="e.g. Argentina vs Brazil"
              value={form.match}
              onChange={e => setForm(f => ({ ...f, match: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <Field label="Stat Line">
            <input
              type="text"
              placeholder="e.g. 1.5 shots on target"
              value={form.stat_line}
              onChange={e => setForm(f => ({ ...f, stat_line: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <Field label="Direction">
            <div className="grid grid-cols-2 gap-2">
              {(["MORE", "LESS"] as const).map(dir => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, direction: dir }))}
                  className={cn(
                    "py-2.5 rounded-[3px] font-mono text-[11px] font-bold uppercase tracking-[0.1em] border transition-colors duration-100 min-h-[44px]",
                    form.direction === dir
                      ? dir === "MORE"
                        ? "bg-[#55c878]/15 border-[#55c878]/40 text-[#55c878]"
                        : "bg-[#e0574f]/15 border-[#e0574f]/40 text-[#e0574f]"
                      : "bg-white/[0.03] border-white/[0.08] text-[#76837a] hover:border-white/[0.15]"
                  )}
                >
                  {dir}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Odds (optional)">
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 1.91"
                value={form.odds}
                onChange={e => setForm(f => ({ ...f, odds: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Match Date">
              <input
                type="date"
                value={form.match_date}
                onChange={e => setForm(f => ({ ...f, match_date: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[#76837a] border border-white/[0.1] rounded-[3px] hover:border-white/[0.2] hover:text-[#a7b3a9] transition-colors duration-100 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!isValid || submitting}
            className="flex-1 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] font-bold bg-[#55c878] text-[#101411] rounded-[3px] hover:bg-[#46b167] transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {submitting ? "Adding..." : "Add Pick"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function TrackerClient() {
  const [picks, setPicks] = useState<TrackerPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ResultFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    player_name: "",
    match: "",
    stat_line: "",
    direction: "MORE",
    odds: "",
    match_date: todayISO(),
  });

  const fetchPicks = useCallback(async () => {
    try {
      const res = await fetch("/api/tracker");
      if (!res.ok) return;
      const data = await res.json();
      setPicks(data.picks ?? []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModalOpen]);

  const addPick = async () => {
    if (!form.player_name.trim() || !form.match.trim() || !form.stat_line.trim() || !form.match_date) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_name: form.player_name,
          match: form.match,
          stat_line: form.stat_line,
          direction: form.direction,
          odds: form.odds ? parseFloat(form.odds) : null,
          match_date: form.match_date,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setPicks(prev => [data.pick, ...prev]);
      setIsModalOpen(false);
      setForm({ player_name: "", match: "", stat_line: "", direction: "MORE", odds: "", match_date: todayISO() });
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  const updateResult = async (id: string, result: TrackerPick["result"]) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/tracker/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      setPicks(prev => prev.map(p => p.id === id ? { ...p, result } : p));
    } catch {
      // fail silently
    } finally {
      setUpdatingId(null);
    }
  };

  const deletePick = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tracker/${id}`, { method: "DELETE" });
      if (res.ok) setPicks(prev => prev.filter(p => p.id !== id));
    } catch {
      // fail silently
    } finally {
      setDeletingId(null);
    }
  };

  const share = async () => {
    const { won, settled } = computeStats(picks);
    const text = `I'm ${won}/${settled} following Setpiece picks this season. setpiecepicks.com/tracker`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { won, lost, push, pending, hitRate, units } = computeStats(picks);

  const filteredPicks =
    filter === "all" ? picks : picks.filter(p => p.result === filter);

  const filterCounts: Record<ResultFilter, number> = {
    all: picks.length,
    pending,
    win: won,
    loss: lost,
    push,
  };

  const filterLabels: Record<ResultFilter, string> = {
    all: "All",
    pending: "Pending",
    win: "Won",
    loss: "Lost",
    push: "Push",
  };

  const unitsDisplay =
    units >= 0 ? `+${units.toFixed(1)}u` : `${units.toFixed(1)}u`;
  const unitsColor = units >= 0 ? "#55c878" : "#e0574f";

  return (
    <>
      {/* ── Header ───────────────────────────────────────── */}
      <div className="mb-10 pt-4">
        <h1
          className="text-[32px] md:text-[40px] font-bold text-[#dfe6df] tracking-tight mb-2 text-balance"
          style={{ fontFamily: "var(--font-sans), sans-serif", letterSpacing: "-0.025em" }}
        >
          Your season record.
        </h1>
        <p
          className="text-[15px] text-[#76837a]"
          style={{ fontFamily: "var(--font-sans), sans-serif" }}
        >
          Track your picks following Setpiece recommendations.
        </p>
      </div>

      {/* ── KPI row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-[4px] overflow-hidden mb-8">
        {[
          { label: "Hit Rate",      value: `${hitRate}%`,       color: "#55c878",  accent: "#55c878" },
          { label: "Units P/L",     value: unitsDisplay,         color: unitsColor, accent: unitsColor },
          { label: "Won",           value: String(won),          color: "#55c878",  accent: "#55c878" },
          { label: "Tracked",       value: String(picks.length), color: "#a7b3a9",  accent: "transparent" },
        ].map(({ label, value, color, accent }) => (
          <div key={label} className="bg-[#101411] px-5 py-5 relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ backgroundColor: accent, opacity: 0.4 }}
            />
            <div
              className="font-mono font-bold leading-none mb-2"
              style={{ fontSize: "clamp(24px, 4vw, 36px)", color, letterSpacing: "-0.03em" }}
            >
              {value}
            </div>
            <div className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em]">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-[#101411] border border-white/[0.06] rounded-[4px] p-1 overflow-x-auto">
          {(["all", "pending", "win", "loss", "push"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.08em] px-3 py-2 rounded-[2px] transition-colors duration-100 whitespace-nowrap min-h-[36px]",
                filter === f
                  ? "bg-[#55c878]/10 text-[#55c878] border border-[#55c878]/20"
                  : "text-[#76837a] hover:text-[#a7b3a9]"
              )}
            >
              {filterLabels[f]} ({filterCounts[f]})
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] px-4 py-2.5 border border-white/[0.1] text-[#76837a] hover:text-[#a7b3a9] hover:border-white/[0.2] rounded-[4px] transition-colors duration-100 min-h-[44px]"
          >
            {copied
              ? <CheckCheck className="w-3.5 h-3.5 text-[#55c878]" />
              : <Share2 className="w-3.5 h-3.5" />
            }
            <span className={copied ? "text-[#55c878]" : undefined}>
              {copied ? "Copied!" : "Share"}
            </span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] font-bold px-4 py-2.5 bg-[#55c878] text-[#101411] hover:bg-[#46b167] rounded-[4px] transition-colors duration-100 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pick
          </button>
        </div>
      </div>

      {/* ── Picks list ───────────────────────────────────── */}
      {loading ? (
        <div className="border border-white/[0.06] rounded-[4px] overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-white/[0.04] bg-[#101411]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/[0.05] rounded-[3px] animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 bg-white/[0.06] rounded w-40 mb-2 animate-pulse" />
                  <div className="h-2.5 bg-white/[0.04] rounded w-64 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPicks.length === 0 ? (
        <div className="border border-white/[0.07] rounded-[4px] bg-[#101411] py-16 px-10 text-center">
          {filter === "all" ? (
            <>
              <p
                className="text-[16px] text-[#dfe6df] font-semibold mb-2"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                No picks tracked yet.
              </p>
              <p
                className="text-[14px] text-[#76837a] mb-6 max-w-xs mx-auto"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                Add a Setpiece pick and track whether it lands.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#55c878] uppercase tracking-[0.1em] hover:text-[#46b167] transition-colors duration-100 border border-[#55c878]/20 px-4 py-2.5 rounded-[3px] hover:border-[#55c878]/40"
              >
                + Add your first pick
              </button>
            </>
          ) : (
            <p
              className="text-[14px] text-[#76837a]"
              style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
              No {filterLabels[filter].toLowerCase()} picks yet.
            </p>
          )}
        </div>
      ) : (
        <div className="border border-white/[0.06] rounded-[4px] overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {filteredPicks.map(pick => (
              <PickRow
                key={pick.id}
                pick={pick}
                onUpdateResult={updateResult}
                onDelete={deletePick}
                isUpdating={updatingId === pick.id}
                isDeleting={deletingId === pick.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ───────────────────────────────────── */}
      <p className="font-mono text-[10px] text-[#76837a] text-center mt-10 uppercase tracking-widest">
        Personal tracking only · Not financial advice · Track responsibly
      </p>

      {/* ── Modal ────────────────────────────────────────── */}
      {isModalOpen && (
        <AddPickModal
          form={form}
          setForm={setForm}
          onSubmit={addPick}
          onClose={() => setIsModalOpen(false)}
          submitting={submitting}
        />
      )}
    </>
  );
}
