## Skills

### 1- browser-extension-builder

**Triggers**: extension-product, browser-workflows, manifest, monetization, publishing
**Pairs With**: chrome-extension-development, chrome-extension-ui
**Top 2 Rules**: Build extension features around concrete browser jobs, not novelty. Keep the extension focused on moments where browser context is a real advantage.

Full context: `.agents/skills/browser-extension-builder/SKILL.md`

### 2- chrome-extension-development

**Triggers**: chrome-extension, manifest-v3, service-worker, content-script, permissions
**Pairs With**: chrome-extension-ui, browser-extension-builder
**Top 2 Rules**: Preserve a clean split between popup UI, background worker logic, and content scripts. Follow Manifest V3 requirements strictly, including service-worker assumptions.

Full context: `.agents/skills/chrome-extension-development/SKILL.md`

### 3- chrome-extension-ui

**Triggers**: extension-ui, popup, sidepanel, content-script-ui, chrome-apis
**Pairs With**: chrome-extension-development, emil-design-eng
**Top 2 Rules**: Design popup flows for constrained space and short attention spans. Make loading, auth-required, success, and error states explicit and fast to parse.

Full context: `.agents/skills/chrome-extension-ui/SKILL.md`

### 4- dnd-kit-react

**Triggers**: dnd-kit, drag-and-drop, sortable, sensors, collision-detection
**Pairs With**: vercel-react-best-practices, make-interfaces-feel-better
**Top 2 Rules**: Use @dnd-kit patterns for sensors, collision detection, and sortable state instead of ad hoc drag logic. Keep drag affordances and drop feedback explicit and accessible.

Full context: `.agents/skills/dnd-kit-react/SKILL.md`

### 5- emil-design-eng

**Triggers**: ui-polish, design-detail, animation, surfaces, typography
**Pairs With**: make-interfaces-feel-better, tailwind-design-system, web-design-guidelines
**Top 2 Rules**: Favor clarity and restraint over decorative noise. Use spacing, contrast, and motion to communicate structure, not just style.

Full context: `.agents/skills/emil-design-eng/SKILL.md`

### 6- fixing-motion-performance

**Triggers**: animation-jank, transforms, blur, scroll-motion, compositor
**Pairs With**: motion, make-interfaces-feel-better, vercel-react-best-practices
**Top 2 Rules**: Prefer transform and opacity over layout-affecting animation when possible. Eliminate layout thrash before adding more motion.

Full context: `.agents/skills/fixing-motion-performance/SKILL.md`

### 7- grill-me

**Triggers**: grill me, stress-test, challenge plan, design review
**Pairs With**: system-design, new-feature
**Top 2 Rules**: Ask relentless questions until the plan is fully specified. No code or implementation before the spec is confirmed.

Full context: `.agents/skills/grill-me/SKILL.md`

### 8- hydration-guardian

**Triggers**: hydration, ssr, csr, mismatch, suppresshydrationwarning
**Pairs With**: next-best-practices, react-useeffect, vercel-react-best-practices
**Top 2 Rules**: Keep server-rendered output deterministic with what the client will hydrate. Move browser-only branches behind client boundaries or two-pass patterns when necessary.

Full context: `.agents/skills/hydration-guardian/SKILL.md`

### 9- improve-codebase-architecture

**Triggers**: architecture, refactor, modularity, coupling, codebase-health
**Pairs With**: vercel-composition-patterns, supabase-postgres-best-practices, system-design
**Top 2 Rules**: Refactor around domain concepts, not file-count aesthetics. Reduce tight coupling where feature growth is already causing friction.

Full context: `.agents/skills/improve-codebase-architecture/SKILL.md`

### 10- make-interfaces-feel-better

**Triggers**: polish, microinteractions, hover-states, shadows, typography
**Pairs With**: emil-design-eng, fixing-motion-performance, tailwind-design-system
**Top 2 Rules**: Improve feel through small, compounding details rather than one dramatic effect. Use motion and shadows to reinforce hierarchy and affordance.

Full context: `.agents/skills/make-interfaces-feel-better/SKILL.md`

