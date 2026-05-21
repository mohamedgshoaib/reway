"use client"

import Image from "next/image"

import { Search01Icon, BulbIcon, ToolsIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { m, useReducedMotion } from "motion/react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { useEffect, useMemo, useRef, useState } from "react"

type LinkItem = {
  id: string
  label: string
  group: "Research" | "Inspiration" | "Build"
  favicon: string
}

const LINKS: LinkItem[] = [
  {
    id: "l1",
    label: "linear.app",
    group: "Research",
    favicon: "https://www.google.com/s2/favicons?domain=linear.app&sz=64",
  },
  {
    id: "l2",
    label: "vercel.com",
    group: "Inspiration",
    favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
  },
  {
    id: "l3",
    label: "ui.shadcn.com",
    group: "Inspiration",
    favicon: "https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=64",
  },
  {
    id: "l4",
    label: "figma.com",
    group: "Build",
    favicon: "https://www.google.com/s2/favicons?domain=figma.com&sz=64",
  },
  {
    id: "l5",
    label: "notion.so",
    group: "Research",
    favicon: "https://www.google.com/s2/favicons?domain=notion.so&sz=64",
  },
  {
    id: "l6",
    label: "github.com",
    group: "Build",
    favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
  },
]

export function GroupsDemo() {
  const shouldReduceMotion = useReducedMotion()
  const [phase, setPhase] = useState(shouldReduceMotion ? 1 : 0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Mobile breakpoint
  const isMobile = containerWidth > 0 && containerWidth < 480

  useEffect(() => {
    if (shouldReduceMotion) return undefined
    const timer = setInterval(() => {
      setPhase((prev) => (prev === 0 ? 1 : 0))
    }, 3400)
    return () => clearInterval(timer)
  }, [shouldReduceMotion])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const ro = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect?.width ?? 0)
      if (next > 0) setContainerWidth(next)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Columns Layout Logic
  const layout = useMemo(() => {
    // Defined columns for Desktop vs Mobile
    // Desktop: Research (Left) | Inspiration (Center) | Build (Right)
    // Mobile: Research (Left) | Inspiration + Build (Right/merged)

    // Position config
    const safeWidth = containerWidth || 520

    // Calculate offsets based on available width
    // Use ~30-35% of width for spacing side columns, but capped
    const colSpacing = isMobile ? Math.min(140, safeWidth * 0.25) : Math.min(180, safeWidth * 0.3)

    // Group definitions
    const groups = {
      Research: { x: -colSpacing, items: [] as LinkItem[] },
      Inspiration: { x: isMobile ? colSpacing : 0, items: [] as LinkItem[] },
      Build: { x: isMobile ? colSpacing : colSpacing, items: [] as LinkItem[] },
    }

    // Distribute links to groups
    LINKS.forEach((link) => {
      if (isMobile && link.group === "Build") {
        // On mobile, merge 'Build' into 'Inspiration' column visually if needed,
        // OR iterate strictly to assign positions.
        // Let's stick to the 2-column visual defined above.
        // We will assign them to the 'Build' config even if it overlaps 'Inspiration' x-wise?
        // No, if we want them stacked, we need to manage the Y-index accumulation correctly.
        // Simplest approach: Separate mapped arrays.
      }
    })

    // We'll calculate Y positions by iterating over the links and tracking counts per visual column
    const columnCounts = {
      left: 0, // Research
      center: 0, // Inspiration (Desktop only)
      right: 0, // Build (Desktop) or Insp+Build (Mobile)
    }

    const groupedPositions: Record<string, { x: number; y: number; rotate: number }> = {}

    LINKS.forEach((link) => {
      let colKey: "left" | "center" | "right"
      let xBase = 0

      if (link.group === "Research") {
        colKey = "left"
        xBase = groups.Research.x
      } else if (link.group === "Inspiration") {
        colKey = isMobile ? "right" : "center"
        xBase = groups.Inspiration.x
      } else {
        // Build
        colKey = "right"
        xBase = groups.Build.x
      }

      const indexInCol = columnCounts[colKey]
      columnCounts[colKey]++

      // Spacing details
      const rowHeight = isMobile ? 38 : 42 // Tighter vertical spacing
      const yBase = 10 // Start slightly lower than header

      groupedPositions[link.id] = {
        x: xBase,
        y: yBase + indexInCol * rowHeight,
        rotate: 0,
      }
    })

    return groupedPositions
  }, [containerWidth, isMobile])

  const scatteredPositions = useMemo(() => {
    // Deterministic random positions based on ID to ensure consistent "mess"
    // Spread should be centered but not too wide to overflow
    const safeWidth = containerWidth || 520
    const limitX = Math.min(safeWidth * 0.4, 180) // Restrict to safe area

    // Hardcoded offsets for specific IDs to ensure it looks good (designed mess)
    // instead of pure random which might look bad
    const presets: Record<string, { x: number; y: number; rotate: number }> = {
      l1: { x: -limitX * 0.6, y: -20, rotate: -12 },
      l2: { x: limitX * 0.2, y: -30, rotate: 6 },
      l3: { x: limitX * 0.7, y: 15, rotate: -4 },
      l4: { x: limitX * 0.9, y: -25, rotate: 10 },
      l5: { x: -limitX * 0.2, y: 35, rotate: 8 },
      l6: { x: -limitX * 0.8, y: 30, rotate: -8 },
    }

    return presets
  }, [containerWidth])

  const targets = phase === 1 ? layout : scatteredPositions

  // Header Visibility
  // We only show headers relevant to the columns
  // Desktop: Research, Inspiration, Build
  // Mobile: Research, Inspiration (Build merged matches Inspiration header roughly or just generic?)
  // User mockup showed [group1] [group2] [group3], we try to respect that availability.
  // On mobile we'll show "Research" and "Inspiration / Build" or just have 2 columns.

  // Dynamic header positions following the column X values
  const headers = [
    {
      title: "Research",
      x: layout.l1.x,
      count: 2,
      icon: Search01Icon,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Inspiration",
      x: isMobile ? layout.l2.x : layout.l2.x,
      count: isMobile ? 4 : 2,
      icon: BulbIcon,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Build",
      x: layout.l4.x,
      count: 2,
      hidden: isMobile,
      icon: ToolsIcon,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ]

  // Transition settings
  const transition = {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1] as const,
  }

  return (
    <RewayLazyMotion>
    <div ref={containerRef} className="relative w-full h-52 sm:h-56 overflow-hidden select-none">
      {/* Centered Content Wrapper */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Render Group Headers */}
        {headers.map(
          (h) =>
            !h.hidden && (
              <m.div
                key={h.title}
                className="absolute flex items-center gap-2 rounded-xl ring-1 ring-foreground/8 bg-background/80 backdrop-blur-sm px-3 py-2"
                initial={{ opacity: 0, y: -40 }}
                animate={{
                  x: h.x,
                  // When grouped (phase 1): sit above links at -40
                  // When scattered (phase 0): float up slightly at -50 and fade out
                  y: phase === 1 ? -40 : -50,
                  opacity: phase === 1 ? 1 : 0,
                }}
                transition={transition}
              >
                <HugeiconsIcon icon={h.icon} size={12} className={h.color} />
                <span className="text-[10px] font-medium text-foreground">{h.title}</span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground ml-auto">
                  {h.count}
                </span>
              </m.div>
            ),
        )}

        {/* Render Links */}
        {LINKS.flatMap((link) => (!isMobile || link.group !== "Build" ? [link] : [])).map((link) => {
          const pos = targets[link.id]
          // Adjust Y-base for links so they sit below headers.
          // Headers are at -40. Links start at roughly 0 to +80.
          // Let's shift them slightly up to balance the visual center with headers included.
          // Actually, if we keep 'y' from layout logic (approx 10..90 relative),
          // we should subtract a bit to center the whole block vertically.
          const centeredY = (pos?.y ?? 0) - 10

          return (
            <m.div
              key={link.id}
              className="absolute flex items-center gap-2 rounded-xl ring-1 ring-foreground/8 bg-muted/30 px-3 py-2 will-change-transform max-w-36"
              animate={{
                x: pos?.x ?? 0,
                y: centeredY,
                rotate: pos?.rotate ?? 0,
              }}
              transition={transition}
            >
              <Image
                src={link.favicon}
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0 rounded-full object-cover"
                unoptimized
              />
              <span className="text-[10px] font-medium text-foreground whitespace-nowrap truncate">
                {link.label}
              </span>
            </m.div>
          )
        })}
      </div>
    </div>
    </RewayLazyMotion>
  )
}
