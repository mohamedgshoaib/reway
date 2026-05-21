"use client"

import { useEffect } from "react"
import { useGlobalEvent } from "@/hooks/useGlobalEvent"
import { createClient } from "@/lib/supabase/client"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"

function isValidBookmarkUrl(url?: string | null) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeBookmark(incoming: BookmarkRow, fallback?: BookmarkRow): BookmarkRow | null {
  const merged = fallback ? { ...fallback, ...incoming } : incoming
  if (!merged.id || !isValidBookmarkUrl(merged.url)) return null
  const url = merged.url.trim()
  return {
    ...merged,
    url,
    normalized_url: merged.normalized_url ?? url,
    title: merged.title?.trim() || url,
    created_at: merged.created_at ?? new Date().toISOString(),
  }
}

interface UseDashboardRealtimeOptions {
  userId: string
  sortBookmarks: (items: BookmarkRow[]) => BookmarkRow[]
  sortGroups: (items: GroupRow[]) => GroupRow[]
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkRow[]>>
  setGroups: React.Dispatch<React.SetStateAction<GroupRow[]>>
}

export function useDashboardRealtime({
  userId,
  sortBookmarks,
  sortGroups,
  setBookmarks,
  setGroups,
}: UseDashboardRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient()
    supabase.realtime.setAuth()

    const bookmarksChannel = supabase
      .channel(`user:${userId}:bookmarks`, { config: { private: true } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const nextRow = payload.new as BookmarkRow
            setBookmarks((prev) => {
              if (prev.some((b) => b.id === nextRow.id)) return prev
              const normalized = normalizeBookmark(nextRow)
              if (!normalized) return prev
              return sortBookmarks([normalized, ...prev])
            })
          } else if (payload.eventType === "UPDATE") {
            const nextRow = payload.new as BookmarkRow
            setBookmarks((prev) => {
              const existingIndex = prev.findIndex((b) => b.id === nextRow.id)
              if (existingIndex === -1) return prev
              const normalized = normalizeBookmark(nextRow, prev[existingIndex])
              if (!normalized) return prev
              const updated = [...prev]
              updated[existingIndex] = normalized
              return sortBookmarks(updated)
            })
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id: string }
            setBookmarks((prev) => prev.filter((item) => item.id !== oldRow.id))
          }
        },
      )
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const nextRow = payload.payload as BookmarkRow | undefined
        if (!nextRow) return
        setBookmarks((prev) => {
          if (prev.some((b) => b.id === nextRow.id)) return prev
          const normalized = normalizeBookmark(nextRow)
          if (!normalized) return prev
          return sortBookmarks([normalized, ...prev])
        })
      })
      .on("broadcast", { event: "UPDATE" }, (payload) => {
        const nextRow = payload.payload as BookmarkRow | undefined
        if (!nextRow) return
        setBookmarks((prev) => {
          const existingIndex = prev.findIndex((b) => b.id === nextRow.id)
          if (existingIndex === -1) return prev
          const normalized = normalizeBookmark(nextRow, prev[existingIndex])
          if (!normalized) return prev
          const updated = [...prev]
          updated[existingIndex] = normalized
          return sortBookmarks(updated)
        })
      })
      .on("broadcast", { event: "DELETE" }, (payload) => {
        const oldRow = payload.payload as { id: string } | undefined
        if (!oldRow) return
        setBookmarks((prev) => prev.filter((item) => item.id !== oldRow.id))
      })
      .subscribe()

    const groupsChannel = supabase
      .channel(`user:${userId}:groups`, { config: { private: true } })
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const nextRow = payload.payload as GroupRow | undefined
        if (!nextRow?.name?.trim()) return
        setGroups((prev) => {
          if (prev.some((g) => g.id === nextRow.id)) return prev
          return sortGroups([nextRow, ...prev])
        })
      })
      .on("broadcast", { event: "UPDATE" }, (payload) => {
        const nextRow = payload.payload as GroupRow | undefined
        if (!nextRow) return
        setGroups((prev) =>
          sortGroups(prev.map((item) => (item.id === nextRow.id ? nextRow : item))),
        )
      })
      .on("broadcast", { event: "DELETE" }, (payload) => {
        const oldRow = payload.payload as GroupRow | undefined
        if (!oldRow) return
        setGroups((prev) => prev.filter((item) => item.id !== oldRow.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bookmarksChannel)
      supabase.removeChannel(groupsChannel)
    }
  }, [setBookmarks, setGroups, sortBookmarks, sortGroups, userId])

  useGlobalEvent("message", (event) => {
    if (event?.data?.type !== "reway_broadcast_bookmark") return
    const bookmark = event.data.bookmark as BookmarkRow | undefined
    if (!bookmark?.id) return
    setBookmarks((prev) => {
      const cleanedPrev = prev.filter((item) => item?.id && isValidBookmarkUrl(item.url))
      const existingIndex = cleanedPrev.findIndex((item) => item.id === bookmark.id)
      if (existingIndex !== -1) {
        const normalized = normalizeBookmark(bookmark, cleanedPrev[existingIndex])
        if (!normalized) return cleanedPrev
        const updated = [...cleanedPrev]
        updated[existingIndex] = normalized
        return sortBookmarks(updated)
      }
      const normalized = normalizeBookmark(bookmark)
      if (!normalized) return cleanedPrev
      return sortBookmarks([normalized, ...cleanedPrev])
    })
  })
}
