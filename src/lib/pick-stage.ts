// ============================================================
// SETPIECE — Pick Stage Logic
// Determines whether a pick should be 'early' or 'final'
// based on how far the kickoff is from now.
// ============================================================

const EARLY_WINDOW_MS = 36 * 60 * 60 * 1000; // 36h
const FINAL_WINDOW_MS =  4 * 60 * 60 * 1000; //  4h

/**
 * Returns the correct stage for a pick given its kickoff time.
 *
 * - Match started (kickoff in past)    → null  (don't generate)
 * - Kickoff within 4h                  → 'final'
 * - Kickoff within 4h–7 days           → 'early'
 * - Kickoff more than 7 days away      → null  (too early)
 */
export function determinePickStage(
  kickoffIso: string,
  now: Date = new Date()
): "early" | "final" | null {
  const msUntil = new Date(kickoffIso).getTime() - now.getTime();
  if (msUntil <= 0) return null;
  if (msUntil <= FINAL_WINDOW_MS) return "final";
  if (msUntil <= EARLY_WINDOW_MS) return "early";
  return null;
}

/**
 * Returns true if an early pick is now eligible for finalization
 * (kickoff is within 4h and pick is still early).
 */
export function isEligibleForFinalization(
  kickoffIso: string,
  currentStage: "early" | "final",
  now: Date = new Date()
): boolean {
  if (currentStage === "final") return false;
  const msUntil = new Date(kickoffIso).getTime() - now.getTime();
  return msUntil > 0 && msUntil <= FINAL_WINDOW_MS;
}

/** Human-readable countdown string, e.g. "3h 45m" */
export function msToCountdown(ms: number): string {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
