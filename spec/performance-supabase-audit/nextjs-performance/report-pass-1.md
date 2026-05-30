# Next.js Performance Report Pass 1

## Phase

`reporting`

## Summary

The first pass found no build breakage. The strongest risks are route-level client payload and perceived loading behavior rather than obvious image/font failures. The dashboard and marketing page both work, but their current App Router boundaries make large client bundles the default path.

## Verification Baseline

- `pnpm build` passed.
- Build output confirms `/` is static and `/dashboard`, `/login`, `/reset-password`, and API routes are dynamic.
- Entry JS estimates from generated client-reference manifests:
  - `/dashboard`: `1055.2 KB`
  - `/`: `670.5 KB`
  - `/login`: `569.5 KB`
  - `/reset-password`: `547.2 KB`
  - `/about`: `445.2 KB`

## P1 — Dashboard Initial Route Hydrates Too Much At Once

Evidence:

- `app/dashboard/page.tsx` is `force-dynamic` and loads user, bookmarks, groups, notes, and todos with `Promise.all`.
- `app/dashboard/page.tsx` passes all loaded data into `DashboardContent`.
- `components/dashboard/DashboardContent.tsx` is one client orchestration hub for realtime, preferences, bookmark actions, group actions, import/export, notes/todos, selection, command mode, and layout.
- `components/dashboard/DashboardLayout.tsx` imports the board, sidebar, nav, command bar, notes/todos sidebar, onboarding, and floating action surfaces.
- `/dashboard` entry JS is estimated at `1055.2 KB`.

Risk:

- High first-load JS and hydration work before the user can operate the dashboard.
- INP risk grows with library size because dashboard state and render ownership are broad.
- Some subfeatures likely ship before they are needed: import/export sheets, settings, onboarding, edit/preview dialogs, notes/todos, and icon-heavy group controls.

Re-analysis question:

- Which dashboard subtrees are required for first interaction, and which can move behind dynamic import, Suspense, or user-triggered loading without breaking keyboard and capture flows?

Execution candidate:

- Split rarely opened dashboard surfaces first, because that is lower risk than changing core board rendering.

## P1 — Public Marketing Route Ships Below-Fold Interaction Code Up Front

Evidence:

- `app/page.tsx` renders `Header` and `DemoLayout`.
- `components/demo-layout.tsx` imports and renders `HeroSection`, `FeaturesSection`, `DemoVideosSection`, `CallToAction`, `ScrollToTopButton`, and `LandingFooter`.
- Many landing sections are Client Components using `motion/react`, Hugeicons, Radix, or local state.
- `DemoVideosSection` defers media bytes, but its video player and motion code are statically imported through the initial route.
- `/` entry JS is estimated at `670.5 KB`.

Risk:

- Static marketing content pays for broad hydration.
- LCP may still be text-driven, but INP and first-load parse/execute cost are likely higher than needed.
- Below-fold demos compete with the hero for early main-thread budget.

Re-analysis question:

- Can below-fold sections be dynamically imported with stable placeholders while keeping the hero visually complete in the first viewport?

Execution candidate:

- Start with `DemoVideosSection`, because its media is already lazily attached and the section is naturally below the first viewport.

## P1 — Metadata Route Has Performance And Safety Drift From Shared Metadata Fetching

Evidence:

- `app/api/metadata/route.ts` builds a target URL from `searchParams`.
- It performs `fetch(targetUrl)` with a user-agent and `next: { revalidate: 3600 }`.
- It reads the entire response with `response.text()`.
- It does not use the shared `normalizeUrl`, `isPrivateIp`, or timeout behavior in `lib/metadata.ts`.
- `lib/metadata.ts` already has private-network blocking and `AbortSignal.timeout(8000)`.

Risk:

- External metadata fetches can hold the route open longer than intended.
- Large HTML responses can consume memory and CPU during parsing.
- Security overlap: project constraints require metadata fetching to block private-network targets.
- Extension/capture-adjacent flows can feel slow if this route is used.

Re-analysis question:

