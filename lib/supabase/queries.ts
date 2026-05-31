import { Database } from "./database.types"
import {
  listBookmarksForDashboard,
  listGroupsForDashboard,
} from "@/lib/library/server/reads"
import { createClient } from "./server"

type BookmarkTableRow = Database["public"]["Tables"]["bookmarks"]["Row"]
type BookmarkDetailFields =
  | "description"
  | "og_image_url"
  | "image_url"
  | "screenshot_url"
  | "last_fetched_at"
  | "error_reason"

export type BookmarkRow = Omit<BookmarkTableRow, BookmarkDetailFields> &
  Partial<Pick<BookmarkTableRow, BookmarkDetailFields>>
export type BookmarkDetailRow = Pick<BookmarkTableRow, "id" | BookmarkDetailFields>
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"]
export type TodoRow = Database["public"]["Tables"]["todos"]["Row"]

function createSupabaseQueryError(scope: string, error: { code?: string; message?: string }) {
  const detail = error.code ? `[${error.code}] ${error.message || "Unknown error"}` : (error.message || "Unknown error")
  return new Error(`Failed to load ${scope}: ${detail}`, {
    cause: error,
  })
}

export async function getBookmarks() {
  const supabase = await createClient()

  const { data, error } = await listBookmarksForDashboard(supabase)

  if (error) {
    throw createSupabaseQueryError("bookmarks", error)
  }

  return (data ?? []).map((bookmark) => ({
    ...bookmark,
    is_enriching: false,
  }))
}

export async function getNotes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notes")
    .select("id,text,color,user_id,created_at,updated_at,order_index")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw createSupabaseQueryError("notes", error)
  }

  return data ?? []
}

export async function getTodos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("todos")
    .select("id,text,priority,completed,completed_at,user_id,created_at,updated_at,order_index")
    .order("completed", { ascending: true })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw createSupabaseQueryError("todos", error)
  }

  return data ?? []
}

export async function getGroups() {
  const supabase = await createClient()

  const { data, error } = await listGroupsForDashboard(supabase)

  if (error) {
    throw createSupabaseQueryError("groups", error)
  }

  return data ?? []
}
