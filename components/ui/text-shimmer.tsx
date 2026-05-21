"use client"

import { motion } from "motion/react"
import React from "react"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { cn } from "@/lib/utils"

export type TextShimmerProps = {
  children: string
  as?: keyof typeof motion
  className?: string
  duration?: number
  spread?: number
  delay?: number
  repeatDelay?: number
}

const TextShimmer = ({
  children,
  as = "p",
  className,
  duration = 2,
  spread = 2,
  delay = 0,
  repeatDelay = 0,
}: TextShimmerProps) => {
  const MotionComponent = (motion[as as keyof typeof motion] || motion.p) as typeof motion.p

  const dynamicSpread = children.length * spread

  return (
    <RewayLazyMotion>
      <MotionComponent
        className={cn(
          "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
          "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
          "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
          "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
          className,
        )}
        initial={{ backgroundPosition: "105% center" }}
        animate={{ backgroundPosition: "-5% center" }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration,
          ease: "linear",
          delay,
          repeatDelay,
        }}
        style={
          {
            "--spread": `${dynamicSpread}px`,
            backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          } as React.CSSProperties
        }
      >
        {children}
      </MotionComponent>
    </RewayLazyMotion>
  )
}

export default React.memo(TextShimmer)
