"use client"

import type { ReactNode } from "react"
import { LazyMotion, domAnimation } from "motion/react"

export function RewayLazyMotion({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
