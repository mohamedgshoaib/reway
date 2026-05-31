# React Performance Analysis Pass 2

## Phase

`re-analyzing`

## Re-Analysis Focus

This pass rechecked the first report's top findings for execution quality:

- whether adapter memoization would materially reduce renders
- whether search typing is the real high-frequency fan-out source
- whether domain/id transform cleanup is safe
- whether icon catalog work is runtime cost or active module weight
- whether virtualization should be considered in this skill phase

## Refined Findings

### 1. Render fan-out is real, but plain adapter memoization is not the best first cut

Initial report direction:

- Stabilize `DashboardContent` adapters.
- Memoize shell components.

Refinement:

- This is valid as a longer direction, but adapter memoization alone is likely to underdeliver.
- The search input is controlled directly from `dashboard.searchQuery` through `DashboardContent -> DashboardLayout -> CommandBar -> CommandBarInput`.
- `CommandBarInput` calls `onSearchChange` on every search keystroke, which updates high dashboard state immediately.
- `useDeferredValue` delays filtering work, but it does not stop the high parent render caused by the immediate controlled value.

Execution implication:

- First meaningful fan-out patch should localize the search draft inside `CommandBar` and send the deferred value upward, or otherwise reduce parent updates from each physical keystroke.
- After search is localized, adapter/shell memoization becomes more valuable because fewer high-frequency values invalidate the whole dashboard shell.

Recommended final-report wording:

- Keep the finding as P1.
- Change execution candidate from "memoize adapters first" to "localize command search draft first, then stabilize adapters/shells if still useful."

### 2. Large-list full mounting remains the highest scale ceiling, but should not be executed casually

Confirmed:

- `BookmarkBoard` and `FolderBoard` fully mount visible bookmark collections.
- This remains the main ceiling for 500-1000 bookmark accounts.

Refinement:

- The codebase intentionally removed virtualization to preserve stable drag, keyboard, search, selection, preview, edit, and group switching behavior.
- The scalability record requires loading `dnd-kit-react` and `tanstack-virtual` before any virtualization implementation.
- `@tanstack/react-virtual` and `react-window` are not currently installed.

Execution implication:

- Do not make virtualization the first React execution step.
- Treat it as a separate high-complexity approval gate, not a casual cleanup patch.

Recommended final-report wording:

- Keep as P1 scale risk.
- Mark execution as "defer unless user explicitly approves a virtualization mini-project."

### 3. Derived display transform cleanup is a strong low-risk candidate

Confirmed:

- `DASHBOARD_BOOKMARK_SELECT` already includes `domain`.
- Bookmark creation and update paths persist `domain`.
- Board render paths recompute domains with `getDomain(bookmark.url)` even when `bookmark.domain` is already present.
- `BookmarkBoard` calls `getDomain` twice while shaping each rendered bookmark.
- `FolderBoard` repeats the same pattern for icon cards.
- `SortableContext` id arrays are built inline from display/bookmark arrays during render.

Execution implication:

- Use a small helper such as `getBookmarkDisplayDomain(bookmark)` or inline `bookmark.domain || getDomain(bookmark.url)` in board shaping.
- Compute domain once per bookmark during display shaping.
- Memoize sortable item id arrays in `BookmarkBoard` and inside folder sections where practical.

Risk:

- Low. Fallback to `getDomain(url)` preserves behavior when `domain` is missing or stale.
- Do not change server selects or mutation contracts in this React pass.

Recommended final-report wording:

- Promote this to the first likely execution candidate if user wants a narrow, safe React patch.

### 4. Icon catalog finding is real but less urgent than first-pass wording implied

Confirmed:

- Always-visible group rows and folder headers still resolve user-selected icons through `ALL_ICONS_MAP`.
- The Next.js phase only deferred idle create/edit/drag overlay icon consumers.

Refinement:

- Runtime lookup is cheap; the larger concern is active module weight.
- Preserving user-selected icons means some form of icon catalog access is still needed in visible group paths.
- Deferring visible group icons could cause visual pop or fallback icons during hydration/open, which works against Reway's visual scanning principle.

Execution implication:

- Do not prioritize this ahead of search fan-out or display transform cleanup.
- A later patch can still centralize group icon rendering to reduce duplication and prepare for better icon loading, but it should not compromise first paint clarity.

Recommended final-report wording:

- Downgrade to P3 / cross-skill follow-up unless bundle measurement shows the active icon module is a major route cost.

### 5. Extension popup remains non-blocking for React performance

Confirmed:

- Popup shell initializes before async group and metadata hydration.
- Cached groups are rendered first when available.
- Group option rendering rebuilds menus, but target group counts make this acceptable.

Execution implication:

- No React execution candidate for extension in this skill.
- Carry extension into Supabase/reliability passes.

## Updated Execution Candidates

1. Localize command search draft so typing does not update high dashboard state on every keystroke.
2. Reduce repeated board display transforms: use stored `domain` with fallback and memoize sortable id arrays.
3. Stabilize dashboard adapters/shell memoization after search fan-out is reduced.
4. Virtualization only as a separately approved mini-project with `dnd-kit-react` and `tanstack-virtual`.

## Final Report Inputs

- Keep P1: dashboard fan-out, but refine root cause toward search-state ownership.
- Keep P1: large list mounting, but mark execution deferred/high-complexity.
- Keep P2: repeated transforms, likely first safe patch.
- Downgrade icon catalog to P3 unless bundle evidence changes priority.
- Keep extension as non-blocking.

## Next Phase

`reporting`
