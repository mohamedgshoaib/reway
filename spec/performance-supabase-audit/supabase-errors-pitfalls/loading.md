# Supabase Common Errors Loading

## Skill

`supabase-common-errors`

Companion skill: `supabase`

## Phase

`loading`

## Scope For This Pass

Audit code paths that can surface common Supabase failures before moving to the broader pitfalls pass:

- `{ data, error }` handling and null-data assumptions
- `.single()` versus `.maybeSingle()` optional lookup behavior
- PostgreSQL constraint errors such as `23505`, `23503`, and `42501`
- PostgREST/API errors such as missing auth context, schema drift, and Data API exposure problems
- auth/session handling in App Router server code
- extension-facing `/api/extension/*` contracts and error envelopes
- duplicate bookmark/group creation behavior
- RLS/permission failure handling at server-action and route-handler boundaries

## Current Supabase Context

- Supabase changelog scan noted current Data API exposure/grant changes for new projects. This pass should watch for code or database assumptions that depend on implicit table exposure.
- Supabase docs search anchored this pass on current RLS and Auth behavior: unauthenticated `auth.uid()` returns `null`, updates need readable rows, and request-scoped auth context matters for RLS-backed calls.

## Evidence To Gather Next

- Inventory Supabase client creation helpers and where auth context is attached.
- Inventory server actions and route handlers that call Supabase and map errors to responses.
- Inspect extension API routes before popup/worker transport code.
- Search for `.single()`, mutation calls missing `.select()`, unguarded `data`, and broad catch blocks that hide Supabase error codes.
- Use MCP read-only project inspection where it helps confirm schema/RLS assumptions.

## Execution Boundary

No app code, schema, data, migration, or Supabase state changes are part of this phase. Execution remains approval-gated after final reporting.
