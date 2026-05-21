import type { ComponentType, SVGProps } from "react"

import type { DashboardPaletteTheme } from "@/lib/themes"
import { cn } from "@/lib/utils"

import { ClaudeAI } from "./claude"
import Cyberpunk from "./cyberpunk"
import Default from "./default"
import LouisVuitton from "./louis-vuitton"
import Milka from "./milka"
import { PerplexityAI } from "./perplexity"
import { Prettier } from "./prettier"
import { Supabase } from "./supabase"
import { T3Stack } from "./t3-chat"
import { Twitter } from "./twitter"
import { Vercel } from "./vercel"
import { Zed } from "./zed"

type ThemeIconComponent = ComponentType<SVGProps<SVGSVGElement>>

const THEME_ICONS: Record<DashboardPaletteTheme, ThemeIconComponent> = {
  default: Default,
  milka: Milka,
  claude: ClaudeAI,
  twitter: Twitter,
  zed: Zed,
  supabase: Supabase,
  "t3-chat": T3Stack,
  perplexity: PerplexityAI,
  cyberpunk: Cyberpunk,
  prettier: Prettier,
  vercel: Vercel,
  "louis-vuitton": LouisVuitton,
}

interface ThemeIconProps {
  theme: DashboardPaletteTheme
  className?: string
}

export function ThemeIcon({ theme, className }: ThemeIconProps) {
  const Icon = THEME_ICONS[theme]

  return (
    <span
      aria-hidden="true"
      className={cn("flex size-4 shrink-0 items-center justify-center overflow-hidden", className)}
    >
      <Icon className="size-full" />
    </span>
  )
}
