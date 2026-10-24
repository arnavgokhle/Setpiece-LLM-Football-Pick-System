"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function RegenerateButton({ secret }: { secret: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/picks/generate", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setState("done");
      setMessage(`Done — ${data.generated} picks generated, ${data.skipped} skipped`);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-1 px-4 py-2 text-sm font-medium text-ink hover:border-accent/50 hover:text-accent disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
        {state === "loading" ? "Generating..." : "Regenerate Picks"}
      </button>
      {message && (
        <span
          className={`text-xs ${state === "error" ? "text-red-400" : "text-accent"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
