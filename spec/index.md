## Reway

Reway is a personal bookmark operating system for people who save a lot and need to find things later. It turns single links, grabbed batches, and full tab sessions into a searchable, themed, cross-device library via a synced web dashboard and a Chrome extension, so saving never feels like throwing things away.

### Core Purpose

For external users, Reway makes saving links fast and calm, then restores structure through grouping and enrichment so retrieval is effortless.
For internal users (builders and operators), Reway provides a clear capture-to-enrichment pipeline, strict user-scoped auth boundaries, and predictable UI surfaces across web and extension.

This project is not meant to become:

- A generic all-purpose workspace or knowledge base
- A thin browser-folder replacement with no enrichment or cross-device library

> **The Central Mechanism** — Capture first, organize immediately, enrich asynchronously. A save operation should feel instant; titles, favicons, OG images, duplicate checks, and realtime sync should improve the result without blocking the initial action.

### Product Model

**What it is:**

- A capture-first bookmark OS spanning web + extension
- A themed, searchable library that turns saved links into a reusable workspace

**Core truths that guide every decision:**

- Save latency must be near-zero; enrichment can lag
- User data is always private-by-default and auth-scoped
- Visual scanning (favicons, OG images, group color) is a first-class retrieval aid

**Signature mechanics:**

- Immediate save + delayed enrichment
- Extension-first capture (page, grabbed links, session)
- Unified library model (bookmarks, groups, notes, todos)
- Virtual group semantics (All, Most Visited, No Group)
- Visit-aware ranking derived from usage signals

### Target Audience

#### External

- Researchers and knowledge workers
- Developers and designers collecting references
- Heavy tab users preserving sessions
- People frustrated by browser-native bookmarks

**Profile:** 20–45, desktop-first with laptop/phone use, moderately technical, intent on fast capture and fast retrieval, needs to feel calm, organized, and in control.

#### Internal

- Product/design/engineering
- Support/ops

**Profile:** High technical comfort, expects predictable App Router patterns, authenticated data boundaries, and a dashboard that can scale to large collections without regressing UX.

### Non-Negotiable Principles

1. No unscoped data mutations; every bookmark/group/note/todo action is user-bound with Supabase auth enforcement.
2. No blocking saves on enrichment; metadata fetch happens after insertion and may resolve to explicit failed states.

### Product Differentiators

| Area               | Common Pattern                        | Reway                                                                    |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| Capture flow       | Save into browser-local folders       | Save from web app or extension into a synced personal library            |
| Post-save quality  | Raw URL or weak title metadata        | Async enrichment for title, description, favicon, and OG image           |
| Organization model | Flat folders with limited flexibility | Groups, board/list/card/folder views, notes, todos, command workflows    |
| Session handling   | Tabs are ephemeral                    | Current-window tab sessions can be converted into a reusable saved group |
| Retrieval          | Slow scrolling through folders        | Fast dashboard search, view switching, keyboard-first command bar        |
| Visual identity    | Generic bookmark UI                   | Strong theming, iconography, and polished dashboard surfaces             |

### Architecture & Constraints

- App Router is the source of truth. Prefer Server Components for data loading, Server Actions for authenticated mutations, and Route Handlers for extension or external HTTP access.
- Supabase auth boundaries are non-negotiable and must remain user-scoped.
- Preferences are cookie-backed (view mode, density, palette, notes/todos visibility) and must degrade to validated defaults.
- URLs are normalized before persistence; duplicate detection uses normalized URLs.
- Metadata enrichment is a secondary phase; new bookmarks may start pending/minimal.
- Metadata fetching must block localhost/private-network targets to reduce SSRF risk.
- System groups are virtual UI constructs and must be translated to stored DB values correctly.
- New items reserve low `order_index` to keep “recently saved first” without full reindexing.
- Extension stays MV3 and lean, with clear separation between popup, background, and content scripts.
- Theme work must preserve semantic CSS variables in `app/globals.css`.

#### System Internals

- Marketing surface lives in `app/page.tsx` and `components/landing/`.
- Authenticated workspace is the dashboard route with server-side data and client orchestration.
- Capture surface is the extension.
- Data/auth surface is Supabase-backed server actions and route handlers.

#### Composition Model

- `components/dashboard/DashboardContent.tsx` is the orchestration hub.
- Hooks own single concerns (realtime sync, import/export, actions, filtering, preferences).
- `DashboardLayout` composes sidebars, nav, command bar, boards, and selection.
- Two main render modes: Folder Board and Bookmark Board.

#### Data Model & Flow

- Entities: bookmarks, groups, notes, todos, profiles.
- Bookmark lifecycle: capture → normalize → insert → enrich → broadcast/realtime update.
- Ordering: new items appear at the top via lower `order_index`.

### Technology Stack

**Core**

- Next.js 16 App Router + React 19
- TypeScript
- Tailwind CSS v4

**Backend & Data**

- Supabase SSR + Postgres
- Supabase Auth

**UI & Components**

- shadcn/ui (`radix-maia` preset)
- Hugeicons

**Interactions & State**

- Server Components + Server Actions + Route Handlers
- Cookie-backed preferences

**Tooling**

- ESLint
- pnpm

### Working Posture For Agents

Agents working in this repository should think in this order:

1. What is the product truth (capture first, enrich later)?
2. Who owns this visible surface (landing, dashboard, extension, data/auth)?
3. Are auth boundaries and URL hygiene preserved?
4. Are themes/tokens and preference defaults preserved?
5. Is the system becoming clearer or more mixed?

Agents should behave as system-design partners first and implementation agents second.
