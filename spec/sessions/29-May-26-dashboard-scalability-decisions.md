# Session 5 — Dashboard Scalability Decisions

**Time:** 3:53 AM (Cairo Time, UTC+02:00)

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

---

## Decisions

- Keep `bookmarks_user_visit_rank_idx` because it supports Reway's Most Visited / visit-aware ranking mechanic.
- Remove or explicitly defer `idx_bookmarks_visit_count` because no global/admin visit analytics feature is planned.
- Use string fractional `rank` columns with `COLLATE "C"` for future reorder scaling rather than float ranks or full Jira-style LexoRank buckets.
- Split bookmark list payload from preview/detail fields while keeping `favicon_url` in the initial payload.
- Use TanStack Virtual with dnd-kit `DragOverlay` in phased layout-specific work; load `.agents/skills/dnd-kit-react` and `.agents/skills/tanstack-virtual` before implementation.
- Keep current concurrency-limited enrichment until metrics justify Supabase Queues, but add stuck/backlog observability first.

---

## Blockers

1. Supabase MCP live re-check requires re-authentication before function definitions/advisors can be freshly inspected.
