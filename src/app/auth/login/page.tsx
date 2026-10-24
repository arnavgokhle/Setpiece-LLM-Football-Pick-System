"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

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

        {/* Card */}
        <div
          className="rounded-[4px] overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.20)", backgroundColor: "#121714" }}
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
              Welcome back
            </h1>
            <p className="font-mono text-[11px] text-[#76837a] mb-8 uppercase tracking-[0.12em]">
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em] block mb-2">
                  Email
                </label>
                <input
                  id="login-email"
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
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="font-mono text-[10px] text-[#76837a] uppercase tracking-[0.12em]">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="font-mono text-[10px] uppercase tracking-widest transition-colors"
                    style={{ color: "rgba(85,200,120,0.5)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#55c878")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(85,200,120,0.5)")}
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                className="w-full flex items-center justify-center gap-2 h-[44px] bg-[#55c878] text-[#0b0e0c] font-bold text-[12px] uppercase tracking-wide rounded-[3px] hover:bg-[#46b167] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 cursor-pointer"
                style={{ fontFamily: "var(--font-sans), sans-serif" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div
                className="relative flex justify-center font-mono text-[10px] text-[#76837a] uppercase tracking-[0.1em] px-3"
                style={{ backgroundColor: "#121714" }}
              >
                or
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="w-full flex items-center justify-center gap-2.5 h-[44px] font-mono text-[11px] text-[#a7b3a9] hover:text-[#f2f5f0] rounded-[3px] transition-all duration-150 cursor-pointer"
              style={{ border: "1px solid rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.04)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center mt-6 font-mono text-[11px] text-[#76837a]">
          No account?{" "}
          <Link href="/auth/signup" className="text-[#55c878] hover:text-[#46b167] transition-colors">
            Sign up free
          </Link>
        </p>
        <p className="text-center mt-3 font-mono text-[10px] text-[#76837a] hover:text-[#76837a] transition-colors">
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
