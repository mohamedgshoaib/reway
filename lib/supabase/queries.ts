import { Database } from "./database.types"
import {
  listBookmarksForDashboard,
  listGroupsForDashboard,
} from "@/lib/library/server/reads"
import { createClient } from "./server"

export type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"]
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"]
export type TodoRow = Database["public"]["Tables"]["todos"]["Row"]

export async function getBookmarks() {
  const supabase = await createClient()

  const { data, error } = await listBookmarksForDashboard(supabase)

  if (error) {
    console.error("Error fetching bookmarks:", error.message || error)
    return []
  }

  return data.map((bookmark) => ({
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
    console.error("Error fetching notes:", error.message || error)
    return []
  }

  return data
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
    console.error("Error fetching todos:", error.message || error)
    return []
  }

  return data
}

export async function getGroups() {
  const supabase = await createClient()

  const { data, error } = await listGroupsForDashboard(supabase)

  if (error) {
    console.error("Error fetching groups:", error.message || error)
    return []
  }

  return data
}
