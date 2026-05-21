"use client"

import { Alert02Icon, Refresh01Icon, Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <main className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, transform: "translateY(12px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
          suppressHydrationWarning
          className="space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <HugeiconsIcon icon={Alert02Icon} size={28} className="text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                We hit an unexpected error. Try again, or return home.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
        </motion.div>
      </main>
    </div>
  )
}
