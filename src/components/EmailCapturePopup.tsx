"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

const STORAGE_KEY = "sp_popup_v1";

export function EmailCapturePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "website_popup" }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => setVisible(false), 3500);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(5,8,15,0.85)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "fadeIn 0.35s ease-out",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div
        className="relative w-full max-w-[420px] rounded-lg border border-white/[0.09] overflow-hidden"
        style={{
          backgroundColor: "#151a16",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(85,200,120,0.06)",
          animation: "slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Green top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#55c878]/60 to-transparent" />

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-[#76837a] hover:text-[#a7b3a9] transition-colors rounded-sm hover:bg-white/[0.05]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-8 pt-8 pb-7">
          {done ? (
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "rgba(85,200,120,0.08)", border: "1px solid rgba(85,200,120,0.2)" }}
              >
                <Check className="w-7 h-7 text-[#55c878]" strokeWidth={2.5} />
              </div>
              <h2 className="font-display text-[24px] font-bold tracking-tight text-[#f2f5f0] mb-3">
                You&apos;re in.
              </h2>
              <p
                className="text-[14px] text-[#76837a] leading-relaxed"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                Opening day picks land in your inbox August 21.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-7">
                <h2 className="font-display text-[32px] font-extrabold text-[#f2f5f0] leading-[1.02] tracking-tight mb-4 text-balance">
                  Premier League picks<br />start August 21.
                </h2>
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ fontFamily: "var(--font-sans), sans-serif", color: "#76837a" }}
                >
                  Get Scout&apos;s opening day picks in your inbox, free.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={submit} className="space-y-3">
                <div
                  className="rounded-[3px] border transition-colors duration-150"
                  style={{ backgroundColor: "#171d18", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    className="w-full bg-transparent px-4 py-3 font-mono text-[13px] text-[#dfe6df] placeholder:text-[#76837a] outline-none"
                    style={{ caretColor: "#55c878" }}
                  />
                </div>

                {error && (
                  <p className="font-mono text-[11px] text-[#e0574f] px-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-[14px] font-semibold rounded-[4px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[46px] active:scale-[0.99]"
                  style={{ backgroundColor: "#55c878", color: "#08110b" }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#46b167"; }}
                  onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#55c878"; }}
                >
                  {submitting ? "Sending..." : "Get Early Access"}
                </button>
              </form>

              <p className="text-[11.5px] text-[#76837a] text-center mt-4">
                No spam · Unsubscribe anytime
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
