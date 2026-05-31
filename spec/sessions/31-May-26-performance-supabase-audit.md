# Session 7 — Performance Supabase Audit

**Time:** 12:17 AM-12:17 AM (Cairo Time)

---

## Status at Start

- **Sprint goal:** Start a comprehensive one-skill-at-a-time audit for Next.js performance, React performance, method complexity, extension surfaces, and Supabase correctness/performance/scale/reliability.
- **Last blocker:** None.
- **Feature state:** Audit scaffold requested before execution; execution phases require explicit user approval.

---

## Completed

- Created isolated audit scaffold at `spec/performance-supabase-audit/` with concern folders and progress tracking.
- Added root audit tracker at `spec/performance-supabase-audit/README.md` covering skill order, phase sequence, directory map, and approval rules.
- Added concern READMEs for `nextjs-performance`, `react-performance`, `method-complexity`, `supabase-errors-pitfalls`, `supabase-performance-diagnostics`, `supabase-scale-reliability`, and `extension-surface`.
- Completed `nextjs-performance` loading artifact at `spec/performance-supabase-audit/nextjs-performance/loading.md`.
- Completed `nextjs-performance` first analysis artifact at `spec/performance-supabase-audit/nextjs-performance/analysis-pass-1.md`.
- Verified `pnpm build` passes during the Next.js performance analysis pass.
- Completed `nextjs-performance` first-pass report, re-analysis, and final report.
- Executed approved metadata route consolidation in `app/api/metadata/route.ts` using shared helper logic from `lib/metadata.ts`.
- Verified execution patch with `pnpm typecheck` and `pnpm build`.
- Executed approved dashboard closed-surface deferral in `components/dashboard/DashboardNav.tsx`, `components/dashboard/nav/UserMenu.tsx`, and `components/dashboard/SettingsDialog.tsx` using `next/dynamic`, first-open gating, and a preserved settings event bridge.
- Verified second execution patch with `pnpm typecheck` and `pnpm build`.
- Executed approved landing `DemoVideosSection` deferral in `components/demo-layout.tsx` with a stable placeholder and preserved `#extension` anchor behavior.
- Verified third execution patch with `pnpm typecheck` and `pnpm build`.
- Executed approved landing `FeaturesSection` deferral in `components/demo-layout.tsx` with a stable placeholder and preserved `#features` anchor behavior.
- Verified fourth execution patch with `pnpm typecheck` and `pnpm build`.
- Executed approved dashboard route loading boundary in `app/dashboard/loading.tsx`.
- Verified fifth execution patch with `pnpm typecheck` and `pnpm build`.
- Refined the dashboard loading route into a simpler loading-bars state with a small bookmark-list skeleton and dashboard palette awareness.
- Executed approved provider-scope cleanup by moving `Toaster` from `app/layout.tsx` to `app/dashboard/page.tsx` and removing the root `TooltipProvider`.
- Verified sixth execution patch with `pnpm typecheck` and `pnpm build`.
- Applied a worthwhile follow-up patch to defer dashboard sidebar create/edit group cards and drag overlay, reducing idle icon-catalog loading in those paths.
- Verified follow-up patch with `pnpm typecheck` and `pnpm build`.
- Added lightweight route-level loading boundaries for `login` and `reset-password`.
- Verified final Next.js follow-up with `pnpm typecheck` and `pnpm build`.
- Started the `react-performance-optimization` audit phase and created `spec/performance-supabase-audit/react-performance/loading.md`.
- Completed first-pass React performance analysis at `spec/performance-supabase-audit/react-performance/analysis-pass-1.md`.
- Completed first-pass React performance report at `spec/performance-supabase-audit/react-performance/report-pass-1.md`.
- Completed React performance re-analysis at `spec/performance-supabase-audit/react-performance/analysis-pass-2.md`.
- Completed final React performance report at `spec/performance-supabase-audit/react-performance/report-final.md`.
- Started React execution step 1 for command search state ownership and created `spec/performance-supabase-audit/react-performance/execution-plan.md`.
- Verified React execution step 1 with `pnpm typecheck` and `pnpm build`.
- Verified React execution step 2 with `pnpm typecheck` and `pnpm build`.
- Fixed a list-view hit-area regression in `components/dashboard/SortableBookmark.tsx` so title and URL anchors no longer stay clickable across the reserved text lane outside the visible truncated text.
- Verified the list-view hit-area fix with `pnpm typecheck` and `pnpm build`.
- Verified React execution step 3 with `pnpm typecheck` and `pnpm build`.
- Closed the React performance execution phase after the approved low-risk patches.
- Explicitly deferred virtualization for this phase because the previous implementation had already been removed after introducing laggy scroll behavior and visible gaps between bookmarks.
- Started the `refactor-method-complexity-reduce` audit phase and created `spec/performance-supabase-audit/method-complexity/loading.md`.
- Completed method-complexity candidate analysis at `spec/performance-supabase-audit/method-complexity/candidates.md`.
- Completed first-pass method-complexity report at `spec/performance-supabase-audit/method-complexity/report-pass-1.md`.
- Completed method-complexity re-analysis at `spec/performance-supabase-audit/method-complexity/analysis-pass-2.md`.
- Completed final method-complexity report at `spec/performance-supabase-audit/method-complexity/report-final.md`.
- Executed approved method-complexity step 1 in `components/dashboard/bookmark-board/useBookmarkKeyboardNav.ts` and verified local complexity score `18`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 2 in `components/dashboard/folder-board/useFolderKeyboardNav.ts` and verified local complexity score `13`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 3 in `components/dashboard/command-bar/useCommandHandlers.ts` and verified local complexity score `14`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 4 in `extension/js/save-bookmarks.js`, `extension/js/sessions.js`, and `extension/js/grabber.js` and verified local complexity scores `12` and `11`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 5 in `components/dashboard/content/useImportHandlers.ts` and verified local complexity score `14`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 6 in `extension/background.js` and verified local listener complexity score `8`, `pnpm typecheck`, and `pnpm build`.
- Executed approved method-complexity step 7 in `app/auth/confirm/route.ts` and `components/dashboard/content/import/parse-bookmarks-html.ts` and verified local route/parser scores `10`, `20`, and `19`, `pnpm typecheck`, and `pnpm build`.
- Started the `supabase-common-errors` audit phase and created `spec/performance-supabase-audit/supabase-errors-pitfalls/loading.md`.
- Completed first-pass Supabase common-errors analysis at `spec/performance-supabase-audit/supabase-errors-pitfalls/analysis-pass-1.md`.
- Completed first-pass Supabase common-errors report at `spec/performance-supabase-audit/supabase-errors-pitfalls/report-pass-1.md`.
- Completed Supabase common-errors re-analysis at `spec/performance-supabase-audit/supabase-errors-pitfalls/analysis-pass-2.md`.
- Completed final Supabase common-errors report at `spec/performance-supabase-audit/supabase-errors-pitfalls/report-final.md`; execution awaits approval.
- Executed approved Supabase common-errors step 1 in `lib/supabase/queries.ts`, making dashboard loaders throw readable Supabase load errors instead of returning empty arrays on failures.
- Verified Supabase common-errors step 1 with `pnpm typecheck` and `pnpm build`.
- Executed approved Supabase common-errors step 2 in `app/api/extension/utils.ts`, `app/api/extension/route-adapter.ts`, `app/api/extension/bookmarks/route.ts`, and `app/api/extension/groups/route.ts`, adding request validation and truthful `400` / `401` / `409` / `500` mapping.
- Verified Supabase common-errors step 2 with `pnpm typecheck` and `pnpm build`.
- Executed approved Supabase common-errors step 3 in `lib/library/server/capture.ts` and `lib/dashboard/server/library-mutations.ts`, changing optional first-row order lookups from `.single()` to `.maybeSingle()` while keeping required-row lookups unchanged.
- Verified Supabase common-errors step 3 with `pnpm typecheck` and `pnpm build`.
- Executed approved Supabase common-errors step 4 in `app/api/extension/bookmarks/route.ts`, `extension/js/save-bookmarks.js`, `extension/js/grabber.js`, `extension/js/sessions.js`, and `extension/popup.js`, rewording bookmark conflict handling so the extension no longer implies duplicate-bookmark rejection.
- Verified Supabase common-errors step 4 with `pnpm typecheck` and `pnpm build`.
- Started the `supabase-known-pitfalls` audit phase and created `spec/performance-supabase-audit/supabase-errors-pitfalls/loading-known-pitfalls.md`.
- Completed first-pass Supabase known-pitfalls analysis at `spec/performance-supabase-audit/supabase-errors-pitfalls/analysis-known-pitfalls-pass-1.md`.
- Completed first-pass Supabase known-pitfalls report at `spec/performance-supabase-audit/supabase-errors-pitfalls/report-known-pitfalls-pass-1.md`.
- Completed Supabase known-pitfalls re-analysis at `spec/performance-supabase-audit/supabase-errors-pitfalls/analysis-known-pitfalls-pass-2.md`.
- Completed final Supabase known-pitfalls report at `spec/performance-supabase-audit/supabase-errors-pitfalls/report-known-pitfalls-final.md`; execution awaits approval.
- Executed Supabase known-pitfalls step 1 as a proposal artifact at `spec/performance-supabase-audit/supabase-errors-pitfalls/execution-known-pitfalls.md`, drafting the exact `public` default-privileges SQL, verification plan, and rollback notes without applying any live Supabase change.
- Executed approved Supabase known-pitfalls step 2 in `lib/library/server/capture.ts`, replacing create-return `.select("*")` with explicit select constants for group and bookmark inserts.
- Verified Supabase known-pitfalls step 2 with `pnpm typecheck` and `pnpm build`.
- Executed approved Supabase known-pitfalls step 3 in `package.json`, adding a `types:supabase` script without regenerating `lib/supabase/database.types.ts`.
- Verified Supabase known-pitfalls step 3 with `pnpm typecheck` and `pnpm build`.
- Closed the `supabase-known-pitfalls` phase without applying the drafted default-privileges SQL because the remaining item is future-facing governance hardening and not worth forcing now for a solo-dev workflow.
- Started the `supabase-performance-tuning` audit phase and created `spec/performance-supabase-audit/supabase-performance-diagnostics/loading.md`.
- Completed first-pass Supabase performance analysis at `spec/performance-supabase-audit/supabase-performance-diagnostics/analysis-pass-1.md`.
- Completed first-pass Supabase performance report at `spec/performance-supabase-audit/supabase-performance-diagnostics/report-pass-1.md`.
- Completed Supabase performance re-analysis at `spec/performance-supabase-audit/supabase-performance-diagnostics/analysis-pass-2.md`.
- Completed final Supabase performance report at `spec/performance-supabase-audit/supabase-performance-diagnostics/report-final.md`; execution awaits approval.
- Started Supabase performance execution step 1 in `components/dashboard/content/useDashboardRealtime.ts`, removing the bookmark `postgres_changes` client subscription while keeping private Broadcast handlers and the extension bridge.
- Verified Supabase performance execution step 1 with `pnpm typecheck` and `pnpm build`.
- Executed Supabase performance step 2 by applying migration `20260531145415_drop_realtime_publication_tables`, removing `public.bookmarks` and `public.groups` from native `supabase_realtime`.
- Verified Supabase performance step 2 with a read-only publication query returning zero rows for those tables and performance advisors returning no lints.
- Started Supabase performance execution step 3 by removing redundant manual extension route insert broadcasts from the bookmark/group extension routes.
- Verified Supabase performance step 3 with `pnpm typecheck`, `pnpm build`, trigger inspection, and publication inspection.
- Started Supabase performance execution step 4 by removing unused `description` from the extension bookmark GET select list.
- Verified Supabase performance step 4 with `pnpm typecheck` and `pnpm build`.
- Closed the `supabase-performance-tuning` phase with visit-only suppression and full-list sort indexes intentionally deferred.
- Started the `supabase-advanced-troubleshooting` audit phase and created `spec/performance-supabase-audit/supabase-performance-diagnostics/loading-advanced-troubleshooting.md`.
- Completed first-pass Supabase advanced troubleshooting analysis at `spec/performance-supabase-audit/supabase-performance-diagnostics/analysis-advanced-troubleshooting-pass-1.md`.
- Completed first-pass Supabase advanced troubleshooting report at `spec/performance-supabase-audit/supabase-performance-diagnostics/report-advanced-troubleshooting-pass-1.md`.
- Completed Supabase advanced troubleshooting re-analysis at `spec/performance-supabase-audit/supabase-performance-diagnostics/analysis-advanced-troubleshooting-pass-2.md`.
- Completed final Supabase advanced troubleshooting report at `spec/performance-supabase-audit/supabase-performance-diagnostics/report-advanced-troubleshooting-final.md`; execution awaits approval.
- Executed Supabase advanced troubleshooting step 1 in `components/dashboard/content/useDashboardRealtime.ts`, awaiting Realtime auth before private Broadcast subscription and adding effect cancellation protection.
- Verified Supabase advanced troubleshooting step 1 with `pnpm typecheck`, `pnpm build`, and read-only publication/trigger inspection.
- Ran `git diff --check` after the Realtime auth patch; no whitespace errors were reported. Realtime logs were sampled, but there was no fresh post-patch dashboard join evidence, so operational log validation remains inconclusive until the dashboard is opened.
- Rechecked Realtime logs after fresh post-patch activity; a new Broadcast replication initialization appeared without new private-channel unauthorized bookmark/group messages above it in the returned window.
- Closed the `supabase-advanced-troubleshooting` phase from a code and Supabase diagnostics standpoint.

