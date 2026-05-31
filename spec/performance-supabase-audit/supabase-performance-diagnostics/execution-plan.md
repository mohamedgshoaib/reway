# Supabase Performance Tuning Execution Plan

## Skill

`supabase-performance-tuning`

Companion skill: `supabase`

## Phase

`executing`

## Execution Step 1: Dashboard Bookmark Realtime Broadcast-Only Prep

Status: `complete`

Scope:

- Code-only prep for the Broadcast-first realtime path.
- No Supabase publication, trigger, schema, data, index, or migration changes.

Changed:

- `components/dashboard/content/useDashboardRealtime.ts`
  - Removed the bookmark `postgres_changes` subscription.
  - Kept private bookmark Broadcast handlers for insert/update/delete.
  - Kept group Broadcast handlers.
  - Kept the extension content-script bridge event handler for `reway_broadcast_bookmark`.

Why:

- Supabase docs recommend Broadcast over Postgres Changes for scalable database-change delivery.
- Reway already has trigger-backed private Broadcast channels.
- This prepares the app for the later approval-gated SQL step that removes `public.bookmarks` and `public.groups` from `supabase_realtime`.

Verification:

- `pnpm typecheck` passed.
- `pnpm build` passed.

Next step:

- Applied in execution step 2.

## Execution Step 2: Remove Native Postgres Changes Publication Tables

Status: `complete`

Scope:

- Live Supabase publication change.
- No app code, table schema, data, trigger, index, or RLS policy changes.

Attempt note:

- The first SQL form used `alter publication ... drop table if exists ...`.
- Supabase/Postgres rejected that syntax with `42601`.
- No migration was applied from that failed attempt.
- The applied migration used guarded existence checks before each `ALTER PUBLICATION`.

Applied migration:

- `20260531145415_drop_realtime_publication_tables`

Applied SQL shape:

```sql
do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime drop table public.bookmarks;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'groups'
  ) then
    alter publication supabase_realtime drop table public.groups;
  end if;
end $$;
```

Verification:

- Read-only publication query for `public.bookmarks` and `public.groups` in `supabase_realtime` returned zero rows.
- Supabase performance advisors returned no lints.
- Migration list includes `20260531145415_drop_realtime_publication_tables`.

Rollback SQL:

```sql
alter publication supabase_realtime add table public.bookmarks;
alter publication supabase_realtime add table public.groups;
```

Next step:

- Redundant manual extension insert broadcasts removed in execution step 3.

## Execution Step 3: Remove Redundant Extension Route Insert Broadcasts

Status: `complete`

Scope:

- Code-only cleanup.
- No Supabase schema, data, migration, index, publication, trigger, RLS policy, or function changes.

Changed:

- `app/api/extension/bookmarks/route.ts`
  - Removed the manual `broadcastExtensionInsert` call after bookmark create.
- `app/api/extension/groups/route.ts`
  - Removed the manual `broadcastExtensionInsert` call after group create.
- `app/api/extension/route-adapter.ts`
  - Removed the now-unused `broadcastExtensionInsert` helper and its admin realtime channel dependency.

Why:

- Trigger-backed private Broadcast is now the canonical realtime delivery path.
- Keeping an extra route-level broadcast sends a duplicate insert message for the same row.
- The extension save-page popup bridge remains intact and dashboard handlers still dedupe by row ID.

Verification:

- `pnpm typecheck` passed.
- `pnpm build` passed.
- Read-only trigger query confirmed `bookmarks_sync_trigger` and `groups_sync_trigger` remain active.
- Read-only publication query confirmed `public.bookmarks` and `public.groups` remain absent from native `supabase_realtime`.

Next step:

- Low-priority extension bookmark GET payload trim handled in execution step 4.

## Execution Step 4: Trim Extension Bookmark GET Payload

Status: `complete`

Scope:

- Code-only fallback payload cleanup.
- No Supabase schema, data, migration, index, publication, trigger, RLS policy, or function changes.

Changed:

- `lib/library/server/reads.ts`
  - Removed `description` from `EXTENSION_BOOKMARK_SELECT`.

Why:

- The extension bookmark GET endpoint is mainly used as a fallback for open-group URL lookup.
- That fallback only needs bookmark URLs plus ordering and identity fields.
- Extension create routes still accept and persist descriptions; dashboard detail fetches are unchanged.

Verification:

- `pnpm typecheck` passed.
- `pnpm build` passed.

## Deferred Items

- Visit-only realtime suppression stays deferred because it needs an explicit client freshness plan for `visit_count`, `last_visited_at`, and Most Visited ordering.
- Full-list bookmark sort index stays deferred because current account sizes, advisors, and query plans do not justify extra write overhead yet.

## Closure Status

Execution queue complete. Browser/manual realtime sync validation remains a post-execution validation gap, not an open code candidate.
