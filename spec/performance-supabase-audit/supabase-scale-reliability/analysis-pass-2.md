# Supabase Load Scale Analysis Pass 2

## Status

`re-analyzing`

## Re-Analysis Questions

1. Is import missing-group throttling worth executing now?
2. Are full-list dashboard reads currently over the practical scale target?
3. Is there any remaining low-risk extension read or payload improvement?
4. Should this phase recommend infrastructure changes?

## Current Largest-Account Shape

Fresh read-only payload estimate for the dashboard bookmark field set:

| Bookmark count | Group count | Bookmark JSON bytes | Approx bytes/bookmark |
| ---: | ---: | ---: | ---: |
| `264` | `21` | `168522` | `638.3` |
| `242` | `5` | `176884` | `730.9` |
| `158` | `22` | `94443` | `597.7` |
| `138` | `12` | `91178` | `660.7` |

The existing dashboard scalability decision record scoped the target around `500-1000` bookmarks per user. Current largest accounts are still below that target, and the present payload shape projects roughly:

- `1000` bookmarks: about `0.6-0.75 MB` uncompressed bookmark JSON.
- `5000` bookmarks: about `3-3.7 MB` uncompressed bookmark JSON.
- `10000` bookmarks: about `6-7.3 MB` uncompressed bookmark JSON.

This confirms full-list dashboard reads are not an execution item for this phase. They remain the correct future threshold to watch.

## Dashboard Full-List Read Decision

Do not execute a dashboard data-shape change in this skill.

Reasons:

- Current largest account is below the documented `500-1000` bookmark target.
- The initial bookmark field set was already trimmed in prior scalability work.
- Reintroducing virtualization is explicitly out of scope due prior UX regressions.
- Read replicas do not help same-user dashboard read-after-write semantics on the Free-plan/current setup.
- Pagination/infinite loading would be a product interaction change, not a scale patch.

Carry-forward guardrail:

- Revisit dashboard read shape when a real account exceeds about `5000` bookmarks or when measured initial dashboard payload consistently crosses about `3 MB` uncompressed bookmark JSON. This is not a hard product limit; it is a signal to re-measure and design.

## Import Group Creation Decision

Carry import missing-group throttling forward as the first execution candidate.

Current behavior:

- `createMissingImportGroups` creates every missing group with `Promise.all`.
- Bookmark creation is already capped at concurrency `3`.
- Enrichment is already capped at concurrency `2`.

Why it is worth doing:

- It is small and local to import handling.
- It aligns missing-group creation with the existing import concurrency posture.
- It reduces peak API/database write pressure for folder-heavy imports.
- It preserves the capture-first/import UX because normal imports usually have far fewer missing groups than bookmarks.

Trade-off:

- Imports with many missing groups may spend slightly longer in the group-creation stage before bookmark creation starts.
- This is acceptable because folder creation is setup work and protects the Free/Nano posture from avoidable bursts.

Suggested execution shape:

- Add a `CREATE_GROUP_CONCURRENCY` cap, likely `3`.
- Replace the missing-group `Promise.all` with `runWithConcurrency`.
- Preserve returned group ordering so generated rank assignment and UI insertion remain deterministic.
- Do not change bookmark create concurrency or enrichment concurrency in this phase.

## Extension Read / Payload Decision

No execution candidate.

Reasons:

- Extension group reads are already cached in `chrome.storage.local`.
- Extension bookmark fallback reads use a smaller select list after prior payload trimming.
- Extension session saves are sequential, which is intentionally DB-calm for Free/Nano constraints.
- Parallelizing extension session saves belongs, if ever needed, in the reliability phase with retry/backoff/progress design.

## Infrastructure Decision

No infrastructure execution candidate.

Reasons:

- Database size is `18 MB`.
- Current connection use is low relative to `60` max connections.
- The app does not use direct Postgres clients or an ORM pool.
- No Storage objects exist.
- No Edge Functions are deployed.
- Read replicas and compute upgrades are paid-plan/cost decisions and not justified by current evidence.

## Final Report Direction

The final report should recommend one approval-gated code execution candidate:

1. Throttle import missing-group creation with the existing import concurrency helper.

Everything else should close as documented guardrails or future evidence thresholds.
