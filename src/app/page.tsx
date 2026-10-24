"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Lock, ArrowRight, Check, BarChart2, Clock, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SEASON_START_ISO, seasonBadge } from "@/lib/season";

// ─── Data ──────────────────────────────────────────────────────
const LIVE_PICKS = [
  { player: "M. Salah",      team: "LIV", comp: "Premier League", stat: "Total Shots",      line: 3.5,  dir: "MORE", conf: 89, stage: "FINAL", locked: false },
  { player: "D. Rice",       team: "ARS", comp: "Premier League", stat: "Passes Attempted", line: 70.5, dir: "MORE", conf: 76, stage: "FINAL", locked: false },
  { player: "E. Haaland",    team: "MCI", comp: "Premier League", stat: "Shots on Target",  line: 2.5,  dir: "MORE", conf: 91, stage: "FINAL", locked: true  },
  { player: "Match",         team: "NEW", comp: "Premier League", stat: "Total Match Corners", line: 9.5, dir: "MORE", conf: 81, stage: "EARLY", locked: true  },
];

// ─── Motion config ──────────────────────────────────────────────
const easing = [0.16, 1, 0.3, 1] as const;
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.7, ease: easing, delay },
});
const scrollReveal = (delay = 0) => ({
  initial:    { opacity: 0, y: 24 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true, amount: 0.15 },
  transition: { duration: 0.7, ease: easing, delay },
});

// ─── Signature: chalk set-piece diagram ────────────────────────
// A corner-kick trajectory drawn like a manager's tactics board.
function SetpieceDiagram() {
  return (
    <svg
      className="pointer-events-none absolute inset-y-0 right-0 hidden lg:block h-full w-[58%]"
      viewBox="0 0 700 800"
      fill="none"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden
    >
      {/* Pitch markings — penalty box, six-yard box, D-arc, penalty spot */}
      <g stroke="rgba(242,245,240,0.055)" strokeWidth="1.5">
        <rect x="330" y="120" width="480" height="560" />
        <rect x="470" y="260" width="340" height="280" />
        <path d="M330 310 A 120 120 0 0 0 330 490" />
        <circle cx="404" cy="400" r="2.5" fill="rgba(242,245,240,0.10)" stroke="none" />
      </g>

      {/* Corner-kick trajectory — draws itself on load */}
      <path
        d="M690 770 C 480 700, 380 560, 420 400"
        stroke="rgba(85,200,120,0.42)"
        strokeWidth="1.75"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1}
        className="chalk-draw"
      />
      {/* Ball origin + target marker */}
      <circle cx="690" cy="770" r="3.5" fill="rgba(85,200,120,0.55)" />
      <g stroke="rgba(85,200,120,0.5)" strokeWidth="1.75" strokeLinecap="round">
        <path d="M413 393 L 427 407" />
        <path d="M427 393 L 413 407" />
      </g>

      {/* Defending markers — near-post line under the arc's landing zone */}
      <g fill="none" stroke="rgba(242,245,240,0.14)" strokeWidth="1.5">
        <circle cx="500" cy="700" r="7" />
        <circle cx="585" cy="648" r="7" />
        <circle cx="620" cy="724" r="7" />
      </g>
    </svg>
  );
}

