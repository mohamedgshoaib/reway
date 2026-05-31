# Supabase Performance Tuning Analysis Pass 1

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`analyzing`

## Sources Loaded

- Repo context:
  - `spec/index.md`
  - `spec/sessions/31-May-26-performance-supabase-audit.md`
  - `spec/performance-supabase-audit/README.md`
  - `spec/reports/dashboard-scalability-performance.md`
- Supabase code paths:
  - `lib/library/server/reads.ts`
  - `lib/library/server/capture.ts`
  - `lib/supabase/queries.ts`
  - `lib/dashboard/server/library-mutations.ts`
  - `app/api/extension/bookmarks/route.ts`
  - `app/api/extension/groups/route.ts`
  - `app/api/bookmarks/visits/route.ts`
  - `components/dashboard/content/useDashboardRealtime.ts`
  - `lib/bookmark-visits.ts`
  - import and extension batch-save helpers
- Official Supabase docs:
  - `Debugging and monitoring`
  - `Query Optimization`
  - `Understanding Postgres EXPLAIN Output`
- Read-only Supabase MCP:
  - `list_tables`
  - `list_extensions`
  - `get_advisors(type: performance)`
  - read-only `execute_sql` diagnostics

## Current Database Baseline

- Performance advisor: no lints.
- `pg_stat_statements`: installed in `extensions`.
- `public` live row estimates:
  - `bookmarks`: 1098 rows
  - `groups`: 127 rows
  - `notes`: 141 rows
  - `todos`: 171 rows
  - `profiles`: 23 rows
- Cache health:
  - index hit rate: 99.97%
  - table hit rate: 100.00%
- Connection snapshot:
  - 3 idle project connections
  - 1 active connection from the diagnostic query
  - no current active-query pressure found in this pass

The live dataset is still small, so current timing is more useful as shape evidence than as a stress benchmark.

## Query Shape Inventory

### Dashboard Initial Reads

`app/dashboard/page.tsx` loads the four dashboard collections through server helpers:

- bookmarks: `listBookmarksForDashboard`
- groups: `listGroupsForDashboard`
- notes: `getNotes`
- todos: `getTodos`

Important shapes:

- `bookmarks`: select scan-focused fields, order by `rank`, `order_index`, `created_at`.
- `groups`: select dashboard group fields, order by `rank`, `order_index`, `name`.
- `notes`: select compact note fields, order by `order_index`, `created_at`.
- `todos`: select compact todo fields, order by `completed`, `order_index`, `created_at`.

Representative read-only plans against the largest current bookmark account:

- Dashboard bookmark read used `bookmarks_user_id_idx` and an in-memory sort. Current execution was about 11ms for 264 rows in one run, with warm extension-shaped select around 0.8ms for the same user-sized result.
- Group-filtered bookmark read used `bookmarks_user_id_group_id_rank_idx` with incremental sort, about 1.5ms for a small group result.
- Groups used `groups_user_id_idx` plus an in-memory sort, about 4ms for 21 groups.
- Notes and todos used their user indexes plus small in-memory sorts.

First read: current table sizes do not justify urgent new indexes. The future risk is full-user dashboard reads sorting larger bookmark collections without a composite that matches `user_id + rank + order_index + created_at`.

### Extension Reads And Writes

Extension routes use server/admin helpers, not browser Supabase clients:

- `GET /api/extension/groups` calls `listGroupsForExtension`.
- `GET /api/extension/bookmarks` calls `listBookmarksForExtension`.
- `POST /api/extension/bookmarks` calls `validateGroupAccess` and `createBookmarkRecord`.
- `POST /api/extension/groups` checks duplicate group names and calls `createGroupRecord`.

Observed code shape:

- Extension bookmark list select still includes `description`, but the current extension popup code does not appear to call the bookmark list endpoint. This is likely legacy or bridge-facing surface, not a current hot path.
- Extension batch saves are intentionally sequential after the method-complexity phase, which reduces rank-collision risk but increases network roundtrips for session/link batch saves.
- `createBookmarkRecord` and `createGroupRecord` perform rank/order discovery before insert. This is acceptable at current scale, but repeated creates pay multiple roundtrips.

### Visit Recording

`recordBookmarkVisits` sends up to 500 bookmark IDs to `/api/bookmarks/visits` via `sendBeacon` or keepalive fetch.

The route calls `increment_bookmark_visits(p_user_id, p_bookmark_ids)` through the service-role client. `pg_stat_statements` shows this as the highest app-specific cumulative query:

- about 338 calls
- about 42.58ms mean execution time
- about 14.4s total execution time

The function body groups IDs and updates matching bookmark rows by primary key plus user filter. The plan shape is reasonable. The bigger concern is write fan-out: opening a group can update many bookmark rows, and each updated row can trigger realtime work.

### Realtime Pressure

The strongest first-pass signal is Realtime overhead:

