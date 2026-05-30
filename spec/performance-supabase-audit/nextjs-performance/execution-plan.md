# Next.js Performance Execution Log

## Phase

`executing`

## Approved Step 1

Metadata route consolidation.

### Change Applied

Updated `app/api/metadata/route.ts` to delegate to `fetchMetadata` from `lib/metadata.ts` instead of maintaining a second scraper implementation.

Updated `lib/metadata.ts` to distinguish invalid URLs from private-network targets before fetch execution.

### Why This Step Was Chosen First

- It was the top approved execution candidate from `report-final.md`.
- It removes duplicated route-handler logic.
- It aligns the extension metadata path with the shared dashboard metadata path.
- It improves timeout and private-network protection without changing the extension response shape.

### Response Contract Preserved

The route still returns:

- `title`
- `description`
- `favicon`
- `ogImage`
- `domain`
- `url`

Error behavior is now:

- `400` for missing `url`
- `400` for invalid URLs
- `400` for private-network targets
- `500` for fetch/parse failures

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

## Approved Step 2

Dashboard closed-sheet dynamic loading.

### Change Applied

Updated `components/dashboard/DashboardNav.tsx` to:

- replace static imports for `NotesTodosSheet`, `ImportSheet`, `ExportSheet`, `DuplicatesSheet`, and `EnrichmentHealthSheet` with `next/dynamic`
- gate each sheet behind its `open` flag or a latched `loadedSheets` state
- keep sheets mounted after first open so follow-up opens do not re-split behavior every time

Updated `components/dashboard/nav/UserMenu.tsx` and `components/dashboard/SettingsDialog.tsx` to:

- defer `SettingsDialog` with `next/dynamic`
- move `reway:open-settings`, `reway:close-settings`, `reway:open-theme-select`, and `reway:close-theme-select` event handling into `UserMenu`
- control settings open state from `UserMenu` so onboarding-triggered opens still work before first mount

### Why This Step Was Chosen Next

- It was the lowest-risk dashboard split candidate from the final report.
- These sheets are opened from nav actions rather than required for the first dashboard paint.
- It reduces the dashboard's initial client path without restructuring `DashboardContent`.

### Behavioral Notes

- Initial dashboard load no longer mounts these sheet surfaces until the user opens them.
- After first open, the sheet remains eligible to stay mounted for future opens.
- The nav buttons and menu actions are unchanged.
- Settings now follows the same deferred pattern while preserving onboarding and theme-select event behavior.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level interaction checks for opening each deferred sheet and settings dialog were not run in this step.

## Approved Step 3

Landing `DemoVideosSection` deferral.

### Change Applied

Updated `components/demo-layout.tsx` to:

- dynamically import `DemoVideosSection`
- keep the `#extension` anchor in place
- render a stable placeholder section while the deferred client section loads

### Why This Step Was Chosen Next

- It was the narrowest below-fold landing split candidate from the final report.
- The section is interactive and media-heavy, but not required for the first viewport.
- It reduces the public route's initial client path without changing hero or top-nav behavior.

### Behavioral Notes

- The landing page keeps a stable "How it works" section shell during initial render.
- The real interactive `DemoVideosSection` loads after the main route path instead of shipping eagerly.
- The section remains linkable through `/#extension`.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of placeholder-to-section swap and anchor behavior was not run in this step.

## Approved Step 4

Landing `FeaturesSection` deferral.

### Change Applied

Updated `components/demo-layout.tsx` to:

- dynamically import `FeaturesSection`
- keep the `#features` anchor in place
- render a stable placeholder section while the deferred client section loads

### Why This Step Was Chosen Next

- It was the other major below-fold client surface identified in the final report.
- The section eagerly imported Motion plus four interactive feature demos.
- Deferring the whole section removes a meaningful slice of public-route client work without touching the hero path.

### Behavioral Notes

