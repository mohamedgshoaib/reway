# Supabase Known Pitfalls Analysis Pass 1

## Phase

`analyzing`

## Scope

This pass looks for common Supabase anti-patterns after the closed `supabase-common-errors` fixes:

- secret/service-role exposure
- RLS, table grants, and policy posture
- privileged function placement/execution posture
- generated type usage and regeneration workflow
- mutation return-shape pitfalls
- broad selects / payload shape
- client factory duplication
- extension browser-bound Supabase boundaries

## Evidence Gathered

Code searches:

- `SERVICE_ROLE`, `NEXT_PUBLIC_SUPABASE`, `createClient`, Supabase factories, and admin client usage
- Supabase `select`, mutation, `.single()`, and `.maybeSingle()` call sites
- generated type references
- direct database connection strings
- `user_metadata`, `auth.jwt()`, and security-definer references

Read-only Supabase MCP:

- public table inventory with RLS enabled state
- security and performance advisors
- public RLS policies
- public table grants for `anon`, `authenticated`, and `service_role`
- foreign-key index coverage
- public function definitions, ACLs, search paths, and `SECURITY DEFINER` state

Docs/changelog context:

- Supabase API key docs confirm publishable keys are browser-safe and secret/service-role keys are backend-only.
- Supabase password-security docs confirm leaked password protection is an Auth setting and is available on Pro plan and above.
- Supabase changelog context keeps the 2026 Data API exposure/grants change in scope for future migration discipline.

## Findings

### P1 Candidate: Auth leaked-password protection is disabled

Evidence:

- MCP security advisor reports `auth_leaked_password_protection` as `WARN`.
- Supabase docs describe leaked-password protection as a project Auth setting that rejects known compromised passwords.

Impact:

- New or changed passwords can still pass local app complexity checks while being known-compromised passwords.
- This is a hosted-project configuration issue, not an app-code issue.

Execution shape:

- Enable leaked password protection in Supabase Auth settings if the project plan supports it.
- If plan-gated, document it as accepted residual risk until the project is upgraded.

### P1 Candidate: Existing public table grants are very broad

Evidence:

- MCP grant inspection shows `anon` and `authenticated` have broad table privileges on current public tables, including write privileges.
- MCP table and policy inspection also shows RLS enabled on the core public tables with owner-scoped policies.

Impact:

- RLS is currently doing the real row-level protection, so this is not an immediate data leak.
- Broad grants still increase blast radius if a future table/policy is added incorrectly, and they make the Data API exposure posture less intentional.

Execution shape:

- Re-analyze before proposing SQL. This overlaps with Supabase Data API exposure/grant policy and should be handled carefully.
- Prefer least-privilege grants only if they preserve current SSR/client/extension flows and RLS behavior.
- Do not change grants in the analyzing/reporting phase.

### P1/P2 Candidate: Security-definer functions remain in `public`

Evidence:

- MCP function inspection shows `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes` are `SECURITY DEFINER` functions in `public`.
- The same inspection shows direct execution is revoked from `anon` and `authenticated`, `service_role` remains allowed, and search paths are pinned.
- `spec/reports/dashboard-scalability-performance.md` already records the prior decision: keep these trigger helpers only where required, revoke client execution, and inspect live definitions before any migration.

Impact:

- Current execution privileges and pinned search paths reduce practical risk.
- The remaining pitfall is architectural/posture: privileged functions in an exposed schema are easier to accidentally expose later than private-schema trigger helpers.

Execution shape:

- Re-analyze against the prior scalability decision before proposing any migration.
- Likely outcome may be a documented non-finding or a later hardening migration, not an immediate code patch.

### P2 Candidate: Server admin client is used in broad auth and data flows

Evidence:

- `lib/supabase/admin.ts` creates a service-role admin client with `persistSession: false`.
- Server-only imports use `supabaseAdmin` in extension routes, visit RPC route, account deletion, and signup helper logic.
- `app/login/actions.ts` uses `supabaseAdmin.auth.admin.listUsers()` to scan users by email during signup and `updateUserById()` for an unconfirmed existing user.

Impact:

- No browser bundle exposure was found; `SUPABASE_SERVICE_ROLE_KEY` is not under a `NEXT_PUBLIC_` name and `.env.local` is ignored.
- The signup helper is a privileged, paginated user scan in a user-triggered action. It is not a secret exposure, but it is a scale and auth-surface smell.

Execution shape:

- Re-analyze whether signup can avoid `listUsers()` or use a narrower Auth/admin pattern.
- Keep extension routes and account deletion separate; they have explicit authenticated gates and server-only scope.

### P2 Candidate: Insert helpers return broad rows with `.select("*")`

Evidence:

- `lib/library/server/capture.ts` uses `.select("*")` after group and bookmark insert helpers.
- Most other reads use explicit select lists, and the prior payload-shaping decision already removed detail-only fields from the initial dashboard read.

Impact:

- New bookmark/group creates return full table rows, including fields not always needed by each caller.
- This is not a correctness failure because callers currently use inserted rows for dashboard state, extension responses, and realtime broadcasts.

Execution shape:

- Report as a payload-shaping candidate, not a first security fix.
- If executed, introduce explicit create-return select constants that preserve required dashboard/extension/realtime fields.

### P2 Candidate: Generated types exist but regeneration is not wired into scripts

Evidence:

- `lib/supabase/database.types.ts` exists and Supabase clients are typed with `Database`.
- `package.json` has no `types:supabase` or equivalent type-generation script.

Impact:

- Type usage is good today, but type drift is easier after schema changes because regeneration is not a first-class command.
- The current live schema includes rank columns and generated types also include them, so this is process risk rather than current drift.

Execution shape:

- Add a documented script only if the team wants local/CI type regeneration in this audit.
- Avoid running generation in this phase unless approved, because it may rewrite a large generated file.

### P3 Candidate: `user_metadata` is used for seed state

Evidence:

- `lib/supabase/seed.ts` reads `user.user_metadata?.has_seeded` and writes it through `supabase.auth.updateUser`.
- `lib/dashboard/server/user.ts` reads `full_name` and `avatar_url` from user metadata for display.
- No RLS policy or server authorization decision using `user_metadata` was found.

Impact:

- Display usage is fine.
- Seed-state usage is not an authorization boundary, but it is user-editable metadata. A user can potentially influence whether seed logic runs or skips.

Execution shape:

- Keep this as lower-priority unless signup/seed reliability becomes part of this pitfall phase.
- Better long-term shape is a server-owned profile/app metadata or idempotent seed marker in app data.

## Non-Findings

- No tracked browser/client service-role exposure was found.
- `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`.
- `.env.local` is ignored and not tracked; no secret value is recorded in this artifact.
- Browser and server Supabase clients are centralized in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- Generated database types are present and used by Supabase clients.
- No direct database connection string or serverless direct Postgres connection pattern was found.
- No broad `select("*")` was found in normal list reads; broad selects are limited to create-return helpers.
- FK columns checked by MCP have covering indexes.
- Supabase performance advisor currently reports no lints.

## Re-Analysis Targets

1. Decide whether broad public grants are a real execution candidate or a documented posture note for later schema-governance work.
2. Reconcile `SECURITY DEFINER` functions in `public` with the prior dashboard scalability decision and current revoked client execution.
3. Inspect signup/user seeding flow more narrowly before ranking admin-client and metadata findings.
4. Check create-return `.select("*")` call sites to see whether explicit select constants are low-risk enough for execution.
5. Decide whether adding a Supabase type-generation script belongs in this skill or should remain a process note.
