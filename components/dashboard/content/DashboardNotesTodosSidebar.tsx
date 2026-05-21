"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { NoteRow, TodoRow } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { NotesSection } from "./notes-todos/NotesSection"
import { TodosSection } from "./notes-todos/TodosSection"
import type { TodoPriority } from "./notes-todos/types"

interface DashboardNotesTodosSidebarProps {
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

  layoutDensity?: "compact" | "extended"
}

export function DashboardNotesTodosSidebar({
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
  layoutDensity = "compact",
}: DashboardNotesTodosSidebarProps) {
  const [viewportWidth, setViewportWidth] = useState<number>(0)
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const pointerInsideRef = useRef(false)
  const openActionMenuCountRef = useRef(0)

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth)
    update()
    window.addEventListener("resize", update, { passive: true })
    return () => window.removeEventListener("resize", update)
  }, [])

  const canPin = useMemo(() => {
    const mainMaxWidth = layoutDensity === "extended" ? 1600 : 768
    const sidebarWidth = 240
    const gutters = 24 + 24
    const required = mainMaxWidth + sidebarWidth * 2 + gutters
    return viewportWidth >= required
  }, [layoutDensity, viewportWidth])

  const scheduleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      if (openActionMenuCountRef.current > 0) return
      setIsHoverOpen(false)
    }, 250)
  }

  const cancelClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const handleSidebarMouseEnter = () => {
    pointerInsideRef.current = true
    cancelClose()
    setIsHoverOpen(true)
  }

  const handleSidebarMouseLeave = () => {
    pointerInsideRef.current = false
    if (!isPinnedOpen) scheduleClose()
  }

  const handleActionMenuOpenChange = (open: boolean) => {
    openActionMenuCountRef.current = Math.max(0, openActionMenuCountRef.current + (open ? 1 : -1))

    if (open) {
      cancelClose()
      setIsHoverOpen(true)
      return
    }

    if (!isPinnedOpen && !pointerInsideRef.current) {
      scheduleClose()
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      cancelClose()
      setIsHoverOpen(true)
    }
    const handleClose = () => {
      setIsHoverOpen(false)
    }

    window.addEventListener("reway:open-sidebar-notes", handleOpen)
    window.addEventListener("reway:close-sidebar-notes", handleClose)

    return () => {
      window.removeEventListener("reway:open-sidebar-notes", handleOpen)
      window.removeEventListener("reway:close-sidebar-notes", handleClose)
    }
  }, [])

  const [activeSection, setActiveSection] = useState<"notes" | "todos">("notes")

  const sidebarBody = (
    <>
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

      {activeSection === "notes" ? (
        <NotesSection
          notes={notes}
          onCreateNote={onCreateNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onDeleteNotes={onDeleteNotes}
          onActionMenuOpenChange={handleActionMenuOpenChange}
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
          onActionMenuOpenChange={handleActionMenuOpenChange}
        />
      )}
    </>
  )

  if (layoutDensity !== "extended") {
    const canReveal = viewportWidth >= 900

    return (
      <>
        {canPin ? (
          <aside
            data-onboarding="notes-todos-desktop"
            className="fixed right-6 top-43 bottom-6 z-30 w-60 flex flex-col gap-2 text-sm text-muted-foreground"
          >
            {sidebarBody}
          </aside>
        ) : canReveal ? (
          <>
            <button
              type="button"
              data-onboarding="notes-todos-trigger"
              className="fixed right-0 top-1/2 -translate-y-1/2 z-50 h-18 w-6 items-center justify-center rounded-l-2xl bg-muted/20 ring-1 ring-inset ring-foreground/10 text-muted-foreground text-[11px] hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Toggle notes and todos sidebar"
              onClick={() => {
                setIsPinnedOpen((p) => !p)
                setIsHoverOpen(true)
              }}
              onMouseEnter={() => {
                handleSidebarMouseEnter()
              }}
              onMouseLeave={() => {
                handleSidebarMouseLeave()
              }}
            >
              {/* Issue: single-letter handles are hard to discover.
                  Fix: use short, stacked labels for clarity without taking horizontal space. */}
              <span className="[writing-mode:vertical-rl] whitespace-nowrap text-[9px] tracking-wide">
                Notes{"\u00A0"}&{"\u00A0"}Todos
              </span>
            </button>

            <aside
              data-onboarding="notes-todos-desktop"
              className={`fixed right-0 top-43 bottom-6 z-50 w-60 transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                isPinnedOpen || isHoverOpen ? "translate-x-0" : "translate-x-full"
              }`}
              onMouseEnter={() => {
                handleSidebarMouseEnter()
              }}
              onMouseLeave={() => {
                handleSidebarMouseLeave()
              }}
            >
              <div className="h-full rounded-l-3xl bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70 ring-1 ring-foreground/8 px-2 py-2 flex flex-col gap-2 text-sm text-muted-foreground">
                {sidebarBody}
              </div>
            </aside>
          </>
        ) : null}
      </>
    )
  }

  return (
    <>
      <aside
        data-onboarding="notes-todos-desktop"
        className={`hidden min-[1200px]:flex fixed right-6 top-43 bottom-6 z-50 w-60 flex-col gap-2 text-sm text-muted-foreground ${
          canPin ? "" : "min-[1200px]:hidden"
        }`}
      >
        {sidebarBody}
      </aside>

      {!canPin ? (
        <>
          <button
            type="button"
            data-onboarding="notes-todos-trigger"
            className="hidden min-[1200px]:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 h-24 w-5 items-center justify-center rounded-l-2xl bg-muted/20 ring-1 ring-inset ring-foreground/10 text-muted-foreground text-[11px] hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle notes and todos sidebar"
            onClick={() => {
              setIsPinnedOpen((p) => !p)
              setIsHoverOpen(true)
            }}
            onMouseEnter={() => {
              handleSidebarMouseEnter()
            }}
            onMouseLeave={() => {
              handleSidebarMouseLeave()
            }}
          >
            <span className="[writing-mode:vertical-rl] whitespace-nowrap text-[9px] tracking-wide">
              Notes{"\u00A0"}&{"\u00A0"}Todos
            </span>
          </button>

          <aside
            data-onboarding="notes-todos-desktop"
            className={`hidden min-[1200px]:block fixed right-0 top-43 bottom-6 z-50 w-60 transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              isPinnedOpen || isHoverOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onMouseEnter={() => {
              handleSidebarMouseEnter()
            }}
            onMouseLeave={() => {
              handleSidebarMouseLeave()
            }}
          >
            <div className="h-full rounded-l-3xl bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70 ring-1 ring-foreground/8 px-2 py-2 flex flex-col gap-2 text-sm text-muted-foreground">
              {sidebarBody}
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
