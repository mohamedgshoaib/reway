# Supabase Common Errors Final Report

## Phase

`final report`

## Status

`closed`

Execution is complete. Steps 1 through 4 are complete; see `execution-plan.md` for the live patch log.

## Bottom Line

The database fundamentals are not the problem in this pass. Current MCP reads show RLS enabled on the core public tables, owner-scoped policies present, and explicit table grants present for existing public tables. The most important common-error issue is that the app sometimes loses Supabase error identity before it reaches the user or extension.

The execution queue should stay code-only:

1. make dashboard initial loaders fail closed on Supabase errors
2. fix extension route request validation and status mapping
3. replace optional first-row `.single()` lookups with `.maybeSingle()`
4. fold bookmark conflict wording back into the duplicate-bookmarks-allowed product decision
5. leave broader auth redirects and bookmark duplicate policy untouched beyond wording cleanup

## Evidence Summary

Read-only Supabase MCP:

- `profiles`, `groups`, `bookmarks`, `notes`, and `todos` have RLS enabled.
- Owner-scoped CRUD policies exist for core dashboard tables.
- Existing public tables have grants for `anon`, `authenticated`, and `service_role`.
- `groups_user_id_name_idx` is unique.
- `bookmarks_user_id_normalized_url_idx` is non-unique by design.
- Security advisor reports `auth_leaked_password_protection` disabled.

Current Supabase docs/changelog context:

- Public schema tables can require explicit grants for Data API / GraphQL visibility under the 2026 Data API exposure change.
- Supabase JS packages drop Node.js 20 support after June 30, 2026.
- RLS with unauthenticated `auth.uid()` returns no rows, and update paths need visible rows.

Code evidence:

- `lib/supabase/queries.ts` returns empty arrays on Supabase read errors.
- extension routes catch broad exceptions and often return `401`.
- optional first-row order lookups use `.single()` where `.maybeSingle()` is the correct no-row shape.
- dashboard required-row detail and insert-return paths use `.single()` appropriately.

## Findings

### P1: Dashboard load errors can appear as an empty library

Files:

- `lib/supabase/queries.ts`
- `app/dashboard/page.tsx`

`getBookmarks`, `getGroups`, `getNotes`, and `getTodos` currently log Supabase errors and return `[]`. That can turn a `42501`, `PGRST204`, schema-cache issue, transient API failure, or auth-context problem into a legitimate-looking empty dashboard.

Execution recommendation:

- Add a tiny Supabase read-error wrapper in `lib/supabase/queries.ts`.
- Throw on query error.
- Keep returning actual empty arrays for successful zero-row responses.
- Let existing route/error boundaries handle the failure.

Why first:

- It protects against the scariest user perception: "my library disappeared."

### P1: Extension API status mapping is too broad

Files:

- `app/api/extension/utils.ts`
- `app/api/extension/route-adapter.ts`
- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `extension/js/api.js`

Broad catches in extension routes can return `401 Unauthorized` for malformed JSON, invalid body shape, duplicate races, and internal failures. The extension transport clears cached groups on `401`, so misclassification can create auth-recovery UX for non-auth errors.

Execution recommendation:

- Add safe JSON/body validation.
- Return:
  - `400` for malformed JSON or invalid payload
  - `401` for actual missing/invalid auth
  - `409` for duplicate group-name conflict
  - `500` for unexpected Supabase/server failures
- Preserve CORS headers and current extension transport behavior.

Why second:

- It improves diagnostics and prevents unnecessary extension auth recovery.

### P1: Optional first-row queries should use `.maybeSingle()`

Files:

- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

Optional "first row" ordering lookups use `.single()`, which can produce no-row PostgREST errors in normal first-use states.

Execution recommendation:

- Convert only these optional lookups:
  - `findNextGroupOrderIndex`
  - `findNextBookmarkOrderIndex`
  - note create `minOrderData`
  - todo create `minOrderData`
- Keep required-row `.single()` calls unchanged.
- Throw on real query errors and preserve `0` fallback for no-row results.

Why third:

- It removes normal no-row error noise without changing required data contracts.

### P2: Extension auth adapter should distinguish auth failure from Auth service failure

File:

- `app/api/extension/route-adapter.ts`

`getAuthenticatedExtensionUserId` currently ignores `getUser()` errors and returns `401` when no user is available. That is fine for clean anonymous requests, but non-auth Supabase/Auth service failures should not necessarily be reported as login-required.

Execution recommendation:

- If folded into step 2, classify `getUser()` errors narrowly:
  - auth/session failures stay `401`
  - transient Auth/API failures become `503` or `500`
- Keep server logs.

Why not first:

- Auth status semantics are more sensitive than body validation and loader fixes.

### P3: Bookmark duplicate wording is misleading but lower payoff

Files:

- `app/api/extension/bookmarks/route.ts`
- `extension/js/save-bookmarks.js`
- `extension/popup.js`

Duplicate bookmarks are allowed by locked product decision. The route's `23505` response says "Bookmark already exists", but the current schema has no unique `(user_id, normalized_url)` constraint. A `23505` on bookmark insert is more likely a primary-key conflict than same-URL duplicate rejection.

Recommendation:

- Do not add any bookmark uniqueness constraint.
- Defer wording cleanup unless it is touched by the extension route status patch.
- If touched, use generic conflict wording server-side and avoid implying same-URL duplicates are rejected.

## Non-Findings

- No client-side service role exposure was found.
- Core RLS is enabled on current public tables.
- Current RLS policies use `select auth.uid()` style, which matches Supabase performance guidance.
- Existing core table grants are present, so the 2026 Data API exposure change is a future migration discipline issue, not a current app outage.
- No schema/data mutation is needed for this skill.

## Carry Forward

To `supabase-known-pitfalls`:

- Security advisor: leaked password protection disabled.
- Existing broad public table grants deserve review alongside RLS exposure posture.
- Future public tables should include intentional grants if they need Data API access.
- Avoid service role expansion in browser/client code.

To `supabase-performance-tuning`:

- Keep user-scoped filters paired with RLS-heavy reads.
- Existing indexes should be reviewed later, but this common-errors pass found no missing-index blocker.

To product/UX memory:

- Do not convert duplicate bookmark detection into duplicate bookmark rejection.
- Do not add a unique `(user_id, normalized_url)` constraint.

## Executed Outcome

Completed in this phase:

1. dashboard loaders now throw readable Supabase load errors instead of rendering failures as empty libraries
2. extension routes now validate request bodies and return truthful `400` / `401` / `409` / `500` responses
3. optional first-row order lookups now use `.maybeSingle()` where empty collections are normal
4. extension bookmark conflict wording no longer implies duplicate-bookmark rejection

Verification used after each approved execution step:

- `pnpm typecheck`
- `pnpm build`
