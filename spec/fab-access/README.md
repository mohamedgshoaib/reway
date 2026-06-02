# Floating Access Button Spec

This directory is the memory-loss guardian for the Reway Floating Access Button (FAB).
Use it before editing production code for the access layer.

## Navigation

Read in this order:

1. `spec/index.md` for Reway product DNA.
2. Latest `spec/sessions/*.md` for active blockers.
3. This file for FAB decisions, task chunks, and progress.
4. Prototype reference: `spec/prototypes/fab-access-demo/`.
5. Extension seams:
   - `extension/manifest.json`
   - `extension/background.js`
   - `extension/js/api.js`
   - `extension/js/save-bookmarks.js`
   - `extension/popup.js`
   - `extension/popup.css`
6. Extension API seams:
   - `app/api/extension/groups/route.ts`
   - `app/api/extension/bookmarks/route.ts`
   - `app/api/bookmarks/visits/route.ts`
   - `lib/library/server/reads.ts`
   - `lib/bookmark-visits.ts`

Do not treat the prototype as production code. It is an interaction and visual reference only.

## Product Intent

The FAB is a read/access layer for opening saved Reway links from normal webpages.
It is not a save surface and must not mix in settings, capture, or dashboard-management roles.

Core behavior:

- Inject a small draggable Reway icon button into allowed webpages.
- Open a quick-access menu on hover.
- Show account-backed visible groups and `No Group`.
- Hover/focus a group to show its bookmarks.
- Search bookmarks directly from the menu.
- Open bookmarks in new foreground tabs.
- Open whole groups in background tabs only after explicit confirmation.

## Skill Triggers

Use these skills when work enters the matching area:

- `grill-me`: any new FAB product behavior, shortcut behavior, settings behavior, or UX ambiguity.
- `browser-extension-builder`: extension architecture, MV3 surface choices, permissions, manifest.
- `chrome-extension-development`: content scripts, background worker, Chrome APIs, storage, messaging.
- `chrome-extension-ui`: extension popup settings, content-script UI, accessibility.
- `make-interfaces-feel-better` + `emil-design-eng`: FAB visual polish, motion, hover states, surface design.
- `next-best-practices`: extension API route changes or App Router/server code.
- `supabase` / Supabase-specific skills: schema migration, auth-scoped database reads/writes, RLS concerns.
- `zod`: request/query validation if adding new route parsing.

## Locked Decisions

### Availability

- FAB controlled by popup settings with a simple `Quick access button` on/off toggle.
- Default `rewayAccessFabEnabled`: `true`.
- FAB does not appear on Reway dashboard origins.
- FAB can run on all normal URLs, including localhost.
- Users can hide specific hosts from popup settings.
- Hidden hosts are normalized to hostname only.
- Top frame only. Do not inject into iframes.
- Desktop only: require fine pointer/hover and a practical viewport size.
- Unauthenticated users still see the FAB if enabled; menu guides them to login.
- FAB shell appears immediately when allowed; data hydrates on menu use.
- Menu open/query/submenu state does not persist across navigations.
- No realtime subscriptions in FAB.

### Roles And Surfaces

- FAB has no settings role.
- Popup settings own:
  - global on/off
  - hidden host management
  - group visibility management as secondary surface
- Dashboard owns group-management context:
  - `Show in quick access`
  - `Hide from quick access`
- Dashboard may introduce quick access even when extension is not detected, with clear extension/install context.

### Persistence

Account-backed:

- `groups.show_in_fab`, default `true`.

Local extension settings:

- `rewayAccessFabEnabled`
- `rewayAccessFabPosition`
- `rewayAccessFabHiddenHosts`
- `rewayAccessFabIntroSeen`
- `rewayAccessBookmarksByGroup`

Group visibility belongs to the Reway account. Position, hidden hosts, intro state, cache, and global enabled state belong to the current browser/device.

### Data And Cache

- Reuse `extension/js/api.js` transport:
  - `getSettings()`
  - `apiFetch()`
- Do not store raw auth tokens in Chrome storage.
- Do not reuse dashboard cache; dashboard data is not shared with extension contexts.
- Keep existing group cache:
  - `rewayGroups`
  - `rewayGroupsFetchedAt`
- Add bookmark cache:

```js
rewayAccessBookmarksByGroup: {
  [groupId]: {
    bookmarks: [],
    fetchedAt: number,
    lastAccessedAt: number
  }
}
```

