# Supabase Performance Tuning Analysis Pass 2

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`re-analyzing`

## Re-Analysis Focus

This pass validates the first-pass claim that Realtime/change fan-out is more important than ordinary read/index tuning.

## Additional Evidence

### Supabase Realtime Guidance

Official Supabase docs say database change subscriptions have two paths:

- Broadcast: recommended for scalability and security.
- Postgres Changes: simpler, but less scalable.

The docs also describe Postgres Changes as bottleneck-prone at scale because each change must be authorized for subscribed users, and database changes are processed in ordered fashion. This aligns with Reway's live `pg_stat_statements`, where Realtime WAL/change-processing queries dominate cumulative database time.

Relevant docs:

- `https://supabase.com/docs/guides/realtime/subscribing-to-database-changes`
- `https://supabase.com/docs/guides/realtime/postgres-changes`

### Current Reway Delivery Paths

Current live schema:

- `public.bookmarks` is in `supabase_realtime`.
- `public.groups` is in `supabase_realtime`.
- Both publication entries publish inserts, updates, deletes, and truncates.
- `bookmarks_sync_trigger` fires `AFTER INSERT OR DELETE OR UPDATE` and calls `notify_bookmarks_changes`.
- `groups_sync_trigger` fires `AFTER INSERT OR DELETE OR UPDATE` and calls `notify_groups_changes`.
- `realtime.messages` has an authenticated policy allowing users to receive only `user:<auth.uid()>:%` topics.

Current app code:

- Bookmark channel listens to native `postgres_changes` and `broadcast` events.
- Group channel listens only to `broadcast` events.
- Extension routes call `broadcastExtensionInsert` manually after bookmark/group creates.
- Extension popup also bridges a saved bookmark into the dashboard page through `broadcastBookmark` / `reway_broadcast_bookmark`.

Refinement:

- Groups are already broadcast-only at the client level, but `public.groups` is still in the native Postgres Changes publication.
- Bookmarks are mixed-mode: native Postgres Changes plus broadcast triggers plus manual extension broadcasts plus extension content-script bridge.
- The `broadcastExtensionInsert` calls are likely redundant now that trigger broadcasts exist, but their historical query-cost signal is tiny compared with native Realtime WAL polling.

### Visit Update Behavior

Current route:

- `recordBookmarkVisits` sends up to 500 IDs through `/api/bookmarks/visits`.
- Route calls `increment_bookmark_visits(p_user_id, p_bookmark_ids)` through service-role Supabase.
- RPC groups duplicate IDs and updates matching bookmarks for the verified user.

Current live stats:

- `increment_bookmark_visits` is the highest app-specific cumulative query in `pg_stat_statements`.
- `bookmarks` has far more updates than other app tables.
- Because bookmarks are published and have update triggers, visit-count writes can create realtime traffic.

Important UX constraint:

- The dashboard does not currently do an obvious local visit-count increment when recording visits.
- If visit-only realtime delivery is suppressed without a client-side fallback, `visit_count`, `last_visited_at`, and Most Visited ordering may be stale until reload or another data refresh.
- That may be acceptable, but it is a product/UX choice, not a purely invisible performance patch.

## Refined Findings

### Finding 1: Native Postgres Changes Is The Main Performance Lever

The strongest performance lever is not removing manual broadcasts. It is moving fully to the Broadcast model and removing native Postgres Changes from this app path.

Why:

- Supabase recommends Broadcast for scalable database change delivery.
- Reway already has database triggers that broadcast bookmark/group changes.
- Group client code already relies on broadcasts only.
- Bookmark client code can likely be made broadcast-only.
- Removing tables from `supabase_realtime` would reduce the native Postgres Changes path more directly than deleting app-level manual broadcast sends.

Risk:

- This is a live Supabase state change and must be execution-approved separately.
- It needs browser validation of dashboard sync, extension saves, updates, deletes, group changes, and reload behavior.
- If trigger broadcasts are misconfigured, removing Postgres Changes would expose that immediately.

Likely execution shape:

1. Code patch: remove bookmark `postgres_changes` handler from `useDashboardRealtime`, leaving broadcast handlers.
2. SQL proposal: `alter publication supabase_realtime drop table public.bookmarks;` and `alter publication supabase_realtime drop table public.groups;`.
3. Verification: confirm publication no longer includes those tables, dashboard still receives trigger broadcasts, extension saves still appear, and group/bookmark updates/deletes sync.

Rollback:

- Re-add the tables to `supabase_realtime`.
- Restore the bookmark `postgres_changes` handler if needed.

### Finding 2: Visit-Only Updates Need A Separate Freshness Decision

Skipping realtime for pure visit updates would reduce noise, but it changes freshness semantics.

Options:

- Keep visit updates broadcasted for now. This preserves current behavior while still removing native Postgres Changes.
- Add a trigger `WHEN` clause or function guard later to skip pure visit-only updates, paired with a small local UI update for the current dashboard state.
- Defer visit-noise suppression until after the broadcast-only migration has been validated.

Current recommendation:

- Do not combine visit-only suppression with the first execution.
- First, remove the redundant native Postgres Changes path.
- Then measure or inspect whether visit updates are still a problem under Broadcast-only delivery.

### Finding 3: Manual Extension Broadcasts Are Cleanup, Not The Main Win

`broadcastExtensionInsert` is probably redundant because:

- database triggers broadcast inserts;
- extension popup also sends a local dashboard bridge message after save;
- dashboard insert handlers already dedupe by bookmark/group ID.

But:

- historical `pg_stat_statements` does not show these manual broadcasts as the real pressure source;
- removing them is a small code-only cleanup, not the core performance improvement.

Recommendation:

- Keep as a lower-risk follow-up after the canonical realtime path is chosen.
- Or fold into the broadcast-only execution if the patch is already touching extension sync.

### Finding 4: Full-List Sort Index Still Does Not Beat Realtime Work

Re-running representative plans showed all-bookmark dashboard reads still use `bookmarks_user_id_idx` plus in-memory sort. This is not ideal for a future large user, but current timings and sizes do not justify starting with an index.

Recommendation:

- Keep the future index as a proposal candidate only.
- Do not add it before resolving the Realtime path.

### Finding 5: Extension Bookmark GET Payload Is Low Priority

The extension bookmark GET route is used as fallback for open-group when the dashboard cannot provide direct URLs. The normal dashboard path passes URLs to the extension worker, so the endpoint is not a hot popup-startup path.

Recommendation:

- Do not prioritize trimming `description` from `EXTENSION_BOOKMARK_SELECT` in this pass unless execution needs a tiny code-only cleanup at the end.

## Refined Execution Queue

1. Preferred first execution candidate: migrate dashboard realtime to Broadcast-only and propose removing `bookmarks` / `groups` from the native `supabase_realtime` publication.
2. Second candidate: remove redundant manual `broadcastExtensionInsert` calls if trigger broadcasts prove reliable.
3. Deferred candidate: suppress visit-only broadcasts only with an explicit freshness plan.
4. Deferred candidate: all-bookmarks sort index proposal if larger-account read evidence starts to matter.
5. Low-priority candidate: extension bookmark GET payload trim.

## Execution Boundary

No app code, schema, data, migration, index, publication, trigger, extension, or Supabase state changed during re-analysis.
