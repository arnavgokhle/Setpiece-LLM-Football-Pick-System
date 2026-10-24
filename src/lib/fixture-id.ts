// ============================================================
// SETPIECE — Fixture id parsing
//
// Match ids carry a source prefix so the origin stays visible in
// logs and the UI:
//   af_<id>  API-Football
//   wc_<id>  World Cup fixture (wc_fixtures.fixture_id)
//   cf_<id>  Club fixture (clubFixtureId of club_fixtures.fixture_key)
//   manual_<id>  Hand-entered
//
// picks.fixture_id is an integer column, so every prefix must be
// stripped before writing or comparing. Doing this ad-hoc broke club
// picks once already: the sites that stripped only /^(af_|wc_)/ turned
// every cf_ id into NaN → 0, so all club picks shared fixture_id 0.
// That made picksExistForFixture() short-circuit generation after the
// first match and made finalize group every fixture into one batch.
// Parse fixture ids through here and nowhere else.
// ============================================================

/**
 * Numeric fixture id from a prefixed match id.
 * Returns 0 when the id carries no parseable number.
 */
export function parseFixtureId(matchId: string | null | undefined): number {
  if (!matchId) return 0;
  const n = parseInt(matchId.replace(/^[a-z]+_/i, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
