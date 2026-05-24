"use client"

import { Folder01Icon, Menu01Icon, SquareIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ViewModeControlsProps {
  viewMode: "list" | "card" | "folders"
  setViewMode: (value: "list" | "card" | "folders") => void
}

export function ViewModeControls({ viewMode, setViewMode }: ViewModeControlsProps) {
  const activeIcon =
    viewMode === "list" ? Menu01Icon : viewMode === "card" ? SquareIcon : Folder01Icon

  const viewOptions = [
    { value: "folders", label: "Folders", icon: Folder01Icon },
    { value: "list", label: "List", icon: Menu01Icon },
    { value: "card", label: "Card", icon: SquareIcon },
  ] as const

  return (
    <>
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="inline-flex">
              {" "}
              {/* Wrapper to prevent props collision */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-onboarding="view-mode"
                    suppressHydrationWarning
                    className="size-8 rounded-lg transition-transform duration-150 hover:bg-muted/50 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    aria-label="Change view mode"
                  >
                    <HugeiconsIcon icon={activeIcon} size={16} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg font-medium" side="bottom">
                  View mode
                </TooltipContent>
              </Tooltip>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-36 rounded-2xl p-2 ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none shadow-none isolate"
          >
            {viewOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                suppressHydrationWarning
                className={`rounded-xl flex items-center gap-2 cursor-pointer ${
                  viewMode === option.value ? "bg-muted text-foreground font-medium" : ""
                }`}
                onClick={() => setViewMode(option.value)}
              >
                <HugeiconsIcon icon={option.icon} size={16} />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </>
  )
}
