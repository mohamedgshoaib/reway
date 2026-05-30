# Next.js Performance Loading

## Phase

`loading`

## Skill Loaded

`nextjs-performance`

Skill focus:

- Core Web Vitals: LCP, INP, CLS
- `next/image` and media handling
- `next/font` and font/layout-shift behavior
- Server Components and Client Component boundaries
- Suspense, streaming, and route loading states
- Caching and revalidation
- Bundle/code splitting
- Route handler performance
- Next.js 16 + React 19 patterns

## Reference Files Loaded

- `.agents/skills/nextjs-performance/SKILL.md`
- `.agents/skills/nextjs-performance/references/core-web-vitals.md`
- `.agents/skills/nextjs-performance/references/image-optimization.md`
- `.agents/skills/nextjs-performance/references/font-optimization.md`
- `.agents/skills/nextjs-performance/references/server-components.md`
- `.agents/skills/nextjs-performance/references/streaming-suspense.md`
- `.agents/skills/nextjs-performance/references/caching-strategies.md`
- `.agents/skills/nextjs-performance/references/bundle-optimization.md`
- `.agents/skills/nextjs-performance/references/api-routes.md`
- `.agents/skills/nextjs-performance/references/metadata-seo.md`
- `.agents/skills/nextjs-performance/references/nextjs-16-patterns.md`

## Project Baseline Loaded

Package/runtime:

- Next.js: `16.2.6`
- React: `19.2.6`
- Package manager: `pnpm`
- Scripts available: `dev`, `build`, `start`, `lint`, `fmt`, `fmt:check`, `typecheck`
- Performance-relevant dependencies observed: `motion`, `@dnd-kit/*`, `radix-ui`, `@hugeicons/*`, `next-themes`, `sonner`, `geist`

Config:

- `next.config.ts` enables `typedRoutes`.
- Turbopack root is pinned to the project root.
- Fetch logging is enabled with full URLs.
- `images.remotePatterns` currently allows `https://www.google.com/**`.
- Rewrites proxy Umami analytics from `/metrics/lib.js` and `/metrics/api/send`.

Root layout:

- `app/layout.tsx` imports `GeistSans` and `GeistMono` from `geist/font/*`.
- `next/script` loads Umami with `strategy="lazyOnload"`.
- JSON-LD is emitted in the root layout.
- Root providers: `ThemeProvider`, `TooltipProvider`, `Toaster`.

Dashboard route:

- `app/dashboard/page.tsx` is marked `dynamic = "force-dynamic"`.
- Dashboard server load uses `Promise.all` for `getUser`, `getBookmarks`, `getGroups`, `getNotes`, and `getTodos`.
- Dashboard data is passed into `DashboardContent`, which is a Client Component orchestration hub.

## Surface Map

Marketing/public surfaces:

- `app/page.tsx`
- `components/demo-layout.tsx`
- `components/header.tsx`
- `components/landing/**`

Authenticated workspace:

- `app/dashboard/page.tsx`
- `components/dashboard/DashboardContent.tsx`
- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/BookmarkBoard.tsx`
- `components/dashboard/FolderBoard.tsx`
- `components/dashboard/content/**`
- `components/dashboard/nav/**`

Auth and account surfaces:

- `app/login/page.tsx`
- `app/login/LoginForm.tsx`
- `app/reset-password/page.tsx`
- `app/reset-password/ResetPasswordForm.tsx`
- `app/auth/callback/route.ts`
- `app/auth/confirm/route.ts`

Extension-facing routes:

- `app/api/extension/bookmarks/route.ts`
- `app/api/extension/groups/route.ts`
- `app/api/extension/route-adapter.ts`
- `app/api/extension/utils.ts`
- `app/api/bookmarks/visits/route.ts`
- `app/api/metadata/route.ts`

Extension client surfaces included for cross-checking:

- `extension/popup.js`
- `extension/js/api.js`
- `extension/js/grabber.js`
- `extension/js/sessions.js`
- `extension/background.js`
- `extension/content-script.js`
- `extension/twitter-content-script.js`

## Initial Signals Collected

These are loading-context signals, not final findings.

- Client boundary scan found `112` files containing `use client` under `app`, `components`, and `lib`.
- Image/media scan found `6` files using `next/image`, `<Image>`, or `<img>` under `app` and `components`.
- Route loading state scan found `0` `loading.tsx` files under `app`.
- Caching/revalidation markers found:
  - `app/api/metadata/route.ts` uses `fetch(..., { next: { revalidate: 3600 } })`.
  - `lib/dashboard/server/library-mutations.ts` uses `revalidatePath("/dashboard")`.
- Dynamic import markers found:
  - `components/dashboard/content/DashboardSidebar.tsx`
  - `components/dashboard/nav/GroupMenu.tsx`
- API route inventory loaded:
  - `app/api/bookmarks/visits/route.ts`
  - `app/api/extension/bookmarks/route.ts`
  - `app/api/extension/groups/route.ts`
  - `app/api/metadata/route.ts`
  - `app/auth/callback/route.ts`
  - `app/auth/confirm/route.ts`

## Analysis Targets For Next Phase

Core Web Vitals:

- Identify likely LCP element on the marketing page and whether it has stable dimensions/priority treatment.
- Check whether layout-level providers or client navigation push too much JavaScript into the first route.
- Check CLS risk from fonts, theme hydration, dynamic media, and dashboard shell dimensions.

Server/Client boundaries:

- Determine whether public landing components marked `use client` require browser interactivity or can move logic lower.
- Determine whether dashboard must remain a broad client island or can split server-loaded/static subtrees.

Streaming/loading:

- Check whether dashboard, auth, and public routes need `loading.tsx` or localized Suspense boundaries.
- Check whether dashboard data load blocks the full route more than necessary.

Caching:

- Check whether public/static routes are accidentally dynamic.
- Check whether user-scoped dashboard data avoids unsafe shared caching.
- Check whether extension/API metadata caching is correct and safe.

Bundle:

- Check heavy interactive dependencies and whether they are isolated below interaction points.
- Check dynamic imports currently used and whether more would help without harming first interaction.

Route handlers:

- Check extension routes for response shaping, duplicate work, cache headers where safe, and unnecessary cold-path costs.
- Check metadata route for fetch safety, payload limits, and cache behavior.

## Not Run In Loading Phase

- No Lighthouse run.
- No browser profiling.
- No build or bundle analysis.
- No code changes.
- No Supabase MCP diagnostics.
- No Supabase mutations or migrations.