- Groups TTL: 5 minutes.
- Bookmarks TTL: 5 minutes.
- Lazy fetch bookmarks per hovered/focused group.
- Cached bookmarks render immediately.
- Stale cached bookmarks refresh quietly.
- Cold group bookmark loads show a submenu skeleton.
- Protect rapid-hover races with request IDs or active-group checks.
- Cache survives MV3 worker shutdown via `chrome.storage.local`.
- No `unlimitedStorage` permission for initial implementation.
- Evict oldest bookmark group cache entries on quota pressure.

### Groups And Bookmarks

- Include regular user groups where `show_in_fab !== false`.
- Include `No Group`.
- Exclude `All Bookmarks`.
- Ignore `hide_from_all_bookmarks`; it is dashboard-specific.
- Group rows do not show bookmark counts.
- Bookmark rows show favicon, title, and domain only.
- Bookmark favicon rendering tries stored favicon data first, then Google S2 for public domains, then a deterministic letter tile fallback.
- No full URL in rows.
- Group bookmark submenus show all bookmarks for that group, no pagination/cap.
- `No Group` needs explicit API support: `groupId=none` maps to `group_id IS NULL`.
- FAB must never use missing `groupId` as a bookmark-list call, because that means all bookmarks.

### Search

- FAB includes bookmark search.
- Search returns bookmarks only, not groups.
- Search input is anchor-aware:
  - if menu opens upward from bottom FAB, search sits at bottom
  - if menu opens downward from top FAB, search sits at top
- Empty query shows groups.
- Non-empty query replaces groups with bookmark results.
- Query starts at 2+ characters.
- Debounce: 250-300ms.
- Search should be server-side and user-scoped.
- Prefer a dedicated route, for example `GET /api/extension/bookmarks/search?q=...&limit=20`.
- Search results are capped, likely 10-20.
- Search results show favicon, title, and domain.
- Search should not reuse the no-`groupId` all-bookmarks list endpoint.
- Escape clears query first, then closes/backs out.

### Interaction

- FAB opens on hover only for pointer users.
- Hover open delay: about 150ms.
- Hover close delay: about 150-250ms after pointer leaves FAB + menu region.
- Click on FAB does not toggle menu.
- FAB is freely draggable anywhere in viewport.
- Position persists globally across sites.
- Position clamps to viewport on load and resize.
- Dragging closes menu and suppresses hover until pointer release.
- No snapping to edges.
- Direction-aware positioning uses `getBoundingClientRect`.
- Menu/submenu flip based on available viewport room.
- Group-hover submenus use a small upward anchor bias so the first bookmarks are closer to the pointer path.
- Submenu positioning uses a fixed intended submenu width and constant menu gap; it must not depend on the currently transformed submenu rect.
- A safe pointer corridor prevents accidental group switching while moving diagonally from a group row into its submenu.
- Hidden scrollbars are allowed in FAB lists only when paired with truthful top/bottom scroll cues and scroll-mask fade.

### Keyboard

- Add Chrome command `open-quick-access`.
- Default shortcut:
  - `Ctrl+Shift+Y`
- If command cannot open quick access on current page, do nothing.
- Shortcut opens menu in Raycast-style mode:
  - search input has caret ready
  - first group/result row is active
  - typing searches bookmarks
  - ArrowUp/ArrowDown moves active row
  - Enter activates active row
  - ArrowRight opens group bookmarks
  - ArrowLeft returns from bookmarks to groups
  - Escape clears query, returns to groups, or closes progressively
- Use active descendant style where practical: focus can remain on search while row active state is managed.
- Hover open remains browse-first and should not force focus into search.

### Opening Links

- Bookmark click opens a new foreground tab.
- Use background worker, not `window.open`.
- Validate `http:` and `https:` URLs only.
- Bookmark opens update visit tracking best-effort and non-blocking.
- Existing visit route exists at `/api/bookmarks/visits`; reuse it if extension credential/CORS behavior works cleanly.
- Add an extension-specific visit route only if the existing route cannot be safely reused from background transport.
- Visit tracking failure is silent.
- Group open:
  - explicit icon button only
  - always confirm, regardless of tab count
  - confirmation copy like `Open 5 tabs?`
  - opens valid URLs in background tabs
  - current tab remains active

### Visual Design

- Fixed Reway extension theme for now.
- No dashboard palette sync in this feature.
- Production FAB uses Shadow DOM.
- Closed FAB is icon-only, using the Reway logo as the button itself.
- Accessible label: `Open Reway quick access`.
- No badge/count on closed FAB.
- Closed FAB is slightly transparent/dimmer while idle and becomes fully visible on hover/open; no halo/ring/open glow is used.
- No group counts in menu.
- Group rows render the assigned dashboard Hugeicon as native inline SVG with no chip/background wrapper.
- Menu and submenu headers are intentionally omitted; the FAB and active row already provide context.
- FAB lists hide native scrollbars and use minimal top/bottom scroll indicators only when more content exists in that direction.
- Row hover/active state uses color/background/inset ring only; no scale or horizontal movement on dense list items.
- Main menu target height assumes about 10 groups for the average user.
- One-time intro tooltip:
  - `Reway quick access`
  - `Hover to open saved links`
  - must not auto-open on page load
  - mark seen after interaction
  - no repeated pulse

