-- Clear xG values that were incorrectly computed from FBref standard stats CSV.
-- The standard stats CSV export has per-90 goal stats (not xG) at col 20,
-- which caused xg_per90 to be stored as Gls/90 / 90s (nonsensical values).
-- After running this, xg_per90 will be NULL for all rows from fbref-csv source.
-- If you later add an FBref Expected Goals CSV, re-import it to populate xg_per90 correctly.

UPDATE player_club_stats
SET xg_per90 = NULL, xag_per90 = NULL
WHERE source = 'fbref-csv';

-- Verify
SELECT
  COUNT(*) FILTER (WHERE xg_per90 IS NOT NULL) AS rows_with_xg,
  COUNT(*) AS total_rows
FROM player_club_stats;