---

## Decisions

- Run the audit one skill phase at a time using `loading -> analyzing -> reporting -> re-analyzing -> reporting -> executing`.
- Wait for explicit user approval before any execution-phase code changes, Supabase mutations, migrations, destructive actions, or production-impacting changes.
- Include Chrome extension surfaces when findings affect capture latency, API transport, Supabase calls, background worker behavior, or dashboard-extension bridge behavior.
- Preserve the extension metadata response contract while consolidating route logic onto shared helpers.
- Prefer low-risk route-boundary splits before deeper dashboard architecture changes.
- In server components, keep deferred client sections compatible with App Router by avoiding `ssr: false` on `next/dynamic`.
- For method-complexity work, identify and rank candidate methods before selecting a target threshold or proposing execution.
- Initial method-complexity recommendation is to report around keyboard navigation extraction first, then batch-flow extraction; execution still requires explicit target approval.
- First method-complexity execution candidate is `useBookmarkKeyboardNav`; `useFolderKeyboardNav` should be re-analyzed after the smaller keyboard hook plan is validated.
- Re-analysis confirmed `useBookmarkKeyboardNav` should be refactored locally first; shared keyboard helpers with folder navigation should wait because folder navigation has different semantics.
- Method-complexity execution is now awaiting approval; first candidate is local helper extraction in `useBookmarkKeyboardNav` with `handleKeyDown` target complexity below 20.
- First approved method-complexity execution reached the target threshold: `useBookmarkKeyboardNav` `handleKeyDown` now scores `18` by the local estimator.
- Second approved method-complexity execution reached the target threshold: `useFolderKeyboardNav` `handleKeyDown` now scores `13` by the local estimator.
- Third approved method-complexity execution reached the target threshold: `processUrls` in command-bar handlers now scores `14` by the local estimator.
- Fourth approved method-complexity execution reached the target threshold: `saveTabSession` now scores `12` and `createGroupFromLinks` now scores `11` by the local estimator.
- Fifth approved method-complexity execution reached the target threshold: `handleConfirmImport` now scores `14` by the local estimator.
- Sixth approved method-complexity execution reached the target threshold: the top-level background worker message listener now scores `8` by the local estimator.
- Seventh approved method-complexity execution finished the documented leftovers: auth confirm now scores `10`, and the import parser now scores `20` with recursive `traverse` at `19`.
- Method-complexity phase is now closed because the documented candidate queue has been executed rather than deferred.
- Supabase common-errors phase has started in `loading`; no app code, schema, data, migration, or Supabase state changes have been made.
- First-pass Supabase common-errors analysis ranks dashboard loader error swallowing, extension route error classification, optional `.single()` lookups, auth error classification, and duplicate semantics for re-reporting.
- First-pass Supabase common-errors report recommends a code-only execution lane after re-analysis: dashboard loader failures, extension route status mapping, and optional `.single()` cleanup.
- Supabase common-errors re-analysis narrowed execution to dashboard loader fail-closed behavior, extension route request/status mapping, optional first-row `.maybeSingle()` cleanup, and scoped extension auth classification.
- Supabase common-errors final report recommends dashboard loader fail-closed behavior as the first execution step; no app code or Supabase state has changed in this skill yet.
- First approved Supabase common-errors execution is complete; next candidate is extension route request validation and status mapping.
- Second approved Supabase common-errors execution is complete; next candidate is optional first-row `.single()` cleanup to `.maybeSingle()`.
- Third approved Supabase common-errors execution is complete; the remaining item is lower-priority bookmark conflict wording against the locked duplicate-bookmarks policy.
- Fourth approved Supabase common-errors execution is complete; the documented candidate queue is now exhausted and the phase is closed.
- Supabase known-pitfalls phase has started in `loading`; no app code, schema, data, migration, or Supabase state changes have been made.
- First-pass Supabase known-pitfalls analysis ranks leaked-password protection, broad public grants, public security-definer functions, admin-client breadth, create-return `select("*")`, type-generation workflow, and seed metadata for reporting.
- Supabase known-pitfalls first-pass report accepts leaked-password protection as residual risk because it is Free-plan limited; current re-analysis focus is grants/function posture, signup admin lookup, create-return `select("*")`, type-generation workflow, and seed metadata.
- Supabase known-pitfalls re-analysis narrowed execution candidates to future default-privilege SQL discipline, create-return explicit selects, and a type-generation script; current table grant tightening, public trigger-helper moves, signup admin scan replacement, seed metadata, and leaked-password protection are deferred or accepted for this phase.
- Supabase known-pitfalls final report recommends an approval-gated future-default-privileges migration proposal first, then code-only create-return explicit selects, then a Supabase type-generation script.
- Supabase known-pitfalls execution step 1 is complete as documentation-only preparation; the next gate is whether to apply the drafted default-privileges SQL or move to the code-only `.select("*")` cleanup first.
- Supabase known-pitfalls execution step 2 is complete; the code-only create-return select cleanup passed verification, and the next remaining candidate is the `types:supabase` script unless the user wants to apply the drafted default-privileges SQL first.
- Supabase known-pitfalls execution step 3 is complete; the low-risk code/process work is finished, and the only remaining candidate in this skill is the approval-gated default-privileges SQL proposal.
- Supabase known-pitfalls phase is now closed; future `public` table work should explicitly decide grants alongside RLS/policies instead of relying on old defaults, but no live default-privileges change was applied.
- Supabase performance-tuning phase has started in `loading`; no app code, schema, data, migration, index, extension, or Supabase state changes have been made.
- First-pass Supabase performance analysis found healthy current read/index/cache baselines, with Realtime/change fan-out and visit-update pressure as the main re-reporting candidates.
- First-pass Supabase performance report ranks realtime delivery overlap and visit-update fan-out above generic index creation.
- Supabase performance re-analysis refined the top candidate to a Broadcast-only realtime path; visit-only update suppression is deferred until freshness behavior is explicitly handled.
- Supabase performance final report recommends code-only Broadcast prep first, then an approval-gated SQL proposal to remove `public.bookmarks` and `public.groups` from native `supabase_realtime`.
- Supabase performance execution step 1 is code-only prep; no publication, schema, data, migration, index, trigger, or Supabase state change has been applied.
- Supabase performance execution step 2 changed live publication membership only; trigger-backed private Broadcast remains the canonical realtime path.
- Supabase performance execution is now at the next approval gate: verify dashboard/extension sync behavior and decide whether to remove redundant manual extension insert broadcasts.
- Supabase performance execution step 3 is code-only cleanup; trigger-backed private Broadcast remains intact.
- Supabase performance execution is now at the next approval gate: decide whether to do the low-priority extension bookmark GET payload trim, or close with visit-only suppression and full-list sort indexes deferred.
- Supabase performance execution step 4 is code-only payload cleanup for the extension fallback bookmark list route.
- Supabase performance-tuning phase is closed from a code/database-change standpoint; browser/manual realtime sync validation remains the validation gap.
- Supabase advanced-troubleshooting phase has started in `loading`; no app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made.
- Supabase advanced-troubleshooting first-pass analysis found no live lock, transaction, connection, advisor, Edge Function, or stuck enrichment issue; repeated private Realtime authorization failures are the main candidate for reporting.
- Supabase advanced-troubleshooting first-pass report ranks the private Realtime auth race as P1 and treats cumulative Realtime counters / historical `order_index` stats as non-execution caveats pending re-analysis.
- Supabase advanced-troubleshooting re-analysis confirmed the likely low-risk execution candidate: await Realtime auth before subscribing to private Broadcast channels in `useDashboardRealtime`, without changing RLS, channel topics, triggers, or publication state.
- Supabase advanced-troubleshooting final report recommends one code-only execution candidate: await Realtime auth before private Broadcast subscription in `useDashboardRealtime`; no database, policy, publication, or trigger change is recommended.
- Supabase advanced-troubleshooting execution step 1 is code-only; it changes private channel subscription timing only and leaves RLS, triggers, publication state, and extension behavior unchanged.
- Supabase advanced-troubleshooting phase is closed; browser/manual realtime interaction checks remain useful optional validation, not an open execution candidate.

---

## Blockers

1. None.
