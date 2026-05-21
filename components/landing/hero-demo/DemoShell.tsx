"use client"

import { m, useReducedMotion, type Variants } from "motion/react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { useEffect, useState } from "react"

export function DemoShell({
  children,
  controls,
}: {
  children: React.ReactNode
  controls?: React.ReactNode
}) {
  const shouldReduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const showcaseVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  const enableMotion = mounted && !shouldReduceMotion

  return (
    <RewayLazyMotion>
    <m.div
      className="w-full"
      initial={enableMotion ? { opacity: 0 } : false}
      whileInView={enableMotion ? { opacity: 1 } : undefined}
      viewport={{ once: true, margin: "-120px" }}
      transition={enableMotion ? { duration: 0.35, ease: "easeOut" } : undefined}
    >
      <div className="mb-2 px-2 sm:px-3 text-xs font-medium text-muted-foreground">
        <div className="flex flex-col gap-2 items-center sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-block text-center sm:text-left">
            Interactive demo, click around (nothing is saved)
          </span>
          {controls ? (
            <div className="flex justify-center sm:justify-end w-full sm:w-auto">{controls}</div>
          ) : null}
        </div>
      </div>

      <m.div
        id="how-it-works"
        className="w-full overflow-hidden rounded-4xl ring-1 ring-foreground/8 bg-card shadow-none isolate"
        initial={enableMotion ? "hidden" : false}
        whileInView={enableMotion ? "visible" : undefined}
        viewport={{ once: true, margin: "-120px" }}
        variants={enableMotion ? showcaseVariants : undefined}
      >
        {children}
      </m.div>
    </m.div>
    </RewayLazyMotion>
  )
}
