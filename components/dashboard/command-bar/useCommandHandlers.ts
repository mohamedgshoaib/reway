"use client"

import { useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import {
  addBookmark,
  enrichCreatedBookmark,
} from "@/app/dashboard/actions/bookmarks"
import { useGlobalKeydown } from "@/hooks/useGlobalKeydown"
import { isTypingTarget } from "@/lib/keyboard"
import type { BookmarkRow } from "@/lib/supabase/queries"
import { isAllBookmarksGroupId, isMostVisitedGroupId, isNoGroupId } from "@/lib/system-groups"
import {
  buildBookmarkEnrichmentFailure,
  enrichBookmarkWithTimeout,
  isBookmarkEnrichmentTimeoutError,
} from "../content/bookmark-enrichment"
import type { EnrichmentResult } from "../content/dashboard-types"
import { extractUrlsFromText, isUrl } from "./helpers"

interface UseCommandHandlersOptions {
  onAddBookmark: (bookmark: BookmarkRow) => void
  onApplyEnrichment?: (id: string, enrichment?: EnrichmentResult) => void
  onReplaceBookmarkId?: (stableId: string, actualId: string) => void
  onModeChange?: (mode: "add" | "search") => void
  onSearchChange?: (query: string) => void
  activeGroupId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onAddStatusChange?: (status: string | null) => void
  onAddBusyChange?: (busy: boolean) => void
}

export function useCommandHandlers({
  onAddBookmark,
  onApplyEnrichment,
  onReplaceBookmarkId,
  onModeChange,
  onSearchChange,
  activeGroupId,
  inputRef,
  onAddStatusChange,
  onAddBusyChange,
}: UseCommandHandlersOptions) {
  const isSubmittingRef = useRef(false)
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

  const setAddStatus = useCallback(
    (status: string | null, busy?: boolean) => {
      onAddStatusChange?.(status)
      if (typeof busy === "boolean") {
        onAddBusyChange?.(busy)
      }
    },
    [onAddBusyChange, onAddStatusChange],
  )

  const processUrls = useCallback(
    async (urls: string[]) => {
      const executeAdd = async (url: string) => {
        const stableId = crypto.randomUUID()
        let createdId: string | null = null
        const targetGroupId = getActiveTargetGroupId()

        onAddBookmark({
          id: stableId,
          url,
          normalized_url: url,
          domain: null,
          title: url,
          description: null,
          favicon_url: null,
          og_image_url: null,
          image_url: null,
          screenshot_url: null,
          group_id: targetGroupId,
          user_id: "",
          created_at: new Date().toISOString(),
          order_index: Number.MIN_SAFE_INTEGER,
          rank: null,
          status: "pending",
          is_enriching: true,
          last_fetched_at: null,
          last_visited_at: null,
          visit_count: 0,
          error_reason: null,
        })

        try {
          const createdBookmark = await addBookmark({
            url,
            group_id: targetGroupId ?? undefined,
          })
          createdId = createdBookmark?.id ?? null
          if (createdBookmark) {
            onReplaceBookmarkId?.(stableId, createdBookmark.id)
            onAddBookmark({ ...createdBookmark, is_enriching: true })
          }
          if (!createdBookmark) {
            throw new Error("Failed to create bookmark")
          }

          const enrichment = await enrichBookmarkWithTimeout({
            bookmarkId: createdBookmark.id,
            url,
            timeoutMs: 30000,
            enrichCreatedBookmark,
          })
          onApplyEnrichment?.(createdBookmark.id, enrichment)
        } catch (error) {
          console.error("Failed to add bookmark:", error)
          if (isBookmarkEnrichmentTimeoutError(error)) {
            if (createdId) {
              onApplyEnrichment?.(createdId)
            }
            return
          }
          toast.error(`Failed to add ${url}`)
          if (createdId) {
            onApplyEnrichment?.(createdId, buildBookmarkEnrichmentFailure(error))
          }
        }
      }

      if (urls.length === 1) {
        const u = urls[0]
        const fullUrl = u.startsWith("http") ? u : `https://${u}`
        const stableId = crypto.randomUUID()
        let createdId: string | null = null
        const targetGroupId = getActiveTargetGroupId()

        onAddBookmark({
          id: stableId,
          url: fullUrl,
          normalized_url: fullUrl,
          domain: null,
          title: fullUrl,
          description: null,
          favicon_url: null,
          og_image_url: null,
          image_url: null,
          screenshot_url: null,
          group_id: targetGroupId,
          user_id: "",
          created_at: new Date().toISOString(),
          order_index: Number.MIN_SAFE_INTEGER,
          rank: null,
          status: "pending",
          is_enriching: true,
          last_fetched_at: null,
          last_visited_at: null,
          visit_count: 0,
          error_reason: null,
        })

        try {
          const createdBookmark = await addBookmark({
            url: fullUrl,
            group_id: targetGroupId ?? undefined,
          })
          createdId = createdBookmark?.id ?? null
          if (createdBookmark) {
            onReplaceBookmarkId?.(stableId, createdBookmark.id)
            onAddBookmark({ ...createdBookmark, is_enriching: true })
          }
          if (!createdBookmark) {
            throw new Error("Failed to create bookmark")
          }

          const enrichment = await enrichBookmarkWithTimeout({
            bookmarkId: createdBookmark.id,
            url: fullUrl,
            timeoutMs: 30000,
            enrichCreatedBookmark,
          })
          onApplyEnrichment?.(createdBookmark.id, enrichment)
        } catch (error) {
          console.error("Failed to add bookmark:", error)
          if (isBookmarkEnrichmentTimeoutError(error)) {
            if (createdId) {
              onApplyEnrichment?.(createdId)
            }
            return
          }
          toast.error(`Failed to add ${fullUrl}`)
          if (createdId) {
            onApplyEnrichment?.(createdId, buildBookmarkEnrichmentFailure(error))
          }
        }
        return
      }

      const fullUrls = urls.map((u) => (u.startsWith("http") ? u : `https://${u}`))
      for (const url of fullUrls) {
        await executeAdd(url)
      }
    },
    [
      getActiveTargetGroupId,
      onAddBookmark,
      onApplyEnrichment,
      onReplaceBookmarkId,
    ],
  )

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            toast.error("Pasting images is not supported. Paste text only.")
            return
          }
        }
      }
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target
      if (isTypingTarget(target) && target !== inputRef.current) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault()
        onModeChange?.("search")
        inputRef.current?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onModeChange?.("add")
        inputRef.current?.focus()
      }
      if (e.key === "Escape") {
        inputRef.current?.blur()
      }
    },
    [inputRef, onModeChange],
  )

  // react-doctor-disable-next-line react-doctor/advanced-event-handler-refs
  useEffect(() => {
    window.addEventListener("paste", handlePaste)
    return () => {
      window.removeEventListener("paste", handlePaste)
    }
  }, [handlePaste])

  useGlobalKeydown(handleKeyDown)

  const handleSubmit = useCallback(
    async (
      e: React.FormEvent,
      mode: "add" | "search",
      inputValue: string,
      searchQuery: string,
      setInputValue: (value: string) => void,
    ) => {
      e.preventDefault()

      if (isSubmittingRef.current) return
      const value = mode === "search" ? searchQuery.trim() : inputValue.trim()
      if (!value) return

      if (mode === "search") {
        onSearchChange?.(value)
        inputRef.current?.blur()
        return
      }

      setInputValue("")
      inputRef.current?.blur()

      isSubmittingRef.current = true

      if (isUrl(value) && !value.includes(" ")) {
        setAddStatus("Adding link", true)
        try {
          await processUrls([value])
        } finally {
          setAddStatus(null, false)
          isSubmittingRef.current = false
        }
      } else {
        setAddStatus("Extracting links from text", true)
        try {
          const urls = extractUrlsFromText(value)
          if (urls.length > 0) {
            setAddStatus("Adding links from text", true)
            await processUrls(urls)
          } else {
            toast.error("No links found")
          }
        } finally {
          setAddStatus(null, false)
          isSubmittingRef.current = false
        }
      }
    },
    [inputRef, onSearchChange, processUrls, setAddStatus],
  )

  return {
    handleSubmit,
  }
}
