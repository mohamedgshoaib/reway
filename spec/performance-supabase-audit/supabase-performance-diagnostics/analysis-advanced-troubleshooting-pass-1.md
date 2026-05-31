# Supabase Advanced Troubleshooting Analysis Pass 1

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`analyzing`

## Status

Read-only analysis complete. No app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made.

## Evidence Collected

### Current Documentation

Supabase docs confirm:

- `pg_stat_statements` is the right source for cumulative query diagnostics.
- `pg_stat_activity` and `pg_locks` are the right sources for live connection, long query, and lock contention checks.
- Broadcast is the recommended scalable path for database-change delivery.
- Private Realtime channels require Realtime Authorization through `realtime.messages` RLS.
- Supabase docs show `await supabase.realtime.setAuth()` before private Broadcast subscription.

### Extensions

Installed:

- `pg_stat_statements` `1.11`
- `pgcrypto` `1.3`
- `uuid-ossp` `1.1`

`pg_stat_statements` is available for this phase.

### Query Outliers

Historical cumulative database time remains dominated by Realtime internals:

- `supabase_admin` WAL/Realtimes queries:
  - ~18.8M calls / ~91.6M ms total / ~4.86 ms mean
  - ~2.7M calls / ~14.1M ms total / ~5.23 ms mean
- These are historical cumulative counters, not a post-migration-only window.
- Do not use this alone to judge the Broadcast-only change without either a later observation window or an approved stats reset.

Visible app-level signals:

- Authenticated group `order_index` update path:
  - 1,381 calls / ~10.7s total / ~7.75 ms mean / ~310 ms max
  - Likely historical or legacy reorder path, because current dashboard reorder code writes `rank` for groups.
- Authenticated bookmark full-list reads:
  - examples around 1,063 to 3,038 calls
  - means ~2.78 ms to ~9.18 ms
  - cache hit 100%
- Authenticated bookmark `order_index` update path:
  - 1,066 calls / ~9.46s total / ~8.87 ms mean / ~151 ms max
  - likely historical or non-rank fallback because current dashboard reorder writes `rank`.
- Service-role bookmark inserts:
  - means ~14.29 ms to ~28.91 ms
  - cache hit 100%
- `increment_bookmark_visits` still appears in API logs, but it did not outrank the pass-1 app query list after the realtime change.

Non-app/system outliers:

- `SELECT name FROM pg_timezone_names`
  - 282 calls / ~192.6s total / ~683 ms mean
  - appears via `authenticator`, likely PostgREST/schema metadata behavior rather than Reway application code.
- MCP / Dashboard metadata and extension-inspection queries appear in max-time outliers and should not become execution candidates for the app.

### Locks And Connections

Current `pg_stat_activity` snapshot:

- No blocked queries.
- No idle-in-transaction sessions.
- No long-running active app queries over 15 seconds.
- No current relation locks on `public`, `realtime`, `auth`, or `storage` surfaced in the sampled lock query.

Connection distribution:

- 2 idle `authenticator` / `postgrest` connections.
- 1 active `postgres` / `mgmt-api` connection from the MCP query itself.
- Supabase service connections for exporter, pg_cron, and pg_net.

This does not indicate an app connection leak.

### Advisors

Performance advisors:

- No lints.

Security advisors:

- `auth_leaked_password_protection` remains `WARN`.
- This is already accepted as a Free-plan limitation in the previous known-pitfalls phase.

### Realtime Health

Publication and trigger state:

- `public.bookmarks` and `public.groups` are still absent from native `supabase_realtime`.
- `bookmarks_sync_trigger` remains active for `INSERT`, `UPDATE`, and `DELETE`.
- `groups_sync_trigger` remains active for `INSERT`, `UPDATE`, and `DELETE`.
- Trigger functions broadcast to:
  - `user:<row user_id>:bookmarks`
  - `user:<row user_id>:groups`

Realtime logs:

- Broadcast replication starts normally for `realtime.messages`.
- Logs include repeated private-channel authorization failures for redacted topics:
  - `user:<redacted-user-id>:bookmarks`
  - `user:<redacted-user-id>:groups`
- These failures recur around dashboard websocket connections.
- Logs also show normal tenant shutdowns when no users are connected; that is not itself a bug.

Realtime policy:

