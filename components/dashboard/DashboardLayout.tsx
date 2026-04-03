"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import type {
  BookmarkRow,
  GroupRow,
  NoteRow,
  TodoRow,
} from "@/lib/supabase/queries";
import type { User } from "@/components/dashboard/nav/types";
import type { DashboardPaletteTheme } from "@/lib/themes";
import type {
  EnrichmentResult,
  ImportEntry,
  ImportGroupSummary,
} from "./content/dashboard-types";
import { DashboardOnboarding } from "./DashboardOnboarding";
import { DashboardSidebar } from "./content/DashboardSidebar";
import { DashboardNotesTodosSidebar } from "./content/DashboardNotesTodosSidebar";
import { DashboardNav } from "./DashboardNav";
import { CommandBar } from "./CommandBar";
import { TableHeader } from "./content/TableHeader";
import { FolderBoard } from "./FolderBoard";
import { BookmarkBoard } from "./BookmarkBoard";
import { FloatingActionBar } from "./content/FloatingActionBar";
import { createNoGroupRow, NO_GROUP_ID } from "@/lib/system-groups";

export function DashboardLayout({
  layoutDensity,
  showNotesTodos,
  groups,
  bookmarks,
  notes,
  todos,
  user,
  folderHeaderTint,
  setFolderHeaderTint,
  activeGroupId,
  setActiveGroupId,
  groupCounts,
  handleGroupsReorder,
  handleOpenGroup,
  editingGroupId,
  setEditingGroupId,
  editGroupName,
  setEditGroupName,
  editGroupIcon,
  setEditGroupIcon,
  editGroupColor,
  setEditGroupColor,
  isUpdatingGroup,
  handleSidebarGroupUpdate,
  handleDeleteGroup,
  isInlineCreating,
  setIsInlineCreating,
  newGroupName,
  setNewGroupName,
  newGroupIcon,
  setNewGroupIcon,
  newGroupColor,
  setNewGroupColor,
  isCreatingGroup,
  handleInlineCreateGroup,
  rowContent,
  setRowContent,
  setShowNotesTodos,
  paletteTheme,
  setPaletteTheme,
  setLayoutDensity,
  viewMode,
  setViewMode,
  exportGroupOptions,
  handleGroupCreated,
  handleUpdateGroup,
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
  addOptimisticBookmark,
  applyEnrichment,
  replaceBookmarkId,
  commandMode,
  searchQuery,
  setSearchQuery,
  handleCommandModeChange,
  keyboardContext,
  isMac,
  filteredBookmarks,
  nonFolderViewMode,
  selectionMode,
  selectedIds,
  handleToggleSelection,
  setSelectionMode,
  setKeyboardContext,
  handleFolderReorder,
  handleReorder,
  handleDeleteBookmark,
  handleEditBookmark,
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
  handleOpenSelected,
  handleBulkDelete,
  handleMoveSelectedToGroup,
  handleCancelSelection,
  isFilteredSearch,
  handleToggleHideFromAllBookmarks,
}: {
  layoutDensity: "compact" | "extended";
  showNotesTodos: boolean;
  groups: GroupRow[];
  bookmarks: BookmarkRow[];
  notes: NoteRow[];
  todos: TodoRow[];
  user: User;
  folderHeaderTint: "off" | "low" | "medium" | "high";
  setFolderHeaderTint: Dispatch<
    SetStateAction<"off" | "low" | "medium" | "high">
  >;
  activeGroupId: string;
  setActiveGroupId: Dispatch<SetStateAction<string>>;
  groupCounts: Record<string, number>;
  handleGroupsReorder: (newOrder: GroupRow[]) => Promise<void>;
  handleOpenGroup: (groupId: string) => void;
  editingGroupId: string | null;
  setEditingGroupId: Dispatch<SetStateAction<string | null>>;
  editGroupName: string;
  setEditGroupName: Dispatch<SetStateAction<string>>;
  editGroupIcon: string;
  setEditGroupIcon: Dispatch<SetStateAction<string>>;
  editGroupColor: string | null;
  setEditGroupColor: Dispatch<SetStateAction<string | null>>;
  isUpdatingGroup: boolean;
  handleSidebarGroupUpdate: (id: string, onError?: () => void) => Promise<void>;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  isInlineCreating: boolean;
  setIsInlineCreating: Dispatch<SetStateAction<boolean>>;
  newGroupName: string;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  newGroupIcon: string;
  setNewGroupIcon: Dispatch<SetStateAction<string>>;
  newGroupColor: string | null;
  setNewGroupColor: Dispatch<SetStateAction<string | null>>;
  isCreatingGroup: boolean;
  handleInlineCreateGroup: () => Promise<void>;
  rowContent: "date" | "group";
  setRowContent: Dispatch<SetStateAction<"date" | "group">>;
  setShowNotesTodos: Dispatch<SetStateAction<boolean>>;
  paletteTheme: DashboardPaletteTheme;
  setPaletteTheme: Dispatch<SetStateAction<DashboardPaletteTheme>>;
  setLayoutDensity: Dispatch<SetStateAction<"compact" | "extended">>;
  viewMode: "list" | "card" | "folders";
  setViewMode: (value: "list" | "card" | "folders") => void;
  exportGroupOptions: string[];
  handleGroupCreated: (
    id: string,
    name: string,
    icon: string,
    color?: string | null,
  ) => void;
  handleUpdateGroup: (
    id: string,
    name: string,
    icon: string,
    color?: string | null,
  ) => Promise<void>;
  importPreview: {
    groups: ImportGroupSummary[];
    entries: ImportEntry[];
  } | null;
  importProgress: {
    processed: number;
    total: number;
    status: "idle" | "importing" | "stopping" | "done" | "error" | "stopped";
  };
  importResult: {
    imported: number;
    cancelled: number;
    total: number;
    status: "done" | "error" | "stopped";
  } | null;
  exportProgress: {
    processed: number;
    total: number;
    status: "idle" | "exporting" | "done" | "error";
  };
  handleImportFileSelected: (file: File) => void;
  handleResolveConflicts: (action: "skip" | "override") => Promise<void>;
  handleConfirmImport: (selectedGroups: string[]) => Promise<void>;
  handleClearImport: () => void;
  handleExportBookmarks: (selectedGroups: string[]) => void;
  resetExportProgress: () => void;
  handleOptimisticRemoveBookmarks: (ids: string[]) => void;
  addOptimisticBookmark: (bookmark: BookmarkRow) => void;
  applyEnrichment: (id: string, enrichment?: EnrichmentResult) => void;
  replaceBookmarkId: (tempId: string, realId: string) => void;
  commandMode: "add" | "search";
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  handleCommandModeChange: (mode: "add" | "search") => void;
  keyboardContext: "folder" | "bookmark";
  isMac: boolean;
  filteredBookmarks: BookmarkRow[];
  nonFolderViewMode: "list" | "card";
  selectionMode: boolean;
  selectedIds: Set<string>;
  handleToggleSelection: (id: string) => void;
  setSelectionMode: Dispatch<SetStateAction<boolean>>;
  setKeyboardContext: Dispatch<SetStateAction<"folder" | "bookmark">>;
  handleFolderReorder: (groupId: string, newOrder: BookmarkRow[]) => void;
  handleReorder: (groupId: string, newOrder: BookmarkRow[]) => void;
  handleDeleteBookmark: (id: string) => void;
  handleEditBookmark: (
    id: string,
    data: {
      title: string;
      url: string;
      description?: string;
      favicon_url?: string;
      group_id?: string;
      applyFaviconToDomain?: boolean;
    },
  ) => Promise<void>;
  handleCreateNote: (formData: {
    text: string;
    color?: string | null;
  }) => Promise<string>;
  handleUpdateNote: (
    id: string,
    formData: { text: string; color?: string | null },
  ) => Promise<void>;
  handleDeleteNote: (id: string) => Promise<void>;
  handleDeleteNotes: (ids: string[]) => Promise<void>;
  handleCreateTodo: (formData: {
    text: string;
    priority: "high" | "medium" | "low";
  }) => Promise<string>;
  handleUpdateTodo: (
    id: string,
    formData: { text: string; priority: "high" | "medium" | "low" },
  ) => Promise<void>;
  handleDeleteTodo: (id: string) => Promise<void>;
  handleDeleteTodos: (ids: string[]) => Promise<void>;
  handleSetTodoCompleted: (id: string, completed: boolean) => Promise<void>;
  handleSetTodosCompleted: (ids: string[], completed: boolean) => Promise<void>;
  handleOpenSelected: () => void;
  handleBulkDelete: () => Promise<void>;
  handleMoveSelectedToGroup: (groupId: string | null) => Promise<void>;
  handleCancelSelection: () => void;
  isFilteredSearch: boolean;
  handleToggleHideFromAllBookmarks: (
    id: string,
    hide: boolean,
  ) => Promise<void>;
}) {
  const groupsWithNoGroup = useMemo(() => {
    const hasUngrouped = bookmarks.some((b) => !b.group_id);
    if (!hasUngrouped) return groups;
    if (groups.some((g) => g.id === NO_GROUP_ID)) return groups;
    return [
      ...groups,
      createNoGroupRow(),
    ];
  }, [bookmarks, groups]);

  return (
    <>
      <DashboardOnboarding />
      <div
        className={`mx-auto w-full ${
          layoutDensity === "extended" ? "max-w-[1600px]" : "max-w-3xl"
        }`}
      >
        <div className="relative flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
          <DashboardSidebar
            groups={groupsWithNoGroup}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            onReorderGroups={handleGroupsReorder}
            handleOpenGroup={handleOpenGroup}
            editingGroupId={editingGroupId}
            setEditingGroupId={setEditingGroupId}
            editGroupName={editGroupName}
            setEditGroupName={setEditGroupName}
            editGroupIcon={editGroupIcon}
            setEditGroupIcon={setEditGroupIcon}
            editGroupColor={editGroupColor}
            setEditGroupColor={setEditGroupColor}
            isUpdatingGroup={isUpdatingGroup}
            handleSidebarGroupUpdate={handleSidebarGroupUpdate}
            onDeleteGroup={handleDeleteGroup}
            isInlineCreating={isInlineCreating}
            setIsInlineCreating={setIsInlineCreating}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            newGroupIcon={newGroupIcon}
            setNewGroupIcon={setNewGroupIcon}
            newGroupColor={newGroupColor}
            setNewGroupColor={setNewGroupColor}
            isCreatingGroup={isCreatingGroup}
            handleInlineCreateGroup={handleInlineCreateGroup}
            onToggleHideFromAllBookmarks={handleToggleHideFromAllBookmarks}
            layoutDensity={layoutDensity}
          />

          {showNotesTodos && (
            <DashboardNotesTodosSidebar
              notes={notes}
              todos={todos}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onDeleteNotes={handleDeleteNotes}
              onCreateTodo={handleCreateTodo}
              onUpdateTodo={handleUpdateTodo}
              onDeleteTodo={handleDeleteTodo}
              onDeleteTodos={handleDeleteTodos}
              onSetTodoCompleted={handleSetTodoCompleted}
              onSetTodosCompleted={handleSetTodosCompleted}
              layoutDensity={layoutDensity}
            />
          )}

          <div className="flex-none z-40 bg-background px-1">
            <DashboardNav
              user={user}
              bookmarks={bookmarks}
              groups={groupsWithNoGroup}
              notes={notes}
              todos={todos}
              activeGroupId={activeGroupId}
              groupCounts={groupCounts}
              onGroupSelect={setActiveGroupId}
              onGroupCreated={handleGroupCreated}
              onGroupUpdate={handleUpdateGroup}
              onGroupDelete={handleDeleteGroup}
              onGroupOpen={handleOpenGroup}
              onReorderGroups={handleGroupsReorder}
              rowContent={rowContent}
              setRowContent={setRowContent}
              showNotesTodos={showNotesTodos}
              setShowNotesTodos={setShowNotesTodos}
              paletteTheme={paletteTheme}
              setPaletteTheme={setPaletteTheme}
              folderHeaderTint={folderHeaderTint}
              setFolderHeaderTint={setFolderHeaderTint}
              layoutDensity={layoutDensity}
              setLayoutDensity={setLayoutDensity}
              viewMode={viewMode}
              setViewMode={setViewMode}
              exportGroupOptions={exportGroupOptions}
              importPreview={importPreview}
              importProgress={importProgress}
              importResult={importResult}
              exportProgress={exportProgress}
              onImportFileSelected={handleImportFileSelected}
              onUpdateImportAction={handleResolveConflicts}
              onConfirmImport={handleConfirmImport}
              onClearImport={handleClearImport}
              onExportBookmarks={handleExportBookmarks}
              onResetExport={resetExportProgress}
              onRemoveBookmarks={handleOptimisticRemoveBookmarks}
              onCreateNote={handleCreateNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onDeleteNotes={handleDeleteNotes}
              onCreateTodo={handleCreateTodo}
              onUpdateTodo={handleUpdateTodo}
              onDeleteTodo={handleDeleteTodo}
              onDeleteTodos={handleDeleteTodos}
              onSetTodoCompleted={handleSetTodoCompleted}
              onSetTodosCompleted={handleSetTodosCompleted}
            />
            <div className="pt-4 md:pt-6">
              <CommandBar
                onAddBookmark={addOptimisticBookmark}
                onApplyEnrichment={applyEnrichment}
                onReplaceBookmarkId={replaceBookmarkId}
                activeGroupId={activeGroupId}
                mode={commandMode}
                searchQuery={searchQuery}
                onModeChange={handleCommandModeChange}
                onSearchChange={setSearchQuery}
              />
            </div>

            <TableHeader
              viewMode={viewMode}
              keyboardContext={keyboardContext}
              isMac={isMac}
            />
          </div>

          <div className="flex-1 min-h-0">
            <div className="h-full overflow-y-auto overscroll-contain min-h-0 px-1 pt-3 md:pt-2 pb-6 scrollbar-hover-only">
              <div data-onboarding="drag-sort">
                {viewMode === "folders" ? (
                  <FolderBoard
                    bookmarks={filteredBookmarks}
                    groups={groups}
                    activeGroupId={activeGroupId}
                    onReorder={handleFolderReorder}
                    onDeleteBookmark={handleDeleteBookmark}
                    onEditBookmark={handleEditBookmark}
                    isFiltered={isFilteredSearch}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                    onEnterSelectionMode={() => setSelectionMode(true)}
                    onKeyboardContextChange={setKeyboardContext}
                    layoutDensity={layoutDensity}
                    folderHeaderTint={folderHeaderTint}
                  />
                ) : (
                  <BookmarkBoard
                    bookmarks={filteredBookmarks}
                    initialGroups={groups}
                    activeGroupId={activeGroupId}
                    onReorder={handleReorder}
                    onDeleteBookmark={handleDeleteBookmark}
                    onEditBookmark={handleEditBookmark}
                    rowContent={rowContent}
                    viewMode={nonFolderViewMode}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelection={handleToggleSelection}
                    onEnterSelectionMode={() => setSelectionMode(true)}
                    layoutDensity={layoutDensity}
                  />
                )}
              </div>
            </div>
          </div>

          {selectionMode && selectedIds.size > 0 && (
            <FloatingActionBar
              selectedCount={selectedIds.size}
              groups={groups}
              onOpenSelected={handleOpenSelected}
              onBulkDelete={handleBulkDelete}
              onMoveSelectedToGroup={handleMoveSelectedToGroup}
              onCancelSelection={handleCancelSelection}
            />
          )}
        </div>
      </div>
    </>
  );
}
