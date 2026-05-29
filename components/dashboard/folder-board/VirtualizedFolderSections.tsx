"use client"

import { memo, useCallback, type ReactNode } from "react"

import { type GroupRow } from "@/lib/supabase/queries"
import { VirtualizedList } from "../virtualization/VirtualizedList"

export const FOLDER_SECTION_VIRTUALIZATION_THRESHOLD = 20
const FOLDER_SECTION_ESTIMATE = 260
const FOLDER_HEADER_ESTIMATE = 56
const FOLDER_BOOKMARK_ROW_ESTIMATE = 112
const FOLDER_GRID_COLUMNS_ESTIMATE = 4
const FOLDER_SECTION_OVERSCAN = 4
const FOLDER_SECTION_DRAG_OVERSCAN = 8

interface VirtualizedFolderSectionsProps {
  groups: GroupRow[]
  bookmarkCounts: Record<string, number>
  collapsedGroups: Record<string, boolean>
  scrollElement: HTMLElement | null
  selectedFolderId: string | null
  isDragActive: boolean
  renderSection: (group: GroupRow) => ReactNode
}

export const VirtualizedFolderSections = memo(function VirtualizedFolderSections({
  groups,
  bookmarkCounts,
  collapsedGroups,
  scrollElement,
  selectedFolderId,
  isDragActive,
  renderSection,
}: VirtualizedFolderSectionsProps) {
  const selectedIndex = selectedFolderId
    ? groups.findIndex((group) => group.id === selectedFolderId)
    : -1

  const renderGroup = useCallback(
    (group: GroupRow) => renderSection(group),
    [renderSection],
  )
  const getGroupKey = useCallback((group: GroupRow) => group.id, [])
  const estimateSize = useCallback(
    (index: number) => {
      const group = groups[index]
      if (!group) return FOLDER_SECTION_ESTIMATE
      if (collapsedGroups[group.id]) return FOLDER_HEADER_ESTIMATE

      const bookmarkCount = bookmarkCounts[group.id] ?? 0
      const bookmarkRows = Math.max(1, Math.ceil(bookmarkCount / FOLDER_GRID_COLUMNS_ESTIMATE))
      return FOLDER_HEADER_ESTIMATE + 16 + bookmarkRows * FOLDER_BOOKMARK_ROW_ESTIMATE
    },
    [bookmarkCounts, collapsedGroups, groups],
  )

  return (
    <VirtualizedList
      items={groups}
      scrollElement={scrollElement}
      getItemKey={getGroupKey}
      estimateSize={estimateSize}
      renderItem={renderGroup}
      selectedIndex={selectedIndex}
      overscan={isDragActive ? FOLDER_SECTION_DRAG_OVERSCAN : FOLDER_SECTION_OVERSCAN}
      gap={24}
      className="bookmark-board-empty-space"
    />
  )
})
