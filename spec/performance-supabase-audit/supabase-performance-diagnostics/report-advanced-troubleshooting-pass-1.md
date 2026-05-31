# Supabase Advanced Troubleshooting Report Pass 1

## Skill

`supabase-advanced-troubleshooting`

Companion skill: `supabase`

## Phase

`reporting`

## Status

First-pass report complete. No app code, schema, data, migration, index, publication, trigger, RLS policy, function, or Supabase state change has been made.

## Summary

The database is calm in the places this skill is meant to inspect deeply:

- no live blocked queries
- no idle-in-transaction sessions
- no long-running active app query
- no connection leak signal
- no performance advisor lints
- no Edge Functions to profile
- no stuck enrichment backlog

The meaningful finding is Realtime-specific: private Broadcast subscriptions are repeatedly rejected for user-scoped bookmark/group channels. This matters because the previous performance phase intentionally made private Broadcast the canonical dashboard sync path.

## Ranked Findings

### P1: Private Realtime Channels Can Race Auth Setup

Evidence:

- Realtime logs show repeated authorization failures for private channels shaped like:
  - `user:<redacted-user-id>:bookmarks`
  - `user:<redacted-user-id>:groups`
- API logs show websocket upgrades returning `101`, so the socket connects.
- `realtime.messages` RLS policy allows topics matching `user:<auth.uid()>:%`.
- Trigger functions broadcast to matching topics:
  - `user:<row user_id>:bookmarks`
  - `user:<row user_id>:groups`
- Local dashboard code in `components/dashboard/content/useDashboardRealtime.ts` calls `supabase.realtime.setAuth()` and immediately subscribes to private channels.
- Installed `@supabase/supabase-js` / `@supabase/realtime-js` is `2.106.1`.
- Local library source shows:
  - `setAuth()` is async.
  - `subscribe()` only includes `access_token` in the join payload when `socket.accessTokenValue` is already available.
- Supabase docs show `await supabase.realtime.setAuth()` before subscribing to private Broadcast changes.

Interpretation:

- The RLS policy and topic naming look correct.
- The likely failure mode is timing: the private channel can join before Realtime auth has finished resolving.
- This would make Broadcast unreliable on first dashboard load and explains repeated log noise without requiring a policy widening.

Recommended re-analysis:

- Confirm the safest client-only pattern for the browser client:
  - await `supabase.realtime.setAuth()` before private channel creation/subscription, or
  - rely on the client access-token callback and remove the manual call only if evidence shows it joins private channels with claims reliably.
- Check whether adding subscribe status logging is worth it, or whether it would only add noise.
- Prefer preserving the restrictive `realtime.messages` RLS policy.

Potential execution shape if confirmed:

- Make `useDashboardRealtime` wait for Realtime auth setup before subscribing.
- Add cancellation protection in the effect so unmounted components do not subscribe after auth resolves.
- Keep the same private channels and same RLS policy.
- Verify with `pnpm typecheck`, `pnpm build`, and Realtime logs/manual dashboard sync.

### P2: Historical Realtime Counters Cannot Prove Current Regression

Evidence:

- `pg_stat_statements` cumulative totals are still dominated by Realtime internal WAL queries:
  - ~18.8M calls / ~91.6M ms total
  - ~2.7M calls / ~14.1M ms total
- These counters include history from before the Broadcast-only migration.
- Current publication check confirms `public.bookmarks` and `public.groups` remain absent from native `supabase_realtime`.
- Trigger-backed Broadcast replication starts normally in logs.
- Performance advisors remain clean.

Interpretation:

- The previous realtime performance change cannot be judged from cumulative totals alone.
- A fresh measurement window would require either time or an explicit `pg_stat_statements_reset`, and reset is not appropriate without approval.

Recommended re-analysis:

- Treat this as a measurement caveat, not an execution candidate.
- If user later wants before/after proof, propose an approval-gated stats reset and observation window.

### P3: Historical `order_index` Reorder Queries Appear In App Stats

Evidence:

- App-level `pg_stat_statements` includes group/bookmark `order_index` update queries.
- Current dashboard reorder code appears to use `rank` updates for group and bookmark DnD.
- Means are low:
  - group `order_index` update: ~7.75 ms mean
  - bookmark `order_index` update: ~8.87 ms mean
- Cache hit is 100%.
- No locks, advisors, or active query evidence point to these as current pressure.

Interpretation:

- These are likely historical or fallback paths.
- They should not drive an index or schema change in this phase.

Recommended re-analysis:

- Map remaining code paths that still write `order_index` for bookmarks/groups.
- Only raise this later if those paths are active and user-visible.

## Cleared Items

### Lock Contention

No blocked queries, no waiting lock pairs, and no relation locks on the app/realtime/auth/storage schemas in the snapshot.

### Connection Leaks

No idle-in-transaction sessions. Connection distribution is mostly normal Supabase service and PostgREST activity.

### Long Active Queries

No app query active longer than 15 seconds in the snapshot.

### Edge Functions

No Edge Functions are deployed, so there is no cold-start surface to profile.

### Enrichment Backlog

No bookmarks are stuck with `is_enriching=true`.

### Advisor Signals

Performance advisors are clean. Security advisor still reports leaked-password protection disabled, already accepted as a Free-plan limitation in the known-pitfalls phase.

## Execution Candidates

Not ready for execution yet. Re-analysis should first validate the Realtime auth timing diagnosis and decide whether the fix is:

1. `await supabase.realtime.setAuth()` before subscribing, with effect cancellation; or
2. a different Supabase-supported private-channel auth pattern.

No database mutation, migration, policy relaxation, or publication change is recommended from first-pass evidence.

## Next Step

Proceed to `re-analyzing`, focused on confirming the private Realtime auth race and narrowing the safest code-only execution candidate.
