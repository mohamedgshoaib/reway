# React Performance Analysis Pass 1

## Phase

`analyzing`

## Scope Read

This pass reviewed dashboard client render flow, large collection rendering, sidebar/menu render costs, command-bar interaction paths, and extension popup startup behavior.

Primary files inspected:

- `components/dashboard/DashboardContent.tsx`
- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/content/useDashboardState.ts`
- `components/dashboard/content/useDashboardDerived.ts`
- `components/dashboard/BookmarkBoard.tsx`
- `components/dashboard/FolderBoard.tsx`
- `components/dashboard/content/DashboardSidebar.tsx`
- `components/dashboard/content/DashboardNotesTodosSidebar.tsx`
- `components/dashboard/content/sidebar/GroupRowItem.tsx`
- `components/dashboard/folder-board/useBookmarkBuckets.ts`
- `components/dashboard/SortableBookmark.tsx`
- `components/dashboard/SortableBookmarkCard.tsx`
- `components/dashboard/SortableBookmarkIcon.tsx`
- `components/dashboard/CommandBar.tsx`
- `components/dashboard/command-bar/useCommandHandlers.ts`
- `extension/popup.js`
- `extension/js/ui.js`
- `spec/reports/dashboard-scalability-performance.md`

## Confirmed Baseline

- `nextjs-performance` execution is closed. Existing route/loading/provider/code-splitting patches should not be reopened by this pass unless a concrete overlap appears.
- `BookmarkBoard`, `FolderBoard`, `SortableBookmark`, `SortableBookmarkCard`, and `SortableBookmarkIcon` are already wrapped in `memo`.
- `@tanstack/react-virtual` / `react-window` are not installed. The current code intentionally renders full bookmark collections after prior virtualization removal.
- The existing scalability decision record still defines the target shape as 50-100 groups and 500-1000 bookmarks per heavier user.
- Extension popup startup already paints first, uses cached groups when present, and hydrates groups/page metadata asynchronously.

## Candidate Findings

### 1. Dashboard state changes fan out through broad non-memoized shells

Evidence:

- `useDashboardState` owns bookmarks, groups, notes, todos, view preferences, keyboard state, selection state, search query, command mode, palette, and folder tint in one hook (`components/dashboard/content/useDashboardState.ts:36-131`).
- `DashboardContent` rebuilds `navigationAdapter`, `libraryAdapter`, `selectionAdapter`, and `notesTodosAdapter` as fresh objects every render (`components/dashboard/DashboardContent.tsx:315-397`).
- `DashboardLayout`, `DashboardSidebar`, `DashboardNotesTodosSidebar`, `DashboardNav`, and `CommandBar` are plain function components, not memoized boundary components.
- The command search query uses `useDeferredValue`, but the immediate `searchQuery` state still causes `DashboardContent` and all non-memoized shells to render on every search keystroke before the deferred list filtering settles.

Likely impact:

- Search typing, selection changes, hover/pin state updates that bubble through adapters, preference changes, note/todo edits, and realtime bookmark updates can cause more of the dashboard tree to render than needed.
- Existing memoized boards help only once their props remain stable and their parent shell is allowed to skip render.

Re-analysis needs:

- Confirm which updates are most frequent in normal use: search typing, selection, enrichment realtime, or sidebars.
- Decide whether the first execution cut should memoize adapters and shell components, or split search/command state more locally.

### 2. Large lists are fully mounted in all board modes

Evidence:

- `BookmarkBoard` renders all `renderedDisplayBookmarks` inside one `SortableContext` (`components/dashboard/BookmarkBoard.tsx:361-366`).
- `FolderBoard` maps all folder columns, all folder sections, and all bookmarks in each open folder (`components/dashboard/FolderBoard.tsx:375-380`, `components/dashboard/FolderBoard.tsx:285-292`).
- Every visible bookmark row/card/icon owns `useSortable`, context menu wiring, alert dialog state, favicon state, and action handlers.
- The current scalability record explicitly says virtualization was removed and the future guidance still applies if it returns (`spec/reports/dashboard-scalability-performance.md:370-372`).

Likely impact:

- This is the main CPU/DOM ceiling for 500-1000 bookmark accounts, especially folder mode where multiple groups remain open by default.
- Drag interactions also inherit the full mounted sortable surface.

Re-analysis needs:

- Do not execute virtualization from only this pass. If execution reaches this finding, load `dnd-kit-react` and `tanstack-virtual` first as required by the scalability record.
- Decide whether the first practical execution candidate is list-view virtualization only, or a smaller interim reduction such as closed-folder lazy rendering / item id memoization.

### 3. Derived bookmark transforms repeat across layers

Evidence:

- `useDashboardDerived` filters all bookmarks for active group/search and recomputes group counts over all bookmarks whenever `bookmarks` changes (`components/dashboard/content/useDashboardDerived.ts:26-57`).
- `BookmarkBoard` builds `renderedDisplayBookmarks` for every rendered bookmark and calls `getDomain(b.url)` twice per bookmark (`components/dashboard/BookmarkBoard.tsx:159-174`).
- `BookmarkBoard` also maps ids for `SortableContext` separately (`components/dashboard/BookmarkBoard.tsx:361-362`).
- `FolderBoard` buckets all bookmarks and sorts every bucket whenever `bookmarks`, `visibleGroups`, or `activeGroupId` changes (`components/dashboard/folder-board/useBookmarkBuckets.ts:20-41`).

Likely impact:

- Search, realtime enrichment, import progress, refresh, selection-affecting updates, and reorder can trigger repeated O(n) work before rendering starts.
- Some work is unavoidable, but the current shape duplicates display normalization and id-list creation in the render path.

Re-analysis needs:

- Separate cheap O(n) work from expensive repeated work. `getDomain` parsing and per-folder sorting are stronger candidates than simple counts.
- Check whether persisted `domain` is reliable enough to use for display instead of reparsing URLs in board render paths.

### 4. Remaining icon resolver cost is still on always-visible group paths

Evidence:

- The Next.js phase deferred create/edit group cards and drag overlay, but the always-visible sidebar still imports `ALL_ICONS_MAP` (`components/dashboard/content/DashboardSidebar.tsx:12`).
- `GroupRowItem` resolves `ALL_ICONS_MAP[group.icon]` for each visible group row (`components/dashboard/content/sidebar/GroupRowItem.tsx:24`, `components/dashboard/content/sidebar/GroupRowItem.tsx:54`).
- `FolderHeader` also imports and resolves `ALL_ICONS_MAP` for each folder header (`components/dashboard/folder-board/FolderHeader.tsx:7`, `components/dashboard/folder-board/FolderHeader.tsx:25`).

Likely impact:

- This is partly bundle cost and partly render cost. The bundle slice was reduced in idle paths, but group rows/folder headers still keep the dynamic icon catalog in the active dashboard path.

Re-analysis needs:

- Determine whether icon lookup itself is meaningful at runtime, or whether the real issue is module weight.
- A possible execution path is a smaller shared `GroupIcon` resolver with memoized row/header components, but avoid breaking user-selected icons.

### 5. Extension popup render path looks acceptable for current target

Evidence:

- Popup initializes the shell immediately and starts environment/groups/page metadata work asynchronously (`extension/popup.js:761-769`).
- Groups are loaded from cache first when available, then refreshed in the background (`extension/popup.js:625-661`).
- Group options are rendered into three custom selects by replacing menu children (`extension/popup.js:281-426`, `extension/popup.js:449-451`).

Likely impact:

- For the expected 50-100 group range, rebuilding three select menus is not likely to be the first React/perceived-performance bottleneck.
- The stronger extension risks belong to API/Supabase reliability passes unless large group lists or popup startup measurements contradict this.

Re-analysis needs:

- Keep extension in scope, but do not spend React execution budget here unless later evidence shows popup startup jank.

## Non-Findings / Already Covered

- Dashboard closed sheets/settings were already deferred in the Next.js phase.
- Landing below-fold client sections were already deferred in the Next.js phase.
- Root provider scope was already reduced in the Next.js phase.
- Route-level loading states were already added/refined in the Next.js phase.

## Next Phase

`reporting`
