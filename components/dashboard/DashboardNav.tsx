"use client"

import { Note01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { memo, useEffect, useState } from "react"
import RewayLogo from "@/components/logo"
import { Button } from "@/components/ui/button"
import type { BookmarkRow } from "@/lib/supabase/queries"
import type {
  DashboardNavigationAdapter,
  DashboardNavigationControlsAdapter,
  DashboardNotesTodosAdapter,
} from "./content/workspace-shell-types"
import { GroupMenu } from "./nav/GroupMenu"
import { LayoutControls } from "./nav/LayoutControls"
import { ThemeControls } from "./nav/ThemeControls"
import { UserMenu } from "./nav/UserMenu"
import { ViewModeControls } from "./nav/ViewModeControls"

const NotesTodosSheet = dynamic(
  () => import("./nav/NotesTodosSheet").then((mod) => mod.NotesTodosSheet),
  {
    loading: () => null,
    ssr: false,
  },
)

const ImportSheet = dynamic(() => import("./nav/ImportSheet").then((mod) => mod.ImportSheet), {
  loading: () => null,
  ssr: false,
})

const ExportSheet = dynamic(() => import("./nav/ExportSheet").then((mod) => mod.ExportSheet), {
  loading: () => null,
  ssr: false,
})

const DuplicatesSheet = dynamic(
  () => import("./nav/DuplicatesSheet").then((mod) => mod.DuplicatesSheet),
  {
    loading: () => null,
    ssr: false,
  },
)

const EnrichmentHealthSheet = dynamic(
  () => import("./nav/EnrichmentHealthSheet").then((mod) => mod.EnrichmentHealthSheet),
  {
    loading: () => null,
    ssr: false,
  },
)

interface DashboardNavProps {
  navigation: DashboardNavigationAdapter
  navigationControls: DashboardNavigationControlsAdapter
  notesTodos: DashboardNotesTodosAdapter
  enrichmentHealth: {
    bookmarks: BookmarkRow[]
    onRefreshBookmark: (id: string) => Promise<void>
    onLoadBookmarkDetails: (id: string) => Promise<BookmarkRow | null>
    onSelectBookmarks: (ids: string[]) => void
  }
}

export const DashboardNav = memo(function DashboardNav({
  navigation,
  navigationControls,
  notesTodos,
  enrichmentHealth,
}: DashboardNavProps) {
  const router = useRouter()
  const [loadedSheets, setLoadedSheets] = useState({
    notesTodos: false,
    import: false,
    export: false,
    duplicates: false,
    enrichmentHealth: false,
  })

  const initials = navigation.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    setLoadedSheets((current) => {
      const next = {
        notesTodos: current.notesTodos || navigationControls.notesTodosSheetOpen,
        import: current.import || navigationControls.importSheetOpen,
        export: current.export || navigationControls.exportSheetOpen,
        duplicates: current.duplicates || navigationControls.duplicatesSheetOpen,
        enrichmentHealth: current.enrichmentHealth || navigationControls.enrichmentHealthSheetOpen,
      }

      if (
        next.notesTodos === current.notesTodos &&
        next.import === current.import &&
        next.export === current.export &&
        next.duplicates === current.duplicates &&
        next.enrichmentHealth === current.enrichmentHealth
      ) {
        return current
      }

      return next
    })
  }, [
    navigationControls.duplicatesSheetOpen,
    navigationControls.enrichmentHealthSheetOpen,
    navigationControls.exportSheetOpen,
    navigationControls.importSheetOpen,
    navigationControls.notesTodosSheetOpen,
  ])

  return (
    <>
      {loadedSheets.notesTodos || navigationControls.notesTodosSheetOpen ? (
        <NotesTodosSheet
          open={navigationControls.notesTodosSheetOpen}
          onOpenChange={navigationControls.setNotesTodosSheetOpen}
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
        />
      ) : null}

      {loadedSheets.import || navigationControls.importSheetOpen ? (
        <ImportSheet
          open={navigationControls.importSheetOpen}
          onOpenChange={navigationControls.handleImportOpenChange}
          importPreview={navigation.importExport.importPreview}
          importProgress={navigation.importExport.importProgress}
          importResult={navigation.importExport.importResult}
          selectedImportGroups={navigationControls.selectedImportGroups}
          onToggleImportGroup={navigationControls.handleToggleImportGroup}
          onImportFileSelected={navigation.importExport.handleImportFileSelected}
          onUpdateImportAction={navigation.importExport.handleResolveConflicts}
          onConfirmImport={navigation.importExport.handleConfirmImport}
          onClearImport={navigation.importExport.handleClearImport}
        />
      ) : null}

      {loadedSheets.export || navigationControls.exportSheetOpen ? (
        <ExportSheet
          open={navigationControls.exportSheetOpen}
          onOpenChange={navigationControls.handleExportOpenChange}
          exportGroupOptions={navigation.importExport.exportGroupOptions}
          exportProgress={navigation.importExport.exportProgress}
          selectedExportGroups={navigationControls.selectedExportGroups}
          onToggleExportGroup={navigationControls.handleToggleExportGroup}
          onExportBookmarks={navigation.importExport.handleExportBookmarks}
        />
      ) : null}

      {loadedSheets.duplicates || navigationControls.duplicatesSheetOpen ? (
        <DuplicatesSheet
          open={navigationControls.duplicatesSheetOpen}
          onOpenChange={navigationControls.setDuplicatesSheetOpen}
          bookmarks={navigation.bookmarks}
          onRemoveBookmarks={navigation.importExport.handleOptimisticRemoveBookmarks}
        />
      ) : null}

      {loadedSheets.enrichmentHealth || navigationControls.enrichmentHealthSheetOpen ? (
        <EnrichmentHealthSheet
          open={navigationControls.enrichmentHealthSheetOpen}
          onOpenChange={navigationControls.setEnrichmentHealthSheetOpen}
          bookmarks={enrichmentHealth.bookmarks}
          onRefreshBookmark={enrichmentHealth.onRefreshBookmark}
          onLoadBookmarkDetails={enrichmentHealth.onLoadBookmarkDetails}
          onSelectBookmarks={enrichmentHealth.onSelectBookmarks}
        />
      ) : null}

      <nav
        className={`z-40 mx-auto ${
          navigation.preferences.layoutDensity === "extended" ? "max-w-400" : "max-w-3xl"
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
              groups={navigation.groups}
              activeGroupId={navigation.activeGroupId}
              groupCounts={navigation.groupCounts}
              onGroupSelect={navigation.selectGroup}
              onGroupOpen={navigation.openGroup}
              onDeleteGroupClick={navigation.groupControls.handleDeleteGroup}
              editingGroupId={navigation.groupControls.editingGroupId}
              editGroupName={navigation.groupControls.editGroupName}
              setEditGroupName={navigation.groupControls.setEditGroupName}
              editGroupIcon={navigation.groupControls.editGroupIcon}
              setEditGroupIcon={navigation.groupControls.setEditGroupIcon}
              editGroupColor={navigation.groupControls.editGroupColor}
              setEditGroupColor={navigation.groupControls.setEditGroupColor}
              isUpdating={navigation.groupControls.isUpdatingGroup}
              onUpdateGroup={navigation.groupControls.handleSidebarGroupUpdate}
              isInlineCreating={navigation.groupControls.isInlineCreating}
              setIsInlineCreating={navigation.groupControls.setIsInlineCreating}
              newGroupName={navigation.groupControls.newGroupName}
              setNewGroupName={navigation.groupControls.setNewGroupName}
              newGroupIcon={navigation.groupControls.newGroupIcon}
              setNewGroupIcon={navigation.groupControls.setNewGroupIcon}
              newGroupColor={navigation.groupControls.newGroupColor}
              setNewGroupColor={navigation.groupControls.setNewGroupColor}
              isCreating={navigation.groupControls.isCreatingGroup}
              onInlineCreate={navigation.groupControls.handleInlineCreateGroup}
              onInlineCreateCancel={navigation.groupControls.cancelInlineCreateGroup}
              onStartEditingGroup={navigation.groupControls.startEditingGroup}
              onCancelEditingGroup={navigation.groupControls.cancelEditingGroup}
              onToggleShowInQuickAccess={navigation.groupControls.handleToggleShowInQuickAccess}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2" data-onboarding="view-mode-controls">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg transition-transform duration-150 hover:bg-muted/50 active:scale-[0.97] motion-reduce:transition-none cursor-pointer min-[1200px]:hidden"
                onClick={() => navigationControls.setNotesTodosSheetOpen(true)}
                aria-label="Open notes and todos"
              >
                <HugeiconsIcon icon={Note01Icon} size={16} strokeWidth={2} />
              </Button>
              <ViewModeControls
                viewMode={navigation.preferences.viewMode}
                setViewMode={navigation.preferences.setViewMode}
              />
              <div className="hidden md:flex">
                <LayoutControls
                  layoutDensity={navigation.preferences.layoutDensity}
                  setLayoutDensity={navigation.preferences.setLayoutDensity}
                />
              </div>
              <ThemeControls
                paletteTheme={navigation.preferences.paletteTheme}
                setPaletteTheme={navigation.preferences.setPaletteTheme}
              />
            </div>
            <UserMenu
              user={navigation.user}
              initials={initials}
              rowContent={navigation.preferences.rowContent}
              onRowContentChange={navigation.preferences.setRowContent}
              showNotesTodos={notesTodos.showNotesTodos}
              onShowNotesTodosChange={notesTodos.setShowNotesTodos}
              paletteTheme={navigation.preferences.paletteTheme}
              onPaletteThemeChange={navigation.preferences.setPaletteTheme}
              folderHeaderTint={navigation.preferences.folderHeaderTint}
              onFolderHeaderTintChange={navigation.preferences.setFolderHeaderTint}
              layoutDensity={navigation.preferences.layoutDensity}
              onLayoutDensityChange={navigation.preferences.setLayoutDensity}
              onOpenImportSheet={navigationControls.openImportSheet}
              onOpenExportSheet={navigationControls.openExportSheet}
              onOpenDuplicatesSheet={navigationControls.openDuplicatesSheet}
              bookmarks={enrichmentHealth.bookmarks}
              onOpenEnrichmentHealthSheet={navigationControls.openEnrichmentHealthSheet}
            />
          </div>
        </div>
      </nav>
    </>
  )
})
