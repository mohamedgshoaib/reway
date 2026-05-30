# Dashboard Scalability Decisions

Status: decision record, not a benchmark report.

Scope: dashboard scalability for 500+ concurrent users, each with 50-100 groups and 500-1000 bookmarks.

Purpose: memory-loss guardian for future agents. If conversation context is compacted, this file is the source of truth for the current dashboard scalability decisions. Do not reopen settled decisions unless new code, live DB evidence, or user direction contradicts them.

Use with: `spec/index.md`, latest `spec/sessions/*`, and `spec/skills.md`.

Non-negotiables:

- Preserve user-scoped auth boundaries.
- Preserve instant capture: saves must not block on enrichment.
- Preserve duplicate bookmarks: duplicates are allowed by design.
- Preserve visual scanning: favicons stay in the initial bookmark payload.
- Before implementing virtualization, load `.agents/skills/dnd-kit-react` and `.agents/skills/tanstack-virtual`.
- Before implementing Supabase schema/security changes, use the `supabase` skill and inspect live definitions first.

Last material validation:

- Repository read: current dashboard, extension, import, realtime, and mutation code.
- Live Supabase MCP validation on 29-May-26: inspected production table definitions, RLS policies, functions, grants, triggers, advisors, indexes, row estimates, and representative query plans.
- Production migration applied: `20260529013215_harden_dashboard_functions_and_indexes`.
- Current advisor state: performance lints are clear; security lints only show Auth leaked-password protection disabled, accepted as a Supabase free-plan limitation.

## Current Baseline

- Dashboard data loads in parallel through `Promise.all` in `app/dashboard/page.tsx`.
- Import flow limits writes to 3 concurrent creates and 2 concurrent enrichment jobs in `components/dashboard/content/useImportHandlers.ts`.
- Bookmark and group reorder now writes one `rank` update for the moved item; `order_index` remains frozen as rollback data.
- `BookmarkBoard` and `FolderBoard` already use dnd-kit `DragOverlay`, which is required for virtualized drag surfaces.
- `BookmarkBoard` still renders all visible bookmarks and currently passes `description`, `image_url`, and `og_image_url` into display data.
- Duplicate bookmarks are allowed by product design.

Important file anchors:

- Dashboard load: `app/dashboard/page.tsx`.
- Bookmark reads: `lib/library/server/reads.ts`.
- Server mutations/reorder: `lib/dashboard/server/library-mutations.ts`.
- Fractional rank helpers: `lib/ranking.ts`.
- Visit recording route: `app/api/bookmarks/visits/route.ts`.
- Import/enrichment concurrency: `components/dashboard/content/useImportHandlers.ts`.
- Realtime merge behavior: `components/dashboard/content/useDashboardRealtime.ts`.
- Main board surface: `components/dashboard/BookmarkBoard.tsx`.
- Folder board surface: `components/dashboard/FolderBoard.tsx`.

## Live Database Evidence

Validated live row estimates at the time of MCP access:

- `bookmarks`: about 935 rows.
- `groups`: about 105 rows.
- `notes`: about 135 rows.
- `todos`: about 161 rows.

Validated indexes before cleanup:

- `bookmarks_user_id_idx`.
- `bookmarks_user_id_group_id_order_index_idx`.
- `bookmarks_user_id_group_id_rank_idx`.
- `bookmarks_user_id_normalized_url_idx` (intentionally non-unique).
- `bookmarks_user_visit_rank_idx`.
- `idx_bookmarks_visit_count`.
- `groups_user_id_idx`.
- `groups_user_id_rank_idx`.
- `groups_user_id_name_idx`.
- `notes_user_id_idx`, `notes_created_at_idx`.
- `todos_user_id_idx`, `todos_created_at_idx`, `todos_completed_idx`.

Validated production state after `20260529013215_harden_dashboard_functions_and_indexes`:

- `increment_bookmark_visits` is `SECURITY INVOKER`, has pinned `search_path`, is not executable by `anon` or `authenticated`, and remains executable by `service_role`.
- `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes` keep required trigger behavior, have pinned `search_path`, are not executable by `anon` or `authenticated`, and remain executable by `service_role`.
- `bump_bookmark_open(uuid, uuid)` was dropped because it was dead legacy surface and referenced removed columns.
- `idx_bookmarks_visit_count`, `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx` were dropped.
- `bookmarks_user_visit_rank_idx` was preserved.
- Trigger bindings for auth user creation, bookmark changes, and group changes remain intact.
- `20260529050306_add_fractional_ranks` added `rank text collate "C"` to bookmarks and groups, backfilled all live rows, added rank-length checks, and created `(user_id, group_id, rank)` / `(user_id, rank)` indexes.

