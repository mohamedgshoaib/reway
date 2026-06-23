# Reway Extension Redesign — Design Brief

**Status:** Grill-me complete. Implementation ready.
**Scope:** Chrome extension — FAB (floating action button) and popup.
**Mocks:** `spec/extension-rebuild/mock-1.html`, `spec/extension-rebuild/mock-2.html`, `spec/extension-rebuild/mock-3.html`

---

## 1. Problem statement

The current extension was built incrementally without a clear design goal. It achieves functional coverage but not a coherent UX. Specific problems identified through direct audit:

### Popup
- Three equal-weight tabs (Save Page / Save Links / Tab Session) force mode selection before the user has context. No visual hierarchy between the primary action and secondary ones.
- Group destination UI (existing group toggle → picker, or new group → name input) is duplicated identically across all three tabs.
- Save Page tab stacks four form surfaces before the CTA: page meta strip, title input, description textarea, group picker. Description is rarely filled at save time but occupies permanent space.
- Settings replace the entire popup content on open — user loses capture context.
- No meaningful success feedback after saving. A `.status` element turns green. No animation, no spatial feedback.
- Header copy ("Pick the way you want to save") is static and low-value.
- Two disconnected token namespaces: `popup.css` uses `--background`, `--card`, `--primary`; `access-content.css` uses `--reway-bg`, `--reway-surface`, `--reway-text`. Same visual aesthetic, unrelated variable names.

### FAB
- Icon is the Reway app logo — no interactive affordance. Does not signal "this opens a menu."
- Hover-to-open (150ms delay) as primary trigger causes accidental opens, fails on touch, and violates WCAG 1.4.13 (Content on Hover or Focus).
- 252px panel width is cramped for long bookmark titles.
- Two-panel architecture (groups list + adjacent submenu) requires precise diagonal pointer movement to traverse without dismiss ("diagonal problem"). Fragile spatially and impossible to replicate with keyboard navigation.
- FAB is read-only. No way to save the current page from it.
- "Open group in tabs" expand-to-confirm animation (button grows to reveal label) is unusual enough to confuse users.
- No visual relationship to the popup — same product, two independently authored design systems.

---

## 2. Research sources

### Round 1 — UX psychology and current design problems
Perplexity Deep Research analyzed: mode hierarchy, form field density, group destination UX, FAB floating UI patterns, read-only vs read-write FABs, psychology of saving and retrieval, and popup vs in-page UI tradeoffs.

### Round 2 — Architecture, design inspiration, and chrome.contextMenus
Perplexity Deep Research analyzed: FAB as primary surface, combining save + access in one widget, multi-mode capture in a floating panel, when the popup should still exist, exemplary extension UIs, floating widget design patterns, compact panel interaction design, calm visual identity, and full chrome.contextMenus API capabilities.

---

## 3. Key research findings