## Implementation Chunks

Work in chunks. After each chunk, update the progress tracker below.

### Chunk 1 - Data Model And API

Goal: backend can express FAB group visibility, no-group bookmark reads, search, and visit logging.

Tasks:

- [x] Add `show_in_fab boolean default true` to groups schema/migration.
- [x] Update generated Supabase types if schema changes.
- [x] Include `show_in_fab` in dashboard and extension group selects.
- [x] Add dashboard mutation/action for toggling group quick-access visibility.
- [x] Add explicit extension bookmark handling for `groupId=none`.
- [x] Add favicon/domain fields to extension bookmark list payload if missing.
- [x] Add user-scoped extension bookmark search endpoint.
- [x] Reuse `/api/bookmarks/visits` for best-effort visit tracking, or add extension-safe visit tracking only if needed.
- [x] Verify auth scoping on every route/mutation.

Suggested verification:

- [x] `pnpm typecheck`
- [x] targeted lint for changed files
- [ ] route parsing/auth unhappy-path checks

### Chunk 2 - Background Access Layer

Goal: background worker owns API reads, cache, tab opening, visit logging, and command routing.

Tasks:

- [x] Add access cache helper under `extension/js/`.
- [x] Keep existing group cache keys.
- [x] Add `rewayAccessBookmarksByGroup` cache handling.
- [x] Add cache TTL and stale-while-revalidate flow.
- [x] Add quota-pressure eviction.
- [x] Add message handlers for groups, group bookmarks, search, open bookmark, open group, login URL, dashboard URL.
- [x] Add `chrome.commands.onCommand` handler for `open-quick-access`.
- [x] Reuse `apiFetch()` and `getSettings()`.
- [x] Clear group/bookmark access caches on 401.

Suggested verification:

- [x] syntax check changed extension JS
- [ ] manual message-handler smoke checks where practical

### Chunk 3 - Content Script UI

Goal: Shadow DOM FAB renders and behaves correctly on allowed desktop pages.

Tasks:

- [x] Add `extension/access-content-script.js`.
- [x] Add `extension/access-content.css`.
- [x] Register content script broadly in manifest, top frame only.
- [x] Keep dashboard bridge `extension/content-script.js` separate and unchanged unless intentionally required.
- [x] Guard Reway origins, hidden hosts, disabled setting, non-desktop contexts.
- [x] Inject immediate FAB shell.
- [x] Implement Shadow DOM styling and DOM isolation.
- [x] Implement hover open/close intent.
- [x] Implement free drag + persisted global position.
- [x] Implement direction-aware menu and submenu.
- [x] Implement groups, no-group, bookmark submenu, search, auth/error/loading states.
- [x] Implement intro tooltip.
- [x] Implement keyboard command-open mode.
- [x] Implement active row navigation and search behavior.
- [x] Implement bookmark and group-open messages to background.

Suggested verification:

- [x] local extension load in Chrome
- [x] test normal website, localhost, Reway dashboard exclusion
- [x] test drag, resize clamp, search, auth, group hover, no group
- [x] test keyboard shortcut and arrows

### Chunk 4 - Popup Settings

Goal: extension settings expose local FAB controls and hidden host management.

Tasks:

- [x] Add `Quick access button` toggle.
- [x] Add hidden host input with plus icon.
- [x] Add hidden host list with edit/delete icon buttons.
- [x] Add save/cancel behavior.
- [x] Add group visibility management surface if still required in extension settings after dashboard implementation. Not added; dashboard owns account-backed group visibility per locked decision.
- [x] Normalize user-entered URLs/hosts to hostname.
- [x] Message open tabs or rely on next page load for setting changes; choose intentionally. Chosen behavior: saved settings apply on page refresh or next navigation.

Suggested verification:

- [ ] settings persistence in `chrome.storage.local`
- [ ] hidden host blocks FAB after refresh
- [ ] global toggle blocks FAB after refresh

### Chunk 5 - Dashboard Group Visibility

Goal: dashboard lets users choose groups shown in quick access.

Tasks:

- [x] Add group menu/context action: `Show in quick access` / `Hide from quick access`.
- [x] Add compact introduction behavior for users without extension context.
- [x] Make copy clear that quick access is extension-powered.
- [x] Preserve existing group actions and dashboard semantics.
- [x] Do not mix with `hide_from_all_bookmarks`.

