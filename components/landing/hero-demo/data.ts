import type { HeroBookmark, HeroGroup, HeroIcon } from "./types"

export const PREVIEW_BOOKMARKS: Omit<HeroBookmark, "id">[] = [
  {
    title: "Linear – The system for product development",
    domain: "linear.app",
    url: "https://linear.app",
    date: "Sep 12",
    favicon: "https://www.google.com/s2/favicons?domain=linear.app&sz=64",
    group: "Research",
  },
  {
    title: "Vercel: Build and deploy the best web experiences with the AI Cloud – Vercel",
    domain: "vercel.com",
    url: "https://vercel.com",
    date: "Sep 10",
    favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
    group: "Inspiration",
  },
  {
    title: "The Foundation for your Design System - shadcn/ui",
    domain: "ui.shadcn.com",
    url: "https://ui.shadcn.com",
    date: "Sep 09",
    favicon: "https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=64",
    group: "Inspiration",
  },
  {
    title: "Figma: The Collaborative Interface Design Tool",
    domain: "figma.com",
    url: "https://www.figma.com",
    date: "Sep 07",
    favicon: "https://www.google.com/s2/favicons?domain=figma.com&sz=64",
    group: "Build",
  },
  {
    title: "The AI workspace that works for you. | Notion",
    domain: "notion.so",
    url: "https://www.notion.so",
    date: "Sep 06",
    favicon: "https://www.google.com/s2/favicons?domain=notion.so&sz=64",
    group: "Research",
  },
  {
    title: "GitHub · Change is constant. GitHub keeps you ahead.",
    domain: "github.com",
    url: "https://github.com",
    date: "Sep 03",
    favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
    group: "Build",
  },
  {
    title: "MDN Web Docs",
    domain: "developer.mozilla.org",
    url: "https://developer.mozilla.org",
    date: "Sep 02",
    favicon: "https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64",
    group: "Learn",
  },
  {
    title: "React",
    domain: "react.dev",
    url: "https://react.dev",
    date: "Sep 01",
    favicon: "https://www.google.com/s2/favicons?domain=react.dev&sz=64",
    group: "Learn",
  },
  {
    title: "JavaScript With Syntax For Types.",
    domain: "www.typescriptlang.org",
    url: "https://www.typescriptlang.org",
    date: "Aug 30",
    favicon: "https://www.google.com/s2/favicons?domain=www.typescriptlang.org&sz=64",
    group: "Learn",
  },
]

export function getInitialHeroGroups(icons: {
  folder: HeroIcon
  search: HeroIcon
  bulb: HeroIcon
  tools: HeroIcon
}): HeroGroup[] {
  return [
    { id: "all", label: "All Bookmarks", icon: icons.folder, color: null },
    { id: "Research", label: "Research", icon: icons.search, color: "#3b82f6" },
    {
      id: "Inspiration",
      label: "Inspiration",
      icon: icons.bulb,
      color: "#f59e0b",
    },
    { id: "Build", label: "Build", icon: icons.tools, color: "#10b981" },
    { id: "Learn", label: "Learn", icon: icons.folder, color: "#8b5cf6" },
  ]
}
