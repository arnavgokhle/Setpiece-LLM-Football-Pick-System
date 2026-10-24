export const dynamic = "force-dynamic";

import { RefreshCw, Clock, Trophy, Sparkles, Wifi, CalendarDays, MapPin, Minus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MatchGroup } from "@/components/picks/MatchGroup";
import { PaywallBanner } from "@/components/paywall/PaywallBanner";
import { ChatBot } from "@/components/chat/ChatBot";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { PowerPlaysTab } from "@/components/lineups/PowerPlaysTab";
import { getVisiblePicks } from "@/lib/mock-data";
import { type RealFixture } from "@/lib/api-football";
import { getUpcomingClubFixtures } from "@/lib/club-fixtures";
import { getUpcomingPicksFromDB, getTrackRecord } from "@/lib/supabase-picks";
import { getUserFollows } from "@/lib/supabase-follows";
import { getLineupsForDate } from "@/lib/supabase-lineups";
import { createClient } from "@/lib/supabase/server";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { welcomeEmailHtml } from "@/lib/email-templates/welcome";
import { formatDate, formatKickoff } from "@/lib/utils";
import { seasonBadge } from "@/lib/season";
import type { Match, Pick } from "@/types";

function getNextMatchCountdown(nextMatchDate: string | null): string | null {
  if (!nextMatchDate) return null;
  const next = new Date(nextMatchDate + "T00:00:00Z");
  const now = new Date();
  const diffMs = next.getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export default async function DashboardPage() {
  // ── Auth ──────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let subscriptionTier: "FREE" | "PRO" = "FREE";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, name")
      .eq("id", user.id)
      .single();
    subscriptionTier = (profile?.subscription_tier as "FREE" | "PRO") || "FREE";

    // Send welcome email for any user who hasn't received it yet — catches
    // OAuth (Google) and auto-confirmed signups that bypass the auth callback.
    if (user.email && !user.user_metadata?.welcome_sent) {
      try {
        const { error } = await getResend().emails.send({
          from: FROM_ADDRESS,
          to: user.email,
          subject: "Welcome to Setpiece — Premier League picks start August 21",
          html: welcomeEmailHtml(),
        });
        if (!error) {
          await supabase.auth.updateUser({ data: { welcome_sent: true } });
        } else {
          console.error("[dashboard] welcome email error:", error);
        }
      } catch (err) {
        console.error("[dashboard] welcome email exception:", err);
      }
    }
  }

  // ── Data ──────────────────────────────────────────────────
  // Free period: all signed-in users see every pick. Signed-out users get 1 per match then locked.
  const { fixtures: upcomingFixtures, nextMatchDate } = await getUpcomingClubFixtures(7);
  const rawPicks = await getUpcomingPicksFromDB();
  const allPicks = getVisiblePicks(rawPicks, user ? "PRO" : "FREE");
  const lockedCount = allPicks.filter((p) => p.isLocked).length;

  const [trackRecord, followedFixtureIds] = await Promise.all([
    getTrackRecord(),
    user ? getUserFollows(user.id) : Promise.resolve([] as number[]),
  ]);
  const todayDate = new Date().toISOString().split("T")[0];
  const lineups = await getLineupsForDate(todayDate);

  // ── Group picks by match ──────────────────────────────────
  // A match is "done" when kickoff was more than 110 minutes ago (used only
  // to hide stale NO_PICK_MATCHES banners — pending picks stay visible until
  // results are published).
  const now = Date.now();
  const MATCH_DURATION_MS = 110 * 60 * 1000;
  const isMatchDone = (kickoff: string) =>
    new Date(kickoff).getTime() + MATCH_DURATION_MS < now;

  const matchMap = new Map<string, { match: Match; picks: Pick[] }>();
  for (const pick of allPicks) {
    const matchKey = `${pick.match.homeTeam}|${pick.match.awayTeam}|${pick.match.kickoff}`;
    if (!matchMap.has(matchKey)) {
      matchMap.set(matchKey, { match: pick.match, picks: [] });
    }
    matchMap.get(matchKey)!.picks.push(pick);
  }

  const pickedMatchIds = new Set(allPicks.map((p) => p.match.id));
  const unpickedFixtures = upcomingFixtures.filter((f) => !pickedMatchIds.has(f.id));

  // Matches where Scout found no qualifying picks (>=75% confidence).
  // Cleared for the club season — repopulate from real fixtures rather
  // than leaving World Cup examples that no longer render.
  const NO_PICK_MATCHES: {
    homeTeam: string; awayTeam: string; kickoff: string;
    competition: string; venue: string; reason: string;
  }[] = [];

  const today = new Date().toISOString();
  const totalPicks = Array.from(matchMap.values()).reduce((sum, { picks }) => sum + picks.length, 0);
  const highConfidencePicks = allPicks.filter((p) => p.confidence >= 80 && !p.isLocked).length;
  const hasFixtures = upcomingFixtures.length > 0;
  const hasPicks = matchMap.size > 0;
  const countdown = getNextMatchCountdown(nextMatchDate);

  const seasonLabel = seasonBadge();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e0c]">
      <Navbar />

      <main className="flex-grow pt-28 pb-16">
        <div className="max-w-[1280px] mx-auto px-edge-margin">

          {/* ── Page header ─────────────────────────────── */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#55c878] animate-pulse flex-shrink-0" />
                <span className="font-mono text-[11px] text-[#55c878] tracking-[0.08em] uppercase">{seasonLabel}</span>
              </div>
              <h1 className="font-display text-[26px] md:text-[30px] font-bold tracking-tight text-[#f2f5f0] leading-none">
                {formatDate(today)}{hasPicks ? ` · ${totalPicks} pick${totalPicks !== 1 ? "s" : ""}` : ""}
              </h1>
            </div>
            {!user && (
              <a href="/auth/signup" className="font-mono text-[12px] text-[#55c878] border border-[#55c878]/30 px-3.5 py-2 rounded-[4px] hover:bg-[#55c878]/10 transition-colors whitespace-nowrap">
                Free access →
              </a>
            )}
          </div>

          {/* No matches state */}
          {!hasPicks && !hasFixtures && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 rounded-sm bg-surface-card border border-outline-variant/40 flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-on-surface-variant" />
              </div>
              <h2 className="font-headline-display text-headline-display text-on-surface mb-2">
                No matches today
              </h2>
              {countdown ? (
                <p className="font-body-lg text-body-lg text-secondary">
                  Next matchday in <span className="text-primary font-bold">{countdown}</span>
                </p>
              ) : (
                <p className="font-body-lg text-body-lg text-secondary">Check back soon for upcoming picks</p>
              )}
            </div>
          )}

          {/* Tabs */}
          <DashboardTabs
            pickContent={
              <>
                {hasPicks && (
                  <div className="mb-6">
                    {Array.from(matchMap.entries()).map(([key, { match, picks }]) => (
                      <MatchGroup
                        key={key}
                        match={match}
                        picks={picks}
                        followedFixtureIds={followedFixtureIds}
                      />
                    ))}
                  </div>
                )}
                {NO_PICK_MATCHES.length > 0 && (
                  <div className="mb-10">
                    {NO_PICK_MATCHES.map((m) => (
                      <NoPickMatchGroup key={m.homeTeam + m.kickoff} {...m} />
                    ))}
                  </div>
                )}
                {unpickedFixtures.length > 0 && (
                  <div className="mb-12">
                    <h3 className="font-label-caps text-label-caps text-secondary mb-gutter px-1">
                      MORE UPCOMING MATCHES
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                      {unpickedFixtures.map((fix) => (
                        <FixturePublishingSoon key={fix.id} fixture={fix} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            }
            lineupContent={
              <PowerPlaysTab lineups={lineups} subscriptionTier={subscriptionTier} />
            }
          />

          {/* Track record */}
          {trackRecord.total > 0 && (
            <div className="mb-10 bg-surface-card border border-outline-variant/40 rounded-sm p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface">TRACK RECORD</p>
                  <p className="font-data-mono text-data-mono text-secondary text-xs mt-0.5">
                    {trackRecord.won}W / {trackRecord.lost}L from {trackRecord.total} picks
                  </p>
                </div>
              </div>
              <a href="/results" className="font-label-caps text-label-caps text-primary hover:underline">
                VIEW FULL RECORD →
              </a>
            </div>
          )}

          {/* Scout chatbot */}
          <div className="border-t border-outline-variant/20 pt-10 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-headline-display text-headline-display text-on-surface">Ask Scout</h2>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mb-6">
              Scout is your AI football analyst. Ask about any player, pick, or match.
            </p>
            <ChatBot />
          </div>

          {/* Last updated */}
          <div className="mt-8 flex items-center gap-2 font-data-mono text-data-mono text-on-surface-variant/40 text-xs">
            <RefreshCw className="h-3 w-3" />
            <span>
              Picks refreshed:{" "}
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST
              {" · "}Fixture data updates every 10 min
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatChip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-card border border-outline-variant/40 rounded-sm px-4 py-2 text-center">
      <p className={`font-data-mono text-data-mono font-bold ${accent ? "text-primary" : "text-on-surface"}`}>
        {value}
      </p>
      <p className="font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-wide mt-0.5">
        {label}
      </p>
    </div>
  );
}


function NoPickMatchGroup({ homeTeam, awayTeam, kickoff, competition, venue, reason }: {
  homeTeam: string; awayTeam: string; kickoff: string;
  competition: string; venue: string; reason: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between mb-gutter px-1 flex-wrap gap-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] block mb-1.5" style={{ color: "#9db2a4" }}>
            {competition}
          </span>
          <h2 className="font-display text-[22px] md:text-[26px] font-bold tracking-tight" style={{ color: "#f2f5f0" }}>
            {homeTeam}{" "}
            <span className="font-normal" style={{ color: "#515c54" }}>vs</span>{" "}
            {awayTeam}
          </h2>
          <div className="flex items-center gap-3 mt-1 font-mono text-[11px] uppercase tracking-widest" style={{ color: "rgba(157,178,164,0.65)" }}>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(kickoff)} · {formatKickoff(kickoff)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {venue}
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-[3px]"
          style={{ border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "#121714" }}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#93a196" }}>
            Scout passed
          </span>
        </div>
      </div>
      <div
        className="rounded-sm px-5 py-4 flex items-start gap-3"
        style={{ backgroundColor: "#111512", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <Minus className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#4d5850" }} />
        <p className="font-mono text-[11px] leading-relaxed" style={{ color: "#68756c" }}>
          {reason}
        </p>
      </div>
    </div>
  );
}

function FixturePublishingSoon({ fixture }: { fixture: RealFixture }) {
  return (
    <div className="bg-surface-card border border-outline-variant/40 rounded-sm p-stack-md">
      <div className="flex items-center justify-between mb-3">
        <span className="font-label-caps text-label-caps text-primary uppercase">{fixture.competition}</span>
        <span className="font-label-caps text-[9px] border border-outline-variant/40 bg-surface-variant/20 px-2 py-0.5 rounded-sm text-on-surface-variant">
          {fixture.status === "NS" ? "PRE-MATCH" : fixture.status}
        </span>
      </div>
      <p className="font-headline-card text-headline-card text-on-surface mb-1">
        {fixture.homeTeam} <span className="text-on-surface-variant font-normal">vs</span> {fixture.awayTeam}
      </p>
      <p className="font-data-mono text-data-mono text-secondary text-xs mb-4">
        {formatKickoff(fixture.kickoff)} · {fixture.venue}
      </p>
      <div className="flex items-center gap-2 font-data-mono text-data-mono text-secondary text-xs">
        <Clock className="h-3.5 w-3.5 text-on-surface-variant/50" />
        AI picks generating now
      </div>
    </div>
  );
}
