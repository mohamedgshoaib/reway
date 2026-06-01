// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeUrl } from "@/lib/metadata"
import { generateRankBetween } from "@/lib/ranking"
import type { Database } from "@/lib/supabase/database.types"
import { toPersistedGroupId } from "@/lib/system-groups"
import { getDomain } from "@/lib/utils"

type LibrarySupabaseClient = SupabaseClient<Database>

const CREATE_GROUP_RETURN_SELECT =
  "id,user_id,name,color,icon,order_index,created_at,hide_from_all_bookmarks,rank,show_in_fab"

const CREATE_BOOKMARK_RETURN_SELECT =
  "id,user_id,group_id,url,title,description,favicon_url,og_image_url,image_url,screenshot_url,order_index,created_at,is_enriching,status,error_reason,last_fetched_at,normalized_url,domain,visit_count,last_visited_at,rank"

interface CreateGroupInput {
  name: string
  icon: string
  color?: string | null
  rank?: string | null
}

interface CreateBookmarkInput {
  url: string
  id?: string
  title?: string
  favicon_url?: string | null
  og_image_url?: string | null
  description?: string | null
  group_id?: string | null
  order_index?: number | null
  rank?: string | null
  status: "pending" | "ready" | "failed"
  image_url?: string | null
  last_fetched_at?: string | null
}

export async function findNextGroupOrderIndex(supabase: LibrarySupabaseClient, userId: string) {
  const { data: maxOrderData, error } = await supabase
    .from("groups")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return maxOrderData ? (maxOrderData.order_index ?? 0) + 1 : 0
}

export async function findNextGroupRank(supabase: LibrarySupabaseClient, userId: string) {
  const { data: lastRankData } = await supabase
    .from("groups")
    .select("rank")
    .eq("user_id", userId)
    .not("rank", "is", null)
    .order("rank", { ascending: false })
    .limit(1)
    .maybeSingle()

  return generateRankBetween(lastRankData?.rank ?? null, null)
}

export async function createGroupRecord(
  supabase: LibrarySupabaseClient,
  userId: string,
  input: CreateGroupInput,
) {
  const nextOrderIndex = await findNextGroupOrderIndex(supabase, userId)
  const nextRank = input.rank ?? (await findNextGroupRank(supabase, userId))

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      icon: input.icon,
      color: input.color ?? null,
      user_id: userId,
      order_index: nextOrderIndex,
      rank: nextRank,
    })
    .select(CREATE_GROUP_RETURN_SELECT)
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data, error: null }
}

export async function findDuplicateGroupByName(
  supabase: LibrarySupabaseClient,
  userId: string,
  name: string,
) {
  return supabase
    .from("groups")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle()
}

export async function validateGroupAccess(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId: string | null,
) {
  const persistedGroupId = toPersistedGroupId(groupId)
  if (!persistedGroupId) {
    return { groupId: null, valid: true }
  }

  const { data: group, error } = await supabase
    .from("groups")
    .select("id")
    .eq("id", persistedGroupId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !group) {
    return { groupId: persistedGroupId, valid: false }
  }

  return { groupId: persistedGroupId, valid: true }
}

export async function findNextBookmarkOrderIndex(supabase: LibrarySupabaseClient, userId: string) {
  const { data: minOrderData, error } = await supabase
    .from("bookmarks")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return minOrderData ? (minOrderData.order_index ?? 0) - 1 : 0
}

export async function findNextBookmarkRank(
  supabase: LibrarySupabaseClient,
  userId: string,
  groupId: string | null,
) {
  const query = supabase
    .from("bookmarks")
    .select("rank")
    .eq("user_id", userId)
    .not("rank", "is", null)
    .order("rank", { ascending: true })
    .limit(1)

  if (groupId) {
    query.eq("group_id", groupId)
  } else {
    query.is("group_id", null)
  }

  const { data: firstRankData } = await query.maybeSingle()

  return generateRankBetween(null, firstRankData?.rank ?? null)
}

export async function createBookmarkRecord(
  supabase: LibrarySupabaseClient,
  userId: string,
  input: CreateBookmarkInput,
) {
  const normalizedUrl = normalizeUrl(input.url)
  const domain = getDomain(input.url)
  const persistedGroupId = toPersistedGroupId(input.group_id)
  const nextOrderIndex =
    input.order_index === undefined || input.order_index === null
      ? await findNextBookmarkOrderIndex(supabase, userId)
      : input.order_index
  const nextRank =
    input.rank === undefined || input.rank === null
      ? await findNextBookmarkRank(supabase, userId, persistedGroupId)
      : input.rank
  const title = input.title?.trim() || normalizedUrl

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      id: input.id,
      url: input.url,
      normalized_url: normalizedUrl,
      domain,
      title,
      favicon_url: input.favicon_url ?? null,
      og_image_url: input.og_image_url ?? null,
      image_url: input.image_url ?? input.og_image_url ?? null,
      description: input.description ?? null,
      group_id: persistedGroupId,
      user_id: userId,
      status: input.status,
      is_enriching: false,
      visit_count: 0,
      last_visited_at: null,
      last_fetched_at: input.last_fetched_at ?? null,
      order_index: nextOrderIndex,
      rank: nextRank,
    })
    .select(CREATE_BOOKMARK_RETURN_SELECT)
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data, error: null }
}