Suggested verification:

- [ ] toggle persists to DB
- [ ] extension groups endpoint reflects toggle
- [ ] FAB hides/shows groups after cache refresh

### Chunk 6 - Polish And Regression

Goal: feature feels native to Reway and does not regress existing save workflows.

Tasks:

- [x] Compare against `spec/prototypes/fab-access-demo/refined-preview.png`.
- [x] Review with `chrome-extension-ui`.
- [x] Review visual/motion details with `make-interfaces-feel-better`.
- [x] Verify popup save flows unchanged.
- [x] Verify dashboard bridge content script unchanged.
- [x] Verify extension permissions are justified.
- [x] Document final behavior in README or extension docs if needed.

Suggested verification:

- [x] `pnpm typecheck`
- [x] targeted `oxlint`
- [x] manual Chrome extension smoke test

## Progress Tracker

Status values: `not-started`, `in-progress`, `blocked`, `done`.

| Chunk | Status | Notes |
| --- | --- | --- |
| 1 - Data Model And API | done | Added `show_in_fab`, extension no-group reads, favicon/domain payload fields, capped search route, and extension-safe visit route CORS. Verified with `pnpm typecheck` and targeted `oxlint`; no live route smoke run. |
| 2 - Background Access Layer | done | Added access cache helper, stale refresh messages, background API/open handlers, visit logging, and `open-quick-access` command routing. Verified syntax, manifest JSON, `pnpm typecheck`, and targeted `oxlint`; no manual extension smoke run. |
| 3 - Content Script UI | done | Added Shadow DOM FAB/content CSS, desktop/page guards, hover/drag/menu/submenu/search/auth states, command-open keyboard mode, bookmark/group-open messaging, generated Hugeicons group rendering, favicon fallback chain, hidden-scrollbar scroll cues, submenu safe corridor, and stable submenu anchoring. Verified JS syntax, manifest JSON, targeted `oxlint`, `pnpm typecheck`, and iterative Chrome-loaded manual validation. |
| 4 - Popup Settings | done | Added local quick-access toggle, hidden-host draft editing, hostname normalization, save/cancel persistence, and refresh-on-next-page-load semantics. Verified JS syntax, targeted `oxlint`, and `pnpm typecheck`; no Chrome popup smoke run. |
| 5 - Dashboard Group Visibility | done | Added extension quick-access visibility actions to dashboard group menus/context menus with optimistic user-scoped mutation and extension-specific copy. Verified `pnpm typecheck` and targeted `oxlint`; no live DB/FAB cache smoke run. |
| 6 - Polish And Regression | done | Compared against refined prototype, reviewed extension UI/motion/permissions, preserved popup save and dashboard bridge separation, tightened keyboard command mode, active-row behavior, Reway logo FAB treatment, header removal, radius/sizing, search/menu height animation, submenu anchoring, and scroll affordances. Verified `pnpm typecheck`, targeted `oxlint`, targeted `oxfmt --check`, extension JS syntax, manifest JSON, `pnpm build`, and iterative Chrome-loaded manual validation. |

## Resume Protocol

When resuming after memory loss:

1. Read `spec/index.md`.
2. Read latest `spec/sessions/*.md`.
3. Read this README only up to the current chunk and the locked decisions relevant to that chunk.
4. Read only the code files listed in the chunk.
5. Update `Progress Tracker` after each significant step.
6. If a decision is not explicitly locked here, use `grill-me` before implementing it.

## Known Non-Goals

- No saving from the FAB.
- No settings inside the FAB.
- No dashboard palette sync for now.
- No realtime subscriptions.
- No `All Bookmarks` group in FAB.
- No arbitrary pagination/cap for real group bookmarks.
- No mobile/touch-first FAB.
- No iframe injection.
- No production code should be copied directly from the prototype.

## Open Questions

None currently blocking. Use `grill-me` for any new behavior or ambiguity before implementation.

## Pre-Implementation Review Notes

- Existing visit tracking route: `app/api/bookmarks/visits/route.ts`.
- Existing visit client helper: `lib/bookmark-visits.ts`.
- Existing extension groups cache is already used by popup startup. Avoid migrating those keys during FAB work unless explicitly re-approved.
- `hide_from_all_bookmarks` is dashboard-only and must not affect FAB visibility.
- Missing `groupId` on `/api/extension/bookmarks` currently means all bookmarks. FAB must not use that path except search route with explicit capped results.
- Keep production implementation and prototype separate. The prototype appends a submenu to `document.body`; production must keep all FAB UI inside Shadow DOM.
