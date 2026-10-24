
https://github.com/user-attachments/assets/f572fcfc-eb3e-49fa-9b2b-4623e6f31aa1

# Setpiece

Setpiece is an experiment in using a large language model to pick football player props: over/under lines on stats such as total shots, shots on target, passes attempted and tackles, plus match totals for corners and bookings. It builds a prompt from player statistics stored in Postgres, asks Claude for picks with a confidence score and written reasoning, publishes them on a website, and grades them automatically after the match.

It ran live during the 2026 FIFA World Cup. This repository is the code. It is **not** a validated prediction model, and nothing here is betting advice.

## How it works

```
GitHub Actions (every 30 min)
  └─ /api/cron/daily
       ├─ generate: fixtures within 36h → prompt (stats from Supabase) → Claude Sonnet → JSON picks
       │            → code-side filters (confidence clamp, 7-of-10 form rule where data exists) → Supabase
       ├─ email:   picks email ~4h before each kickoff block (Resend)
       └─ grade:   ~110 min after kickoff → Tavily search → Claude Haiku grades with a quoted figure
                   → won/lost only if a number is cited, otherwise void + manual review
  └─ /api/picks/finalize
       └─ ~4h before kickoff → Tavily lineup/injury search → Haiku extracts non-starters
          → Sonnet revises remaining picks → stage = final
```

No model call uses tool use. All context is fetched in advance and written into the prompt.

| Part | Where |
|---|---|
| Pick generation (prompts, both stages) | `src/lib/picks-generator.ts`, `src/lib/pipeline/generate-picks.ts` |
| Form rules and confidence caps | `src/lib/club-form.ts` |
| Result grading | `src/lib/pipeline/grade-results.ts` |
| Finalization (lineups) | `src/app/api/picks/finalize/route.ts` |
| Chat assistant | `src/app/api/chat/route.ts` |
| Schema | `supabase/*.sql` |
| Data ingest and seeding | `scripts/` |

## What was measured

The only evaluation is the live record from the 2026 World Cup. **There is no backtest, no holdout set, and no comparison against bookmaker prices or a statistical baseline.**

For picks that were graded won/lost, kicked off between 12 June and 6 July 2026, and were created before kickoff (the timestamp is the database `created_at`):

| | |
|---|---|
| Picks | 80 |
| Won / lost | 57 / 23 |
| Hit rate | 71% |
| Lead time before kickoff | min 3.4 h, median 14.3 h |

Calibration on the same 80 picks:

| Stated confidence | n | Mean stated | Observed |
|---|---|---|---|
| < 75 | 12 | 71.9% | 75.0% |
| 75–79 | 52 | 76.6% | 67.3% |
| 80+ | 16 | 81.3% | 81.3% |

The Brier score was 0.208. Always predicting the sample's own hit rate scores 0.205. **The model's confidence did not beat that constant forecast.** These samples are small, so read every number here as descriptive, not as evidence of skill.

