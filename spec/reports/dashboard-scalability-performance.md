# Dashboard Scalability & Performance Future Concerns Report

Scope: anticipate bottlenecks for **500+ concurrent users**, each with **50–100 groups** and **500–1000 bookmarks**, based on the performance guidance under:

- `.agents/skills/vercel-react-best-practices/*`
- `.agents/skills/virtual-lists/*`
- `.agents/skills/supabase-postgres-best-practices/*`
- `.agents/skills/system-design/*`

This document focuses on **future, high-impact risks** and **what to do when they show up** (symptoms, mitigations, expected gains) at the stated scale.

Validation note: the previous `react-performance-best-practices` source has been removed. The report remains useful, but should now be treated as a validated future-risk checklist, not a fully measured benchmark report.

Supabase validation note: the `supabase` skill was invoked after this review. Current Supabase guidance was checked against the Supabase changelog, and the local CLI was discovered through `pnpm exec supabase` at v2.101.0. Initial CLI validation was blocked because the workspace is not linked to the target project, the target project ref `josjxbrgsaugqsnyhdaf` is not visible in the authenticated CLI project list, no project `.mcp.json` exists, Docker/local Supabase is not running, and no direct Postgres `--db-url` is available in the repository. A later authenticated Supabase MCP session reached the live database and validated the index/query-plan items below.

### Validation status legend

- **Validated in code**: confirmed from current repository files.
- **Partially validated**: the code supports the claim, but production state or runtime profiling was not available.
- **Not validated**: cannot be confirmed from the current repository alone.
- **Outdated**: source or recommendation references removed/renamed material.

---

## System model (what “scale” means here)

### Expected hot paths

- **Cold dashboard load** (`/dashboard`): fetch user + initial bookmarks/groups/notes/todos.
- **Steady-state interaction**: searching, selection mode, drag-and-drop reorder, opening preview/edit sheet.
- **Write-heavy bursts**: importing bookmarks (hundreds/thousands) + enrichment.
- **Cross-tab/device updates**: realtime sync (broadcast updates) + optimistic updates.

### Primary resource constraints

- **Postgres query time**: sequential scans, missing indexes, inefficient RLS patterns.
- **Postgres connection pressure**: too many concurrent queries during imports/enrichment.
- **Next.js server action latency**: avoid waterfalls; reduce “fetch then filter in JS”.
- **Client CPU/render time**: avoid re-rendering large lists; avoid expensive per-item work; use `content-visibility`.
- **Network egress**: avoid sending entire datasets repeatedly; avoid unnecessary serialization.

---

## Findings by layer

## 1) Database (Supabase/Postgres)

### 1.1 Missing/incorrect indexes for common filters

**Risk**: CRITICAL. Missing indexes on columns used in `WHERE` (including RLS columns like `user_id`) can cause sequential scans and exponential slowdowns as row counts grow.

**Validation status**: Validated live with Supabase MCP.

The repository does not include Supabase migration/index DDL under `supabase/`; only email templates are present. Live MCP inspection confirmed that the deployed database does have the critical user-scope indexes, but the migration source of truth is still missing from the repository.

Validated live database state:

- Postgres version: `17.6`.
- Current live row estimates: `bookmarks` 935, `groups` 105, `notes` 135, `todos` 161.
- RLS is enabled on `bookmarks`, `groups`, `notes`, and `todos`.
- RLS policies use `(select auth.uid()) = user_id`, which is the performant wrapped form Supabase recommends for RLS auth function predicates.
- `bookmarks_user_id_idx` exists.
- `bookmarks_user_id_group_id_order_index_idx` exists and covers the group-filtered bookmark path better than a plain `(user_id, group_id)` index.
- `bookmarks_user_id_normalized_url_idx` exists for duplicate checks.
- `groups_user_id_idx`, `notes_user_id_idx`, and `todos_user_id_idx` exist.

Representative live plans:

- Dashboard bookmark read under authenticated RLS: `Index Scan using bookmarks_user_id_idx`, 248 rows for the largest current user, execution about `0.67ms`.
- Extension all-bookmarks read with explicit `user_id`: `Index Scan using bookmarks_user_id_idx`, 248 rows, execution about `0.54ms`.
- Extension group-filtered bookmark read: `Index Scan using bookmarks_user_id_group_id_order_index_idx`, 43 rows, execution about `0.22ms`.
- Duplicate check by `user_id + normalized_url`: `Index Scan using bookmarks_user_id_normalized_url_idx`, execution about `1.62ms` for a sampled duplicated URL.
- Notes/todos reads use `notes_user_id_idx` and `todos_user_id_idx`, then sort the small per-user result sets.

New validated concern: `bookmarks_user_id_normalized_url_idx` is not unique, and live data contains duplicate `(user_id, normalized_url)` pairs. The largest sampled duplicate had 9 rows for one user and normalized URL. The app-level duplicate check can detect existing rows, but the database does not enforce the invariant under concurrent saves/imports.

Recommendation:

- Keep the current user-scope indexes.
- Before adding a unique `(user_id, normalized_url)` constraint, decide whether historical duplicates should be merged, preserved, or allowed for different capture contexts.
- If dashboard accounts grow far beyond the current scale, consider order-aware indexes such as `(user_id, order_index, created_at desc)` for dashboard reads/new-bookmark order lookup, and `(user_id, completed, order_index, created_at desc)` for todos. Current plans sort small per-user sets cheaply, so this is not urgent.

### 1.2 Import & enrichment write bursts

**Risk**: MEDIUM-HIGH.

**Validation status**: Validated in code.

When users import 500–1000 bookmarks, the app can generate:

- many inserts
- many enrichment updates
- many concurrent network requests

**Current state**: generally good.

- Import uses explicit concurrency limits.
- Enrichment is performed with separate concurrency.

Validated references:

- `components/dashboard/content/useImportHandlers.ts` uses `CREATE_CONCURRENCY = 3`.
- `components/dashboard/content/useImportHandlers.ts` uses `ENRICH_CONCURRENCY = 2`.
- Enrichment still runs through server actions/request-triggered work, so saturation risk remains if many users import at once.

**Scaling concern**: if 500 users import concurrently, DB can get hammered.

**Recommendation (only if you observe DB saturation)**:

- Consider moving enrichment to a background worker/queue (Edge Function + queue, or external worker) rather than doing it in the request lifecycle.
- Add server-side throttling per user.

---

## 2) Next.js server actions & data fetching

### 2.1 Waterfalls on dashboard load

**Risk**: CRITICAL if sequential; otherwise fine.

**Validation status**: Validated in code.

`app/dashboard/page.tsx` currently loads `getUser()`, `getBookmarks()`, `getGroups()`, `getNotes()`, and `getTodos()` through `Promise.all`, so the hot dashboard load path is parallel today.

**Recommendation**:

- Keep data fetches independent and parallel.
- If new data sources are added later, avoid adding them sequentially.

### 2.2 Serialization pressure (RSC boundary)

**Risk**: MEDIUM-HIGH.

**Validation status**: Validated in code.

At 1000 bookmarks, the payload can be large.

Current dashboard bookmark select includes `description`, `favicon_url`, `og_image_url`, `image_url`, `screenshot_url`, status/enrichment fields, visit fields, and ordering fields in `lib/library/server/reads.ts`. That is appropriate for a rich first paint, but it makes payload size a real scalability lever.

**Recommendation (only if you see slow TTFB / large HTML payloads)**:

- Reduce fields returned by `getBookmarks()` to only what the dashboard needs for initial paint.
- Lazy-load heavy fields (screenshots, OG images) on demand.
- Consider streaming with Suspense boundaries if you introduce additional panels.

---

## 3) Client rendering & interaction