- `pg_stat_statements` total time is dominated by Realtime WAL-decoding queries and realtime message inserts.
- `public.bookmarks` and `public.groups` are in the `supabase_realtime` publication.
- `public.bookmarks` and `public.groups` also have custom `AFTER INSERT/UPDATE/DELETE` triggers that call `realtime.broadcast_changes`.
- `useDashboardRealtime` subscribes to bookmark `postgres_changes` and bookmark broadcasts on the same channel.
- `useDashboardRealtime` subscribes to group broadcasts, not group `postgres_changes`.

This creates a likely duplicate or overlapping change-delivery model for bookmarks: native Postgres changes plus custom broadcasts. It also means visit-count updates can create realtime traffic even when the user-visible value may not need immediate cross-client delivery.

This needs re-analysis before any execution because changing the wrong realtime path can regress dashboard sync, extension saves, or group updates.

## Index Inventory Notes

Current indexes include:

- `bookmarks_user_id_idx`
- `bookmarks_user_id_group_id_order_index_idx`
- `bookmarks_user_id_group_id_rank_idx`
- `bookmarks_user_id_normalized_url_idx`
- `bookmarks_user_id_domain_idx`
- `bookmarks_user_visit_rank_idx`
- `groups_user_id_idx`
- `groups_user_id_name_idx`
- `groups_user_id_rank_idx`
- `notes_user_id_idx`
- `todos_user_id_idx`

Potential observations:

- `bookmarks_user_visit_rank_idx`, `groups_user_id_rank_idx`, `bookmarks_user_id_group_id_rank_idx`, `bookmarks_user_id_domain_idx`, and `bookmarks_status_idx` show low scan counts in current cumulative stats. Their sizes are tiny today, so this is not an immediate cleanup target.
- `bookmarks_user_id_group_id_rank_idx` does support group-filtered reads.
- There is no exact composite for all-user dashboard bookmark reads ordered by `rank`, `order_index`, `created_at`.
- There is no exact composite for notes/todos dashboard order, but current row counts are small and prior index cleanup intentionally removed weaker global indexes.

## First-Pass Candidate Findings

### Candidate A: Realtime Delivery Model Overlap

Bookmarks currently have both native `postgres_changes` subscription and custom broadcast triggers. Live stats show Realtime as the largest database-pressure surface, and visit recording can amplify update events.

Questions for re-analysis:

- Can bookmarks rely on one delivery path instead of two?
- Are custom broadcast triggers needed for server/admin writes, or can native `postgres_changes` cover the dashboard contract?
- Are manual `broadcastExtensionInsert` calls still needed when triggers already broadcast inserts?
- Should visit-only updates be excluded from custom broadcast or native subscription delivery?

### Candidate B: Visit Update Fan-Out

Opening a group records visits for every opened bookmark. The RPC is correct and indexed, but it is the highest app-specific query by total time in `pg_stat_statements`.

Questions for re-analysis:

- Does the UI need same-session realtime updates for `visit_count` and `last_visited_at`, or can those update after reload / next read?
- Should the route cap, batch, or coalesce large group-open visit writes more aggressively?
- Would a trigger `WHEN` clause that ignores visit-only updates reduce Realtime pressure without breaking visible behavior?

### Candidate C: Future Full-List Sort Index

Dashboard bookmark reads currently use `bookmarks_user_id_idx` and sort in memory. This is fine for the current dataset, but the locked target includes users with 500-1000 bookmarks.

Questions for re-analysis:

- Does a composite like `(user_id, rank, order_index, created_at desc)` materially improve the real read shape enough to justify write overhead?
- Does the existing `(user_id, group_id, rank)` index already cover the more important group-filtered flows?
- Should the first execution be an index proposal only, not an immediate migration?

### Candidate D: Batch Create Roundtrips

Dashboard import and extension batch saves create bookmarks one row at a time to preserve rank sequencing and simple failure handling.

Questions for re-analysis:

- Is the current intentional sequential/limited-concurrency shape still the right tradeoff?
- Is there a safe server-side batch create helper or RPC worth proposing later?
- Would batching conflict with the capture-first principle or make partial failures worse?

### Candidate E: Low-Priority Payload Cleanup

The dashboard bookmark payload was already shaped in an earlier scalability pass. Remaining payload questions are smaller:

- Extension bookmark list select includes `description`, but the endpoint does not appear hot in popup code.
- Detail fields are already excluded from the dashboard initial select.

This is not a first execution candidate unless re-analysis finds active extension consumers.

## Non-Issues In Pass 1

- No current performance advisor lints.
- No cache-hit concern.
- No active connection pressure from the read-only snapshot.
- No missing foreign-key index surfaced in the current schema inventory.
- No evidence yet that notes/todos need new order composites at current scale.

## Next Step

Move to `reporting` with a ranked first-pass report. The likely top concern is Realtime/write fan-out, not ordinary dashboard read latency.
