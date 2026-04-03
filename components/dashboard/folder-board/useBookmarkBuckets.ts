"use client";

import { useMemo } from "react";
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries";
import { sortBookmarksByVisitRanking } from "@/lib/bookmark-sorting";
import { isMostVisitedGroupId, NO_GROUP_ID } from "@/lib/system-groups";

interface UseBookmarkBucketsOptions {
  bookmarks: BookmarkRow[];
  visibleGroups: GroupRow[];
  activeGroupId: string;
}

export function useBookmarkBuckets({
  bookmarks,
  visibleGroups,
  activeGroupId,
}: UseBookmarkBucketsOptions) {
  return useMemo(() => {
    const buckets: Record<string, BookmarkRow[]> = {};
    for (const group of visibleGroups) {
      buckets[group.id] = [];
    }

    for (const bookmark of bookmarks) {
      const groupId = bookmark.group_id ?? NO_GROUP_ID;
      if (!buckets[groupId]) {
        buckets[groupId] = [];
      }
      buckets[groupId].push(bookmark);
    }

    Object.keys(buckets).forEach((groupId) => {
      buckets[groupId] = isMostVisitedGroupId(activeGroupId)
        ? sortBookmarksByVisitRanking(buckets[groupId])
        : buckets[groupId].toSorted((a, b) => {
            const aOrder = a.order_index ?? Number.POSITIVE_INFINITY;
            const bOrder = b.order_index ?? Number.POSITIVE_INFINITY;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
    });

    return buckets;
  }, [activeGroupId, bookmarks, visibleGroups]);
}