### 3.1 Long list rendering cost (500–1000 bookmarks)

**Risk**: HIGH.

**Validation status**: Validated in code.

Even with good memoization, rendering 1000 React nodes with images can be costly.

**Current mitigations observed**:

- Long-list optimization patterns exist in bookmark components (e.g., `content-visibility: auto` usage in places).
- Favicons use `loading="lazy"`.
- `BookmarkBoard` still maps and renders every visible bookmark into React nodes.

**When to introduce virtualization**:

- If you observe frame drops and slow interactions at 1000 items, evaluate virtualization for the `list` view.
- For grid/card views, `content-visibility` + image lazy-loading can often be “good enough” until much higher counts.
- Do not treat virtualization as a drop-in change: `BookmarkBoard` uses `@dnd-kit` `SortableContext`, keyboard navigation, selection state, and drag overlays. A virtualization sprint needs to preserve those interactions deliberately.

### 3.2 Expensive per-item computations

**Risk**: MEDIUM.

**Validation status**: Partially validated.

Examples:

- `toLocaleDateString` inside `.map` for every bookmark on every render.

Current code is better than this example: `BookmarkBoard` uses a module-level `Intl.DateTimeFormat` and formats dates in a memoized display-map. Remaining per-item work includes `getDomain`, display-title normalization, array mapping, and `bookmarks.find(...)` callbacks inside rendered items.

**Recommendation**:

- Keep per-item computation minimal.
- Avoid creating regex/formatters inside loops.

### 3.3 Sorting and derived data

**Risk**: MEDIUM.

**Validation status**: Validated in code.

At 1000 bookmarks, `toSorted()` and repeated `Map` creation can be noticeable if triggered frequently.

**Current state**:

- `BookmarkBoard` uses `useMemo` for ordered/rendered bookmarks.
- `useDashboardState.sortBookmarks` sorts on many state update paths.
- `useBookmarkBuckets` re-buckets and sorts per visible group in folder view.
- `useDashboardRealtime` updates one record logically, but still scans arrays and often re-sorts the full bookmark array per event.

**Recommendations (only if profiling shows re-sort churn)**:

- Move sorting to the state update path (when bookmarks change) instead of on render.
- Maintain stable “order arrays” per group (ids) to avoid repeated sorting of full objects.

### 3.4 Event listeners and selection mode

**Risk**: LOW-MEDIUM.

**Validation status**: Validated in code.

Global message listeners exist for extension integration and realtime.

**Recommendation**:

- Ensure listeners are installed once per mount and cleaned up.
- Prefer `useGlobalEvent` (already used) to centralize.

---

## 4) Realtime, multi-tab, and optimistic updates

### 4.1 Realtime broadcast fan-out

**Risk**: MEDIUM.

**Validation status**: Partially validated.

For each client session, realtime channels receive broadcasts and update local state.

**Potential issue at scale**:

- Too-frequent updates can trigger frequent list re-renders.

**Recommendation (only if it becomes noisy)**:

- Batch updates (queue and flush every 50–100ms) to reduce render frequency.
- Prefer updating only the changed record. Current code updates individual records semantically, but full-array scans, copies, and sorts still happen in several realtime paths.

### 4.2 Reorder write amplification

**Risk**: MEDIUM-HIGH.

**Validation status**: Validated in code.

Drag reorder currently builds one `{ id, order_index }` update per item in the reordered list, then the server action sends one Supabase update per row with `Promise.all`. This is acceptable for small groups, but it can create avoidable write pressure for 500–1000 item groups or frequent drag operations.

**Recommendation (when reorder traffic becomes visible in DB metrics)**:

- Persist only the moved item where fractional ordering can represent the new position.
- Or add a Postgres RPC/bulk update path so one server call performs the reorder transactionally.
- Keep optimistic UI, but reduce per-drag database round trips.

Live validation note:

