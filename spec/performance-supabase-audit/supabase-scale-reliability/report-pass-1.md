# Supabase Reliability Patterns Report — Pass 1

## Status

`reporting`

## Executive Summary

Current reliability risk is moderate but concentrated. The dashboard already fails truthfully on Supabase read issues, and the popup already has a useful cached-group fallback. The main missing piece is a dashboard-specific recovery surface for route-startup failures. On the extension side, resilience is weaker, but the obvious fix is not "add retries everywhere" because bookmark writes are not replay-safe under the current duplicate-bookmarks-allowed policy.

## Ranked Findings

### P1 — Add a dashboard route error surface for startup outages

**Status:** execution candidate

**Evidence**

- `app/dashboard/page.tsx` fetches user, bookmarks, groups, notes, and todos together and throws on any failure.
- `app/dashboard/error.tsx` does not exist.
- `components/ErrorBoundary.tsx` is too deep in the tree to catch route-startup failures.

**Why it matters**

When Supabase auth or read calls fail during route startup, the dashboard has no route-owned recovery screen. The current behavior is honest, but it is not a polished failure mode for a core surface.

**Recommended direction**

- Add `app/dashboard/error.tsx`.
- Make it dashboard-native rather than generic framework fallback.
- Provide a retry action through Next.js route error reset.
- Keep it simple: truthful outage framing, retry, and a low-friction escape path.

**Why this is low risk**

This is UI-only recovery shaping. It does not change data behavior, auth policy, or mutation semantics.

### P1 — Do not add blind retry to extension bookmark writes

**Status:** explicit non-candidate

**Evidence**

- Popup save, session save, grabbed-link save, and X/Twitter background capture are mostly single-attempt writes today.
- Duplicate bookmarks are intentionally allowed.
- A timeout after server commit would make a blind client retry ambiguous and potentially duplicative.

**Why it matters**

This is the biggest trap in the phase. "Retry on failure" sounds resilient, but for these writes it can quietly create duplicate records and user confusion.

**Decision for this pass**

Do not treat generic retry as an execution candidate for bookmark creation.

**Carry-forward rule**

Only revisit write retry if we first add an idempotency mechanism or a different product-level duplicate suppression rule, neither of which belongs in this skill by default.

### P2 — Extension background transport should be aligned with popup transport

**Status:** re-analysis candidate

**Evidence**

- `extension/popup.js` benefits from cached group hydration, `apiFetch(...)`, auth-required handling, and invalid-group refresh behavior.
- `extension/background.js` still uses raw `fetch(...)` for group fetch/create, bookmark creation, and open-group bookmark fetch.

**Why it matters**

The background worker is effectively a second transport implementation with weaker reliability behavior and less structured error handling.

**Recommended re-analysis**

Identify which background requests can safely adopt the shared transport behavior without accidentally introducing popup-only assumptions or retrying unsafe writes.

### P2 — Custom SSR read retry is not a priority in this repo

**Status:** no action

**Evidence**

- The app uses `@supabase/ssr` with `@supabase/supabase-js` `^2.106.1`.
- Current Supabase guidance says official clients already retry transient `GET` and `HEAD` PostgREST reads.
- First-pass reliability gaps are more visible in extension-to-app HTTP seams than in dashboard SSR read wrappers.

**Decision**

Do not add custom read retry wrappers around dashboard SSR queries in this phase.

### P2 — Offline queue and circuit breaker work are not justified yet

**Status:** no action

**Evidence**

- The popup already has a cached group-read fallback for its most visible startup dependency.
- Import and enrichment flows already prefer partial completion plus explicit failure state.
- No concrete evidence yet shows a user-harming outage mode that needs IndexedDB queueing or client-side circuit breaker state.

**Decision**

Do not add offline queue, IndexedDB replay, or client circuit-breaker machinery in pass 1.

**Why**

That would add a lot of state complexity before the simpler recovery gaps are solved.

### P3 — Visit tracking remains correctly best-effort

**Status:** no action

**Evidence**

- `lib/bookmark-visits.ts` uses `sendBeacon(...)` first, then non-blocking `fetch(...).catch(() => {})`.
- Failed visit tracking affects ranking freshness, not capture integrity.

**Decision**

Keep visit tracking lossy and low-friction.

## First-Pass Execution Queue

1. Dashboard route error UI: candidate now.
2. Extension background transport alignment: inspect more before calling it safe.

## Re-Analysis Focus

1. Which background worker requests are read-only or preflight enough to share the popup transport seam safely?
2. Can worker-side auth, invalid-group, and unreachable-base handling be unified without changing bookmark write replay semantics?
3. Is a tiny health-check endpoint actually better than the existing authenticated route probes?

## Next Step

Move to `re-analyzing` by narrowing extension transport work into clearly safe and clearly unsafe buckets, and by defining the smallest dashboard outage UI worth executing.
