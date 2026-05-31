# React Performance Final Report

## Phase

`reporting`

## Status

Execution completed for the approved low-risk React patches. The separate virtualization mini-project was intentionally not revived for this phase because prior attempts caused laggy scroll and visible row gaps.

## Summary

The dashboard has already absorbed several wins from the closed Next.js phase: closed sheets are deferred, below-fold landing sections are split, loading states exist, and root providers were trimmed. The remaining React performance work is not mostly about more lazy loading. It is about high-frequency state ownership, repeated per-bookmark work, and the known large-list ceiling.

Execution summary:

- `CommandBar` now keeps the visible search draft local and defers dashboard-level search updates.
- `BookmarkBoard` and `FolderBoard` now reuse stored `domain` values when available and avoid a few repeated render-path transforms.
- `DashboardContent`, dashboard shell adapters, and key shell components now stabilize props more effectively so unchanged surfaces can skip more rerenders.
- Virtualization remains documented as the largest scale ceiling, but it is explicitly deferred because the previously shipped version regressed scroll smoothness and introduced row gaps.

## Final Findings

### P1 - Search typing updates dashboard-level state on every keystroke

Evidence:

- Search input value is controlled by `dashboard.searchQuery`.
- `CommandBarInput` calls `onSearchChange` on every search keystroke.
- That setter lives in `useDashboardState`, so each keystroke renders through `DashboardContent` and its shell structure before the deferred filtering value settles.
- `useDeferredValue` protects filtering latency, but not parent render fan-out from the immediate controlled value.

Impact:

- Search is a high-frequency interaction. On larger libraries, the user can feel this as input/render pressure even when filtering itself is deferred.

Recommended execution:

- Localize the search draft inside `CommandBar`.
- Send a deferred or committed search value upward for dashboard filtering.
- Preserve current behavior: search text still appears immediately, filtering remains responsive, mode switching still clears/restores the right value, and keyboard shortcuts keep working.

Risk:

- Medium. The patch touches a central command workflow, but can be kept narrow.

### P1 - Large bookmark collections are fully mounted

Evidence:

- `BookmarkBoard` renders every visible bookmark into a sortable row/card.
- `FolderBoard` renders every visible folder and every bookmark in open folders.
- Each bookmark item owns `useSortable`, context menu, dialog state, favicon fallback state, and handlers.
- The dashboard scalability record targets heavy accounts at 500-1000 bookmarks and confirms virtualization is currently removed.

Impact:

- This remains the largest scale ceiling for CPU, DOM count, scroll, and drag responsiveness.

Recommended execution:

- Defer for now unless explicitly approved as a virtualization mini-project.
- Before implementation, load `dnd-kit-react` and `tanstack-virtual` as required by `spec/reports/dashboard-scalability-performance.md`.
- If approved later, phase it: list view first, card/grid second, folder sections last.

Risk:

- High. Virtualization intersects drag, keyboard navigation, selection, preview/edit, search, folder collapse, and realtime updates.

### P2 - Board render paths repeat avoidable display transforms

Evidence:

- Dashboard bookmark reads already include stored `domain`.
- Creation/update paths persist `domain`.
- `BookmarkBoard` recomputes `getDomain(b.url)` twice per display bookmark.
- `FolderBoard` recomputes domain while rendering folder bookmark icons.
- `SortableContext` item id arrays are mapped inline during render.

Impact:

- Avoidable O(n) work compounds during search, realtime enrichment, import, refresh, and reorder updates.

Recommended execution:

- Use stored `bookmark.domain` with `getDomain(bookmark.url)` fallback.
- Compute each display domain once per bookmark.
- Memoize sortable id arrays in board render paths where practical.

Risk:

- Low. Fallback preserves behavior when `domain` is missing.

### P3 - Dashboard render shells could benefit from stabilization after search is localized

Evidence:

- `DashboardContent` builds fresh adapter objects each render.
- `DashboardLayout`, `DashboardSidebar`, `DashboardNotesTodosSidebar`, `DashboardNav`, and `CommandBar` are not memoized.

Impact:

- Broad renders are still possible from preference, selection, realtime, notes/todos, and import/export state changes.

Recommended execution:

- Do not start here.
- After search-state ownership is fixed, memoize the shell boundaries that receive stable props and stabilize only adapter objects that actually unlock skipped renders.

Risk:

- Medium-low. The main risk is adding noisy dependency arrays without reducing real renders.

### P3 - Remaining group icon catalog paths are real but not urgent

Evidence:

- Sidebar group rows and folder headers still resolve `ALL_ICONS_MAP` on visible paths.
- Runtime lookup is cheap; the larger concern is active module weight.
- User-selected group icons are part of visual scanning, so deferring visible icons risks a visual pop.

Impact:

- Lower than search-state ownership and repeated bookmark transforms unless bundle measurement proves otherwise.

Recommended execution:

- Defer unless later bundle evidence elevates it.
- If revisited, centralize group icon rendering without removing first-paint icon fidelity.

Risk:

- Medium. Easy to add indirection without reducing module cost.

### P3 - Extension popup is not a React performance blocker

Evidence:

- Popup shell initializes immediately.
- Groups use cached storage before background refresh.
- Page metadata hydrates asynchronously.
- Three group selects rebuild from the group list, but the target group range keeps this acceptable.

Recommended action:

- Carry extension forward into Supabase and reliability passes.
- No React execution candidate needed here.

## Recommended Execution Queue

1. Completed: localize command search draft and reduce parent updates per keystroke.
2. Completed: reduce board display transform work and memoize sortable id arrays.
3. Completed: stabilize shell/adapter boundaries after search ownership moved local.
4. Intentionally deferred: virtualization as a separate mini-project because the previous implementation regressed scroll quality.
5. Defer group icon catalog work unless measurement raises priority.

## Approval Gate

React execution is closed for this skill phase. Any future work here should begin with measurement or a new user-approved mini-project, not by reopening the deferred virtualization path by default.
