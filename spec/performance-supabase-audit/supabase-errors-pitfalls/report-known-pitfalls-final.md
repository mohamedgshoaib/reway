# Supabase Known Pitfalls Final Report

## Phase

`final report`

## Status

`final report complete; awaiting execution approval`

No app code, schema, data, migration, or Supabase project state changed during this skill.

## Bottom Line

Reway avoids the dangerous Supabase pitfalls that usually break privacy outright:

- no tracked browser/client service-role exposure was found
- service-role key usage is server-only
- core public tables have RLS enabled
- owner-scoped policies exist on current user data tables
- client creation is centralized
- generated database types exist and are used by Supabase clients
- normal list reads use explicit select lists
- no direct Postgres connection string pattern was found
- FK columns have covering indexes
- Supabase performance advisor reports no lints

The remaining findings are mostly hardening and process:

1. future public-table default privileges are too broad
2. create-return helpers use `.select("*")`
3. generated type regeneration is not a first-class script

## Recommended Execution Queue

### 1. P1: Make future `public` table defaults intentional

Evidence:

- Existing public tables have RLS enabled and owner-scoped policies.
- Current table grants are broad, but changing them now needs a dedicated compatibility matrix.
- Default privileges in `public` are also broad for future tables created by `postgres` / `supabase_admin`.
- Supabase docs distinguish RLS row protection from relation/API visibility, especially in exposed schemas.

Recommended execution:

- Create an approval-gated migration proposal that revokes broad future table defaults from `anon` and, if appropriate, narrows `authenticated` defaults.
- Do not apply it until the exact SQL and verification plan are approved.
- Keep existing table grants unchanged in this first execution unless explicitly approved as a separate migration.

Why first:

- It prevents the next table from inheriting risky exposure posture without disrupting current app behavior.

Verification needed:

- inspect `pg_default_acl` before and after
- confirm existing dashboard, extension routes, and realtime flows are unaffected
- run Supabase advisors after the migration

### 2. P1/P2: Replace create-return `.select("*")` with explicit select constants

Evidence:

- `lib/library/server/capture.ts` uses `.select("*")` in `createGroupRecord` and `createBookmarkRecord`.
- Normal dashboard and extension list reads already use explicit select constants.
- Create-return rows are used by dashboard optimistic replacement, extension responses, and realtime broadcasts.

Recommended execution:

- Add explicit create-return select constants in `lib/library/server/capture.ts`.
- Preserve all fields needed by current `BookmarkRow` / `GroupRow` client state, extension responses, and realtime merge behavior.
- Avoid changing duplicate-bookmark behavior.

Why second:

- It is a low-risk app-code fix that prevents future accidental column expansion in create responses.

Verification needed:

- `pnpm typecheck`
- `pnpm build`

### 3. P2: Add a Supabase type-generation script

Evidence:

- `lib/supabase/database.types.ts` exists and is used.
- `package.json` does not expose a standard type-generation command.
- Local CLI help confirms `supabase gen types typescript` supports linked/project-id/schema output.

Recommended execution:

- Add a script such as:
  - `types:supabase`: `supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts`
- Do not regenerate the generated file unless separately approved.

Why third:

- It turns an existing good practice into a repeatable workflow and reduces future schema/type drift.

Verification needed:

- `pnpm typecheck`
- `pnpm build`
- optionally `pnpm exec supabase gen types typescript --help` if script syntax changes

## Deferred Findings

### Current public table grants

Current table grants are broad, but existing tables are protected by RLS and owner-scoped policies. Tightening current grants could be worthwhile, but it should be its own migration with direct compatibility checks for SSR, browser, extension, realtime, and any direct Data API use.

### Public `SECURITY DEFINER` trigger helpers

Current functions are hardened for this phase:

- direct execution revoked from `anon` and `authenticated`
- `postgres` and `service_role` retain execute privileges
- search paths are pinned
- trigger bindings are active
- prior scalability decision accepted this shape after hardening

Moving them out of `public` is a future hardening project, not a known-pitfalls execution item right now.

### Signup admin-user scan

`app/login/actions.ts` uses `supabaseAdmin.auth.admin.listUsers()` to preserve unconfirmed-user resend/update behavior. This is privileged and not ideal at scale, but it is not a client secret exposure. Replacing it safely changes auth-product behavior and should be approved as a separate signup-flow design task.

### Seed state in `user_metadata`

`lib/supabase/seed.ts` uses user-editable metadata for `has_seeded`, but it also checks existing groups before seeding and does not use metadata for authorization. This remains a P3 reliability cleanup, not a security execution item.

### Auth leaked-password protection

Supabase advisor reports leaked-password protection disabled. User confirmed this is a Free-plan limitation, so it is accepted residual risk for now. Keep local password complexity checks, but do not treat them as equivalent to leaked-password screening.

## Non-Findings

- No tracked `NEXT_PUBLIC_*SERVICE*` exposure.
- `.env.local` is ignored and not tracked.
- No normal list read uses `.select("*")`.
- No N+1 Supabase query loop was found in audited server paths.
- No missing FK index was found by MCP.
- `pg_graphql` is not installed, so GraphQL introspection exposure is not currently active.
- No direct database connection string pattern was found.
- Extension browser code does not contain a Supabase privileged key.

## Execution Boundary

Execution remains approval-gated. The SQL/default-privilege item is production-impacting and needs explicit approval of both SQL and verification before any Supabase state changes.
