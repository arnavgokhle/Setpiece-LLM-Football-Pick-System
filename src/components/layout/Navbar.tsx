"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  initialSubscriptionTier?: "FREE" | "PRO";
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Today's Picks" },
  { href: "/results",   label: "Results" },
  { href: "/tracker",   label: "Tracker" },
  { href: "/pricing",   label: "Pricing" },
];

export function Navbar({ initialSubscriptionTier = "FREE" }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"FREE" | "PRO">(initialSubscriptionTier);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("subscription_tier, name")
          .eq("id", user.id)
          .single();
        if (data?.subscription_tier) setSubscriptionTier(data.subscription_tier as "FREE" | "PRO");
        if (data?.name) setDisplayName(data.name);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setSubscriptionTier("FREE");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="flex items-center justify-between h-[72px] px-edge-margin max-w-[1280px] mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-nav.png"
            alt="Setpiece"
            style={{ height: "38px", width: "auto", filter: "brightness(1.8)" }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-2 rounded-[4px] text-[13.5px] font-medium transition-colors ${
                  active
                    ? "text-[#f2f5f0] bg-white/[0.06]"
                    : "text-[#93a196] hover:text-[#f2f5f0] hover:bg-white/[0.04]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <span className="font-mono text-[11px] text-[#93a196] border border-white/10 rounded-full px-3 py-1.5">
            Free until September 20
          </span>
          {user ? (
            <>
              <span className="text-[#a7b3a9] truncate max-w-[140px] text-[13px]">
                {displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[13.5px] font-medium text-[#93a196] hover:text-[#f2f5f0] transition-colors px-3 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[13.5px] font-medium text-[#93a196] hover:text-[#f2f5f0] transition-colors px-3 py-1.5"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center h-[38px] bg-[#55c878] text-[#08110b] text-[13.5px] font-semibold px-4 rounded-[4px] hover:bg-[#46b167] active:scale-[0.98] transition-all duration-150"
              >
                Sign up free
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#f2f5f0] p-2 min-h-[44px] min-w-[44px] flex flex-col items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${mobileOpen ? "translate-y-[3px] rotate-45" : "mb-1"}`} />
          <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${mobileOpen ? "-translate-y-[1px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] glass-strong px-edge-margin py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-3 rounded-[4px] text-[15px] font-medium transition-colors ${
                pathname === href ? "text-[#f2f5f0] bg-white/[0.06]" : "text-[#93a196] hover:text-[#f2f5f0]"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-white/[0.08] flex flex-col gap-2">
            <p className="font-mono text-[11px] text-[#93a196] px-3 py-1">
              Free Premier League access until September 20
            </p>
            {user ? (
              <>
                <p className="text-[#a7b3a9] px-3 text-[13px]">{user.email}</p>
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="text-[#93a196] py-3 text-center text-[15px] font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-[#93a196] py-3 text-center block text-[15px] font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center h-[46px] bg-[#55c878] text-[#08110b] text-[15px] font-semibold rounded-[4px]"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
