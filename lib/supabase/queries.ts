import { createClient } from "./server";
import { Database } from "./database.types";

export type BookmarkRow = Database["public"]["Tables"]["bookmarks"]["Row"];
export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type TodoRow = Database["public"]["Tables"]["todos"]["Row"];

export async function getBookmarks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      "id,url,normalized_url,domain,title,description,favicon_url,og_image_url,image_url,screenshot_url,group_id,user_id,created_at,order_index,status,is_enriching,last_fetched_at,last_visited_at,visit_count,error_reason",
    )
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error.message || error);
    return [];
  }

  return data;
}

export async function getNotes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id,text,color,user_id,created_at,updated_at,order_index")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error.message || error);
    return [];
  }

  return data;
}

export async function getTodos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("todos")
    .select(
      "id,text,priority,completed,completed_at,user_id,created_at,updated_at,order_index",
    )
    .order("completed", { ascending: true })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos:", error.message || error);
    return [];
  }

  return data;
}

export async function getGroups() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id,name,icon,color,user_id,created_at,order_index,hide_from_all_bookmarks",
    )
    .order("order_index", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching groups:", error.message || error);
    return [];
  }

  return data;
}
