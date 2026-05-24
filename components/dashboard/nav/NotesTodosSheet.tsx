"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { NoteRow, TodoRow } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { NotesSection } from "../content/notes-todos/NotesSection"
import { TodosSection } from "../content/notes-todos/TodosSection"
import type { TodoPriority } from "../content/notes-todos/types"

interface NotesTodosSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notes: NoteRow[]
  todos: TodoRow[]
  onCreateNote: (formData: { text: string; color?: string | null }) => Promise<string>
  onUpdateNote: (id: string, formData: { text: string; color?: string | null }) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onDeleteNotes: (ids: string[]) => Promise<void>
  onCreateTodo: (formData: { text: string; priority: TodoPriority }) => Promise<string>
  onUpdateTodo: (id: string, formData: { text: string; priority: TodoPriority }) => Promise<void>
  onDeleteTodo: (id: string) => Promise<void>
  onDeleteTodos: (ids: string[]) => Promise<void>
  onSetTodoCompleted: (id: string, completed: boolean) => Promise<void>
  onSetTodosCompleted: (ids: string[], completed: boolean) => Promise<void>
}

export function NotesTodosSheet({
  open,
  onOpenChange,
  notes,
  todos,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onDeleteNotes,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onDeleteTodos,
  onSetTodoCompleted,
  onSetTodosCompleted,
}: NotesTodosSheetProps) {
  const [activeSection, setActiveSection] = useState<"notes" | "todos">("notes")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader>
          <SheetTitle className="text-lg">Notes & Todos</SheetTitle>
          <SheetDescription>Capture quick notes and track tasks.</SheetDescription>
        </SheetHeader>

        <SheetBody className="flex flex-col min-h-0 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-xl bg-muted/20 p-1 ring-1 ring-inset ring-foreground/5">
              <button
                type="button"
                className={cn(
                  "px-2 py-1 text-[11px] rounded-lg cursor-pointer",
                  activeSection === "notes"
                    ? "bg-muted/40 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/40",
                )}
                onClick={() => setActiveSection("notes")}
              >
                Notes
              </button>
              <button
                type="button"
                className={cn(
                  "px-2 py-1 text-[11px] rounded-lg cursor-pointer",
                  activeSection === "todos"
                    ? "bg-muted/40 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-muted/40",
                )}
                onClick={() => setActiveSection("todos")}
              >
                Todos
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col">
            {activeSection === "notes" ? (
              <NotesSection
                notes={notes}
                onCreateNote={onCreateNote}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onDeleteNotes={onDeleteNotes}
              />
            ) : (
              <TodosSection
                todos={todos}
                onCreateTodo={onCreateTodo}
                onUpdateTodo={onUpdateTodo}
                onDeleteTodo={onDeleteTodo}
                onDeleteTodos={onDeleteTodos}
                onSetTodoCompleted={onSetTodoCompleted}
                onSetTodosCompleted={onSetTodosCompleted}
              />
            )}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full rounded-lg cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
