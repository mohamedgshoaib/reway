# React Performance Execution Log

## Phase

`executing`

## Approved Step 1

Command search state ownership.

### Change Applied

Updated `components/dashboard/CommandBar.tsx` to:

- keep the visible search input in local component state
- defer dashboard-level `onSearchChange` updates through `useDeferredValue`
- preserve mode switching behavior between `add` and `search`
- keep add-mode submission and shortcut handling on the existing path

### Why This Step Was Chosen First

- It is the top approved execution candidate from `report-final.md`.
- Search typing is the highest-frequency dashboard interaction identified in this React pass.
- The previous flow updated dashboard-level state on every keystroke before deferred filtering could help.
- This patch narrows the first React execution step to state ownership instead of broader memoization churn.

### Behavioral Notes

- Search input text still updates immediately in the command bar.
- Dashboard filtering now follows the deferred local search draft instead of the raw keystroke stream.
- Switching from `add` to `search` still seeds search from the current add input.
- Switching back to `add` still clears search state upstream.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

## Deferred Follow-up

Virtualization mini-project.

### Decision

Do not reintroduce dashboard virtualization in this React audit phase.

### Why It Was Deferred

- The previous virtualization implementation had already been removed from the product.
- User feedback on that implementation was specific: scroll became laggy and visible gaps appeared between bookmarks.
- The known scale ceiling is real, but this phase is focused on worthwhile patches that improve performance without reopening already-proven UX regressions.

### What Remains True

- Large fully mounted bookmark collections are still the biggest long-term React scale ceiling.
- If virtualization returns later, it should be treated as a fresh, separately approved project with new profiling and validation, not as a quick continuation of this execution log.

## Approved Step 2

Board display transform cleanup.

### Change Applied

Updated `components/dashboard/BookmarkBoard.tsx` and `components/dashboard/FolderBoard.tsx` to:

- prefer stored bookmark `domain` with `getDomain(url)` as fallback
- compute display domain once per rendered bookmark path instead of repeating URL parsing
- precompute sortable item id arrays instead of mapping them inline inside `SortableContext`

### Why This Step Was Chosen Next

- It was the next narrow execution candidate from `report-final.md`.
- The patch removes repeated board render work without changing data contracts or interaction behavior.
- It complements the search-state ownership patch by trimming per-render work once the dashboard does rerender.

### Behavioral Notes

- Bookmark titles still use the same display-title fallback rules.
- Domain rendering still falls back safely when stored domain data is missing.
- DnD sortable item identity is unchanged.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

## Approved Step 3

Shell and adapter stability.

### Change Applied

Updated `components/dashboard/DashboardContent.tsx` to:

- memoize `navigationAdapter`, `libraryAdapter`, `selectionAdapter`, and `notesTodosAdapter`
- tighten a few callback dependency lists so stable state setters do not inherit the entire `dashboard` object

Updated `components/dashboard/content/useDashboardNavigationControls.ts` and `components/dashboard/content/useGroupActions.ts` to memoize the returned control objects used by shell components.

Updated these shells to use `React.memo`:

- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/DashboardNav.tsx`
- `components/dashboard/CommandBar.tsx`
- `components/dashboard/content/DashboardSidebar.tsx`
- `components/dashboard/content/DashboardNotesTodosSidebar.tsx`

Updated `components/dashboard/DashboardLayout.tsx` to memoize the sidebar library payload, enrichment-health payload, and shared enter-selection callback passed into board views.

### Why This Step Was Chosen Next

- Search-state ownership was already improved in step 1, so shell memoization could now unlock real skips instead of being invalidated by every keystroke.
- This patch stays within the report's approved direction without stepping into virtualization complexity.
- It reduces structural rerender churn around dashboard navigation, sidebars, and command controls.

### Behavioral Notes

- No dashboard behavior, route flow, or interaction contract was intentionally changed.
- The patch only stabilizes objects and shell boundaries so unchanged props can skip renders more often.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed
