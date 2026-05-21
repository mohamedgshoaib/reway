"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"
import { useEffect, useState } from "react"
import { features } from "./features/demo-data"
import { ExtractDemo } from "./features/ExtractDemo"
import { GroupsDemo } from "./features/GroupsDemo"
import { KeyboardNavDemo } from "./features/KeyboardNavDemo"
import { ViewModesDemo } from "./features/ViewModesDemo"

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const enableMotion = mounted && !shouldReduceMotion

  return (
    <section id="features" className="border-b border-foreground/8 bg-muted/20">
      <motion.div
        className="mx-auto flex w-full max-w-350 flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20"
        initial={enableMotion ? "hidden" : false}
        whileInView={enableMotion ? "visible" : undefined}
        viewport={{ once: true, margin: "-120px" }}
        variants={enableMotion ? containerVariants : undefined}
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
            Core Features
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-foreground sm:text-4xl">
            Focus On The Link, Not The Management
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-foreground/65 sm:text-base">
            Reway is built for speed. Every interaction is optimized to keep your library clean and
            your research moving.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col gap-4 rounded-4xl ring-1 ring-foreground/8 bg-background p-5 shadow-none isolate"
            >
              <div className="flex min-h-24 items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-foreground/65">{feature.description}</p>
                </div>
              </div>
              <div className="flex h-46 items-center overflow-visible">
                {feature.demo === "extract" ? <ExtractDemo /> : null}
                {feature.demo === "groups" ? <GroupsDemo /> : null}
                {feature.demo === "keyboard" ? <KeyboardNavDemo /> : null}
                {feature.demo === "views" ? <ViewModesDemo /> : null}
              </div>
            </article>
          ))}
        </div>

        {/* Power user signature - High contrast, no cards, no borders. */}
        <div className="mt-6 text-center lg:mt-10">
          <p className="mx-auto max-w-3xl text-balance px-4 text-[15px] leading-relaxed text-foreground antialiased sm:text-lg">
            <span className="text-foreground/40 font-medium">And for power users:</span>{" "}
            <span className="font-bold underline decoration-foreground/20 underline-offset-[6px] decoration-2">
              Import & Export
            </span>{" "}
            your library as Chrome HTML, personalize your space with{" "}
            <span className="font-bold underline decoration-foreground/20 underline-offset-[6px] decoration-2">
              Refined Themes
            </span>
            , and optimize your flow with{" "}
            <span className="font-bold underline decoration-foreground/20 underline-offset-[6px] decoration-2">
              Variable UI Density
            </span>
            .
          </p>
        </div>
      </motion.div>
    </section>
  )
}
