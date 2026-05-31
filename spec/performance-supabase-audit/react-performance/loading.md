# React Performance Loading

## Skill

`react-performance-optimization`

## Phase

`loading`

## Loaded Context

- Project DNA and constraints from `spec/index.md`
- Current audit tracker from `spec/performance-supabase-audit/README.md`
- Current session state from `spec/sessions/31-May-26-performance-supabase-audit.md`
- Completed Next.js execution log from `spec/performance-supabase-audit/nextjs-performance/execution-plan.md`
- Skill guidance from `.agents/skills/react-performance-optimization/SKILL.md`
- Targeted references:
  - `.agents/skills/react-performance-optimization/references/state-management.md`
  - `.agents/skills/react-performance-optimization/references/memoization.md`
  - `.agents/skills/react-performance-optimization/references/virtualization.md`

## Audit Scope

- Rerender cascades and state ownership in dashboard client surfaces.
- Memoization opportunities only when a component is frequently rerendered, expensive, or receives stable props.
- Large collection behavior in board, list, folder, sidebar, and command surfaces.
- Remaining icon resolver/render costs after the Next.js sidebar idle-path deferral.
- Extension popup responsiveness only where React-like or DOM render work affects capture speed.

## Guardrails From Completed Next.js Phase

- Do not reopen `nextjs-performance` unless this pass finds a real regression or overlap that needs to be recorded.
- Treat existing dynamic imports for sheets, settings, landing sections, sidebar create/edit surfaces, and drag overlay as completed work.
- Browser validation is intentionally skipped for now unless a React finding needs it.
- Execution remains approval-gated and one step at a time.

## Initial Analysis Targets

- `components/dashboard/DashboardContent.tsx`
- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/content/`
- `components/dashboard/hooks/`
- `components/dashboard/nav/`
- `components/dashboard/command/`
- `extension/`

## Next Phase

`analyzing`
