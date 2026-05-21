"use client"

import React, { useCallback, useEffect, useRef } from "react"
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
import { useDashboardState } from "./content/useDashboardState"
import { useExportHandlers } from "./content/useExportHandlers"
import { useGroupActions } from "./content/useGroupActions"
import { useGroupShortcuts } from "./content/useGroupShortcuts"
import { useImportHandlers } from "./content/useImportHandlers"
import { useNotesTodosActions } from "./content/useNotesTodosActions"
import { useOpenGroup } from "./content/useOpenGroup"
import { useSelectionActions } from "./content/useSelectionActions"
import { DashboardLayout } from "./DashboardLayout"

let resumePendingEnrichmentTask: Promise<void> | null = null

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
  moveBookmarksToGroup,
  restoreBookmark as restoreAction,
  updateBookmark as updateBookmarkAction,
  updateBookmarksOrder,
} from "@/app/dashboard/actions/bookmarks"
import {
  createGroup,
  deleteGroup as deleteGroupAction,
  restoreGroup as restoreGroupAction,
  updateGroupsOrder,
  updateGroup as updateGroupAction,
} from "@/app/dashboard/actions/groups"

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
    [dashboard],
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
    handleFolderReorder,
    handleDeleteBookmark,
    handleReorder,
    handleEditBookmark,
  } = useBookmarkActions({
    activeGroupId: dashboard.activeGroupId,
    initialBookmarks,
    setBookmarks: dashboard.setBookmarks,
    sortBookmarks: dashboard.sortBookmarks,
    updateBookmarksOrder,
    deleteBookmark: deleteAction,
    restoreBookmark: restoreAction,
    updateBookmark: updateBookmarkAction,
    lastDeletedRef: dashboard.lastDeletedRef,
  })

  const inflightEnrichmentRef = useRef<Set<string>>(new Set())
  const { bookmarks, setBookmarks } = dashboard

  const bookmarksRef = useRef(bookmarks)
  useEffect(() => {
    bookmarksRef.current = bookmarks
  }, [bookmarks])

  useEffect(() => {
    const hasPending = bookmarks.some(
      (b) => b?.id && b?.url && b.status === "pending" && !b.last_fetched_at,
    )
    if (!hasPending) return

    if (resumePendingEnrichmentTask) return

    let cancelled = false

    const CONCURRENCY = 2

    resumePendingEnrichmentTask = (async () => {
      try {
        while (true) {
          if (cancelled) return
          const pendingNow = bookmarksRef.current.filter(
            (b) =>
              b?.id &&
              b?.url &&
              b.status === "pending" &&
              !b.last_fetched_at &&
              !inflightEnrichmentRef.current.has(b.id),
          )
          if (pendingNow.length === 0) return

          let index = 0
          const worker = async () => {
            while (true) {
              if (cancelled) return
              const current = pendingNow[index]
              index += 1
              if (!current) return

              if (!current.id || !current.url) continue
              if (inflightEnrichmentRef.current.has(current.id)) continue
              inflightEnrichmentRef.current.add(current.id)

              if (!cancelled) {
                setBookmarks((prev) =>
                  prev.map((item) =>
                    item.id === current.id ? { ...item, is_enriching: true } : item,
                  ),
                )
              }

              try {
                const timeoutPromise = new Promise<never>((_, reject) => {
                  setTimeout(() => reject(new Error("Enrichment timeout")), 45000)
                })
                const enrichmentPromise = enrichCreatedBookmark(current.id, current.url)
                const enrichment = (await Promise.race([
                  enrichmentPromise,
                  timeoutPromise,
                ])) as Awaited<ReturnType<typeof enrichCreatedBookmark>>

                if (cancelled) return
                applyEnrichment(current.id, enrichment)
              } catch (error) {
                console.error("Resume enrichment failed:", error)
                const attemptedAt = new Date().toISOString()
                if (!cancelled) {
                  setBookmarks((prev) =>
                    prev.map((item) =>
                      item.id === current.id
                        ? {
                            ...item,
                            status: "failed",
                            is_enriching: false,
                            error_reason:
                              error instanceof Error ? error.message : "Enrichment failed",
                            last_fetched_at: attemptedAt,
                          }
                        : item,
                    ),
                  )
                }
              } finally {
                inflightEnrichmentRef.current.delete(current.id)
              }
            }
          }

          await Promise.all(
            Array.from({ length: Math.min(CONCURRENCY, pendingNow.length) }, () => worker()),
          )
        }
      } finally {
        resumePendingEnrichmentTask = null
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applyEnrichment, bookmarks, setBookmarks])

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
    handleGroupCreated,
    handleUpdateGroup,
    handleSidebarGroupUpdate,
    handleDeleteGroup,
    handleInlineCreateGroup,
    handleToggleHideFromAllBookmarks,
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
    editGroupName: dashboard.editGroupName,
    editGroupIcon: dashboard.editGroupIcon,
    editGroupColor: dashboard.editGroupColor,
    setEditingGroupId: dashboard.setEditingGroupId,
    isUpdatingGroup: dashboard.isUpdatingGroup,
    setIsUpdatingGroup: dashboard.setIsUpdatingGroup,
    lastDeletedGroupRef: dashboard.lastDeletedGroupRef,
    lastDeletedGroupBookmarksRef: dashboard.lastDeletedGroupBookmarksRef,
    createGroup,
    updateGroup: updateGroupAction,
    deleteGroup: deleteGroupAction,
    restoreGroup: restoreGroupAction,
    restoreBookmark: restoreAction,
    initialGroups,
    newGroupName: dashboard.newGroupName,
    newGroupIcon: dashboard.newGroupIcon,
    newGroupColor: dashboard.newGroupColor,
    setIsInlineCreating: dashboard.setIsInlineCreating,
    setNewGroupName: dashboard.setNewGroupName,
    setNewGroupIcon: dashboard.setNewGroupIcon,
    setNewGroupColor: dashboard.setNewGroupColor,
    isCreatingGroup: dashboard.isCreatingGroup,
    setIsCreatingGroup: dashboard.setIsCreatingGroup,
  })

  const handleGroupsReorder = useCallback(
    async (newOrder: GroupRow[]) => {
      const reorderableOrder = newOrder.filter((g) => g.id !== NO_GROUP_ID)
      const prev = dashboard.groups
      dashboard.setGroups(
        reorderableOrder.map((group, index) => ({
          ...group,
          order_index: index,
        })),
      )

      const updates = reorderableOrder.map((group, index) => ({
        id: group.id,
        order_index: index,
      }))

      try {
        await updateGroupsOrder(updates)
      } catch (error) {
        console.error("Reorder groups failed:", error)
        toast.error("Failed to reorder groups")
        dashboard.setGroups(prev)
      }
    },
    [dashboard],
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
    handleOpenSelected,
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

  return (
    <DashboardLayout
      {...dashboard}
      user={user}
      groupCounts={groupCounts}
      handleGroupsReorder={handleGroupsReorder}
      handleOpenGroup={handleOpenGroup}
      handleSidebarGroupUpdate={handleSidebarGroupUpdate}
      handleDeleteGroup={handleDeleteGroup}
      handleInlineCreateGroup={handleInlineCreateGroup}
      handleToggleHideFromAllBookmarks={handleToggleHideFromAllBookmarks}
      exportGroupOptions={exportGroupOptions}
      handleGroupCreated={handleGroupCreated}
      handleUpdateGroup={handleUpdateGroup}
      importPreview={importPreview}
      importProgress={importProgress}
      importResult={importResult}
      exportProgress={exportProgress}
      handleImportFileSelected={handleImportFileSelected}
      handleResolveConflicts={handleResolveConflicts}
      handleConfirmImport={handleConfirmImport}
      handleClearImport={handleClearImport}
      handleExportBookmarks={handleExportBookmarks}
      resetExportProgress={resetExportProgress}
      handleOptimisticRemoveBookmarks={handleOptimisticRemoveBookmarks}
      addOptimisticBookmark={addOptimisticBookmark}
      applyEnrichment={applyEnrichment}
      replaceBookmarkId={replaceBookmarkId}
      handleCommandModeChange={handleCommandModeChange}
      isMac={isMac}
      filteredBookmarks={filteredBookmarks}
      handleToggleSelection={handleToggleSelection}
      setSelectionMode={dashboard.setSelectionMode}
      setKeyboardContext={dashboard.setKeyboardContext}
      handleFolderReorder={handleFolderReorder}
      handleReorder={handleReorder}
      handleDeleteBookmark={handleDeleteBookmark}
      handleEditBookmark={handleEditBookmark}
      handleCreateNote={handleCreateNote}
      handleUpdateNote={handleUpdateNote}
      handleDeleteNote={handleDeleteNote}
      handleDeleteNotes={handleDeleteNotes}
      handleCreateTodo={handleCreateTodo}
      handleUpdateTodo={handleUpdateTodo}
      handleDeleteTodo={handleDeleteTodo}
      handleDeleteTodos={handleDeleteTodos}
      handleSetTodoCompleted={handleSetTodoCompleted}
      handleSetTodosCompleted={handleSetTodosCompleted}
      handleOpenSelected={handleOpenSelected}
      handleBulkDelete={handleBulkDelete}
      handleMoveSelectedToGroup={handleMoveSelectedToGroup}
      handleCancelSelection={handleCancelSelection}
      isFilteredSearch={isFilteredSearch}
    />
  )
}
