"use client"

import { useMemo } from "react"
import { createNoGroupRow, NO_GROUP_ID } from "@/lib/system-groups"
import { BookmarkBoard } from "./BookmarkBoard"
import { CommandBar } from "./CommandBar"
import { DashboardNotesTodosSidebar } from "./content/DashboardNotesTodosSidebar"
import { DashboardSidebar } from "./content/DashboardSidebar"
import {
  type DashboardLibraryAdapter,
  type DashboardNavigationAdapter,
  type DashboardNavigationControlsAdapter,
  type DashboardNotesTodosAdapter,
  type DashboardSelectionAdapter,
} from "./content/workspace-shell-types"
import { FloatingActionBar } from "./content/FloatingActionBar"
import { TableHeader } from "./content/TableHeader"
import { DashboardNav } from "./DashboardNav"
import { DashboardOnboarding } from "./DashboardOnboarding"
import { FolderBoard } from "./FolderBoard"

interface DashboardLayoutProps {
  navigation: DashboardNavigationAdapter
  navigationControls: DashboardNavigationControlsAdapter
  library: DashboardLibraryAdapter
  selection: DashboardSelectionAdapter
  notesTodos: DashboardNotesTodosAdapter
  isMac: boolean
}

export function DashboardLayout({
  navigation,
  navigationControls,
  library,
  selection,
  notesTodos,
  isMac,
}: DashboardLayoutProps) {
  const groupsWithNoGroup = useMemo(() => {
    const hasUngrouped = library.bookmarks.some((bookmark) => !bookmark.group_id)
    if (!hasUngrouped) return navigation.groups
    if (navigation.groups.some((group) => group.id === NO_GROUP_ID)) return navigation.groups
    return [...navigation.groups, createNoGroupRow()]
  }, [library.bookmarks, navigation.groups])

  return (
    <>
      <DashboardOnboarding />
      <div
        className={`mx-auto w-full ${
          navigation.preferences.layoutDensity === "extended" ? "max-w-[1600px]" : "max-w-3xl"
        }`}
      >
        <div className="relative flex h-[calc(100dvh-3rem)] flex-col overflow-hidden">
          <DashboardSidebar
            library={{
              groups: groupsWithNoGroup,
              bookmarks: library.bookmarks,
              activeGroupId: library.activeGroupId,
              setActiveGroupId: library.setActiveGroupId,
              layoutDensity: library.layoutDensity,
              handleOpenGroup: navigation.openGroup,
              reorderGroups: navigation.reorderGroups,
            }}
            groupControls={navigation.groupControls}
          />

          {notesTodos.showNotesTodos && (
            <DashboardNotesTodosSidebar
              notes={notesTodos.notes}
              todos={notesTodos.todos}
              onCreateNote={notesTodos.handleCreateNote}
              onUpdateNote={notesTodos.handleUpdateNote}
              onDeleteNote={notesTodos.handleDeleteNote}
              onDeleteNotes={notesTodos.handleDeleteNotes}
              onCreateTodo={notesTodos.handleCreateTodo}
              onUpdateTodo={notesTodos.handleUpdateTodo}
              onDeleteTodo={notesTodos.handleDeleteTodo}
              onDeleteTodos={notesTodos.handleDeleteTodos}
              onSetTodoCompleted={notesTodos.handleSetTodoCompleted}
              onSetTodosCompleted={notesTodos.handleSetTodosCompleted}
              layoutDensity={navigation.preferences.layoutDensity}
            />
          )}

          <div className="z-40 flex-none bg-background px-1">
            <DashboardNav
              navigation={navigation}
              navigationControls={navigationControls}
              notesTodos={notesTodos}
              enrichmentHealth={{
                bookmarks: library.bookmarks,
                onRefreshBookmark: library.handleRefreshBookmark,
                onLoadBookmarkDetails: library.handleLoadBookmarkDetails,
                onSelectBookmarks: selection.handleSelectBookmarks,
              }}
            />
            <div className="pt-4 md:pt-6">
              <CommandBar
                onAddBookmark={navigation.commandBar.addOptimisticBookmark}
                onApplyEnrichment={navigation.commandBar.applyEnrichment}
                onReplaceBookmarkId={navigation.commandBar.replaceBookmarkId}
                activeGroupId={library.activeGroupId}
                mode={navigation.commandBar.mode}
                searchQuery={navigation.commandBar.searchQuery}
                onModeChange={navigation.commandBar.handleModeChange}
                onSearchChange={navigation.commandBar.setSearchQuery}
              />
            </div>

            <TableHeader
              viewMode={navigation.preferences.viewMode}
              keyboardContext={library.keyboardContext}
              isMac={isMac}
            />
          </div>

          <div className="min-h-0 flex-1">
            <div className="scrollbar-hover-only h-full min-h-0 overflow-y-auto overscroll-contain px-1 pb-6 pt-3 md:pt-2">
              <div data-onboarding="drag-sort">
                {navigation.preferences.viewMode === "folders" ? (
                  <FolderBoard
                    bookmarks={library.filteredBookmarks}
                    groups={navigation.groups}
                    activeGroupId={library.activeGroupId}
                    onReorder={library.handleFolderReorder}
                    onDeleteBookmark={library.handleDeleteBookmark}
                    onRefreshBookmark={library.handleRefreshBookmark}
                    onLoadBookmarkDetails={library.handleLoadBookmarkDetails}
                    onEditBookmark={library.handleEditBookmark}
                    isFiltered={library.isFilteredSearch}
                    selectionMode={selection.selectionMode}
                    selectedIds={selection.selectedIds}
                    onToggleSelection={selection.handleToggleSelection}
                    onEnterSelectionMode={() => selection.setSelectionMode(true)}
                    onKeyboardContextChange={library.setKeyboardContext}
                    layoutDensity={library.layoutDensity}
                    folderHeaderTint={library.folderHeaderTint}
                  />
                ) : (
                  <BookmarkBoard
                    bookmarks={library.filteredBookmarks}
                    initialGroups={navigation.groups}
                    activeGroupId={library.activeGroupId}
                    onReorder={library.handleReorder}
                    onDeleteBookmark={library.handleDeleteBookmark}
                    onRefreshBookmark={library.handleRefreshBookmark}
                    onLoadBookmarkDetails={library.handleLoadBookmarkDetails}
                    onEditBookmark={library.handleEditBookmark}
                    rowContent={library.rowContent}
                    viewMode={library.nonFolderViewMode}
                    selectionMode={selection.selectionMode}
                    selectedIds={selection.selectedIds}
                    onToggleSelection={selection.handleToggleSelection}
                    onEnterSelectionMode={() => selection.setSelectionMode(true)}
                    layoutDensity={library.layoutDensity}
                  />
                )}
              </div>
            </div>
          </div>

          {selection.selectionMode && selection.selectedIds.size > 0 && (
            <FloatingActionBar
              selectedCount={selection.selectedIds.size}
              groups={navigation.groups}
              onOpenSelected={selection.handleOpenSelected}
              onRefreshSelected={selection.handleRefreshSelected}
              onBulkDelete={selection.handleBulkDelete}
              onMoveSelectedToGroup={selection.handleMoveSelectedToGroup}
              onCancelSelection={selection.handleCancelSelection}
            />
          )}
        </div>
      </div>
    </>
  )
}
