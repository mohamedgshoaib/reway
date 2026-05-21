"use client"

import type { BookmarkRow } from "@/lib/supabase/queries"
import { getDisplayTitle, getDomain } from "@/lib/utils"
import { Favicon } from "../Favicon"

interface BookmarkDragOverlayProps {
  activeBookmark: BookmarkRow | null
  viewMode: "list" | "card"
}

export function BookmarkDragOverlay({ activeBookmark, viewMode }: BookmarkDragOverlayProps) {
  if (!activeBookmark) return null

  const domain = getDomain(activeBookmark.url)
  const displayTitle = getDisplayTitle({
    title: activeBookmark.title,
    url: activeBookmark.url,
    normalizedUrl: activeBookmark.normalized_url,
    domain,
  })

  if (viewMode === "card") {
    return (
      <div className="relative flex flex-col gap-3 rounded-2xl bg-background/95 ring-1 ring-foreground/8 p-4 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <Favicon
            url={activeBookmark.favicon_url || ""}
            domain={domain}
            title={displayTitle}
            className="size-9"
          />
          <div className="min-w-0 flex flex-col">
            <p className="truncate text-sm font-bold text-foreground">{displayTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{domain}</p>
          </div>
        </div>
        <p suppressHydrationWarning className="text-xs text-muted-foreground">
          {new Date(activeBookmark.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-between rounded-2xl bg-background/95 ring-1 ring-foreground/8 px-4 py-1.5 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Favicon url={activeBookmark.favicon_url || ""} domain={domain} title={displayTitle} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-bold text-foreground">{displayTitle}</span>
          <span className="text-xs font-medium text-muted-foreground">{domain}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center pl-6">
        <span suppressHydrationWarning className="text-sm font-medium text-muted-foreground">
          {new Date(activeBookmark.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}
