"use client"

import { useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { useGlobalEvent } from "@/hooks/useGlobalEvent"
import { useGlobalKeydown } from "@/hooks/useGlobalKeydown"
import { recordBookmarkVisit } from "@/lib/bookmark-visits"
import { shouldIgnoreDashboardHotkey } from "@/lib/keyboard"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"

interface UseFolderKeyboardNavOptions {
  bookmarkBuckets: Record<string, BookmarkRow[]>
  collapsedGroups: Record<string, boolean>
  gridColumns: number
  folderGridColumns: number
  isFolderGrid: boolean
  visibleGroups: GroupRow[]
  selectedFolderId: string | null
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>
  selectedBookmarkIndex: number
  setSelectedBookmarkIndex: React.Dispatch<React.SetStateAction<number>>
  setHasKeyboardFocus: React.Dispatch<React.SetStateAction<boolean>>
  onKeyboardContextChange?: (context: "folder" | "bookmark") => void
  onPreview: (bookmark: BookmarkRow) => void
  onToggleCollapse: (groupId: string) => void
}

export function useFolderKeyboardNav({
  bookmarkBuckets,
  collapsedGroups,
  gridColumns,
  folderGridColumns,
  isFolderGrid,
  visibleGroups,
  selectedFolderId,
  setSelectedFolderId,
  selectedBookmarkIndex,
  setSelectedBookmarkIndex,
  setHasKeyboardFocus,
  onKeyboardContextChange,
  onPreview,
  onToggleCollapse,
}: UseFolderKeyboardNavOptions) {
  const bookmarkBucketsRef = useRef(bookmarkBuckets)
  const collapsedGroupsRef = useRef(collapsedGroups)
  const gridColumnsRef = useRef(gridColumns)
  const folderGridColumnsRef = useRef(folderGridColumns)
  const isFolderGridRef = useRef(isFolderGrid)
  const visibleGroupsRef = useRef(visibleGroups)
  const selectedFolderIdRef = useRef(selectedFolderId)
  const selectedBookmarkIndexRef = useRef(selectedBookmarkIndex)
  const onPreviewRef = useRef(onPreview)
  const onToggleCollapseRef = useRef(onToggleCollapse)

  useEffect(() => {
    bookmarkBucketsRef.current = bookmarkBuckets
  }, [bookmarkBuckets])

  useEffect(() => {
    collapsedGroupsRef.current = collapsedGroups
  }, [collapsedGroups])

  useEffect(() => {
    gridColumnsRef.current = gridColumns
  }, [gridColumns])

  useEffect(() => {
    folderGridColumnsRef.current = folderGridColumns
  }, [folderGridColumns])

  useEffect(() => {
    isFolderGridRef.current = isFolderGrid
  }, [isFolderGrid])

  useEffect(() => {
    visibleGroupsRef.current = visibleGroups
  }, [visibleGroups])

  useEffect(() => {
    selectedFolderIdRef.current = selectedFolderId
  }, [selectedFolderId])

  useEffect(() => {
    selectedBookmarkIndexRef.current = selectedBookmarkIndex
  }, [selectedBookmarkIndex])

  useEffect(() => {
    onPreviewRef.current = onPreview
  }, [onPreview])

  useEffect(() => {
    onToggleCollapseRef.current = onToggleCollapse
  }, [onToggleCollapse])

  const findFolderNeighbor = useCallback(
    (currentFolderId: string | null, direction: "left" | "right" | "up" | "down") => {
      if (typeof document === "undefined") return null

      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="folder-section"][data-state]'),
      )

      const elements = nodes.flatMap((el) => {
        const folderId = el.getAttribute("data-folder-id")
        if (!folderId) return []
        return [{ el, folderId, rect: el.getBoundingClientRect() }]
      })

      const current = currentFolderId
        ? elements.find((e) => e.folderId === currentFolderId)
        : undefined

      const origin = current?.rect
      if (!origin) {
        return elements[0]?.folderId ?? null
      }

      const ox = origin.left + origin.width / 2
      const oy = origin.top + origin.height / 2

      const candidates = elements.filter((e) => e.folderId !== currentFolderId)

      const filtered = candidates
        .flatMap((e) => {
          const cx = e.rect.left + e.rect.width / 2
          const cy = e.rect.top + e.rect.height / 2
          const dx = cx - ox
          const dy = cy - oy
          const inDir =
            direction === "left"
              ? dx < -8
              : direction === "right"
                ? dx > 8
                : direction === "up"
                  ? dy < -8
                  : dy > 8

          if (!inDir) return []

          const primary =
            direction === "left" || direction === "right" ? Math.abs(dx) : Math.abs(dy)
          const secondary =
            direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx)

          return [{ value: e.folderId, primary, secondary }]
        })
        .toSorted((a, b) =>
          a.primary !== b.primary ? a.primary - b.primary : a.secondary - b.secondary,
        )

      return filtered[0]?.value ?? null
    },
    [],
  )

  useEffect(() => {
    onKeyboardContextChange?.(selectedBookmarkIndex >= 0 ? "bookmark" : "folder")
  }, [onKeyboardContextChange, selectedBookmarkIndex])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (shouldIgnoreDashboardHotkey(e)) return

      const visibleGroupsValue = visibleGroupsRef.current
      const selectedFolderValue = selectedFolderIdRef.current
      const selectedBookmarkValue = selectedBookmarkIndexRef.current
      const bucketsValue = bookmarkBucketsRef.current
      const collapsedValue = collapsedGroupsRef.current
      const columns = gridColumnsRef.current
      const folderGrid = isFolderGridRef.current

      const folderIndex = selectedFolderValue
        ? visibleGroupsValue.findIndex((group) => group.id === selectedFolderValue)
        : -1
      const activeGroup = folderIndex >= 0 ? visibleGroupsValue[folderIndex] : undefined
      const activeBookmarks = activeGroup ? (bucketsValue[activeGroup.id] ?? []) : []

      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        setHasKeyboardFocus(true)
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        if (selectedBookmarkValue >= 0) {
          setSelectedBookmarkIndex((prev) => {
            const nextIndex = prev + columns
            if (nextIndex < activeBookmarks.length) {
              return nextIndex
            }
            if (folderIndex >= 0 && folderIndex < visibleGroupsValue.length - 1) {
              setSelectedFolderId(visibleGroupsValue[folderIndex + 1].id)
              return -1
            }
            return prev
          })
          return
        }

        if (folderIndex < 0) {
          setSelectedFolderId(visibleGroupsValue[0]?.id ?? null)
          return
        }

        if (!collapsedValue[activeGroup?.id ?? ""] && activeBookmarks.length > 0) {
          setSelectedBookmarkIndex(0)
          return
        }

        if (folderGrid) {
          const nextId = findFolderNeighbor(selectedFolderValue, "down")
          if (nextId) setSelectedFolderId(nextId)
        } else {
          const next = Math.min(visibleGroupsValue.length - 1, folderIndex + 1)
          setSelectedFolderId(visibleGroupsValue[next].id)
        }
        setSelectedBookmarkIndex(-1)
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        if (selectedBookmarkValue >= 0) {
          setSelectedBookmarkIndex((prev) => {
            const nextIndex = prev - columns
            if (nextIndex >= 0) {
              return nextIndex
            }
            return -1
          })
          return
        }

        if (folderIndex < 0) {
          setSelectedFolderId(visibleGroupsValue[0]?.id ?? null)
          return
        }

        if (folderGrid) {
          const nextId = findFolderNeighbor(selectedFolderValue, "up")
          if (nextId) setSelectedFolderId(nextId)
        } else {
          const next = Math.max(0, folderIndex - 1)
          setSelectedFolderId(visibleGroupsValue[next].id)
        }
        setSelectedBookmarkIndex(-1)
        return
      }

      if (selectedBookmarkValue < 0 && folderGrid && e.key === "ArrowRight") {
        e.preventDefault()
        const nextId = findFolderNeighbor(selectedFolderValue, "right")
        if (nextId) setSelectedFolderId(nextId)
        return
      }

      if (selectedBookmarkValue < 0 && folderGrid && e.key === "ArrowLeft") {
        e.preventDefault()
        const nextId = findFolderNeighbor(selectedFolderValue, "left")
        if (nextId) setSelectedFolderId(nextId)
        return
      }

      if (selectedBookmarkValue >= 0 && e.key === "ArrowRight") {
        e.preventDefault()
        setSelectedBookmarkIndex((prev) => {
          const nextIndex = prev + 1
          return nextIndex < activeBookmarks.length ? nextIndex : prev
        })
        return
      }

      if (selectedBookmarkValue >= 0 && e.key === "ArrowLeft") {
        e.preventDefault()
        setSelectedBookmarkIndex((prev) => {
          const nextIndex = prev - 1
          return nextIndex >= 0 ? nextIndex : prev
        })
        return
      }

      if (e.key === " ") {
        if (selectedBookmarkValue >= 0) {
          const bookmark = activeBookmarks[selectedBookmarkValue]
          if (!bookmark) return
          e.preventDefault()
          onPreviewRef.current(bookmark)
        }
        return
      }

      if (e.key === "Enter") {
        if (!activeGroup) return
        e.preventDefault()

        if (selectedBookmarkValue >= 0) {
          const bookmark = activeBookmarks[selectedBookmarkValue]
          if (!bookmark) return
          if (e.metaKey || e.ctrlKey) {
            recordBookmarkVisit(bookmark.id)
            window.open(bookmark.url, "_blank", "noopener,noreferrer")
          } else {
            navigator.clipboard.writeText(bookmark.url)
            toast.success("URL copied to clipboard")
          }
          return
        }

        onToggleCollapseRef.current(activeGroup.id)
        return
      }

      if (e.key === "Escape") {
        setSelectedBookmarkIndex(-1)
        setSelectedFolderId(null)
        setHasKeyboardFocus(false)
      }
    },
    [findFolderNeighbor, setHasKeyboardFocus, setSelectedBookmarkIndex, setSelectedFolderId],
  )

  useGlobalKeydown(handleKeyDown, { capture: true })

  useGlobalEvent("mousedown", (event) => {
    setHasKeyboardFocus(false)
    const target = event.target as HTMLElement | null
    if (!target?.closest('[data-slot="folder-board"]')) {
      setSelectedBookmarkIndex(-1)
      setSelectedFolderId(null)
    }
  })
}
