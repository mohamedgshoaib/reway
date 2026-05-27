"use client"

import type { Dispatch, SetStateAction } from "react"
import type { User } from "@/components/dashboard/nav/types"
import type { BookmarkRow, GroupRow, NoteRow, TodoRow } from "@/lib/supabase/queries"
import type { DashboardPaletteTheme } from "@/lib/themes"
import type { EnrichmentResult, ImportEntry, ImportGroupSummary } from "./dashboard-types"
import type { TodoPriority } from "./notes-todos/types"

export interface DashboardGroupControlsAdapter {
  editingGroupId: string | null
  editGroupName: string
  setEditGroupName: Dispatch<SetStateAction<string>>
  editGroupIcon: string
  setEditGroupIcon: Dispatch<SetStateAction<string>>
  editGroupColor: string | null
  setEditGroupColor: Dispatch<SetStateAction<string | null>>
  isUpdatingGroup: boolean
  isInlineCreating: boolean
  setIsInlineCreating: Dispatch<SetStateAction<boolean>>
  newGroupName: string
  setNewGroupName: Dispatch<SetStateAction<string>>
  newGroupIcon: string
  setNewGroupIcon: Dispatch<SetStateAction<string>>
  newGroupColor: string | null
  setNewGroupColor: Dispatch<SetStateAction<string | null>>
  isCreatingGroup: boolean
  handleSidebarGroupUpdate: (groupId: string, onError?: () => void) => Promise<void>
  handleInlineCreateGroup: (onError?: () => void) => Promise<void>
  handleDeleteGroup: (groupId: string) => Promise<void>
  handleToggleHideFromAllBookmarks: (id: string, hide: boolean) => Promise<void>
  startEditingGroup: (group: GroupRow) => void
  cancelEditingGroup: () => void
  cancelInlineCreateGroup: () => void
}

export interface DashboardNavigationAdapter {
  user: User
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  activeGroupId: string
  groupCounts: Record<string, number>
  selectGroup: (id: string) => void
  openGroup: (groupId: string) => void
  reorderGroups: (newOrder: GroupRow[]) => Promise<void>
  groupControls: DashboardGroupControlsAdapter
  preferences: {
    rowContent: "date" | "group"
    setRowContent: Dispatch<SetStateAction<"date" | "group">>
    paletteTheme: DashboardPaletteTheme
    setPaletteTheme: Dispatch<SetStateAction<DashboardPaletteTheme>>
    folderHeaderTint: "off" | "low" | "medium" | "high"
    setFolderHeaderTint: Dispatch<SetStateAction<"off" | "low" | "medium" | "high">>
    layoutDensity: "compact" | "extended"
    setLayoutDensity: Dispatch<SetStateAction<"compact" | "extended">>
    viewMode: "list" | "card" | "folders"
    setViewMode: (value: "list" | "card" | "folders") => void
  }
  importExport: {
    exportGroupOptions: string[]
    importPreview: {
      groups: ImportGroupSummary[]
      entries: ImportEntry[]
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
      status: "done" | "error" | "stopped"
    } | null
    exportProgress: {
      processed: number
      total: number
      status: "idle" | "exporting" | "done" | "error"
    }
    handleImportFileSelected: (file: File) => void
    handleResolveConflicts: (action: "skip" | "override") => Promise<void>
    handleConfirmImport: (selectedGroups: string[]) => Promise<void>
    handleClearImport: () => void
    handleExportBookmarks: (selectedGroups: string[]) => void
    resetExportProgress: () => void
    handleOptimisticRemoveBookmarks: (ids: string[]) => void
  }
  commandBar: {
    mode: "add" | "search"
    searchQuery: string
    handleModeChange: (mode: "add" | "search") => void
    setSearchQuery: Dispatch<SetStateAction<string>>
    addOptimisticBookmark: (bookmark: BookmarkRow) => void
    applyEnrichment: (id: string, enrichment?: EnrichmentResult) => void
    replaceBookmarkId: (tempId: string, realId: string) => void
  }
}

export interface DashboardNavigationControlsAdapter {
  importSheetOpen: boolean
  exportSheetOpen: boolean
  duplicatesSheetOpen: boolean
  notesTodosSheetOpen: boolean
  selectedImportGroups: string[]
  selectedExportGroups: string[]
  setNotesTodosSheetOpen: Dispatch<SetStateAction<boolean>>
  setDuplicatesSheetOpen: Dispatch<SetStateAction<boolean>>
  handleImportOpenChange: (open: boolean) => void
  handleExportOpenChange: (open: boolean) => void
  handleToggleImportGroup: (name: string) => void
  handleToggleExportGroup: (name: string) => void
  openImportSheet: () => void
  openExportSheet: () => void
  openDuplicatesSheet: () => void
}

export interface DashboardLibraryAdapter {
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  filteredBookmarks: BookmarkRow[]
  activeGroupId: string
  setActiveGroupId: Dispatch<SetStateAction<string>>
  viewMode: "list" | "card" | "folders"
  nonFolderViewMode: "list" | "card"
  rowContent: "date" | "group"
  keyboardContext: "folder" | "bookmark"
  setKeyboardContext: Dispatch<SetStateAction<"folder" | "bookmark">>
  layoutDensity: "compact" | "extended"
  folderHeaderTint: "off" | "low" | "medium" | "high"
  isFilteredSearch: boolean
  handleDeleteBookmark: (id: string) => void
  handleRefreshBookmark: (id: string) => Promise<void>
  handleEditBookmark: (
    id: string,
    data: {
      title: string
      url: string
      description?: string
      favicon_url?: string
      group_id?: string
      applyFaviconToDomain?: boolean
    },
  ) => Promise<void>
  handleFolderReorder: (groupId: string, newOrder: BookmarkRow[]) => void
  handleReorder: (groupId: string, newOrder: BookmarkRow[]) => void
}

export interface DashboardSelectionAdapter {
  selectionMode: boolean
  selectedIds: Set<string>
  setSelectionMode: Dispatch<SetStateAction<boolean>>
  handleToggleSelection: (id: string) => void
  handleOpenSelected: () => void
  handleRefreshSelected: () => Promise<void>
  handleBulkDelete: () => Promise<void>
  handleMoveSelectedToGroup: (groupId: string | null) => Promise<void>
  handleCancelSelection: () => void
}

export interface DashboardNotesTodosAdapter {
  notes: NoteRow[]
  todos: TodoRow[]
  showNotesTodos: boolean
  setShowNotesTodos: Dispatch<SetStateAction<boolean>>
  handleCreateNote: (formData: { text: string; color?: string | null }) => Promise<string>
  handleUpdateNote: (id: string, formData: { text: string; color?: string | null }) => Promise<void>
  handleDeleteNote: (id: string) => Promise<void>
  handleDeleteNotes: (ids: string[]) => Promise<void>
  handleCreateTodo: (formData: { text: string; priority: TodoPriority }) => Promise<string>
  handleUpdateTodo: (
    id: string,
    formData: { text: string; priority: TodoPriority },
  ) => Promise<void>
  handleDeleteTodo: (id: string) => Promise<void>
  handleDeleteTodos: (ids: string[]) => Promise<void>
  handleSetTodoCompleted: (id: string, completed: boolean) => Promise<void>
  handleSetTodosCompleted: (ids: string[], completed: boolean) => Promise<void>
}
