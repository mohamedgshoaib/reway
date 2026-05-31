# Supabase Advanced Troubleshooting Final Report

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`final reporting`

## Status

Final report complete. Execution awaits approval.

No app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made in this skill.

## Summary

Advanced diagnostics did not find a database pressure incident:

- no live lock contention
- no idle-in-transaction leak
- no long-running active app query
- no connection pressure signal
- no performance advisor lint
- no deployed Edge Functions
- no stuck enrichment backlog

The actionable issue is narrower and more useful: dashboard private Broadcast subscriptions can join before Realtime auth is ready. Realtime logs show repeated authorization failures for the user-scoped bookmark/group topics, and local code matches the race condition described by the installed client behavior.

## Final Ranking

### P1: Await Realtime Auth Before Private Broadcast Subscription

Current state:

- Dashboard sync now depends on private Broadcast channels:
  - `user:${userId}:bookmarks`
  - `user:${userId}:groups`
- `components/dashboard/content/useDashboardRealtime.ts` calls `supabase.realtime.setAuth()` and immediately subscribes.
- Realtime logs repeatedly show private-channel authorization failures for matching bookmark/group topics.
- Websocket upgrades succeed, so this is not a socket connectivity issue.
- `realtime.messages` RLS policy and trigger/client topic formats line up.

Why this matters:

- The previous performance phase intentionally made private Broadcast the canonical realtime path.
- If the private channel joins before the auth token is available, the channel authorization check can fail even for a valid signed-in dashboard user.
- That can make first-load realtime sync unreliable and creates repeated Realtime authorization noise.

Confirmed by:

- Supabase docs show `await supabase.realtime.setAuth()` before private Broadcast subscription.
- Installed `@supabase/realtime-js` `2.106.1` has async `setAuth()`.
- `RealtimeChannel.subscribe()` only includes `access_token` in the join payload if `socket.accessTokenValue` is ready.

Recommended execution:

1. Make `useDashboardRealtime` perform async setup inside the effect.
2. Await no-arg `supabase.realtime.setAuth()` before creating/subscribing private channels.
3. Add cancellation protection so an unmounted or rerun effect does not subscribe after auth resolves.
4. Keep the same channel topics, Broadcast handlers, and RLS policy.

Verification:

- `pnpm typecheck`
- `pnpm build`
- Read Realtime logs after dashboard open and compare whether unauthorized private channel joins stop or materially drop.
- Manual browser sync validation remains useful, especially:
  - dashboard-created bookmark appears through Broadcast
  - extension-created bookmark appears in an open dashboard
  - bookmark update/delete syncs
  - group create/update/delete syncs

### P2: Treat Historical Realtime Counters As A Measurement Caveat

Current state:

- `pg_stat_statements` cumulative totals are still dominated by Realtime internal WAL queries.
- Those counters include pre-Broadcast-only history.
- Current checks show:
  - `public.bookmarks` and `public.groups` remain absent from native `supabase_realtime`
  - Broadcast triggers remain active
  - performance advisors are clean
  - Broadcast replication starts normally

Recommendation:

- Do not execute anything from these cumulative counters in this phase.
- Do not reset `pg_stat_statements` without explicit approval.
- If later proof is needed, use an approval-gated reset plus observation window.

### P3: Historical `order_index` Reorder Queries Are Not Current Execution Candidates

Current state:

- Historical stats include group/bookmark `order_index` update paths.
- Current dashboard DnD code writes `rank` for reorder.
- The historical query means are low and cache hit is 100%.
- No lock/advisor/active-query evidence points at reorder as current trouble.

Recommendation:

- Do not add indexes or schema changes from this evidence.
- Only revisit if a live path still writes `order_index` frequently or user-visible reorder latency appears.

## Explicit Non-Goals

- Do not relax `realtime.messages` RLS.
- Do not switch to public channels.
- Do not re-add `public.bookmarks` or `public.groups` to native `supabase_realtime`.
- Do not reintroduce native `postgres_changes` subscriptions.
- Do not pass a manually fetched one-time token unless no-arg `setAuth()` fails with evidence.
- Do not reset `pg_stat_statements` in this phase.
- Do not terminate connections or change pool settings.

## Execution Queue

1. Code-only: await Realtime auth before private Broadcast channel subscription in `useDashboardRealtime`.

No database, migration, policy, trigger, or publication execution is recommended.

## Approval Gate

Execution is waiting for explicit user approval.
