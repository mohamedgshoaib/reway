"use client"

import { useMotionValueEvent, useScroll as useMotionScroll } from "motion/react"
import { useState } from "react"

export function useScroll(downThreshold: number, upThreshold?: number) {
  const scrollUpThreshold = upThreshold ?? downThreshold / 2
  const [scrolled, setScrolled] = useState(false)

  const { scrollY } = useMotionScroll()

  useMotionValueEvent(scrollY, "change", (y) => {
    const nextY = typeof y === "number" ? y : Number(y)
    setScrolled((prev) => {
      if (prev) {
        return nextY > scrollUpThreshold
      }
      return nextY > downThreshold
    })
  })

  return scrolled
}
