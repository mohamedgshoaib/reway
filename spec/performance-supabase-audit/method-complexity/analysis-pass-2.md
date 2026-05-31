# Method Complexity Analysis Pass 2

## Phase

`re-analyzing`

## Focus

Validate the first proposed execution target from `report-pass-1.md`: `useBookmarkKeyboardNav` in `components/dashboard/bookmark-board/useBookmarkKeyboardNav.ts`.

## Caller Contract

`BookmarkBoard` consumes `useBookmarkKeyboardNav` only for `clampedSelectedIndex` today:

- `clampedSelectedIndex` marks list/card rows as selected.
- The hook still returns `selectedIndex` and `setSelectedIndex`, so a refactor should preserve that public return shape.
- `onPreview` receives the selected `BookmarkRow`; the board then opens quick glance by id.

## Current Behavior To Preserve

- Ignored dashboard hotkeys remain ignored via `shouldIgnoreDashboardHotkey`.
- `ArrowDown` selects the first item from `-1`, then moves by `gridColumns` in grid mode or `1` in list mode.
- `ArrowUp` clamps to `0` when selection is unset or already at the top.
- Grid-only `ArrowRight` selects first item from `-1`, then moves by `1`.
- Grid-only `ArrowLeft` clamps to `0` at or below the first item.
- Space opens preview only when a bookmark is selected.
- Enter opens the selected bookmark in a new tab with Cmd/Ctrl, otherwise copies the URL and shows the same toast.
- Escape resets selected index to `-1`.
- Mousedown outside `[data-slot="bookmark-card"]` resets selected index to `-1`.
- `clampedSelectedIndex` stays `-1` if the selected index exceeds the current bookmark length.

## Extraction Shape

Keep helpers local to `useBookmarkKeyboardNav.ts` for the first execution:

- `getVerticalSelectionIndex(...)`
- `getHorizontalSelectionIndex(...)`
- `getSelectedBookmark(...)`
- `openOrCopyBookmark(...)`
- optionally `isArrowNavigationKey(...)` only if it improves readability without hiding behavior

This should bring the `handleKeyDown` callback below the report target of 20 while keeping hook state and refs unchanged.

## Shared Helper Decision

Do not share helpers with `useFolderKeyboardNav` in the first execution.

Reason: folder navigation has different semantics:

- folder selection can move between folder rows and bookmark rows
- down from a bookmark can jump to the next folder
- folder-grid mode uses DOM geometry through `findFolderNeighbor`
- Enter toggles folder collapse when a folder, but opens/copies when a bookmark

Any shared abstraction should come after the smaller hook is refactored and reviewed against real behavior.

## Refined Execution Queue

1. Refactor `useBookmarkKeyboardNav` locally.
2. Re-score and verify the target callback is below 20.
3. Run `pnpm typecheck` and `pnpm build`.
4. Then reassess `useFolderKeyboardNav`; do not automatically refactor it in the same execution step.

## Risk

Low-to-medium. The target hook is compact and isolated, but keyboard behavior is user-facing and subtle. The refactor should avoid changing key order, preventDefault timing, or clamp behavior.

## Execution Gate

No code has been changed. Final report should recommend only the local `useBookmarkKeyboardNav` extraction as the first approval candidate.
