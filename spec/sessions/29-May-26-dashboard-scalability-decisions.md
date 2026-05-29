# Session 5 — Dashboard Scalability Decisions

**Time:** 3:53 AM-6:08 AM (Cairo Time, UTC+02:00)

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
- Next step is authenticated browser smoke testing for the first payload-shaping cut, especially preview/edit detail fetch behavior and search/Open Group behavior.

---

## Blockers

1. ~~Supabase MCP live re-check requires re-authentication before function definitions/advisors can be freshly inspected.~~ Resolved 29-May-26.
2. Local Supabase migration listing is blocked until the local database is started on `127.0.0.1:54322`; live transaction rollback and post-apply verification succeeded.
3. Full `pnpm lint` is blocked by pre-existing unrelated lint findings; targeted lint for the payload-shaping files passes.