### 11- motion

**Triggers**: motion-library, gestures, layout-animation, motion-values, transitions
**Pairs With**: fixing-motion-performance, make-interfaces-feel-better
**Top 2 Rules**: Use library primitives intentionally instead of scattering ad hoc animation props. Match animation technique to the UX need: gestures, presence, layout, or scroll.

Full context: `.agents/skills/motion/SKILL.md`

### 12- next-best-practices

**Triggers**: nextjs, app-router, server-actions, route-handlers, metadata, bundling
**Pairs With**: vercel-react-best-practices, react-useeffect, hydration-guardian
**Top 2 Rules**: Default to Server Components for data loading and only opt into client boundaries when interactivity truly requires it. Keep RSC boundaries valid: no async client components, no non-serializable props crossing server-client edges.

Full context: `.agents/skills/next-best-practices/SKILL.md`

### 13- nextjs-client-cookie-pattern

**Triggers**: cookies, preferences, server-actions, client-triggered-mutation, nextjs
**Pairs With**: next-best-practices, react-useeffect
**Top 2 Rules**: Mutate server-owned cookies through a server action, not directly from client-only logic. Keep the client component thin and event-focused.

Full context: `.agents/skills/nextjs-client-cookie-pattern/SKILL.md`

### 14- postgresql-table-design

**Triggers**: schema-design, indexes, constraints, migrations, postgres-schema
**Pairs With**: supabase-postgres-best-practices, supabase
**Top 2 Rules**: Design tables to protect invariants with constraints, not just application code. Name fields and relations to reflect actual domain meaning.

Full context: `.agents/skills/postgresql-table-design/SKILL.md`

### 15- react-doctor

**Triggers**: react-doctor, lint, accessibility, bundle, cleanup
**Pairs With**: vercel-react-best-practices, react-useeffect
**Top 2 Rules**: Use before committing or finishing a feature to catch quality regressions. Check lint, accessibility, and rendering risks in React surfaces.

Full context: `.agents/skills/react-doctor/SKILL.md`

### 16- react-hook-form

**Triggers**: react-hook-form, useform, usefieldarray, usecontroller
**Pairs With**: zod
**Top 2 Rules**: Prefer React Hook Form primitives for performance over custom controlled inputs. Use field arrays and controllers to avoid unnecessary rerenders.

Full context: `.agents/skills/react-hook-form/SKILL.md`

### 17- react-useeffect

**Triggers**: useeffect, derived-state, synchronization, client-state, react
**Pairs With**: vercel-react-best-practices, hydration-guardian, next-best-practices
**Top 2 Rules**: Do not use `useEffect` for values that can be derived during render. Use effects only for real synchronization with external systems.

Full context: `.agents/skills/react-useeffect/SKILL.md`

### 18- shadcn

**Triggers**: shadcn, components.json, ui-components, radix, design-system
**Pairs With**: tailwind-design-system, make-interfaces-feel-better
**Top 2 Rules**: Use existing local shadcn components before inventing custom replacements. Follow component composition requirements strictly, especially for overlays, grouped items, cards, and tabs.

Full context: `.agents/skills/shadcn/SKILL.md`

### 19- supabase

**Triggers**: supabase, auth, rls, realtime, storage, edge-functions
**Pairs With**: supabase-postgres-best-practices, postgresql-table-design, next-best-practices
**Top 2 Rules**: Follow Supabase-specific SSR and auth patterns for correct session handling. Treat RLS and user scoping as non-negotiable.

Full context: `.agents/skills/supabase/SKILL.md`

### 20- supabase-postgres-best-practices

**Triggers**: supabase, postgres, query-optimization, indexes, schema
**Pairs With**: postgresql-table-design, supabase, next-best-practices
**Top 2 Rules**: Design queries and schema changes around Supabase/Postgres realities, not generic ORM habits. Preserve strong user scoping and safe auth boundaries in all data access patterns.

Full context: `.agents/skills/supabase-postgres-best-practices/SKILL.md`

### 21- system-design

