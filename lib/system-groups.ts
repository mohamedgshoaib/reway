import type { GroupRow } from "@/lib/supabase/queries";

export const ALL_BOOKMARKS_GROUP_ID = "all";
export const MOST_VISITED_GROUP_ID = "most-visited";
export const NO_GROUP_ID = "no-group";

export const ALL_BOOKMARKS_GROUP_NAME = "All Bookmarks";
export const MOST_VISITED_GROUP_NAME = "Most Visited";
export const NO_GROUP_NAME = "No Group";

const SYSTEM_GROUP_CREATED_AT = "1970-01-01T00:00:00.000Z";

export function isAllBookmarksGroupId(groupId?: string | null) {
  return groupId === ALL_BOOKMARKS_GROUP_ID;
}

export function isMostVisitedGroupId(groupId?: string | null) {
  return groupId === MOST_VISITED_GROUP_ID;
}

export function isNoGroupId(groupId?: string | null) {
  return groupId === NO_GROUP_ID;
}

export function isSystemGroupId(groupId?: string | null) {
  return (
    isAllBookmarksGroupId(groupId) ||
    isMostVisitedGroupId(groupId) ||
    isNoGroupId(groupId)
  );
}

export function toPersistedGroupId(groupId?: string | null) {
  return isSystemGroupId(groupId) ? null : groupId ?? null;
}

export function createNoGroupRow(): GroupRow {
  return {
    id: NO_GROUP_ID,
    name: NO_GROUP_NAME,
    icon: "alert-circle",
    color: null,
    user_id: "",
    created_at: SYSTEM_GROUP_CREATED_AT,
    hide_from_all_bookmarks: false,
    order_index: null,
  };
}