Representative live plans:

- Dashboard bookmark read used `bookmarks_user_id_idx`, about `0.67ms` for 248 rows.
- Extension all-bookmarks read used `bookmarks_user_id_idx`, about `0.54ms` for 248 rows.
- Extension group-filtered read used `bookmarks_user_id_group_id_order_index_idx`, about `0.22ms` for 43 rows.
- Post-rank bookmark group read used `bookmarks_user_id_group_id_rank_idx`, about `0.35ms` for 227 rows.
- Post-rank group read used `groups_user_id_idx` plus an in-memory sort for the current largest 22-group user; keep `groups_user_id_rank_idx` for the locked 50-100 group target shape.
- Duplicate check used `bookmarks_user_id_normalized_url_idx`, about `1.62ms`.
- Notes/todos reads used user indexes and sorted small per-user result sets.

## Locked Decisions

### 1. Duplicate Bookmarks

Decision: duplicates are allowed. Do not add a unique `(user_id, normalized_url)` constraint.

Why:

- Reway intentionally allows the same normalized URL to be saved more than once in different groups, sessions, or contexts.
- Existing duplicate rows are expected state, not corruption.

Outcome:

- Keep `bookmarks_user_id_normalized_url_idx` non-unique.
- Duplicate UI can still detect and display duplicates, but the database should not reject them.

### 2. Indexes

Decision:

- Keep `bookmarks_user_visit_rank_idx`.
- Remove `idx_bookmarks_visit_count`; no global/admin visit analytics feature is planned.
- Drop `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx` in the same migration sprint unless live plans reveal an unrecorded query.

Why:

- `bookmarks_user_visit_rank_idx` supports Reway's Most Visited / visit-aware ranking mechanic.
- `idx_bookmarks_visit_count` supports a global/admin visit leaderboard; no such feature is planned.
- The notes/todos single-column indexes are weak shapes for user-scoped dashboard reads. If notes/todos ever need indexed recency or pending filters, use user-scoped composites/partials instead, not the current global shapes.

Outcome:

- Keep the index that supports product retrieval.
- Avoid write overhead from a global visit-count index that has no planned query.
- Reduce write/planning overhead from indexes that do not match Reway's user-scoped query model.

Verification requirement:

- Confirm the actual Most Visited query includes `user_id` and can use `bookmarks_user_visit_rank_idx`. If the query omits `visit_count > 0`, verify with `EXPLAIN`; adjust the query or index shape only from evidence.

### 3. Security Definer Functions

Decision: inspect live function definitions before writing migrations. Then revoke direct client execution from privileged/internal functions and remove unnecessary `SECURITY DEFINER` exposure.

Known local correction:

- Older report data named `bump_bookmark_open`.
- Current generated types and route code show the visit RPC as `increment_bookmark_visits`.
- `app/api/bookmarks/visits/route.ts` authenticates the user server-side and calls `increment_bookmark_visits` through `supabaseAdmin`.
- Supabase docs separate two controls: service keys bypass RLS, while function access is controlled by normal `EXECUTE` privileges. Do not treat service-role RLS bypass as permission to skip function grants.

Target direction:

- `increment_bookmark_visits`: keep server-only. Target `SECURITY INVOKER`, keep `p_user_id`, revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`, and preserve or grant `EXECUTE` for `service_role` / `postgres` as needed. The server route injects a verified user id; clients must not call this function directly.
- `handle_new_user`: trigger helper. Keep `SECURITY DEFINER` only if required by the trigger write path. Revoke direct client execution. Do not move it to a private schema until trigger recreation has been tested.
- `notify_bookmarks_changes` / `notify_groups_changes`: trigger helpers. Keep trigger behavior, revoke direct client execution, set safe search paths, and audit channel/payload scoping. Do not add `auth.uid()` guards because server/admin writes and background jobs may have no client JWT.

Outcome:

- Advisor warnings should clear.
- Privileged functions remain usable internally.
- Clients cannot call privileged RPCs directly.

Final target for `increment_bookmark_visits`:

- Use `SECURITY INVOKER` because the trusted server route calls through the service-role client, and service-role bypasses RLS while still needing normal function `EXECUTE` privilege.
- Keep `p_user_id` because the service-role call is not the end-user identity source; the route has already authenticated the real user and supplies `user.id`.
- Do not replace `p_user_id` with `auth.uid()` inside this function unless the call path changes away from `supabaseAdmin.rpc`; service-role/background contexts can lack the end-user JWT context and risk zero-row updates.
- The function body must still scope the update with `where user_id = p_user_id and id = any(p_bookmark_ids)`.
- Revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`; ensure `service_role` and `postgres` can still execute.
- Keep the function in `public` unless live schema policy requires otherwise; the risk is client execution, not the schema itself once the function is invoker and client roles are revoked.
- Do not write the migration from stale assumptions; inspect `pg_get_functiondef` and current privileges first.

