# Performance and Supabase Audit

## Purpose

Audit Reway across Next.js performance, React render performance, method complexity, extension capture surfaces, and Supabase correctness, performance, scale, and reliability.

The audit follows one skill at a time. Each skill moves through:

1. `loading`
2. `analyzing`
3. `reporting`
4. `re-analyzing`
5. `reporting`
6. `executing`

Execution waits for explicit user approval. Supabase diagnostics may read from the authenticated MCP project, but schema/data mutations, migrations, destructive actions, and production-impacting changes require approval at the execution phase.

## Directory Map

| Path | Concern | Primary Skills |
| --- | --- | --- |
| `nextjs-performance/` | App Router, Core Web Vitals, image/font/caching/streaming/bundle concerns | `nextjs-performance` |
| `react-performance/` | Client component boundaries, rerenders, state ownership, memoization, large-list behavior | `react-performance-optimization` |
| `method-complexity/` | High-complexity methods discovered during the audit | `refactor-method-complexity-reduce` |
| `supabase-errors-pitfalls/` | Supabase SDK mistakes, auth/RLS errors, service role exposure, `.single()`/`.select()`/error handling | `supabase-common-errors`, `supabase-known-pitfalls` |
| `supabase-performance-diagnostics/` | Query plans, indexes, pg_stat_statements, locks, connections, realtime diagnostics | `supabase-performance-tuning`, `supabase-advanced-troubleshooting` |
| `supabase-scale-reliability/` | Connection pooling, read replicas, compute/storage/edge scale, retries, circuit breakers, offline/fallback behavior | `supabase-load-scale`, `supabase-reliability-patterns` |
| `extension-surface/` | Chrome extension startup, capture latency, API transport, background/content-script reliability | Skills above as relevant, applied only after their primary concern pass |

## Skill Queue

| Order | Skill | Concern Folder | Status | Current Artifact |
| --- | --- | --- | --- | --- |
| 1 | `nextjs-performance` | `nextjs-performance/` | `closed` | `nextjs-performance/execution-plan.md` |
| 2 | `react-performance-optimization` | `react-performance/` | `closed` | `react-performance/execution-plan.md` |
| 3 | `refactor-method-complexity-reduce` | `method-complexity/` | `pending` | None |
| 4 | `supabase-common-errors` | `supabase-errors-pitfalls/` | `pending` | None |
| 5 | `supabase-known-pitfalls` | `supabase-errors-pitfalls/` | `pending` | None |
| 6 | `supabase-performance-tuning` | `supabase-performance-diagnostics/` | `pending` | None |
| 7 | `supabase-advanced-troubleshooting` | `supabase-performance-diagnostics/` | `pending` | None |
| 8 | `supabase-load-scale` | `supabase-scale-reliability/` | `pending` | None |
| 9 | `supabase-reliability-patterns` | `supabase-scale-reliability/` | `pending` | None |

## Progress Log

| Step | Status | Notes |
| --- | --- | --- |
| Scaffold audit directory | `done` | Created isolated concern folders under `spec/performance-supabase-audit/`. |
| Load named skill instructions | `done` | Loaded repo-local skill guidance from `.agents/skills/`. |
| Begin first skill | `done` | `nextjs-performance` loading artifact created at `nextjs-performance/loading.md`. |
| Analyze first skill | `done` | `nextjs-performance` first analysis artifact created at `nextjs-performance/analysis-pass-1.md`. |
| Report first skill | `done` | Ranked first-pass report created at `nextjs-performance/report-pass-1.md`. |
| Re-analyze first skill | `done` | Validated/deduplicated `nextjs-performance` findings in `nextjs-performance/analysis-pass-2.md`. |
| Final report first skill | `done` | Final ranked report created at `nextjs-performance/report-final.md`. |
| Execute first skill | `done` | Metadata route consolidated onto shared helper; verification logged in `nextjs-performance/execution-plan.md`. |
| Execute second skill step | `done` | Dashboard closed sheets now lazy-load from `DashboardNav`; verification logged in `nextjs-performance/execution-plan.md`. |
| Execute third skill step | `done` | Landing `DemoVideosSection` now loads through a deferred section boundary with a stable placeholder. |
| Execute fourth skill step | `done` | Landing `FeaturesSection` now loads through a deferred section boundary with a stable placeholder. |
| Execute fifth skill step | `done` | Added `app/dashboard/loading.tsx` for route-level dashboard loading feedback. |
| Execute sixth skill step | `done` | Moved `Toaster` out of root and removed root `TooltipProvider`; dashboard now owns toast scope. |
| Follow-up first skill patch | `done` | Deferred idle icon-catalog consumers in dashboard sidebar edit/create and drag overlay paths. |
| Follow-up second skill patch | `done` | Added auth route loading boundaries for `login` and `reset-password`. |
| Close first skill execution | `done` | `nextjs-performance` is closed; remaining work is browser validation and cross-skill follow-up. |
| Begin second skill | `done` | `react-performance-optimization` loading artifact created at `react-performance/loading.md`. |
| Analyze second skill | `done` | First React performance analysis artifact created at `react-performance/analysis-pass-1.md`. |
| Report second skill | `done` | First React performance report created at `react-performance/report-pass-1.md`. |
| Re-analyze second skill | `done` | Refined React performance findings in `react-performance/analysis-pass-2.md`. |
| Final report second skill | `done` | Final React performance report created at `react-performance/report-final.md`; execution awaits approval. |
| Execute second skill step 1 | `done` | Command search state ownership patch verified with `pnpm typecheck` and `pnpm build`. |
| Execute second skill step 2 | `done` | Board display transform cleanup verified with `pnpm typecheck` and `pnpm build`. |
| Execute second skill step 3 | `done` | Shell and adapter stability patch verified with `pnpm typecheck` and `pnpm build`. |
| Close second skill execution | `done` | React execution is closed after the approved low-risk patches; virtualization stays deferred because the previous implementation regressed scroll quality and introduced row gaps. |

## Execution Rules

- Work one skill phase at a time and keep the README status current.
- Gather enough evidence before proposing fixes.
- Deduplicate findings when skills overlap, but keep the original evidence in the relevant concern folder.
- Include extension surfaces when a finding affects capture latency, API transport, Supabase calls, background worker behavior, or dashboard-extension bridge behavior.
- Do not execute Supabase mutations, migrations, destructive actions, or production-impacting changes without explicit approval.
- During execution, prefer small reversible patches with verification commands and clear rollback notes.