// ─── Season badge + updates signup ──────────────────────────────
// Premier League 2026-27 opens Arsenal v Coventry, 21 Aug 2026 19:00 UTC.
function SeasonBadge() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  // Rendered only after mount so the countdown can't mismatch between
  // the server render and the client clock.
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(Math.ceil((new Date(SEASON_START_ISO).getTime() - Date.now()) / 86400000));
  }, []);

  const label = days === null ? "Premier League 2026-27" : seasonBadge();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setState("error"); return; }
    setState("sending");
    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "hero_pl_updates" }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mb-7 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-block font-mono text-[11px] tracking-[0.08em] text-[#93a196] border border-white/10 rounded-full px-3.5 py-1.5">
          {label}
        </span>
        <p className="font-mono text-[12.5px] font-medium text-[#55c878]">
          Free for opening month
        </p>
      </div>

      {state === "done" ? (
        <p className="flex items-center gap-2 font-mono text-[12.5px] text-[#55c878]">
          <Check size={14} strokeWidth={2.5} aria-hidden />
          You&apos;re on the list. Matchday picks land in your inbox.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-start gap-2">
          <label htmlFor="pl-updates-email" className="sr-only">
            Email address for matchday pick alerts
          </label>
          <input
            id="pl-updates-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }}
            placeholder="you@email.com"
            autoComplete="email"
            aria-invalid={state === "error"}
            aria-describedby={state === "error" ? "pl-updates-error" : undefined}
            className="h-11 w-full sm:w-[236px] rounded-[4px] bg-[#121714] border border-white/[0.09] px-3
                       text-[15px] text-[#f2f5f0] placeholder:text-[#76837a]
                       focus:outline-none focus:border-[#55c878]/60"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="h-11 rounded-[4px] bg-[#55c878] px-4 text-[14px] font-semibold text-[#08110b]
                       transition-colors hover:bg-[#46b167] active:scale-[0.99] disabled:opacity-60"
          >
            {state === "sending" ? "Sending..." : "Get matchday picks"}
          </button>
          {state === "error" && (
            <p id="pl-updates-error" role="alert" className="w-full font-mono text-[12px] text-[#e0574f]">
              Enter a valid email address.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────
function Hero() {
  const reduce = useReducedMotion();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  const M = reduce ? "div" : motion.div;

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center px-5 md:px-10 lg:px-16 pt-28 pb-16 bg-[#0b0e0c] overflow-hidden">
      <SetpieceDiagram />
      {/* Edge vignette for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(130% 100% at 35% 30%, transparent 45%, rgba(0,0,0,0.42) 100%)" }}
        aria-hidden
      />

      <div className="relative max-w-[1280px] mx-auto w-full">
        {/* Season badge + matchday updates signup */}
        <M {...(!reduce ? fadeUp(0.05) : {})}>
          <SeasonBadge />
        </M>

        {/* Full-width display headline */}
        <M {...(!reduce ? fadeUp(0.15) : {})}>
          <h1
            className="font-display font-extrabold uppercase text-[#f2f5f0] text-balance"
            style={{
              fontSize: "clamp(42px, 6.6vw, 96px)",
              lineHeight: 0.94,
              letterSpacing: "-0.025em",
              marginBottom: "3rem",
            }}
          >
            The analytical edge for{" "}
            <span className="text-[#55c878]">fantasy football.</span>
          </h1>
        </M>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_500px] gap-12 lg:gap-24 items-start">

          {/* Left: supporting copy + CTA + proof */}
          <div className="max-w-[480px]">
            <M {...(!reduce ? fadeUp(0.25) : {})}>
              <div className="mb-9 space-y-1.5">
                <p className="text-[17px] leading-relaxed text-[#c8d4cc]">
                  Scout analyses real player stats for every Premier League match.
                </p>
                <p className="text-[17px] leading-relaxed text-[#93a196]">
                  We publish picks before kickoff with full reasoning.
                </p>
                <p className="text-[17px] leading-relaxed text-[#93a196]">
                  You track your results. Free for the entire tournament.
                </p>
              </div>
            </M>

            <M {...(!reduce ? fadeUp(0.33) : {})}>
              <div className="mb-12">
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={loggedIn ? "/dashboard" : "/auth/signup"}
                    className="group inline-flex items-center gap-2.5 h-[56px] px-8 bg-[#55c878] text-[#08110b] font-semibold text-[16px] rounded-[4px] hover:bg-[#46b167] hover:-translate-y-px active:translate-y-0 active:scale-[0.99] transition-all duration-200 shadow-[0_8px_32px_rgba(85,200,120,0.22)]"
                  >
                    {loggedIn ? "Go to Dashboard" : "Get Free Access"}
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <p className="font-mono text-[11px] text-[#76837a] max-w-[180px]">
                    Free until September 20 · then from £14.99/month
                  </p>
                </div>
              </div>
            </M>

            {/* Stat strip */}
            <M {...(!reduce ? fadeUp(0.42) : {})}>
              <div className="flex items-center gap-10 pt-6 border-t border-white/[0.07]">
                {[
                  { value: "4,300+", label: "Players tracked"  },
                  { value: "5",      label: "Stat categories"  },
                  { value: "WC26",   label: "Full tournament"  },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="font-display font-bold text-[#f2f5f0] text-[24px] leading-none mb-1.5 tracking-tight">
                      {value}
                    </div>
                    <div className="text-[12px] text-[#76837a]">{label}</div>
                  </div>
                ))}
              </div>
            </M>
          </div>

          {/* Right: live picks terminal */}
          <M {...(!reduce ? fadeUp(0.28) : {})}>
            <div className="relative rounded-lg overflow-hidden border border-white/[0.09] bg-[#121714] shadow-[0_32px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.05)]">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0d100e]">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#55c878] animate-pulse" />
                  <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#55c878]">LIVE</span>
                  <span className="font-mono text-[11px] text-[#76837a] tracking-[0.06em]">SETPIECE SCOUT</span>
                </div>
                <span className="font-mono text-[11px] text-[#76837a]">Today</span>
              </div>

              {/* Pick rows */}
              {LIVE_PICKS.map((pick, i) => (
                <div key={i} className="border-b border-white/[0.045] last:border-0">
                  {pick.locked ? (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Lock className="w-3.5 h-3.5 flex-shrink-0 text-[#39443c]" />
                        <div>
                          <div className="h-2.5 w-28 rounded-sm mb-1.5 bg-white/[0.06]" />
                          <div className="h-2 w-20 rounded-sm bg-white/[0.035]" />
                        </div>
                      </div>
                      <Link
                        href="/pricing"
                        className="font-mono text-[11px] text-[#55c878]/50 hover:text-[#55c878] transition-colors duration-150"
                      >
                        Edge →
                      </Link>
                    </div>
                  ) : (
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-medium text-[#f2f5f0] block truncate mb-1 text-[14.5px]">
                            {pick.player}
                          </span>
                          <span className="font-mono text-[10.5px] text-[#76837a] uppercase tracking-[0.06em]">
                            {pick.stat}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="font-mono font-semibold text-[#f2f5f0] text-[24px] leading-none tracking-tight">
                              {pick.line}
                            </span>
                            <span
                              className={`font-mono text-[9.5px] font-semibold px-1.5 py-0.5 rounded-[3px] ${
                                pick.dir === "MORE"
                                  ? "bg-[#55c878]/[0.13] text-[#55c878]"
                                  : "bg-[#e0574f]/[0.13] text-[#e0574f]"
                              }`}
                            >
                              {pick.dir}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#55c878]">{pick.conf}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Terminal footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] bg-[#0d100e]">
                <span className="font-mono text-[11px] text-[#76837a]">
                  2 free · 2 Edge only
                </span>
                <Link
                  href="/dashboard"
                  className="font-mono text-[11px] text-[#55c878]/60 hover:text-[#55c878] transition-colors duration-150"
                >
                  View all →
                </Link>
              </div>
            </div>
          </M>
        </div>
      </div>
    </section>
  );
}

// ─── Value Props: drenched grass band ───────────────────────────
// One deliberate color-block moment. Dark chalk on pitch green.
function ValuePropStrip() {
  const PROPS = [
    {
      Icon: BarChart2,
      heading: "Scout analyses real player stats",
      body: "For every Premier League match: shots, passes, form, defensive matchups.",
    },
    {
      Icon: Clock,
      heading: "Picks published before kickoff",
      body: "With full AI reasoning so you know exactly why each pick was made.",
    },
    {
      Icon: CheckCheck,
      heading: "Free for the entire tournament",
      body: "Track your results live. No card required. August 21 to September 20.",
    },
  ];

  return (
    <section className="relative bg-[#4cbb6f] overflow-hidden">
      {/* Center-circle pitch marking, dark chalk */}
      <svg
        className="pointer-events-none absolute -right-32 -top-40 h-[560px] w-[560px]"
        viewBox="0 0 560 560"
        fill="none"
        aria-hidden
      >
        <circle cx="280" cy="280" r="230" stroke="rgba(8,17,11,0.10)" strokeWidth="2" />
        <circle cx="280" cy="280" r="6" fill="rgba(8,17,11,0.14)" />
        <line x1="0" y1="280" x2="560" y2="280" stroke="rgba(8,17,11,0.08)" strokeWidth="2" />
      </svg>

      <div className="relative max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16 py-16 md:py-24">
        <div className="divide-y divide-[#08110b]/[0.14]">
          {PROPS.map(({ Icon, heading, body }, i) => (
            <motion.div
              key={i}
              {...scrollReveal(i * 0.08)}
              className="grid grid-cols-[36px_1fr] md:grid-cols-[56px_minmax(0,1.15fr)_minmax(0,1fr)] gap-x-5 md:gap-x-10 items-baseline py-8 md:py-12"
            >
              <Icon className="h-6 w-6 text-[#08110b] self-center md:self-start md:mt-2" strokeWidth={2.25} />
              <h3 className="font-display text-[26px] md:text-[36px] font-extrabold tracking-tight text-[#08110b] leading-[1.05]">
                {heading}
              </h3>
              <p className="col-start-2 md:col-start-3 text-[16px] font-medium text-[#08110b]/[0.72] leading-relaxed mt-2.5 md:mt-1">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ────────────────────────────────────────────────────
function Pricing() {
  const FREE  = ["2 picks per match", "AI confidence score", "Scout chatbot", "Last 5 form"];
  const EDGE  = ["All picks, every match", "Full AI reasoning", "Power Play lineups", "Odds + edge score", "Champions League nights", "Priority finals"];

  return (
    <section className="bg-[#0b0e0c] border-t border-white/[0.06]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 lg:px-16 py-20 md:py-24">

        <motion.div {...scrollReveal()} className="mb-12">
          <h2 className="font-display text-[30px] md:text-[44px] font-extrabold tracking-tight text-[#f2f5f0] mb-3 leading-[1.02]">
            Start free. Go Edge when you&apos;re ready.
          </h2>
          <p className="text-[14px] text-[#93a196]">
            UPI · Google Pay · PhonePe · Access within 1 hour
          </p>
        </motion.div>

        <motion.div
          {...scrollReveal(0.1)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Free */}
          <div className="rounded-lg border border-white/[0.08] bg-[#121714] p-7 md:p-9 flex flex-col">
            <div className="mb-7">
              <span className="text-[13px] text-[#76837a] block mb-3">Free</span>
              <div className="font-display font-extrabold text-[#f2f5f0] leading-none text-[44px] tracking-tight">$0</div>
            </div>
            <ul className="space-y-3.5 mb-9 flex-1">
              {FREE.map(f => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-[#93a196]">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#76837a]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="flex items-center justify-center h-[46px] w-full border border-white/[0.12] text-[#a7b3a9] font-medium text-[14px] rounded-[4px] hover:border-white/[0.25] hover:text-[#f2f5f0] transition-colors duration-150"
            >
              Start free
            </Link>
          </div>

          {/* Edge */}
          <div className="relative rounded-lg border border-[#55c878]/30 bg-gradient-to-b from-[#55c878]/[0.06] to-transparent bg-[#121714] p-7 md:p-9 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#55c878]/60" />
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-[13px] text-[#55c878] font-medium">Setpiece Edge</span>
                <span className="font-mono text-[9.5px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em] bg-[#55c878]/[0.12] text-[#55c878]">
                  Recommended
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div className="font-display font-extrabold text-[#f2f5f0] leading-none text-[44px] tracking-tight">₹299</div>
                <div className="text-[14px] text-[#76837a] mb-1">/month</div>
              </div>
            </div>
            <ul className="space-y-3.5 mb-9 flex-1">
              {EDGE.map(f => (
                <li key={f} className="flex items-center gap-3 text-[14px] text-[#f2f5f0]">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-[#55c878]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="group flex items-center justify-center gap-2 h-[46px] w-full bg-[#55c878] text-[#08110b] font-semibold text-[14px] rounded-[4px] hover:bg-[#46b167] active:scale-[0.99] transition-all duration-150"
            >
              Get Edge via UPI
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>

        <p className="text-[12px] text-[#76837a] text-center mt-8">
          US card payments coming soon · Access within 1 hour of payment
        </p>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e0c] flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Hero />
        <ValuePropStrip />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
