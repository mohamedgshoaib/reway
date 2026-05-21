"use client"

import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as m from "motion/react-m"
import { AnimatePresence, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Kbd } from "@/components/ui/kbd"
import TextShimmer from "@/components/ui/text-shimmer"
import { demoLinks } from "./demo-data"

export function ExtractDemo() {
  const shouldReduceMotion = useReducedMotion()
  const typingText = "check: linear.app, vercel.com, and ui.shadcn.com"

  const [mounted, setMounted] = useState(false)

  const [phase, setPhase] = useState(0)
  const [typedIndex, setTypedIndex] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!shouldReduceMotion) return
    const timer = setTimeout(() => {
      setPhase(2)
      setTypedIndex(typingText.length)
    }, 0)
    return () => clearTimeout(timer)
  }, [mounted, shouldReduceMotion, typingText.length])

  useEffect(() => {
    if (!mounted || shouldReduceMotion || phase !== 0) return undefined

    let intervalId: ReturnType<typeof setInterval> | null = null

    const resetTimer = setTimeout(() => {
      setTypedIndex(0)
      intervalId = setInterval(() => {
        setTypedIndex((prev) => {
          if (prev >= typingText.length) {
            if (intervalId) clearInterval(intervalId)
            setTimeout(() => setPhase(1), 400)
            return prev
          }
          return prev + 1
        })
      }, 28)
    }, 0)

    return () => {
      clearTimeout(resetTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [mounted, phase, shouldReduceMotion, typingText])

  useEffect(() => {
    if (!mounted || shouldReduceMotion || phase !== 1) return undefined
    const timer = setTimeout(() => setPhase(2), 2600)
    return () => clearTimeout(timer)
  }, [mounted, phase, shouldReduceMotion])

  useEffect(() => {
    if (!mounted || shouldReduceMotion || phase !== 2) return undefined
    const timer = setTimeout(() => setPhase(0), 3200)
    return () => clearTimeout(timer)
  }, [mounted, phase, shouldReduceMotion])

  const inputLinks = useMemo(
    () => ["https://linear.app/board", "https://vercel.com/ideas", "https://ui.shadcn.com"],
    [],
  )

  const enableMotion = mounted && !shouldReduceMotion

  return (
    <RewayLazyMotion>
      <div className="w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl ring-1 ring-foreground/8 bg-background px-3 py-2 text-xs text-muted-foreground">
          <span className="flex size-7 items-center justify-center rounded-xl ring-1 ring-foreground/8 bg-muted/40 text-foreground">
            <HugeiconsIcon icon={Add01Icon} size={14} />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-start text-foreground">
            <span className="w-full whitespace-normal break-all text-[12px] font-medium leading-snug sm:text-sm">
              {typingText.slice(0, typedIndex)}
            </span>
          </span>
          <div className="ml-auto hidden shrink-0 items-center text-[10px] text-muted-foreground sm:flex">
            <Kbd className="h-4.5 min-w-4.5 px-1.5 text-[9px]">CtrlK</Kbd>
          </div>
        </div>
        <div className="relative h-27">
          <AnimatePresence mode="wait">
            {phase === 0 ? (
              <m.div
                key="adding"
                className="grid gap-1.5"
                initial={enableMotion ? { opacity: 0, y: 8 } : false}
                animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
                exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
                transition={enableMotion ? { duration: 0.3 } : undefined}
              >
                {inputLinks.map((link) => (
                  <div
                    key={link}
                    className="flex h-8 items-center justify-between rounded-xl ring-1 ring-dashed ring-foreground/8 px-3 text-[11px] opacity-40"
                  />
                ))}
              </m.div>
            ) : null}
            {phase === 1 ? (
              <m.div
                key="fetching"
                className="grid gap-1.5"
                initial={enableMotion ? { opacity: 0, y: 8 } : false}
                animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
                exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
                transition={enableMotion ? { duration: 0.3 } : undefined}
              >
                {demoLinks.map((item, index) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between px-1 text-[11px]"
                  >
                    <div className="flex min-w-0 flex-col">
                      <TextShimmer
                        as="span"
                        className="block truncate text-sm font-semibold"
                        duration={2.5}
                        delay={index * 0.15}
                      >
                        {item.title}
                      </TextShimmer>
                      <TextShimmer
                        as="span"
                        className="block truncate text-xs font-medium"
                        duration={2.5}
                        delay={index * 0.15 + 0.2}
                      >
                        {item.url}
                      </TextShimmer>
                    </div>
                    <TextShimmer
                      as="span"
                      className="text-[10px] font-medium"
                      duration={2.5}
                      delay={0.4}
                    >
                      Enriching...
                    </TextShimmer>
                  </div>
                ))}
              </m.div>
            ) : null}
            {phase === 2 ? (
              <m.div
                key="results"
                className="grid gap-1.5"
                initial={enableMotion ? { opacity: 0, y: 8 } : false}
                animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
                exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
                transition={enableMotion ? { duration: 0.3 } : undefined}
              >
                {demoLinks.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-xl ring-1 ring-foreground/8 bg-muted/30 px-3 py-1.5 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={item.favicon}
                        alt={`${item.title} favicon`}
                        width={16}
                        height={16}
                        className="size-4"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-foreground">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.group}</span>
                  </div>
                ))}
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </RewayLazyMotion>
  )
}
