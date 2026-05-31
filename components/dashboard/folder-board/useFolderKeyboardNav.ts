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

interface FolderKeyboardState {
  visibleGroups: GroupRow[]
  selectedFolderId: string | null
  selectedBookmarkIndex: number
  bookmarkBuckets: Record<string, BookmarkRow[]>
  collapsedGroups: Record<string, boolean>
  gridColumns: number
  isFolderGrid: boolean
}

interface FolderKeyboardActions {
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedBookmarkIndex: React.Dispatch<React.SetStateAction<number>>
  setHasKeyboardFocus: React.Dispatch<React.SetStateAction<boolean>>
  onPreview: (bookmark: BookmarkRow) => void
  onToggleCollapse: (groupId: string) => void
  findFolderNeighbor: (
    currentFolderId: string | null,
    direction: "left" | "right" | "up" | "down",
  ) => string | null
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

function getHorizontalBookmarkIndex(
  previousIndex: number,
  bookmarksLength: number,
  direction: "left" | "right",
) {
  if (direction === "right") {
    const nextIndex = previousIndex + 1
    return nextIndex < bookmarksLength ? nextIndex : previousIndex
  }

  const nextIndex = previousIndex - 1
  return nextIndex >= 0 ? nextIndex : previousIndex
}

function getVerticalBookmarkIndex(
  previousIndex: number,
  columns: number,
  direction: "up" | "down",
) {
  if (direction === "down") {
    return previousIndex + columns
  }

  return previousIndex - columns
}

function getFolderKeyboardContext(state: FolderKeyboardState) {
  const folderIndex = state.selectedFolderId
    ? state.visibleGroups.findIndex((group) => group.id === state.selectedFolderId)
    : -1
  const activeGroup = folderIndex >= 0 ? state.visibleGroups[folderIndex] : undefined
  const activeBookmarks = activeGroup ? (state.bookmarkBuckets[activeGroup.id] ?? []) : []
  const selectedBookmark = getSelectedBookmark(activeBookmarks, state.selectedBookmarkIndex)

  return {
    folderIndex,
    activeGroup,
    activeBookmarks,
    selectedBookmark,
  }
}

function isFolderKeyboardFocusKey(key: string) {
  return (
    key === "ArrowDown" ||
    key === "ArrowUp" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === " " ||
    key === "Enter"
  )
}

function handleArrowDown(state: FolderKeyboardState, actions: FolderKeyboardActions) {
  const { folderIndex, activeGroup, activeBookmarks } = getFolderKeyboardContext(state)

  if (state.selectedBookmarkIndex >= 0) {
    actions.setSelectedBookmarkIndex((prev) => {
      const nextIndex = getVerticalBookmarkIndex(prev, state.gridColumns, "down")
      if (nextIndex < activeBookmarks.length) {
        return nextIndex
      }
      if (folderIndex >= 0 && folderIndex < state.visibleGroups.length - 1) {
        actions.setSelectedFolderId(state.visibleGroups[folderIndex + 1].id)
        return -1
      }
      return prev
    })
    return
  }

  if (folderIndex < 0) {
    actions.setSelectedFolderId(state.visibleGroups[0]?.id ?? null)
    return
  }

  if (!state.collapsedGroups[activeGroup?.id ?? ""] && activeBookmarks.length > 0) {
    actions.setSelectedBookmarkIndex(0)
    return
  }

  if (state.isFolderGrid) {
    const nextId = actions.findFolderNeighbor(state.selectedFolderId, "down")
    if (nextId) actions.setSelectedFolderId(nextId)
  } else {
    const next = Math.min(state.visibleGroups.length - 1, folderIndex + 1)
    actions.setSelectedFolderId(state.visibleGroups[next].id)
  }

  actions.setSelectedBookmarkIndex(-1)
}

function handleArrowUp(state: FolderKeyboardState, actions: FolderKeyboardActions) {
  const { folderIndex } = getFolderKeyboardContext(state)

  if (state.selectedBookmarkIndex >= 0) {
    actions.setSelectedBookmarkIndex((prev) => {
      const nextIndex = getVerticalBookmarkIndex(prev, state.gridColumns, "up")
      return nextIndex >= 0 ? nextIndex : -1
    })
    return
  }

  if (folderIndex < 0) {
    actions.setSelectedFolderId(state.visibleGroups[0]?.id ?? null)
    return
  }

  if (state.isFolderGrid) {
    const nextId = actions.findFolderNeighbor(state.selectedFolderId, "up")
    if (nextId) actions.setSelectedFolderId(nextId)
  } else {
    const next = Math.max(0, folderIndex - 1)
    actions.setSelectedFolderId(state.visibleGroups[next].id)
  }

  actions.setSelectedBookmarkIndex(-1)
}

function handleArrowHorizontal(
  direction: "left" | "right",
  state: FolderKeyboardState,
  actions: FolderKeyboardActions,
) {
  const { activeBookmarks } = getFolderKeyboardContext(state)

  if (state.selectedBookmarkIndex < 0) {
    if (!state.isFolderGrid) return
    const nextId = actions.findFolderNeighbor(state.selectedFolderId, direction)
    if (nextId) actions.setSelectedFolderId(nextId)
    return
  }

  actions.setSelectedBookmarkIndex((prev) =>
    getHorizontalBookmarkIndex(prev, activeBookmarks.length, direction),
  )
}

function handlePreview(state: FolderKeyboardState, actions: FolderKeyboardActions) {
  const { selectedBookmark } = getFolderKeyboardContext(state)
  if (!selectedBookmark) return
  actions.onPreview(selectedBookmark)
}

function handleEnter(
  event: KeyboardEvent,
  state: FolderKeyboardState,
  actions: FolderKeyboardActions,
) {
  const { activeGroup, selectedBookmark } = getFolderKeyboardContext(state)
  if (!activeGroup) return

  if (selectedBookmark) {
    openOrCopyBookmark(selectedBookmark, event)
    return
  }

  actions.onToggleCollapse(activeGroup.id)
}

function handleEscape(actions: FolderKeyboardActions) {
  actions.setSelectedBookmarkIndex(-1)
  actions.setSelectedFolderId(null)
  actions.setHasKeyboardFocus(false)
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

      const state: FolderKeyboardState = {
        visibleGroups: visibleGroupsRef.current,
        selectedFolderId: selectedFolderIdRef.current,
        selectedBookmarkIndex: selectedBookmarkIndexRef.current,
        bookmarkBuckets: bookmarkBucketsRef.current,
        collapsedGroups: collapsedGroupsRef.current,
        gridColumns: gridColumnsRef.current,
        isFolderGrid: isFolderGridRef.current,
      }
      const actions: FolderKeyboardActions = {
        setSelectedFolderId,
        setSelectedBookmarkIndex,
        setHasKeyboardFocus,
        onPreview: onPreviewRef.current,
        onToggleCollapse: onToggleCollapseRef.current,
        findFolderNeighbor,
      }

      if (isFolderKeyboardFocusKey(e.key)) {
        actions.setHasKeyboardFocus(true)
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        handleArrowDown(state, actions)
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        handleArrowUp(state, actions)
        return
      }

      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleArrowHorizontal("right", state, actions)
        return
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleArrowHorizontal("left", state, actions)
        return
      }

      if (e.key === " ") {
        if (!getFolderKeyboardContext(state).selectedBookmark) return
        e.preventDefault()
        handlePreview(state, actions)
        return
      }

      if (e.key === "Enter") {
        if (!getFolderKeyboardContext(state).activeGroup) return
        e.preventDefault()
        handleEnter(e, state, actions)
        return
      }

      if (e.key === "Escape") {
        handleEscape(actions)
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
