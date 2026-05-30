# Next.js Performance Final Report

## Phase

`final reporting`

## Baseline

- `pnpm build` passed during analysis.
- `/` is static.
- `/dashboard`, `/login`, `/reset-password`, and API routes are dynamic.
- Estimated entry JS from generated client-reference manifests:
  - `/dashboard`: `1055.2 KB`
  - `/`: `670.5 KB`
  - `/login`: `569.5 KB`
  - `/reset-password`: `547.2 KB`
  - `/about`: `445.2 KB`

## Priority Findings

### P1 - Extension metadata route should use the shared metadata helper

Evidence:

- `extension/popup.js:742` calls `/api/metadata?url=...`.
- `app/api/metadata/route.ts` duplicates metadata fetch and parse behavior.
- `lib/metadata.ts` already provides `normalizeUrl`, private-network blocking, richer metadata extraction, an `Accept` header, and `AbortSignal.timeout(8000)`.
- Dashboard bookmark creation uses `fetchMetadata(url)` through `lib/dashboard/server/library-mutations.ts:76`, so the extension-facing route has drifted from the canonical path.

Impact:

- External metadata requests can hold the route open without the shared timeout.
- Arbitrary target fetches are cached with `next: { revalidate: 3600 }`.
- The extension capture flow pays for a weaker, duplicated implementation.
- This overlaps with reliability and security concerns, but it is also a Next.js route-handler performance issue.

Execution candidate:

- Change `app/api/metadata/route.ts` to delegate to `fetchMetadata`.
- Preserve the JSON response contract used by `extension/popup.js`.
- Return stable `400`/`500` responses without exposing internal fetch details.

Verification required:

- `pnpm build`
- Manual or scripted request against `/api/metadata?url=example.com`
- Extension popup capture path still receives `title`, `description`, `favicon`, `ogImage`, `domain`, and `url`

### P1 - Dashboard initial JS should split closed feature sheets

Evidence:

- `/dashboard` entry JS is estimated at `1055.2 KB`.
- `components/dashboard/DashboardNav.tsx` imports and renders closed sheets in the initial navigation tree:
  - `NotesTodosSheet`
  - `ImportSheet`
  - `ExportSheet`
  - `DuplicatesSheet`
  - `EnrichmentHealthSheet`
- Those surfaces open only after nav actions.

Impact:

- Dashboard hydration includes code for workflows the user may not open.
- Import/export, duplicate cleanup, enrichment health, and notes/todos logic compete with first interaction readiness.
- This is a lower-risk first dashboard optimization than restructuring `DashboardContent`.

Execution candidate:

- Dynamically load closed dashboard sheets behind their open state.
- Keep stable button/menu affordances in the initial nav.
- Use simple non-animated fallbacks or no visible fallback for sheet content until opened.

Verification required:

- `pnpm build`
- Open each nav sheet: notes/todos, import, export, duplicates, enrichment health
- Confirm sheet state, callbacks, and pending states still work

### P1 - Landing below-fold client sections should be deferred

Evidence:

- `/` entry JS is estimated at `670.5 KB`.
- `components/demo-layout.tsx` synchronously imports `FeaturesSection`, `DemoVideosSection`, `CallToAction`, `ScrollToTopButton`, and `LandingFooter`.
- `FeaturesSection` imports Motion and all feature demos.
- `DemoVideosSection` imports Hugeicons, Motion hooks, `AnimatePresence`, local state, and `DemoVideo`.
- Video media bytes are deferred, but the section JavaScript is not.

Impact:

- Static marketing navigation pays for below-fold interactive demos up front.
- First-load parse/execute cost can affect INP and early responsiveness.
- Below-fold demos compete with hero/nav hydration.

Execution candidate:

- Start with `DemoVideosSection` because it is naturally below the fold and already has lazy media behavior.
- Then evaluate `FeaturesSection` or individual feature demos.
- Preserve stable section height to avoid CLS.

Verification required:

- `pnpm build`
- Desktop/mobile page load visual check
- Confirm no visible layout jump when deferred sections load

### P2 - Icon catalog should distinguish visible icons from picker catalog

Evidence:

