// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { normalizeUrl } from "@/lib/metadata"
import { toPersistedGroupId } from "@/lib/system-groups"
import { getDomain } from "@/lib/utils"

type LibrarySupabaseClient = SupabaseClient<Database>

interface CreateGroupInput {
  name: string
  icon: string
  color?: string | null
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
  status: "pending" | "ready" | "failed"
  image_url?: string | null
  last_fetched_at?: string | null
}

export async function findNextGroupOrderIndex(
  supabase: LibrarySupabaseClient,
  userId: string,
) {
  const { data: maxOrderData } = await supabase
    .from("groups")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single()

  return maxOrderData ? (maxOrderData.order_index ?? 0) + 1 : 0
}

export async function createGroupRecord(
  supabase: LibrarySupabaseClient,
  userId: string,
  input: CreateGroupInput,
) {
  const nextOrderIndex = await findNextGroupOrderIndex(supabase, userId)

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: input.name,
      icon: input.icon,
      color: input.color ?? null,
      user_id: userId,
      order_index: nextOrderIndex,
    })
    .select("*")
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

export async function findNextBookmarkOrderIndex(
  supabase: LibrarySupabaseClient,
  userId: string,
) {
  const { data: minOrderData } = await supabase
    .from("bookmarks")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: true })
    .limit(1)
    .single()

  return minOrderData ? (minOrderData.order_index ?? 0) - 1 : 0
}

export async function createBookmarkRecord(
  supabase: LibrarySupabaseClient,
  userId: string,
  input: CreateBookmarkInput,
) {
  const nextOrderIndex =
    input.order_index === undefined || input.order_index === null
      ? await findNextBookmarkOrderIndex(supabase, userId)
      : input.order_index

  const normalizedUrl = normalizeUrl(input.url)
  const domain = getDomain(input.url)
  const persistedGroupId = toPersistedGroupId(input.group_id)
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
    })
    .select("*")
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data, error: null }
}