**Triggers**: system-design, scale, distributed, high-availability, rate-limiter
**Pairs With**: new-feature, improve-codebase-architecture
**Top 2 Rules**: Use a structured approach to capacity, bottlenecks, and trade-offs. Ground architecture choices in clear requirements and scale targets.

Full context: `.agents/skills/system-design/SKILL.md`

### 22- tailwind-css-patterns

**Triggers**: tailwind, utilities, layout, responsive, typography
**Pairs With**: tailwind-design-system, make-interfaces-feel-better
**Top 2 Rules**: Prefer utility-first composition over ad hoc CSS. Build responsive behavior into components from the start.

Full context: `.agents/skills/tailwind-css-patterns/SKILL.md`

### 23- tailwind-design-system

**Triggers**: tailwind-v4, design-tokens, css-variables, theming, responsive-ui
**Pairs With**: shadcn, make-interfaces-feel-better, emil-design-eng
**Top 2 Rules**: Extend the existing token system instead of introducing raw one-off values. Keep styles semantic and component-driven so themes remain swappable.

Full context: `.agents/skills/tailwind-design-system/SKILL.md`

### 24- tanstack-query

**Triggers**: tanstack-query, react-query, server-state, caching, invalidation
**Pairs With**: vercel-react-best-practices
**Top 2 Rules**: Treat server state as distinct from client UI state. Use query invalidation and caching intentionally to avoid stale data.

Full context: `.agents/skills/tanstack-query/SKILL.md`

### 25- typescript-advanced-types

**Triggers**: generics, conditional-types, mapped-types, template-literals, utility-types
**Pairs With**: vercel-composition-patterns
**Top 2 Rules**: Use advanced types to remove ambiguity, not to impress. Keep type utilities reusable and named around domain meaning.

Full context: `.agents/skills/typescript-advanced-types/SKILL.md`

### 26- vercel-composition-patterns

**Triggers**: composition, compound-components, render-props, context, component-api
**Pairs With**: vercel-react-best-practices, shadcn
**Top 2 Rules**: Refactor bloated components toward clearer composition instead of adding more flags. Choose composition patterns that make misuse harder.

Full context: `.agents/skills/vercel-composition-patterns/SKILL.md`

### 27- vercel-react-best-practices

**Triggers**: react, performance, rendering, memoization, data-fetching, nextjs
**Pairs With**: next-best-practices, react-useeffect, vercel-composition-patterns, hydration-guardian
**Top 2 Rules**: Minimize client-side surface area and keep computation near the server when possible. Reduce rerender churn by designing state ownership carefully instead of memoizing reactively.

Full context: `.agents/skills/vercel-react-best-practices/SKILL.md`

### 28- virtual-lists

**Triggers**: virtualization, windowing, large-lists, performance, scroll-jank
**Pairs With**: vercel-react-best-practices, fixing-motion-performance
**Top 2 Rules**: Do not virtualize prematurely; confirm scale pain first. When virtualization is justified, design around user interactions like selection, drag, and keyboard nav.

Full context: `.agents/skills/virtual-lists/SKILL.md`

### 29- web-design-guidelines

**Triggers**: ui-review, ux-audit, design-review, accessibility-review, quality-bar
**Pairs With**: emil-design-eng, make-interfaces-feel-better
**Top 2 Rules**: Review the interface from the user’s perspective, not just the code’s perspective. Flag clarity, hierarchy, and affordance issues before cosmetic nitpicks.

Full context: `.agents/skills/web-design-guidelines/SKILL.md`

### 30- wrap-up

**Triggers**: wrap-up, session end, session log
**Pairs With**: None
**Top 2 Rules**: Run the `/wrap-up` skill at session end. Write the session log in `spec/sessions/` with verified file paths.

Full context: `.agents/skills/wrap-up/SKILL.md`

### 31- zod

**Triggers**: zod, schema, validation, safeparse, zod-infer
**Pairs With**: react-hook-form
**Top 2 Rules**: Use Zod schemas for parsing and validation instead of ad hoc checks. Prefer `safeParse` with structured error handling for user feedback.

Full context: `.agents/skills/zod/SKILL.md`
