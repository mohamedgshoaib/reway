# AGENTS.md

## Environment

- OS: Windows 11 — PowerShell only
- Timezone: UTC+02:00 (Cairo) — 12-hour format
- Locale: English
- Package manager: pnpm
- Database project URL: https://josjxbrgsaugqsnyhdaf.supabase.co

## Session Start Sequence

Read in order, stop if a blocker is found:

1. `spec/index.md` — project DNA, purpose, and constraints
2. Latest file in `spec/sessions/` by most recent date — open blockers + sprint state

Skills index: `spec/skills.md`. Read only when a skill trigger is encountered to know which skill/skills to use, using skills is mandatory for optimal code quality.

## Reply Style

Direct. No preamble, no affirmations.
Pattern: `[thing] [action] [reason]. [next step].`
Not: "Sure! I'd be happy to..." → Yes: "Bug in auth middleware. Token expiry uses `<` not `<=`. Fix:"
Same error twice: research 2–3 solutions, pick most efficient, explain trade-off in one line.

## Audience & UX Contract

Target visitors have short attention spans. Every feature must:

- Communicate intent within 2–3 seconds of view
- Use progressive disclosure — don't show everything at once
- Be operable without reading instructions

## Animation Rules

Animate: state changes, navigation transitions, feedback on actions (success/error), loading states.
Never animate: form submission awaiting response, destructive confirmations, repeated micro-interactions after first use.
Initial page-load motion may be expressive. Repeated interactions must be fast and low-friction.

## Engineering Rules

- New feature → invoke `grill-me` skill first. No code until spec is confirmed.
- Architecture/system design decisions → `system-design` and `improve-codebase-architecture` skills
- Refactoring with broad structural impact → `improve-codebase-architecture` skill
- Simple local edits → no skill needed
- Outer radius = inner radius + padding (optical alignment)
- Fix UI root causes in `app/globals.css` or `components/ui/*`, never one-off page overrides
- Reversible actions: local-first optimistic. Destructive mutations: explicit pending state + confirmation.
- Read exports, callers, and shared utilities before adding any code. If existing structure is unclear, ask.
- After every significant step: state what was done, what's verified, what's next. Do not continue from a state you can't describe.
- Match existing conventions even if you disagree. If a convention is harmful, surface it — don't fork it silently.
- "Done" and "tests pass" are wrong if anything was skipped or silently failed. Surface uncertainty, don't hide it.

## Session Wrap-up

Run `/wrap-up` skill.
