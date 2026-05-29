// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

type LibrarySupabaseClient = SupabaseClient<Database>

const DASHBOARD_BOOKMARK_SELECT =
  "id,url,normalized_url,domain,title,favicon_url,group_id,user_id,created_at,order_index,status,is_enriching,last_visited_at,visit_count"

export const DASHBOARD_BOOKMARK_DETAIL_SELECT =
  "id,description,og_image_url,image_url,screenshot_url,last_fetched_at,error_reason"

const EXTENSION_BOOKMARK_SELECT =
  "id, url, title, description, group_id, created_at, order_index"

const DASHBOARD_GROUP_SELECT = "id,name,icon,color,user_id,created_at,order_index,hide_from_all_bookmarks"
const EXTENSION_GROUP_SELECT = "id, name, icon, color, order_index, created_at"

function applyUserScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  userId?: string,
) {
  return userId ? query.eq("user_id", userId) : query
}

export async function listBookmarksForDashboard(supabase: LibrarySupabaseClient) {
  return supabase
    .from("bookmarks")
    .select(DASHBOARD_BOOKMARK_SELECT)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })
}

export async function getBookmarkDetailsForDashboard(
  supabase: LibrarySupabaseClient,
  bookmarkId: string,
  userId: string,
) {
  return supabase
    .from("bookmarks")
    .select(DASHBOARD_BOOKMARK_DETAIL_SELECT)
    .eq("id", bookmarkId)
    .eq("user_id", userId)
    .single()
}

export async function listBookmarksForExtension(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId?: string | null,
) {
  const query = applyUserScope(
    supabase.from("bookmarks").select(EXTENSION_BOOKMARK_SELECT),
    userId,
  )

  if (groupId && groupId !== "all") {
    query.eq("group_id", groupId)
  }

  return query.order("order_index", { ascending: true }).order("created_at", { ascending: false })
}

export async function listGroupsForDashboard(supabase: LibrarySupabaseClient) {
  return supabase
    .from("groups")
    .select(DASHBOARD_GROUP_SELECT)
    .order("order_index", { ascending: true })
    .order("name", { ascending: true })
}

export async function listGroupsForExtension(
  supabase: LibrarySupabaseClient,
  userId: string,
) {
  return applyUserScope(supabase.from("groups").select(EXTENSION_GROUP_SELECT), userId).order(
    "order_index",
    { ascending: true },
  )
}
