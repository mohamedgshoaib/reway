# Next.js Performance Analysis Pass 1

## Phase

`analyzing`

## Scope Covered

- Public marketing route and landing components
- Dashboard route and dashboard client boundary
- Auth routes at a build-manifest level
- Extension-facing route handlers
- Metadata scraping route
- Next build output and generated client-reference manifests

## Commands Run

- `pnpm build`
- Static scans with `rg` for:
  - `use client`
  - `next/image`, `<Image>`, `<img>`
  - `dynamic`, `next/dynamic`, `Suspense`, `revalidate`, `revalidatePath`
  - route handler exports
  - heavy client dependencies
- Build artifact inspection:
  - `.next/static/chunks`
  - `.next/server/app/*/page_client-reference-manifest.js`

## Build Baseline

`pnpm build` passed.

Build classification:

- `/` static
- `/about`, `/privacy`, `/terms` static
- `/dashboard` dynamic
- `/login` dynamic
- `/reset-password` dynamic
- `/api/bookmarks/visits` dynamic
- `/api/extension/bookmarks` dynamic
- `/api/extension/groups` dynamic
- `/api/metadata` dynamic

Generated entry JS estimate from client-reference manifests:

| Route | Entry JS Chunks | Approx JS |
| --- | ---: | ---: |
| `/` | 12 | `670.5 KB` |
| `/dashboard` | 11 | `1055.2 KB` |
| `/login` | 9 | `569.5 KB` |
| `/reset-password` | 9 | `547.2 KB` |
| `/about` | 8 | `445.2 KB` |

Largest generated static chunks:

- `0u9ymi-g5-55..js` — `342.8 KB`
- `0fvi3bju9c_u3.js` — `235.6 KB`
- `0efoukfcm5g18.js` — `221.0 KB`
- `0jilfxz7v3-pu.css` — `192.5 KB`
- `094m4w2l-g7r5.js` — `157.6 KB`

## Candidate Finding 1 — Public Route Ships A Large Client Surface

Evidence:

- `app/page.tsx` imports `Header` and `DemoLayout` at lines 2-3, then renders both directly at lines 14-15.
- `components/demo-layout.tsx` imports all major landing sections at lines 1-6 and renders them immediately at lines 12-18.
- `components/header.tsx` is a Client Component at line 1, uses the motion-backed `useScroll` hook at line 7 and line 26.
- `components/landing/HeroSection.tsx` is a Client Component at line 1 and imports `motion/react`, `RewayLazyMotion`, `useEffect`, and `useState` at lines 3-6.
- `components/landing/HeroDemoPreview.tsx` is a Client Component at line 1 and owns theme state, command state, autoplay state, Radix select, avatar, and dashboard demo widgets across lines 51-174+.
- `components/landing/DemoVideosSection.tsx` is a Client Component at line 1 and imports motion primitives plus video controls at lines 3-16.
- The `/` client-reference manifest reports about `670.5 KB` of entry JS.

Why it matters:

- The marketing page is static, but much of the first route is hydrated as interactive UI.
- Below-fold sections appear to be included in the route entry rather than isolated behind dynamic loading or interaction/visibility gates.
- This is likely an INP and first-load JS concern.

Re-analysis target:

- Separate true above-the-fold requirements from below-fold demos.
- Check whether `Header`, `FeaturesSection`, `DemoVideosSection`, `CallToAction`, `LandingFooter`, and `ScrollToTopButton` can be split into smaller client leaves or dynamically loaded below the hero.

## Candidate Finding 2 — Dashboard Hydrates As One Large Client Island

Evidence:

- `app/dashboard/page.tsx` is dynamic at line 19.
- It awaits `getUser`, `getBookmarks`, `getGroups`, `getNotes`, and `getTodos` together at lines 86-92 before rendering.
- It passes all loaded data into `DashboardContent` at lines 104-123.
- `components/dashboard/DashboardContent.tsx` is a Client Component at line 1.
- `DashboardContent` imports the full action/hook orchestration surface at lines 10-31 and server actions at lines 49-68.
- `DashboardContent` wires bookmark, group, import/export, selection, notes/todos, realtime, preferences, command, and navigation adapters in one component from lines 85-423.
- `components/dashboard/DashboardLayout.tsx` is also a Client Component at line 1 and imports board, sidebar, nav, command bar, notes/todos, onboarding, and floating action surfaces at lines 5-20.
- The `/dashboard` client-reference manifest reports about `1055.2 KB` of entry JS.

Why it matters:

- The authenticated workspace is expected to scale to large libraries.
- All initial data and most interaction code arrive together, which raises first-load JS, hydration, and INP risk.
- This overlaps with the later `react-performance-optimization` pass, but the Next.js concern is the route-level boundary and initial payload.

Re-analysis target:

- Determine whether dashboard can keep server-loaded data while splitting rarely opened surfaces such as import/export sheets, settings, quick glance, edit sheet, onboarding, and notes/todos sidebar.
- Check whether route-level or component-level streaming can show the dashboard shell before non-critical panels resolve.

## Candidate Finding 3 — No App Route Loading Boundaries

Evidence:

- `rg --files app | Where-Object { $_ -like '*loading.tsx' }` returned `0`.
- `/dashboard`, `/login`, and `/reset-password` are dynamic in the build output.
- Dashboard server load awaits all major data sources before returning UI.
- `app/login/LoginForm.tsx` contains local Suspense at lines 554-563, but there is no route-level `loading.tsx`.