- The landing page keeps a stable features section shell during initial render.
- The real interactive feature cards load after the main route path instead of shipping eagerly.
- The section remains linkable through `/#features`.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of placeholder-to-section swap and anchor behavior was not run in this step.

## Approved Step 5

Dashboard route loading boundary.

### Change Applied

Added `app/dashboard/loading.tsx`, then refined it into a simpler loading state that:

- reuses `DashboardLoadingState` and the existing loading-bars SVG language
- shows a short explanatory message
- renders a lightweight list-view bookmark skeleton underneath
- applies the selected dashboard palette theme from the same cookie used by the page

### Why This Step Was Chosen Next

- It was the safest remaining route-level perceived-performance improvement from the final report.
- The dashboard route is dynamic and waits on multiple reads before rendering.
- A route shell is lower risk than provider-scope moves and improves blank-navigation behavior.

### Behavioral Notes

- Dashboard navigations now have a route-level loading state instead of an empty wait.
- The loading UI is intentionally simple and does not pretend to mirror the full dashboard layout.
- The loading state preserves dashboard palette continuity without adding client-side complexity.
- The boundary stays within App Router conventions by using `app/dashboard/loading.tsx`.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of the route transition shell under slower or cold conditions was not run in this step.

## Approved Step 6

Provider scope cleanup.

### Change Applied

Updated `app/layout.tsx` to remove:

- root `Toaster`
- root `TooltipProvider`

Updated `app/dashboard/page.tsx` to add `Toaster` at the dashboard route scope.

### Why This Step Was Chosen Next

- Toast usage is dashboard-only in the current codebase.
- Tooltip usage is currently provided locally inside dashboard controls.
- Moving these providers out of the root trims global client surface for public and static routes.

### Behavioral Notes

- Public routes no longer mount the Sonner toaster infrastructure by default.
- Dashboard toasts remain available because the route now owns `Toaster`.
- Tooltip behavior remains local to the dashboard controls that already wrap themselves in `TooltipProvider`.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of dashboard toast rendering and local tooltip behavior was not run in this step.

## Follow-up Step 7

Dashboard icon-catalog idle-path reduction.

### Change Applied

Updated `components/dashboard/content/DashboardSidebar.tsx` to dynamically import:

- `GroupCreateCard`
- `GroupEditCard`
- `GroupDragOverlayRow`

Exported explicit prop types from the sidebar card and reorder-row modules so those deferred imports remain typed.

### Why This Was Worth Doing

- These idle paths were still pulling the full icon catalog through `ALL_ICONS_MAP`.
- Group create/edit flows and the drag overlay are not needed for the first dashboard paint.
- This trims more of the icon-related client work without risking incorrect icons in always-visible group rows.

### Behavioral Notes

- Group create/edit UI now loads on demand instead of being part of the always-on sidebar path.
- Drag overlay UI now loads on drag interaction instead of initial sidebar render.
- Visible group rows and folder headers still use the current icon resolver, so the broader icon-map issue is only partially addressed.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of first-use latency for create/edit group flows and drag overlays was not run in this step.

## Follow-up Step 8

Auth route loading boundaries.

### Change Applied

Added:

- `app/login/loading.tsx`
- `app/reset-password/loading.tsx`

Both routes use the existing loading-bars UI with short, route-specific messages instead of blank waits.

### Why This Was Worth Doing

- `login` and `reset-password` were still dynamic routes from the original report.
- The patch is small, low-risk, and stays inside the existing loading-language system.
- It closes the last obvious route-level loading gap from the Next.js report.

### Behavioral Notes

- Auth navigations now show lightweight route-level loading feedback.
- The loading states stay simple and do not imitate full form layouts.

### Verification

- `pnpm typecheck` passed
- `pnpm build` passed

### Remaining Verification Gap

- Browser-level confirmation of auth route transitions was not run in this step.

## Follow-up Constraint

Next.js execution work from this report is closed. Remaining work is browser validation and cross-skill follow-up rather than another required code patch from this report.
