# Supabase Advanced Troubleshooting Loading

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`loading`

## Status

Started. No app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made.

## Prior Context To Preserve

Closed before this phase:

- `supabase-performance-tuning` moved dashboard bookmark sync to private Broadcast only.
- Migration `20260531145415_drop_realtime_publication_tables` removed `public.bookmarks` and `public.groups` from native `supabase_realtime`.
- Trigger-backed private Broadcast is now the canonical realtime path.
- Redundant manual extension route insert broadcasts were removed.
- Extension fallback bookmark GET payload no longer returns unused `description`.

Important constraints:

- Do not re-add `public.bookmarks` or `public.groups` to native `supabase_realtime` unless manual/browser validation finds a real sync regression.
- Do not suppress visit-only broadcasts without a client freshness plan for `visit_count`, `last_visited_at`, and Most Visited ordering.
- Do not add full-list sort indexes without larger-account evidence.
- Duplicate bookmarks remain allowed.

## Loaded Guidance

Local skills:

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/supabase-advanced-troubleshooting/SKILL.md`

Project context:

- `spec/index.md`
- `spec/sessions/31-May-26-performance-supabase-audit.md`
- `spec/performance-supabase-audit/README.md`
- `spec/performance-supabase-audit/supabase-performance-diagnostics/report-final.md`
- `spec/performance-supabase-audit/supabase-performance-diagnostics/execution-plan.md`

Current Supabase docs checked:

- [Debugging and monitoring](https://supabase.com/docs/guides/database/inspect)
- [Database configuration](https://supabase.com/docs/guides/database/postgres/configuration)
- [Connection management](https://supabase.com/docs/guides/database/connection-management)
- [Performance tuning](https://supabase.com/docs/guides/platform/performance)
- [Deleting data and dropping objects safely](https://supabase.com/docs/guides/database/postgres/data-deletion)

Relevant changelog items noticed:

- [Breaking Change: Tables not exposed to Data and GraphQL API automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [Realtime Settings](https://supabase.com/changelog/37041-realtime-settings)
- [Restricting Access on Auth, Storage, and Realtime Schemas](https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025)
- [Change in realtime-js affecting Node.js < 22](https://supabase.com/changelog/37869-change-in-realtime-js-affecting-node-js-22)

## Diagnostic Areas For Next Phase

The next `analyzing` step should stay read-only and gather evidence from:

1. `pg_stat_statements`
   - cumulative outliers after the Broadcast-only realtime change
   - high max-time outliers
   - high-frequency queries
   - poor cache-hit query patterns
2. `pg_stat_activity` and `pg_locks`
   - blocked or blocking queries
   - long-running active queries
   - idle-in-transaction sessions
   - connection distribution by role/state/application
3. Realtime health
   - trigger status for bookmark/group Broadcast
   - publication membership remains absent for `bookmarks` / `groups`
   - Realtime logs if MCP logs expose actionable entries
4. Advisors and logs
   - security/performance advisor deltas
   - Postgres/API/Auth/Realtime logs for repeated errors
5. RLS and permission ambiguity
   - only if diagnostics show empty-result or denied-operation patterns

## Non-Goals For Loading

- No `EXPLAIN ANALYZE` on mutating statements.
- No `pg_stat_statements_reset`.
- No `pg_terminate_backend`.
- No schema or publication edits.
- No new monitoring RPC functions.
- No code changes.

## Next Step

Proceed to `analyzing` with read-only Supabase MCP diagnostics and local code searches for query/function ownership.
