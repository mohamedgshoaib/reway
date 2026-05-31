# Supabase Performance Tuning Final Report

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`final reporting`

## Summary

Reway's current ordinary Supabase reads are healthy. The database is small, cache hit rates are strong, performance advisors are clean, and dashboard/extension reads use reasonable user-scoped indexes.

The main performance issue is not a missing read index. It is realtime/change fan-out:

- Supabase Realtime work dominates cumulative database time.
- Reway currently has both native Postgres Changes publication membership and database-trigger Broadcast delivery for `bookmarks` / `groups`.
- Bookmarks additionally subscribe to both `postgres_changes` and Broadcast events in the dashboard.
- Visit recording is the highest app-specific cumulative query and can update many bookmark rows when a group is opened.

Supabase's current guidance recommends Broadcast over Postgres Changes for scalable database-change delivery, and Reway already has the private Broadcast infrastructure in place.

## Final Ranking

### P1: Move Dashboard Sync To Broadcast-Only

Current state:

- `public.bookmarks` and `public.groups` are in the native `supabase_realtime` publication.
- `bookmarks_sync_trigger` and `groups_sync_trigger` broadcast changes through `realtime.broadcast_changes`.
- Dashboard bookmark realtime listens to both native `postgres_changes` and Broadcast.
- Dashboard group realtime listens to Broadcast only.

Why this matters:

- Native Postgres Changes is the larger scalable-path concern.
- It requires database-side change authorization work per subscribed user.
- Reway already has private per-user Broadcast channels and RLS on `realtime.messages`.

Recommended execution:

1. Code-only prep: remove bookmark `postgres_changes` subscription from `useDashboardRealtime`, leaving bookmark Broadcast handlers as canonical.
2. Approval-gated live SQL: remove `public.bookmarks` and `public.groups` from `supabase_realtime`.
3. Verification: dashboard receives bookmark/group insert/update/delete broadcasts after normal dashboard and extension actions.

Do not remove the trigger broadcasts in this phase. They are the desired canonical path.

### P1: Preserve Visit Tracking, Defer Visit-Only Suppression

Current state:

- `/api/bookmarks/visits` calls `increment_bookmark_visits`.
- That RPC is the top app-specific cumulative query in `pg_stat_statements`.
- Visit writes can trigger realtime work because they update bookmark rows.

Why not patch first:

- Suppressing visit-only updates from realtime can change visible freshness.
- The dashboard does not currently perform an obvious local visit-count/last-visited update to compensate.
- Most Visited ordering may become stale until reload or another refresh.

Recommended execution:

- Keep visit writes as-is for the first Broadcast-only migration.
- Reassess after native Postgres Changes is removed.
- If visit traffic remains a problem, design a small local freshness update before skipping visit-only broadcasts.

### P2: Remove Redundant Manual Extension Broadcasts

Current state:

- Extension routes call `broadcastExtensionInsert`.
- Database triggers already broadcast inserts.
- Extension popup also bridges saved bookmarks into the dashboard content script.
- Dashboard handlers dedupe rows by ID.

Why lower priority:

- This is probably redundant, but historical stats do not show it as the main pressure source.
- It is best done after Broadcast-only is proven reliable.

Recommended execution:

- Treat as a follow-up code cleanup after the canonical realtime path is verified.

### P2: Keep Full-List Bookmark Sort Index As A Future Proposal

Current state:

- All-bookmark dashboard reads use `bookmarks_user_id_idx` and an in-memory sort by `rank`, `order_index`, `created_at`.
- Current account sizes are small enough that this is acceptable.
- Group-filtered reads already have `bookmarks_user_id_group_id_rank_idx`.

Why not now:

- Additional indexes increase write overhead for capture, import, enrichment, reorder, and visit updates.
- Realtime/write fan-out is a stronger issue today.

Future candidate:

- Consider a composite all-user order index only if larger-account plans or measurements justify it.

### P3: Extension Bookmark GET Payload Trim

Current state:

- `EXTENSION_BOOKMARK_SELECT` includes `description`.
- Normal popup startup does not appear to call this endpoint.
- The open-group bridge usually sends direct URLs from the dashboard to the extension worker; the endpoint is fallback.

Recommendation:

- Low priority.
- Worth doing only as a small cleanup after more important realtime work is closed.

## Execution Queue

1. Code-only prep: make dashboard bookmark realtime Broadcast-only.
2. Approval-gated SQL proposal: remove `public.bookmarks` and `public.groups` from `supabase_realtime`.
3. Verify dashboard/extension sync behavior.
4. Optional code cleanup: remove redundant manual `broadcastExtensionInsert` if trigger broadcasts cover inserts.
5. Deferred: visit-only broadcast suppression with explicit client freshness behavior.
6. Deferred: all-bookmarks sort index proposal.
7. Low priority: extension bookmark GET payload trim.

## SQL Proposal Shape

This is not applied yet. It is an execution-phase proposal only.

```sql
alter publication supabase_realtime drop table public.bookmarks;
alter publication supabase_realtime drop table public.groups;
```

Verification SQL:

```sql
select
  pubname,
  schemaname,
  tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('bookmarks', 'groups');
```

Expected result after execution: zero rows.

Rollback SQL:

```sql
alter publication supabase_realtime add table public.bookmarks;
alter publication supabase_realtime add table public.groups;
```

## Verification Plan

After any approved execution:

- `pnpm typecheck`
- `pnpm build`
- read-only MCP verification of publication membership if SQL is applied
- browser or manual verification for:
  - dashboard-created bookmark appears through realtime path
  - extension-created bookmark appears in open dashboard
  - bookmark update/delete syncs
  - group create/update/delete syncs
  - visit recording still succeeds

## Explicit Non-Goals

- Do not add a unique bookmark URL constraint.
- Do not remove duplicate-bookmark support.
- Do not add a generic index before the realtime path is addressed.
- Do not suppress visit-only broadcasts until freshness behavior is decided.
- Do not remove trigger broadcasts in this phase.

## Execution Summary

Executed:

- Dashboard bookmark realtime moved to private Broadcast-only client handling.
- `public.bookmarks` and `public.groups` removed from native `supabase_realtime` via migration `20260531145415_drop_realtime_publication_tables`.
- Redundant manual extension route insert broadcasts removed.
- Extension fallback bookmark GET payload trimmed by removing unused `description`.

Deferred:

- Visit-only broadcast suppression needs a client freshness plan before execution.
- Full-list bookmark sort index needs larger-account evidence before accepting write overhead.

## Status

Execution complete from a code/database-change standpoint. Browser/manual realtime sync validation remains the validation gap.
