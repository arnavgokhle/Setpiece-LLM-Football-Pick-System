"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function SendMatchdayEmailButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<string>("");

  async function handleSend() {
    if (!confirm("Send today's picks email to all confirmed users?")) return;
    setStatus("loading");
    setResult("");
    try {
      const res = await fetch("/api/email/matchday", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setResult(json.error ?? "Failed");
      } else {
        setStatus("success");
        setResult(`Sent to ${json.sent} of ${json.total} users`);
      }
    } catch {
      setStatus("error");
      setResult("Network error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSend}
        disabled={status === "loading"}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border text-sm font-medium transition-colors duration-150 disabled:opacity-50"
        style={{
          backgroundColor: status === "success" ? "rgba(85,200,120,0.1)" : "rgba(85,200,120,0.08)",
          borderColor: status === "success" ? "rgba(85,200,120,0.4)" : "rgba(85,200,120,0.2)",
          color: "#55c878",
        }}
      >
        <Send className="w-3.5 h-3.5" />
        {status === "loading" ? "Sending…" : "Send matchday picks email"}
      </button>
      {result && (
        <span className={`text-xs font-mono ${status === "success" ? "text-green-400" : "text-red-400"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