Safe migration shape for `increment_bookmark_visits` after live inspection:

```sql
create or replace function public.increment_bookmark_visits(
  p_user_id uuid,
  p_bookmark_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'increment_bookmark_visits: p_user_id must not be null';
  end if;

  update public.bookmarks
  set
    visit_count = visit_count + 1,
    last_visited_at = now()
  where user_id = p_user_id
    and id = any(p_bookmark_ids);
end;
$$;

revoke execute on function public.increment_bookmark_visits(uuid, uuid[]) from public;
revoke execute on function public.increment_bookmark_visits(uuid, uuid[]) from anon;
revoke execute on function public.increment_bookmark_visits(uuid, uuid[]) from authenticated;
grant execute on function public.increment_bookmark_visits(uuid, uuid[]) to service_role;
```

Verification after migration:

- Browser/client direct RPC with anon or authenticated role must fail with permission denied.
- `POST /api/bookmarks/visits` with a valid user session must still increment only that user's bookmark IDs.
- A valid user session passing another user's bookmark IDs must update zero rows because of `where user_id = p_user_id`.
- Empty ID arrays should be a no-op.
- Function metadata should show `prosecdef = false`, pinned `search_path`, no `EXECUTE` grant for client roles, and `EXECUTE` available to `service_role`.

### 4. Payload Shaping

Decision: split initial bookmark list data from preview/detail data.

Initial list fields should stay focused on scanning, grouping, sorting, and status:

- `id`, `url`, `normalized_url`, `domain`, `title`, `favicon_url`.
- `group_id`, `user_id`, `created_at`, `order_index` or future `rank`.
- `status`, `is_enriching`, `last_visited_at`, `visit_count`.

Preview/detail fields should load on demand:

- `description`, `og_image_url`, `image_url`, `screenshot_url`, `last_fetched_at`, `error_reason`.

Constraints:

- Keep `favicon_url` in the initial payload because it is a core visual scanning aid.
- Keep `normalized_url` until duplicate UI, import duplicate checks, and display-title logic are audited.
- Keep `status` and `is_enriching` in the initial payload.
- Keep `og_image_url` in card-view payload if cards render thumbnails; otherwise fetch it with preview/detail.
- Keep `last_fetched_at` only if stale-refresh UI needs it without opening detail.
- Audit `BookmarkBoard`, card view, preview, edit sheet, search, and realtime merge behavior before changing the select list.

Outcome:

- Smaller initial dashboard payload.
- Preview/detail opens with a targeted extra fetch.
- Less RSC/client prop serialization at high bookmark counts.

Audit status on 29-May-26:

- Initial render surfaces do not need `description`, `image_url`, `og_image_url`, `screenshot_url`, `last_fetched_at`, or `error_reason` for normal list/card/folder paint.
- `SortableBookmark` no longer receives `description`; list rows do not render descriptions.
- `SortableBookmarkCard` does not currently render thumbnails; card view only uses title, URL, domain, favicon, status/enriching state, group/date metadata, and actions.
- `SortableBookmarkIcon`, `BookmarkDragOverlay`, and `FolderDragOverlay` only need title, URL, normalized URL for display-title fallback, favicon, created date, and status/enriching state.
- `QuickGlanceDialog` is the main detail consumer of `description`, `og_image_url`, and `image_url`; it should fetch full bookmark detail before or when opening if these fields leave the initial payload.
- `BookmarkEditSheet` needs `description` and `favicon_url` when editing; edit open should receive full detail or fetch it before rendering editable fields.
- Dashboard search and group-open filtering currently include `bookmark.description` in the haystack in `useDashboardDerived` and `useOpenGroup`, but product direction is to make search title+URL only. Description is too broad/noisy for the dashboard search contract.
- Realtime merge in `useDashboardRealtime` overlays incoming rows onto existing rows; it can preserve detail fields already present, but must tolerate initial rows that do not have detail-only keys.
- Enrichment paths in `useBookmarkActions`, `useImportHandlers`, and command-bar add flow update detail fields after create/refresh; list rows can carry these fields opportunistically after enrichment even if the initial server payload is slim.
- Undo/restore paths currently keep full `BookmarkRow` snapshots for deleted bookmarks and group deletes. If initial state is slim, restoring a never-opened bookmark will only restore the slim fields unless restore paths fetch or preserve detail fields separately.
- Export uses only URL, title, and group. Duplicate cleanup uses `normalized_url` and URL. Most Visited uses `visit_count`, `last_visited_at`, and `created_at`.

