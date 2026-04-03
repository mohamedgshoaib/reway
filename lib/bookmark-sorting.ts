import type { BookmarkRow } from "@/lib/supabase/queries";

function normalizeVisitCount(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function normalizeVisitedAt(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

export function hasVisitedBookmark(bookmark: Pick<BookmarkRow, "visit_count">) {
  return normalizeVisitCount(bookmark.visit_count) > 0;
}

export function sortBookmarksByVisitRanking<
  T extends Pick<BookmarkRow, "visit_count" | "last_visited_at" | "created_at">,
>(items: T[]) {
  return items
    .map((item, index) => ({
      item,
      index,
      visitCount: normalizeVisitCount(item.visit_count),
      visitedAt: normalizeVisitedAt(item.last_visited_at),
      createdAt: new Date(item.created_at).getTime(),
    }))
    .toSorted((a, b) => {
      const visitCountDiff = b.visitCount - a.visitCount;
      if (visitCountDiff !== 0) return visitCountDiff;

      const visitedAtDiff = b.visitedAt - a.visitedAt;
      if (visitedAtDiff !== 0) return visitedAtDiff;

      const createdAtDiff = b.createdAt - a.createdAt;
      if (createdAtDiff !== 0) return createdAtDiff;

      return a.index - b.index;
    })
    .map(({ item }) => item);
}
