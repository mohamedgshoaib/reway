"use client"

import { Layout01Icon, Layout02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LayoutControlsProps {
  layoutDensity: "compact" | "extended"
  setLayoutDensity: (value: "compact" | "extended") => void
}

export function LayoutControls({ layoutDensity, setLayoutDensity }: LayoutControlsProps) {
  const activeIcon = layoutDensity === "extended" ? Layout02Icon : Layout01Icon

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="inline-flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg transition-transform duration-150 hover:bg-muted/50 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                  aria-label="Change layout density"
                >
                  <HugeiconsIcon icon={activeIcon} size={16} strokeWidth={2} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg font-medium" side="bottom">
                Layout
              </TooltipContent>
            </Tooltip>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-36 rounded-2xl p-2 ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none shadow-none isolate"
        >
          <DropdownMenuItem
            className={`rounded-xl flex items-center gap-2 cursor-pointer ${
              layoutDensity === "compact" ? "bg-muted text-foreground font-medium" : ""
            }`}
            onClick={() => setLayoutDensity("compact")}
          >
            <HugeiconsIcon icon={Layout01Icon} size={16} />
            Compact
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`rounded-xl flex items-center gap-2 cursor-pointer ${
              layoutDensity === "extended" ? "bg-muted text-foreground font-medium" : ""
            }`}
            onClick={() => setLayoutDensity("extended")}
          >
            <HugeiconsIcon icon={Layout02Icon} size={16} />
            Extended
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
