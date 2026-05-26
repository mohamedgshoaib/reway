// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import { revalidatePath } from "next/cache"
import { fetchMetadata, normalizeUrl } from "@/lib/metadata"
import {
  createBookmarkRecord,
  createGroupRecord,
  validateGroupAccess,
} from "@/lib/library/server/capture"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getDomain } from "@/lib/utils"

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>

interface DashboardMutationContext {
  supabase: DashboardSupabaseClient
  userId: string
}

async function runAuthenticatedDashboardOperation<T>(
  mutation: (context: DashboardMutationContext) => Promise<T>,
  options?: {
    revalidateDashboard?: boolean
  },
): Promise<T> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const result = await mutation({
    supabase,
    userId: userData.user.id,
  })

  if (options?.revalidateDashboard ?? true) {
    revalidatePath("/dashboard")
  }
  return result
}

export type TodoPriority = "high" | "medium" | "low"

const normalizePriority = (value: string): TodoPriority => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "high" || normalized === "h") return "high"
  if (normalized === "low" || normalized === "l") return "low"
  return "medium"
}

export const notesMutations = {
  async create(formData: { text: string; color?: string | null }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { data: minOrderData } = await supabase
        .from("notes")
        .select("order_index")
        .eq("user_id", userId)
        .order("order_index", { ascending: true })
        .limit(1)
        .single()

      const nextOrderIndex = minOrderData ? (minOrderData.order_index ?? 0) - 1 : 0

      const { data, error } = await supabase
        .from("notes")
        .insert({
          text: formData.text,
          color: formData.color ?? null,
          user_id: userId,
          order_index: nextOrderIndex,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating note:", error)
        throw new Error("Failed to create note")
      }

      return data.id
    })
  },

  async update(id: string, formData: { text: string; color?: string | null }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("notes")
        .update({
          text: formData.text,
          color: formData.color ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating note:", error)
        throw new Error("Failed to update note")
      }
    })
  },

  async restore(note: {
    id: string
    text: string
    color?: string | null
    created_at?: string | null
    updated_at?: string | null
    order_index?: number | null
  }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase.from("notes").insert({
        id: note.id,
        user_id: userId,
        text: note.text,
        color: note.color ?? null,
        created_at: note.created_at ?? new Date().toISOString(),
        updated_at: note.updated_at ?? new Date().toISOString(),
        order_index: note.order_index ?? null,
      })

      if (error) {
        console.error("Error restoring note:", error)
        throw new Error("Failed to restore note")
      }
    })
  },

  async delete(id: string) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting note:", error)
        throw new Error("Failed to delete note")
      }
    })
  },

  async deleteMany(ids: string[]) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
      if (uniqueIds.length === 0) return

      const { error } = await supabase
        .from("notes")
        .delete()
        .in("id", uniqueIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting notes:", error)
        throw new Error("Failed to delete notes")
      }
    })
  },
}

export const todosMutations = {
  async create(formData: { text: string; priority: TodoPriority | string }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { data: minOrderData } = await supabase
        .from("todos")
        .select("order_index")
        .eq("user_id", userId)
        .order("order_index", { ascending: true })
        .limit(1)
        .single()

      const nextOrderIndex = minOrderData ? (minOrderData.order_index ?? 0) - 1 : 0
      const priority = normalizePriority(formData.priority)

      const { data, error } = await supabase
        .from("todos")
        .insert({
          text: formData.text,
          priority,
          completed: false,
          completed_at: null,
          user_id: userId,
          order_index: nextOrderIndex,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating todo:", error)
        throw new Error("Failed to create todo")
      }

      return data.id
    })
  },

  async update(id: string, formData: { text: string; priority: TodoPriority | string }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const priority = normalizePriority(formData.priority)

      const { error } = await supabase
        .from("todos")
        .update({
          text: formData.text,
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating todo:", error)
        throw new Error("Failed to update todo")
      }
    })
  },

  async restore(todo: {
    id: string
    text: string
    priority: TodoPriority | string
    completed: boolean
    completed_at?: string | null
    created_at?: string | null
    updated_at?: string | null
    order_index?: number | null
  }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const priority = normalizePriority(todo.priority)

      const { error } = await supabase.from("todos").insert({
        id: todo.id,
        user_id: userId,
        text: todo.text,
        priority,
        completed: todo.completed,
        completed_at: todo.completed_at ?? null,
        created_at: todo.created_at ?? new Date().toISOString(),
        updated_at: todo.updated_at ?? new Date().toISOString(),
        order_index: todo.order_index ?? null,
      })

      if (error) {
        console.error("Error restoring todo:", error)
        throw new Error("Failed to restore todo")
      }
    })
  },

  async setCompleted(id: string, completed: boolean) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("todos")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating todo completion:", error)
        throw new Error("Failed to update todo")
      }
    })
  },

  async delete(id: string) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting todo:", error)
        throw new Error("Failed to delete todo")
      }
    })
  },

  async deleteMany(ids: string[]) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
      if (uniqueIds.length === 0) return

      const { error } = await supabase
        .from("todos")
        .delete()
        .in("id", uniqueIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting todos:", error)
        throw new Error("Failed to delete todos")
      }
    })
  },

  async setManyCompleted(ids: string[], completed: boolean) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
      if (uniqueIds.length === 0) return

      const { error } = await supabase
        .from("todos")
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .in("id", uniqueIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error bulk updating todos:", error)
        throw new Error("Failed to update todos")
      }
    })
  },
}

