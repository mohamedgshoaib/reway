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

    const bookmarks = bookmarksRef.current
    const isGrid = isGridViewRef.current
    const columns = gridColumnsRef.current
    const currentIndex = selectedIndexRef.current

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        if (prev < 0) return 0
        const nextIndex = prev + (isGrid ? columns : 1)
        return nextIndex < bookmarks.length ? nextIndex : prev
      })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        if (prev <= 0) return 0
        const nextIndex = prev - (isGrid ? columns : 1)
        return nextIndex >= 0 ? nextIndex : prev
      })
    } else if (isGrid && e.key === "ArrowRight") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        if (prev < 0) return 0
        const nextIndex = prev + 1
        return nextIndex < bookmarks.length ? nextIndex : prev
      })
    } else if (isGrid && e.key === "ArrowLeft") {
      e.preventDefault()
      setSelectedIndex((prev) => {
        if (prev <= 0) return 0
        const nextIndex = prev - 1
        return nextIndex >= 0 ? nextIndex : prev
      })
    } else if (e.key === " ") {
      if (currentIndex >= 0) {
        e.preventDefault()
        const bookmark = bookmarks[currentIndex]
        if (bookmark) {
          onPreviewRef.current(bookmark)
        }
      }
    } else if (e.key === "Enter") {
      if (currentIndex >= 0) {
        e.preventDefault()
        const bookmark = bookmarks[currentIndex]
        if (!bookmark) return
        if (e.metaKey || e.ctrlKey) {
          recordBookmarkVisit(bookmark.id)
          window.open(bookmark.url, "_blank", "noopener,noreferrer")
        } else {
          navigator.clipboard.writeText(bookmark.url)
          toast.success("URL copied to clipboard")
        }
      }
    } else if (e.key === "Escape") {
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