- A representative single bookmark reorder update plans through `bookmarks_pkey` with a `user_id` filter, which is good for each individual row.
- The scalability risk is not row lookup quality; it is the current app behavior of sending one update per reordered item with `Promise.all`.

---

## 5) Import/Export

### 5.1 Import parsing CPU & memory

**Risk**: MEDIUM.

**Validation status**: Validated in code.

Parsing large HTML bookmark exports with DOMParser can be heavy.

Current parser uses `DOMParser` and recursively traverses the parsed document in `components/dashboard/content/import/parse-bookmarks-html.ts`.

**Recommendation (only if needed)**:

- Use a Web Worker for parsing to keep the UI responsive.
- Keep concurrency low enough to avoid saturating the device.

### 5.2 Export string building

**Risk**: LOW-MEDIUM.

**Validation status**: Validated in code.

Export builds a big HTML string in memory.

Current export logic builds a single `html` string, then creates a `Blob` in `components/dashboard/content/useExportHandlers.ts`.

**Recommendation (only if needed)**:

- Consider streaming/Chunk building or using `WritableStream` if exports become massive.

---

## Concrete checklist for 500+ concurrent users

- **Database**
  - Confirm indexes exist for `user_id` filters on all major tables.
  - Confirm `bookmarks(user_id, normalized_url)` index exists.
- **Server actions**
  - No sequential awaits in hot paths.
  - No “load everything then filter in JS”.
- **Client**
  - Avoid heavy per-item compute and repeated transforms.
  - Use `content-visibility: auto` for long lists.
  - Add virtualization only when needed.

---

## Integrity findings recorded after review

- The report is useful as a future-risk checklist for dashboard scalability, especially around database indexes, initial payload size, full-list rendering, realtime update churn, and import/enrichment bursts.
- The report is not a measured benchmark. It should not be used to claim current performance limits without profiling, Supabase query plans, and production DB metrics.
- The database section cannot be fully validated from repository files because Supabase migration/index definitions are not present.
- A Supabase validation attempt was performed with the local CLI and was blocked by missing project linkage/direct DB URL. A later authenticated Supabase MCP session validated live indexes, RLS policies, row estimates, advisors, and representative query plans.
- Live Supabase validation downgraded the original missing-index risk for current production state: the expected user-scope indexes exist and are used on key bookmark paths.
- Live Supabase validation added a new integrity concern: duplicate `(user_id, normalized_url)` rows exist because the duplicate-check index is not unique.
- Supabase performance advisors currently flag unused indexes: `idx_bookmarks_visit_count`, `bookmarks_user_visit_rank_idx`, `notes_created_at_idx`, `todos_created_at_idx`, and `todos_completed_idx`.
- Supabase security advisors currently warn that `SECURITY DEFINER` functions in `public` are executable by `anon` and/or `authenticated`: `bump_bookmark_open`, `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes`.
- The removed `react-performance-best-practices` reference has been replaced with current skills.
- A missing dashboard-specific concern was added: reorder write amplification from per-row order updates.

## Sprint TODO

Create a new dashboard performance and scalability report following the same methodology, but using only existing skills:

- `system-design` for scale assumptions, capacity framing, and bottleneck prioritization.
- `vercel-react-best-practices` for RSC payloads, waterfalls, bundle/client boundaries, and render churn.
- `virtual-lists` for list/grid virtualization tradeoffs with `@dnd-kit`, selection, and keyboard navigation.
- `supabase-postgres-best-practices` for query plans, RLS-aware indexes, connection pressure, and write amplification.

Required validation for the new report:

- Capture actual Supabase indexes and query plans for dashboard reads, duplicate checks, extension group/bookmark reads, and reorder writes.
- Measure dashboard payload size and render behavior with seeded 100, 500, and 1000 bookmark accounts.
- Profile search, group switching, drag reorder, import preview, import confirm, and realtime update bursts.
- Separate verified current bottlenecks from future risks and include confidence/status for every finding.
