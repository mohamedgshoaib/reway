export type DashboardPaletteTheme =
  | "default"
  | "milka"
  | "claude"
  | "twitter"
  | "zed"
  | "supabase"
  | "t3-chat"
  | "perplexity"
  | "cyberpunk"
  | "prettier"
  | "vercel"
  | "louis-vuitton";

export interface DashboardThemeDefinition {
  value: DashboardPaletteTheme;
  label: string;
}

export const DASHBOARD_THEMES: DashboardThemeDefinition[] = [
  {
    value: "default",
    label: "Default",
  },
  {
    value: "milka",
    label: "Milka",
  },
  {
    value: "claude",
    label: "Claude",
  },
  {
    value: "twitter",
    label: "Twitter",
  },
  {
    value: "zed",
    label: "Zed",
  },
  {
    value: "supabase",
    label: "Supabase",
  },
  {
    value: "t3-chat",
    label: "T3 Chat",
  },
  {
    value: "perplexity",
    label: "Perplexity",
  },
  {
    value: "cyberpunk",
    label: "Cyberpunk",
  },
  {
    value: "prettier",
    label: "Prettier",
  },
  {
    value: "vercel",
    label: "Vercel",
  },
  {
    value: "louis-vuitton",
    label: "Louis Vuitton",
  },
];

export function isDashboardPaletteTheme(
  value: string,
): value is DashboardPaletteTheme {
  return DASHBOARD_THEMES.some((theme) => theme.value === value);
}

export function getPaletteThemeClassName(theme: DashboardPaletteTheme) {
  if (theme === "default") return "";
  return `theme-${theme}`;
}
