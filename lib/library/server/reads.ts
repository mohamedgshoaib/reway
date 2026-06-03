// oxlint-disable-next-line import/no-unassigned-import
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isNoGroupId } from "@/lib/system-groups";

type LibrarySupabaseClient = SupabaseClient<Database>;

const DASHBOARD_BOOKMARK_SELECT =
  "id,url,normalized_url,domain,title,favicon_url,group_id,user_id,created_at,order_index,rank,status,is_enriching,last_visited_at,visit_count";

export const DASHBOARD_BOOKMARK_DETAIL_SELECT =
  "id,description,og_image_url,image_url,screenshot_url,last_fetched_at,error_reason";

const EXTENSION_BOOKMARK_SELECT =
  "id, url, title, domain, favicon_url, group_id, created_at, order_index, rank";
const EXTENSION_BOOKMARK_SELECT_WITHOUT_RANK =
  "id, url, title, domain, favicon_url, group_id, created_at, order_index";

const DASHBOARD_GROUP_SELECT =
  "id,name,icon,color,user_id,created_at,order_index,rank,hide_from_all_bookmarks,show_in_fab";
const EXTENSION_GROUP_SELECT =
  "id, name, icon, color, order_index, rank, created_at, show_in_fab";
const LEGACY_EXTENSION_NO_GROUP_ID = "none";

function applyUserScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  userId?: string,
) {
  return userId ? query.eq("user_id", userId) : query;
}

function isMissingRankColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown };
  return (
    record.code === "42703" &&
    String(record.message || "").toLowerCase().includes("rank")
  );
}

export async function listBookmarksForDashboard(
  supabase: LibrarySupabaseClient,
) {
  return supabase
    .from("bookmarks")
    .select(DASHBOARD_BOOKMARK_SELECT)
    .order("rank", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });
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
    .single();
}

export async function listBookmarksForExtension(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId?: string | null,
  limit?: number,
) {
  const rankedResult = await listBookmarksForExtensionWithRank(
    supabase,
    userId,
    groupId,
    limit,
  );
  if (!isMissingRankColumnError(rankedResult.error)) {
    return rankedResult;
  }

  return listBookmarksForExtensionWithoutRank(supabase, userId, groupId, limit);
}

function applyExtensionBookmarkGroupFilter<
  T extends {
    eq: (column: string, value: string) => T;
    is: (column: string, value: null) => T;
  },
>(query: T, groupId?: string | null) {
  if (isNoGroupId(groupId) || groupId === LEGACY_EXTENSION_NO_GROUP_ID) {
    return query.is("group_id", null);
  }

  if (groupId && groupId !== "all") {
    return query.eq("group_id", groupId);
  }

  return query;
}

function listBookmarksForExtensionWithRank(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId?: string | null,
  limit?: number,
) {
  let query = applyUserScope(
    supabase.from("bookmarks").select(EXTENSION_BOOKMARK_SELECT),
    userId,
  );

  query = applyExtensionBookmarkGroupFilter(query, groupId)
    .order("rank", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  return query;
}

function listBookmarksForExtensionWithoutRank(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId?: string | null,
  limit?: number,
) {
  let query = applyUserScope(
    supabase.from("bookmarks").select(EXTENSION_BOOKMARK_SELECT_WITHOUT_RANK),
    userId,
  );

  query = applyExtensionBookmarkGroupFilter(query, groupId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  return query;
}

export async function searchBookmarksForExtension(
  supabase: LibrarySupabaseClient,
  userId: string,
  searchQuery: string,
  limit: number,
) {
  const rankedResult = await searchBookmarksForExtensionWithRank(
    supabase,
    userId,
    searchQuery,
    limit,
  );
  if (!isMissingRankColumnError(rankedResult.error)) {
    return rankedResult;
  }

  return searchBookmarksForExtensionWithoutRank(
    supabase,
    userId,
    searchQuery,
    limit,
  );
}

async function searchBookmarksForExtensionWithRank(
  supabase: LibrarySupabaseClient,
  userId: string,
  searchQuery: string,
  limit: number,
) {
  const pattern = `%${searchQuery.replace(/[\\%_]/g, "\\$&")}%`;
  const columns = ["title", "domain"] as const;

  const results = await Promise.all(
    columns.map((column) =>
      applyUserScope(
        supabase.from("bookmarks").select(EXTENSION_BOOKMARK_SELECT),
        userId,
      )
        .ilike(column, pattern)
        .order("rank", { ascending: true, nullsFirst: false })
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit),
    ),
  );

  const error = results.find((result) => result.error)?.error;
  if (error) {
    return { data: null, error };
  }

  const seen = new Set<string>();
  const data = results
    .flatMap((result) => result.data ?? [])
    .filter((bookmark) => {
      if (seen.has(bookmark.id)) return false;
      seen.add(bookmark.id);
      return true;
    });

  return { data: data.slice(0, limit), error: null };
}

async function searchBookmarksForExtensionWithoutRank(
  supabase: LibrarySupabaseClient,
  userId: string,
  searchQuery: string,
  limit: number,
) {
  const pattern = `%${searchQuery.replace(/[\\%_]/g, "\\$&")}%`;
  const columns = ["title", "domain"] as const;

  const results = await Promise.all(
    columns.map((column) =>
      applyUserScope(
        supabase
          .from("bookmarks")
          .select(EXTENSION_BOOKMARK_SELECT_WITHOUT_RANK),
        userId,
      )
        .ilike(column, pattern)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(limit),
    ),
  );

  const error = results.find((result) => result.error)?.error;
  if (error) {
    return { data: null, error };
  }

  const seen = new Set<string>();
  const data = results
    .flatMap((result) => result.data ?? [])
    .filter((bookmark) => {
      if (seen.has(bookmark.id)) return false;
      seen.add(bookmark.id);
      return true;
    });

  return { data: data.slice(0, limit), error: null };
}

export async function listGroupsForDashboard(supabase: LibrarySupabaseClient) {
  return supabase
    .from("groups")
    .select(DASHBOARD_GROUP_SELECT)
    .order("rank", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });
}

export async function listGroupsForExtension(
  supabase: LibrarySupabaseClient,
  userId: string,
) {
  return applyUserScope(
    supabase.from("groups").select(EXTENSION_GROUP_SELECT),
    userId,
  )
    .order("rank", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true });
}
