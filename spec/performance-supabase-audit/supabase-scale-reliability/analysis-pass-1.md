# Supabase Load Scale Analysis Pass 1

## Status

`analyzing`

## Evidence Collected

### Current Project Footprint

- Postgres version: `17.6`.
- Database size: `18 MB`.
- `max_connections`: `60`.
- `superuser_reserved_connections`: `3`.
- `max_wal_senders`: `5`.
- `max_replication_slots`: `5`.
- `default_transaction_read_only`: `off`.
- Performance advisors: no lints.

### Current Table Scale

Largest current relations:

| Table | Estimated / live rows | Total size | Notes |
| --- | ---: | ---: | --- |
| `public.bookmarks` | about `1.1k` | `1864 kB` | Primary app growth table. |
| `public.groups` | about `127` | `152 kB` | Small today; reorder writes are visible in stats. |
| `public.notes` | about `141` | `104 kB` | Small. |
| `public.todos` | about `171` | `96 kB` | Small. |
| `realtime.messages_2026_05_29` | about `1.5k` | `2512 kB` | Realtime internal table, not app domain data. |

`storage.objects` currently has no objects by bucket. No Edge Functions are deployed.

### Connection Posture

Current observed database connections are low:

- `postgrest`: `5` idle authenticator connections.
- Realtime: `2` idle plus `1` active replication connection.
- Management/API/exporter/cron/internal jobs account for the remaining small sample.

No direct app-side Postgres connection string or ORM pool usage was found in code. The app uses Supabase client libraries and PostgREST:

- `@supabase/ssr` server/browser clients.
- `@supabase/supabase-js` service-role admin client for server-only routes/actions.
- No `DATABASE_URL`, pooler, Prisma, Drizzle, or direct `pg` usage found in app code.

This means Supavisor tuning is not an immediate app-code lever unless the deployment adds direct Postgres clients later. The relevant connection pool today is mostly Supabase-managed PostgREST/Auth/Realtime behavior plus platform plan limits.

### Read Shapes

Dashboard startup reads full per-user surfaces:

- `getBookmarks()` loads all dashboard bookmark rows.
- `getGroups()` loads all groups.
- `getNotes()` loads all notes.
- `getTodos()` loads all todos.
- `app/dashboard/page.tsx` runs those alongside `getUser()` in `Promise.all`.

The bookmark dashboard select is already trimmed away from heavy detail fields, but it is still an unpaginated whole-list read sorted by:

1. `rank`
2. `order_index`
3. `created_at`

Extension reads:

- group list is full per user and cached in extension local storage.
- bookmark fallback list is full per user or per group and has a smaller select list.

### Write Burst Shapes

Web import:

- Creates missing groups with `Promise.all`.
- Creates bookmarks through `runWithConcurrency(..., 3, ...)`.
- Enriches created bookmarks in the background with concurrency `2`.

Extension session capture:

- `saveBookmarkBatch` intentionally sends bookmark saves sequentially.
- This is lower DB burst pressure than parallel extension writes, at the cost of longer large-session save time.

Single bookmark creation:

- `createBookmarkRecord` performs order/rank discovery, insert, and return select.
- Duplicate bookmarks remain allowed by product decision.

Visit updates:

- `increment_bookmark_visits` appears in `pg_stat_statements` with moderate total time and was already handled as a deferred freshness-sensitive topic in the performance phase.

### Realtime / Replication Posture

- Native `public.bookmarks` / `public.groups` Postgres Changes publication was removed in the previous phase.
- Current replication slot is the active Realtime messages slot.
- `pg_stat_replication` shows Realtime streaming, async, with no lag values in the sample.
- The current canonical app sync path remains trigger-backed private Broadcast.

### Storage / Edge Scale

- No Storage objects are present.
- No Edge Functions are deployed.
- Storage CDN, image transform, and Edge Function regional placement are non-candidates for current execution.

## Preliminary Findings

### LS-1: Full-list dashboard reads are acceptable now but define the first real per-account ceiling

Current row counts are tiny, and no advisor/index evidence points to immediate DB pressure. Still, the user-facing scale ceiling is architectural: each dashboard open fetches the whole library, notes, todos, and groups. This is consistent with the current product and avoids the virtualization path that previously regressed UX, but it should be treated as the first future load boundary.

Likely threshold to watch: accounts moving from low thousands of bookmarks into tens of thousands, especially on Free/Nano compute and mobile/slow networks.

### LS-2: Import flow has good local throttles; group creation may still burst if an import contains many missing folders

Bookmark creation and enrichment are bounded at `3` and `2`, respectively. Missing group creation still uses `Promise.all`, which is fine for normal browser-export folder counts but can spike if a large import has many unique folder names.

This is a possible low-risk execution candidate later if re-analysis confirms it is worth doing.

### LS-3: Extension session capture is scale-friendly to the database but may be slow for very large tab sessions

Sequential extension saves avoid DB/API bursts. This is a good scale posture for Free/Nano constraints, and changing it to parallel writes is not recommended without a stronger product need and retry/backoff plan.

### LS-4: Supavisor/read-replica/compute/storage/edge scale levers are not current code execution candidates

The current footprint and architecture do not justify applying infrastructure changes:

- Read replicas are paid-plan, async, and not useful for same-request read-after-write dashboard flows.
- Supavisor is not directly configured in app code because the app uses Supabase HTTP clients rather than direct Postgres clients.
- Compute/disk upgrades are plan/cost decisions, not repo patches.
- Storage CDN and Edge Functions have no current usage surface.

### LS-5: Realtime scale posture improved materially in prior phases

Broadcast-only client handling, trigger-backed private Broadcast, and removal from native `supabase_realtime` reduced duplicated change delivery. Current first-pass evidence does not support more Realtime scale execution.

## Re-Analysis Focus

- Verify whether missing-group import `Promise.all` is worth changing or should remain a documented future guard.
- Estimate practical per-user library thresholds for current full-list dashboard reads.
- Re-check whether any read path can be safely narrowed without reopening the previously rejected virtualization path.
- Decide whether the first report should recommend an execution candidate or close this skill with scale guardrails only.