Field matrix:

| Field | Current consumers | Initial-payload classification | Notes |
| --- | --- | --- | --- |
| `id` | All dashboard state, selection, DnD, mutations, realtime | Keep | Stable identity for all UI and mutation paths. |
| `url` | Render, open, export, search, duplicate fallback, edit, restore | Keep | Required for open/copy/export and URL display. |
| `normalized_url` | Display-title fallback, duplicate sheet, duplicate import checks | Keep | Keep until duplicate UI and display fallback are refactored. |
| `domain` | Stored value, same-domain favicon updates | Keep for now | Current render recomputes domain from URL, but mutation paths use stored domain for batch favicon update. |
| `title` | Render, search, export, edit, preview | Keep | Core scan field. |
| `favicon_url` | Render, drag overlay, preview fallback, edit, enrichment | Keep | Core visual scanning aid. |
| `group_id` | Filtering, counts, DnD buckets, export, edit, move/undo | Keep | Core organization field. |
| `user_id` | Realtime/user-scoped state and row shape | Keep | Keep until client row type is split from DB row type. |
| `created_at` | Sort fallback, display date, Most Visited tiebreak, restore | Keep | Core order/display field. |
| `order_index` | Sort, DnD reorder, import insert ordering, undo | Keep | Replaced later by `rank`, not by payload shaping. |
| `status` | Pending/failed UI, refresh affordance, enrichment | Keep | Needed for visible loading/failed states. |
| `is_enriching` | Loading UI, refresh disabling, enrichment workers | Keep | Needed for visible feedback and action guards. |
| `last_visited_at` | Most Visited ranking | Keep | Needed for client-side Most Visited until server-side query split exists. |
| `visit_count` | Most Visited membership/ranking | Keep | Product retrieval mechanic. |
| `description` | Current search/open-group filtering, preview, edit, enrichment/restore | Detail-only candidate | Remove from initial payload and intentionally change dashboard search/Open Group filtering to title+URL only. |
| `og_image_url` | QuickGlance preview image, enrichment/restore | Detail-only candidate | Card view does not render thumbnails today. |
| `image_url` | QuickGlance preview fallback, enrichment/restore | Detail-only candidate | Same as `og_image_url`. |
| `screenshot_url` | No active dashboard consumer found | Detail-only / remove from initial | Keep DB column; do not ship in initial payload until a surface uses it. |
| `last_fetched_at` | Enrichment bookkeeping and failure timestamp fallback | Detail-only / opportunistic state | Needed in enrichment result handling, not initial paint. |
| `error_reason` | Enrichment failure state, no visible list/detail consumer found | Detail-only / opportunistic state | Keep available for future failure detail UI, not initial paint. |

Recommended first implementation cut:

- Remove `description`, `og_image_url`, `image_url`, `screenshot_url`, `last_fetched_at`, and `error_reason` from the initial dashboard select.
- Update `useDashboardDerived` and `useOpenGroup` search haystacks to title+URL only, making the behavior intentional rather than an accidental payload side effect.
- Add a focused bookmark detail fetch for `QuickGlanceDialog` and `BookmarkEditSheet` before removing `description` from the initial payload.
- Let enrichment/realtime merge opportunistically add detail fields to in-memory rows after create/refresh, but do not rely on those fields existing on initial rows.
- If richer search is desired later, add a dedicated server/search endpoint instead of restoring description to the initial dashboard payload.

Implementation status on 29-May-26:

