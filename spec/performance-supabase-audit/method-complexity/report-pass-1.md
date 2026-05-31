# Method Complexity Report Pass 1

## Phase

`reporting`

## Summary

The strongest method-complexity findings are real, but not all high scores should be refactored in this skill. Large JSX-heavy components and auth/Supabase-sensitive routes should stay out of the first execution lane. The cleanest behavior-preserving path is to start with dashboard keyboard-navigation handlers, then move into batch-flow helpers only after the keyboard shape is validated.

## Findings

| Priority | Finding | Evidence | Recommendation |
| --- | --- | --- | --- |
| P1 | `useBookmarkKeyboardNav` has dense keyboard dispatch in one callback | `components/dashboard/bookmark-board/useBookmarkKeyboardNav.ts` uses one `handleKeyDown` chain for arrows, preview, open/copy, and escape reset. | First execution candidate. Extract key classification, index movement, and bookmark activation helpers. Target complexity: below 20 for `handleKeyDown`. |
| P1 | `useFolderKeyboardNav` mixes folder, bookmark, grid-neighbor, and action behavior | `components/dashboard/folder-board/useFolderKeyboardNav.ts` has the highest scan score and a long `handleKeyDown` callback. | Second keyboard candidate, but re-analyze after the smaller bookmark hook to avoid changing keyboard semantics. |
| P2 | Import confirmation combines too many async responsibilities | `components/dashboard/content/useImportHandlers.ts` `handleConfirmImport` creates groups, computes ranks, creates bookmarks, tracks progress, queues enrichment, and reports completion. | Worth refactoring later, but higher risk due to batch cancellation and optimistic state behavior. |
| P2 | Extension worker message listener is a dispatch and workflow bundle | `extension/background.js` contains storage command handling, Twitter bookmark capture, and open-group behavior in one runtime message listener. | Good extension cleanup candidate if re-analysis confirms MV3 `sendResponse` semantics remain explicit. |
| P2 | Command-bar URL processing repeats add/enrich logic | `components/dashboard/command-bar/useCommandHandlers.ts` duplicates single URL and multi URL creation/enrichment behavior. | Small later candidate; may overlap with dashboard capture behavior, so keep behind keyboard hooks. |
| P3 | Extension link/session save flows duplicate batch-save handling | `extension/js/sessions.js` and `extension/js/grabber.js` share validation, group creation, duplicate filtering, and error mapping patterns. | Useful cleanup, but wait until extension-specific concerns are active or the method-complexity pass reaches batch flows. |
| P3 | Bookmark HTML parser is nested but isolated | `components/dashboard/content/import/parse-bookmarks-html.ts` has recursive traversal nested around folder/link cases. | Low risk, low urgency. Consider only if import handling becomes the selected execution track. |

## Out of Scope for First Execution

- Large component decomposition in `BookmarkBoard`, `DashboardSidebar`, `SortableBookmark`, `SortableBookmarkCard`, `ImportSheet`, and `LoginForm`.
- Auth confirmation route refactor in `app/auth/confirm/route.ts`; this should wait for Supabase/auth review because behavior preservation matters more than local readability.
- Any architecture-level rewrite. If a finding needs new ownership boundaries, escalate to `improve-codebase-architecture` instead of forcing it through this skill.

## Recommended Execution Queue

1. `useBookmarkKeyboardNav` helper extraction.
2. Re-analyze shared keyboard behavior and decide whether to extract parallel helpers in `useFolderKeyboardNav`.
3. If still valuable, refactor `processUrls` in command handlers.
4. Defer import and extension batch-flow extraction until after re-analysis because they touch async cancellation, duplicate handling, and popup UX copy.

## Approval State

No execution is approved yet. Next phase is `re-analyzing`, focused on verifying the `useBookmarkKeyboardNav` extraction plan and checking whether a shared helper can safely apply to both keyboard hooks.
