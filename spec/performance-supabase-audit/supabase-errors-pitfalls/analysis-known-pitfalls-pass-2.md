# Supabase Known Pitfalls Analysis Pass 2

## Phase

`re-analyzing`

## Purpose

Narrow first-pass findings into:

- true execution candidates
- accepted residual risk
- documented non-findings
- work that should be deferred to later Supabase performance/scale phases

## Re-Analysis Results

### 1. Broad grants: real posture issue, but execution should start with future defaults

Additional evidence:

- Current core public tables have RLS enabled and owner-scoped policies.
- Existing table grants are broad for `anon` and `authenticated`.
- Default privileges in `public` are also broad for future tables created by `postgres` / `supabase_admin`.
- `pg_graphql` is not installed, so the GraphQL introspection-specific grant risk is not currently active.
- Supabase docs distinguish RLS row protection from relation/API visibility and recommend intentional grants/revokes for exposed schemas.

Refinement:

- Tightening existing grants may be valid, but it is a production-impacting SQL change that should be tested against SSR, browser realtime, extension routes, and any direct Data API flows.
- The safer first execution candidate is to fix future default privileges in `public`, so new tables are not automatically broad-granted by default.
- Existing table grant cleanup should be a separately approved migration with a verification matrix.

Recommended ranking:

- P1 for future default privileges.
- P2/deferred for current-table grant tightening.

### 2. Public security-definer functions: currently hardened enough for this phase

Additional evidence:

- Trigger bindings are active for:
  - `auth.users` -> `public.handle_new_user`
  - `public.bookmarks` -> `public.notify_bookmarks_changes`
  - `public.groups` -> `public.notify_groups_changes`
- Client execution is revoked from `anon` and `authenticated`.
- `postgres` and `service_role` retain execute privileges.
- Search paths are pinned.
- The prior dashboard scalability decision intentionally accepted this shape after hardening.

Refinement:

- This is not a first execution candidate for known-pitfalls.
- Moving trigger helpers out of `public` could be a valid future hardening project, but it would require trigger recreation testing.
- For this phase, preserve the previous decision and record the posture as intentionally hardened.

Recommended ranking:

- Non-finding for this phase.
- Carry forward only as a future hardening option.

### 3. Signup admin-user scan: real but delicate

Additional evidence:

- `findAuthUserByEmail()` scans up to five pages of Auth users with `supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })`.
- The same signup path updates an existing unconfirmed user and resends signup confirmation.
- This preserves a specific product behavior: users who created an unconfirmed account can re-enter signup and receive a fresh confirmation path.

Refinement:

- The issue is not service-role exposure; it is admin-scope breadth and scaling.
- Replacing this safely needs auth-flow design, because Supabase Auth intentionally avoids email account enumeration in normal user-facing calls.
- This should not be the first execution candidate in a pitfalls pass unless the user wants to change signup semantics.

Recommended ranking:

- P2 report finding.
- Defer execution unless a narrow replacement is agreed.

### 4. Create-return `.select("*")`: low-risk code execution candidate

Additional evidence:

- Only `createGroupRecord` and `createBookmarkRecord` use `.select("*")` in app code.
- Normal dashboard and extension list reads use explicit select strings.
- Create callers use returned rows for optimistic replacement, extension response payloads, and realtime broadcast.

Refinement:

- This is a clean known-pitfall execution candidate.
- Introduce explicit create-return select constants in `lib/library/server/capture.ts`.
- Keep the selected fields broad enough to satisfy `BookmarkRow` / `GroupRow` client state and extension broadcast contracts.
- This reduces accidental future column leakage from create responses without changing core behavior.

Recommended ranking:

- P1/P2 first code patch after final report approval.

### 5. Generated type workflow: good candidate, but script only

Additional evidence:

- `lib/supabase/database.types.ts` exists and clients use `Database`.
- `pnpm exec supabase gen types typescript --help` confirms the local CLI supports `--linked`, `--project-id`, `--schema`, and TypeScript output.
- `package.json` lacks a standard type-generation script.

Refinement:

- Add a script such as `types:supabase`.
- Do not regenerate the generated file during this skill unless separately approved, because generated-file churn can be large and environment-dependent.

Recommended ranking:

- P2 code/process patch.

### 6. Seed `user_metadata`: lower-priority reliability issue

Additional evidence:

- `user_metadata` is used for display fields and seed state.
- No authorization/RLS decision uses `user_metadata`.
- `seedNewUser()` also checks existing groups before creating demo data, so the metadata flag is not the only guard.

Refinement:

- Display use is fine.
- Seed flag use is user-editable, but the table-state check reduces practical risk.
- Moving seed state to app-owned metadata/profile is probably not worth doing inside this pitfalls pass unless signup work is already being changed.

Recommended ranking:

- P3 carry-forward.

### 7. Leaked-password protection: accepted residual risk

Additional evidence:

- User confirmed this is Free-plan limited.
- Supabase docs say leaked-password protection is available on Pro plan and above.

Refinement:

- No execution candidate.
- Keep documented as residual risk.

## Updated Execution Candidate Queue

1. Add a future-default-privileges migration proposal for `public`, with verification and rollback notes. Actual database execution still requires explicit approval.
2. Replace create-return `.select("*")` with explicit select constants in `lib/library/server/capture.ts`.
3. Add a `types:supabase` script without regenerating `lib/supabase/database.types.ts`.

## Deferred / Non-Execution Items

- Current table grant tightening: defer until a dedicated SQL verification matrix is approved.
- Moving trigger helpers out of `public`: defer; current functions are hardened and prior decision accepts the shape.
- Signup admin-user scan: report as a design-sensitive finding; execute only with explicit signup-flow approval.
- Seed metadata: keep as P3 carry-forward.
- Leaked-password protection: accepted Free-plan residual risk.

## No State Changed

No app code, schema, data, migration, or Supabase project state changed during this re-analysis.