- First payload-shaping cut was implemented.
- `DASHBOARD_BOOKMARK_SELECT` now excludes `description`, `og_image_url`, `image_url`, `screenshot_url`, `last_fetched_at`, and `error_reason`.
- `DASHBOARD_BOOKMARK_DETAIL_SELECT` was added for targeted detail loads.
- `BookmarkRow` now models detail fields as optional so list rows are not falsely treated as full DB rows.
- `getBookmarkDetails` server action loads detail-only fields for authenticated users.
- `BookmarkBoard` and `FolderBoard` fetch and merge bookmark details before opening `QuickGlanceDialog` or `BookmarkEditSheet`.
- Dashboard search and Open Group filtered behavior now use title+URL only.
- Follow-up review removed stale detail-field props from board display shaping and removed the unused `description` prop from list rows.
- Verification: `pnpm typecheck` passed; targeted `oxlint` on changed files passed; full `pnpm lint` remains blocked by pre-existing unrelated lint findings.

### 5. Reorder Scaling

Decision: migrate bookmarks and groups from integer `order_index` reorder writes to string fractional ranks.

Target shape:

- Add `rank text collate "C"` while keeping `order_index` during migration as fallback.
- Backfill rank from current `order_index`.
- Index bookmarks by `(user_id, group_id, rank)`.
- Index groups by `(user_id, rank)`.
- On drag end, update only the moved item rank.
- Rebalance ranks through maintenance/cron or operator action, not in the drag user flow.

Why:

- Current row lookup is fast; write amplification is the problem.
- Float ranks can exhaust precision under repeated inserts into the same gap.
- Full Jira-style LexoRank buckets are probably too much machinery at Reway's current scale.
- String fractional ranks with `COLLATE "C"` preserve JS/Postgres sort compatibility.

Outcome:

- One drag becomes one row update instead of N row updates.
- Optimistic UI remains possible.
- Realtime reorder noise drops sharply.

Implementation status on 29-May-26:

- Production migration applied: `20260529050306_add_fractional_ranks`.
- Local migration recorded at `supabase/migrations/20260529050306_add_fractional_ranks.sql`.
- `rank text collate "C"` is present on `bookmarks` and `groups`.
- Live backfill verified: 0 bookmarks and 0 groups missing rank; max live rank length is 32; no rows exceed the 64-character rebalance threshold.
- Dashboard and extension reads order by `rank` first, with `order_index` retained as fallback.
- Create/import paths assign ranks while preserving `order_index`.
- Bookmark and group drag paths update only the moved row's `rank`; `order_index` is not rewritten during reorder.
- Review pass fixed two edge cases: extension grabbed-link/session batch saves now create sequentially to avoid server-generated rank collisions, and group client sorting now has a dedicated fallback that matches the database order.
- DnD performance review using the dnd-kit skill memoized card and folder-icon sortable bookmark components and stabilized board item action handlers to reduce drag-time rerenders.
- Verification: `pnpm typecheck`, targeted `oxlint`, and React Doctor 100/100 passed.
- Authenticated dashboard reload on `http://localhost:3001/dashboard` rendered without a build/runtime overlay after the rank cut.

Rebalance policy:

- Watch max rank length per user/group.
- Rebalance when any rank in a group exceeds about 64 characters; treat 128 as a hard safety cap.
- Do not run an O(n) rebalance during a drag interaction.

### 6. Virtualization

Decision: use TanStack Virtual with dnd-kit, implemented in phases.

Skill requirement:

- Before implementation, load `.agents/skills/dnd-kit-react` and `.agents/skills/tanstack-virtual`.

Phases:

- List view first: virtualize rows directly, keep selection ID-based, and wire keyboard navigation to `scrollToIndex`.
- Card/grid view second: virtualize rows of cards, not individual cards; responsive column count must be measured.
- Folder view last: virtualize groups/sections first; only virtualize bookmarks inside a group when the group crosses a high threshold such as 100 items.

Required safeguards:

- Keep `DragOverlay` mounted.
- Use stable item IDs.
- Avoid pointer-only collision algorithms as the primary sortable strategy because keyboard sensors must keep working.
- Key virtual rows by bookmark id, not virtual index.
- Buffer or freeze realtime list changes during active drag so drop indexes are not invalidated.
- Preserve keyboard navigation, selection mode, search, group switching, and touch drag behavior.
- Use an explicit remount strategy for major group/filter/layout switches if dnd-kit keeps stale droppable nodes.

Outcome:

- Lower DOM count and smoother large-list scrolling.
- More layout-specific implementation complexity.
- Highest value after payload shaping.