Voided picks (the player didn't play, or no stat source was found) are excluded from the counts. 179 of 180 picks ever generated were MORE, so LESS picks are effectively untested.

## Known limitations

- **Model-generated figures on World Cup picks.** The World Cup prompt asks the model to produce the "last 5" form values and to estimate "hit last 10". Those values were shown on pick cards but are not real match logs. The club-season path replaces them with logged values where they exist.
- **Unsourced team data.** Team defensive profiles (shots conceded per game, vulnerability ratings) are hand-entered literals in `scripts/seed-*.ts` with no cited source. Pick reasoning quotes them.
- **Weak player stats.** The club stats came from an FBref scrape of 2024-25. Known problems: passes/90 is 99% null, tackles/90 is under-scaled by about 2.4×, there's no position column, and about 13% of rows have impossible minute totals. The club prompt labels this data "2025-26", which is wrong.
- **Rules the model only promised to follow.** On the World Cup path, the "7 of last 10" rule, the 20% line buffer and the volume thresholds are prompt instructions only. Nothing in the code checks them.
- **Grading is model-judged.** Haiku reads search snippets and returns won/lost. The code checks that a number and a quote are present, but it doesn't recompute the result from the number and the line. Grader accuracy has not been measured against an independent source.
- **Odds edge is not meaningful.** Only shots on target maps to a bookmaker prop market. For every other category the code falls back to the home team's match-win price.
- **Not reproducible pick by pick.** Prompts and model outputs weren't logged, and the model isn't deterministic, so historical picks can't be regenerated. Any backtest would also risk leakage: the model's training data and season-total stats can include the matches being predicted.
- **Club season unproven.** The 2026-27 club pipeline is implemented but has not produced any graded picks.
- **No automated tests.** The `scripts/verify-*.ts` files are manual checks.

## Running it

Requirements: Node 20+, a Supabase project, and an Anthropic API key. Tavily is needed for grading and lineup intel.

```bash
npm install
cp .env.example .env.local   # fill in values
# Apply the SQL files in supabase/ in the Supabase SQL editor.
# Order matters but is not documented. Start with schema.sql, picks-schema*.sql,
# then wc-*.sql, club-*.sql, and the remaining files.
npm run seed-wc-analytics          # World Cup team/player seed tables
npm run ingest-club-fixtures       # 2026-27 club fixtures (fixturedownload.com)
npm run dev
```

Trigger the pipeline by hand:

```bash
curl -H "Authorization: Bearer $FINALIZE_SECRET" http://localhost:3000/api/cron/daily
curl -X POST -H "Authorization: Bearer $FINALIZE_SECRET" http://localhost:3000/api/picks/finalize
```

### Player statistics (not included)

The FBref data used during development is not redistributed here. Download it yourself from [FBref](https://fbref.com/) and load it with the included parsers. Check FBref's terms of use before you download.

**Club season stats → `player_club_stats`.** The live system used the 2024-25 Big-5 European Leagues tables:

1. Open each of these FBref pages and select the **2024-2025** season:
   - [Standard stats](https://fbref.com/en/comps/Big5/stats/players/Big-5-European-Leagues-Stats)
   - [Shooting](https://fbref.com/en/comps/Big5/shooting/players/Big-5-European-Leagues-Stats)
   - [Passing](https://fbref.com/en/comps/Big5/passing/players/Big-5-European-Leagues-Stats)
   - [Defensive actions](https://fbref.com/en/comps/Big5/defense/players/Big-5-European-Leagues-Stats)
2. On each player table, choose **Share & Export → Get table as CSV**, and save the text as a `.csv` file.
3. Load the standard table first, because it creates the rows. The others only update columns:
   ```bash
   npm run parse-fbref-csv -- path/to/standard.csv --season 2024-25
   npm run parse-fbref-csv -- path/to/shooting.csv --season 2024-25
   npm run parse-fbref-csv -- path/to/passing.csv  --season 2024-25
   npm run parse-fbref-csv -- path/to/defense.csv  --season 2024-25
   ```
   The stat type is detected from the CSV header. See the comment at the top of `scripts/parse-fbref-csv.ts`.

**International tournament stats → `player_international_stats`.** Export the *standard stats* player table from each tournament's page on FBref (for example, [2022 World Cup](https://fbref.com/en/comps/1/2022/stats/players/2022-FIFA-World-Cup-Stats)), then load it:

```bash
npx tsx --env-file=.env.local scripts/parse-international-csv.ts path/to/wc2022.csv --tournament WC2022
```

Supported `--tournament` values are `WC2022`, `WC2018`, `Euro2024`, `Euro2021`, `Copa2024` and `Copa2021`.

The known problems with this data are listed under [Known limitations](#known-limitations).

**Alternative:** `scripts/fetch-club-stats.ts` loads the same fields from API-Football. It needs a paid plan for seasons 2025 and later.

## Repository notes

- **`archive/`** holds the one-off scripts used during the World Cup to generate picks for specific matchdays, store match stats, and mark results. They are the audit trail for how results were set, not part of the pipeline. See `archive/README.md`.
- **`docs/DEVLOG.md`** records the design decisions made during development, and the reasons given at the time.

### Changes from the private repository

This repository is a single-commit copy of the private development repository at commit `5299216` (2026-09-26), with these changes:

1. **Season label corrected in the club prompt.** In `src/lib/picks-generator.ts`, the club-season prompt described the injected player stats as "2025-26". The database those prompts read from only contained **2024-25** data. Four lines of that prompt (the stats header, two confidence notes, and the data rule) now say 2024-25. The correction was made after the World Cup picks were generated. The World Cup prompt already labelled its data 2024-25 and is unchanged. The club prompt has produced no graded picks. The original text is in commit `5299216` of the private repository.
2. **Credentials removed.** The scripts in `archive/` contained a hard-coded database URL and service-role key. They now read `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the environment. That key has been revoked.
3. **Admin fallback removed.** `/admin` used to fall back to a hard-coded email address when `ADMIN_EMAIL` was unset. With it unset, nobody has admin access now.
4. **Removed:** the FBref CSV exports, local AI-tooling configuration, design-tool exports, a test-email script, and the internal working notes. The notes are replaced by `docs/DEVLOG.md`.

## License

MIT. See `LICENSE`. Third-party data and services keep their own terms.