export const groupsMutations = {
  async checkDuplicate(
    name: string,
    excludeId?: string,
  ): Promise<{
    exists: boolean
    group?: { id: string; name: string }
  }> {
    return runAuthenticatedDashboardOperation(
      async ({ supabase, userId }) => {
        const normalizedName = name.trim().toLowerCase()

        const { data } = await supabase.from("groups").select("id, name").eq("user_id", userId)

        const existingGroup = data?.find(
          (group) =>
            group.name?.trim().toLowerCase() === normalizedName &&
            (!excludeId || group.id !== excludeId),
        )

        if (existingGroup) {
          return { exists: true, group: existingGroup }
        }

        return { exists: false }
      },
      { revalidateDashboard: false },
    )
  },

  async create(formData: { name: string; icon: string; color?: string | null }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { data, error } = await createGroupRecord(supabase, userId, formData)

      if (error) {
        if (error.code === "23505") {
          throw new Error("A group with this name already exists")
        }
        console.error("Error creating group:", error)
        throw new Error("Failed to create group")
      }

      return data.id
    })
  },

  async update(
    id: string,
    formData: {
      name: string
      icon: string
      color?: string | null
      hide_from_all_bookmarks?: boolean | null
    },
  ) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("groups")
        .update({
          name: formData.name,
          icon: formData.icon,
          color: formData.color ?? null,
          hide_from_all_bookmarks: formData.hide_from_all_bookmarks ?? false,
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        if (error.code === "23505") {
          throw new Error("A group with this name already exists")
        }
        console.error("Error updating group:", error)
        throw new Error("Failed to update group")
      }
    })
  },

  async updateOrder(updates: { id: string; order_index: number }[]) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const updatePromises = updates.map((update) =>
        supabase
          .from("groups")
          .update({ order_index: update.order_index })
          .eq("id", update.id)
          .eq("user_id", userId),
      )

      const results = await Promise.all(updatePromises)

      const firstError = results.find((result) => result.error)?.error
      if (firstError) {
        console.error("Error updating groups order:", firstError)
        throw new Error(`Failed to update order: ${firstError.message}`)
      }
    })
  },

  async delete(id: string) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting group:", error)
        throw new Error("Failed to delete group")
      }
    })
  },

  async restore(group: {
    id: string
    name: string
    icon: string
    color?: string | null
    hide_from_all_bookmarks?: boolean | null
  }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("groups")
        .upsert({
          id: group.id,
          name: group.name,
          icon: group.icon,
          color: group.color ?? null,
          hide_from_all_bookmarks: group.hide_from_all_bookmarks ?? false,
          user_id: userId,
        })
        .eq("user_id", userId)

      if (error) {
        console.error("Error restoring group:", error)
        throw new Error("Failed to restore group")
      }
    })
  },

  async setHiddenFromAllBookmarks(id: string, hide: boolean) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("groups")
        .update({
          hide_from_all_bookmarks: hide,
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error toggling group visibility:", error)
        throw new Error("Failed to update group visibility")
      }
    })
  },
}

export const accountMutations = {
  async delete() {
    return runAuthenticatedDashboardOperation(
      async ({ supabase, userId }) => {
        const deleteResults = await Promise.all([
          supabaseAdmin.from("bookmarks").delete().eq("user_id", userId),
          supabaseAdmin.from("groups").delete().eq("user_id", userId),
        ])

        for (const result of deleteResults) {
          if (result.error) {
            throw new Error(result.error.message)
          }
        }

        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteUserError) {
          throw new Error(deleteUserError.message)
        }

        await supabase.auth.signOut()

        return { success: true }
      },
      { revalidateDashboard: false },
    )
  },
}

