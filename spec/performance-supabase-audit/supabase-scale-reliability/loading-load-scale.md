# Supabase Load Scale Loading

## Skill

`supabase-load-scale`

## Status

`loading`

## Loaded Context

- Project DNA and active constraints from `spec/index.md`.
- Current session state from `spec/sessions/31-May-26-performance-supabase-audit.md`.
- Audit queue and execution rules from `spec/performance-supabase-audit/README.md`.
- Concern folder scope from `spec/performance-supabase-audit/supabase-scale-reliability/README.md`.
- Repo skill index from `spec/skills.md`.
- Repo-local `supabase` and `supabase-load-scale` skill instructions.
- Current Supabase changelog scan.
- Current Supabase docs via MCP search:
  - connection pooling / Supavisor transaction and session mode
  - read replicas
  - compute and disk sizing
  - database and disk size
  - Storage CDN and egress

## Relevant Current Supabase Notes

- Read replicas are a paid-plan scale lever. They are read-only, asynchronous, and unsuitable for same-request read-after-write flows.
- Read replicas require AWS hosting, Postgres 15+, physical backups/PITR posture, and at least a Small compute add-on.
- Supavisor transaction mode is the fit for transient/serverless-style Postgres clients; session mode is for long-lived sessions, prepared statements, migrations, and IPv4 compatibility.
- Direct connection ceilings and pooler client ceilings scale with compute size; Free/Nano remains constrained by database size, direct connections, and disk/IO ceilings.
- Storage CDN is automatic for Storage assets, but private buckets have lower cache-hit potential than public buckets.
- Edge Functions are not currently deployed in this project, so regional Edge Function placement is a non-candidate unless the app adds Edge Functions later.
- The current app mostly uses Supabase client libraries and PostgREST rather than direct Postgres connection strings, so Supavisor findings should be tied to actual deployment/runtime shape rather than assumed ORM pressure.

## Local Surfaces To Analyze Next

- Dashboard full-list reads:
  - `lib/supabase/queries.ts`
  - `lib/library/server/reads.ts`
  - `app/dashboard/page.tsx`
- Write burst paths:
  - `lib/library/server/capture.ts`
  - `lib/dashboard/server/library-mutations.ts`
  - `app/api/extension/bookmarks/route.ts`
  - `app/api/extension/groups/route.ts`
  - `components/dashboard/content/useImportHandlers.ts`
  - `components/dashboard/content/import/concurrency.ts`
- Realtime load posture after Broadcast migration:
  - `components/dashboard/content/useDashboardRealtime.ts`
  - database broadcast triggers already inspected in the previous phase
- Extension capture load and retry behavior:
  - `extension/js/api.js`
  - `extension/js/save-bookmarks.js`
  - `extension/js/sessions.js`
  - `extension/js/grabber.js`
  - `extension/background.js`
- Storage and Edge Functions:
  - No obvious app Storage or Edge Function usage found during loading search.

## Initial Boundaries

- Do not start `supabase-reliability-patterns` yet.
- Do not apply compute, pooler, replica, disk, publication, trigger, or schema changes during loading.
- Treat Free-plan limitations as context, not defects.
- Keep dashboard virtualization out of scope unless new load-scale evidence proves a different implementation path is worth revisiting.

## Next Step

Move to `analyzing` by collecting current table sizes, growth indicators, connection limits, active connection posture, and code-level read/write burst behavior.
