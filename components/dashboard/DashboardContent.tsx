"use client"

import React, { useCallback, useMemo } from "react"
import { toast } from "sonner"
import type { User } from "@/components/dashboard/nav/types"
import { useIsMac } from "@/hooks/useIsMac"
import { BookmarkRow, GroupRow, NoteRow, TodoRow } from "@/lib/supabase/queries"
import { NO_GROUP_ID } from "@/lib/system-groups"
import { type DashboardPaletteTheme } from "@/lib/themes"
import { useBookmarkActions } from "./content/useBookmarkActions"
import { useCommandMode } from "./content/useCommandMode"
import { useDashboardDerived } from "./content/useDashboardDerived"
import { useDashboardPreferences } from "./content/useDashboardPreferences"
import { useDashboardRealtime } from "./content/useDashboardRealtime"
import { useDashboardNavigationControls } from "./content/useDashboardNavigationControls"
import { useDashboardState } from "./content/useDashboardState"
import { useExportHandlers } from "./content/useExportHandlers"
import { useGroupActions } from "./content/useGroupActions"
import { useGroupShortcuts } from "./content/useGroupShortcuts"
import { useImportHandlers } from "./content/useImportHandlers"
import { useNotesTodosActions } from "./content/useNotesTodosActions"
import { useOpenGroup } from "./content/useOpenGroup"
import { useSelectionActions } from "./content/useSelectionActions"
import type {
  DashboardLibraryAdapter,
  DashboardNavigationAdapter,
  DashboardNavigationControlsAdapter,
  DashboardNotesTodosAdapter,
  DashboardSelectionAdapter,
} from "./content/workspace-shell-types"
import { DashboardLayout } from "./DashboardLayout"

interface DashboardContentProps {
  user: User
  initialBookmarks: BookmarkRow[]
  initialGroups: GroupRow[]
  initialNotes: NoteRow[]
  initialTodos: TodoRow[]
  initialViewModeAll?: "list" | "card" | "folders"
  initialViewModeGroups?: "list" | "card" | "folders"
  initialLayoutDensity?: "compact" | "extended"
  initialRowContent?: "date" | "group"
  initialCommandMode?: "add" | "search"
  initialShowNotesTodos?: boolean
  initialPaletteTheme?: DashboardPaletteTheme
  initialFolderHeaderTint?: "off" | "low" | "medium" | "high"
}

import {
  addBookmark,
  checkDuplicateBookmarks,
  deleteBookmark as deleteAction,
  enrichCreatedBookmark,
  getBookmarkDetails,
  refreshBookmarkMetadata,
  moveBookmarksToGroup,
  restoreBookmark as restoreAction,
  updateBookmark as updateBookmarkAction,
  updateBookmarkRank,
} from "@/app/dashboard/actions/bookmarks"
import {
  createGroup,
  deleteGroup as deleteGroupAction,
  restoreGroup as restoreGroupAction,
  updateGroupRank,
  updateGroup as updateGroupAction,
} from "@/app/dashboard/actions/groups"
import { getRankForMovedItem } from "@/lib/ranking"

