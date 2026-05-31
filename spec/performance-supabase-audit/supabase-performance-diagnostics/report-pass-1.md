# Supabase Performance Tuning Report Pass 1

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`reporting`

## Executive Read

The current database is not under ordinary read pressure. Dashboard and extension read shapes are indexed enough for the live dataset, performance advisors are clean, cache hit rates are healthy, and table sizes are small.

The first real performance concern is change/write fan-out:

- Realtime dominates cumulative database time in `pg_stat_statements`.
- Bookmark visit recording is the highest app-specific cumulative query.
- Visit updates can touch many rows when a group is opened.
- Bookmark rows currently have native `postgres_changes` delivery and custom realtime broadcast behavior in the same system.

So this pass should not rush into generic index creation. The better next move is to re-analyze realtime delivery overlap and visit-update side effects.

## Ranked Findings

### P1: Realtime Delivery Model Overlap

Evidence:

- `pg_stat_statements` total time is dominated by Realtime WAL-decoding and message work.
- `public.bookmarks` and `public.groups` are in `supabase_realtime`.
- `public.bookmarks` and `public.groups` also have custom `AFTER INSERT/UPDATE/DELETE` triggers that call `realtime.broadcast_changes`.
- `useDashboardRealtime` subscribes to bookmark `postgres_changes` and bookmark broadcasts.
- Extension route code also manually sends broadcast inserts after server/admin writes.

Risk:

- Duplicate or overlapping delivery paths can inflate realtime database work.
- Bookmark updates can be delivered through more than one route.
- Visit-only updates may create noisy cross-client traffic.

Current recommendation:

- Re-analyze before execution.
- Identify which delivery path is canonical for bookmarks and groups.
- Do not remove triggers or publication membership until the dashboard, extension, and bridge contracts are mapped.

Potential execution shapes after re-analysis:

- Code-only: remove redundant manual extension broadcasts if trigger broadcasts already cover the same inserts.
- SQL proposal: narrow trigger firing with `WHEN` clauses, especially around visit-only updates.
- SQL proposal: remove a redundant realtime publication path only if native `postgres_changes` is no longer needed.

### P1: Visit Update Fan-Out

Evidence:

- `/api/bookmarks/visits` sends up to 500 IDs.
- `increment_bookmark_visits` is the highest app-specific cumulative query in `pg_stat_statements`.
- Current function shape is indexed and scoped, but it can update many bookmark rows in one call.
- `bookmarks_sync_trigger` fires after bookmark updates, so visit updates can also trigger realtime work.

Risk:

- Opening a large group can produce many row updates.
- Row updates amplify realtime work even if the user only needs local UI continuity.
- This could become visible before ordinary reads become slow.

Current recommendation:

- Re-analyze whether visit-only updates need immediate realtime delivery.
- Prefer reducing downstream realtime noise over weakening visit tracking.
- Preserve the server-only RPC and user-scoped update behavior.

Potential execution shapes after re-analysis:

- Add trigger conditions so metadata/rank/content updates still broadcast, while pure visit-count updates do not.
- Keep visit writes batched, but consider a lower cap or coalescing only if data shows large group-open batches are common.

### P2: Future Full-List Bookmark Sort Index

Evidence:

- Dashboard all-bookmarks read currently uses `bookmarks_user_id_idx` and sorts by `rank`, `order_index`, `created_at` in memory.
- This is fine at current largest-account scale.
- The documented target shape includes users with 500-1000 bookmarks.
- Group-filtered bookmark reads can use `bookmarks_user_id_group_id_rank_idx`.

Risk:

- As a user's library grows, full dashboard reads may pay avoidable sort cost.
- Adding an index too early increases write overhead across capture, enrichment, rank updates, visit updates, and imports.

Current recommendation:

- Do not execute an index yet.
- Re-analyze with planner evidence for a simulated or measured larger user shape if possible.
- If proposed, make it an approval-gated migration with rollback and advisor checks.

Potential index candidate:

- `(user_id, rank, order_index, created_at desc)` or a smaller shape derived from actual planner behavior.

### P2: Batch Create Roundtrips

Evidence:

- Import creates are concurrency-limited to 3.
- Enrichment is concurrency-limited to 2.
- Extension batch saves are sequential after previous rank-collision fixes.
- `createBookmarkRecord` and `createGroupRecord` perform rank/order lookups before insert.

Risk:

- Large imports and tab-session saves pay many network roundtrips.
- Re-introducing uncontrolled parallelism risks rank collisions and noisier writes.

Current recommendation:

- Keep current limits for now.
- Treat server-side batch create or RPC as a later design, not this pass's first execution.
- Preserve capture-first behavior and partial-failure clarity.

### P3: Remaining Payload Cleanup

Evidence:

- Dashboard initial bookmark payload is already shaped from the earlier scalability work.
- Extension bookmark list select includes `description`, but popup code does not appear to call the list endpoint in the current flow.

Risk:

- Minor payload overhead if extension list endpoint becomes active.

Current recommendation:

- Low priority.
- Only trim extension list select if re-analysis confirms it is active and the response does not need descriptions.

## Healthy Areas

- Performance advisor returned no lints.
- Cache hit rates are healthy:
  - index hit rate: 99.97%
  - table hit rate: 100.00%
- No current missing foreign-key index issue surfaced.
- No active connection pressure was visible in the snapshot.
- Dashboard list/detail payload split from the prior scalability work remains aligned with this pass.
- Duplicate bookmark policy remains preserved; no uniqueness/index proposal should reject duplicates.

## Re-Analysis Questions

1. Which realtime path should be canonical for bookmark inserts, updates, and deletes?
2. Are both native `postgres_changes` and custom broadcast triggers needed for bookmarks?
3. Do visit-only updates need realtime delivery at all?
4. Can manual extension broadcasts be removed without losing immediate dashboard sync?
5. Is a full-list bookmark sort index justified by evidence, or should it stay a future proposal?
6. Is extension bookmark-list `description` payload active enough to matter?

## Current Execution Bias

Do not start with a generic index. The likely best first execution, if re-analysis confirms it, is to reduce redundant realtime/change fan-out while preserving the dashboard and extension sync contract.

No app code, schema, data, migration, index, extension, or live Supabase state changed in this reporting phase.
