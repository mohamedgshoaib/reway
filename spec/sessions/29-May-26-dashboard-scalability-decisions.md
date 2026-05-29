# Session 5 — Dashboard Scalability Decisions

**Time:** 3:53 AM-7:45 AM (Cairo Time, UTC+02:00)

---

## Status at Start

- **Sprint goal:** Lock dashboard scalability decisions from the Supabase validation report and external research.
- **Last blocker:** Supabase MCP live re-check currently requires auth again, so this session used the previous successful live validation plus current repository code.
- **Feature state:** `spec/reports/dashboard-scalability-performance.md` existed as an untracked report with validated index/query-plan findings and pending decision notes.

---

## Completed

- Updated `spec/reports/dashboard-scalability-performance.md` to record that duplicate bookmarks are allowed by design and `(user_id, normalized_url)` must remain non-unique.
- Updated `spec/reports/dashboard-scalability-performance.md` with locked directions for index handling, security function audit, payload shaping, string fractional ranks, TanStack Virtual with dnd-kit, and enrichment observability.
- Compressed `spec/reports/dashboard-scalability-performance.md` from an exploratory report into a compact decision record with validation evidence, a roadmap, and a focused follow-up research prompt.
- Hardened `spec/reports/dashboard-scalability-performance.md` as a memory-loss guardian with non-negotiables, file anchors, implementation guardrails, and do-not-regress rules.
- Added an `Active Decision Records` pointer in `spec/index.md` so session start reliably discovers the dashboard scalability decision record.
- Resolved the `increment_bookmark_visits` contradiction in `spec/reports/dashboard-scalability-performance.md` with official Supabase docs: service-role bypasses RLS, but function access still uses normal `EXECUTE` grants.
- Added the next-session handoff below for continuing after Supabase MCP authentication.
- Used authenticated Supabase MCP to inspect live table definitions, RLS policies, function definitions, owners, security modes, search paths, grants, triggers, advisors, indexes, row estimates, and representative query plans.
- Added `supabase/migrations/20260529013215_harden_dashboard_functions_and_indexes.sql` from live definitions.
- Verified the migration in a live transaction with `ROLLBACK`: client `EXECUTE` is revoked from target functions, `service_role` execution remains, trigger bindings remain intact, `bump_bookmark_open` is removed, cleanup indexes are dropped, and `bookmarks_user_visit_rank_idx` is preserved.
- Confirmed `idx_bookmarks_visit_count`, `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx` remain valid cleanup targets from advisors, stats, and query plans.
- Applied production migration `20260529013215_harden_dashboard_functions_and_indexes` through Supabase MCP.
- Re-ran advisors after apply: performance lints are clear; security lints only show Auth leaked-password protection disabled.
- Smoke-tested `increment_bookmark_visits` as `service_role` with an empty batch; execution succeeds as a no-op.
- Updated `spec/reports/dashboard-scalability-performance.md` to mark the Supabase migration work complete and make payload-shaping audit preparation the next step.
- Audited dashboard bookmark payload consumers across reads, boards, cards, folder view, preview, edit sheet, search, open-group, realtime merge, import/enrichment, export, duplicate cleanup, and undo/restore paths.
- Added a payload field matrix and first-cut implementation recommendation to `spec/reports/dashboard-scalability-performance.md`.
- Implemented the first dashboard payload-shaping cut: initial bookmark reads exclude detail-only fields, preview/edit load details on demand, and dashboard search/Open Group filtering use title+URL only.
- Verified payload-shaping changes with `pnpm typecheck` and targeted `oxlint` on changed files.
- Reviewed the payload-shaping implementation for stale detail-field dependencies across board rendering, preview/edit, search/Open Group, realtime merge, import/enrichment, duplicate cleanup, export, and undo/restore.
- Removed stale detail-field props from `BookmarkBoard` display shaping and removed the unused `description` prop from `SortableBookmark`.
- Ran an authenticated browser smoke test on `http://localhost:3001/dashboard` after a user login and import of about 144 bookmarks.
- Verified the dashboard renders the imported bookmark library, view switching keeps bookmarks visible, and search mode filters by title and URL/domain without description matching.
- Verified group filtering under an active search query keeps the matching URL/title result and excludes unrelated bookmark titles.
- Verified Quick Glance opens from the bookmark context menu after the detail fetch settles, and the edit sheet opens with title, URL, description, group, and save controls present.
- Verified metadata refresh on an existing bookmark returns to the dashboard with no browser console errors.
- Verified the Import sheet and Duplicates sheet open from the user menu; the Duplicates sheet reports the current no-duplicates state without destructive action.
- User manually verified import completion: after the sheet reports import complete and closes, newly imported bookmarks appear in the dashboard while many remain visibly enriching, which matches the capture-first/enrich-later contract.
- User manually verified the Add flow works correctly on the authenticated dashboard.
- Measured live dashboard bookmark payload sizes from Supabase: the 158-bookmark account shape saves about 49.6 KB / 36.3% uncompressed, and the 22-user aggregate saves about 331.6 KB / 34.0% weighted.
- Added the first enrichment observability cut: an avatar-menu `Enrichment health` sheet that reports active count, oldest active age, failed count, and stuck-over-15-minute count from existing bookmark fields.
- Moved enrichment health out of the main dashboard surface and into the avatar dropdown sheet after user feedback that the visible strip was too large and not actionable enough.
- Added retry actions for failed/stuck enrichment rows and a retry-all action for actionable rows.
- Added a `Select affected` action in the enrichment health sheet that hands failed/stuck bookmarks to the existing bulk action bar for refresh/retry or delete/remove.
- Tightened enrichment failed detection so rows with useful metadata are not flagged just because `status = failed` is stale.
- Added refresh-needed bookmarks to enrichment health: pending rows that are no longer actively enriching now appear in the sheet and count toward the avatar-menu attention badge.
- Adjusted the `Needs attention` header so the label does not wrap when action buttons sit beside it.
- Verified the main dashboard strip is gone, the avatar menu exposes `Enrichment health`, and the sheet opens on `http://localhost:3001/dashboard` through the in-app browser DOM snapshot.
- Verified the enrichment health change with `pnpm typecheck`, targeted `oxlint`, and React Doctor at 100/100.
- Used Supabase MCP to verify live bookmark/group table shape, indexes, migration history, advisors, and representative rank-order query plans before the rank rollout.
- Added and applied production migration `20260529050306_add_fractional_ranks`; local SQL is recorded at `supabase/migrations/20260529050306_add_fractional_ranks.sql`.
- Added `rank text collate "C"` to `bookmarks` and `groups`, backfilled all live rows, validated rank-length checks, and created `(user_id, group_id, rank)` / `(user_id, rank)` indexes.
- Verified live rank rollout: 0 missing bookmark ranks, 0 missing group ranks, max rank length 32, and no rows over the 64-character rebalance threshold.
- Switched dashboard and extension bookmark/group reads to order by `rank` first while preserving `order_index` as fallback.
- Updated create/import paths to assign ranks and updated bookmark/group drag paths to persist only the moved row's rank instead of rewriting every row's `order_index`.
- Reviewed the rank rollout for collision and ordering risks; changed extension grabbed-link and session batch saves to create sequentially so concurrent extension POSTs cannot receive duplicate server-generated top ranks.
- Split group rank sorting from bookmark rank sorting so client group fallback order matches the database order when ranks are missing or duplicated.
- Used the dnd-kit skill to review the current DnD surface, memoized card/folder icon sortable bookmark components, and stabilized board item action handlers to reduce active-drag rerender pressure.
- Verified the rank implementation with `pnpm typecheck`, targeted `oxlint`, and React Doctor at 100/100.
- Reloaded the authenticated dashboard at `http://localhost:3001/dashboard`; the dashboard rendered without a build/runtime overlay after the rank changes.

