"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Check, ArrowRight } from "lucide-react";

const WC_FEATURES = [
  "All picks, every Premier League match",
  "Full AI reasoning on every pick",
  "Scout chatbot: ask anything",
  "Power Play lineups",
  "Results track record",
  "Early + Final pick updates",
];

function WaitlistForm() {
  const [email, setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setLoading(true);
    try {
      await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "pricing_edge_waitlist" }),
      });
      setSubmitted(true);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 font-mono text-[12px] text-[#55c878] py-2">
        <Check className="w-4 h-4" />
        You&apos;re on the list. We&apos;ll email you before September 21.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mt-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-[3px] px-3 py-2.5 font-mono text-[12px] text-[#f2f5f0] placeholder:text-[#76837a] outline-none focus:border-[#55c878]/30 transition-colors min-h-[44px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide bg-white/[0.06] border border-white/[0.1] text-[#a7b3a9] hover:text-[#f2f5f0] hover:border-white/[0.2] rounded-[3px] transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px]"
      >
        {loading ? "..." : "Notify me"}
      </button>
    </form>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e0c] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16">

          {/* Header */}
          <div className="mb-12 pt-4">
            <h1 className="font-display text-[34px] md:text-[46px] font-extrabold text-[#f2f5f0] tracking-tight mb-2 text-balance">
              Free for the opening month.
            </h1>
            <p className="text-[14px] text-[#93a196]">
              Full access August 21 to September 20. No card required. Setpiece Edge launches September 21.
            </p>
          </div>

          {/* Section 1: WC Free — most prominent */}
          <div
            className="rounded-[4px] p-7 md:p-8 mb-6 relative overflow-hidden"
            style={{
              border: "1px solid rgba(85,200,120,0.3)",
              backgroundColor: "#121714",
              boxShadow: "0 0 40px rgba(85,200,120,0.04)",
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, rgba(85,200,120,0) 0%, rgba(85,200,120,0.5) 40%, rgba(85,200,120,0) 100%)" }} />

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] text-[#55c878] uppercase tracking-widest">Premier League 2026-27</span>
                  <span
                    className="font-mono text-[9px] px-2 py-0.5 rounded-[2px] uppercase tracking-widest"
                    style={{ backgroundColor: "rgba(85,200,120,0.1)", color: "#55c878" }}
                  >
                    Free
                  </span>
                </div>
                <div className="font-display font-extrabold text-[#f2f5f0] leading-none mb-1.5 text-[46px] tracking-tight">
                  £0
                </div>
                <p className="text-[13px] text-[#76837a] mb-6">
                  August 21 to September 20 · No card required
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {WC_FEATURES.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[14px] text-[#f2f5f0]">
                      <Check className="w-3.5 h-3.5 text-[#55c878] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center justify-center gap-2 h-[46px] px-6 bg-[#55c878] text-[#08110b] font-semibold text-[14px] rounded-[4px] hover:bg-[#46b167] active:scale-[0.98] transition-all duration-150"
                >
                  Sign up free
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="hidden md:block text-[12px] text-[#76837a] text-right">
                <div className="font-display text-[#f2f5f0] font-bold text-[20px] mb-1 tracking-tight">9 days</div>
                until kick-off
              </div>
            </div>
          </div>

          {/* Section 2: Coming September 21 */}
          <div
            className="rounded-[4px] p-7 md:p-8 mb-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "#121714" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="font-mono text-[10px] text-[#d9a13f] uppercase tracking-widest mb-2">
                  Coming September 21
                </div>
                <h2 className="font-display text-[24px] font-bold tracking-tight text-[#f2f5f0] mb-1">
                  Setpiece Edge
                </h2>
                <p className="text-[13px] text-[#93a196] mb-6">
                  Full season coverage. Premier League, La Liga, UCL, and more.
                </p>

                <div
                  className="rounded-[3px] border border-white/[0.06] p-4 mb-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center justify-between font-mono text-[12px] mb-2.5">
                    <span className="text-[#a7b3a9]">UK / US</span>
                    <span className="text-[#f2f5f0] font-bold">£14.99 / month</span>
                  </div>
                  <div className="h-px bg-white/[0.06] mb-2.5" />
                  <div className="flex items-center justify-between font-mono text-[12px]">
                    <span className="text-[#a7b3a9]">India</span>
                    <span className="text-[#f2f5f0] font-bold">₹299 / month via UPI</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-mono text-[12px] text-[#a7b3a9] mb-1">
                  Join the waitlist
                </p>
                <p className="font-mono text-[11px] text-[#76837a] mb-1">
                  Be first to know when paid access launches on September 21.
                </p>
                <WaitlistForm />
              </div>
            </div>
          </div>

          <p className="font-mono text-[10px] text-[#76837a] text-center mt-6 uppercase tracking-widest">
            No payment required until September 21 · Full Premier League access is free
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
