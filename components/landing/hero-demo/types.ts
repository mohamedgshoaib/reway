import type { ComponentType, SVGProps } from "react"
import type { IconSvgElement } from "@hugeicons/react"

export type HeroGroupId = "all" | "No Group" | "Research" | "Inspiration" | "Build" | "Learn"

export type HeroIcon = IconSvgElement

export type HeroGroup = {
  id: HeroGroupId | string
  label: string
  icon: HeroIcon
  color?: string | null
}

export type HeroBookmark = {
  id: string
  title: string
  domain: string
  url: string
  date: string
  favicon: string
  group: Exclude<HeroGroupId, "all">
  shimmerUrl?: boolean
  faviconIcon?: ComponentType<SVGProps<SVGSVGElement>>
}
