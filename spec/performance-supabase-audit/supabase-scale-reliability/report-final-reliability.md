# Supabase Reliability Patterns Final Report

## Status

`reporting-final`

## Executive Summary

Current reliability work should stay small and deliberate. The dashboard needs a route-owned recovery UI for startup failures. That is the only strong execution candidate in this phase. Extension reliability does have rough edges, especially in the background worker, but generic write retry, offline replay, and broad client resilience machinery are not justified under the current duplicate-bookmarks-allowed model and missing idempotency contract.

## Final Findings

### P1 — Add a dashboard route error boundary for startup failures

**Status:** execution candidate

**Evidence**

- `app/dashboard/page.tsx` loads all startup dependencies together and throws on any failure.
- `app/dashboard/error.tsx` does not exist.
- The existing in-tree `ErrorBoundary` component cannot catch route-startup failures because the page must render before that boundary exists.
- Official Next.js App Router guidance supports route-segment `error.tsx` with `reset()` as the recovery path.

**Why it matters**

When dashboard auth or read dependencies fail during startup, the user currently falls through to a broader error path rather than a dashboard-specific recovery surface. That is honest but too blunt for a primary product surface.

**Recommended execution**

- Add `app/dashboard/error.tsx` as a Client Component.
- Follow the visual and interaction pattern already established in `app/error.tsx`.
- Tailor the copy to dashboard loading failure rather than a generic app-wide crash.
- Keep the actions minimal:
  - `Try again` using `reset()`
  - `Back to home`

**Why this is the best candidate**

- low risk
- no Supabase state changes
- no auth or mutation behavior changes
- immediate user-facing improvement in a real outage mode

### P2 — Worker read/preflight transport alignment is plausible but optional

**Status:** secondary candidate

**Evidence**

- `extension/background.js` still uses raw `fetch(...)` for:
  - `fetchExtensionGroups(baseUrl)`
  - `fetchGroupBookmarkUrls(baseUrl, groupId)`
- popup transport already has structured behavior in `extension/js/api.js`:
  - localhost fallback via `getSettings()`
  - structured JSON/body error parsing
  - auth cache clearing on `401`

**Why it matters**

The worker currently has a weaker transport seam than the popup for read and preflight operations.

**Why it is not the first execution item**

- it is smaller-value than the dashboard route error UI
- it needs careful scoping so we only touch read/preflight requests
- it must not blur into write retry or create ambiguous transport behavior for bookmark creation

**Execution rule if revisited**

Only include worker operations that are read-only or preflight-like. Do not extend the alignment patch into bookmark creation requests in this phase.

### P1 — Blind retry for extension bookmark writes remains explicitly rejected

**Status:** non-candidate

**Evidence**

- extension bookmark creation has no idempotency token, request id, or conflict contract that would make replay safe
- duplicate bookmarks are allowed by product decision
- a timeout after commit is ambiguous from the client perspective

**Decision**

Do not execute:

- generic retry for popup bookmark save
- generic retry for session save bookmark writes
- generic retry for grabbed-link bookmark writes
- generic retry for X/Twitter bookmark writes

### P2 — Offline queue and circuit-breaker work remain unjustified

**Status:** non-candidate

**Evidence**

- popup group loading already has a lightweight cached-read fallback
- import and enrichment flows already favor partial completion plus explicit failure state
- no evidence in this repo currently justifies IndexedDB replay or client circuit-breaker complexity

**Decision**

Do not execute:

- offline queue
- deferred replay
- IndexedDB persistence for failed saves
- circuit breaker state around extension or dashboard client writes

### P3 — Custom SSR retry wrappers are unnecessary here

**Status:** no action

**Evidence**

- dashboard reads use `@supabase/ssr` with `@supabase/supabase-js` `^2.106.1`
- current Supabase guidance says official clients already retry transient `GET` and `HEAD` PostgREST reads

**Decision**

Do not add custom retry wrappers around dashboard SSR reads in this phase.

## Final Execution Queue

1. Add `app/dashboard/error.tsx`.
2. Verify with:
   - `pnpm typecheck`
   - `pnpm build`
3. Update execution doc, tracker, and session note.
4. Revisit worker read/preflight transport alignment only if you want a second, smaller follow-up after the dashboard error boundary is complete.

## Close Criteria

The `supabase-reliability-patterns` phase can close after:

- the dashboard route error boundary is either approved, executed, and verified; or
- explicitly declined and documented

The worker transport alignment item is optional. If we do not execute it, the phase can still close cleanly once the dashboard candidate is handled and the non-goals remain documented.
