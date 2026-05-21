"use client"

import { ComputerIcon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface ThemeSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function ThemeSwitcher({ className, ...props }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Issue: reading client-only theme state during SSR can cause hydration mismatches.
    // Fix: only mark as mounted after the first tick so we render a deterministic fallback on the server.
    const id = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(id)
  }, [])

  const activeTheme = useMemo(() => (mounted ? (theme ?? "system") : "system"), [mounted, theme])

  const themes = [
    { value: "system", icon: ComputerIcon, label: "Switch to system theme" },
    { value: "light", icon: Sun01Icon, label: "Switch to light theme" },
    { value: "dark", icon: Moon02Icon, label: "Switch to dark theme" },
  ]

  return (
    <div
      className={cn(
        "relative isolate inline-flex h-8 items-center rounded-full ring-1 ring-foreground/8 px-1",
        className,
      )}
      {...props}
    >
      {themes.map(({ value, icon, label }) => (
        <button
          key={value}
          aria-label={label}
          title={label}
          type="button"
          onClick={() => setTheme(value)}
          className="group relative size-6 rounded-full transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
        >
          <div
            className={cn(
              "-z-1 absolute inset-0 rounded-full bg-muted transition-opacity duration-200 ease-out",
              activeTheme === value ? "opacity-100" : "opacity-0",
            )}
          />
          <HugeiconsIcon
            icon={icon}
            className={cn(
              "relative m-auto size-3.5 transition duration-200 ease-out",
              activeTheme === value
                ? "text-foreground"
                : "text-secondary-foreground group-hover:text-foreground group-focus-visible:text-foreground",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
