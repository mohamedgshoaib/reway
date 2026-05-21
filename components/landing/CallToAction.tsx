"use client"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useReducedMotion, type Variants } from "motion/react"
import * as m from "motion/react-m"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ChromeWebStoreIcon from "@/components/chrome-store-logo"
import { ExtensionInstallDialog } from "@/components/extension-install-dialog"
import type { DashboardHref } from "@/components/landing/types"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Custom cubic bezier for more premium feel
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

export function CallToAction() {
  const shouldReduceMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isPrimaryNavLoading, setIsPrimaryNavLoading] = useState(false)
  const { push } = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data }) => setIsAuthenticated(Boolean(data?.user)))
      .catch(() => setIsAuthenticated(false))
  }, [])

  const primaryHref: DashboardHref = isAuthenticated ? "/dashboard" : "/login"
  const primaryLabel = isAuthenticated ? "Dashboard" : "Get Started"

  const enableMotion = mounted && !shouldReduceMotion

  return (
    <RewayLazyMotion>
      <section className="bg-background py-16 lg:py-20">
        <m.div
          className="mx-auto w-full max-w-350 px-4 sm:px-6"
          initial={enableMotion ? "hidden" : false}
          whileInView={enableMotion ? "visible" : undefined}
          viewport={{ once: true, margin: "-100px" }}
          variants={enableMotion ? containerVariants : undefined}
        >
          <div className="relative overflow-hidden rounded-[3rem] ring-1 ring-foreground/12 bg-muted/25 px-6 py-16 shadow-none isolate sm:px-12 sm:py-24">
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
              <m.div className="space-y-4" variants={enableMotion ? itemVariants : undefined}>
                <h2 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
                  Organize Your Knowledge
                </h2>
                <p className="mx-auto max-w-xl text-pretty text-base text-foreground/70 sm:text-lg">
                  Stop losing links to the void. Reway provides the infrastructure to capture,
                  organize, and retrieve your research at the speed of thought. Join Reway and never
                  lose a link again.
                </p>
              </m.div>

              <m.div
                className="flex flex-col items-center gap-4"
                variants={enableMotion ? itemVariants : undefined}
              >
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <m.div
                    whileTap={enableMotion ? { scale: 0.97 } : undefined}
                    transition={enableMotion ? { duration: 0.16, ease: "easeOut" } : undefined}
                  >
                    {isAuthenticated ? (
                      <Button
                        size="lg"
                        className="rounded-full px-8 cursor-pointer"
                        onClick={() => {
                          if (isPrimaryNavLoading) return
                          setIsPrimaryNavLoading(true)
                          push("/dashboard")
                        }}
                        disabled={isPrimaryNavLoading}
                      >
                        {isPrimaryNavLoading ? "Loading…" : "Dashboard"}
                        {!isPrimaryNavLoading ? (
                          <HugeiconsIcon icon={ArrowRight01Icon} size={20} className="ml-2" />
                        ) : null}
                      </Button>
                    ) : (
                      <Button asChild size="lg" className="rounded-full px-8 cursor-pointer">
                        <Link href={primaryHref}>
                          {primaryLabel}
                          <HugeiconsIcon icon={ArrowRight01Icon} size={20} className="ml-2" />
                        </Link>
                      </Button>
                    )}
                  </m.div>

                  <ExtensionInstallDialog>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-8 cursor-pointer"
                    >
                      <ChromeWebStoreIcon
                        className="mr-2 size-5"
                        aria-hidden="true"
                        focusable="false"
                      />
                      Download Extension
                    </Button>
                  </ExtensionInstallDialog>
                </div>
                <p className="text-xs font-medium text-foreground/60">
                  Free to use. No hidden fees.
                </p>
              </m.div>
            </div>
          </div>
        </m.div>
      </section>
    </RewayLazyMotion>
  )
}
