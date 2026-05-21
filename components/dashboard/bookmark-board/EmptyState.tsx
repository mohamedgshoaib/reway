"use client"

import { Bookmark01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Kbd } from "@/components/ui/kbd"

interface EmptyStateProps {
  isMac: boolean
}

export function EmptyState({ isMac }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-200 motion-reduce:animate-none">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-muted/30 mb-6">
        <HugeiconsIcon icon={Bookmark01Icon} size={40} className="text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-bold text-foreground text-balance">No bookmarks yet</h3>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-muted-foreground mt-2 max-w-70 text-pretty">
        <span className="hidden md:inline">Press</span>
        <Kbd className="hidden md:inline-flex">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
        <span className="hidden md:inline">to add your first link.</span>
        <span className="md:hidden">Add your first links to get started.</span>
      </div>
    </div>
  )
}
