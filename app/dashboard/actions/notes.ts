"use server"

import { notesMutations } from "@/lib/dashboard/server/library-mutations"

export async function createNote(formData: { text: string; color?: string | null }) {
  return notesMutations.create(formData)
}

export async function updateNote(id: string, formData: { text: string; color?: string | null }) {
  return notesMutations.update(id, formData)
}

export async function restoreNote(note: {
  id: string
  text: string
  color?: string | null
  created_at?: string | null
  updated_at?: string | null
  order_index?: number | null
}) {
  return notesMutations.restore(note)
}

export async function deleteNote(id: string) {
  return notesMutations.delete(id)
}

export async function deleteNotes(ids: string[]) {
  return notesMutations.deleteMany(ids)
}
