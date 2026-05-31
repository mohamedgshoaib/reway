# Supabase Reliability Patterns Loading

## Skill

`supabase-reliability-patterns`

Companion skill: `supabase`

## Phase

`loading`

## Status

Started. No app code, schema, data, migration, index, RLS policy, function, trigger, publication, connection setting, Realtime setting, or other Supabase project state has been changed.

## Prior Context To Preserve

Closed before this phase:

- `supabase-common-errors`
- `supabase-known-pitfalls`
- `supabase-performance-tuning`
- `supabase-advanced-troubleshooting`
- `supabase-load-scale`

Important preserved decisions:

- Duplicate bookmarks are allowed.
- Trigger-backed private Broadcast is the canonical realtime path.
- Do not re-add `public.bookmarks` or `public.groups` to native `supabase_realtime` without real sync-regression evidence.
- Do not relax `realtime.messages` RLS or switch to public channels.
- Do not apply the old `public` default-privileges SQL proposal unless explicitly re-approved.
- Full-list dashboard reads are a future threshold guardrail, not an immediate reliability fix.
- Free-plan limits are context, not defects.

## Loaded Guidance

Project context:

- `spec/index.md`
- `spec/sessions/31-May-26-performance-supabase-audit.md`
- `spec/performance-supabase-audit/README.md`
- `spec/performance-supabase-audit/supabase-scale-reliability/README.md`
- `spec/performance-supabase-audit/supabase-scale-reliability/report-final-load-scale.md`
- `spec/performance-supabase-audit/supabase-scale-reliability/execution-load-scale.md`

Local skills:

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/supabase-reliability-patterns/SKILL.md`

Current Supabase docs checked:

- [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [How to do automatic retries with `supabase-js`](https://supabase.com/docs/guides/api/automatic-retries-in-supabase-js)
- [Diagnose HTTP API issues](https://supabase.com/docs/guides/troubleshooting/http-api-issues)
- [Realtime](https://supabase.com/docs/guides/realtime)

Relevant changelog items noticed:

- [Automatic PostgREST retries for transient errors](https://supabase.com/changelog/45071-automatic-postgrest-retries-for-transient-errors) — official clients now auto-retry transient `GET` and `HEAD` requests only.
- [Developer Update - May 2026](https://supabase.com/changelog) — public-schema Data API exposure defaults changed for new projects; keep this in mind for any future reliability fallback that adds tables or functions.
- [Realtime Settings](https://supabase.com/changelog/37041-realtime-settings) — private-channel authorization rate and connection pool usage can be tuned, but this consumes direct database connections.
- [Restricting Access on Auth, Storage, and Realtime Schemas on April 21, 2025](https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025) — avoid schema-level permission drift while evaluating reliability patterns.

## Repo Posture Relevant To Reliability

- `@supabase/supabase-js` is on `^2.106.1`, so current official automatic transient retries for idempotent reads should already be present in the web app client path.
- The app uses `@supabase/ssr` client helpers rather than direct Postgres connections for user-facing traffic.
- The extension uses plain `fetch` to hit app-owned `/api/extension/*` routes, so extension retry and fallback behavior is app-controlled rather than Supabase-SDK-controlled.

## Local Surfaces To Analyze Next

Extension capture and API transport:

- `extension/js/api.js`
- `extension/js/save-bookmarks.js`
- `extension/js/sessions.js`
- `extension/js/grabber.js`
- `extension/background.js`
- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `app/api/extension/route-adapter.ts`

Dashboard and app fallback behavior:

- `lib/supabase/queries.ts`
- `lib/library/server/reads.ts`
- `components/dashboard/content/useDashboardRealtime.ts`
- `components/dashboard/DashboardContent.tsx`
- `components/dashboard/LoadingState.tsx`

Mutation and enrichment paths where retries or idempotency could matter:

- `lib/library/server/capture.ts`
- `components/dashboard/content/useImportHandlers.ts`
- `components/dashboard/content/bookmark-enrichment.ts`

## Initial Reliability Questions

1. Which current extension and dashboard reads already degrade acceptably on transient HTTP or Supabase failures, and which fail hard?
2. Are there write paths where retry is safe, and are there write paths where retry would silently create duplicates or confusing UI?
3. Is a lightweight health-check or reachability signal worth adding before user-facing capture actions?
4. Does the dashboard need cached fallback data anywhere, or is truthful failure with recovery guidance the better fit for this product?
5. Is any offline queue justified by current product behavior, or would it add complexity without enough real outage coverage?

## Non-Goals For Loading

- No retry wrapper implementation yet.
- No circuit breaker implementation yet.
- No offline queue or IndexedDB work yet.
- No health endpoint yet.
- No schema, policy, auth, or Realtime configuration changes.
- No dashboard or extension UI copy changes.

## Next Step

Proceed to `analyzing` by tracing current failure handling, retry behavior, idempotency risks, and outage UX across extension capture, dashboard reads, and bookmark/group mutation flows.
