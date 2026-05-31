# Supabase Load Scale Final Report

## Status

`reporting-final`

## Executive Summary

Current Supabase load-scale risk is low. The project is far below database size, connection, Storage, Edge Function, and read-replica pressure points. The only execution-worthy item in this phase is a small import-flow smoothing patch: throttle missing-group creation during bookmark imports so folder-heavy imports do not issue unbounded group create requests.

## Final Findings

### P1 — Import missing-group creation should be throttled

**Status:** execution candidate

**Evidence**

- `components/dashboard/content/useImportHandlers.ts` creates missing import groups with `Promise.all`.
- The same import flow already caps bookmark creation at `3` and enrichment at `2`.
- This creates an inconsistent setup: bookmark writes are bounded, but pre-bookmark group writes can burst if an imported bookmark file contains many new folder names.

**Why it matters**

Normal imports are likely fine, but folder-heavy imports can create avoidable API/database write pressure. On the current Free/Nano-style constraints, smoothing bursts is more valuable than shaving a small amount of time off the setup stage.

**Recommended execution**

- Add `CREATE_GROUP_CONCURRENCY = 3`.
- Replace missing-group `Promise.all` with the existing `runWithConcurrency` helper.
- Preserve returned group ordering so generated ranks and UI insertion remain deterministic.
- Do not change bookmark creation concurrency or enrichment concurrency.

**Verification**

- `pnpm typecheck`
- `pnpm build`
- Optional local import smoke later if the user wants browser validation; not required for the code-only patch.

### P2 — Full-list dashboard reads are a future threshold, not current execution

**Status:** guardrail

**Evidence**

- Current database size is `18 MB`.
- Largest current account measured at `264` bookmarks and about `168522` bytes of uncompressed dashboard bookmark JSON.
- Existing scalability decision record targets roughly `500-1000` bookmarks per user.
- Prior work already removed heavy detail fields from initial bookmark payloads.

**Decision**

Do not change dashboard read shape in this phase.

**Carry-forward threshold**

Re-measure and design a product-level data-shape change when a real account exceeds about `5000` bookmarks or initial dashboard bookmark JSON consistently crosses about `3 MB` uncompressed. This is a measurement trigger, not a hard product limit.

**Explicit non-action**

- No dashboard virtualization.
- No pagination/infinite-loading patch in this skill.
- No read-replica routing for dashboard startup reads.

### P3 — Extension session saves should remain sequential

**Status:** no action

**Evidence**

- `extension/js/save-bookmarks.js` saves batch items sequentially.
- This protects API/database load during tab-session capture.

**Decision**

Keep sequential saves in this phase. If faster large-session capture becomes necessary, handle it during `supabase-reliability-patterns` with bounded concurrency, retry/backoff, and progress semantics.

### P4 — Supabase infrastructure scale levers are not justified now

**Status:** no action

**Evidence**

- Observed connection use is low against `60` max connections.
- No direct app-side Postgres client, ORM pool, `DATABASE_URL`, or pooler configuration was found.
- No Storage objects exist.
- No Edge Functions are deployed.
- Performance advisors return no lints.

**Decision**

Do not execute:

- read replica setup
- compute or disk changes
- Supavisor/pooler tuning
- Storage CDN/image transform work
- Edge Function regional deployment
- table partitioning

These are future plan/cost decisions, not current repo patches.

### P5 — Realtime load posture is already sufficient for this phase

**Status:** no action

**Evidence**

- Previous phases removed `public.bookmarks` and `public.groups` from native `supabase_realtime`.
- Trigger-backed private Broadcast remains the canonical realtime path.
- Current Realtime replication is active and streaming in the read-only sample.

**Decision**

No Realtime load-scale change in this phase.

## Execution Plan

Execution remains approval-gated.

1. Throttle missing-group import creation in `components/dashboard/content/useImportHandlers.ts`.
2. Verify with `pnpm typecheck`.
3. Verify with `pnpm build`.
4. Update `execution-load-scale.md`, trackers, and session note.

## Close Criteria

The `supabase-load-scale` phase can close after the import group throttling patch is either:

- approved, executed, and verified; or
- explicitly declined and documented as deferred.

No live Supabase mutation, schema change, migration, compute change, replica setup, pooler tuning, Storage change, or Edge Function deployment is recommended.
