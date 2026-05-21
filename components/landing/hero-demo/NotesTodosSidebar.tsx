"use client"

import { useState } from "react"
import { NOTE_COLORS } from "@/components/dashboard/content/notes-todos/config"
import type { TodoPriority } from "@/components/dashboard/content/notes-todos/types"
import type { NoteRow, TodoRow } from "@/lib/supabase/queries"
import { HeroNoteCreateCard as NoteCreateCard } from "./HeroNoteCreateCard"
import { HeroTodoCreateCard as TodoCreateCard } from "./HeroTodoCreateCard"

export function NotesTodosSidebar({
  activeNotesTodosSection,
  setActiveNotesTodosSection,
  notes,
  todos,
  NotesSectionPreview,
  TodosSectionPreview,
  onCreateNote,
  onCreateTodo,
}: {
  activeNotesTodosSection: "notes" | "todos"
  setActiveNotesTodosSection: (v: "notes" | "todos") => void
  notes: NoteRow[]
  todos: TodoRow[]
  NotesSectionPreview: React.ComponentType<{ notes: NoteRow[] }>
  TodosSectionPreview: React.ComponentType<{ todos: TodoRow[] }>
  onCreateNote: (formData: { text: string; color?: string | null }) => Promise<string>
  onCreateTodo: (formData: { text: string; priority: TodoPriority }) => Promise<string>
}) {
  const [creatingNote, setCreatingNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [newNoteColor, setNewNoteColor] = useState<string | null>(NOTE_COLORS[5])
  const [isCreatingNote, setIsCreatingNote] = useState(false)

  const [creatingTodo, setCreatingTodo] = useState(false)
  const [newTodoText, setNewTodoText] = useState("")
  const [newTodoPriority, setNewTodoPriority] = useState<TodoPriority>("medium")
  const [isCreatingTodo, setIsCreatingTodo] = useState(false)

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return
    setIsCreatingNote(true)
    try {
      await onCreateNote({ text: newNoteText.trim(), color: newNoteColor })
      setCreatingNote(false)
      setNewNoteText("")
      setNewNoteColor(NOTE_COLORS[5])
    } finally {
      setIsCreatingNote(false)
    }
  }

  const handleCreateTodo = async () => {
    if (!newTodoText.trim()) return
    setIsCreatingTodo(true)
    try {
      await onCreateTodo({
        text: newTodoText.trim(),
        priority: newTodoPriority,
      })
      setCreatingTodo(false)
      setNewTodoText("")
      setNewTodoPriority("medium")
    } finally {
      setIsCreatingTodo(false)
    }
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 px-4 pb-4 pt-18.5 text-xs text-muted-foreground min-[1200px]:flex overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-muted/20 p-1 ring-1 ring-inset ring-foreground/5">
          <button
            type="button"
            className={`px-2 py-1 text-[11px] rounded-lg cursor-pointer ${
              activeNotesTodosSection === "notes"
                ? "bg-muted/40 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-muted/40"
            }`}
            onClick={() => setActiveNotesTodosSection("notes")}
          >
            Notes
          </button>
          <button
            type="button"
            className={`px-2 py-1 text-[11px] rounded-lg cursor-pointer ${
              activeNotesTodosSection === "todos"
                ? "bg-muted/40 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-muted/40"
            }`}
            onClick={() => setActiveNotesTodosSection("todos")}
          >
            Todos
          </button>
        </div>
      </div>

      {activeNotesTodosSection === "notes" ? (
        <>
          <div className="flex flex-1 flex-col overflow-hidden">
            <NotesSectionPreview notes={notes} />
          </div>
          <div className="mt-auto">
            <NoteCreateCard
              creating={creatingNote}
              setCreating={setCreatingNote}
              text={newNoteText}
              setText={setNewNoteText}
              color={newNoteColor}
              setColor={setNewNoteColor}
              isCreating={isCreatingNote}
              onCreate={() => void handleCreateNote()}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col overflow-hidden">
            <TodosSectionPreview todos={todos} />
          </div>
          <div className="mt-auto">
            <TodoCreateCard
              creating={creatingTodo}
              setCreating={setCreatingTodo}
              text={newTodoText}
              setText={setNewTodoText}
              priority={newTodoPriority}
              setPriority={setNewTodoPriority}
              isCreating={isCreatingTodo}
              onCreate={() => void handleCreateTodo()}
            />
          </div>
        </>
      )}
    </aside>
  )
}
