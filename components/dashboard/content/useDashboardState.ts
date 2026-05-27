"use client"

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react"
import type { BookmarkRow, GroupRow, NoteRow, TodoRow } from "@/lib/supabase/queries"
import { ALL_BOOKMARKS_GROUP_ID, isAllBookmarksGroupId } from "@/lib/system-groups"
import type { DashboardPaletteTheme } from "@/lib/themes"

export function useDashboardState({
  initialBookmarks,
  initialGroups,
  initialNotes,
  initialTodos,
  initialViewModeAll,
  initialViewModeGroups,
  initialLayoutDensity,
  initialRowContent,
  initialCommandMode,
  initialShowNotesTodos,
  initialPaletteTheme,
  initialFolderHeaderTint,
}: {
  initialBookmarks: BookmarkRow[]
  initialGroups: GroupRow[]
  initialNotes: NoteRow[]
  initialTodos: TodoRow[]
  initialViewModeAll: "list" | "card" | "folders"
  initialViewModeGroups: "list" | "card" | "folders"
  initialLayoutDensity: "compact" | "extended"
  initialRowContent: "date" | "group"
  initialCommandMode: "add" | "search"
  initialShowNotesTodos: boolean
  initialPaletteTheme: DashboardPaletteTheme
  initialFolderHeaderTint: "off" | "low" | "medium" | "high"
}) {
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>(initialBookmarks)
  const [groups, setGroups] = useState<GroupRow[]>(initialGroups)
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes)
  const [todos, setTodos] = useState<TodoRow[]>(initialTodos)

  const [activeGroupId, setActiveGroupId] = useState<string>(ALL_BOOKMARKS_GROUP_ID)

  const [rowContent, setRowContent] = useState<"date" | "group">(initialRowContent)
  const [showNotesTodos, setShowNotesTodos] = useState<boolean>(initialShowNotesTodos)
  const [layoutDensity, setLayoutDensity] = useState<"compact" | "extended">(initialLayoutDensity)

  const [viewModeAll, setViewModeAll] = useState<"list" | "card" | "folders">(initialViewModeAll)
  const [viewModeGroups, setViewModeGroups] = useState<"list" | "card" | "folders">(
    initialViewModeGroups,
  )

  const [keyboardContext, setKeyboardContext] = useState<"folder" | "bookmark">("bookmark")

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const [commandMode, setCommandMode] = useState<"add" | "search">(initialCommandMode)
  const [paletteTheme, setPaletteTheme] = useState<DashboardPaletteTheme>(initialPaletteTheme)

  const [folderHeaderTint, setFolderHeaderTint] = useState<"off" | "low" | "medium" | "high">(
    initialFolderHeaderTint,
  )

  const viewMode = isAllBookmarksGroupId(activeGroupId) ? viewModeAll : viewModeGroups
  const setViewMode = useCallback(
    (value: "list" | "card" | "folders") => {
      if (isAllBookmarksGroupId(activeGroupId)) {
        setViewModeAll(value)
      } else {
        setViewModeGroups(value)
      }
    },
    [activeGroupId],
  )

  const nonFolderViewMode = viewMode === "folders" ? "list" : viewMode

  const lastDeletedRef = useRef<{
    bookmark: BookmarkRow
    index: number
  } | null>(null)
  const lastDeletedGroupRef = useRef<GroupRow | null>(null)
  const lastDeletedGroupBookmarksRef = useRef<BookmarkRow[]>([])
  const lastBulkDeletedRef = useRef<{ bookmark: BookmarkRow; index: number }[]>([])

  const lastDeletedNoteRef = useRef<{ note: NoteRow; index: number } | null>(null)
  const lastBulkDeletedNotesRef = useRef<{ note: NoteRow; index: number }[]>([])

  const lastDeletedTodoRef = useRef<{ todo: TodoRow; index: number } | null>(null)
  const lastBulkDeletedTodosRef = useRef<{ todo: TodoRow; index: number }[]>([])

  const sortBookmarks = useCallback((items: BookmarkRow[]) => {
    return items.toSorted((a, b) => {
      const aOrder = a.order_index ?? Number.POSITIVE_INFINITY
      const bOrder = b.order_index ?? Number.POSITIVE_INFINITY
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [])

  const sortGroups = useCallback((items: GroupRow[]) => {
    return items.toSorted((a, b) => {
      const aOrder = a.order_index ?? Number.POSITIVE_INFINITY
      const bOrder = b.order_index ?? Number.POSITIVE_INFINITY
      if (aOrder !== bOrder) return aOrder - bOrder
      const nameA = a.name || ""
      const nameB = b.name || ""
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" })
    })
  }, [])

  useEffect(() => {
    if (viewMode !== "folders") {
      const raf = window.requestAnimationFrame(() => {
        setKeyboardContext("bookmark")
      })
      return () => {
        window.cancelAnimationFrame(raf)
      }
    }
  }, [viewMode])

  const normalizeGroupName = useCallback((value?: string | null) => {
    const name = value?.trim() ?? ""
    return name.length > 0 ? name : "Ungrouped"
  }, [])

  const isValidImportUrl = useCallback((url: string) => {
    if (!url) return false
    if (!/^https?:\/\//i.test(url)) return false
    try {
      const parsedUrl = new URL(url)
      void parsedUrl
      return true
    } catch {
      return false
    }
  }, [])

  return {
    bookmarks,
    setBookmarks,
    groups,
    setGroups,
    notes,
    setNotes,
    todos,
    setTodos,
    activeGroupId,
    setActiveGroupId,
    rowContent,
    setRowContent,
    showNotesTodos,
    setShowNotesTodos,
    layoutDensity,
    setLayoutDensity,
    viewModeAll,
    setViewModeAll,
    viewModeGroups,
    setViewModeGroups,
    viewMode,
    setViewMode,
    nonFolderViewMode,
    keyboardContext,
    setKeyboardContext,
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    deferredSearchQuery,
    commandMode,
    setCommandMode,
    paletteTheme,
    setPaletteTheme,
    folderHeaderTint,
    setFolderHeaderTint,
    lastDeletedRef,
    lastDeletedGroupRef,
    lastDeletedGroupBookmarksRef,
    lastBulkDeletedRef,
    lastDeletedNoteRef,
    lastBulkDeletedNotesRef,
    lastDeletedTodoRef,
    lastBulkDeletedTodosRef,
    sortBookmarks,
    sortGroups,
    normalizeGroupName,
    isValidImportUrl,
  }
}
