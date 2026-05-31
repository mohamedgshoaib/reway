# Supabase Known Pitfalls Loading

## Skill

`supabase-known-pitfalls`

Companion skill: `supabase`

## Phase

`loading`

## Scope For This Pass

Audit Reway for common Supabase anti-patterns that can create security, data integrity, performance, or maintainability issues:

- service-role and secret-key exposure boundaries
- RLS coverage, policy shape, and table exposure discipline
- client creation patterns and repeated Supabase client instances
- generated type usage and weak manual typing around database rows
- mutation return-shape pitfalls, especially missing `.select()` when returned rows are required
- optional lookup behavior already touched by the common-errors pass, checked only for remaining misses
- `select('*')`, avoidable broad payloads, and obvious N+1 query shapes
- serverless connection and direct database connection assumptions
- extension-facing Supabase contracts and browser bundle boundaries

## Current Supabase Context

- The `supabase-common-errors` phase is closed. Its code fixes should be treated as baseline, not reopened unless this pass finds a concrete overlap.
- Supabase changelog scan noted current Data API exposure/grant changes for new projects, plus upcoming Node.js 20 and Postgres 14 support deadlines. This pass should check whether Reway has assumptions that depend on implicit public-table exposure or stale runtime/database versions.
- Carry-forward item from the common-errors phase: Supabase security advisor reported leaked password protection disabled.

## Evidence To Gather Next

- Search environment variable names and Supabase client factories for service-role exposure or browser-bound secret leakage.
- Use read-only MCP inspection for RLS/table/grant posture where it helps confirm code findings.
- Inventory `createClient` usage and confirm it follows the repo's server/browser helper conventions.
- Search Supabase mutations for missing `.select()` only where callers expect returned rows.
- Search for broad `select('*')`, repeated per-row Supabase calls, and untyped database row assumptions.
- Inspect extension files for any privileged key, auth, or transport pitfalls that could leak into MV3 browser surfaces.

## Execution Boundary

No app code, schema, data, migration, or Supabase state changes are part of the loading phase. Execution remains approval-gated after final reporting.
