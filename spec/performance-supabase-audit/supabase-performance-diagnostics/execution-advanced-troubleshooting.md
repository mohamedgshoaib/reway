# Supabase Advanced Troubleshooting Execution Plan

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`executing`

## Execution Step 1: Await Realtime Auth Before Private Broadcast Subscription

Status: `complete`

Scope:

- Code-only Realtime client timing fix.
- No Supabase schema, data, migration, index, publication, trigger, RLS policy, function, connection, or pool change.

Changed:

- `components/dashboard/content/useDashboardRealtime.ts`
  - Moved private channel subscription setup behind an async effect helper.
  - Awaited no-arg `supabase.realtime.setAuth()` before subscribing to private `bookmarks` and `groups` Broadcast channels.
  - Added cancellation protection so an unmounted or rerun effect does not subscribe after auth resolution.
  - Preserved existing channel names and Broadcast handlers.
  - Preserved extension `reway_broadcast_bookmark` bridge behavior.

Why:

- Realtime logs showed repeated private-channel authorization failures for user-scoped bookmark/group topics.
- Supabase docs show awaiting `supabase.realtime.setAuth()` before private Broadcast subscription.
- Installed `@supabase/realtime-js` only includes `access_token` in the channel join payload when auth has already resolved.
- The existing code called async `setAuth()` and immediately subscribed, which could race.

Verification:

- `pnpm typecheck` passed.
- `pnpm build` passed.
- Read-only publication/trigger check confirmed:
  - `public.bookmarks` and `public.groups` remain absent from native `supabase_realtime`.
  - `bookmarks_sync_trigger` and `groups_sync_trigger` remain active for `INSERT`, `UPDATE`, and `DELETE`.
- `git diff --check` passed.
- Realtime logs were sampled after fresh post-patch activity. A new Broadcast replication initialization appeared, and no new private-channel unauthorized `bookmarks` / `groups` messages appeared above that fresh initialization in the returned log window.

Not changed:

- `realtime.messages` RLS policy.
- `public.bookmarks` / `public.groups` native `supabase_realtime` publication membership.
- Broadcast trigger functions.
- Extension route or popup behavior.
- `pg_stat_statements` counters.

Residual validation:

- Browser/manual realtime sync validation remains useful:
  - dashboard-created bookmark sync
  - extension-created bookmark sync
  - bookmark update/delete sync
  - group create/update/delete sync
- Realtime log validation is clean for the sampled post-patch window. Browser/manual interaction validation remains optional follow-up rather than an open execution candidate.

## Closure Status

Execution queue complete. The phase is closed from a code and Supabase diagnostics standpoint.
