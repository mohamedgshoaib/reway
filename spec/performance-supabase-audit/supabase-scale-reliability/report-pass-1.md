# Supabase Load Scale Report Pass 1

## Status

`reporting`

## Summary

Current load-scale risk is low. The live database is small, connection usage is low, performance advisors are clean, and there is no Storage or Edge Function footprint to tune. The main scale concern is future-facing: the dashboard currently opens by loading full per-user lists, which is acceptable at the current size but becomes the first real per-account ceiling as bookmark libraries grow.

## Findings

### P1 — Full-list dashboard reads are the main future per-account scale boundary

**Evidence**

- `app/dashboard/page.tsx` loads `getUser()`, `getBookmarks()`, `getGroups()`, `getNotes()`, and `getTodos()` together.
- `lib/library/server/reads.ts` loads the full dashboard bookmark list with a trimmed but unpaginated select.
- Current `public.bookmarks` footprint is only about `1.1k` rows / `1864 kB`.
- No performance advisor currently flags the read path.

**Impact**

This is fine now. The risk appears when individual accounts move into tens of thousands of bookmarks: first dashboard open will transfer and hydrate a larger whole-library payload, and the client will still need to search/sort/render from that in-memory set. This is a product/architecture threshold more than a current database emergency.

**Recommendation**

Do not reintroduce virtualization as a default response. For this phase, re-analyze whether a smaller, non-disruptive guardrail is useful, such as documenting a practical row threshold, adding an account-size warning metric, or narrowing a secondary read path. Any larger dashboard data-shape change belongs in a future product-designed phase.

### P2 — Import missing-group creation can burst on unusually folder-heavy imports

**Evidence**

- Bookmark import creation is already bounded at concurrency `3`.
- Background enrichment is already bounded at concurrency `2`.
- Missing import groups are created with `Promise.all` in `createMissingImportGroups`.

**Impact**

Normal browser bookmark exports probably have a manageable number of folders, so current risk is low. A pathological import with many unique folder names can still create many group insert requests at once before the bookmark concurrency cap begins.

**Recommendation**

Re-analyze this as the most plausible code execution candidate. A small local change could reuse `runWithConcurrency` for missing-group creation with a low cap, preserving behavior while smoothing write bursts.

### P3 — Extension session capture intentionally favors DB calm over maximum speed

**Evidence**

- `extension/js/save-bookmarks.js` saves batch items sequentially.
- Extension tab sessions can include many tabs, but the current flow avoids parallel POST spikes.

**Impact**

For very large sessions, the popup can take longer to complete. For current Free/Nano constraints, this is a reasonable trade-off because it protects the API/database from bursts.

**Recommendation**

Keep sequential extension session saves for this skill. If UX later demands faster large-session saves, design it with bounded concurrency, retries, and visible progress under the reliability phase rather than changing it here.

### P4 — Infrastructure scale levers are not current execution candidates

**Evidence**

- Database size is `18 MB`.
- Current observed connection use is low against `60` max connections.
- No direct app-side Postgres pool, ORM, `DATABASE_URL`, or pooler configuration is present.
- No Storage objects or Edge Functions are deployed.
- Read replicas require paid-plan prerequisites and introduce asynchronous read lag.

**Impact**

Applying read replicas, compute upgrades, disk changes, Supavisor tuning, Storage CDN work, or Edge Function regional placement now would add cost or conceptual overhead without current evidence.

**Recommendation**

Record readiness guidance only:

- Use primary reads for read-after-write dashboard flows.
- Consider read replicas only for future analytics/reporting or global read-heavy GET traffic on paid infrastructure.
- Revisit compute/disk only when dashboard metrics, usage, or database size justify it.
- Revisit Supavisor only if direct Postgres clients or serverless ORM connections are added.

### P5 — Realtime load posture is already improved enough for this phase

**Evidence**

- Previous phases removed `public.bookmarks` and `public.groups` from native `supabase_realtime`.
- The app now uses trigger-backed private Broadcast as the canonical realtime path.
- Current replication slot is active and streaming with no lag values in the sample.

**Impact**

No additional Realtime scale work is supported by current evidence.

**Recommendation**

Do not change Realtime in this phase. Browser/manual sync validation remains optional, not a load-scale execution candidate.

## Recommended Re-Analysis

1. Validate whether group-import throttling is worth executing now.
2. Define practical dashboard full-list thresholds and what should happen when they are reached.
3. Confirm no extension API read path has an easy low-risk limit or payload improvement left after prior phases.
4. Decide whether final execution should contain one small code change or close with documented guardrails only.

## No-Action Items

- No read replica setup.
- No compute/disk upgrade.
- No Supavisor/pooler configuration change.
- No Storage CDN work.
- No Edge Function region work.
- No dashboard virtualization.
