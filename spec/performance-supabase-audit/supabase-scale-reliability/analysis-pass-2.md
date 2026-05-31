# Supabase Reliability Patterns Analysis — Pass 2

## Phase

`re-analyzing`

## What This Pass Answered

This pass narrowed the open questions from `report-pass-1.md`:

1. Which extension worker operations are retry-safe or transport-alignment-safe today?
2. Is bookmark creation idempotent enough to justify retry?
3. What is the smallest dashboard outage recovery change that matches current Next.js conventions?

## Additional Verification

Local repo checks:

- `extension/background.js`
- `extension/js/api.js`
- `extension/popup.js`
- `app/error.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/layout.tsx`
- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`
- `app/dashboard/actions/bookmarks.ts`

Official Next.js docs checked:

- [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [error.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)

Confirmed pattern from docs:

- route-segment `error.tsx` is the supported App Router recovery boundary
- it must be a Client Component
- it receives `error` and `reset`
- `reset()` is the correct recovery path for rerendering a failed segment

## Safe / Unsafe Reliability Buckets

### Safe execution bucket

#### 1. Dashboard route error UI

**Why it is safe**

- It is UI-only recovery shaping.
- It follows the official Next.js route-segment `error.tsx` pattern.
- It does not alter auth, query shape, mutation semantics, or realtime behavior.
- The repo already has a global `app/error.tsx`, so a dashboard-scoped version can follow an existing local visual pattern instead of inventing a new one.

**Expected scope**

- add `app/dashboard/error.tsx`
- use `reset()` for retry
- tailor the message to dashboard load failure rather than generic app failure
- optionally include a home navigation path, matching existing error-page conventions

#### 2. Worker-side read/preflight transport alignment

**Why it is probably safe**

The background worker has several requests that are either read-only or preflight-like:

- `fetchExtensionGroups(baseUrl)` in `extension/background.js`
- `fetchGroupBookmarkUrls(baseUrl, groupId)` in `extension/background.js`

These can likely adopt the shared popup transport behavior without introducing duplicate-write risk, because they do not create bookmarks. The main benefit would be:

- localhost fallback through `getSettings()`
- consistent structured error parsing
- consistent auth cache clearing on `401`

**Boundary**

This pass does not yet recommend execution, only that it remains a legitimate candidate for the final report.

### Unsafe execution bucket

#### 1. Generic retry for bookmark creation

**Why it remains unsafe**

- `createBookmarkRecord(...)` inserts a new row directly.
- There is no request id, idempotency token, or `onConflict` protection for extension bookmark creation.
- Duplicate bookmarks are intentionally allowed as a product decision.
- A network timeout after commit is indistinguishable from a true failure from the client’s perspective.

**Implication**

Retrying these writes blindly can create real duplicate rows and confusing UX.

Affected paths:

- popup save-page bookmark creation
- session save bookmark creation
- grabbed-link bookmark creation
- X/Twitter worker bookmark creation

#### 2. Offline queue / deferred replay for bookmark writes

**Why it remains unjustified**

An offline queue would be even riskier than simple retry unless each queued write had a safe dedupe or idempotency story. Right now it would add:

- state persistence complexity
- replay ambiguity
- duplicate risk
- new recovery UX demands

without a proven outage problem large enough to justify that complexity.

## Focused Outcome

The phase now has a tighter shape:

### Strong candidate

- dashboard route error UI via `app/dashboard/error.tsx`

### Plausible but secondary candidate

- align worker read/preflight requests with popup transport behavior

### Explicitly out of scope for execution

- blind retry for bookmark writes
- offline queue for bookmark writes
- generic circuit breaker layer around client writes
- custom SSR retry wrappers for dashboard Supabase reads

## Recommendation For Final Report

Keep the execution queue small:

1. Execute dashboard route error UI first.
2. Decide whether worker read/preflight transport alignment is worth doing in this phase only if it can stay read-only/preflight-only and avoid touching bookmark write replay semantics.
3. Close the phase if no additional safe candidate survives that filter.

## Next Step

Move to final `reporting` with a final recommendation set, explicit non-goals, and an approval-gated execution plan that starts with the dashboard route error boundary.
