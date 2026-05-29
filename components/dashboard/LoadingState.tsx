"use client"

import { cn } from "@/lib/utils"

interface DashboardLoadingStateProps {
  label: string
  className?: string
  iconClassName?: string
}

export function DashboardLoadingState({
  label,
  className,
  iconClassName,
}: DashboardLoadingStateProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center justify-center gap-2", className)}>
      <LoadingBarsIcon className={iconClassName} />
      <span className="truncate">{label}</span>
    </span>
  )
}

export function LoadingBarsIcon({ className }: { className?: string }) {
  const bars = [
    { x: 1, begin: "0s" },
    { x: 6, begin: "0.2s" },
    { x: 11, begin: "0.4s" },
  ]

  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      {bars.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y="2"
          width="4"
          height="8"
          rx="1.5"
          fill="currentColor"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="translate"
            values="0 0; 0 5; 0 0"
            begin={bar.begin}
            dur="0.6s"
            repeatCount="indefinite"
          />
        </rect>
      ))}
    </svg>
  )
}
