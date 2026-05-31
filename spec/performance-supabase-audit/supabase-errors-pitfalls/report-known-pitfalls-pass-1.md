# Supabase Known Pitfalls Report Pass 1

## Phase

`reporting`

## Status

First-pass report. No execution approved.

## Bottom Line

The severe Supabase pitfalls are mostly avoided:

- no tracked client-side service-role exposure was found
- core public tables have RLS enabled
- owner-scoped policies are present
- generated database types exist and are used by Supabase clients
- client creation is centralized
- no direct Postgres connection string pattern was found
- FK columns have covering indexes
- performance advisors are clear

The most important remaining work is posture and maintainability, not an emergency fix. The sharpest candidates are broad public grants, public privileged trigger helpers, the signup admin-user lookup, broad create-return rows, and type-generation workflow.

## Ranking

### P1: Broad public table grants need a deliberate policy decision

Evidence:

- Read-only MCP grant inspection shows broad `anon` and `authenticated` privileges on public tables.
- The same tables have RLS enabled and owner-scoped policies, so current row-level access is still protected.
- Supabase Data API exposure behavior is now less implicit for new projects/tables, so grant discipline matters more in future migrations.

Risk:

- Current state is not an immediate leak because RLS is active.
- Future table or policy mistakes have a larger blast radius when broad grants are treated as default background state.

Recommendation:

- Re-analyze before execution.
- Decide whether to tighten grants now or document a migration policy for future tables.
- Do not make a broad SQL grant change without verifying current SSR, browser, extension, and RPC flows.

### P1/P2: Public `SECURITY DEFINER` functions should be reconciled with hardening goals

Evidence:

- MCP function inspection shows `handle_new_user`, `notify_bookmarks_changes`, and `notify_groups_changes` are `SECURITY DEFINER` functions in `public`.
- Client execution is revoked from `anon` and `authenticated`.
- Search paths are pinned.
- Prior decision record already says these trigger helpers were inspected and hardened, and should not be changed from stale assumptions.

Risk:

- Current direct-execution risk is low.
- Remaining posture risk is that privileged helpers live in an exposed schema and can be accidentally expanded later.

Recommendation:

- Re-analyze against `spec/reports/dashboard-scalability-performance.md`.
- Likely execution, if any, should be a careful SQL hardening plan, not an app-code patch.
- This may become a documented non-finding if current trigger placement is intentionally accepted.

### P2: Signup flow uses service-role admin user search

Evidence:

- `app/login/actions.ts` calls `supabaseAdmin.auth.admin.listUsers()` in pages to find a user by email.
- It also calls `updateUserById()` for an existing unconfirmed user.
- The admin client remains server-only and no browser exposure was found.

Risk:

- This is not a secret leak.
- The pattern is more privileged and less scalable than ideal because user-triggered signup can page through Auth users.

Recommendation:

- Re-analyze the signup flow before execution.
- Prefer a narrower Auth flow or server-owned profile marker if it can preserve the intended resend/update behavior.
- Do not merge this with extension/admin route work; the behavior is auth-product-specific.

### P2: Create helpers return broad rows with `.select("*")`

Evidence:

- `createGroupRecord` and `createBookmarkRecord` in `lib/library/server/capture.ts` use `.select("*")`.
- Normal list reads use explicit select constants.

Risk:

- Create paths return more columns than needed to some callers and broadcast payloads.
- It is lower risk than broad initial reads because it happens per create, not across the whole dashboard list.

Recommendation:

- Re-analyze call sites.
- If low-risk, replace with explicit create-return select constants that include fields required by dashboard state, extension responses, and realtime broadcasts.

### P2/P3: Generated types exist, but regeneration is not a first-class command

Evidence:

- `lib/supabase/database.types.ts` exists.
- Supabase clients are typed with `Database`.
- `package.json` has no `types:supabase` script.

Risk:

- Current schema and generated types appear aligned for the audited rank columns.
- Future migrations can drift more easily without a standard regeneration command.

Recommendation:

- Consider adding a `types:supabase` script during execution.
- Do not regenerate the large generated file unless explicitly approved.

### P3: Seed state uses user-editable metadata

Evidence:

- `lib/supabase/seed.ts` reads `user.user_metadata?.has_seeded`.
- The same file sets `has_seeded` through `supabase.auth.updateUser()`.
- No RLS or authorization decision uses `user_metadata`.

Risk:

- This is not an authorization bypass.
- It is a reliability smell: users can influence a seed-state flag because `user_metadata` is user-editable.

Recommendation:

- Keep as lower-priority.
- Better future shape is an app-owned profile/app metadata marker or fully idempotent seed detection from app tables.

## Accepted Residual Risk

### Auth leaked-password protection is disabled

Evidence:

- Supabase security advisor reports `auth_leaked_password_protection`.
- User confirmed this is a Free plan limitation.
- Supabase docs note leaked password protection is available on Pro plan and above.

Decision:

- Treat as accepted residual risk for this audit.
- Do not make it an execution candidate unless the project plan changes.
- Keep local password complexity checks, but do not pretend they replace leaked-password screening.

## Non-Findings

- No tracked browser/client service-role exposure.
- No `NEXT_PUBLIC_*SERVICE*` env usage.
- `.env.local` is ignored and not tracked.
- RLS is enabled on current public tables.
- Owner-scoped policies exist on current core tables.
- No direct database connection string pattern was found.
- No N+1 Supabase query loop was found in the audited server paths.
- No normal list read uses `select("*")`.
- FK index coverage is present.
- Supabase performance advisor reports no lints.

## Re-Analysis Questions

1. Are broad public grants worth tightening now, or should this pass only document a future migration policy?
2. Are public trigger helpers already sufficiently hardened under the prior security-function audit?
3. Can signup avoid `listUsers()` without losing the current unconfirmed-user resend/update behavior?
4. Can create-return `.select("*")` be narrowed safely with shared constants?
5. Should this phase add a type-generation script without regenerating the generated file?
