# Supabase Common Errors Report Pass 1

## Phase

`reporting`

## Executive Read

The current Supabase shape is healthier than the code-level error handling in front of it. RLS is enabled on the core public tables, owner-scoped policies exist, and the service role key was not found in client-side code during this pass. The main common-error risk is not missing RLS; it is error identity getting lost at app and extension boundaries.

The first execution lane should be code-only and reversible:

1. stop dashboard loaders from turning Supabase failures into empty states
2. stop extension routes from mapping non-auth failures to `401`
3. replace optional first-row `.single()` calls with `.maybeSingle()` and explicit non-optional error handling

No schema or data mutation is recommended from this report pass.

## Ranked Findings

### P1: Dashboard Supabase load failures render as empty data

Files:

- `lib/supabase/queries.ts`
- `app/dashboard/page.tsx`

Current dashboard read helpers catch Supabase query errors, log them, and return `[]`. This makes common Supabase failures look like a legitimate empty library. It is especially risky for:

- `42501` RLS/permission failures
- `PGRST204` schema drift
- transient PostgREST/API failures
- expired or broken auth context that does not redirect cleanly

Recommendation:

- Let dashboard data loader failures throw.
- Keep a successful zero-row response as `[]`.
- Preserve `getUser()` as the auth gate.

Execution risk: low to medium. It changes failure UX from silent empty dashboard to route error handling. That is the correct failure mode, but it should be intentional.

### P1: Extension route catch blocks overuse `401 Unauthorized`

Files:

- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `app/api/extension/route-adapter.ts`
- `extension/js/api.js`

The extension API routes currently catch broad errors and return `401`. That can cause the popup to clear cached groups and show auth recovery when the actual problem is malformed JSON, invalid body shape, a duplicate race, or an internal Supabase/server failure.

Recommendation:

- Keep authentication failure as `401`.
- Return `400` for malformed JSON or invalid request body.
- Return `409` for duplicate group-name insert races.
- Return `500` for unexpected server/Supabase failures.

Execution risk: low. The route contract becomes more truthful, and extension transport already branches on `401`, `400`, and `409`.

### P1: Optional first-row lookups use `.single()`

Files:

- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

Optional first-row queries use `.single()` after `.limit(1)` and then mostly ignore errors. For empty user collections, the intended result is "no row", not a PostgREST not-acceptable error. `.maybeSingle()` fits these paths better.

Targets:

- `findNextGroupOrderIndex`
- `findNextBookmarkOrderIndex`
- note create order lookup
- todo create order lookup

Recommendation:

- Use `.maybeSingle()` for optional first-row lookup.
- Distinguish expected empty results from real query errors.
- Preserve order/rank fallback behavior.

Execution risk: low. It removes normal first-use error noise and improves diagnostics.

### P2: Auth helper errors are often collapsed into anonymous state

Files:

- `proxy.ts`
- `lib/dashboard/server/user.ts`
- `app/login/page.tsx`
- `app/reset-password/page.tsx`
- `app/reset-password/actions.ts`
- `app/api/extension/route-adapter.ts`

Several boundaries ignore the `error` side of `getUser()` or `getClaims()`. In many UI routes, redirecting when no user exists is fine. But extension/auth-sensitive paths should know whether they are handling a clean anonymous request, invalid/expired session, or a Supabase Auth service failure.

Recommendation:

- Re-analyze in pass 2 before patching.
- Prioritize extension route adapter and reset-password action if execution is needed.
- Keep broad proxy behavior conservative unless there is a concrete user-facing issue.

Execution risk: medium. Auth redirect semantics are easy to overcorrect.

### P2: Extension group duplicate race returns generic failure

Files:

- `app/api/extension/groups/route.ts`
- `lib/library/server/capture.ts`

The database has `groups_user_id_name_idx` as a unique index, and dashboard group create/update maps `23505` to a friendly duplicate message. Extension group POST pre-checks duplicates, but an insert-time race can still return `23505` and currently map to generic `500`.

Recommendation:

- Check errors from `findDuplicateGroupByName`.
- Map insert-time `23505` to `409`.

Execution risk: low.

### P3: Bookmark duplicate copy does not match product policy

Files:

- `app/api/extension/bookmarks/route.ts`
- `extension/js/save-bookmarks.js`
- `spec/reports/dashboard-scalability-performance.md`

The product decision says duplicate bookmarks are allowed. The extension bookmark route still labels any `23505` insert failure as "Bookmark already exists", and extension batch helpers count `409` as skipped duplicate bookmarks. Since bookmark IDs are generated and `(user_id, normalized_url)` is intentionally non-unique, this path is likely rare and does not prove same-URL duplicate rejection.

Recommendation:

- Do not add a unique bookmark URL constraint.
- Re-analyze wording during pass 2.
- Only patch if there is a clear route/message mismatch that affects real extension behavior.

Execution risk: low, but payoff is lower than P1/P2 items.

## Non-Findings

- Core public tables returned by MCP have RLS enabled.
- Owner-scoped CRUD policies exist on bookmarks, groups, notes, and todos.
- RLS policies already wrap `auth.uid()` with `select`, matching current Supabase performance guidance.
- `bookmarks_user_id_normalized_url_idx` is intentionally non-unique, matching the locked duplicate-bookmarks decision.
- Service role usage was not found in public client code during this pass.

## Supabase Advisor Note

The current security advisor read reports:

- `auth_leaked_password_protection`: warning, externally facing, Auth category

This is not a code execution patch for `supabase-common-errors`, but it should be carried forward into the Supabase pitfalls/security portion. It is a dashboard/Auth configuration recommendation rather than an app-code bug.

## Re-Analysis Questions

1. Should dashboard read helpers throw raw Supabase errors, or should they wrap them in a small typed load error for cleaner route-level logging?
2. Should extension route parsing use a shared JSON/body validation helper to keep bookmarks and groups consistent?
3. Which `.single()` calls are truly optional first-row lookups versus required detail fetches that should keep `.single()`?
4. Which auth boundaries need error logging/classification, and which should stay as simple redirects?
5. Should bookmark duplicate `409` handling be renamed to primary-key conflict handling, or left alone because the path is effectively unreachable in normal saves?

## Recommended Next Step

Move to `re-analyzing` with a narrow validation pass over:

- exact dashboard loader failure behavior
- extension API request parsing and status mapping
- optional versus required `.single()` calls
- auth helper error handling boundaries
- duplicate semantics against the locked duplicate policy
