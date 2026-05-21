"use client"

import { useMemo } from "react"
import { hasVisitedBookmark, sortBookmarksByVisitRanking } from "@/lib/bookmark-sorting"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import { isAllBookmarksGroupId, isMostVisitedGroupId, isNoGroupId } from "@/lib/system-groups"

interface UseDashboardDerivedOptions {
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  activeGroupId: string
  deferredSearchQuery: string
}

export function useDashboardDerived({
  bookmarks,
  groups,
  activeGroupId,
  deferredSearchQuery,
}: UseDashboardDerivedOptions) {
  const hiddenFromAllGroupIds = useMemo(
    () => new Set(groups.flatMap((group) => (group.hide_from_all_bookmarks ? [group.id] : []))),
    [groups],
  )

  const filteredBookmarks = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()
    const matchesSearch = (bookmark: BookmarkRow) => {
      if (!normalizedQuery) return true
      const haystack = [bookmark.title, bookmark.url, bookmark.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    }

    const filtered = bookmarks.filter((b) => {
      const matchesGroup = isAllBookmarksGroupId(activeGroupId)
        ? !b.group_id || !hiddenFromAllGroupIds.has(b.group_id)
        : isMostVisitedGroupId(activeGroupId)
          ? hasVisitedBookmark(b)
          : isNoGroupId(activeGroupId)
            ? !b.group_id
            : b.group_id === activeGroupId
      if (!matchesGroup) return false
      return matchesSearch(b)
    })

    if (isMostVisitedGroupId(activeGroupId)) {
      return sortBookmarksByVisitRanking(filtered)
    }

    return filtered
  }, [activeGroupId, bookmarks, deferredSearchQuery, hiddenFromAllGroupIds])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of bookmarks) {
      if (b.group_id) {
        counts[b.group_id] = (counts[b.group_id] || 0) + 1
      }
    }
    return counts
  }, [bookmarks])

  const exportGroupOptions = useMemo(() => {
    const names = new Set<string>()
    names.add("Ungrouped")
    groups.forEach((group) => {
      if (group.name) {
        names.add(group.name)
      }
    })
    return Array.from(names).toSorted((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    )
  }, [groups])

  return { filteredBookmarks, groupCounts, exportGroupOptions }
}
