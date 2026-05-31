# Supabase Reliability Patterns Analysis — Pass 1

## Phase

`analyzing`

## Scope Reviewed

Supabase/app reliability seams inspected in this pass:

- extension transport and popup flows
  - `extension/js/api.js`
  - `extension/js/save-bookmarks.js`
  - `extension/js/sessions.js`
  - `extension/js/grabber.js`
  - `extension/popup.js`
  - `extension/background.js`
- extension server routes
  - `app/api/extension/bookmarks/route.ts`
  - `app/api/extension/groups/route.ts`
  - `app/api/extension/route-adapter.ts`
  - `app/api/extension/utils.ts`
- dashboard/server reads
  - `app/dashboard/page.tsx`
  - `app/dashboard/layout.tsx`
  - `lib/dashboard/server/user.ts`
  - `lib/supabase/queries.ts`
  - `lib/library/server/reads.ts`
  - `components/ErrorBoundary.tsx`
- mutation/enrichment support
  - `lib/library/server/capture.ts`
  - `components/dashboard/content/useImportHandlers.ts`
  - `components/dashboard/content/bookmark-enrichment.ts`
  - `lib/bookmark-visits.ts`

## Current Reliability Posture

The app already has a few solid reliability behaviors:

- dashboard server reads fail closed with explicit thrown errors instead of silently rendering partial or stale data
- popup group loading uses cached groups on startup and only shows a hard error when no cached groups exist
- auth failures on extension routes are normalized to `401`, and auth service failure is shaped as `503`
- bookmark visit tracking is intentionally lossy and non-blocking, which is acceptable for a secondary signal

The main gaps are not broad "Supabase is unreliable" issues. They are narrower:

1. dashboard startup failure handling is still coarse and route-level
2. extension write flows have almost no transient retry or recovery layer
3. several write paths cannot safely gain blind retry because duplicate bookmarks are intentionally allowed

## Findings

### P1 — Dashboard startup has no route-specific outage recovery surface

**Evidence**

- `app/dashboard/page.tsx` loads `getUser()`, `getBookmarks()`, `getGroups()`, `getNotes()`, and `getTodos()` in a single `Promise.all(...)`.
- Any one of those failures throws and aborts the full route render.
- There is no `app/dashboard/error.tsx`.
- `components/ErrorBoundary.tsx` is rendered inside `DashboardPage`, so it cannot catch failures that happen before the page tree is returned.

**Reliability impact**

If Supabase read access or auth resolution has a transient outage, the dashboard falls through to the framework-level error path instead of a dashboard-specific recovery UI with retry guidance. That makes the failure truthful, but rough.

**Why this is a candidate**

This is the cleanest high-value reliability improvement so far because it does not need speculative offline logic or risky mutation retries. It is a bounded UI recovery surface for a real app-level outage mode.

### P1 — Extension write resilience is single-attempt and mostly replay-unsafe

**Evidence**

- `extension/js/save-bookmarks.js` saves bookmark batches sequentially, but each write is a single `apiFetch(...)` attempt.
- `extension/js/sessions.js` and `extension/js/grabber.js` surface the first non-conflict failure and stop.
- `extension/popup.js` save-page flow uses a single `apiFetch("/api/extension/bookmarks")` call.
- `extension/background.js` X/Twitter bookmark capture uses raw `fetch(...)` instead of `apiFetch(...)`, with no auth recovery or structured status handling.
- Product policy allows duplicate bookmarks, so a request that times out after the server commits cannot be safely replayed blindly.

**Reliability impact**

Transient network failures, temporary app unavailability, or ambiguous timeout cases currently mean "fail now and ask the user to try again." That is acceptable for now, but it is not resilient capture behavior. At the same time, naïve retries would risk duplicate bookmarks because the system intentionally permits them.

**Why this matters**

This phase should separate:

- safe read retry
- safe preflight retry
- unsafe write replay without idempotency

