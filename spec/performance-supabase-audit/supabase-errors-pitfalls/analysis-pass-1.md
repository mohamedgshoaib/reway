# Supabase Common Errors Analysis Pass 1

## Phase

`analyzing`

## Sources Loaded

- Skills: `supabase`, `supabase-common-errors`
- Current Supabase changelog context:
  - Data API exposure/grant behavior changed for new projects in 2026.
  - Node 20 support is scheduled to end for Supabase JS packages after June 30, 2026.
- Supabase docs search:
  - RLS returns no rows when `auth.uid()` is `null`.
  - `UPDATE` needs readable rows under RLS.
  - request-scoped auth context matters when relying on RLS.
- Read-only MCP:
  - `public.profiles`, `groups`, `bookmarks`, `notes`, and `todos` all have RLS enabled.
  - Security advisor currently reports `auth_leaked_password_protection` as a warning.
  - Policies exist for owner-scoped CRUD on core tables.
  - `groups_user_id_name_idx` is unique; `bookmarks_user_id_normalized_url_idx` is intentionally non-unique.
- Code inventory:
  - Supabase clients: `lib/supabase/server.ts`, `client.ts`, `admin.ts`, `proxy.ts`
  - dashboard reads/mutations: `lib/supabase/queries.ts`, `lib/dashboard/server/library-mutations.ts`, `lib/library/server/*`
  - auth routes/actions: `app/auth/*`, `app/login/actions.ts`, `app/reset-password/actions.ts`
  - extension API: `app/api/extension/*`
  - extension transport: `extension/js/api.js`, `save-bookmarks.js`, `grabber.js`, `sessions.js`

## Findings

### P1: Dashboard initial data loaders convert Supabase failures into empty state

Files:

- `lib/supabase/queries.ts`
- `app/dashboard/page.tsx`

`getBookmarks`, `getGroups`, `getNotes`, and `getTodos` log Supabase errors and return `[]`. Because `DashboardPage` awaits those functions in `Promise.all`, a PostgREST schema error, RLS problem, expired auth context, or transient API failure can render as an empty dashboard instead of a recoverable load failure.

Why it matters:

- Common errors such as `42501`, `PGRST204`, and API connectivity failures lose their error identity at the route boundary.
- A user can see apparent data loss when the real state is a fetch failure.
- The dashboard already has route-level loading and an error boundary, so it has a better place to surface load failure than silent empty arrays.

Likely execution shape:

- Make core dashboard loaders fail closed for Supabase errors instead of returning empty arrays.
- Keep unauthenticated redirect handled by `getUser`.
- Preserve empty arrays only when the query succeeds with no rows.

### P1: Extension routes misclassify non-auth failures as `Unauthorized`

Files:

- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `app/api/extension/route-adapter.ts`

The extension route `catch` blocks return `401 Unauthorized` for any thrown error. That means malformed JSON, invalid request body shape, unexpected helper errors, and some Supabase exceptions can be labeled as auth failures. In `groups` POST specifically, `body.name.trim()` can throw before validation if the request body is missing `name` or has a non-string value.

Why it matters:

- The popup clears cached groups on `401`, so bad input or transient server issues can trigger auth-recovery UX.
- Real Supabase errors are harder to diagnose because the response status loses the original layer.
- This is exactly the common-errors class where the error object should be classified before mapping to user-facing output.

Likely execution shape:

- Split parse/body validation errors into `400`.
- Keep auth failures from `getAuthenticatedExtensionUserId` as `401`.
- Let unexpected Supabase/server failures return `500` with server logging.

### P1: Optional first-row queries use `.single()` and ignore `PGRST116`

Files:

- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

Optional "find first row" queries use `.single()` after `.limit(1)` and ignore the `error` result:

- `findNextGroupOrderIndex`
- `findNextBookmarkOrderIndex`
- note create order lookup
- todo create order lookup