Current state on 30-May-26:

- Dashboard virtualization was removed to preserve the simpler fully mounted render paths across bookmark list, card, and folder views.
- `BookmarkBoard` and `FolderBoard` now always use their non-virtualized sortable renderers, which keeps drag, keyboard selection, search filtering, selection mode, preview, edit, and group switching on the long-standing code path.
- The future guidance above still applies if virtualization returns, but the current codebase no longer ships `@tanstack/react-virtual` or virtualization-specific dashboard components.
- Dashboard loading states still reuse the extension popup's three-bar loading affordance through `components/dashboard/LoadingState.tsx`.

### 7. Enrichment Background Work

Decision: keep current concurrency-limited enrichment path for now, but add observability before considering Supabase Queues.

Add first:

- Track stuck pending/enriching bookmarks.
- Track enrichment age, retry count, last attempt, and backlog size.
- Alert or surface backlog/stuck states before they become invisible failures.

Queue trigger:

- Move to Supabase Queues / pgmq only when metrics show repeated abandoned enrichments, rate-limit failures, or sustained backlog.

Future queue shape:

- Enqueue `{ bookmark_id, user_id, url }`.
- Worker or Edge Function processes small batches.
- Worker updates bookmark metadata/status.
- Existing realtime row updates refresh dashboard state.

Outcome:

- Saves/imports stay fast today.
- Queue complexity is deferred until data justifies it.
- The system gains the telemetry needed to decide without guessing.

## Roadmap

### Do Now

- Decide whether enrichment observability needs a server-side persisted attempt model, or whether the client-side dashboard signal is enough until metrics show repeated failures.

Completed browser smoke coverage on 29-May-26:

- Authenticated dashboard load on `http://localhost:3001/dashboard` after a user import of about 144 bookmarks.
- Imported bookmark library renders and view switching keeps bookmarks visible.
- Search mode filters by title and URL/domain only; description matching remains intentionally out of the dashboard search contract.
- Group filtering under an active search query keeps the matching title/URL result and excludes unrelated bookmark titles.
- Quick Glance opens from the bookmark context menu after the targeted detail fetch settles.
- Edit sheet opens with full detail controls, including description, after the detail load path.
- Metadata refresh returns to the dashboard without browser console errors.
- Import and Duplicates sheets open from the user menu; Duplicates reports the current no-duplicates state without destructive action.
- User manually verified import completion: after the sheet reports import complete and closes, newly imported bookmarks appear in the dashboard while many remain visibly enriching. This matches Reway's capture-first/enrich-later contract.
- User manually verified the Add flow works correctly on the authenticated dashboard.

Remaining browser smoke gap:

- Realtime-specific coverage was intentionally skipped for this phase as accepted residual risk because payload shaping did not intentionally change realtime subscription wiring.

Completed payload-size measurement on 29-May-26:

- Method: live Supabase SQL measured uncompressed UTF-8 JSON text for the current initial bookmark field set versus the prior detail-inclusive field set.
- Current 158-bookmark account shape: initial payload about 86.9 KB, previous full shape about 136.5 KB, saving about 49.6 KB / 36.3%.
- Largest measured account shape: 247 bookmarks, initial payload about 146.4 KB, previous full shape about 228.7 KB, saving about 82.3 KB / 36.0%.
- Across 22 measured users and 1,081 bookmarks: initial payload about 642.5 KB, previous full shape about 974.1 KB, saving about 331.6 KB / 34.0% weighted.
- Average measured row cost: about 542 bytes per bookmark in the initial shape versus about 825 bytes per bookmark in the prior full shape.

Completed first enrichment observability cut on 29-May-26:

- Added an avatar-menu `Enrichment health` sheet computed from existing initial bookmark fields.
- The user menu shows a small attention badge only when stuck or failed enrichment work exists.
- The sheet reports active enrichment/backlog count, refresh-needed count, oldest active age, failed count, and items stuck over 15 minutes.
- Refresh-needed means a bookmark is `pending` but no longer actively enriching, which can happen after a reload or interrupted import/enrichment worker.
- Failed/stuck rows are actionable: each row can retry enrichment, and the sheet can retry all actionable rows.
- The sheet can also select all affected rows, including refresh-needed rows, handing off to the existing bulk action bar for refresh/retry or delete/remove instead of duplicating bulk actions.
- Failed rows show recorded error detail when available through the detail-load path.
- The failed count intentionally ignores rows that still have useful metadata, because `status = failed` can be stale after later metadata fields are present.
- The first stuck heuristic uses `created_at` for pending/enriching bookmarks because `last_fetched_at` is detail-only after payload shaping.
- This is intentionally client-side and non-persistent; retry count and last-attempt tracking still require a later server-side attempt model if metrics justify it.