### Mode hierarchy
Cognitive load theory (Hick's Law, ~4-chunk working memory limit) establishes that presenting three equal modes on first open is wrong. Progressive disclosure is the correct pattern: one dominant action, secondary modes one intentional step away. Raindrop.io, Notion Web Clipper, Pocket, and Instapaper all default to a single save action.

### Form field density
Every additional form field reduces completion rate (Formstack/HubSpot data: ~3–5% per field). Optional fields that are almost always skipped should be hidden behind an expand affordance. The "just save it" default aligns with System 1 (fast, automatic) thinking. "Save it right" metadata enrichment belongs after the save, not before.

### Group destination UX
Requiring explicit group selection every save is the highest-friction step. Solutions: default to last-used group (exploits recency and habit), offer an Inbox/Unsorted fallback, provide a searchable type-ahead picker, support inline group creation. One shared picker component across all flows.

### FAB trigger
Click-to-open is correct. Hover-to-open violates WCAG 1.4.13 (must be dismissible, hoverable without disappearing, persistent until closed) and causes accidental activations. WCAG requires: content triggered by hover must remain visible when the pointer moves into it.

### FAB as read-write
Contextual capture research: saving in situ where content was found improves later retrieval (stronger memory encoding). A read-write FAB reduces the number of surfaces users must remember. "Reway = this bubble" is a simpler mental model than "popup to save, FAB to browse." Implementation: one-click save to last-used group at top of panel, group changeable inline, full metadata via popup or side panel.

### Bookmark graveyard phenomenon
~90% of bookmarks are never revisited. Causes: loss of context at save time, over-organization burden, poor retrieval UX. Solutions: save with group context (not Unsorted), provide resurfacing mechanisms, close the capture-to-retrieval loop with immediate success feedback, link to the saved item from the success state.

### chrome.contextMenus
API supports: page, link, selection, image, action (extension icon) contexts. Items can nest arbitrarily but UX guidance caps practical usability at 2 levels. `ACTION_MENU_TOP_LEVEL_LIMIT = 6` for extension icon context. Dynamic menus via `onShown` are fast if built from `chrome.storage.local` cache. Items must always mirror functions available in the primary UI — never the sole path to a feature.

### Design reference
Linear's design system is the closest analogue to the target aesthetic: near-black base surface, 8px spacing grid, hairline 1px borders (no box shadows on panels), near-monochrome palette with one chromatic accent, Inter/system-ui typography at two weights, small consistent radii. Things 3 and Bear contribute: generous whitespace, subtle micro-interactions, no visual clutter. Speechify's bubble is the motion reference: progressive expansion from small to large, sub-200ms container-transform animation.

---

## 4. Architectural decisions

### FAB is primary
The FAB is the main interaction surface. It handles both capture (save current page) and access (browse groups and bookmarks). Supported by Grammarly, Toucan, FloatNote, and CodeShelf as precedents where in-page UI is the primary surface when the extension's value is tied to the current page.

### Four surfaces, clear roles, no overlap

| Surface | Role | Opened by |
|---|---|---|
| **FAB panel** | Primary — contextual save + access on every page | Click FAB |
| **Side Panel** | Secondary — full library, session management, bulk save, settings | Toolbar icon, "Manage library" in FAB, context menu |
| **Popup** | Fallback only — bare save + Side Panel link + clarification text for restricted pages | Toolbar icon on restricted pages (chrome://, Web Store, new tab) |
| **Context menus** | Silent capture — fire-and-forget saves, power user layer | Right-click on page, link, selection, extension icon |

### Click-to-open only
Hover is a visual affordance state, never a trigger. Hard rule driven by WCAG 1.4.13 compliance and accidental activation prevention.

### Drill-in navigation replaces two-panel submenu
The diagonal problem is unsolvable in the two-panel model. Drill-in: click a group row → panel content slides left out → group's bookmarks slide in → back chevron returns to groups. Same 300px panel, two depth levels, no spatial fragility, fully keyboard-navigable.

### Show all groups, scroll
The FAB panel shows all groups in a scrollable list — not a truncated preview with a link as the path to see more. The FAB is primary; hiding content behind a secondary surface contradicts that. Scroll is a trained pattern. Max-height constrains vertical growth. A bottom fade mask signals "more below."

### "Manage library" is management, not discovery
The bottom link in the FAB panel opens the Side Panel for: group reordering, renaming, bulk operations, import/export, settings. It is not a path to see groups the FAB hides.

### Tab Session as micro-utility, not a mode
Save Links is dropped — Tab Session covers the same need. Tab Session does not get a chip, tab, or mode switcher. Instead, a subordinate line below the save CTA reads "or save N open tabs as a session →" and only renders when N ≥ 2. Tapping it transforms the save strip into session mode. No UI added to the default view for single-tab users or users who only ever save pages.

### Session strip has explicit back navigation
When in session mode, the strip shows `‹ Save as session` at the top. The `‹` returns to page mode. Same pattern as drill-in navigation — one affordance, consistent meaning across all contexts.

### Session naming is pre-filled, not deferred
Sessions have no intrinsic identity (unlike pages which have a URL and title). Deferring naming to the Side Panel means deferring it to a moment when the user has less context — sessions become unnamed graveyards. The session strip shows a pre-filled, focused name field with text pre-selected (typing replaces it). The auto-name derives from the active tab title + count: "The Pragmatic Programmer + 7 more." One-tap save uses the auto-name; typing replaces it immediately. Zero gates.

### Group picker transforms the panel, not an overlay
When the user taps ▾ on the save CTA to change destination, the save strip stays pinned at the top of the panel and the groups list below transforms into a picker: `›` chevrons become selection indicators, a "Select destination" label replaces the search bar, tapping a group commits and restores normal view. No dropdown overlay, no z-index conflict, no separate scroll context.

### Search is unified across groups and bookmarks
The search bar returns categorized results in-place (no new view):
- Groups section: matching group names, navigable with `›`
- Bookmarks section: matching bookmark titles with their group shown as metadata

In the drill-in view, search scopes to the current group's bookmarks only — contextually obvious.

### Success state closes the capture-to-retrieval loop
After saving: CTA morphs to `[✓ Saved to Design Research →]`. Five seconds, then auto-resets. Undo is available during the window (optimistic — save fires immediately, undo fires a delete). The `→` navigates to the saved bookmark inside the group drill-in view.

If the user reopens the panel on the same tab after saving, the save strip shows the navigation shortcut + a subordinate "Also save to another group" affordance. Multi-group saves are sequential (single-select picker each time), never requiring a separate multi-select UI.

### FAB button visual treatment
The Reway logo is a circle with a bookmark icon — semantically correct (circle = button, bookmark = domain). The problem in the current implementation is the visual treatment, not the icon. The redesign applies:
- Accent fill: `oklch(0.78 0.1 205)` teal background, white icon
- Elevation shadow: the one place in the design system where a drop shadow is correct — the FAB floats above arbitrary page content that we don't control
- Hover: `scale(1.06)`, 140ms easing
- Active press: `scale(0.96)`, instant
- First-visit only: a ring pulse animation expands and fades once on install, never repeats

### FAB drag-to-snap, four corners
Fixed bottom-right is wrong for an injected UI — if the page has content at that position (other FABs, chat widgets, cookie banners), the user has no recourse. The FAB snaps to four corners: top-left, top-right, bottom-left, bottom-right. Default: bottom-right. Drag freely, snap to nearest corner on release. Persisted in `chrome.storage.local` as `fabCorner`.

Panel direction and alignment follow the active corner:

| Corner | Panel opens | Panel edge aligns |
|---|---|---|
| Bottom-right | Upward | Right |
| Bottom-left | Upward | Left |
| Top-right | Downward | Right |
| Top-left | Downward | Left |

Container-transform animation uses the active corner as transform-origin.

### Panel open/close behavior
- Clicking the FAB toggles the panel open/closed
- Clicking outside the panel dismisses it
- `Escape` dismisses and returns focus to the FAB button
- Panel auto-closes on page navigation; re-injects fresh on the new page
- On restricted pages (chrome://, Web Store, new tab), the FAB cannot inject — toolbar icon opens the popup fallback instead

### Group icons replace dots
Groups carry custom icons from the dashboard (HugeIcons library). The FAB panel renders these icons in group rows. The `●` dot placeholder is eliminated. Row structure:

```
[HugeIcon] Group name  [pin]    ›
```

### Pinned groups are user-controlled
Auto-computed "most visited" pinning is harmful — projects end, traffic patterns change, stale groups occupy prime real estate. Pinning is explicit: hovering a group row reveals a pin icon positioned immediately after the group name (not adjacent to the `›` chevron — proximity to the chevron would make the chevron read as informative rather than actionable). Pinned groups show the pin icon permanently. Tapping the pin icon in the hover state pins/unpins. Pinned groups move to the "Pinned" section at the top of the list.

### "Open all in tabs" lives in the group header
The `···` icon on the drill-in group header (`‹ [icon] Group name ···`) opens a small inline menu with group-level actions including "Open all N in tabs." The tab count is shown before the user commits — prevents the 50-tab catastrophe. This keeps the bottom bar single-purpose (`+ Save this page here` only) and correctly scopes group-level actions to the group header.

### Context menus "More…" opens the FAB panel
When the right-click submenu's group list overflows (5–7 most recent groups shown), "More…" opens the FAB panel in group-picker mode — not the Side Panel. Keeps the user in the page context, preserves the "silent capture" contract. Same applies across all right-click contexts (page, link, selection, image).

### Keyboard accessibility
- Keyboard shortcut to open FAB panel: `Alt+Shift+R` (configurable via Chrome's extension shortcuts page)
- FAB button is focusable via `Tab`, opens on `Enter`/`Space`
- Focus trap inside panel while open — `Tab` cycles within panel only
- Focus order: save strip → search bar → groups list → "Manage library →"
- Drill-in focus order: back chevron → `···` → search → bookmark rows → bottom action bar
- `Escape` dismisses panel, returns focus to FAB button

### Context menus as no-UI capture
Right-click → saved to last-used group → brief browser notification. No panel, no overlay. Built from `chrome.storage.local` group cache. Submenu shows 5–7 most recently used groups + "More…" (opens FAB panel in picker mode). Maximum 2 levels of nesting.

### One token system
The popup and FAB panel share one set of CSS custom properties. Current split (`--background`/`--foreground` vs `--reway-bg`/`--reway-text`) is eliminated in the redesign.

---

## 5. Design language decisions

- **Base surface:** `oklch(0.18 0 0)` — near-black, not pure black
- **Panel surface:** `oklch(0.22 0 0)`
- **Raised surface (inputs, strips):** `oklch(0.25 0 0)`
- **Muted surface:** `oklch(0.28 0 0)`
- **Text primary:** `oklch(0.98 0 0)`
- **Text subtle:** `oklch(0.72 0 0)`
- **Text dim:** `oklch(0.52 0 0)`
- **Border:** `rgba(255, 255, 255, 0.05)` — hairline, no box shadows on panels
- **Accent:** `oklch(0.78 0.1 205)` — desaturated teal; used for save CTA, focus rings, FAB button fill, contextual save hover
- **Destructive:** `oklch(0.55 0.22 28)`
- **Font:** Geist → system-ui fallback chain
- **Icons:** HugeIcons library (matches dashboard)
- **Grid:** 8px base (4, 8, 12, 16, 24)
- **Panel border-radius:** 20px; inner items: `panel-radius − panel-padding = 14px`
- **Transition:** `cubic-bezier(0.23, 1, 0.32, 1)`, 140–200ms
- **Motion model:** container-transform (FAB morphs into panel from active corner), horizontal slide for drill-in, fade+scale for panel open/close
- **Success feedback:** CTA morphs to checkmark + "Saved to [Group] →" + "Also save to another group" subordinate line — inline, no overlay toast

---

## 6. FAB panel layout model

### Groups view (default)
```
┌────────────────────────────────┐  300px
│  [favicon] Page title          │  ← page context, dim, subordinate
│  [✦ Save to Design Research ▾] │  ← primary CTA
│  or save 8 open tabs →         │  ← session micro-utility, dim (N≥2 tabs only)
├────────────────────────────────┤
│  [Search groups and links…]    │
├────────────────────────────────┤
│  Pinned                        │
│  [icon] Design Research  📌 ›  │  ← pin always visible on pinned rows
│  [icon] Dev Tools        📌 ›  │
│  Recently saved                │
│  [icon] Work Links           ›  │
│  [icon] Reading List         ›  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │  ← separator, no label
│  [icon] Architecture         ›  │
│  [icon] Frontend             ›  │  ← pin icon revealed on hover, after name
│  … scrolls, fade mask below    │
├────────────────────────────────┤
│       Manage library →         │  ← always visible, below scroll
└────────────────────────────────┘
```

### Session strip (replaces save strip when activated)
```
┌────────────────────────────────┐
│  ‹  Save as session            │  ← back nav returns to page mode
│  ┌──────────────────────────┐  │
│  │ The Pragmatic Prog… +7   │  │  ← pre-filled, text selected, focused
│  └──────────────────────────┘  │
│  [✦ Save to Design Research ▾] │  ← same group picker pattern
└────────────────────────────────┘
```

### Group picker mode (triggered by ▾ on save CTA)
```
┌────────────────────────────────┐
│  [favicon] Page title          │  ← save strip stays pinned
│  [✦ Save to Design Research ▾] │
├────────────────────────────────┤
│  Select destination            │  ← replaces search bar
├────────────────────────────────┤
│  [icon] Design Research  ✓     │  ← current selection
│  [icon] Dev Tools              │
│  [icon] Work Links             │
│  [icon] Reading List           │
│  … scrolls                     │
└────────────────────────────────┘
```

### Success state
```
┌────────────────────────────────┐
│  [favicon] Page title          │
│  [✓ Saved to Design Research →]│  ← nav shortcut to saved bookmark
│  + Also save to another group  │  ← subordinate; 5s then full reset
└────────────────────────────────┘
```

### Search results (in-place, replaces groups list)
```
┌────────────────────────────────┐
│  [favicon] Page title          │
│  [✦ Save to Design Research ▾] │
├────────────────────────────────┤
│  [linear             ✕]        │
├────────────────────────────────┤
│  Groups                        │
│  [icon] Linear Design      ›   │
│  Bookmarks                     │
│  [L] Linear Docs — Dev Tools   │
│  [L] Linear API — Dev Tools    │
└────────────────────────────────┘
```

### Group drill-in view
```
┌────────────────────────────────┐
│  ‹  [icon] Design Research ··· │  ← back + identity + group actions
│  [Search bookmarks…]           │
├────────────────────────────────┤
│  [L] Linear – Design System…   │
│      linear.app                │
│  [R] Refactoring UI            │
│      refactoringui.com         │
│  … scrolls                     │
├────────────────────────────────┤
│  + Save this page here         │  ← contextual micro-utility
└────────────────────────────────┘
```

`···` menu on the group header contains: "Open all N in tabs" (and future group-level actions). Tab count shown in the label before committing.

---

## 7. Popup — restricted pages fallback

On pages where the FAB cannot inject (chrome://, Web Store, new tab page), the toolbar icon opens the popup. It contains:

- Save strip: favicon + page title (grayed — restricted page title may be unavailable), group picker, save CTA
- "Open full library →" link to Side Panel
- Clarification text: "Reway can't run on this type of page. Save from the address bar or switch to a regular tab."

On unrestricted pages where the FAB is injected, the toolbar icon focuses the FAB panel (or opens it if closed) instead of opening the popup.

---

## 8. Mock iteration findings

### Mock 1 — `mock-1.html`
Validated: combined save+browse layout, drill-in navigation (preferred over two-panel submenu), contextual save inside group view.

Issue found: only 5 groups shown, "Open full library" implied the FAB was a preview rather than a primary surface.

### Mock 2 — `mock-2.html`
Added 7 additional groups under "All groups" section, scroll fade mask, renamed link to "Manage library."

Validated: scroll within panel works cleanly, fade mask communicates "more below" without adding chrome, full group library accessible without leaving the FAB.

### Mock 3 — `mock-3.html`
Added: session micro-utility strip, session mode with pre-filled name field, group picker transform, success state with undo + "Also save to another group", unified search, pin affordance, group icons (emoji placeholders — real HugeIcons in implementation), FAB drag-to-snap to four corners, `···` popover, restricted-page card.

Corrections identified and applied:
- **Group picker selection indicator**: Agent used a circle border around the checkmark (signals multi-select). Fixed: checkmark SVG only, no circle wrapper.
- **Pin icon placement**: `.group-name` had `flex: 1` pushing pin to far right. Fixed: wrap `[group-name][pin-btn]` in `.group-name-pin-wrap` with `flex: 1; min-width: 0`; name gets `overflow: hidden; text-overflow: ellipsis`.
- **"All groups" label**: Section label rendered in mock. Fixed in implementation: replace with hairline separator `<div class="groups-separator">`.
- **Picker chevron**: `›` (drill-in signal) used on picker CTA. Fixed: use `▾` (chevron-down) on the change-group button.
- **FAB hidden on panel open**: Mock applied `is-hidden` class to FAB. Fixed: FAB stays visible as close toggle.

Validated: session strip, picker transform, success state, search results, drag-to-snap all behave correctly. No further mock iterations needed.

---

## 9. Deferred and cancelled surfaces

### Side panel — deferred
The manifest has no `sidePanel` permission and no side panel HTML. Building it is real scope. The web dashboard (`reway.page/dashboard`) already handles all management operations (group reordering, renaming, bulk operations, settings). `"Manage library →"` opens the dashboard in a new tab via the existing `rewayAccessGetDashboardUrl` message type. Side panel is a future iteration.

### Theme — dark only, no theme changer
The FAB runs inside a Shadow DOM injected into arbitrary host pages. Light panels on dark pages or vice versa creates unpredictable contrast. The dashboard theme preference (stored in Supabase) is not accessible to the extension without an API call. Dark is the universal standard for overlay UI. No theme system is built for this iteration.

---

## 10. Implementation notes — code audit findings

These facts must be preserved or accounted for in the implementation:

**Shadow DOM.** The FAB injects via `host.attachShadow({ mode: "open" })`. All FAB CSS must be scoped inside the shadow root. The popup is a separate HTML document and does not use Shadow DOM.

**Message passing.** The content script never calls the API directly — all network calls go through `chrome.runtime.sendMessage` to `background.js`. This pattern must be preserved. A new message type is needed: `rewayAccessSaveBookmark` for saving from the FAB (currently only the popup saves via `apiFetch` directly).

**Existing message types to preserve:**
- `rewayAccessGetGroups` — loads groups, triggers background cache refresh
- `rewayAccessGetGroupBookmarks` — loads bookmarks for a group
- `rewayAccessSearchBookmarks` — full-text search via `/api/extension/bookmarks/search`
- `rewayAccessOpenBookmark` — opens URL + records visit
- `rewayAccessOpenGroup` — opens all group bookmarks in background tabs
- `rewayAccessGetDashboardUrl` — resolves to `reway.page/dashboard`

**Group icon manifest.** Groups render SVG icons from `js/group-icon-manifest.js` via `globalThis.REWAY_GROUP_ICON_MANIFEST`. This manifest maps icon names to SVG node trees. The new FAB must load this manifest via `ensureGroupIconManifest()` (already implemented in `access-content-script.js`). Do not replace with emoji.

**`show_in_fab` flag.** Groups have a `show_in_fab` field. `getVisibleAccessGroups()` in `background.js` filters groups where `show_in_fab !== false`. The new FAB must respect this filter.

**`NO_GROUP_ID = "no-group"`.** Bookmarks with no group are served under this sentinel ID. Appears at the bottom of the groups list as "No Group." Must be preserved.

**FAB position storage migration.** Current storage key: `rewayAccessFabPosition: {x, y}` (pixel coordinates, free drag). New model: `rewayAccessFabCorner: "bottom-right" | "bottom-left" | "top-right" | "top-left"` (corner snap). On boot, if the old key is found and no new key exists, map the position to the nearest corner and write the new key.

**Keyboard shortcut.** Manifest currently defines `Ctrl+Shift+Y` as `open-quick-access`. Grill-me resolved `Alt+Shift+R` as the new shortcut. Update manifest `commands` accordingly. The legacy `Alt+Shift+R` handler already exists in `access-content-script.js` (`isLegacyShortcut`) and can be removed.

**FAB must remain visible when panel is open.** The panel opens upward (or downward) from the FAB's position. The FAB button stays visible as the close toggle — clicking it again closes the panel. Do not apply `is-hidden` or `opacity: 0` to the FAB when the panel is open.

**`"All groups"` section label → separator line.** The groups list renders `"All groups"` as a section label for non-pinned, non-recently-saved groups. Replace with a `<div class="groups-separator">` styled as a thin hairline horizontal rule. No text label.

**Group picker ▾ uses chevron-down, not chevron-right.** The change-group button on the save CTA must use a downward-pointing chevron (▾) to signal a dropdown. Chevron-right (`›`) is reserved exclusively for drill-in row navigation.

**Files to fully rewrite:** `access-content-script.js`, `access-content.css`.
**Files to fully rewrite:** `popup.html`, `popup.js`, `popup.css`.
**Files to not touch:** `background.js`, `content-script.js`, `twitter-content-script.js`, `js/api.js`, `js/sessions.js`, `js/grabber.js`, `js/access-cache.js`, `manifest.json` (except `commands` shortcut key and adding `rewayAccessFabCorner` notes).

### Cache and performance contract

| Key | Storage | TTL | Notes |
|---|---|---|---|
| `rewayGroups` | `chrome.storage.local` | 5 min | Stale-while-revalidate |
| `rewayGroupsFetchedAt` | `chrome.storage.local` | — | Timestamp for TTL check |
| `rewayAccessGroupBookmarks_{id}` | `chrome.storage.local` | 5 min | Lazy — only populated on first drill-in |
| `rewayAccessGroupBookmarksFetchedAt_{id}` | `chrome.storage.local` | — | Per-group timestamp |
| `rewayAccessLastGroup` | `chrome.storage.local` | None | Last-used group ID, save CTA default |
| `rewayAccessPinnedGroups` | `chrome.storage.local` | None | Array of pinned group IDs |
| `rewayAccessFabCorner` | `chrome.storage.local` | None | Active corner string |
| Group icon manifest | Memory only | Session | Loaded once via `ensureGroupIconManifest()`, never re-fetched |

**Panel open is always instant** — render stale cache immediately, refresh in background if >5 min stale. Network calls never gate the panel opening.

**Search debounce:** 180ms before sending `rewayAccessSearchBookmarks` message.

**After save:** invalidate only `rewayAccessGroupBookmarksFetchedAt_{groupId}` for the saved group. Do not sweep all caches.

### Loading states

- **Groups list, bookmark list, search results**: Skeleton rows while fetching — communicates the shape of what's loading, reduces perceived jank.
- **Save CTA**: No loading state. Fully optimistic — CTA immediately transitions to success state. Fake loading states add latency without clarity and complicate rollback on error.
- **"Open all in tabs" action (inside `···` menu)**: 16px CSS spinner inside the button while tabs are opening. This is the only non-optimistic action that warrants a button-level indicator.
- **SmoothUI Grid Loader**: Evaluated and rejected. No appropriate loading moment in the current flow where a 3×3 grid indicator is proportional or informative.

---

## 11. Design principles established

- **Capture first, then organize.** Save latency must be near-zero. Group selection defaults to last-used; enrichment and reorganization happen later. Exception: sessions have no intrinsic identity and must be named at capture time — use a pre-filled editable default.
- **One surface per job.** FAB = contextual. Side Panel = library. Popup = fallback. Context menu = silent. No feature should require two surfaces to complete.
- **Extra micro utilities.** Add contextually obvious affordances that the user could want right now based on where they are in the UI. Make them quiet — they should feel discovered, not designed. Examples: "Save this page here" inside drill-in view; "or save N open tabs as a session →" below the save CTA; "Also save to another group" in the success state.
- **Outer radius = inner radius + padding.** Optical alignment rule enforced across all surfaces.
- **Scroll, don't truncate.** If content overflows, scroll with a fade mask. Do not hide content behind links that push users to a different surface.
- **One token system.** Popup and FAB share variables. No divergent naming for the same values.
- **Click is intent, hover is affordance.** Never use hover as a trigger. Hover states communicate interactivity and reveal secondary actions (pin icon); clicks confirm intent.
- **Intuitivity over discoverability patterns.** Guessing is bad. Long-press, swipe-to-reveal, and other non-obvious gestures are not used. Every action is either always visible or revealed on hover with a recognizable icon.
- **Progressive disclosure preserves flow.** Secondary capture modes (Tab Session), secondary save destinations ("Also save to another group"), and group-level actions (`···`) are available without interrupting the primary path.