Why it matters:

- Dynamic App Router routes can feel blank during navigation or cold server work.
- Dashboard especially has multiple Supabase reads and no route skeleton.
- This affects perceived performance even when actual query time is acceptable.

Re-analysis target:

- Identify route-specific skeletons that match existing UI without adding misleading loading motion.
- Prioritize `app/dashboard/loading.tsx`; then evaluate `login` and `reset-password`.

## Candidate Finding 4 — Metadata API Route Has A Slow/Unbounded Fetch Path Compared With Shared Metadata Utility

Evidence:

- `app/api/metadata/route.ts` accepts a `url` query parameter at lines 5-13.
- It fetches the target URL at lines 14-20 and reads the entire response body with `response.text()` at line 26.
- It uses `next: { revalidate: 3600 }` at line 19.
- It does not use `AbortSignal.timeout`, private-IP checks, or the shared normalization/SSRF guard in `lib/metadata.ts`.
- `lib/metadata.ts` has `normalizeUrl` at lines 12-27, `isPrivateIp` at lines 29-48, and `fetchMetadata` uses `AbortSignal.timeout(8000)` at lines 50-65.

Why it matters:

- Performance: an external URL can hold the route open until the platform/network timeout.
- Resource use: `response.text()` has no explicit size cap.
- Correctness/security overlap: the project DNA says metadata fetching must block localhost/private-network targets.
- This route may be extension-facing or future capture-facing, so slow metadata fetch hurts capture-adjacent flows.

Re-analysis target:

- Confirm whether `app/api/metadata/route.ts` is still used or superseded by `lib/metadata.ts` and server actions.
- If used, align it with the shared metadata utility or remove the duplicate route path.

## Candidate Finding 5 — Icon Picker Dynamic Import Still Eagerly Loads The Icon Map On Group Menu Mount

Evidence:

- `components/dashboard/nav/GroupMenu.tsx` dynamically imports `IconPickerPopover` with `ssr: false` at lines 31-36.
- The same component immediately imports `@/lib/hugeicons-list` inside `useEffect` at lines 109-123.
- `lib/hugeicons-list.ts` is marked `use client` at line 1 and imports many Hugeicons at line 145 in the scan output.

Why it matters:

- The dynamic component boundary avoids SSR for the popover, but the icon data still starts loading as soon as `GroupMenu` mounts.
- This likely contributes to dashboard/mobile nav client work before the user edits or creates a group.

Re-analysis target:

- Confirm whether `iconsMap` is needed for passive group rendering or only for icon editing/creation.
- If only needed for editing, defer the import until edit/create starts or the popover opens.

## Candidate Finding 6 — Global Root Client Providers Add Baseline JS To Every Route

Evidence:

- `app/layout.tsx` imports `Script`, `Toaster`, `ThemeProvider`, and `TooltipProvider` at lines 3 and 49-51.
- The root layout renders `ThemeProvider`, `TooltipProvider`, and `Toaster` around every route at lines 76-84.
- The `/` client manifest includes `sonner`, `components/theme-provider.tsx`, and `components/ui/tooltip.tsx` in root client modules.
- Even static content pages like `/about` report about `445.2 KB` entry JS.

Why it matters:

- Global providers are sometimes justified, but here they may load toast and tooltip behavior on routes that may not need either immediately.
- This can raise the client baseline for static marketing/legal pages.

Re-analysis target:

- Check whether `Toaster` and `TooltipProvider` can move into dashboard/auth/client interaction layouts without regressing global UX.
- Confirm whether theme handling must remain root-wide.

## Candidate Finding 7 — Video Section Is Mostly Lazy For Media, But Not For JS

Evidence:

- `components/landing/features/DemoVideo.tsx` uses `preload="none"` at line 215.
- It attaches `<source src={src}>` only after `IntersectionObserver` marks it near/inside viewport at lines 74-85 and line 231.
- However, `components/landing/DemoVideosSection.tsx` imports `DemoVideo` statically at line 16 and imports motion primitives at lines 3-11.
- `components/demo-layout.tsx` renders `DemoVideosSection` as part of the initial route tree at line 14.

Why it matters:

- Media bytes are reasonably deferred, but the JavaScript for the below-fold interactive video player still belongs to the initial marketing route.
- This reinforces Candidate Finding 1 and is likely a good first split target.

Re-analysis target:

- Test whether `DemoVideosSection` can be dynamically imported with a stable, non-shifting placeholder.

## Non-Findings / Positive Signals

- `pnpm build` passes.
- The landing page is statically generated.
- Dashboard data loads are parallelized with `Promise.all`.
- The dashboard query selects avoid broad bookmark detail fields for initial dashboard load; details are separated in `DASHBOARD_BOOKMARK_DETAIL_SELECT`.
- Demo video media uses `preload="none"` and delayed source attachment.
- Icon picker UI itself is dynamically imported with `ssr: false`.
- Umami analytics script uses `strategy="lazyOnload"`.

## Not Completed In This Phase

- No Lighthouse run yet.
- No Playwright trace/profiling yet.
- No bundle analyzer package added.
- No code changes.
- No Supabase MCP diagnostics.

## Next Step

Move to `reporting` for `nextjs-performance` and turn these candidates into a ranked first report with clear priorities and re-analysis questions.
