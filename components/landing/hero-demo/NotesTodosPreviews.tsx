"use client"

import { useState } from "react"

import type { NoteRow, TodoRow } from "@/lib/supabase/queries"
import { HeroNoteRow as NoteRowItem } from "./HeroNoteRow"
import { HeroTodoRow as TodoRowItem } from "./HeroTodoRow"

export function NotesSectionPreview({ notes }: { notes: NoteRow[] }) {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-1 cursor-default">
      {notes.map((note) => (
        <NoteRowItem
          key={note.id}
          note={note}
          expanded={expandedNoteId === note.id}
          onToggleExpanded={() => setExpandedNoteId((prev) => (prev === note.id ? null : note.id))}
        />
      ))}
    </div>
  )
}

export function TodosSectionPreview({
  todos,
  onToggleCompleted,
}: {
  todos: TodoRow[]
  onToggleCompleted: (id: string, completed: boolean) => void
}) {
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null)

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-1 cursor-default">
      {todos.map((todo) => (
        <TodoRowItem
          key={todo.id}
          todo={todo}
          expanded={expandedTodoId === todo.id}
          onToggleExpanded={() => setExpandedTodoId((prev) => (prev === todo.id ? null : todo.id))}
          onToggleCompleted={() => onToggleCompleted(todo.id, !todo.completed)}
        />
      ))}
    </div>
  )
}
