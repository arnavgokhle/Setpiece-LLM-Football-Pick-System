"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";

export function AdminMarkResult({
  pickId,
  withActual = false,
}: {
  pickId: string;
  /** Review queue: capture the real figure so it feeds rolling form. */
  withActual?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [actual, setActual] = useState("");

  const mark = async (result: "won" | "lost" | "void") => {
    setLoading(result);
    try {
      await fetch("/api/admin/mark-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickId, result, actual: actual.trim() || undefined }),
      });
      setDone(result);
      router.refresh();
    } catch {
      // silently fail — the row is still pending
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <span className="text-xs text-ink-faint rounded-full border border-surface-border px-2 py-1">
        Marked {done}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
      {withActual && (
        <input
          type="text"
          inputMode="decimal"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          placeholder="Actual"
          aria-label="Actual figure"
          className="h-11 w-24 rounded-lg border border-surface-border bg-surface-2 px-3 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-accent/50 focus:outline-none"
        />
      )}
      <ActionButton
        label="Won"
        onClick={() => mark("won")}
        isLoading={loading === "won"}
        colorClass="text-accent border-accent/30 hover:bg-accent/10"
        Icon={CheckCircle}
      />
      <ActionButton
        label="Lost"
        onClick={() => mark("lost")}
        isLoading={loading === "lost"}
        colorClass="text-red-400 border-red-500/30 hover:bg-red-500/10"
        Icon={XCircle}
      />
      <ActionButton
        label="Void"
        onClick={() => mark("void")}
        isLoading={loading === "void"}
        colorClass="text-ink-muted border-surface-border hover:bg-surface-2"
        Icon={MinusCircle}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  isLoading,
  colorClass,
  Icon,
}: {
  label: string;
  onClick: () => void;
  isLoading: boolean;
  colorClass: string;
  Icon: React.ElementType;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`flex h-11 min-w-11 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${colorClass}`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
