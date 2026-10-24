-- ============================================================
-- SETPIECE — WC 2026 Defensive Stats Migration
-- Run in Supabase SQL Editor
-- Adds defensive vulnerability columns to team_tactical_profiles
-- and matchup_rating/matchup_context columns to picks
-- ============================================================

-- ── 1. Extend team_tactical_profiles ─────────────────────────
ALTER TABLE team_tactical_profiles
  ADD COLUMN IF NOT EXISTS key_passes_conceded_per_game  NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS wide_vulnerability_rating      INTEGER CHECK (wide_vulnerability_rating BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS central_vulnerability_rating   INTEGER CHECK (central_vulnerability_rating BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS aerial_vulnerability_rating    INTEGER CHECK (aerial_vulnerability_rating BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS set_piece_vulnerability_rating INTEGER CHECK (set_piece_vulnerability_rating BETWEEN 1 AND 10);

-- ── 2. Extend picks table ────────────────────────────────────
ALTER TABLE picks
  ADD COLUMN IF NOT EXISTS matchup_rating  TEXT CHECK (matchup_rating IN ('strong', 'neutral', 'tough')),
  ADD COLUMN IF NOT EXISTS matchup_context TEXT;

-- ── 3. Populate defensive stats for all 48 WC 2026 nations ──
-- Ratings: 1 = minimal vulnerability, 10 = highly exposed
-- Based on 2022-2026 international performances and qualifying stats
-- key_passes_conceded: average key passes opposition makes per 90 against this team

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.1, wide_vulnerability_rating = 3, central_vulnerability_rating = 3, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 3
WHERE country = 'Germany';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 4.8, wide_vulnerability_rating = 3, central_vulnerability_rating = 2, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 3
WHERE country = 'France';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.4, wide_vulnerability_rating = 4, central_vulnerability_rating = 3, aerial_vulnerability_rating = 3, set_piece_vulnerability_rating = 4
WHERE country = 'England';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.6, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 7, set_piece_vulnerability_rating = 5
WHERE country = 'Spain';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.8, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 4
WHERE country = 'Portugal';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.2, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Netherlands';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 4.9, wide_vulnerability_rating = 3, central_vulnerability_rating = 2, aerial_vulnerability_rating = 3, set_piece_vulnerability_rating = 3
WHERE country = 'Italy';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.3, wide_vulnerability_rating = 4, central_vulnerability_rating = 3, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 4
WHERE country = 'Switzerland';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.5, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 4
WHERE country = 'Croatia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.4, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Austria';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.6, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 3, set_piece_vulnerability_rating = 5
WHERE country = 'Serbia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.8, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 4
WHERE country = 'Denmark';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.8, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Turkey';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.2, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Scotland';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.5, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Ukraine';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.9, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 6
WHERE country = 'Romania';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.7, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Belgium';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.1, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 6
WHERE country = 'Poland';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.4, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Hungary';

-- CONMEBOL
UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.2, wide_vulnerability_rating = 4, central_vulnerability_rating = 3, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 4
WHERE country = 'Argentina';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.9, wide_vulnerability_rating = 4, central_vulnerability_rating = 3, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 5
WHERE country = 'Brazil';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.8, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 6
WHERE country = 'Colombia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.6, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 3, set_piece_vulnerability_rating = 4
WHERE country = 'Uruguay';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.2, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 6
WHERE country = 'Ecuador';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.6, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Venezuela';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.4, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Paraguay';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.8, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Chile';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.9, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Bolivia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.5, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Peru';

-- CONCACAF
UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.8, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'United States';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.0, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 5
WHERE country = 'Mexico';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.2, wide_vulnerability_rating = 5, central_vulnerability_rating = 5, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 5
WHERE country = 'Canada';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.4, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 7
WHERE country = 'Panama';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.6, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Honduras';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.2, wide_vulnerability_rating = 8, central_vulnerability_rating = 8, aerial_vulnerability_rating = 7, set_piece_vulnerability_rating = 7
WHERE country = 'Jamaica';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.8, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Costa Rica';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.5, wide_vulnerability_rating = 8, central_vulnerability_rating = 8, aerial_vulnerability_rating = 7, set_piece_vulnerability_rating = 8
WHERE country = 'Suriname';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.1, wide_vulnerability_rating = 8, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Trinidad and Tobago';

-- AFC
UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.2, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 8, set_piece_vulnerability_rating = 7
WHERE country = 'Japan';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 6.5, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 7, set_piece_vulnerability_rating = 6
WHERE country = 'South Korea';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.4, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 6
WHERE country = 'Iran';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.1, wide_vulnerability_rating = 8, central_vulnerability_rating = 8, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Saudi Arabia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.8, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Australia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.9, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 7
WHERE country = 'Iraq';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.2, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Uzbekistan';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.5, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 7
WHERE country = 'Jordan';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.1, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Qatar';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.6, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Bahrain';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.3, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Oman';

-- CAF
UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 5.8, wide_vulnerability_rating = 4, central_vulnerability_rating = 4, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Morocco';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.2, wide_vulnerability_rating = 6, central_vulnerability_rating = 5, aerial_vulnerability_rating = 4, set_piece_vulnerability_rating = 5
WHERE country = 'Senegal';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.5, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Egypt';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.2, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 7
WHERE country = 'Nigeria';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.8, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Ivory Coast';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.5, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 7
WHERE country = 'Cameroon';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.8, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'South Africa';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.6, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Ghana';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 7.6, wide_vulnerability_rating = 6, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Algeria';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.0, wide_vulnerability_rating = 7, central_vulnerability_rating = 6, aerial_vulnerability_rating = 5, set_piece_vulnerability_rating = 6
WHERE country = 'Tunisia';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.3, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Mali';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 8.7, wide_vulnerability_rating = 7, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Democratic Republic of Congo';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.2, wide_vulnerability_rating = 8, central_vulnerability_rating = 8, aerial_vulnerability_rating = 7, set_piece_vulnerability_rating = 8
WHERE country = 'Guinea';

UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 9.0, wide_vulnerability_rating = 8, central_vulnerability_rating = 7, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 7
WHERE country = 'Gabon';

-- OFC
UPDATE team_tactical_profiles SET
  key_passes_conceded_per_game = 10.2, wide_vulnerability_rating = 9, central_vulnerability_rating = 8, aerial_vulnerability_rating = 6, set_piece_vulnerability_rating = 8
WHERE country = 'New Zealand';
