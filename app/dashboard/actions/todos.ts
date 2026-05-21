"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type TodoPriority = "high" | "medium" | "low"

const normalizePriority = (value: string): TodoPriority => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "high" || normalized === "h") return "high"
  if (normalized === "low" || normalized === "l") return "low"
  return "medium"
}

export async function createTodo(formData: { text: string; priority: TodoPriority | string }) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data: minOrderData } = await supabase
    .from("todos")
    .select("order_index")
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
      user_id: userData.user.id,
      order_index: nextOrderIndex,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating todo:", error)
    throw new Error("Failed to create todo")
  }

  revalidatePath("/dashboard")
  return data.id
}

export async function updateTodo(
  id: string,
  formData: { text: string; priority: TodoPriority | string },
) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const priority = normalizePriority(formData.priority)

  const { error } = await supabase
    .from("todos")
    .update({
      text: formData.text,
      priority,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    console.error("Error updating todo:", error)
    throw new Error("Failed to update todo")
  }

  revalidatePath("/dashboard")
}

export async function restoreTodo(todo: {
  id: string
  text: string
  priority: TodoPriority | string
  completed: boolean
  completed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  order_index?: number | null
}) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const priority = normalizePriority(todo.priority)

  const { error } = await supabase.from("todos").insert({
    id: todo.id,
    user_id: userData.user.id,
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

  revalidatePath("/dashboard")
}

export async function setTodoCompleted(id: string, completed: boolean) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("todos")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    console.error("Error updating todo completion:", error)
    throw new Error("Failed to update todo")
  }

  revalidatePath("/dashboard")
}

export async function deleteTodo(id: string) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    console.error("Error deleting todo:", error)
    throw new Error("Failed to delete todo")
  }

  revalidatePath("/dashboard")
}

export async function deleteTodos(ids: string[]) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const uniqueIds = Array.from(new Set(ids)).filter(Boolean)
  if (uniqueIds.length === 0) return

  const { error } = await supabase
    .from("todos")
    .delete()
    .in("id", uniqueIds)
    .eq("user_id", userData.user.id)

  if (error) {
    console.error("Error deleting todos:", error)
    throw new Error("Failed to delete todos")
  }

  revalidatePath("/dashboard")
}

export async function setTodosCompleted(ids: string[], completed: boolean) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

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
    .eq("user_id", userData.user.id)

  if (error) {
    console.error("Error bulk updating todos:", error)
    throw new Error("Failed to update todos")
  }

  revalidatePath("/dashboard")
}