export function DashboardContent({
  user,
  initialBookmarks,
  initialGroups,
  initialNotes,
  initialTodos,
  initialViewModeAll = "folders",
  initialViewModeGroups = "card",
  initialLayoutDensity = "compact",
  initialRowContent = "date",
  initialCommandMode = "add",
  initialShowNotesTodos = true,
  initialPaletteTheme = "default",
  initialFolderHeaderTint = "off",
}: DashboardContentProps) {
  const dashboard = useDashboardState({
    initialBookmarks,
    initialGroups,
    initialNotes,
    initialTodos,
    initialViewModeAll,
    initialViewModeGroups,
    initialLayoutDensity,
    initialRowContent,
    initialCommandMode,
    initialShowNotesTodos,
    initialPaletteTheme,
    initialFolderHeaderTint,
  })

  const handleOptimisticRemoveBookmarks = useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return
      const idSet = new Set(ids)
      dashboard.setBookmarks((prev) => prev.filter((b) => !idSet.has(b.id)))
    },
    [dashboard.setBookmarks],
  )

  const isMac = useIsMac()

  useDashboardPreferences({
    viewModeAll: dashboard.viewModeAll,
    viewModeGroups: dashboard.viewModeGroups,
    rowContent: dashboard.rowContent,
    showNotesTodos: dashboard.showNotesTodos,
    layoutDensity: dashboard.layoutDensity,
    commandMode: dashboard.commandMode,
    paletteTheme: dashboard.paletteTheme,
    folderHeaderTint: dashboard.folderHeaderTint,
  })

  useDashboardRealtime({
    userId: user.id,
    sortBookmarks: dashboard.sortBookmarks,
    sortGroups: dashboard.sortGroups,
    setBookmarks: dashboard.setBookmarks,
    setGroups: dashboard.setGroups,
  })

  const {
    addOptimisticBookmark,
    applyEnrichment,
    replaceBookmarkId,
    handleRefreshBookmark,
    handleRefreshBookmarks,
    handleLoadBookmarkDetails,
    handleFolderReorder,
    handleDeleteBookmark,
    handleReorder,
    handleEditBookmark,
  } = useBookmarkActions({
    activeGroupId: dashboard.activeGroupId,
    bookmarks: dashboard.bookmarks,
    initialBookmarks,
    setBookmarks: dashboard.setBookmarks,
    sortBookmarks: dashboard.sortBookmarks,
    updateBookmarkRank,
    deleteBookmark: deleteAction,
    restoreBookmark: restoreAction,
    updateBookmark: updateBookmarkAction,
    getBookmarkDetails,
    refreshBookmarkMetadata,
    lastDeletedRef: dashboard.lastDeletedRef,
  })

  const { filteredBookmarks, groupCounts, exportGroupOptions } = useDashboardDerived({
    bookmarks: dashboard.bookmarks,
    groups: dashboard.groups,
    activeGroupId: dashboard.activeGroupId,
    deferredSearchQuery: dashboard.deferredSearchQuery,
  })
  const isFilteredSearch = dashboard.deferredSearchQuery.trim().length > 0

  useGroupShortcuts({
    groups: dashboard.groups,
    setActiveGroupId: dashboard.setActiveGroupId,
  })

  const {
    groupControls,
  } = useGroupActions({
    userId: user.id,
    activeGroupId: dashboard.activeGroupId,
    groups: dashboard.groups,
    bookmarks: dashboard.bookmarks,
    setGroups: dashboard.setGroups,
    setBookmarks: dashboard.setBookmarks,
    sortBookmarks: dashboard.sortBookmarks,
    sortGroups: dashboard.sortGroups,
    setActiveGroupId: dashboard.setActiveGroupId,
    lastDeletedGroupRef: dashboard.lastDeletedGroupRef,
    lastDeletedGroupBookmarksRef: dashboard.lastDeletedGroupBookmarksRef,
    createGroup,
    updateGroup: updateGroupAction,
    deleteGroup: deleteGroupAction,
    restoreGroup: restoreGroupAction,
    restoreBookmark: restoreAction,
    initialGroups,
  })

  const handleGroupsReorder = useCallback(
    async (newOrder: GroupRow[], movedGroupId: string) => {
      const reorderableOrder = newOrder.filter((g) => g.id !== NO_GROUP_ID)
      const prev = dashboard.groups
      const nextRank = getRankForMovedItem(reorderableOrder, movedGroupId)
      dashboard.setGroups(
        reorderableOrder.map((group) =>
          group.id === movedGroupId ? { ...group, rank: nextRank } : group,
        ),
      )

      try {
        await updateGroupRank({ id: movedGroupId, rank: nextRank })
      } catch (error) {
        console.error("Reorder groups failed:", error)
        toast.error("Failed to reorder groups")
        dashboard.setGroups(prev)
      }
    },
    [dashboard.groups, dashboard.setGroups],
  )

  const {
    importPreview,
    importProgress,
    importResult,
    handleImportFileSelected,
    handleConfirmImport,
    handleClearImport,
    handleUpdateImportAction,
  } = useImportHandlers({
    bookmarks: dashboard.bookmarks,
    groups: dashboard.groups,
    userId: user.id,
    normalizeGroupName: dashboard.normalizeGroupName,
    isValidImportUrl: dashboard.isValidImportUrl,
    sortBookmarks: dashboard.sortBookmarks,
    sortGroups: dashboard.sortGroups,
    addBookmark,
    createGroup,
    enrichCreatedBookmark,
    checkDuplicateBookmarks,
    setBookmarks: dashboard.setBookmarks,
    setGroups: dashboard.setGroups,
  })

  const { exportProgress, handleExportBookmarks, resetExportProgress } = useExportHandlers({
    bookmarks: dashboard.bookmarks,
    groups: dashboard.groups,
  })

  const navigationControlsAdapter: DashboardNavigationControlsAdapter =
    useDashboardNavigationControls({
      importProgressStatus: importProgress.status,
      handleClearImport,
      resetExportProgress,
    })

  const handleResolveConflicts = useCallback(
    async (action: "skip" | "override") => {
      void action
      if (importPreview) {
        handleUpdateImportAction(action)
      }
    },
    [importPreview, handleUpdateImportAction],
  )

  const {
    handleToggleSelection,
    handleSelectBookmarks,
    handleOpenSelected,
    handleRefreshSelected,
    handleBulkDelete,
    handleMoveSelectedToGroup,
    handleCancelSelection,
  } = useSelectionActions({
    bookmarks: dashboard.bookmarks,
    selectedIds: dashboard.selectedIds,
    setSelectedIds: dashboard.setSelectedIds,
    setSelectionMode: dashboard.setSelectionMode,
    setBookmarks: dashboard.setBookmarks,
    initialBookmarks,
    deleteBookmark: deleteAction,
    restoreBookmark: restoreAction,
    moveBookmarksToGroup,
    refreshBookmarks: handleRefreshBookmarks,
    lastBulkDeletedRef: dashboard.lastBulkDeletedRef,
  })

  const { handleOpenGroup } = useOpenGroup({
    bookmarks: dashboard.bookmarks,
    deferredSearchQuery: dashboard.deferredSearchQuery,
  })

  const { handleCommandModeChange } = useCommandMode({
    setCommandMode: dashboard.setCommandMode,
  })

  const {
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
    handleDeleteNotes,
    handleCreateTodo,
    handleUpdateTodo,
    handleDeleteTodo,
    handleDeleteTodos,
    handleSetTodoCompleted,
    handleSetTodosCompleted,
  } = useNotesTodosActions({
    userId: user.id,
    initialNotes,
    initialTodos,
    notes: dashboard.notes,
    setNotes: dashboard.setNotes,
    todos: dashboard.todos,
    setTodos: dashboard.setTodos,
    lastDeletedNoteRef: dashboard.lastDeletedNoteRef,
    lastBulkDeletedNotesRef: dashboard.lastBulkDeletedNotesRef,
    lastDeletedTodoRef: dashboard.lastDeletedTodoRef,
    lastBulkDeletedTodosRef: dashboard.lastBulkDeletedTodosRef,
  })

  const navigationAdapter: DashboardNavigationAdapter = useMemo(
    () => ({
      user,
      bookmarks: dashboard.bookmarks,
      groups: dashboard.groups,
      activeGroupId: dashboard.activeGroupId,
      groupCounts,
      selectGroup: dashboard.setActiveGroupId,
      openGroup: handleOpenGroup,
      reorderGroups: handleGroupsReorder,
      groupControls,
      preferences: {
        rowContent: dashboard.rowContent,
        setRowContent: dashboard.setRowContent,
        paletteTheme: dashboard.paletteTheme,
        setPaletteTheme: dashboard.setPaletteTheme,
        folderHeaderTint: dashboard.folderHeaderTint,
        setFolderHeaderTint: dashboard.setFolderHeaderTint,
        layoutDensity: dashboard.layoutDensity,
        setLayoutDensity: dashboard.setLayoutDensity,
        viewMode: dashboard.viewMode,
        setViewMode: dashboard.setViewMode,
      },
      importExport: {
        exportGroupOptions,
        importPreview,
        importProgress,
        importResult,
        exportProgress,
        handleImportFileSelected,
        handleResolveConflicts,
        handleConfirmImport,
        handleClearImport,
        handleExportBookmarks,
        resetExportProgress,
        handleOptimisticRemoveBookmarks,
      },
      commandBar: {
        mode: dashboard.commandMode,
        searchQuery: dashboard.searchQuery,
        handleModeChange: handleCommandModeChange,
        setSearchQuery: dashboard.setSearchQuery,
        addOptimisticBookmark,
        applyEnrichment,
        replaceBookmarkId,
      },
    }),
    [
      addOptimisticBookmark,
      applyEnrichment,
      dashboard.activeGroupId,
      dashboard.bookmarks,
      dashboard.commandMode,
      dashboard.folderHeaderTint,
      dashboard.groups,
      dashboard.layoutDensity,
      dashboard.paletteTheme,
      dashboard.rowContent,
      dashboard.searchQuery,
      dashboard.setActiveGroupId,
      dashboard.setFolderHeaderTint,
      dashboard.setLayoutDensity,
      dashboard.setPaletteTheme,
      dashboard.setRowContent,
      dashboard.setSearchQuery,
      dashboard.setViewMode,
      dashboard.viewMode,
      exportGroupOptions,
      exportProgress,
      groupControls,
      groupCounts,
      handleClearImport,
      handleCommandModeChange,
      handleConfirmImport,
      handleExportBookmarks,
      handleGroupsReorder,
      handleImportFileSelected,
      handleOptimisticRemoveBookmarks,
      handleOpenGroup,
      handleResolveConflicts,
      importPreview,
      importProgress,
      importResult,
      replaceBookmarkId,
      resetExportProgress,
      user,
    ],
  )

  const libraryAdapter: DashboardLibraryAdapter = useMemo(
    () => ({
      bookmarks: dashboard.bookmarks,
      groups: dashboard.groups,
      filteredBookmarks,
      activeGroupId: dashboard.activeGroupId,
      setActiveGroupId: dashboard.setActiveGroupId,
      viewMode: dashboard.viewMode,
      nonFolderViewMode: dashboard.nonFolderViewMode,
      rowContent: dashboard.rowContent,
      keyboardContext: dashboard.keyboardContext,
      setKeyboardContext: dashboard.setKeyboardContext,
      layoutDensity: dashboard.layoutDensity,
      folderHeaderTint: dashboard.folderHeaderTint,
      isFilteredSearch,
      handleDeleteBookmark,
      handleRefreshBookmark,
      handleLoadBookmarkDetails,
      handleEditBookmark,
      handleFolderReorder,
      handleReorder,
    }),
    [
      dashboard.activeGroupId,
      dashboard.bookmarks,
      dashboard.folderHeaderTint,
      dashboard.groups,
      dashboard.keyboardContext,
      dashboard.layoutDensity,
      dashboard.nonFolderViewMode,
      dashboard.rowContent,
      dashboard.setActiveGroupId,
      dashboard.setKeyboardContext,
      dashboard.viewMode,
      filteredBookmarks,
      handleDeleteBookmark,
      handleEditBookmark,
      handleFolderReorder,
      handleLoadBookmarkDetails,
      handleRefreshBookmark,
      handleReorder,
      isFilteredSearch,
    ],
  )

  const selectionAdapter: DashboardSelectionAdapter = useMemo(
    () => ({
      selectionMode: dashboard.selectionMode,
      selectedIds: dashboard.selectedIds,
      setSelectionMode: dashboard.setSelectionMode,
      handleToggleSelection,
      handleSelectBookmarks,
      handleOpenSelected,
      handleRefreshSelected,
      handleBulkDelete,
      handleMoveSelectedToGroup,
      handleCancelSelection,
    }),
    [
      dashboard.selectedIds,
      dashboard.selectionMode,
      dashboard.setSelectionMode,
      handleBulkDelete,
      handleCancelSelection,
      handleMoveSelectedToGroup,
      handleOpenSelected,
      handleRefreshSelected,
      handleSelectBookmarks,
      handleToggleSelection,
    ],
  )

  const notesTodosAdapter: DashboardNotesTodosAdapter = useMemo(
    () => ({
      notes: dashboard.notes,
      todos: dashboard.todos,
      showNotesTodos: dashboard.showNotesTodos,
      setShowNotesTodos: dashboard.setShowNotesTodos,
      handleCreateNote,
      handleUpdateNote,
      handleDeleteNote,
      handleDeleteNotes,
      handleCreateTodo,
      handleUpdateTodo,
      handleDeleteTodo,
      handleDeleteTodos,
      handleSetTodoCompleted,
      handleSetTodosCompleted,
    }),
    [
      dashboard.notes,
      dashboard.setShowNotesTodos,
      dashboard.showNotesTodos,
      dashboard.todos,
      handleCreateNote,
      handleCreateTodo,
      handleDeleteNote,
      handleDeleteNotes,
      handleDeleteTodo,
      handleDeleteTodos,
      handleSetTodoCompleted,
      handleSetTodosCompleted,
      handleUpdateNote,
      handleUpdateTodo,
    ],
  )

  return (
    <DashboardLayout
      navigation={navigationAdapter}
      navigationControls={navigationControlsAdapter}
      library={libraryAdapter}
      selection={selectionAdapter}
      notesTodos={notesTodosAdapter}
      isMac={isMac}
    />
  )
}