Completed Supabase migration work:

- Re-authenticated Supabase MCP and inspected live definitions for `increment_bookmark_visits`, `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes`.
- Wrote and applied `20260529013215_harden_dashboard_functions_and_indexes` from live definitions.
- Preserved `bookmarks_user_visit_rank_idx`.
- Removed `idx_bookmarks_visit_count`; no global/admin visit analytics feature is planned.
- Dropped `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx` after live advisors and plans confirmed they were cleanup targets.
- Cleared the targeted security-definer function advisor warnings and all performance advisor lints.

### Do Soon

- Browser-smoke rank reorder across bookmark list/card/folder views, sidebar group reorder, import-created ranks, extension-created saves, and realtime reorder propagation.
- Review compact-list, card-view, and compact-folder virtualization in an authenticated browser when available, especially refresh, keyboard selection scroll, drag reorder near viewport edges, search results over 50 rows, responsive card column changes, folder collapse/expand, and group switching.
- Secondary DnD audit: use the dnd-kit skill before virtualization to profile current drag performance, with special attention to large card/folder boards, active-drag rerenders, collision strategy cost, sensor activation constraints, and whether migrating from legacy `@dnd-kit/core` / `@dnd-kit/sortable` to the newer `@dnd-kit/react` API is worth doing before TanStack Virtual.
- Monitor `groups_user_id_rank_idx`; its initial unused-index lint is expected immediately after creation and should be revisited only after reorder/read traffic has exercised the new path.
- Add focused UI or diagnostics for enrichment failure details now that `error_reason` is detail-only.

Payload split guardrails:

- Do not remove `favicon_url` from the initial payload.
- Do not remove `normalized_url` before checking duplicate UI and display-title logic.
- Card view currently does not need `og_image_url`; keep thumbnails detail-only unless card UI intentionally adds thumbnail rendering.
- Realtime merge code must tolerate list rows that do not have detail-only fields.

### Do Later

- Continue TanStack Virtual with dnd-kit in phases: extended grid-like list only if it proves distinct from card rows, and extended folder grid only after a separate column-aware design.

Rank migration guardrails:

- Add `rank text collate "C"` without immediately dropping `order_index`.
- Backfill all existing rows before switching reads to `rank`.
- Treat `rank` as canonical after cutover; keep `order_index` frozen only for rollback until verified.
- Verify JS sort order and Postgres `ORDER BY rank` produce the same order before switching reads.
- Keep rollback path to `order_index` until reorder, realtime, imports, and extension paths are verified.
- Rebalance through maintenance/cron or operator action, not the drag request path.

Virtualization guardrails:

- Start with list view even though the long-term target includes all layouts.
- Preserve `DragOverlay`.
- Preserve keyboard navigation and selection state.
- Buffer or freeze realtime reorder-affecting updates during active drag.
- Use layout-specific designs: row virtualization for list, row-of-cards virtualization for grid, section-first virtualization for folder view.
- Use keyboard-compatible collision detection such as `closestCenter` / `closestCorners`; do not make pointer-only collision the core sortable strategy.
- Increase overscan only during drag if needed, and test scroll boundaries explicitly.

### Do Only If Metrics Show Pain

- Move enrichment to Supabase Queues / pgmq.
- Add deep folder-board bookmark virtualization.

Queue migration guardrails:

- Add observability first.
- Move to pgmq only after backlog/stuck/rate-limit metrics justify the added worker surface.
- Queue messages should carry `bookmark_id`, `user_id`, and `url`.
- Worker completion should update the bookmark row and let realtime refresh the UI.

## Do Not Regress

- Do not convert duplicate detection into duplicate rejection.
- Do not remove user-scoped indexes that protect RLS-heavy paths.
- Do not replace current concurrency limits with unbounded enrichment.
- Do not virtualize by unmounting active drag overlays or DOM-focused keyboard state without a replacement focus model.
- Do not drop `order_index` until rank rollout is verified across dashboard, extension, imports, and realtime.
- Do not run rank rebalance inside normal drag/drop user interactions.
- Do not add global indexes for unplanned admin analytics.
