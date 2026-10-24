// ============================================================
// SETPIECE — Current season & offer constants
//
// Single source of truth for every user-facing season/offer string.
// Change the offer here, not in twelve components.
//
// NOTE: FREE_UNTIL and EDGE_LAUNCH are commercial decisions, set to
// end at the September international break (21 Sep – 6 Oct 2026).
// Adjust to whatever you actually want to commit to.
// ============================================================

export const SEASON_LABEL = "Premier League 2026-27";

/** Arsenal v Coventry, Emirates — 20:00 BST. */
export const SEASON_START_ISO = "2026-08-21T19:00:00Z";

/** Human-readable opening date. */
export const SEASON_START_LABEL = "August 21";

// Offer dates currently in use across marketing copy and email templates.
// These are written literally in those files (JSX prose and HTML email
// strings), so changing the offer means changing them there too:
//   free window   "August 21 to September 20"
//   edge launch   "September 21"
// Files: page.tsx, pricing/page.tsx, auth/signup/page.tsx, Navbar.tsx,
// Footer.tsx, LockedPickCard.tsx, EmailCapturePopup.tsx,
// email-templates/{welcome,waitlist}.ts

/** Days until the season opens; 0 once underway. */
export function daysUntilSeasonStart(now: number = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(SEASON_START_ISO).getTime() - now) / 86400000));
}

/** Badge text used in the hero and dashboard headers. */
export function seasonBadge(now: number = Date.now()): string {
  const days = daysUntilSeasonStart(now);
  return days > 0
    ? `${SEASON_LABEL} · ${days}d to go · ${SEASON_START_LABEL}`
    : `${SEASON_LABEL} · Underway`;
}
