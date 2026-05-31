# Supabase Common Errors Analysis Pass 2

## Phase

`re-analyzing`

## Validation Summary

The first-pass findings hold, with narrower execution boundaries.

Official Supabase changelog context was verified:

- Data API / GraphQL automatic table exposure changed in 2026. New public tables can require explicit grants before they are reachable through Supabase client libraries.
- Supabase JS packages are dropping Node.js 20 support after June 30, 2026.

Read-only MCP validation shows the current project is not failing from missing RLS or missing grants:

- Core public tables have RLS enabled.
- Owner-scoped policies exist for dashboard tables.
- Current public table grants exist for `anon`, `authenticated`, and `service_role`.
- `groups_user_id_name_idx` is unique.
- `bookmarks_user_id_normalized_url_idx` is non-unique, matching the locked duplicate-bookmarks decision.

The actionable risk remains app-level error mapping.

## Refined Findings

### 1. Dashboard loaders should fail closed, but with a small wrapper

Files:

- `lib/supabase/queries.ts`
- `app/dashboard/page.tsx`

Re-analysis confirms `getBookmarks`, `getGroups`, `getNotes`, and `getTodos` should not return `[]` when Supabase returns an error. The dashboard already has route-level error handling, and `DashboardPage` already catches and rethrows `Promise.all` failures.

Best execution shape:

- Add a tiny local helper in `lib/supabase/queries.ts` that converts Supabase query errors into readable `Error`s.
- Throw on query error.
- Keep returning `[]` for successful zero-row results.
- Do not change `DashboardPage` unless the final report decides to improve the thrown message.

Why a wrapper instead of raw throw:

- PostgREST error objects are not always `Error` instances.
- A wrapper keeps route logs readable while preserving the original error as `cause`.

### 2. Extension routes need body parsing/status mapping, not a broad route rewrite

Files:

- `app/api/extension/utils.ts`
- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `app/api/extension/route-adapter.ts`

Re-analysis confirms the broad `catch -> 401` pattern is the main issue. The clean patch is a small shared request helper plus narrower route catches.

Best execution shape:

- Add a shared safe JSON parser in `app/api/extension/utils.ts` or route-local helpers.
- Validate bookmark payload:
  - `url` must be a non-empty string.
  - `groupId`, if present, must be a string or `null`.
  - optional text fields should only be used if strings.
- Validate group payload:
  - `name` must be a non-empty string after trim.
  - optional `icon` and `color` should be strings when present.
- Keep `getAuthenticatedExtensionUserId` as the auth gate, but inspect its `getUser()` error:
  - no user: `401`
  - auth error with status `401` or `403`: `401`
  - other Supabase Auth/API failure: likely `503` or `500`, not `401`
- Map malformed JSON/body validation to `400`.
- Map duplicate group race `23505` to `409`.
- Map unexpected Supabase/server failures to `500`.

This avoids changing extension popup flow except making statuses more truthful.

### 3. Only optional first-row lookups should move to `.maybeSingle()`

Files:

- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

Keep `.single()` where exactly one row is required after a mutation or detail lookup:

- insert returning `id`
- create bookmark/group returning inserted row
- bookmark detail fetch
- bookmark refresh fetch
- enrichment lookup

Change `.single()` only for optional first-row ordering lookups:

- `findNextGroupOrderIndex`
- `findNextBookmarkOrderIndex`
- note create `minOrderData`
- todo create `minOrderData`

Best execution shape:

- Use `.maybeSingle()`.
- Throw on non-null errors.
- Preserve fallback `0` when no row exists.

This directly targets `PGRST116` without weakening required-row paths.

### 4. Auth/session error handling should be scoped to extension first

Files:

- `app/api/extension/route-adapter.ts`
- later, if needed: `proxy.ts`, `lib/dashboard/server/user.ts`, `app/reset-password/actions.ts`

Broadly changing auth redirects would be risky and outside the first Supabase common-errors execution lane. The extension route adapter is the best first target because it feeds the popup cache-clearing behavior.

Deferred:

- `proxy.ts` should stay conservative for now.
- login/reset-password page redirects can stay simple unless final reporting finds a specific broken state.
- reset-password action can be reconsidered during the final report, but it is not a first patch.

### 5. Duplicate bookmark wording should be corrected carefully, not by schema

Files:

- `app/api/extension/bookmarks/route.ts`
- `extension/js/save-bookmarks.js`
- `extension/popup.js`

The final report should preserve the locked decision: duplicate bookmarks are allowed. The route currently maps any `23505` from bookmark insert to "Bookmark already exists", but the live schema shows no unique normalized URL constraint. In normal operation, `23505` would more likely be a primary key collision, usually from caller-supplied IDs rather than same URL.

Best execution shape:

- Do not add a bookmark uniqueness constraint.
- Lower this below the P1 execution lane.
- If patched, rename the server response to a generic conflict or only keep duplicate wording in the UI where the app truly detects duplicates.

## Refined Execution Queue

1. Dashboard loader fail-closed behavior.
2. Extension route request validation and status mapping.
3. Optional first-row `.maybeSingle()` cleanup.
4. Extension auth adapter classification if not folded into step 2.
5. Group duplicate race `409`, folded into step 2 if touched.
6. Bookmark duplicate wording cleanup only if final report says it is worth doing now.

## Items To Carry Forward

- Supabase advisor warning: leaked password protection disabled. Carry to `supabase-known-pitfalls` or security/config review.
- Data API explicit-grant requirement: current tables have grants, but future migrations should include grants intentionally when new public tables are added.
- Broad grants to `anon`/`authenticated` are visible on existing public tables. RLS is enabled, so this is not a current common-error blocker, but it belongs in the upcoming pitfalls/security pass.
