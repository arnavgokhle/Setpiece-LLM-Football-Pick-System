"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? "Something went wrong — try again.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 6
      ? "weak"
      : password.length < 10
      ? "fair"
      : "strong";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ backgroundColor: "#020408" }}>
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity duration-150">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-nav.png"
              alt="Setpiece"
              style={{ height: "32px", width: "auto", filter: "brightness(1.8)" }}
            />
          </Link>
        </div>

        {/* WC free offer banner */}
        <div
          className="rounded-[4px] px-4 py-3.5 mb-5"
          style={{ border: "1px solid rgba(85,200,120,0.18)", backgroundColor: "rgba(85,200,120,0.04)" }}
        >
          <p className="font-mono text-[10px] text-[#55c878] uppercase tracking-[0.15em] mb-2">
            Free Premier League access · August 21 – September 20
          </p>
          <div className="space-y-1.5">
            {[
              "All picks, every Premier League match",
              "Full AI reasoning + confidence scores",
              "Scout chatbot, Power Plays, track record",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check className="h-3 w-3 text-[#55c878] flex-shrink-0" />
                <span className="font-mono text-[11px] text-[#76837a]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-[4px] overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#121714" }}
        >
          <div
            className="h-px"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(85,200,120,0.45) 50%, transparent 100%)" }}
          />

          <div className="p-7">
            <h1
              className="text-[22px] font-semibold text-[#f2f5f0] mb-1 tracking-tight"
              style={{ fontFamily: "var(--font-sans), sans-serif" }}
            >
              Create free account
            </h1>
            <p className="font-mono text-[11px] text-[#76837a] mb-8 uppercase tracking-[0.12em]">
              No card required
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="signup-name" className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em] block mb-2">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  required
                  autoComplete="name"
                  className="w-full rounded-[3px] px-3.5 py-3 font-mono text-[13px] text-[#f2f5f0] placeholder:text-[#76837a] outline-none transition-colors min-h-[44px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(85,200,120,0.3)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em] block mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  inputMode="email"
                  autoComplete="email"
                  className="w-full rounded-[3px] px-3.5 py-3 font-mono text-[13px] text-[#f2f5f0] placeholder:text-[#76837a] outline-none transition-colors min-h-[44px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(85,200,120,0.3)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em] block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-[3px] px-3.5 py-3 pr-10 font-mono text-[13px] text-[#f2f5f0] placeholder:text-[#76837a] outline-none transition-colors min-h-[44px]"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(85,200,120,0.3)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    style={{ color: "#4d5850" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#76837a")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#4d5850")}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {passwordStrength && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {["weak", "fair", "strong"].map((level, i) => {
                      const filled =
                        passwordStrength === "strong" ||
                        (passwordStrength === "fair" && i <= 1) ||
                        (passwordStrength === "weak" && i === 0);
                      return (
                        <div
                          key={level}
                          className="h-[3px] flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: filled
                              ? passwordStrength === "strong"
                                ? "#55c878"
                                : passwordStrength === "fair"
                                ? "#d9a13f"
                                : "#e0574f"
                              : "rgba(255,255,255,0.06)",
                          }}
                        />
                      );
                    })}
                    <span className="font-mono text-[10px] text-[#76837a] capitalize ml-1">{passwordStrength}</span>
                  </div>
                )}
              </div>

              {error && (
                <div
                  className="rounded-[3px] px-4 py-3 font-mono text-[11px] text-[#e0574f]"
                  style={{ border: "1px solid rgba(224,87,79,0.25)", backgroundColor: "rgba(224,87,79,0.06)" }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 h-[44px] bg-[#55c878] text-[#0b0e0c] font-bold text-[12px] uppercase tracking-wide rounded-[3px] hover:bg-[#46b167] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 cursor-pointer mt-1"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create free account
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center font-mono text-[10px] text-[#76837a]">
              By signing up you agree to our{" "}
              <Link href="#" className="text-[#76837a] hover:text-[#a7b3a9] underline transition-colors">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-[#76837a] hover:text-[#a7b3a9] underline transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 font-mono text-[11px] text-[#76837a]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#55c878] hover:text-[#46b167] transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center mt-3 font-mono text-[10px] text-[#76837a] hover:text-[#76837a] transition-colors">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
