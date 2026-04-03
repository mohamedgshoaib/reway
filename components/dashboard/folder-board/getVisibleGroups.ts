import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries";
import {
  createNoGroupRow,
  isAllBookmarksGroupId,
  isMostVisitedGroupId,
  NO_GROUP_ID,
} from "@/lib/system-groups";

export function getVisibleGroups(options: {
  groups: GroupRow[];
  bookmarks: BookmarkRow[];
  activeGroupId: string;
  isFiltered: boolean;
}) {
  const { groups, bookmarks, activeGroupId, isFiltered } = options;

  if (isMostVisitedGroupId(activeGroupId)) {
    const groupIds = new Set(
      bookmarks.map((bookmark) => bookmark.group_id ?? NO_GROUP_ID),
    );
    const visibleGroups = groups.filter((group) => groupIds.has(group.id));
    if (!groupIds.has(NO_GROUP_ID)) return visibleGroups;

    return [...visibleGroups, createNoGroupRow()];
  }

  if (!isAllBookmarksGroupId(activeGroupId)) {
    return groups.filter((group) => group.id === activeGroupId);
  }

  if (isFiltered) {
    const groupIds = new Set(
      bookmarks.map((bookmark) => bookmark.group_id ?? NO_GROUP_ID),
    );
    const filtered = groups.filter((group) => groupIds.has(group.id));
    if (!groupIds.has(NO_GROUP_ID)) return filtered;

    return [
      ...filtered,
      createNoGroupRow(),
    ];
  }

  const hasUngrouped = bookmarks.some((bookmark) => !bookmark.group_id);
  if (!hasUngrouped) return groups;

  return [
    ...groups,
    createNoGroupRow(),
  ];
}
