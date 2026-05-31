"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { useGlobalEvent } from "@/hooks/useGlobalEvent"
import { useGlobalKeydown } from "@/hooks/useGlobalKeydown"
import { recordBookmarkVisit } from "@/lib/bookmark-visits"
import { shouldIgnoreDashboardHotkey } from "@/lib/keyboard"
import type { BookmarkRow } from "@/lib/supabase/queries"

interface UseBookmarkKeyboardNavOptions {
  bookmarks: BookmarkRow[]
  isGridView: boolean
  gridColumns: number
  onPreview: (bookmark: BookmarkRow) => void
}

function getVerticalSelectionIndex(
  previousIndex: number,
  length: number,
  step: number,
  direction: "down" | "up",
) {
  if (direction === "down") {
    if (previousIndex < 0) return 0
    const nextIndex = previousIndex + step
    return nextIndex < length ? nextIndex : previousIndex
  }

  if (previousIndex <= 0) return 0
  const nextIndex = previousIndex - step
  return nextIndex >= 0 ? nextIndex : previousIndex
}

function getHorizontalSelectionIndex(
  previousIndex: number,
  length: number,
  direction: "left" | "right",
) {
  if (direction === "right") {
    if (previousIndex < 0) return 0
    const nextIndex = previousIndex + 1
    return nextIndex < length ? nextIndex : previousIndex
  }

  if (previousIndex <= 0) return 0
  const nextIndex = previousIndex - 1
  return nextIndex >= 0 ? nextIndex : previousIndex
}

function getSelectedBookmark(bookmarks: BookmarkRow[], selectedIndex: number) {
  return selectedIndex >= 0 ? bookmarks[selectedIndex] : undefined
}

function openOrCopyBookmark(bookmark: BookmarkRow, event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey) {
    recordBookmarkVisit(bookmark.id)
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
    return
  }

  navigator.clipboard.writeText(bookmark.url)
  toast.success("URL copied to clipboard")
}

export function useBookmarkKeyboardNav({
  bookmarks,
  isGridView,
  gridColumns,
  onPreview,
}: UseBookmarkKeyboardNavOptions) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const bookmarksRef = useRef(bookmarks)
  const isGridViewRef = useRef(isGridView)
  const gridColumnsRef = useRef(gridColumns)
  const onPreviewRef = useRef(onPreview)
  const selectedIndexRef = useRef(selectedIndex)

  useEffect(() => {
    bookmarksRef.current = bookmarks
  }, [bookmarks])

  useEffect(() => {
    isGridViewRef.current = isGridView
  }, [isGridView])

  useEffect(() => {
    gridColumnsRef.current = gridColumns
  }, [gridColumns])

  useEffect(() => {
    onPreviewRef.current = onPreview
  }, [onPreview])

  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (shouldIgnoreDashboardHotkey(e)) return

    const currentBookmarks = bookmarksRef.current
    const isGrid = isGridViewRef.current
    const columns = gridColumnsRef.current
    const selectedBookmark = getSelectedBookmark(currentBookmarks, selectedIndexRef.current)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        getVerticalSelectionIndex(prev, currentBookmarks.length, isGrid ? columns : 1, "down"),
      )
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        getVerticalSelectionIndex(prev, currentBookmarks.length, isGrid ? columns : 1, "up"),
      )
      return
    }

    if (isGrid && e.key === "ArrowRight") {
      e.preventDefault()
      setSelectedIndex((prev) => getHorizontalSelectionIndex(prev, currentBookmarks.length, "right"))
      return
    }

    if (isGrid && e.key === "ArrowLeft") {
      e.preventDefault()
      setSelectedIndex((prev) => getHorizontalSelectionIndex(prev, currentBookmarks.length, "left"))
      return
    }

    if (e.key === " ") {
      if (!selectedBookmark) return
      e.preventDefault()
      onPreviewRef.current(selectedBookmark)
      return
    }

    if (e.key === "Enter") {
      if (!selectedBookmark) return
      e.preventDefault()
      openOrCopyBookmark(selectedBookmark, e)
      return
    }

    if (e.key === "Escape") {
      setSelectedIndex(-1)
    }
  }, [])

  useGlobalKeydown(handleKeyDown)

  useGlobalEvent("mousedown", (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-slot="bookmark-card"]')) {
      setSelectedIndex(-1)
    }
  })

  const clampedSelectedIndex = selectedIndex >= bookmarks.length ? -1 : selectedIndex

  return { selectedIndex, setSelectedIndex, clampedSelectedIndex }
}
