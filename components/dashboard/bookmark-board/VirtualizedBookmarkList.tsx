"use client"

import { memo, useCallback } from "react"

import { GroupRow } from "@/lib/supabase/queries"
import { SortableBookmark } from "../SortableBookmark"
import { VirtualizedList } from "../virtualization/VirtualizedList"

export const BOOKMARK_LIST_VIRTUALIZATION_THRESHOLD = 50
const BOOKMARK_LIST_ROW_ESTIMATE = 48
const BOOKMARK_LIST_OVERSCAN = 10
const BOOKMARK_LIST_DRAG_OVERSCAN = 24

export interface DisplayBookmark {
  id: string
  title: string
  url: string
  domain: string
  favicon?: string
  isEnriching: boolean
  createdAt: string
  groupId: string
  status: string
}

interface VirtualizedBookmarkListProps {
  bookmarks: DisplayBookmark[]
  rawGroupIds: (string | null | undefined)[]
  scrollElement: HTMLElement | null
  selectedIndex: number
  selectionMode: boolean
  selectedIds: Set<string>
  onToggleSelection?: (id: string) => void
  onEnterSelectionMode?: () => void
  groupsMap: Map<string, GroupRow>
  activeGroupId: string
  isMostVisitedGroup: boolean
  rowContent: "date" | "group"
  layoutDensity?: "compact" | "extended"
  isDragActive: boolean
  isGroupRestrictedDragActive: boolean
  activeDragBucket: string | null
  getDragBucket: (groupId?: string | null) => string
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  onEdit: (id: string) => void
  onPreview: (id: string) => void
}

export const VirtualizedBookmarkList = memo(function VirtualizedBookmarkList({
  bookmarks,
  rawGroupIds,
  scrollElement,
  selectedIndex,
  selectionMode,
  selectedIds,
  onToggleSelection,
  onEnterSelectionMode,
  groupsMap,
  activeGroupId,
  isMostVisitedGroup,
  rowContent,
  layoutDensity = "compact",
  isDragActive,
  isGroupRestrictedDragActive,
  activeDragBucket,
  getDragBucket,
  onDelete,
  onRefresh,
  onEdit,
  onPreview,
}: VirtualizedBookmarkListProps) {
  const renderBookmark = useCallback(
    (bookmark: DisplayBookmark, index: number) => {
      const bookmarkDragBucket = getDragBucket(rawGroupIds[index] ?? null)

      return (
        <SortableBookmark
          key={bookmark.id}
          onDelete={onDelete}
          onRefresh={onRefresh}
          onEdit={onEdit}
          isSelected={selectedIndex === index}
          activeGroupId={activeGroupId}
          dragDisabled={isMostVisitedGroup}
          onPreview={onPreview}
          rowContent={rowContent}
          layoutDensity={layoutDensity}
          groupsMap={groupsMap}
          selectionMode={selectionMode}
          dragDimmed={
            Boolean(isGroupRestrictedDragActive) &&
            activeDragBucket !== null &&
            bookmarkDragBucket !== activeDragBucket
          }
          isSelectionChecked={selectedIds.has(bookmark.id)}
          onToggleSelection={onToggleSelection}
          onEnterSelectionMode={onEnterSelectionMode}
          {...bookmark}
        />
      )
    },
    [
      activeDragBucket,
      activeGroupId,
      getDragBucket,
      groupsMap,
      isGroupRestrictedDragActive,
      isMostVisitedGroup,
      onDelete,
      onEdit,
      onEnterSelectionMode,
      onPreview,
      onRefresh,
      onToggleSelection,
      rawGroupIds,
      rowContent,
      layoutDensity,
      selectedIds,
      selectedIndex,
      selectionMode,
    ],
  )

  const getItemKey = useCallback((bookmark: DisplayBookmark) => bookmark.id, [])
  const estimateSize = useCallback(() => BOOKMARK_LIST_ROW_ESTIMATE, [])

  return (
    <VirtualizedList
      items={bookmarks}
      scrollElement={scrollElement}
      getItemKey={getItemKey}
      estimateSize={estimateSize}
      renderItem={renderBookmark}
      selectedIndex={selectedIndex}
      overscan={isDragActive ? BOOKMARK_LIST_DRAG_OVERSCAN : BOOKMARK_LIST_OVERSCAN}
      gap={4}
      className="bookmark-board-empty-space"
    />
  )
})
