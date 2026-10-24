import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getPendingPicksFromDB, getTrackRecord, getDailyClaudeSpend, getPicksNeedingReview } from "@/lib/supabase-picks";
import { formatKickoff } from "@/lib/utils";
import { AdminMarkResult } from "./AdminMarkResult";
import { RegenerateButton } from "@/components/admin/RegenerateButton";
import { SendMatchdayEmailButton } from "@/components/admin/SendMatchdayEmailButton";
import { ShieldCheck, AlertTriangle } from "lucide-react";

// No fallback: with ADMIN_EMAIL unset, nobody is admin.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!ADMIN_EMAIL || !user || user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const [pendingPicks, trackRecord, dailySpend, reviewPicks] = await Promise.all([
    getPendingPicksFromDB(),
    getTrackRecord(),
    getDailyClaudeSpend(),
    getPicksNeedingReview(),
  ]);

  const finalizeSecret = process.env.FINALIZE_SECRET ?? "";

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">Admin Panel</h1>
                <p className="text-xs text-ink-faint">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-ink-muted">
                Today&apos;s API spend:{" "}
                <span className={dailySpend >= 0.5 ? "text-red-400 font-bold" : "text-ink font-semibold"}>
                  ${dailySpend.toFixed(4)}
                </span>
              </span>
              <SendMatchdayEmailButton />
              <RegenerateButton secret={finalizeSecret} />
            </div>
          </div>

          {/* High spend warning */}
          {dailySpend >= 0.5 && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Warning: Today&apos;s Claude API spend has exceeded $0.50 (${dailySpend.toFixed(4)}). Review usage before generating more picks.
            </div>
          )}

          {/* Track record summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center">
              <p className="text-xl font-bold text-accent">{trackRecord.hitRate}%</p>
              <p className="text-xs text-ink-faint mt-0.5">Hit Rate</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center">
              <p className="text-xl font-bold text-ink">{trackRecord.won}W / {trackRecord.lost}L</p>
              <p className="text-xs text-ink-faint mt-0.5">Record</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center">
              <p className="text-xl font-bold text-ink">{pendingPicks.length}</p>
              <p className="text-xs text-ink-faint mt-0.5">Awaiting result</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-1 p-4 text-center">
              <p className={`text-xl font-bold ${reviewPicks.length > 0 ? "text-amber-400" : "text-ink"}`}>
                {reviewPicks.length}
              </p>
              <p className="text-xs text-ink-faint mt-0.5">Needs review</p>
            </div>
          </div>

          {/* Review queue — auto-grader could not cite a number */}
          {reviewPicks.length > 0 && (
            <div className="mb-8 rounded-2xl border border-amber-500/30 bg-surface-1 overflow-hidden">
              <div className="border-b border-amber-500/20 px-5 py-4">
                <h2 className="font-semibold text-ink flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Needs Review — {reviewPicks.length}
                </h2>
                <p className="text-xs text-ink-faint mt-0.5">
                  Auto-grading could not find the actual figure, so these were voided
                  rather than guessed. They are excluded from the hit rate until you
                  set a result.
                </p>
              </div>
              <div className="divide-y divide-surface-border">
                {reviewPicks.map((pick) => (
                  <div key={pick.id} className="flex items-start gap-4 px-5 py-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {pick.player.name}
                        <span className="text-ink-faint font-normal mx-1.5">·</span>
                        <span className="text-ink-muted font-normal">
                          {pick.direction} {pick.line} {pick.statCategory}
                        </span>
                      </p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {pick.match.homeTeam} vs {pick.match.awayTeam}
                        <span className="mx-1.5">·</span>
                        {formatKickoff(pick.match.kickoff)}
                      </p>
                      {pick.gradingEvidence && (
                        <p className="mt-2 rounded-lg border border-surface-border bg-surface-2 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-muted">
                          {pick.gradingEvidence}
                        </p>
                      )}
                    </div>
                    <AdminMarkResult pickId={pick.dbId ?? pick.id.replace("db-", "")} withActual />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending picks */}
          <div className="rounded-2xl border border-surface-border bg-surface-1 overflow-hidden">
            <div className="border-b border-surface-border px-5 py-4">
              <h2 className="font-semibold text-ink">Pending Picks — Mark Results</h2>
              <p className="text-xs text-ink-faint mt-0.5">
                Matches that have started or finished. Mark each pick as won, lost, or void.
              </p>
            </div>

            {pendingPicks.length === 0 ? (
              <div className="px-5 py-10 text-center text-ink-muted text-sm">
                No picks awaiting results.
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {pendingPicks.map((pick) => (
                  <div key={pick.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {pick.player.name}
                        <span className="text-ink-faint font-normal mx-1.5">·</span>
                        <span className="text-ink-muted font-normal">
                          {pick.direction} {pick.line} {pick.statCategory}
                        </span>
                      </p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {pick.match.homeTeam} vs {pick.match.awayTeam}
                        <span className="mx-1.5">·</span>
                        {formatKickoff(pick.match.kickoff)}
                        <span className="mx-1.5">·</span>
                        {pick.confidence}% confidence
                      </p>
                    </div>
                    {/* Client component handles the mark result buttons */}
                    <AdminMarkResult pickId={pick.dbId ?? pick.id.replace("db-", "")} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