For new users or empty tables, `.single()` can produce `PGRST116` when no row exists. The current code happens to fall back from `data === null`, but it also hides the distinction between expected empty results and real Supabase errors.

Why it matters:

- It creates noisy or invisible PostgREST errors in normal first-use paths.
- It can make real table/RLS failures look like a valid `0` order fallback.
- `.maybeSingle()` is the intended shape for optional lookups.

Likely execution shape:

- Replace optional `.single()` lookups with `.maybeSingle()`.
- Check and propagate non-empty-result Supabase errors where the caller can map them.
- Preserve first-item order/rank behavior.

### P2: Auth/session helpers often ignore `getUser` or `getClaims` errors

Files:

- `proxy.ts`
- `lib/dashboard/server/user.ts`
- `app/login/page.tsx`
- `app/reset-password/page.tsx`
- `app/reset-password/actions.ts`
- `app/api/extension/route-adapter.ts`

Several auth boundaries destructure only `data` from `getUser()` / `getClaims()` and treat missing user as the full error story. Redirecting on missing user is often correct, but it means Auth service/network failures, invalid token errors, and session refresh problems are not distinguishable from a clean anonymous state.

Why it matters:

- Common auth errors such as expired/invalid tokens and retryable fetch failures lose diagnostic detail.
- Extension auth failures currently have no way to know whether the request was unauthenticated or Supabase Auth itself failed.

Likely execution shape:

- Re-analyze which boundaries should stay simple redirects and which should log or classify auth errors.
- Prioritize extension route adapter and reset password flow before broad proxy changes.

### P2: Group duplicate race handling is inconsistent between dashboard and extension routes

Files:

- `app/api/extension/groups/route.ts`
- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

The live database has a unique index on normalized group names per user. Dashboard group create/update maps `23505` to a friendly duplicate message. The extension groups route pre-checks duplicate names, but if two requests race and the insert returns `23505`, it falls through to a generic `500`.

Why it matters:

- Extension UI already expects `409` for duplicate group names.
- The pre-check is useful for UX but cannot replace database-error mapping.

Likely execution shape:

- Reuse `isDuplicateConstraintError` in extension group POST.
- Map insert-time `23505` to `409`.
- Check and handle errors from `findDuplicateGroupByName`.

### P2: Bookmark duplicate response wording conflicts with product duplicate policy

Files:

- `app/api/extension/bookmarks/route.ts`
- `extension/js/save-bookmarks.js`
- `spec/reports/dashboard-scalability-performance.md`

The locked product decision says duplicate bookmarks are allowed and the live index on `(user_id, normalized_url)` is intentionally non-unique. The extension bookmark route only returns `409` on `23505`, which will usually mean primary-key collision rather than same-URL duplicate. Extension batch code treats `409` as "duplicate bookmark skipped."

Why it matters:

- The code path is mostly harmless today because bookmark inserts normally generate IDs, but the status/message language implies same-URL duplicate rejection.
- This should not be "fixed" by adding a unique bookmark constraint; that would violate the locked decision.

Likely execution shape:

- Re-analyze whether extension duplicate-skipping copy should only apply to same-request/server-rejected duplicates, or whether the route should stop labeling `23505` as same-URL duplicate.
- Do not add a unique `(user_id, normalized_url)` constraint.

## Non-Findings

- No service role key exposure was found in client-side files. `supabaseAdmin` is imported from server route/action code only in this pass.
- RLS is enabled on the current public tables returned by MCP.
- Existing RLS policies wrap `auth.uid()` in `select`, which matches current Supabase guidance for policy performance.
- Dashboard and extension reads generally include explicit `user_id` filters where service role is used.

## First-Pass Priority

1. Fix dashboard loader error swallowing.
2. Fix extension route error classification and body validation.
3. Convert optional first-row `.single()` calls to `.maybeSingle()` with real error handling.
4. Re-analyze auth/session error classification.
5. Re-analyze duplicate handling language versus locked duplicate policy.
