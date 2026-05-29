"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import type { BookmarkDetailRow, BookmarkRow } from "@/lib/supabase/queries"
import { isAllBookmarksGroupId, isMostVisitedGroupId, isNoGroupId } from "@/lib/system-groups"
import { getDomain } from "@/lib/utils"
import type { EnrichmentResult } from "./dashboard-types"

interface UseBookmarkActionsOptions {
  activeGroupId: string
  bookmarks: BookmarkRow[]
  initialBookmarks: BookmarkRow[]
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkRow[]>>
  sortBookmarks: (items: BookmarkRow[]) => BookmarkRow[]
  updateBookmarksOrder: (updates: { id: string; order_index: number }[]) => Promise<void>
  deleteBookmark: (id: string) => Promise<void>
  restoreBookmark: (bookmark: BookmarkRow) => Promise<void>
  updateBookmark: (
    id: string,
    formData: {
      title: string
      url: string
      description?: string
      group_id?: string | null
      favicon_url?: string | null
      apply_favicon_to_domain?: boolean
    },
  ) => Promise<void>
  getBookmarkDetails: (id: string) => Promise<BookmarkDetailRow>
  refreshBookmarkMetadata: (id: string) => Promise<EnrichmentResult>
  lastDeletedRef: React.MutableRefObject<{
    bookmark: BookmarkRow
    index: number
  } | null>
}

