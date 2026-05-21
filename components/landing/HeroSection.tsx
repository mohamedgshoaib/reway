"use client"

import { m, useReducedMotion, type Variants } from "motion/react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import Link from "next/link"
import { useEffect, useState } from "react"
import ChromeWebStoreIcon from "@/components/chrome-store-logo"
import { ExtensionInstallDialog } from "@/components/extension-install-dialog"
import { HeroDemoPreview } from "@/components/landing/HeroDemoPreview"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  }

  const enableMotion = mounted && !shouldReduceMotion

  return (
    <RewayLazyMotion>
    <section className="border-b border-foreground/8 bg-background">
      <div className="mx-auto flex w-full max-w-350 flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20">
        <m.div
          className="space-y-6 text-center"
          initial={enableMotion ? "hidden" : false}
          whileInView={enableMotion ? "visible" : undefined}
          viewport={{ once: true, margin: "-120px" }}
          variants={enableMotion ? sectionVariants : undefined}
        >
          <h1 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            A Calm Home For Everything You Save.
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base text-foreground/70 sm:text-lg">
            Reway turns noisy links into a structured library. Capture links from any source,
            extract what matters from pasted text, and move fast with keyboard-first search, groups,
            and view modes designed for speed.
          </p>

          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 pt-1">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8 cursor-pointer">
                <Link href="/login">Get Started</Link>
              </Button>

              <ExtensionInstallDialog>
                <Button variant="outline" size="lg" className="rounded-full px-8 cursor-pointer">
                  <ChromeWebStoreIcon
                    className="mr-2 size-5"
                    aria-hidden="true"
                    focusable="false"
                  />
                  Download Extension
                </Button>
              </ExtensionInstallDialog>
            </div>
          </div>
        </m.div>

        <HeroDemoPreview />
      </div>
    </section>
    </RewayLazyMotion>
  )
}
