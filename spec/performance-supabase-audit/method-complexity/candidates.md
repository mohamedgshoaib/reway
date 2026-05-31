# Method Complexity Candidates

## Phase

`analyzing`

## Method

Scanned `app/`, `components/`, `lib/`, and `extension/` with a TypeScript parser-based estimate that counts branching, nesting, switch/case, loops, catch blocks, conditionals, and boolean operators. Scores are directional, not a SonarQube cognitive-complexity source of truth.

## Ranked Candidates

| Rank | Candidate | Approx. Score | Lines | Initial Read |
| --- | --- | ---: | ---: | --- |
| 1 | `useFolderKeyboardNav` in `components/dashboard/folder-board/useFolderKeyboardNav.ts` | 104 | 311 | Strongest method-level candidate. The `handleKeyDown` callback mixes context resolution, folder neighbor selection, bookmark movement, preview/open/copy behavior, and escape reset handling. |
| 2 | `useBookmarkKeyboardNav` in `components/dashboard/bookmark-board/useBookmarkKeyboardNav.ts` | 103 | 108 | Smaller but dense. The keyboard dispatch is an `if/else` chain with repeated index movement rules and action handling. Good low-risk extraction candidate. |
| 3 | `handleConfirmImport` inside `components/dashboard/content/useImportHandlers.ts` | 65 nested callback score / 302 lines | 302 | Import confirmation combines selection filtering, group creation, rank assignment, bookmark creation, progress accounting, enrichment queueing, and completion state. Worth refactoring, but riskier because it owns async batch behavior. |
| 4 | `chrome.runtime.onMessage` listener in `extension/background.js` | 84 | 262 | Extension worker message dispatch handles storage commands, current-tab capture, X/Twitter bookmark capture, and open-group tab creation in one listener. Good target after preserving MV3 response semantics. |
| 5 | `processUrls` inside `components/dashboard/command-bar/useCommandHandlers.ts` | 35 nested callback score / 139 lines | 139 | Duplicate single-url and multi-url creation/enrichment logic. Likely small, behavior-preserving helper extraction candidate. |
| 6 | `saveTabSession` in `extension/js/sessions.js` and `createGroupFromLinks` in `extension/js/grabber.js` | 38 / 34 | 130 / 96 | Similar extension batch-save flows duplicate validation, create-group, duplicate detection, and error-message mapping. Needs care because popup UX copy differs by flow. |
| 7 | `parseBookmarksHtml` / `traverse` in `components/dashboard/content/import/parse-bookmarks-html.ts` | 44 / 43 | 65 / 49 | Recursive traversal is compact but nested. Can become clearer with helpers for folder/link detection, but it is isolated and already testable. |
| 8 | `app/auth/confirm/route.ts` `GET` | 31 | 120 | Auth confirmation route has repeated seed/log/redirect branches for code and OTP flows. Supabase/auth-sensitive, so this should wait unless a later Supabase pass also flags it. |

## Lower-Priority Large Components

These scored high mostly because they are broad render surfaces with many JSX branches, not because one method has a clean helper-extraction target:

- `components/dashboard/BookmarkBoard.tsx`
- `components/dashboard/content/DashboardSidebar.tsx`
- `components/dashboard/SortableBookmark.tsx`
- `components/dashboard/SortableBookmarkCard.tsx`
- `components/dashboard/nav/ImportSheet.tsx`
- `app/login/LoginForm.tsx`
- landing demo components such as `DemoVideo`, `GroupsDemo`, `ViewModesDemo`, and `ExtractDemo`

They may still deserve component decomposition later, but that is closer to architecture/composition work than the current method-complexity skill.

## Initial Recommendation

Start reporting around two tracks:

1. Keyboard navigation extraction: `useBookmarkKeyboardNav` first, then `useFolderKeyboardNav`.
2. Batch-flow extraction: `processUrls`, then extension session/link batch save helpers.

The first execution candidate should probably be `useBookmarkKeyboardNav` because it is dense, behaviorally important, and small enough to validate with typecheck/build plus focused manual reasoning. `useFolderKeyboardNav` is the bigger payoff but should be approached after the smaller keyboard hook establishes a clean extraction shape.

## Execution Gate

No method refactor has been executed. Any execution step still needs an explicit target method and target threshold approval.