export function useBookmarkActions({
  activeGroupId,
  bookmarks,
  initialBookmarks,
  setBookmarks,
  sortBookmarks,
  updateBookmarksOrder,
  deleteBookmark,
  restoreBookmark,
  updateBookmark,
  getBookmarkDetails,
  refreshBookmarkMetadata,
  lastDeletedRef,
}: UseBookmarkActionsOptions) {
  const getActiveTargetGroupId = useCallback(() => {
    if (
      isAllBookmarksGroupId(activeGroupId) ||
      isMostVisitedGroupId(activeGroupId) ||
      isNoGroupId(activeGroupId)
    ) {
      return null
    }

    return activeGroupId
  }, [activeGroupId])

  const addOptimisticBookmark = useCallback(
    (bookmark: BookmarkRow) => {
      setBookmarks((prev) => {
        const minOrder = prev.reduce((min, item) => {
          const order = item.order_index ?? Number.POSITIVE_INFINITY
          return order < min ? order : min
        }, Number.POSITIVE_INFINITY)
        const nextOrder = minOrder === Number.POSITIVE_INFINITY ? 0 : minOrder - 1
        const newBookmark = {
          ...bookmark,
          created_at: bookmark.created_at ?? new Date().toISOString(),
          order_index: bookmark.order_index ?? nextOrder,
          group_id: getActiveTargetGroupId() ?? bookmark.group_id ?? null,
        }

        const existingIndex = prev.findIndex((item) => item.id === newBookmark.id)
        if (existingIndex >= 0) {
          const next = [...prev]
          next[existingIndex] = { ...next[existingIndex], ...newBookmark }
          return sortBookmarks(next)
        }

        return sortBookmarks([newBookmark, ...prev])
      })
    },
    [getActiveTargetGroupId, setBookmarks, sortBookmarks],
  )

  const applyEnrichment = useCallback(
    (id: string, enrichment?: EnrichmentResult) => {
      setBookmarks((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item
          if (!enrichment) {
            return {
              ...item,
              is_enriching: false,
            }
          }
          if (enrichment.status === "failed") {
            return {
              ...item,
              status: "failed",
              is_enriching: false,
              error_reason: enrichment.error_reason ?? "Enrichment failed",
              last_fetched_at: enrichment.last_fetched_at ?? item.last_fetched_at,
            }
          }
          return {
            ...item,
            title: enrichment.title ?? item.title,
            description: enrichment.description ?? item.description,
            favicon_url: enrichment.favicon_url ?? item.favicon_url,
            og_image_url: enrichment.og_image_url ?? item.og_image_url,
            image_url: enrichment.image_url ?? item.image_url,
            status: "ready",
            is_enriching: false,
            error_reason: null,
            last_fetched_at: enrichment.last_fetched_at ?? item.last_fetched_at,
          }
        }),
      )
    },
    [setBookmarks],
  )

  const replaceBookmarkId = useCallback(
    (stableId: string, actualId: string) => {
      if (!actualId || stableId === actualId) return
      setBookmarks((prev) =>
        prev.map((item) => (item.id === stableId ? { ...item, id: actualId } : item)),
      )
    },
    [setBookmarks],
  )

  const markBookmarksRefreshing = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      const idSet = new Set(ids)
      setBookmarks((prev) =>
        prev.map((item) =>
          idSet.has(item.id)
            ? {
                ...item,
                is_enriching: true,
                error_reason: null,
              }
            : item,
        ),
      )
    },
    [setBookmarks],
  )

  const clearBookmarksRefreshing = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      const idSet = new Set(ids)
      setBookmarks((prev) =>
        prev.map((item) =>
          idSet.has(item.id)
            ? {
                ...item,
                is_enriching: false,
              }
            : item,
        ),
      )
    },
    [setBookmarks],
  )

  const handleLoadBookmarkDetails = useCallback(
    async (id: string) => {
      const current = bookmarks.find((item) => item.id === id)
      if (!current) return null

      const details = await getBookmarkDetails(id)
      const merged = { ...current, ...details }

      setBookmarks((prev) => prev.map((item) => (item.id === id ? { ...item, ...details } : item)))

      return merged
    },
    [bookmarks, getBookmarkDetails, setBookmarks],
  )

  const handleRefreshBookmarks = useCallback(
    async (ids: string[]) => {
      const refreshableIds = Array.from(new Set(ids)).filter((id) => {
        const bookmark = bookmarks.find((item) => item.id === id) ?? null
        return Boolean(id && bookmark)
      })

      const activeIds = refreshableIds.filter((id) => {
        const bookmark = bookmarks.find((item) => item.id === id)
        return Boolean(bookmark && !bookmark.is_enriching)
      })

      if (activeIds.length === 0) {
        return { requested: 0, succeeded: 0, failed: 0 }
      }

      markBookmarksRefreshing(activeIds)

      let succeeded = 0
      let failed = 0

      const results = await Promise.allSettled(
        activeIds.map(async (id) => {
          const enrichment = await refreshBookmarkMetadata(id)
          applyEnrichment(id, enrichment)
          if (enrichment.status === "ready") {
            succeeded += 1
          } else {
            failed += 1
          }
        }),
      )

      const transportFailures = results.flatMap((result, index) => {
        if (result.status === "fulfilled") return []
        return [activeIds[index]]
      })

      if (transportFailures.length > 0) {
        failed += transportFailures.length
        clearBookmarksRefreshing(transportFailures)
      }

      return {
        requested: activeIds.length,
        succeeded,
        failed,
      }
    },
    [
      applyEnrichment,
      bookmarks,
      clearBookmarksRefreshing,
      markBookmarksRefreshing,
      refreshBookmarkMetadata,
    ],
  )

  const handleRefreshBookmark = useCallback(
    async (id: string) => {
      const bookmark = bookmarks.find((item) => item.id === id)
      if (!bookmark || bookmark.is_enriching) return

      const result = await handleRefreshBookmarks([id])
      if (result.failed > 0) {
        toast.error("Failed to refresh bookmark")
      }
    },
    [bookmarks, handleRefreshBookmarks],
  )

  const handleFolderReorder = useCallback(
    async (groupId: string, newOrder: BookmarkRow[]) => {
      setBookmarks((prev) => {
        const groupIds = new Set(newOrder.map((b) => b.id))
        const other = prev.filter((b) => !groupIds.has(b.id))
        const updatedGroup = newOrder.map((bookmark, index) => ({
          ...bookmark,
          order_index: index,
        }))
        return sortBookmarks([...updatedGroup, ...other])
      })

      const updates = newOrder.map((bookmark, index) => ({
        id: bookmark.id,
        order_index: index,
      }))

      try {
        await updateBookmarksOrder(updates)
      } catch (error) {
        console.error("Reorder failed:", error)
        toast.error("Failed to reorder bookmarks")
        setBookmarks(initialBookmarks)
      }

      void groupId
    },
    [initialBookmarks, setBookmarks, sortBookmarks, updateBookmarksOrder],
  )

  const handleDeleteBookmark = useCallback(
    async (id: string) => {
      let deletedBookmark: BookmarkRow | undefined
      let deletedIndex = -1

      setBookmarks((prev) => {
        deletedIndex = prev.findIndex((b) => b.id === id)
        deletedBookmark = prev[deletedIndex]
        if (deletedBookmark) {
          lastDeletedRef.current = {
            bookmark: deletedBookmark,
            index: deletedIndex,
          }
        }
        return prev.filter((b) => b.id !== id)
      })

      if (deletedBookmark) {
        toast.error("Bookmark deleted", {
          action: {
            label: "Undo",
            onClick: async () => {
              const lastDeleted = lastDeletedRef.current
              if (!lastDeleted) return
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === lastDeleted.bookmark.id)) {
                  return prev
                }
                const next = [...prev]
                next.splice(Math.min(lastDeleted.index, next.length), 0, lastDeleted.bookmark)
                return next
              })
              try {
                await restoreBookmark(lastDeleted.bookmark)
              } catch (error) {
                console.error("Restore failed:", error)
                toast.error("Failed to restore bookmark")
              }
            },
          },
        })
      }

      try {
        await deleteBookmark(id)
      } catch (error) {
        console.error("Delete failed:", error)
        setBookmarks((prev) => {
          const deletedFromInitial = initialBookmarks.find((b) => b.id === id)
          return deletedFromInitial ? [...prev, deletedFromInitial] : prev
        })
        toast.error("Failed to delete bookmark")
      }
    },
    [deleteBookmark, initialBookmarks, lastDeletedRef, restoreBookmark, setBookmarks],
  )

  const handleReorder = useCallback(
    async (groupId: string, newOrder: BookmarkRow[]) => {
      setBookmarks((prev) => {
        const groupIds = new Set(newOrder.map((b) => b.id))
        const other = prev.filter((b) => !groupIds.has(b.id))
        const updatedGroup = newOrder.map((bookmark, index) => ({
          ...bookmark,
          order_index: index,
        }))
        return sortBookmarks([...updatedGroup, ...other])
      })

      const updates = newOrder.map((bookmark, index) => ({
        id: bookmark.id,
        order_index: index,
      }))

      try {
        await updateBookmarksOrder(updates)
      } catch (error) {
        console.error("Reorder failed:", error)
        toast.error("Failed to reorder bookmarks")
        setBookmarks(initialBookmarks)
      }

      void groupId
    },
    [initialBookmarks, setBookmarks, sortBookmarks, updateBookmarksOrder],
  )

  const handleEditBookmark = useCallback(
    async (
      id: string,
      data: {
        title: string
        url: string
        description?: string
        favicon_url?: string
        group_id?: string
        applyFaviconToDomain?: boolean
      },
    ) => {
      const targetDomain = getDomain(data.url)

      let snapshotBeforeUpdate: BookmarkRow[] | null = null
      setBookmarks((prev) => {
        snapshotBeforeUpdate = prev
        return prev.map((b) => {
          const isEditedBookmark = b.id === id
          const isSameDomainMatch =
            !!data.applyFaviconToDomain &&
            data.favicon_url !== undefined &&
            getDomain(b.url) === targetDomain

          if (isEditedBookmark) {
            return {
              ...b,
              title: data.title,
              url: data.url,
              description: data.description ?? null,
              favicon_url: data.favicon_url ?? null,
              group_id: data.group_id ?? null,
            }
          }

          if (isSameDomainMatch) {
            return {
              ...b,
              favicon_url: data.favicon_url ?? null,
            }
          }

          return b
        })
      })

      try {
        await updateBookmark(id, {
          title: data.title,
          url: data.url,
          description: data.description,
          group_id: data.group_id || null,
          favicon_url: data.favicon_url ?? null,
          apply_favicon_to_domain: !!data.applyFaviconToDomain,
        })
      } catch (error) {
        console.error("Update bookmark failed:", error)
        toast.error("Failed to update bookmark")
        if (snapshotBeforeUpdate) {
          setBookmarks(snapshotBeforeUpdate)
          return
        }

        setBookmarks((prev) =>
          prev.map((b) => {
            if (b.id === id) {
              const originalBookmark = initialBookmarks.find((ob) => ob.id === id)
              return originalBookmark || b
            }
            return b
          }),
        )
      }
    },
    [initialBookmarks, setBookmarks, updateBookmark],
  )

  return {
    addOptimisticBookmark,
    applyEnrichment,
    replaceBookmarkId,
    handleRefreshBookmark,
    handleRefreshBookmarks,
    handleLoadBookmarkDetails,
    handleFolderReorder,
    handleDeleteBookmark,
    handleReorder,
    handleEditBookmark,
  }
}
