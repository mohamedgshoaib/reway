"use client"

import { Alert02Icon, Home01Icon, Refresh01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Link from "next/link"
import { useEffect, useState } from "react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Button } from "@/components/ui/button"
import {
  getPaletteThemeClassName,
  isDashboardPaletteTheme,
  type DashboardPaletteTheme,
} from "@/lib/themes"

interface DashboardErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

function readDashboardPaletteTheme(): DashboardPaletteTheme {
  if (typeof document === "undefined") return "default"

  const paletteCookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("reway.dashboard.paletteTheme="))

  if (!paletteCookie) return "default"

  const value = decodeURIComponent(paletteCookie.split("=")[1] || "")
  return isDashboardPaletteTheme(value) ? value : "default"
}

export default function DashboardErrorPage({ error, reset }: DashboardErrorPageProps) {
  const shouldReduceMotion = useReducedMotion()
  const [paletteTheme, setPaletteTheme] = useState<DashboardPaletteTheme>("default")

  useEffect(() => {
    console.error(error)
    setPaletteTheme(readDashboardPaletteTheme())
  }, [error])

  return (
    <RewayLazyMotion>
      <div
        data-dashboard-root
        className={`flex min-h-dvh items-center justify-center bg-background px-4 text-foreground ${getPaletteThemeClassName(paletteTheme)}`}
      >
        <main className="w-full max-w-3xl">
          <m.div
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
            suppressHydrationWarning
            className="space-y-8"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
                <HugeiconsIcon icon={Alert02Icon} size={28} className="text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">We couldn&apos;t load your dashboard</h1>
                <p className="text-muted-foreground">
                  Bookmarks, groups, notes, or todos did not finish loading. Try again, or head
                  back home.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-3xl" onClick={reset}>
                <HugeiconsIcon icon={Refresh01Icon} size={18} className="mr-2" />
                Try again
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-3xl">
                <Link href="/">
                  <HugeiconsIcon icon={Home01Icon} size={18} className="mr-2" />
                  Back to home
                </Link>
              </Button>
            </div>
          </m.div>
        </main>
      </div>
    </RewayLazyMotion>
  )
}
