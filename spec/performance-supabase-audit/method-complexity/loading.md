# Method Complexity Loading

## Skill

`refactor-method-complexity-reduce`

## Phase

`loading`

## Objective

Identify high-complexity functions that would benefit from behavior-preserving helper extraction, then select refactor candidates one at a time with an explicit target threshold before any code changes.

## Scope

- Dashboard orchestration and board/list interaction methods.
- Extension popup, background, grabber, session, and bridge flows.
- Route handlers and server actions with branching-heavy auth, validation, or Supabase logic.
- Existing helper boundaries that can absorb extracted logic without broad architectural churn.

## Guardrails

- No refactor execution without explicit approval.
- Do not treat this phase as a general architecture rewrite.
- Escalate to `improve-codebase-architecture` only if the finding is structural rather than method-level.
- Preserve behavior, validation, error messages, auth boundaries, and extension contracts.
- For executed refactors, verify compile/test output and explicitly confirm zero failures where test summaries are available.

## Next Step

Analyze the codebase for candidate methods, rank them by complexity and risk, and produce `candidates.md` before proposing any execution.
