"use client"

import { memo, useCallback, useMemo } from "react"

import { GroupRow } from "@/lib/supabase/queries"
import { SortableBookmarkCard } from "../SortableBookmarkCard"
import { VirtualizedList } from "../virtualization/VirtualizedList"
import { type DisplayBookmark } from "./VirtualizedBookmarkList"

export const BOOKMARK_CARD_VIRTUALIZATION_THRESHOLD = 50
const BOOKMARK_CARD_ROW_ESTIMATE = 132
const BOOKMARK_CARD_ROW_OVERSCAN = 6
const BOOKMARK_CARD_ROW_DRAG_OVERSCAN = 12

interface BookmarkCardRow {
  id: string
  startIndex: number
  bookmarks: DisplayBookmark[]
}

interface VirtualizedBookmarkCardRowsProps {
  bookmarks: DisplayBookmark[]
  rawGroupIds: (string | null | undefined)[]
  scrollElement: HTMLElement | null
  gridColumns: number
  selectedIndex: number
  selectionMode: boolean
  selectedIds: Set<string>
  onToggleSelection?: (id: string) => void
  onEnterSelectionMode?: () => void
  groupsMap: Map<string, GroupRow>
  activeGroupId: string
  isMostVisitedGroup: boolean
  rowContent: "date" | "group"
  isDragActive: boolean
  isGroupRestrictedDragActive: boolean
  activeDragBucket: string | null
  getDragBucket: (groupId?: string | null) => string
  onDelete: (id: string) => void
  onRefresh: (id: string) => void
  onEdit: (id: string) => void
  onPreview: (id: string) => void
}

export const VirtualizedBookmarkCardRows = memo(function VirtualizedBookmarkCardRows({
  bookmarks,
  rawGroupIds,
  scrollElement,
  gridColumns,
  selectedIndex,
  selectionMode,
  selectedIds,
  onToggleSelection,
  onEnterSelectionMode,
  groupsMap,
  activeGroupId,
  isMostVisitedGroup,
  rowContent,
  isDragActive,
  isGroupRestrictedDragActive,
  activeDragBucket,
  getDragBucket,
  onDelete,
  onRefresh,
  onEdit,
  onPreview,
}: VirtualizedBookmarkCardRowsProps) {
  const columns = Math.max(1, gridColumns)
  const rows = useMemo<BookmarkCardRow[]>(() => {
    const nextRows: BookmarkCardRow[] = []
    for (let index = 0; index < bookmarks.length; index += columns) {
      const rowBookmarks = bookmarks.slice(index, index + columns)
      const firstBookmark = rowBookmarks[0]
      if (!firstBookmark) continue
      nextRows.push({
        id: firstBookmark.id,
        startIndex: index,
        bookmarks: rowBookmarks,
      })
    }
    return nextRows
  }, [bookmarks, columns])

  const renderRow = useCallback(
    (row: BookmarkCardRow) => (
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {row.bookmarks.map((bookmark, offset) => {
          const index = row.startIndex + offset
          const bookmarkDragBucket = getDragBucket(rawGroupIds[index] ?? null)

          return (
            <SortableBookmarkCard
              key={bookmark.id}
              isSelected={selectedIndex === index}
              selectionMode={selectionMode}
              isSelectionChecked={selectedIds.has(bookmark.id)}
              onToggleSelection={onToggleSelection}
              onEnterSelectionMode={onEnterSelectionMode}
              groupsMap={groupsMap}
              activeGroupId={activeGroupId}
              dragDisabled={isMostVisitedGroup}
              dragDimmed={
                Boolean(isGroupRestrictedDragActive) &&
                activeDragBucket !== null &&
                bookmarkDragBucket !== activeDragBucket
              }
              onDelete={onDelete}
              onRefresh={onRefresh}
              onEdit={onEdit}
              onPreview={onPreview}
              rowContent={rowContent}
              {...bookmark}
            />
          )
        })}
      </div>
    ),
    [
      activeDragBucket,
      activeGroupId,
      columns,
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
      selectedIds,
      selectedIndex,
      selectionMode,
    ],
  )

  const getRowKey = useCallback((row: BookmarkCardRow) => row.id, [])
  const estimateSize = useCallback(() => BOOKMARK_CARD_ROW_ESTIMATE, [])

  return (
    <VirtualizedList
      items={rows}
      scrollElement={scrollElement}
      getItemKey={getRowKey}
      estimateSize={estimateSize}
      renderItem={renderRow}
      selectedIndex={selectedIndex >= 0 ? Math.floor(selectedIndex / columns) : -1}
      overscan={isDragActive ? BOOKMARK_CARD_ROW_DRAG_OVERSCAN : BOOKMARK_CARD_ROW_OVERSCAN}
      gap={12}
      className="bookmark-board-empty-space"
    />
  )
})
