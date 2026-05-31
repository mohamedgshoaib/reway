# Supabase Performance Tuning Loading

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`loading`

## Scope For This Pass

Audit Reway's Supabase usage for query, payload, index, and database pressure risks:

- dashboard read query shapes and payload size
- extension-facing group/bookmark reads and writes
- bookmark/group ordering and rank access patterns
- import, batch capture, and enrichment write concurrency
- broad selects, avoidable returned columns, and repeated query paths
- existing index usage, missing index candidates, and unused-index risks
- cache hit, connection health, and pg_stat_statements availability
- query-plan candidates for current app routes before proposing indexes or RPCs

## Current Supabase Context

- `supabase-common-errors` and `supabase-known-pitfalls` are closed. Their fixes are the baseline for this pass.
- Duplicate bookmarks are allowed by product decision; performance work must not introduce a uniqueness constraint on bookmark URLs.
- The drafted future `public` default-privileges SQL was intentionally not applied. Future public-table work should explicitly decide grants alongside RLS and policies.
- Supabase changelog context to carry forward: Data API exposure defaults changed for new projects, Postgres 14 support ends on July 1, 2026, and newer Postgres versions include performance and observability improvements.

## Evidence To Gather Next

- Inventory Supabase reads/writes in server actions, route handlers, dashboard loaders, and extension APIs.
- Use read-only MCP diagnostics for table sizes, index definitions/usage where available, installed extensions, advisors, connection health, and slow-query visibility.
- Check whether `pg_stat_statements` is installed and usable before relying on historical query statistics.
- Identify high-value `EXPLAIN` candidates from actual app query shapes before proposing indexes.
- Separate code-only payload/query cleanups from live database changes such as indexes, extensions, or RPCs.

## Execution Boundary

No app code, schema, data, migration, index, extension, or live Supabase state changes are part of the loading phase. Execution remains approval-gated after final reporting.
