"use client"

import { LazyMotion, domAnimation } from "motion/react"
import type { ReactNode } from "react"

export function RewayLazyMotion({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