```sql
topic ~~ ('user:' || auth.uid() || ':%')
```

The policy shape matches the intended topic pattern.

Local code:

- `components/dashboard/content/useDashboardRealtime.ts` creates private channels for:
  - `user:${userId}:bookmarks`
  - `user:${userId}:groups`
- It calls `supabase.realtime.setAuth()` and immediately subscribes.
- Installed `@supabase/supabase-js` / `@supabase/realtime-js` version is `2.106.1`.
- In `@supabase/realtime-js`, `setAuth()` is async and fills `accessTokenValue` after the auth promise resolves.
- `RealtimeChannel.subscribe()` includes `access_token` in the join payload only if `socket.accessTokenValue` is already present.

Inference:

- Reway may be racing private channel subscription against Realtime auth setup.
- If the channel joins before `setAuth()` resolves, Realtime evaluates the private topic without the authenticated user claims and rejects it.
- This matches the repeated unauthorized channel logs while the websocket connection itself succeeds.

### API And Postgres Logs

API logs:

- Normal dashboard reads return `200`.
- Realtime websocket upgrades return `101`.
- Visit RPC calls return `204`.
- No recurring REST/Auth 4xx/5xx pattern surfaced in the sampled API logs.

Postgres logs:

- Mostly Supabase management/API connection logs.
- One known `syntax error at or near "exists"` appears from the earlier failed publication SQL attempt and was already documented in the performance execution plan.
- No new app-owned database error pattern surfaced.

### Enrichment State

Bookmark enrichment snapshot:

- `ready` / `is_enriching=false`: 1,015
- `failed` / `is_enriching=false`: 83
- No `is_enriching=true` backlog.

This does not indicate stuck enrichment work.

## First-Pass Findings

### P1: Private Realtime Authorization Race Candidate

Evidence:

- Realtime logs repeatedly reject private `bookmarks` and `groups` topics.
- The RLS policy and topic format are aligned.
- The websocket connects successfully, so the issue is probably channel authorization, not network connectivity.
- Local code calls async `setAuth()` without awaiting it before private channel subscription.
- `realtime-js` includes the access token in the join payload only if the auth value is ready.

Why it matters:

- This can make the Broadcast-only realtime path unreliable on first dashboard load.
- It also creates avoidable Realtime authorization attempts and log noise.
- It is directly related to the previous phase's residual manual/browser validation gap.

Candidate direction for re-analysis:

- Confirm current recommended client pattern for private channels.
- Inspect whether `createBrowserClient` already auto-sets Realtime auth enough to remove the manual call or whether the hook should await session/auth before subscribing.
- Prefer a low-risk client-only fix that does not widen the Realtime RLS policy.

### P2: Historical Realtime Counters Need A Fresh Window

Evidence:

- `pg_stat_statements` is still dominated by Realtime WAL/query internals.
- Counters are cumulative and include pre-Broadcast-only history.
- Performance advisors are clean and current logs show Broadcast replication starts normally.

Why it matters:

- It is too easy to overread old cumulative stats and chase a solved problem.

Candidate direction for re-analysis:

- Treat current logs and manual behavior as stronger evidence than cumulative Realtime totals.
- Do not reset `pg_stat_statements` without explicit approval.

### P3: Legacy Reorder `order_index` Query Shapes Are Still In Historical Stats

Evidence:

- App-level outliers include group/bookmark `order_index` updates.
- Current dashboard DnD code writes `rank` for group and bookmark reorder.
- These stats may represent historical behavior or non-dashboard fallbacks.

Why lower priority:

- Means are low, cache hit is 100%, and no locks or advisors point at this as active trouble.

Candidate direction for re-analysis:

- Verify whether any remaining live code still writes group/bookmark `order_index` for reorder paths.
- Do not propose indexes or rank migration changes from this evidence alone.

## Cleared Concerns

- No live lock contention found.
- No idle-in-transaction leak found.
- No active connection pressure found.
- No performance advisor lints found.
- No Edge Functions exist in the project.
- No stuck `is_enriching=true` backlog found.
- No repeated REST/Auth failure pattern surfaced in sampled API logs.

## Next Step

Proceed to first-pass reporting. Rank the Realtime authorization race as the main candidate, with cumulative-stat interpretation and historical reorder stats as supporting cautions rather than immediate execution items.
