# Development log

Design decisions made while building and running Setpiece, with the reason given at the time. Reconstructed from the project's internal working notes as of the final private commit (`5299216`, 2026-09-26). Operational details (hosting, accounts, credentials, deploy procedure, user handling) have been removed. Entries are as written then; where later code changed a rule, that is noted in *italics*.

## Rules in force at the end of the World Cup run

**Stat categories.** Picks are generated only for Shots on Target, Total Shots, Passes Attempted, Tackles, Total Match Corners (both teams combined) and Total Bookings (match yellow cards). Never for Goals, Assists, Key Passes, Passes Completed, individual Fouls, individual Corners Won, Interceptions or Saves.

**Category specifics.**
- Passes are *attempted*, not completed. The stored passes/90 figure is completed passes, so attempted is estimated by dividing by 0.87 for central and defensive midfielders and 0.83 for wingers. Platform lines run from about 55 to 115+.
- Tackles: defenders (CB/RB/LB/WB) and defensive midfielders only, averaging 2+ per 90. Lines 1.5 or 2.5 only.
- Total Match Corners: lines 8.5 / 9.5 / 10.5. Total Bookings: line 2.5.

**Form rule.** A pick requires the player to have cleared the line in at least 7 of their last 10 matches. *On the World Cup path this was a prompt instruction the model self-certified; code enforcement against logged matches was added later for the club path only (`src/lib/club-form.ts`).*

**One model call per fixture per stage.** Generation checks for existing picks first (`picksExistForFixture()`), to cap cost and keep picks stable once published.

**Confidence ranges.** 60–82 for early picks (about 24–36 h before kickoff, no confirmed lineups), 60–91 for final picks (about 4 h before, lineups known).

**No overwriting picks.** Existing picks are never deleted or overwritten; only new rows are inserted, or a pick is updated through the finalization step.

**Estimates must be labelled.** Real scraped stats are used before the model's training knowledge. Where real stats are unavailable, reasoning must say "est." and must not present the estimate as verified.

**Reasoning must compare player to opponent.** Every pick's reasoning had to compare the player's stat with the opponent's conceded figure, e.g. "[Player] averages X shots/90 and today's opponent concedes Y shots/game." *The opponent figures came from hand-entered team profiles with no cited source. The club-season path later forbade opponent-defence claims, because no club-level team data exists.*

## Dated entries

**2026-05-31: Key Passes removed.** Never show Key Passes in pick cards, demo data or previews. Allowed categories only.

**2026-05-31: Hero copy.** Describe tracked stats as "shots, passes, form data", not "xG, key passes", to match what the engine actually uses.

**2026-05-31: Logo rendering.** Don't render the logo with a fixed-size image component; the square source asset distorts. *Later replaced by a pre-cropped horizontal wordmark (`public/logo-nav.png`).*

**2026-05-31: No "0 matches" message.** When the fixture feed returns nothing, show a countdown instead of "X picks across 0 matches".

**2026-06-05: Confidence floor 70%.** Never generate or show a pick below 70%. If no player in a match reaches 70% with real (non-estimated) data, return no picks for that match. "No pick is better than a weak pick."

**2026-06-12: Display floor 75%, de-correlation.** Only picks at 75%+ appear on the dashboard. At most one corners pick per match (drop Total Corners if a Team Corners pick exists), and no duplicate correlated bookings picks for the same match.

**2026-06-14: Diversify categories.** Stop defaulting to shots + corners every match. Prefer Passes Attempted when a midfielder or defender has strong data, include Tackles for defenders and defensive midfielders, and vary shot lines. Stated goal: "maximising win rate is the north star — pick the category and line with the highest probability of hitting." *Note for readers: changing category mix mid-tournament toward what is hitting is a form of in-sample selection, and it affects how the tournament record should be read.*

**2026-06-14: Post-match routine.** After each match:
1. Search the web for the match's player stats.
2. Record key players' actual stats in `wc_match_stats`.
3. Mark pending picks won/lost/void.
4. Generate picks for the next matchday.

Results during the World Cup were set this way, partly by hand. The one-off scripts used are in `archive/`.

**2026-06-14: Match-stats table.** Store actual per-player match stats in `wc_match_stats` (player, team, opponent, date, minutes, shots, shots on target, passes completed and attempted, fouls, corners won, yellow cards, goals, tackles), and query it first for players who have already played in the tournament.

**2026-06-15: Calibrated to a target platform's markets.** Categories were changed to match the prop markets offered by the platform being targeted:
- Passes Attempted replaces Passes Completed (lines 55.5–115.5).
- Tackles added for defenders and defensive midfielders (lines 1.5 / 2.5).
- Total Match Corners (both teams) replaces individual Corners Won (lines 8.5 / 9.5 / 10.5).
- Total Bookings (match yellow cards) replaces individual Fouls Committed (line 2.5).
- Schema: `passes_attempted_per90` added to `player_club_stats`; `tackles` and `passes_attempted` added to `wc_match_stats`.
