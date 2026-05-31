"use client"

import { DndContext, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core"
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable"
import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import { isMostVisitedGroupId } from "@/lib/system-groups"
import { getDisplayTitle, getDomain } from "@/lib/utils"
import { BookmarkEditSheet } from "./BookmarkEditSheet"
import { EmptyFolder } from "./folder-board/EmptyFolder"
import { FolderDragOverlay } from "./folder-board/FolderDragOverlay"
import { FolderHeader } from "./folder-board/FolderHeader"
import { getVisibleGroups } from "./folder-board/getVisibleGroups"
import { useBookmarkBuckets } from "./folder-board/useBookmarkBuckets"
import { useFolderCollapseState } from "./folder-board/useFolderCollapseState"
import { useFolderDnd } from "./folder-board/useFolderDnd"
import { useFolderGridColumns } from "./folder-board/useFolderGridColumns"
import { useFolderKeyboardNav } from "./folder-board/useFolderKeyboardNav"
import { QuickGlanceDialog } from "./QuickGlanceDialog"
import { SortableBookmarkIcon } from "./SortableBookmarkIcon"

function getBookmarkDisplayDomain(bookmark: BookmarkRow) {
  return bookmark.domain || getDomain(bookmark.url)
}

interface FolderBoardProps {
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  activeGroupId: string
  onReorder: (groupId: string, newOrder: BookmarkRow[], movedBookmarkId: string) => void
  onDeleteBookmark: (id: string) => void
  onRefreshBookmark: (id: string) => Promise<void>
  onLoadBookmarkDetails: (id: string) => Promise<BookmarkRow | null>
  onEditBookmark: (
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
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelection?: (id: string) => void
  onEnterSelectionMode?: () => void
  onKeyboardContextChange?: (context: "folder" | "bookmark") => void
  isFiltered?: boolean
  layoutDensity?: "compact" | "extended"
  folderHeaderTint?: "off" | "low" | "medium" | "high"
}

export const FolderBoard = memo(function FolderBoard({
  bookmarks,
  groups,
  activeGroupId,
  onReorder,
  onDeleteBookmark,
  onRefreshBookmark,
  onLoadBookmarkDetails,
  onEditBookmark,
  selectionMode = false,
  selectedIds,
  onToggleSelection,
  onEnterSelectionMode,
  onKeyboardContextChange,
  isFiltered = false,
  layoutDensity = "compact",
  folderHeaderTint = "medium",
}: FolderBoardProps) {
  const stableSelectedIds = useMemo(() => selectedIds ?? new Set<string>(), [selectedIds])

  const onKeyboardContextChangeRef = useRef(onKeyboardContextChange)
  useEffect(() => {
    onKeyboardContextChangeRef.current = onKeyboardContextChange
  }, [onKeyboardContextChange])

  const { collapsedGroups, setCollapsedGroups } = useFolderCollapseState()

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedBookmarkIndex, setSelectedBookmarkIndex] = useState<number>(-1)

  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false)
  const dndContextBaseId = useId()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewBookmark, setPreviewBookmark] = useState<BookmarkRow | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editSheetBookmark, setEditSheetBookmark] = useState<BookmarkRow | null>(null)

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const visibleGroups = useMemo(() => {
    return getVisibleGroups({
      groups,
      bookmarks,
      activeGroupId,
      isFiltered,
    })
  }, [activeGroupId, bookmarks, groups, isFiltered])

  const isMostVisitedGroup = isMostVisitedGroupId(activeGroupId)

  const getBookmarkForPanel = useCallback(async (id: string) => {
    const fallback = bookmarks.find((bookmark) => bookmark.id === id) ?? null
    try {
      return (await onLoadBookmarkDetails(id)) ?? fallback
    } catch (error) {
      console.error("Failed to load bookmark details:", error)
      return fallback
    }
  }, [bookmarks, onLoadBookmarkDetails])

  const openPreview = useCallback(async (id: string) => {
    const bookmark = await getBookmarkForPanel(id)
    if (!bookmark) return
    setPreviewBookmark(bookmark)
    setIsPreviewOpen(true)
  }, [getBookmarkForPanel])

  const openEditSheet = useCallback(async (id: string) => {
    const bookmark = await getBookmarkForPanel(id)
    if (!bookmark) return
    setEditSheetBookmark(bookmark)
    setIsEditSheetOpen(true)
  }, [getBookmarkForPanel])

  const handleRefreshItem = useCallback(
    (id: string) => {
      void onRefreshBookmark(id)
    },
    [onRefreshBookmark],
  )

  const handleEditItem = useCallback(
    (id: string) => {
      void openEditSheet(id)
    },
    [openEditSheet],
  )

  const handlePreviewItem = useCallback(
    (id: string) => {
      void openPreview(id)
    },
    [openPreview],
  )

  const bookmarkBuckets = useBookmarkBuckets({
    bookmarks,
    visibleGroups,
    activeGroupId,
  })

  const { gridColumns, folderGridColumns, foldersGridRef, activeGridRef } = useFolderGridColumns({
    isExtendedFolderGrid: layoutDensity === "extended",
    selectedFolderId,
  })

  const { sensors, collisionDetection, activeBookmark, handleDragStart, handleDragEnd } =
    useFolderDnd({
      bookmarks,
      bookmarkBuckets,
      onReorder,
      disabled: isMostVisitedGroup,
    })
  const isExtendedFolderGrid = layoutDensity === "extended"

  const openFolders = useMemo(
    () => visibleGroups.flatMap((group) => (collapsedGroups[group.id] ? [] : [group.id])),
    [collapsedGroups, visibleGroups],
  )

  const folderColumns = useMemo(() => {
    if (!isExtendedFolderGrid) return [visibleGroups]
    const cols = Math.max(1, folderGridColumns)
    const result: GroupRow[][] = Array.from({ length: cols }, () => [])
    visibleGroups.forEach((group, index) => {
      result[index % cols]?.push(group)
    })
    return result
  }, [folderGridColumns, isExtendedFolderGrid, visibleGroups])

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }, [setCollapsedGroups])

  const handleAccordionChange = (values: string[]) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev }
      visibleGroups.forEach((group) => {
        next[group.id] = !values.includes(group.id)
      })
      return next
    })

    if (selectedFolderId && !values.includes(selectedFolderId)) {
      setSelectedBookmarkIndex(-1)
    }
  }

  useEffect(() => {
    if (visibleGroups.length === 0) {
      queueMicrotask(() => {
        setSelectedFolderId(null)
        setSelectedBookmarkIndex(-1)
        setHasKeyboardFocus(false)
        onKeyboardContextChangeRef.current?.("folder")
      })
      return
    }

    if (selectedFolderId && visibleGroups.some((g) => g.id === selectedFolderId)) {
      return
    }

    if (hasKeyboardFocus) {
      queueMicrotask(() => {
        setSelectedFolderId(visibleGroups[0]?.id ?? null)
        setSelectedBookmarkIndex(-1)
      })
    } else {
      queueMicrotask(() => {
        setSelectedFolderId(null)
        setSelectedBookmarkIndex(-1)
      })
    }
  }, [hasKeyboardFocus, selectedFolderId, visibleGroups])

  useFolderKeyboardNav({
    bookmarkBuckets,
    collapsedGroups,
    gridColumns,
    folderGridColumns,
    isFolderGrid: isExtendedFolderGrid,
    visibleGroups,
    selectedFolderId,
    setSelectedFolderId,
    selectedBookmarkIndex,
    setSelectedBookmarkIndex,
    setHasKeyboardFocus,
    onKeyboardContextChange,
    onPreview: (bookmark) => {
      handlePreviewItem(bookmark.id)
    },
    onToggleCollapse: toggleCollapse,
  })

  const renderFolderSection = useCallback(
    (group: GroupRow) => {
      const groupBookmarks = bookmarkBuckets[group.id] ?? []
      const isSelectedFolder = group.id === selectedFolderId
      const groupBookmarkIds = groupBookmarks.map((bookmark) => bookmark.id)

      return (
        <AccordionItem
          key={group.id}
          value={group.id}
          className={`rounded-3xl border-0 ring-1 ring-foreground/8 bg-background/30 ${
            hasKeyboardFocus && isSelectedFolder && selectedBookmarkIndex < 0
              ? "ring-2 ring-primary/20"
              : ""
          } ${isExtendedFolderGrid ? "w-full" : ""}`}
          data-slot="folder-section"
          data-folder-id={group.id}
        >
          <FolderHeader
            group={group}
            count={groupBookmarks.length}
            tintLevel={folderHeaderTint}
            isSelected={
              hasKeyboardFocus && group.id === selectedFolderId && selectedBookmarkIndex < 0
            }
            onSelect={() => setSelectedFolderId(group.id)}
          />

          <AccordionContent className="px-0">
            <div className="p-2 bg-background/60">
              {groupBookmarks.length === 0 ? (
                <EmptyFolder />
              ) : (
                <SortableContext
                  id={group.id}
                  items={groupBookmarkIds}
                  strategy={rectSortingStrategy}
                >
                  <div
                    className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]"
                    ref={isSelectedFolder ? activeGridRef : undefined}
                  >
                    {groupBookmarks.map((bookmark, index) => {
                      const domain = getBookmarkDisplayDomain(bookmark)

                      return (
                        <SortableBookmarkIcon
                          key={bookmark.id}
                          id={bookmark.id}
                          title={getDisplayTitle({
                            title: bookmark.title,
                            url: bookmark.url,
                            normalizedUrl: bookmark.normalized_url,
                            domain,
                          })}
                          url={bookmark.url}
                          domain={domain}
                          status={bookmark.status ?? "ready"}
                          favicon={bookmark.favicon_url || ""}
                          isEnriching={Boolean(bookmark.is_enriching)}
                          isSelected={isSelectedFolder && selectedBookmarkIndex === index}
                          selectionMode={selectionMode}
                          isSelectionChecked={stableSelectedIds.has(bookmark.id)}
                          dragDisabled={isMostVisitedGroup}
                          onToggleSelection={onToggleSelection}
                          onEnterSelectionMode={onEnterSelectionMode}
                          onDelete={onDeleteBookmark}
                          onRefresh={handleRefreshItem}
                          onEdit={handleEditItem}
                          onPreview={handlePreviewItem}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )
    },
    [
      activeGridRef,
      bookmarkBuckets,
      folderHeaderTint,
      handleEditItem,
      handlePreviewItem,
      handleRefreshItem,
      hasKeyboardFocus,
      isExtendedFolderGrid,
      isMostVisitedGroup,
      onDeleteBookmark,
      onEnterSelectionMode,
      onToggleSelection,
      selectedBookmarkIndex,
      selectedFolderId,
      selectionMode,
      stableSelectedIds,
    ],
  )

  return (
    <>
      <DndContext
        id={dndContextBaseId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Accordion
          type="multiple"
          value={openFolders}
          onValueChange={handleAccordionChange}
          className={
            isExtendedFolderGrid
              ? "grid border-0 bg-transparent overflow-visible gap-5"
              : "flex flex-col gap-6 border-0 bg-transparent overflow-visible"
          }
          data-slot="folder-board"
          ref={isExtendedFolderGrid ? foldersGridRef : undefined}
          style={
            isExtendedFolderGrid
              ? ({
                  gridTemplateColumns: `repeat(${folderGridColumns}, minmax(0, 1fr))`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {folderColumns.map((columnGroups) => (
            <div
              key={`folder-col-${columnGroups.map((group) => group.id).join("-") || "empty"}`}
              className={isExtendedFolderGrid ? "flex flex-col gap-5" : "flex flex-col gap-5"}
            >
              {columnGroups.map((group) => renderFolderSection(group))}
            </div>
          ))}
        </Accordion>

        {mounted
          ? createPortal(
              <DragOverlay
                dropAnimation={{
                  duration: 220,
                  easing: "cubic-bezier(0.18, 1, 0.32, 1)",
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: "0" } },
                  }),
                }}
              >
                <FolderDragOverlay activeBookmark={activeBookmark} />
              </DragOverlay>,
              document.body,
            )
          : null}
      </DndContext>
      <QuickGlanceDialog
        bookmark={previewBookmark}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onEdit={(bookmark) => {
          setIsPreviewOpen(false)
          setEditSheetBookmark(bookmark)
          setIsEditSheetOpen(true)
        }}
        onDelete={(id) => {
          setIsPreviewOpen(false)
          onDeleteBookmark(id)
        }}
        groups={groups}
      />

      <BookmarkEditSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        bookmark={editSheetBookmark}
        groups={groups}
        onSave={onEditBookmark}
      />
    </>
  )
})
