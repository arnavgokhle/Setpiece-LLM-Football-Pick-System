# archive/

One-off scripts that were run by hand during the 2026 World Cup. **They are not part of the pipeline.** Nothing in `src/` imports them, and the scheduled jobs never call them. They are kept as the audit trail for how World Cup picks were created and how their results were set.

Each script was written for a specific matchday, with fixture IDs, player names and in some cases results hard-coded. Running one again would write those same values to whatever database the environment points at. Don't run them against a database you care about.

| Pattern | What it did |
|---|---|
| `generate-*.mjs` | Generated and inserted picks for one matchday by calling Claude directly, outside the scheduled pipeline |
| `store-stats-*.mjs` | Inserted actual per-player match stats into `wc_match_stats`. Figures were collected from web sources such as match-centre summaries. |
| `mark-results-*.mjs` | Set picks to won/lost/void for specific matches |
| `void-r32-corners.mjs` | Voided two Round of 32 corners picks for which no official corner count could be found |

Things to know when reading these as an audit trail:

- **Human-set results.** Several `mark-results-*` scripts say in their header comments that the settlement numbers were "user-confirmed", meaning a person supplied them. Those results were not set by the automated grader in `src/lib/pipeline/grade-results.ts`.
- **Picks created after kickoff.** 14 picks in the published World Cup record have a database `created_at` later than their match's kickoff. They were inserted in two batches, at 2026-06-21 08:25 UTC and 2026-07-05 06:21 UTC. File timestamps suggest the batches correspond to `generate-jun21-ist.mjs` and `generate-r16-jul5.mjs`, but that hasn't been verified.
- **Credentials.** The scripts originally contained a hard-coded database URL and key. These now come from the environment (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). The original key has been revoked.