- `lib/hugeicons-list.ts` builds `ALL_ICONS_MAP`.
- Multiple visible dashboard paths statically import `ALL_ICONS_MAP`, including sidebar rows and folder headers.
- `GroupMenu` and `BookmarkEditSheet` also dynamically import the same full catalog on mount.
- The first-pass `GroupMenu` finding was too narrow; the catalog is used across initial dashboard UI.

Impact:

- The dashboard may load the full icon catalog when it only needs to render selected group icons.
- The dynamic picker boundary helps the popover UI, but not all catalog payload paths.

Execution candidate:

- Create a small selected-icon resolver for common/rendered group icons.
- Keep the full categorized catalog lazy for icon picker surfaces.
- Defer broader refactor until the React performance pass checks render behavior around group rows.

Verification required:

- `pnpm build`
- Existing group icons render in sidebar and folder views
- Icon picker still opens with full categories

### P2 - Dynamic routes need route-level loading boundaries

Evidence:

- There are no `app/**/loading.tsx` files.
- `/dashboard`, `/login`, and `/reset-password` are dynamic.
- Dashboard waits for multiple server reads before rendering.
- Local loading states exist, so this is specifically a route-level streaming/perceived-performance gap.

Impact:

- Dynamic route navigation can show a blank wait during cold loads.
- Dashboard has the highest perceived-performance risk because the route depends on user and library data.

Execution candidate:

- Add `app/dashboard/loading.tsx` first using a static shell/skeleton that matches the existing dashboard layout.
- Consider auth route loading only after dashboard, because auth forms already have local pending states.

Verification required:

- `pnpm build`
- Navigate to `/dashboard` under throttled/cold conditions
- Confirm skeleton does not imply fake data or animate during actual form submission

### P3 - Root providers may be too broad, but need measurement before relocation

Evidence:

- `app/layout.tsx` renders root `ThemeProvider`, `TooltipProvider`, and `Toaster`.
- `toast.*` usage appears dashboard-only in scanned app/component files.
- Dashboard nav controls also instantiate nested tooltip providers.

Impact:

- Static/legal/public routes may pay for toast and tooltip infrastructure.
- Moving providers can create subtle UX regressions, especially for theme and future public dialogs.

Execution candidate:

- Do not make this the first execution patch.
- Measure bundle impact after P1 splits.
- Later, consider moving `Toaster` and tooltip scope closer to dashboard/auth surfaces while keeping theme root-wide.

Verification required:

- Route smoke tests for public, auth, and dashboard pages
- Toasts still appear from dashboard actions
- Tooltip delays remain consistent

## Non-Finding For Now

### Image optimization should wait for LCP measurement

Evidence:

- The scan found limited image usage.
- Some `<img>` usage is intentional for arbitrary favicons or video placeholders.
- `next.config.ts` has narrow remote image configuration.

Decision:

- Do not refactor image handling until Lighthouse or Playwright identifies the real LCP element and verifies an image bottleneck.

## Recommended Execution Order

Execution requires approval before any code changes.

1. Metadata route consolidation.
2. Dashboard closed-sheet dynamic loading.
3. Landing `DemoVideosSection` dynamic loading with stable layout.
4. Dashboard icon catalog split.
5. `app/dashboard/loading.tsx`.
6. Provider scope cleanup after measurement.

## Cross-skill Handoff Notes

- `react-performance-optimization`: revisit dashboard state ownership, client islands, large lists, and icon row rendering after the Next.js split candidates are recorded.
- `supabase-performance-tuning`: dashboard server load and Supabase query/index behavior remain separate from client bundle findings.
- `supabase-common-errors` and `supabase-known-pitfalls`: metadata route safety drift should be revisited because it is extension-facing.
- `refactor-method-complexity-reduce`: metadata route simplification may remove duplication; dashboard orchestration may expose method-level complexity candidates later.

## Status

Execution has now been completed for the approved items tracked in `execution-plan.md`.

Completed from this report:

1. Metadata route consolidation.
2. Dashboard closed-surface deferral.
3. Landing `DemoVideosSection` deferral.
4. Landing `FeaturesSection` deferral.
5. Dashboard route loading boundary.
6. Provider scope cleanup for root `Toaster` and `TooltipProvider`.

Remaining Next.js work from this report is browser validation and cross-skill follow-up, not another required code patch.
