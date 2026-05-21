"use client"

import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import * as React from "react"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-xl h-9 w-9 text-muted-foreground/85 hover:text-foreground transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <HugeiconsIcon
        icon={Sun01Icon}
        size={18}
        className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90"
      />
      <HugeiconsIcon
        icon={Moon02Icon}
        size={18}
        className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
