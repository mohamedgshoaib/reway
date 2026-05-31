# Supabase Advanced Troubleshooting Re-Analysis

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`re-analyzing`

## Status

Re-analysis complete. No app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made.

## Re-Analysis Focus

Pass 1 ranked private Realtime authorization failures as the only actionable candidate. This pass validates whether that should become an execution candidate and what the lowest-risk shape should be.

## Confirmed Evidence

### Current Supabase Guidance

Supabase Broadcast docs and database-change subscription docs both show this sequence for private database Broadcast channels:

1. call `await supabase.realtime.setAuth()`
2. create a private channel
3. subscribe to Broadcast events

Private channels are authorized through `realtime.messages` RLS when the channel joins.

### Local Code Shape

`components/dashboard/content/useDashboardRealtime.ts` currently:

```ts
const supabase = createClient()
supabase.realtime.setAuth()

const bookmarksChannel = supabase
  .channel(`user:${userId}:bookmarks`, { config: { private: true } })
  .on("broadcast", ...)
  .subscribe()
```

The hook runs from `DashboardContent` with `user.id`, so it is already scoped to an authenticated dashboard render.

### Installed Client Behavior

Installed versions:

- `@supabase/supabase-js` `2.106.1`
- `@supabase/realtime-js` `2.106.1`

Relevant local source behavior:

- `SupabaseClient` creates Realtime with an `accessToken` callback.
- `RealtimeClient.setAuth()` is async.
- Calling `setAuth()` with no token uses the access-token callback and does not switch Realtime into manual-token mode.
- `RealtimeChannel.subscribe()` only adds `access_token` to the join payload if `socket.accessTokenValue` is already present at subscribe time.

This confirms the timing issue: calling `setAuth()` without awaiting it can leave the private-channel join payload without the user token.

### RLS And Topic Shape

Current `realtime.messages` policy:

```sql
topic ~~ ('user:' || auth.uid() || ':%')
```

Current trigger topics:

- `user:<row user_id>:bookmarks`
- `user:<row user_id>:groups`

Current client topics:

- `user:${userId}:bookmarks`
- `user:${userId}:groups`

These line up. The policy should not be widened.

## Execution Candidate

### P1: Await Realtime Auth Before Private Channel Subscription

Recommended shape:

- Make the `useEffect` body start an async subscription setup.
- `await supabase.realtime.setAuth()` before creating private channels.
- Add cancellation protection so unmounted/rerendered effects do not subscribe after auth resolves.
- Keep the same private channel names.
- Keep the same `realtime.messages` RLS policy.
- Keep Broadcast-only client behavior.
- Do not re-add native `postgres_changes`.

Why this is low risk:

- It aligns the hook with current Supabase docs.
- It only changes subscription timing.
- It avoids relaxing authorization.
- It preserves token refresh behavior by using no-arg `setAuth()`, rather than manually passing a one-time session token.
- It does not change payloads, triggers, publications, database state, or extension bridge behavior.

What not to do:

- Do not change the channel topics.
- Do not make `realtime.messages` policy `using (true)`.
- Do not add public channels.
- Do not re-add `public.bookmarks` / `public.groups` to `supabase_realtime`.
- Do not pass a manual token unless there is evidence no-arg `setAuth()` fails, because manual-token mode is easier to make stale.
- Do not add noisy runtime logging as part of the first fix.

Expected verification:

- `pnpm typecheck`
- `pnpm build`
- Read Realtime logs after a dashboard open and confirm the repeated unauthorized join pattern stops or drops materially.
- Manual/browser validation can still be done later for:
  - dashboard-created bookmark sync
  - extension-created bookmark sync
  - bookmark update/delete sync
  - group create/update/delete sync

## Non-Candidates After Re-Analysis

### Realtime Cumulative Counters

Still not execution-worthy in this phase:

- Counters are historical and include pre-migration data.
- No approval was given to reset `pg_stat_statements`.
- Current publication and trigger state are correct.

### `order_index` Historical Queries

Still not execution-worthy in this phase:

- The active dashboard DnD paths now write `rank`.
- The historical `order_index` query means are low and cache hit is 100%.
- No lock/advisor evidence points to this as current trouble.

### Connection And Lock Work

No execution candidate:

- no blockers
- no idle-in-transaction sessions
- no active long-running app queries
- no connection pressure signal

## Final Report Direction

The final report should recommend one code-only execution candidate:

1. Await Realtime auth before private channel subscription in `useDashboardRealtime`.

Everything else should remain diagnostic context or deferred measurement.
