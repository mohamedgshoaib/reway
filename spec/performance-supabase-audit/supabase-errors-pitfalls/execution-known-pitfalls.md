# Supabase Known Pitfalls Execution Plan

## Status

`closed`

App code changes are now in. No schema, data, migration history, or live Supabase state changed in this execution track.

## Step 1: Future `public` default privileges proposal

### Goal

Stop future tables created in `public` from inheriting broad API-role privileges by default, while leaving existing table grants unchanged for now.

### Live Baseline

Read-only MCP inspection showed broad default ACLs in `public` for objects created by both `postgres` and `supabase_admin`:

- tables (`r`) grant broad privileges to `anon`, `authenticated`, and `service_role`
- sequences (`S`) grant broad privileges to `anon`, `authenticated`, and `service_role`
- functions (`f`) grant execute to `anon`, `authenticated`, and `service_role`

Existing user-data tables are currently protected by RLS and owner-scoped policies. This step intentionally avoids changing those existing table grants.

### Proposed SQL

```sql
-- Future tables in public should not auto-grant broad privileges to API roles.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role supabase_admin in schema public
  revoke all on tables from anon, authenticated;

-- Future sequences backing public tables should also avoid broad API-role grants.
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role supabase_admin in schema public
  revoke all on sequences from anon, authenticated;

-- Keep service_role defaults unchanged for server/admin work.
-- Existing tables are intentionally not modified by this step.
```

### Why this shape

- It hardens the future default without risking immediate regressions on current public tables.
- It matches the audit decision to separate future exposure discipline from current grant cleanup.
- It avoids broad revokes on functions or existing relations in the same step.

### Verification Plan

Run after apply:

1. Inspect `pg_default_acl` for `public` and confirm `anon` / `authenticated` no longer appear in table and sequence defaults for `postgres` / `supabase_admin`.
2. Confirm existing current-table grants are unchanged.
3. Confirm dashboard load still works.
4. Confirm extension group and bookmark routes still work.
5. Confirm realtime subscriptions still connect for authenticated dashboard use.
6. Run Supabase advisors again.

Suggested verification SQL:

```sql
select
  defaclrole::regrole::text as role,
  defaclnamespace::regnamespace::text as schema,
  defaclobjtype as object_type,
  array_to_string(defaclacl, ',') as acl
from pg_default_acl
where defaclnamespace = 'public'::regnamespace
order by schema, role, object_type;
```

### Rollback SQL

If the new default posture causes unexpected issues for future migrations or table creation workflows:

```sql
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;

alter default privileges for role supabase_admin in schema public
  grant all on tables to anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated;

alter default privileges for role supabase_admin in schema public
  grant all on sequences to anon, authenticated;
```

### Notes

- This is a proposal artifact only.
- Applying it is a separate approval gate because it changes live Supabase default privileges.

## Step 2: Replace create-return `.select("*")`

### Files

- `lib/library/server/capture.ts`

### What changed

- Added `CREATE_GROUP_RETURN_SELECT`.
- Added `CREATE_BOOKMARK_RETURN_SELECT`.
- Replaced `.select("*")` in `createGroupRecord` with `CREATE_GROUP_RETURN_SELECT`.
- Replaced `.select("*")` in `createBookmarkRecord` with `CREATE_BOOKMARK_RETURN_SELECT`.

### Why

- Prevent future accidental response expansion when bookmark/group table columns change.
- Keep create-return payloads aligned with the fields currently needed by dashboard state, extension responses, and realtime broadcast consumers.
- Preserve current product behavior, including duplicate-bookmark support and current broadcast payload shape.

### Verification

- `pnpm typecheck`
- `pnpm build`

## Step 3: Add `types:supabase` workflow script

### Files

- `package.json`

### What changed

- Added:
  - `types:supabase`: `supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts`

### Why

- Make generated-type refresh a first-class, repeatable repo command.
- Improve future schema/type drift hygiene without regenerating the file during this audit step.

### Verification

- `pnpm typecheck`
- `pnpm build`

## Next Queue

1. Apply the default-privileges SQL proposal if approved.

## Closure

The `supabase-known-pitfalls` phase is closed.

Why it closed without applying the default-privileges SQL:

- the low-risk code/process work is complete
- the remaining SQL item is future-facing governance hardening, not a current bug or security break
- for a solo-dev workflow, documented discipline around future `public` table grants is sufficient for now

Carry forward:

- if a future `public` table is created, explicitly decide grants alongside RLS and policies instead of assuming old defaults
