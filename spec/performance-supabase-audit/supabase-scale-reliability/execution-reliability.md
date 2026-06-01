# Supabase Reliability Patterns Execution Plan

## Status

`executed`

## Executed Candidates

### Candidate 1 — Dashboard route error boundary

**Target**

- `app/dashboard/error.tsx`

**Implemented shape**

- Client Component route error boundary
- dashboard-specific failure copy
- `reset()` retry action
- home navigation action
- visual pattern aligned to `app/error.tsx`
- dashboard palette class restored from the dashboard preference cookie on the client

**Result**

- UI-only
- no Supabase mutation
- no auth boundary change
- no retry semantics change

**Verification**

- `pnpm typecheck`
- `pnpm build`

**Notes**

- Browser/manual validation was not run in this execution step.
- No changes were made to worker transport, bookmark write retry, or offline replay behavior.

## Explicit Non-Goals For This Execution Pass

- no bookmark-write retry
- no offline queue
- no IndexedDB replay
- no circuit breaker
- no custom SSR retry wrapper
- no Supabase schema, policy, auth, or Realtime change

## Secondary Candidate

### Candidate 2 — Worker read/preflight transport alignment

**Target**

- `extension/background.js`

**Implemented scope**

- aligned worker read/preflight requests with the shared popup transport helper
- moved `fetchExtensionGroups()` onto `apiFetch("/api/extension/groups")`
- moved `fetchGroupBookmarkUrls(groupId)` onto `apiFetch("/api/extension/bookmarks...")`
- inherited localhost fallback, structured error parsing, and cached-group clearing on `401`

**Safe boundary preserved**

- read-only or preflight-like worker requests only

**Unsafe boundary preserved**

- do not include bookmark creation requests

**Verification**

- `pnpm typecheck`
- `pnpm build`

## Next Step

The approved reliability follow-up is complete. The phase can stay closed unless a new task explicitly reopens bookmark-write reliability semantics.