That distinction is central to avoiding reliability work that quietly harms data quality.

### P2 — Popup groups have a reasonable cached-read fallback, but background flows bypass it

**Evidence**

- `extension/popup.js` `hydrateGroups()` reads cached groups first, renders them if present, and refreshes in the background.
- `extension/js/api.js` clears cached groups on `401`.
- `extension/background.js` group fetch/create and bookmark create for X/Twitter capture use raw `fetch(...)` directly.
- Those background flows do not reuse popup cache, `apiFetch(...)`, auth-required handling, invalid-group refresh handling, or localhost reachability fallback.

**Reliability impact**

The primary popup UX has some startup resilience already. The background capture path is less forgiving and less diagnosable even though it uses the same app APIs.

**Why this matters**

If we add any extension reliability improvements, the background path should not be left behind as a parallel, weaker transport seam.

### P2 — Current app reads already benefit from Supabase-side idempotent read retry, but extension fetches do not

**Evidence**

- The repo is on `@supabase/supabase-js` `^2.106.1`.
- Current Supabase guidance says official clients automatically retry transient `GET` and `HEAD` PostgREST requests.
- Dashboard user-facing reads go through `@supabase/ssr` clients.
- Extension reads and writes use plain browser `fetch(...)` to app-owned routes.

**Reliability impact**

The dashboard’s direct Supabase read path already has a better transient-read posture than the extension path. That means the extension deserves more scrutiny than the server-rendered dashboard for retry work.

**Interpretation**

This lowers the urgency of wrapping SSR read calls with custom retry logic. It raises the value of carefully shaping retry behavior around extension-to-app HTTP seams instead.

### P3 — Import and enrichment flows prefer completion and truthful failure over rollback

**Evidence**

- `components/dashboard/content/useImportHandlers.ts` creates bookmarks with bounded concurrency, counts failures, and continues the batch.
- Enrichment is backgrounded after create and records explicit failed state when enrichment errors occur.
- There is no rollback if part of an import succeeds and later items fail.

**Reliability impact**

This is mostly aligned with product truth: capture first, enrich later. Partial import completion is acceptable if failure is visible. It is not a strong candidate for offline queue or circuit-breaker work unless the user specifically wants resumable import semantics.

### P3 — Visit recording is intentionally best-effort and should stay that way

**Evidence**

- `lib/bookmark-visits.ts` uses `sendBeacon(...)` when available and falls back to fire-and-forget `fetch(...).catch(() => {})`.
- `app/api/bookmarks/visits/route.ts` validates input, caps batch size, and returns `204` on empty or success.

**Reliability impact**

Dropped visit events during outages will affect ranking freshness, but not data integrity or core capture behavior. This should remain a low-priority seam in this skill.

## Early Candidate Directions

These are candidate directions only, not execution recommendations yet:

1. Add a dashboard route error surface at `app/dashboard/error.tsx` with a reset path and outage-specific copy.
2. Normalize extension background transport through a shared request helper so popup and worker flows treat auth, unreachable base URLs, and structured errors consistently.
3. Consider bounded retry only for extension reads and clearly retry-safe operations.
4. Do not add blind retry for bookmark creation unless the request path gains an idempotency mechanism first.
5. Treat offline queue as evidence-gated; nothing in pass 1 justifies IndexedDB complexity yet.

## Questions For Re-Analysis

1. Which extension operations are genuinely retry-safe today?
2. Is there any existing server-side uniqueness or client-generated identifier we can leverage for idempotent bookmark creation?
3. Would a route-level dashboard error UI plus a small extension transport hardening patch be enough to close this skill cleanly?
4. Is a health-check endpoint useful here, or would it duplicate existing auth/read probes without improving user recovery?

## Next Step

Move to `reporting` by ranking the findings, separating low-risk execution candidates from evidence-only observations, and explicitly rejecting any retry pattern that would conflict with the duplicate-bookmarks-allowed decision.
