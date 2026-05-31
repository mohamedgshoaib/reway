# React Performance Report Pass 1

## Phase

`reporting`

## Summary

The dashboard already has several important protections: board item components are memoized, search filtering uses a deferred value, heavy closed surfaces were deferred during the Next.js phase, and extension popup startup is asynchronous enough for the current target.

The remaining React performance risk is concentrated in the dashboard's broad render ownership and fully mounted large-list surfaces.

## Ranked Findings

### P1 - Dashboard render fan-out is broader than necessary

Status: confirmed candidate, needs re-analysis before execution.

Evidence:

- `useDashboardState` centralizes bookmarks, groups, notes, todos, preferences, selection, search, command mode, keyboard state, palette, and folder tint in one client hook.
- `DashboardContent` rebuilds the main adapter objects on each render.
- `DashboardLayout`, `DashboardSidebar`, `DashboardNotesTodosSidebar`, `DashboardNav`, and `CommandBar` are plain components, so they render whenever their parent renders even when their relevant props did not materially change.
- Search uses `useDeferredValue`, but the immediate query state still lives high enough to rerender the dashboard shell on every keystroke.

Expected user impact:

- Search typing, realtime enrichment updates, selection changes, note/todo edits, and preference changes can cause wide dashboard rendering before reaching the memoized board/item boundaries.

Recommended execution shape:

- First, stabilize adapter object identities with `useMemo` where useful.
- Then memoize shell components that receive those adapters and mostly render from props.
- Keep the patch incremental; do not split the entire dashboard state model in the first execution step.

Re-analysis checks:

- Confirm which adapter props are unstable because of fresh inline functions.
- Confirm memoizing `DashboardLayout`/sidebar/nav components would actually skip meaningful renders after adapter stabilization.
- Avoid making dependencies brittle or hiding necessary renders.

### P1 - Large bookmark collections are still fully mounted

Status: confirmed scale ceiling, not first execution candidate without extra skill loading.

Evidence:

- `BookmarkBoard` maps every `renderedDisplayBookmark` into sortable row/card components.
- `FolderBoard` maps every visible folder and every bookmark in open folders.
- Each bookmark item owns sortable state, context-menu wiring, dialog state, favicon fallback state, and action handlers.
- The dashboard scalability record targets 500-1000 bookmarks for heavier users and records that virtualization was intentionally removed.

Expected user impact:

- DOM count and sortable work become the ceiling for large accounts, especially folder mode and card-heavy views.
- Drag and keyboard interactions inherit the full mounted surface.

Recommended execution shape:

- Do not implement virtualization from this report alone.
- If this becomes the execution target, load `dnd-kit-react` and `tanstack-virtual` first as required by `spec/reports/dashboard-scalability-performance.md`.
- Prefer phased implementation: list view first, card/grid second, folder view last.

Re-analysis checks:

- Decide whether current product priority justifies reintroducing virtualization complexity now.
- Check whether a smaller non-virtual cut exists, such as reducing folder default mounted content or memoizing folder sections.

### P2 - Derived bookmark work repeats across dashboard layers

Status: confirmed candidate, likely smaller execution step.

Evidence:

- `useDashboardDerived` filters all bookmarks and counts groups whenever bookmark state changes.
- `BookmarkBoard` converts every rendered bookmark to display data and reparses the URL domain twice per bookmark.
- `BookmarkBoard` maps ids separately for `SortableContext`.
- `FolderBoard` buckets and sorts all group buckets whenever bookmark/group visibility inputs change.

Expected user impact:

- Realtime enrichment, imports, refreshes, reorders, and search filtering perform repeated O(n) work before render.
- This will matter more as accounts approach 500-1000 bookmarks.

Recommended execution shape:

- Start with the low-risk repeated display work: reuse persisted `domain` when valid, avoid double `getDomain` calls, and memoize sortable id lists.
- Leave larger derived-state restructuring for after the render fan-out re-analysis.

Re-analysis checks:

- Verify `bookmark.domain` is populated and reliable enough for display fallback.
- Confirm no duplicate UI, favicon update, or detail fetch path relies on recomputing domain in the board.

### P2 - Always-visible group icon paths still keep the icon catalog active

Status: confirmed overlap from Next.js phase, better suited to React execution after re-analysis.

Evidence:

- `DashboardSidebar`, `GroupRowItem`, and `FolderHeader` still import or resolve `ALL_ICONS_MAP` on always-visible group paths.
- The Next.js phase deferred edit/create/drag overlay icon consumers, but visible rows and folder headers remain hot.

Expected user impact:

- The remaining cost is mostly active dashboard module weight and repeated icon resolution in group-heavy accounts.

Recommended execution shape:

- Consider a shared memoized group icon component or resolver used by sidebar rows and folder headers.
- Preserve user-selected icons and existing fallback behavior.

Re-analysis checks:

- Determine whether runtime lookup cost matters or whether this is only module weight.
- Avoid a partial abstraction that keeps all imports hot while adding indirection.

### P3 - Extension popup render path is not a React-pass blocker

Status: non-blocking for this skill.

Evidence:

- Popup shell renders immediately.
- Groups use cached storage before background refresh.
- Page metadata and environment controls hydrate asynchronously.
- Three group selects are rebuilt from the group list, but the expected group range is small enough for this to be acceptable.

Recommended action:

- Carry extension forward into Supabase/reliability passes.
- Do not spend React execution budget here unless measurement or user feedback shows popup startup jank.

## Recommended Re-Analysis Order

1. Render fan-out and adapter stability.
2. Derived bookmark work and domain/id memoization.
3. Remaining icon resolver paths.
4. Large-list virtualization feasibility only if the user wants to revisit that complexity.

## Current Execution Candidates

Candidate A: Stabilize `DashboardContent` adapters and memoize shell components.

Candidate B: Reduce repeated board display transforms and sortable id mapping.

Candidate C: Consolidate group icon rendering without breaking selected icons.

Candidate D: Virtualization reintroduction. This is high-impact but high-complexity and should wait unless explicitly approved after loading the dnd-kit and TanStack Virtual guidance.

## Next Phase

`re-analyzing`
