# Session 3 — Architecture Seams

**Time:** 10:41 PM-11:52 PM (Cairo Time, UTC+02:00)

---

## Status at Start

- **Sprint goal:** Deepen the highest-friction architecture seams identified by the codebase review, starting with authenticated dashboard mutations and then validating extension and read seams from real import and function flow.
- **Last blocker:** None.
- **Feature state:** Dashboard and extension bookmark or group flows still repeated user-scoped auth, persistence rules, and transport concerns across shallow modules.

---

## Completed

- Wrote an architecture review report to `C:\Users\pc\AppData\Local\Temp\architecture-review-20260526-224703.html` and used it to select the authenticated dashboard mutation module as the top recommendation.
- Added `lib/dashboard/server/library-mutations.ts` to centralize authenticated dashboard bookmark, group, note, todo, and account operations behind one server-only seam.
- Reduced `app/dashboard/actions/notes.ts`, `app/dashboard/actions/todos.ts`, `app/dashboard/actions/groups.ts`, `app/dashboard/actions/bookmarks.ts`, and `app/dashboard/actions/account.ts` to thin exported adapters over the shared mutation module.
- Fixed note and todo order-index reads to stay user-scoped inside the shared mutation seam.
- Added `lib/library/server/capture.ts` to share bookmark and group persistence rules across dashboard actions and extension write routes.
- Reused the shared capture helpers from `app/api/extension/bookmarks/route.ts` and `app/api/extension/groups/route.ts` so extension writes no longer duplicate group validation, duplicate-group lookup, or create-order logic.
- Added `app/api/extension/route-adapter.ts` to centralize extension auth gating, unauthorized response shaping, duplicate detection helper, and realtime insert broadcast.
- Changed the extension bookmark POST route to return `409` for duplicate-constraint failures so the popup and session flows can handle duplicates through their existing contract.
- Added `lib/library/server/reads.ts` to share bookmark and group read ordering and user-scoping rules while preserving separate dashboard and extension projections.
- Rewired `lib/supabase/queries.ts`, `app/api/extension/bookmarks/route.ts`, and `app/api/extension/groups/route.ts` to use the shared read module.
- Verified every architecture slice with `pnpm typecheck` and targeted `pnpm lint` runs after the relevant changes.

---

## Decisions

- The authenticated dashboard mutation seam is real and should live in `lib/dashboard/server/library-mutations.ts`, with public Server Action files remaining thin adapters for stable imports.
- Shared bookmark and group persistence rules should live below both dashboard actions and extension routes in `lib/library/server/capture.ts`, not inside either adapter.
- Shared read seams should unify query rules only, while dashboard and extension projections remain separate because their payload shapes are load-bearing.
- Extension transport concerns such as auth gating, unauthorized JSON responses, and realtime insert broadcast should stay route-local but be centralized in `app/api/extension/route-adapter.ts`.
- The `improve-codebase-architecture` sprint ended after the mutation, capture, transport, and read seams were deepened and verified.

---

## Blockers

1. None.
