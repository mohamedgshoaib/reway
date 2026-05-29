"use client"

import { useMemo } from "react"
import { sortBookmarksByVisitRanking } from "@/lib/bookmark-sorting"
import { compareRankedItems } from "@/lib/ranking"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import { isMostVisitedGroupId, NO_GROUP_ID } from "@/lib/system-groups"

interface UseBookmarkBucketsOptions {
  bookmarks: BookmarkRow[]
  visibleGroups: GroupRow[]
  activeGroupId: string
}

export function useBookmarkBuckets({
  bookmarks,
  visibleGroups,
  activeGroupId,
}: UseBookmarkBucketsOptions) {
  return useMemo(() => {
    const buckets: Record<string, BookmarkRow[]> = {}
    for (const group of visibleGroups) {
      buckets[group.id] = []
    }

    for (const bookmark of bookmarks) {
      const groupId = bookmark.group_id ?? NO_GROUP_ID
      if (!buckets[groupId]) {
        buckets[groupId] = []
      }
      buckets[groupId].push(bookmark)
    }

    Object.keys(buckets).forEach((groupId) => {
      buckets[groupId] = isMostVisitedGroupId(activeGroupId)
        ? sortBookmarksByVisitRanking(buckets[groupId])
        : buckets[groupId].toSorted(compareRankedItems)
    })

    return buckets
  }, [activeGroupId, bookmarks, visibleGroups])
}
