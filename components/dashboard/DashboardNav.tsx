"use client"

import { Note01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { checkDuplicateGroup, createGroup } from "@/app/dashboard/actions/groups"
import RewayLogo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { GroupRow } from "@/lib/supabase/queries"
import type { BookmarkRow, NoteRow, TodoRow } from "@/lib/supabase/queries"
import type { DashboardPaletteTheme } from "@/lib/themes"
import type { TodoPriority } from "./content/notes-todos/types"
import { DuplicatesSheet } from "./nav/DuplicatesSheet"
import { ExportSheet } from "./nav/ExportSheet"
import { GroupMenu } from "./nav/GroupMenu"
import { ImportSheet } from "./nav/ImportSheet"
import { LayoutControls } from "./nav/LayoutControls"
import { NotesTodosSheet } from "./nav/NotesTodosSheet"
import { ThemeControls } from "./nav/ThemeControls"
import type { User } from "./nav/types"
import { UserMenu } from "./nav/UserMenu"
import { ViewModeControls } from "./nav/ViewModeControls"

interface DashboardNavProps {
  user: User
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  notes: NoteRow[]
  todos: TodoRow[]
  activeGroupId: string
  groupCounts?: Record<string, number>
  onGroupSelect: (id: string) => void
  onGroupCreated?: (id: string, name: string, icon: string, color?: string | null) => void
  onGroupUpdate?: (id: string, name: string, icon: string, color?: string | null) => void
  onGroupDelete?: (id: string) => void
  onGroupOpen?: (id: string) => void
  onReorderGroups: (newOrder: GroupRow[]) => void
  rowContent: "date" | "group"
  setRowContent: (value: "date" | "group") => void
  showNotesTodos: boolean
  setShowNotesTodos: (value: boolean) => void
  paletteTheme: DashboardPaletteTheme
  setPaletteTheme: (value: DashboardPaletteTheme) => void
  folderHeaderTint: "off" | "low" | "medium" | "high"
  setFolderHeaderTint: (value: "off" | "low" | "medium" | "high") => void
  layoutDensity: "compact" | "extended"
  setLayoutDensity: (value: "compact" | "extended") => void
  viewMode: "list" | "card" | "folders"
  setViewMode: (value: "list" | "card" | "folders") => void
  exportGroupOptions: string[]
  importPreview: {
    groups: { name: string; count: number; duplicateCount?: number }[]
    entries: {
      title: string
      url: string
      groupName: string
      isDuplicate?: boolean
      action?: "skip" | "override" | "add"
    }[]
  } | null
  importProgress: {
    processed: number
    total: number
    status: "idle" | "importing" | "stopping" | "done" | "error" | "stopped"
  }
  importResult: {
    imported: number
    cancelled: number
    total: number
    status: "done" | "stopped" | "error"
  } | null
  exportProgress: {
    processed: number
    total: number
    status: "idle" | "exporting" | "done" | "error"
  }
  onImportFileSelected: (file: File) => void
  onUpdateImportAction: (action: "skip" | "override") => void
  onConfirmImport: (groups: string[]) => void
  onClearImport: () => void
  onExportBookmarks: (groups: string[]) => void
  onResetExport?: () => void
  onRemoveBookmarks?: (ids: string[]) => void

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

export function DashboardNav({
  user,
  bookmarks,
  groups,
  notes,
  todos,
  activeGroupId,
  onGroupSelect,
  onGroupCreated,
  onGroupUpdate,
  onGroupDelete,
  onGroupOpen,
  onReorderGroups,
  rowContent,
  setRowContent,
  showNotesTodos,
  setShowNotesTodos,
  paletteTheme,
  setPaletteTheme,
  folderHeaderTint,
  setFolderHeaderTint,
  layoutDensity,
  setLayoutDensity,
  viewMode,
  setViewMode,
  exportGroupOptions,
  importPreview,
  importProgress,
  importResult,
  exportProgress,
  onImportFileSelected,
  onUpdateImportAction,
  onConfirmImport,
  onClearImport,
  onExportBookmarks,
  onResetExport,
  onRemoveBookmarks,

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
}: DashboardNavProps) {
  void onReorderGroups
  const router = useRouter()
  const [isInlineCreating, setIsInlineCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupIcon, setNewGroupIcon] = useState("folder")
  const pickRandomGroupColor = () => {
    const palette = [
      "#6366f1",
      "#8b5cf6",
      "#ec4899",
      "#f43f5e",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
    ]
    return palette[Math.floor(Math.random() * palette.length)]
  }

  const [newGroupColor, setNewGroupColor] = useState<string | null>("#6366f1")
  const [isCreating, setIsCreating] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState("")
  const [editGroupIcon, setEditGroupIcon] = useState("folder")
  const [editGroupColor, setEditGroupColor] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [exportSheetOpen, setExportSheetOpen] = useState(false)
  const [duplicatesSheetOpen, setDuplicatesSheetOpen] = useState(false)
  const [notesTodosSheetOpen, setNotesTodosSheetOpen] = useState(false)
  const [selectedImportGroups, setSelectedImportGroups] = useState<string[]>([])
  const [selectedExportGroups, setSelectedExportGroups] = useState<string[]>([])

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleUpdateGroup = async (id: string, onError?: () => void) => {
    if (!editGroupName.trim() || isUpdating) return
    setIsUpdating(true)
    try {
      const { exists } = await checkDuplicateGroup(editGroupName.trim(), id)
      if (exists) {
        toast.error(`A group named "${editGroupName.trim()}" already exists`)
        onError?.()
        return
      }
      await onGroupUpdate?.(id, editGroupName.trim(), editGroupIcon, editGroupColor)
      setEditingGroupId(null)
    } catch (error) {
      console.error("Failed to update group:", error)
      if (error instanceof Error && /already exists/i.test(error.message)) {
        toast.error(error.message)
        onError?.()
      } else {
        toast.error("Failed to update group")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteGroupClick = (id: string) => {
    onGroupDelete?.(id)
  }

  const handleInlineCreate = async (onError?: () => void) => {
    if (!newGroupName.trim() || isCreating) return

    setIsCreating(true)
    try {
      const { exists } = await checkDuplicateGroup(newGroupName.trim())
      if (exists) {
        toast.error(`A group named "${newGroupName.trim()}" already exists`)
        onError?.()
        return
      }

      const folderColor = newGroupIcon === "folder" ? pickRandomGroupColor() : newGroupColor

      const groupId = await createGroup({
        name: newGroupName.trim(),
        icon: newGroupIcon,
        color: folderColor,
      })
      onGroupCreated?.(groupId, newGroupName.trim(), newGroupIcon, folderColor)
      setIsInlineCreating(false)
      setNewGroupName("")
      setNewGroupIcon("folder")
      setNewGroupColor("#6366f1")
    } catch (error) {
      console.error("Failed to create group:", error)
      if (error instanceof Error && /already exists/i.test(error.message)) {
        toast.error(error.message)
        onError?.()
      } else {
        toast.error("Failed to create group")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleImportGroup = (name: string) => {
    setSelectedImportGroups((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const handleToggleExportGroup = (name: string) => {
    setSelectedExportGroups((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }

  const handleImportOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedImportGroups([])

      // Closing the sheet should not implicitly stop an in-flight import.
      // Allow users to close and later reopen to check progress.
      if (importProgress.status !== "importing" && importProgress.status !== "stopping") {
        onClearImport()
      }
    }
    setImportSheetOpen(open)
  }

  const handleExportOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedExportGroups([])
      onResetExport?.()
    }
    setExportSheetOpen(open)
  }

  return (
    <>
      <NotesTodosSheet
        open={notesTodosSheetOpen}
        onOpenChange={setNotesTodosSheetOpen}
        notes={notes}
        todos={todos}
        onCreateNote={onCreateNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onDeleteNotes={onDeleteNotes}
        onCreateTodo={onCreateTodo}
        onUpdateTodo={onUpdateTodo}
        onDeleteTodo={onDeleteTodo}
        onDeleteTodos={onDeleteTodos}
        onSetTodoCompleted={onSetTodoCompleted}
        onSetTodosCompleted={onSetTodosCompleted}
      />

      <ImportSheet
        open={importSheetOpen}
        onOpenChange={handleImportOpenChange}
        importPreview={importPreview}
        importProgress={importProgress}
        importResult={importResult}
        selectedImportGroups={selectedImportGroups}
        onToggleImportGroup={handleToggleImportGroup}
        onImportFileSelected={onImportFileSelected}
        onUpdateImportAction={onUpdateImportAction}
        onConfirmImport={onConfirmImport}
        onClearImport={onClearImport}
      />

      <ExportSheet
        open={exportSheetOpen}
        onOpenChange={handleExportOpenChange}
        exportGroupOptions={exportGroupOptions}
        exportProgress={exportProgress}
        selectedExportGroups={selectedExportGroups}
        onToggleExportGroup={handleToggleExportGroup}
        onExportBookmarks={onExportBookmarks}
      />

      <DuplicatesSheet
        open={duplicatesSheetOpen}
        onOpenChange={setDuplicatesSheetOpen}
        bookmarks={bookmarks}
        onRemoveBookmarks={onRemoveBookmarks}
      />

      <nav
        className={`z-40 mx-auto ${
          layoutDensity === "extended" ? "max-w-400" : "max-w-3xl"
        } transition-transform duration-200 group-data-[scrolled=true]/body:top-2`}
      >
        <div className="flex h-14 w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                 document.cookie = "homepage-bypass=1; path=/; max-age=10; SameSite=Strict"
                 router.push("/")
              }}
              className="hidden md:flex shrink-0 items-center cursor-pointer"
              aria-label="Reway Homepage"
            >
              <RewayLogo className="size-8" aria-label="Reway" />
            </button>

            <GroupMenu
              groups={groups}
              activeGroupId={activeGroupId}
              onGroupSelect={onGroupSelect}
              onGroupOpen={onGroupOpen}
              onDeleteGroupClick={handleDeleteGroupClick}
              editingGroupId={editingGroupId}
              editGroupName={editGroupName}
              setEditGroupName={setEditGroupName}
              editGroupIcon={editGroupIcon}
              setEditGroupIcon={setEditGroupIcon}
              editGroupColor={editGroupColor}
              setEditGroupColor={setEditGroupColor}
              isUpdating={isUpdating}
              onUpdateGroup={handleUpdateGroup}
              isInlineCreating={isInlineCreating}
              setIsInlineCreating={setIsInlineCreating}
              newGroupName={newGroupName}
              setNewGroupName={setNewGroupName}
              newGroupIcon={newGroupIcon}
              setNewGroupIcon={setNewGroupIcon}
              newGroupColor={newGroupColor}
              setNewGroupColor={setNewGroupColor}
              isCreating={isCreating}
              onInlineCreate={handleInlineCreate}
              onInlineCreateCancel={() => {
                setIsInlineCreating(false)
                setNewGroupName("")
                setNewGroupIcon("folder")
                setNewGroupColor("#6366f1")
              }}
              setEditingGroupId={setEditingGroupId}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2" data-onboarding="view-mode-controls">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg transition-transform duration-150 hover:bg-muted/50 active:scale-[0.97] motion-reduce:transition-none cursor-pointer min-[1200px]:hidden"
                onClick={() => setNotesTodosSheetOpen(true)}
                aria-label="Open notes and todos"
              >
                <HugeiconsIcon icon={Note01Icon} size={16} strokeWidth={2} />
              </Button>
              <ViewModeControls viewMode={viewMode} setViewMode={setViewMode} />
              <div className="hidden md:flex">
                <LayoutControls layoutDensity={layoutDensity} setLayoutDensity={setLayoutDensity} />
              </div>
              <ThemeControls paletteTheme={paletteTheme} setPaletteTheme={setPaletteTheme} />
            </div>
            <UserMenu
              user={user}
              initials={initials}
              rowContent={rowContent}
              onRowContentChange={setRowContent}
              showNotesTodos={showNotesTodos}
              onShowNotesTodosChange={setShowNotesTodos}
              paletteTheme={paletteTheme}
              onPaletteThemeChange={setPaletteTheme}
              folderHeaderTint={folderHeaderTint}
              onFolderHeaderTintChange={setFolderHeaderTint}
              layoutDensity={layoutDensity}
              onLayoutDensityChange={setLayoutDensity}
              onOpenImportSheet={() => setImportSheetOpen(true)}
              onOpenExportSheet={() => setExportSheetOpen(true)}
              onOpenDuplicatesSheet={() => setDuplicatesSheetOpen(true)}
            />
          </div>
        </div>
      </nav>
    </>
  )
}