- Is `app/api/metadata/route.ts` still called by the extension or UI, or is `lib/metadata.ts` now the canonical metadata path?

Execution candidate:

- If still used, route it through the shared metadata helper and add route-level request safety.

## P2 — Missing Route-Level Loading Boundaries Reduce Perceived Performance

Evidence:

- There are no `loading.tsx` files under `app`.
- `/dashboard`, `/login`, and `/reset-password` are dynamic.
- Dashboard waits for all initial server data before rendering.

Risk:

- Cold navigation to dynamic routes can feel blank.
- Dashboard has the highest perceived-performance risk because it loads multiple Supabase resources.

Re-analysis question:

- Which route skeletons can match the existing UI without adding noisy motion or fake progress?

Execution candidate:

- Add `app/dashboard/loading.tsx` first if the visual shell can be represented accurately.

## P2 — Root Providers Raise The Baseline JS For Every Route

Evidence:

- `app/layout.tsx` wraps every route in `ThemeProvider`, `TooltipProvider`, and `Toaster`.
- Client manifests show `sonner`, `theme-provider`, and `ui/tooltip` in root client modules.
- Static content routes still report large entry JS, with `/about` estimated at `445.2 KB`.

Risk:

- Legal/static pages pay for app-level interaction infrastructure.
- Public marketing pages may load tooltip/toast code before any interaction requires it.

Re-analysis question:

- Which providers must stay root-wide for correctness, and which can move into route groups or interactive shells?

Execution candidate:

- Consider moving `Toaster` and maybe `TooltipProvider` closer to dashboard/auth if the public site does not require immediate toasts/tooltips.

## P2 — Icon Map Loads On Group Menu Mount Despite Dynamic Icon Picker

Evidence:

- `GroupMenu` dynamically imports `IconPickerPopover` with `ssr: false`.
- `GroupMenu` still imports `@/lib/hugeicons-list` inside `useEffect` as soon as the menu component mounts.
- `hugeicons-list.ts` imports a large icon set.

Risk:

- Dashboard/mobile nav may load icon data before edit/create group interaction.
- The current dynamic import helps the popover but not necessarily the icon-map payload.

Re-analysis question:

- Does passive group rendering require the full icon map, or only edit/create controls?

Execution candidate:

- Defer icon-map import until edit/create mode starts or icon picker opens.

## P3 — Image Optimization Needs A Narrow Follow-Up, Not Immediate Refactor

Evidence:

- Only six app/component files use `next/image`, `<Image>`, or `<img>`.
- `DemoVideo` intentionally uses `<img>` for a blur placeholder and disables the lint rule locally.
- Dashboard favicon rendering uses `<img>`, likely because favicons are arbitrary remote URLs.
- `next.config.ts` only allows `www.google.com` in `images.remotePatterns`.

Risk:

- The main issue is not blanket `<img>` usage.
- Arbitrary favicon/OG image domains may not fit `next/image` without broad remote configuration.

Re-analysis question:

- Identify the actual LCP element with Lighthouse or Playwright before changing image handling.

Execution candidate:

- No image refactor until measured LCP evidence exists.

## Cross-Skill Overlaps

- `react-performance-optimization`: dashboard hydration, state ownership, rerenders, large list behavior.
- `supabase-performance-tuning`: dashboard server load and query/index behavior.
- `supabase-known-pitfalls`: metadata route safety, extension route data shape, client/server Supabase boundaries.
- `refactor-method-complexity-reduce`: metadata route and dashboard orchestration may become candidates after performance priorities are confirmed.

## Recommended Re-Analysis Order

1. Confirm actual route JS/chunk ownership for `/` and `/dashboard`.
2. Confirm whether `app/api/metadata/route.ts` is still used.
3. Inspect first-viewport/LCP behavior for `/`.
4. Inspect dashboard first-load shell needs and identify dynamic split candidates.
5. Decide whether provider relocation is safe or too cross-cutting for this audit round.

## Current Status

No execution proposed yet. This report should be re-analyzed before any implementation plan is created.
