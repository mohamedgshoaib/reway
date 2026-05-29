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
- Live Supabase MCP validation: previously reached production DB and captured indexes, RLS policy shape, row estimates, advisors, and representative query plans.
- Current blocker: Supabase MCP now requires re-authentication before live function definitions/advisors can be rechecked.

## Current Baseline

- Dashboard data loads in parallel through `Promise.all` in `app/dashboard/page.tsx`.
- Import flow limits writes to 3 concurrent creates and 2 concurrent enrichment jobs in `components/dashboard/content/useImportHandlers.ts`.
- Bookmark and group reorder still writes one `order_index` update per item in the reordered list via `Promise.all` in `lib/dashboard/server/library-mutations.ts`.
- `BookmarkBoard` and `FolderBoard` already use dnd-kit `DragOverlay`, which is required for virtualized drag surfaces.
- `BookmarkBoard` still renders all visible bookmarks and currently passes `description`, `image_url`, and `og_image_url` into display data.
- Duplicate bookmarks are allowed by product design.

Important file anchors:

- Dashboard load: `app/dashboard/page.tsx`.
- Bookmark reads: `lib/library/server/reads.ts`.
- Server mutations/reorder: `lib/dashboard/server/library-mutations.ts`.
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

Validated indexes:

- `bookmarks_user_id_idx`.
- `bookmarks_user_id_group_id_order_index_idx`.
- `bookmarks_user_id_normalized_url_idx` (intentionally non-unique).
- `bookmarks_user_visit_rank_idx`.
- `idx_bookmarks_visit_count`.
- `groups_user_id_idx`.
- `groups_user_id_name_idx`.
- `notes_user_id_idx`, `notes_created_at_idx`.
- `todos_user_id_idx`, `todos_created_at_idx`, `todos_completed_idx`.

Representative live plans:

- Dashboard bookmark read used `bookmarks_user_id_idx`, about `0.67ms` for 248 rows.
- Extension all-bookmarks read used `bookmarks_user_id_idx`, about `0.54ms` for 248 rows.
- Extension group-filtered read used `bookmarks_user_id_group_id_order_index_idx`, about `0.22ms` for 43 rows.
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
- Remove or explicitly defer `idx_bookmarks_visit_count`.
- Defer cleanup of `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx` to a migration sprint.

Why:

- `bookmarks_user_visit_rank_idx` supports Reway's Most Visited / visit-aware ranking mechanic.
- `idx_bookmarks_visit_count` supports a global/admin visit leaderboard; no such feature is planned.
- The notes/todos single-column indexes are weak shapes for user-scoped dashboard reads, but current row counts are small and user indexes cover the important filter.

Outcome:

- Keep the index that supports product retrieval.
- Avoid write overhead from a global visit-count index that has no planned query.
- Do not churn notes/todos indexes until that cleanup can be measured or bundled with related schema work.

### 3. Security Definer Functions

Decision: inspect live function definitions before writing migrations. Then revoke direct client execution from privileged/internal `SECURITY DEFINER` functions and keep them out of exposed schemas where possible.

Known local correction:

- Older report data named `bump_bookmark_open`.
- Current generated types and route code show the visit RPC as `increment_bookmark_visits`.
- `app/api/bookmarks/visits/route.ts` authenticates the user server-side and calls `increment_bookmark_visits` through `supabaseAdmin`.

Target direction:

- `increment_bookmark_visits`: keep server-only if it uses elevated privileges, or make it invoker-safe if it ever becomes a direct client RPC.
- `handle_new_user`: trigger helper; keep privileged behavior if needed, but revoke direct client execution and consider a private schema.
- `notify_bookmarks_changes` / `notify_groups_changes`: revoke direct client execution, set safe search paths, and audit channel/payload scoping. Do not add `auth.uid()` guards blindly because trigger execution context may not have a client JWT.

Outcome:

- Advisor warnings should clear.
- Privileged functions remain usable internally.
- Clients cannot call privileged RPCs directly.

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
- Audit `BookmarkBoard`, card view, preview, edit sheet, and realtime merge behavior before changing the select list.

Outcome:

- Smaller initial dashboard payload.
- Preview/detail opens with a targeted extra fetch.
- Less RSC/client prop serialization at high bookmark counts.

### 5. Reorder Scaling

Decision: migrate bookmarks and groups from integer `order_index` reorder writes to string fractional ranks.

Target shape:

- Add `rank text collate "C"` while keeping `order_index` during migration as fallback.
- Backfill rank from current `order_index`.
- Index bookmarks by `(user_id, group_id, rank)`.
- Index groups by `(user_id, rank)`.
- On drag end, update only the moved item rank.
- Keep a rare rebalance RPC for rank strings that become too long.

Why:

- Current row lookup is fast; write amplification is the problem.
- Float ranks can exhaust precision under repeated inserts into the same gap.
- Full Jira-style LexoRank buckets are probably too much machinery at Reway's current scale.
- String fractional ranks with `COLLATE "C"` preserve JS/Postgres sort compatibility.

Outcome:

- One drag becomes one row update instead of N row updates.
- Optimistic UI remains possible.
- Realtime reorder noise drops sharply.

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
- Buffer or freeze realtime list changes during active drag so drop indexes are not invalidated.
- Preserve keyboard navigation, selection mode, search, group switching, and touch drag behavior.

Outcome:

- Lower DOM count and smoother large-list scrolling.
- More layout-specific implementation complexity.
- Highest value after payload shaping.

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

- Re-auth Supabase MCP and inspect live definitions for `increment_bookmark_visits`, `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes`.
- Write the security migration from real function definitions.
- Keep `bookmarks_user_visit_rank_idx`.
- Remove or explicitly defer `idx_bookmarks_visit_count`; no global/admin visit analytics feature is planned.

Security migration guardrails:

- Do not write the migration from stale function names.
- Do not add `auth.uid()` checks to trigger notify functions without verifying trigger execution context.
- Prefer revoking direct client execution from privileged functions.
- Keep server-only RPCs callable from trusted server code, not public clients.

### Do Soon

- Split bookmark initial-list fields from preview/detail fields.
- Add enrichment stuck/backlog observability.
- Audit component dependencies on heavy bookmark fields before changing query shape.

Payload split guardrails:

- Do not remove `favicon_url` from the initial payload.
- Do not remove `normalized_url` before checking duplicate UI and display-title logic.
- Do not assume card view can lose `og_image_url` until `BookmarkBoard`, card components, preview, and edit sheet have been audited.
- Realtime merge code must tolerate list rows that do not have detail-only fields.

### Do Later

- Migrate bookmarks and groups to string fractional `rank`.
- Implement TanStack Virtual with dnd-kit in phases.

Rank migration guardrails:

- Add `rank text collate "C"` without immediately dropping `order_index`.
- Backfill and dual-read/dual-write only if needed for rollout safety.
- Verify JS sort order and Postgres `ORDER BY rank` produce the same order before switching reads.
- Keep rollback path to `order_index` until reorder, realtime, imports, and extension paths are verified.

Virtualization guardrails:

- Start with list view even though the long-term target includes all layouts.
- Preserve `DragOverlay`.
- Preserve keyboard navigation and selection state.
- Buffer or freeze realtime reorder-affecting updates during active drag.
- Use layout-specific designs: row virtualization for list, row-of-cards virtualization for grid, section-first virtualization for folder view.

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
