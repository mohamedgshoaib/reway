# Supabase Common Errors Execution Plan

## Status

`closed`

## Executed

### Step 1: Dashboard loader fail-closed behavior

Files:

- `lib/supabase/queries.ts`

What changed:

- Added a small Supabase read-error wrapper for dashboard query helpers.
- `getBookmarks`, `getGroups`, `getNotes`, and `getTodos` now throw readable load errors when Supabase returns an error.
- Successful zero-row reads still return empty arrays.

Why:

- Prevent Supabase failures from rendering as an empty library.
- Preserve route-level error handling for real query failures.

Verification:

- `pnpm typecheck`
- `pnpm build`

### Step 2: Extension route request validation and status mapping

Files:

- `app/api/extension/utils.ts`
- `app/api/extension/route-adapter.ts`
- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`

What changed:

- Added shared extension API error and JSON parsing helpers.
- Bookmark and group routes now validate request bodies before touching Supabase helpers.
- Malformed JSON and invalid payloads now return `400`.
- Duplicate group create races now return `409`.
- Auth gate now distinguishes missing/invalid auth from broader Auth service failure.
- Broad route catches no longer collapse unexpected failures into `401`.

Why:

- Prevent the extension popup from clearing cached groups or showing auth recovery for non-auth failures.
- Keep route statuses truthful for popup flows and debugging.

Verification:

- `pnpm typecheck`
- `pnpm build`

### Step 3: Optional first-row `.maybeSingle()` cleanup

Files:

- `lib/library/server/capture.ts`
- `lib/dashboard/server/library-mutations.ts`

What changed:

- Changed optional first-row group and bookmark order lookups from `.single()` to `.maybeSingle()`.
- Changed note and todo create order lookups from `.single()` to `.maybeSingle()`.
- Preserved required-row `.single()` usage elsewhere.
- Kept no-row fallback behavior while still throwing on real query errors.

Why:

- Avoid normal first-use `PGRST116`-style no-row error noise.
- Distinguish expected empty collections from real Supabase failures.

Verification:

- `pnpm typecheck`
- `pnpm build`

### Step 4: Bookmark conflict wording cleanup

Files:

- `app/api/extension/bookmarks/route.ts`
- `extension/js/save-bookmarks.js`
- `extension/js/grabber.js`
- `extension/js/sessions.js`
- `extension/popup.js`

What changed:

- Reworded bookmark insert `409` responses from duplicate-specific language to generic conflict language.
- Renamed extension batch-save result buckets from duplicate wording to conflict wording.
- Updated popup, grabber, and session-save success/error copy to stop implying same-URL duplicate rejection.
- Preserved the existing duplicate-bookmarks-allowed product behavior.

Why:

- Keep extension error copy truthful to the current schema and product decision.
- Avoid teaching users that Reway blocks duplicate bookmarks when it does not.

Verification:

- `pnpm typecheck`
- `pnpm build`

## Closure
The documented `supabase-common-errors` execution queue has been completed. Remaining Supabase work moves to later skills, not this phase.
