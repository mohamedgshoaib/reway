"use client"

import {
  Copy01Icon,
  ArrowUpRight03Icon,
  Delete02Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { demoLinks } from "./demo-data"

export function ViewModesDemo() {
  const views = ["Card", "List", "Folders"]
  const [activeView, setActiveView] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const enableMotion = mounted && !shouldReduceMotion

  useEffect(() => {
    if (!enableMotion) return undefined
    const timer = setInterval(() => {
      setActiveView((prev) => (prev + 1) % views.length)
    }, 2600)
    return () => clearInterval(timer)
  }, [enableMotion, views.length])

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {views.map((view, index) => (
          <button
            key={view}
            type="button"
            className="relative rounded-full px-2 py-1 transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none"
          >
            <span
              className={`absolute inset-0 rounded-full bg-muted/60 ${
                activeView === index ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transition: enableMotion ? "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              }}
            />
            <span className={`relative z-10 ${activeView === index ? "text-foreground" : ""}`}>
              {view}
            </span>
          </button>
        ))}
      </div>
      <div className="relative h-30">
        <AnimatePresence mode="wait">
          {activeView === 0 ? (
            <motion.div
              key="card"
              className="grid grid-cols-2 gap-3 px-1"
              initial={enableMotion ? { opacity: 0, y: 8 } : false}
              animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
              exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
              transition={enableMotion ? { duration: 0.3 } : undefined}
            >
              {demoLinks.slice(0, 2).map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-muted/30 p-3 ring-1 ring-foreground/8"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-background">
                      <Image
                        src={item.favicon}
                        alt={`${item.title} favicon`}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.domain}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate max-w-20 sm:max-w-none">{item.group}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-background/60 transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none"
                        aria-label="Copy link"
                      >
                        <HugeiconsIcon icon={Copy01Icon} size={10} />
                      </button>
                      <button
                        type="button"
                        className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-background/60 transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none"
                        aria-label="Open link"
                      >
                        <HugeiconsIcon icon={ArrowUpRight03Icon} size={10} />
                      </button>
                      <button
                        type="button"
                        className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg bg-background/60 text-destructive transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none"
                        aria-label="Delete link"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : null}
          {activeView === 1 ? (
            <motion.div
              key="list"
              className="grid gap-2"
              initial={enableMotion ? { opacity: 0, y: 8 } : false}
              animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
              exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
              transition={enableMotion ? { duration: 0.3 } : undefined}
            >
              {demoLinks.slice(0, 3).map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-xl ring-1 ring-foreground/8 bg-muted/30 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={item.favicon}
                      alt={`${item.title} favicon`}
                      width={16}
                      height={16}
                      className="h-4 w-4"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-semibold text-foreground">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.group}</span>
                </div>
              ))}
            </motion.div>
          ) : null}
          {activeView === 2 ? (
            <motion.div
              key="folders"
              className="px-1"
              initial={enableMotion ? { opacity: 0, y: 8 } : false}
              animate={enableMotion ? { opacity: 1, y: 0 } : undefined}
              exit={enableMotion ? { opacity: 0, y: -8 } : undefined}
              transition={enableMotion ? { duration: 0.3 } : undefined}
            >
              <div className="rounded-2xl ring-1 ring-foreground/8 bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <HugeiconsIcon
                      icon={Folder01Icon}
                      size={14}
                      strokeWidth={1.8}
                      className="text-foreground/80"
                    />
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      Research
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">3</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Folders</span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2">
                  {demoLinks.slice(0, 3).map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl bg-background/40 ring-1 ring-foreground/8 p-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Image
                          src={item.favicon}
                          alt={`${item.title} favicon`}
                          width={16}
                          height={16}
                          className="h-4 w-4 shrink-0"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="truncate text-[9px] text-muted-foreground">{item.domain}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
