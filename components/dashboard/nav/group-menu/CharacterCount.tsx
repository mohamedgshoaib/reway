import React from "react"

export function CharacterCount({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max - 5
  const isAtLimit = current >= max

  return (
    <span
      className={`text-[9px] font-medium tabular-nums transition-colors duration-200 ${
        isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-muted-foreground/40"
      }`}
    >
      {current}/{max}
    </span>
  )
}
