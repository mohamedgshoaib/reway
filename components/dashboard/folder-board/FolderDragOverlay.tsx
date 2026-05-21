"use client"

import type { BookmarkRow } from "@/lib/supabase/queries"
import { getDisplayTitle, getDomain } from "@/lib/utils"
import { Favicon } from "../Favicon"

interface FolderDragOverlayProps {
  activeBookmark: BookmarkRow | null
}

export function FolderDragOverlay({ activeBookmark }: FolderDragOverlayProps) {
  if (!activeBookmark) return null

  const domain = getDomain(activeBookmark.url)
  const displayTitle = getDisplayTitle({
    title: activeBookmark.title,
    url: activeBookmark.url,
    normalizedUrl: activeBookmark.normalized_url,
    domain,
  })

  return (
    <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-background/95 ring-1 ring-foreground/8 p-4 text-center after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate overflow-hidden">
      <Favicon
        url={activeBookmark.favicon_url || ""}
        domain={domain}
        title={displayTitle}
        className="size-12"
      />
      <p className="truncate text-xs font-semibold text-foreground w-full">{displayTitle}</p>
    </div>
  )
}