export const bookmarkMutations = {
  async checkDuplicates(urls: string[]): Promise<{
    duplicates: Record<string, { id: string; title: string; url: string }>
  }> {
    return runAuthenticatedDashboardOperation(
      async ({ supabase, userId }) => {
        const normalizedUrls = urls.map((url) => normalizeUrl(url))

        const { data } = await supabase
          .from("bookmarks")
          .select("id, title, url, normalized_url")
          .eq("user_id", userId)
          .in("normalized_url", normalizedUrls)

        const duplicates: Record<string, { id: string; title: string; url: string }> = {}
        if (data) {
          for (const bookmark of data) {
            if (bookmark.normalized_url) {
              duplicates[bookmark.normalized_url] = {
                id: bookmark.id,
                title: bookmark.title,
                url: bookmark.url,
              }
            }
          }
        }

        return { duplicates }
      },
      { revalidateDashboard: false },
    )
  },

  async add(formData: {
    url: string
    id?: string
    title?: string
    favicon_url?: string
    og_image_url?: string
    description?: string
    group_id?: string
    order_index?: number
  }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { data, error } = await createBookmarkRecord(supabase, userId, {
        ...formData,
        status: "pending",
      })

      if (error) {
        console.error("Error adding bookmark:", error)
        throw new Error("Failed to add bookmark")
      }

      return data.id
    })
  },

  async enrichCreated(id: string, url: string) {
    try {
      const metadata = await fetchMetadata(url)

      return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
        const { data: existingBookmark, error: bookmarkError } = await supabase
          .from("bookmarks")
          .select("id, title, url, normalized_url")
          .eq("id", id)
          .eq("user_id", userId)
          .single()

        if (bookmarkError || !existingBookmark) {
          throw new Error("Failed to load bookmark for enrichment")
        }

        const nextTitle = metadata.title?.trim()
        const nextDescription = metadata.description?.trim()
        const nextFavicon = metadata.favicon?.trim()
        const nextOgImage = metadata.ogImage?.trim()
        const fetchedAt = new Date().toISOString()

        const fallbackTitleForMetadataDomain = (domain: string) => {
          const key = domain.toLowerCase()
          if (key === "x.com" || key === "twitter.com") return "X"
          if (key === "tiktok.com") return "TikTok"
          const parts = key.split(".").filter(Boolean)
          const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || key
          return base ? base.charAt(0).toUpperCase() + base.slice(1) : null
        }

        const currentTitle = (existingBookmark.title ?? "").trim()
        const currentUrl = (existingBookmark.url ?? "").trim()
        const currentNormalized = (existingBookmark.normalized_url ?? "").trim()
        const isDefaultTitle =
          !currentTitle || currentTitle === currentUrl || currentTitle === currentNormalized

        const computedFallbackTitle =
          !nextTitle && isDefaultTitle ? fallbackTitleForMetadataDomain(metadata.domain) : null

        const titleToWrite = nextTitle || computedFallbackTitle || null

        await supabase
          .from("bookmarks")
          .update({
            ...(titleToWrite ? { title: titleToWrite } : {}),
            ...(nextDescription ? { description: nextDescription } : {}),
            ...(nextFavicon ? { favicon_url: nextFavicon } : {}),
            ...(nextOgImage ? { og_image_url: nextOgImage, image_url: nextOgImage } : {}),
            status: "ready",
            last_fetched_at: fetchedAt,
          })
          .eq("id", id)
          .eq("user_id", userId)

        return {
          status: "ready" as const,
          title: titleToWrite || undefined,
          description: nextDescription || undefined,
          favicon_url: nextFavicon || undefined,
          og_image_url: nextOgImage || undefined,
          image_url: nextOgImage || undefined,
          last_fetched_at: fetchedAt,
          error_reason: null,
        }
      })
    } catch (error) {
      console.error("Enrichment failed for", url, error)
      const attemptedAt = new Date().toISOString()

      return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
        await supabase
          .from("bookmarks")
          .update({
            status: "failed",
            error_reason: error instanceof Error ? error.message : "Unknown error",
            last_fetched_at: attemptedAt,
          })
          .eq("id", id)
          .eq("user_id", userId)

        return {
          status: "failed" as const,
          error_reason: error instanceof Error ? error.message : "Unknown error",
          last_fetched_at: attemptedAt,
        }
      })
    }
  },

  async updateOrder(updates: { id: string; order_index: number }[]) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const updatePromises = updates.map((update) =>
        supabase
          .from("bookmarks")
          .update({ order_index: update.order_index })
          .eq("id", update.id)
          .eq("user_id", userId),
      )

      const results = await Promise.all(updatePromises)

      const firstError = results.find((result) => result.error)?.error
      if (firstError) {
        console.error("Error updating order:", firstError)
        throw new Error(`Failed to update order: ${firstError.message}`)
      }
    })
  },

  async moveToGroup(ids: string[], targetGroupId: string | null) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
      if (uniqueIds.length === 0) return

      if (targetGroupId) {
        const groupValidation = await validateGroupAccess(supabase, userId, targetGroupId)
        if (!groupValidation.valid) {
          throw new Error("Invalid target group")
        }
      }

      const { error } = await supabase
        .from("bookmarks")
        .update({ group_id: targetGroupId })
        .in("id", uniqueIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error moving bookmarks:", error)
        throw new Error("Failed to move bookmarks")
      }
    })
  },

  async deleteMany(ids: string[]) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
      if (uniqueIds.length === 0) return

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .in("id", uniqueIds)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting bookmarks:", error)
        throw new Error("Failed to delete bookmarks")
      }
    })
  },

  async restore(bookmark: {
    id: string
    url: string
    title: string
    description?: string | null
    group_id?: string | null
    favicon_url?: string | null
    og_image_url?: string | null
    image_url?: string | null
    order_index?: number | null
    created_at?: string | null
    status?: string | null
    visit_count?: number | null
    last_visited_at?: string | null
  }) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const normalizedUrl = normalizeUrl(bookmark.url)
      const domain = getDomain(bookmark.url)

      const { error } = await supabase.from("bookmarks").upsert(
        {
          id: bookmark.id,
          url: bookmark.url,
          normalized_url: normalizedUrl,
          domain,
          title: bookmark.title,
          description: bookmark.description ?? null,
          group_id: bookmark.group_id ?? null,
          favicon_url: bookmark.favicon_url ?? null,
          og_image_url: bookmark.og_image_url ?? null,
          image_url: bookmark.image_url ?? null,
          order_index: bookmark.order_index ?? null,
          created_at: bookmark.created_at ?? new Date().toISOString(),
          status: bookmark.status ?? "ready",
          visit_count: bookmark.visit_count ?? 0,
          last_visited_at: bookmark.last_visited_at ?? null,
          user_id: userId,
        },
        { onConflict: "id" },
      )

      if (error) {
        console.error("Error restoring bookmark:", error)
        throw new Error("Failed to restore bookmark")
      }
    })
  },

  async delete(id: string) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting bookmark:", error)
        throw new Error("Failed to delete bookmark")
      }
    })
  },

  async enrich(
    id: string,
    metadata: {
      title?: string
      favicon_url?: string
      og_image_url?: string
      description?: string
      image_url?: string
      status?: "pending" | "ready" | "failed"
    },
  ) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const { error } = await supabase
        .from("bookmarks")
        .update({
          ...metadata,
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error enriching bookmark:", error)
      }
    })
  },

  async update(
    id: string,
    formData: {
      title: string
      url: string
      description?: string
      group_id?: string | null
      favicon_url?: string | null
      apply_favicon_to_domain?: boolean
    },
  ) {
    return runAuthenticatedDashboardOperation(async ({ supabase, userId }) => {
      const normalizedUrl = normalizeUrl(formData.url)
      const domain = getDomain(formData.url)

      const { error } = await supabase
        .from("bookmarks")
        .update({
          title: formData.title,
          url: formData.url,
          normalized_url: normalizedUrl,
          domain,
          description: formData.description,
          group_id: formData.group_id,
          favicon_url: formData.favicon_url,
        })
        .eq("id", id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating bookmark:", error)
        throw new Error("Failed to update bookmark")
      }

      if (formData.apply_favicon_to_domain && domain) {
        const { error: domainUpdateError } = await supabase
          .from("bookmarks")
          .update({ favicon_url: formData.favicon_url ?? null })
          .eq("user_id", userId)
          .eq("domain", domain)

        if (domainUpdateError) {
          console.error("Error updating domain favicon:", domainUpdateError)
          throw new Error("Failed to update domain favicon")
        }
      }
    })
  },
}