---

## Decisions

- Keep `bookmarks_user_visit_rank_idx` because it supports Reway's Most Visited / visit-aware ranking mechanic.
- Remove or explicitly defer `idx_bookmarks_visit_count` because no global/admin visit analytics feature is planned.
- Use string fractional `rank` columns with `COLLATE "C"` for future reorder scaling rather than float ranks or full Jira-style LexoRank buckets.
- Split bookmark list payload from preview/detail fields while keeping `favicon_url` in the initial payload.
- Use TanStack Virtual with dnd-kit `DragOverlay` in phased layout-specific work; load `.agents/skills/dnd-kit-react` and `.agents/skills/tanstack-virtual` before implementation.
- Keep current concurrency-limited enrichment until metrics justify Supabase Queues, but add stuck/backlog observability first.
- Target `increment_bookmark_visits` as a server-only `SECURITY INVOKER` RPC with `p_user_id` supplied by the authenticated route, client `EXECUTE` revoked, and `service_role` execution preserved.
- Drop the dead legacy `bump_bookmark_open(uuid, uuid)` RPC because live schema still exposes it as `SECURITY DEFINER`, local code no longer calls it, generated types omit it, and its body references removed `open_count` / `last_opened_at` columns.
- Treat the remaining Auth leaked-password protection advisor as accepted/no-action while on the Supabase free plan.
- Dashboard search and Open Group filtering should use title+URL only; `description` is too broad for the dashboard search contract.
- First payload-shaping cut should remove `description`, `og_image_url`, `image_url`, `screenshot_url`, `last_fetched_at`, and `error_reason` from the initial dashboard select.
- Authenticated browser smoke testing is complete enough for this phase; realtime-specific coverage is accepted as skipped.
- Realtime-specific smoke testing is skipped for this phase as accepted residual risk because the payload-shaping cut did not intentionally change realtime subscription wiring.
- Next scalability decision is whether enrichment observability needs persisted attempt tracking, or whether the current client-side signal is enough until metrics show pain.
- First enrichment observability cut should remain client-side until retry count / last-attempt data proves a server-side attempt model is worth the added surface.
- `order_index` should remain frozen as rollback data after the rank cutover; do not drop it until dashboard, extension, imports, realtime, and smoke tests are verified.
- A secondary DnD performance audit should happen before virtualization: profile current large-board drag behavior, collision costs, sensor constraints, and whether a legacy dnd-kit to `@dnd-kit/react` migration is worthwhile before TanStack Virtual.

---

## Blockers

1. ~~Supabase MCP live re-check requires re-authentication before function definitions/advisors can be freshly inspected.~~ Resolved 29-May-26.
2. Local Supabase migration listing is blocked until the local database is started on `127.0.0.1:54322`; live transaction rollback and post-apply verification succeeded.
3. Full `pnpm lint` is blocked by pre-existing unrelated lint findings; targeted lint for the changed rank/payload files passes.
4. Post-rank performance advisor reports `groups_user_id_rank_idx` as unused immediately after creation. This is expected until traffic exercises the new group-rank read path; bookmark rank ordering already uses `bookmarks_user_id_group_id_rank_idx` in a representative plan.
