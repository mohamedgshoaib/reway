"use server"

import { todosMutations, type TodoPriority } from "@/lib/dashboard/server/library-mutations"

export async function createTodo(formData: { text: string; priority: TodoPriority | string }) {
  return todosMutations.create(formData)
}

export async function updateTodo(
  id: string,
  formData: { text: string; priority: TodoPriority | string },
) {
  return todosMutations.update(id, formData)
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
  return todosMutations.restore(todo)
}

export async function setTodoCompleted(id: string, completed: boolean) {
  return todosMutations.setCompleted(id, completed)
}

export async function deleteTodo(id: string) {
  return todosMutations.delete(id)
}

export async function deleteTodos(ids: string[]) {
  return todosMutations.deleteMany(ids)
}

export async function setTodosCompleted(ids: string[], completed: boolean) {
  return todosMutations.setManyCompleted(ids, completed)
}
