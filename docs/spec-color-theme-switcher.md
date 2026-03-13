# Spec: Color Theme Switcher

## Overview

Add the ability for users to switch between 19 curated color themes. The switcher lives in the **avatar dropdown menu** in the dashboard header. Each theme entry shows **color preview dots** (primary, background, accent) beside the theme name. The active theme's color tokens are applied live to `document.documentElement` via inline CSS custom properties.

**Critical constraint:** Only color tokens are swapped. `--radius`, `--font-*`, `--shadow-*`, `--tracking-normal`, and `--spacing` are **never touched** — these remain under coss/ui's control at all times.

---

## Existing Files to Be Aware Of

- `components/theme-provider.tsx` — already wraps `next-themes` for dark/light mode. **Do not break this.**
- `components/header.tsx` — contains the avatar dropdown. **This is where the theme entry point goes.**
- `components/mode-toggle.tsx` — existing dark mode toggle for reference style.
- `lib/` — place new theme files here.
- `hooks/` — place new hooks here.
- `docs/themes.md` and `docs/themes-2.md` — source of truth for all 19 theme color values.

---

## Files to Create

### 1. `lib/themes.ts`

A typed registry of all 19 themes. Each entry contains **only color tokens** — no radius, no font, no shadow keys.

```ts
export type ThemeColors = {
  background: string
  foreground: string
  card: string
  "card-foreground": string
  popover: string
  "popover-foreground": string
  primary: string
  "primary-foreground": string
  secondary: string
  "secondary-foreground": string
  muted: string
  "muted-foreground": string
  accent: string
  "accent-foreground": string
  destructive: string
  "destructive-foreground": string
  border: string
  input: string
  ring: string
  "chart-1": string
  "chart-2": string
  "chart-3": string
  "chart-4": string
  "chart-5": string
  sidebar: string
  "sidebar-foreground": string
  "sidebar-primary": string
  "sidebar-primary-foreground": string
  "sidebar-accent": string
  "sidebar-accent-foreground": string
  "sidebar-border": string
  "sidebar-ring": string
}

export type Theme = {
  id: string
  label: string
  light: ThemeColors
  dark: ThemeColors
}

export const THEMES: Theme[] = [ /* all 19 themes populated from docs/themes.md and docs/themes-2.md */ ]

export const DEFAULT_THEME_ID = "amber-minimal"
```

The 19 theme IDs (slugified):
1. `amber-minimal`
2. `amethyst-haze`
3. `claude`
4. `modern-minimal`
5. `notebook`
6. `supabase`
7. `t3-chat`
8. `perplexity`
9. `sage-green`
10. `sunset-horizon` *(replaces Dark Forge — see themes-2.md)*
11. `cyberpunk`
12. `kodama-grove`
13. `crimson`
14. `retro`
15. `tangerine`
16. `vercel`
17. `vintage-paper`
18. `bubblegum`
19. *(last theme in themes-2.md)*

---

### 2. `hooks/use-color-theme.ts`

Manages the active color theme ID. Persists to `localStorage` under key `"reway-color-theme"`. On mount, reads saved value (or defaults to `"amber-minimal"`). Applies color tokens to `document.documentElement` whenever theme ID or dark/light mode changes.

```ts
"use client"

export function useColorTheme(): {
  themeId: string
  setThemeId: (id: string) => void
}
```

**Application logic inside the hook:**
1. Find the `Theme` object from `THEMES` by ID.
2. Read `resolvedTheme` from `next-themes`'s `useTheme()` to know if dark or light.
3. For each key in `ThemeColors`, call `document.documentElement.style.setProperty(`--${key}`, value)`.
4. **Never set** `--radius`, `--font-*`, `--shadow-*`, `--tracking-normal`, or `--spacing`.

---

### 3. `components/color-theme-applicator.tsx`

A tiny `"use client"` component that just calls `useColorTheme()` to trigger the side effect. Renders `null`. Placed once inside the root layout so the theme is always applied.

```tsx
"use client"
export function ColorThemeApplicator() {
  useColorTheme()
  return null
}
```

---

### 4. `components/theme-switcher.tsx`

A sub-menu or popover triggered from the avatar dropdown. Shows all 19 themes as a scrollable list. Each row:

```
● ● ●  Theme Name         ✓ (if active)
```

The three dots are small circles (`w-3 h-3 rounded-full`) with inline `backgroundColor` set to the theme's `primary`, `background`, and `accent` values from the **light** variant (always use light colors for the preview dots regardless of current mode — more visually distinct).

- Clicking a theme row calls `setThemeId(theme.id)`.
- The active theme row gets a checkmark icon.
- Component is `"use client"`.

---

## Files to Modify

### `app/layout.tsx`

Add `<ColorThemeApplicator />` inside the body, alongside the existing `<ThemeProvider>`. This ensures the color effect runs on every page.

### `components/header.tsx`

In the avatar `DropdownMenu`, add a new item **"Appearance"** (with a Palette icon) that opens the `<ThemeSwitcher />` as a `DropdownMenuSub` or a small `Sheet`/`Popover`. The entry should sit above or below the existing dark mode toggle.

The final avatar dropdown structure should look like:

```
Avatar dropdown
├── [user name / email]
├── ─────────────
├── Appearance  ›
│     └── [19 theme rows with color dots]
├── Dark mode toggle   (existing)
├── ─────────────
├── Sign out
```

---

## What NOT to Do

- Do **not** write any CSS blocks into `globals.css` for these themes.
- Do **not** set `--radius`, `--font-sans`, `--font-serif`, `--font-mono`, `--shadow-*`, `--shadow-x`, `--shadow-y`, `--shadow-blur`, `--shadow-spread`, `--shadow-opacity`, `--shadow-color`, `--tracking-normal`, or `--spacing` from the theme switcher.
- Do **not** use `data-theme` attribute or CSS selectors for theming — use only `element.style.setProperty`.
- Do **not** add a new `ThemeProvider` wrapper — reuse the existing `next-themes` one in `components/theme-provider.tsx`.
- Do **not** modify `globals.css` `@theme inline` block.

---

## Source Data

All color values are in:
- `docs/themes.md` — themes 1–11
- `docs/themes-2.md` — themes 12–19 (note: the theme titled "Theme to replace Dark Forge theme, number 10" is `sunset-horizon`, slot #10)

Extract only the `:root { }` and `.dark { }` color variables from each theme block. Ignore all other properties.
