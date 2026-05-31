"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { compareRankedItems, generateRankBetween, generateRanksBetween } from "@/lib/ranking"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import {
  buildBookmarkEnrichmentFailure,
  enrichBookmarkWithTimeout,
  isBookmarkEnrichmentTimeoutError,
} from "./bookmark-enrichment"
import type { EnrichmentResult, ImportEntry, ImportGroupSummary } from "./dashboard-types"
import { buildImportPreview } from "./import/build-import-preview"
import { pickRandomGroupColor } from "./import/colors"
import { runWithConcurrency } from "./import/concurrency"
import { parseBookmarksHtml } from "./import/parse-bookmarks-html"

interface UseImportHandlersOptions {
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
  userId: string
  normalizeGroupName: (value?: string | null) => string
  isValidImportUrl: (url: string) => boolean
  sortBookmarks: (items: BookmarkRow[]) => BookmarkRow[]
  sortGroups: (items: GroupRow[]) => GroupRow[]
  addBookmark: (formData: {
    url: string
    id?: string
    title?: string
    group_id?: string
    order_index?: number
    rank?: string
  }) => Promise<BookmarkRow | null>
  createGroup: (formData: {
    name: string
    icon: string
    color?: string | null
    rank?: string | null
  }) => Promise<string>
  enrichCreatedBookmark: (id: string, url: string) => Promise<unknown>
  checkDuplicateBookmarks: (urls: string[]) => Promise<{
    duplicates: Record<string, { id: string; title: string; url: string }>
  }>
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkRow[]>>
  setGroups: React.Dispatch<React.SetStateAction<GroupRow[]>>
}

function getSelectedImportEntries(
  entries: ImportEntry[],
  selectedGroups: string[],
  normalizeGroupName: (value?: string | null) => string,
) {
  const allowed = new Set(selectedGroups.map((name) => normalizeGroupName(name)))

  return entries.flatMap((entry) => {
    const groupName = normalizeGroupName(entry.groupName)
    if (!allowed.has(groupName) || entry.action === "skip") return []
    return [{ ...entry, groupName }]
  })
}

function buildExistingGroupMap(
  groups: GroupRow[],
  normalizeGroupName: (value?: string | null) => string,
) {
  const existingGroups = new Map<string, GroupRow>()

  groups.forEach((group) => {
    const name = normalizeGroupName(group.name)
    if (name !== "Ungrouped") {
      existingGroups.set(name, group)
    }
  })

  return existingGroups
}

async function createMissingImportGroups({
  entries,
  groups,
  existingGroups,
  createGroup,
  userId,
}: {
  entries: Array<ImportEntry & { groupName: string }>
  groups: GroupRow[]
  existingGroups: Map<string, GroupRow>
  createGroup: UseImportHandlersOptions["createGroup"]
  userId: string
}) {
  const groupNamesToCreate = Array.from(
    new Set(
      entries.flatMap((entry) =>
        entry.groupName !== "Ungrouped" && !existingGroups.has(entry.groupName)
          ? [entry.groupName]
          : [],
      ),
    ),
  )

  const groupRanks = generateRanksBetween(groups.at(-1)?.rank ?? null, null, groupNamesToCreate.length)

  return Promise.all(
    groupNamesToCreate.map(async (name, index) => {
      const color = pickRandomGroupColor()
      const rank = groupRanks[index] ?? generateRankBetween(groups.at(-1)?.rank ?? null, null)
      const newGroupId = await createGroup({
        name,
        icon: "folder",
        color,
        rank,
      })

      return {
        id: newGroupId,
        name,
        icon: "folder",
        color,
        user_id: userId,
        created_at: new Date().toISOString(),
        hide_from_all_bookmarks: false,
        order_index: null,
        rank,
      } satisfies GroupRow
    }),
  )
}

function getImportStartingOrder(bookmarks: BookmarkRow[]) {
  const currentMinOrder = bookmarks.reduce<number>((min, bookmark) => {
    const orderValue = bookmark.order_index ?? Number.POSITIVE_INFINITY
    return orderValue < min ? orderValue : min
  }, Number.POSITIVE_INFINITY)

  return currentMinOrder === Number.POSITIVE_INFINITY ? 0 : currentMinOrder
}

function buildPendingImportEntries(
  entries: Array<ImportEntry & { groupName: string }>,
  groupMap: Map<string, GroupRow>,
  bookmarks: BookmarkRow[],
) {
  const startingOrder = getImportStartingOrder(bookmarks)
  const entriesByGroup = new Map<string, number>()

  entries.forEach((entry) => {
    const groupId = entry.groupName === "Ungrouped" ? null : (groupMap.get(entry.groupName)?.id ?? null)
    const key = groupId ?? "__ungrouped__"
    entriesByGroup.set(key, (entriesByGroup.get(key) ?? 0) + 1)
  })

  const ranksByGroup = new Map<string, string[]>()
  entriesByGroup.forEach((count, key) => {
    const groupId = key === "__ungrouped__" ? null : key
    const firstRank = bookmarks
      .filter((bookmark) => (bookmark.group_id ?? null) === groupId)
      .toSorted(compareRankedItems)[0]?.rank
    ranksByGroup.set(key, generateRanksBetween(null, firstRank ?? null, count))
  })

  const rankOffsetsByGroup = new Map<string, number>()

  return entries.map((entry, index) => {
    const groupId = entry.groupName === "Ungrouped" ? null : (groupMap.get(entry.groupName)?.id ?? null)
    const key = groupId ?? "__ungrouped__"
    const offset = rankOffsetsByGroup.get(key) ?? 0
    rankOffsetsByGroup.set(key, offset + 1)

    return {
      entry,
      groupId,
      orderIndex: startingOrder - (entries.length - index),
      rank: ranksByGroup.get(key)?.[offset] ?? generateRankBetween(null, null),
    }
  })
}

function createImportEnrichmentWorker({
  setBookmarks,
  enrichCreatedBookmark,
}: {
  setBookmarks: UseImportHandlersOptions["setBookmarks"]
  enrichCreatedBookmark: UseImportHandlersOptions["enrichCreatedBookmark"]
}) {
  return async ({ id, url }: { id: string; url: string }) => {
    try {
      const enrichment = await enrichBookmarkWithTimeout({
        bookmarkId: id,
        url,
        timeoutMs: 120000,
        enrichCreatedBookmark: enrichCreatedBookmark as (
          id: string,
          url: string,
        ) => Promise<EnrichmentResult | undefined>,
      })

      if (enrichment?.status === "ready") {
        setBookmarks((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
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
              : item,
          ),
        )
        return
      }

      if (enrichment?.status === "failed") {
        setBookmarks((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "failed",
                  is_enriching: false,
                  error_reason: enrichment.error_reason ?? "Enrichment failed",
                }
              : item,
          ),
        )
        return
      }

      setBookmarks((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_enriching: false,
              }
            : item,
        ),
      )
    } catch (error) {
      console.error("Enrichment worker error for", url, error)
      if (isBookmarkEnrichmentTimeoutError(error)) {
        setBookmarks((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  is_enriching: false,
                }
              : item,
          ),
        )
        return
      }

      const failure = buildBookmarkEnrichmentFailure(error)
      setBookmarks((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: failure.status,
                is_enriching: false,
                error_reason: failure.error_reason ?? "Enrichment error",
                last_fetched_at: failure.last_fetched_at ?? item.last_fetched_at,
              }
            : item,
        ),
      )
    }
  }
}

export function useImportHandlers({
  bookmarks,
  groups,
  userId,
  normalizeGroupName,
  isValidImportUrl,
  sortBookmarks,
  sortGroups,
  addBookmark,
  createGroup,
  enrichCreatedBookmark,
  checkDuplicateBookmarks,
  setBookmarks,
  setGroups,
}: UseImportHandlersOptions) {
  const [importPreview, setImportPreview] = useState<{
    groups: ImportGroupSummary[]
    entries: ImportEntry[]
  } | null>(null)
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
    status: "idle" as "idle" | "importing" | "stopping" | "done" | "error" | "stopped",
  })

  const [importResult, setImportResult] = useState<{
    imported: number
    cancelled: number
    total: number
    status: "done" | "stopped" | "error"
  } | null>(null)

  const stopRequestedRef = useRef(false)
  const processedRef = useRef(0)

  const parseBookmarkHtml = useCallback(
    (content: string) => parseBookmarksHtml({ content, isValidImportUrl, normalizeGroupName }),
    [isValidImportUrl, normalizeGroupName],
  )

  const handleImportFileSelected = useCallback(
    async (file: File) => {
      const content = await file.text()
      const rawEntries = parseBookmarkHtml(content)
      if (rawEntries.length === 0) {
        toast.error("No bookmarks found in file")
        return
      }

      const preview = await buildImportPreview({
        rawEntries,
        checkDuplicateBookmarks,
        normalizeGroupName,
        onDuplicateCheckError: (error) => {
          console.error("Failed to check for duplicates:", error)
        },
      })

      setImportPreview({
        groups: preview.groupSummaries,
        entries: preview.entries,
      })
    },
    [checkDuplicateBookmarks, normalizeGroupName, parseBookmarkHtml],
  )

  const handleConfirmImport = useCallback(
    async (selectedGroups: string[]) => {
      if (!importPreview) return
      if (importProgress.status === "importing") return

      stopRequestedRef.current = false
      processedRef.current = 0
      setImportResult(null)

      const entries = getSelectedImportEntries(
        importPreview.entries,
        selectedGroups,
        normalizeGroupName,
      )
      if (entries.length === 0) {
        return
      }

      setImportProgress({
        processed: 0,
        total: entries.length,
        status: "importing",
      })

      const existingGroups = buildExistingGroupMap(groups, normalizeGroupName)
      const createdGroups = await createMissingImportGroups({
        entries,
        groups,
        existingGroups,
        createGroup,
        userId,
      })

      const groupMap = new Map<string, GroupRow>([...existingGroups])
      createdGroups.forEach((group) => groupMap.set(group.name, group))

      if (createdGroups.length > 0) {
        setGroups((prev) => sortGroups([...prev, ...createdGroups]))
      }

      const pendingEntries = buildPendingImportEntries(entries, groupMap, bookmarks)

      let importedCount = 0
      let failedCount = 0
      const enrichmentQueue: Array<{ id: string; url: string }> = []

      const CREATE_CONCURRENCY = 3
      const ENRICH_CONCURRENCY = 2

      const handleCreate = async ({
        entry,
        groupId,
        orderIndex,
        rank,
      }: (typeof pendingEntries)[number]) => {
        // Check stop BEFORE doing ANY work (including optimistic insert)
        if (stopRequestedRef.current) {
          return
        }

        try {
          const createdBookmark = await addBookmark({
            url: entry.url,
            title: entry.title,
            group_id: groupId ?? undefined,
            order_index: orderIndex,
            rank,
          })

          if (!createdBookmark) {
            throw new Error("Failed to create bookmark")
          }

          const stableId = createdBookmark.id
          setBookmarks((prev) =>
            sortBookmarks(
              [
                { ...createdBookmark, is_enriching: true },
                ...prev.filter((item) => item.id !== stableId),
              ],
            ),
          )

          enrichmentQueue.push({ id: stableId, url: entry.url })
          importedCount += 1
        } catch (error) {
          console.error("Import add failed:", error)
          failedCount += 1
        } finally {
          processedRef.current += 1
          setImportProgress((prev) => {
            if (prev.status !== "importing") return prev
            return {
              ...prev,
              processed: Math.min(processedRef.current, entries.length),
            }
          })
        }
      }

      const enrichmentWorker = createImportEnrichmentWorker({
        setBookmarks,
        enrichCreatedBookmark,
      })

      const startBackgroundEnrichment = () => {
        if (enrichmentQueue.length === 0) return
        // Skip stop check for enrichment - always complete enrichment for created bookmarks
        void runWithConcurrency([...enrichmentQueue], ENRICH_CONCURRENCY, enrichmentWorker, {
          shouldStop: () => stopRequestedRef.current,
          skipStopCheck: true,
        })
      }

      await runWithConcurrency(pendingEntries, CREATE_CONCURRENCY, handleCreate, {
        shouldStop: () => stopRequestedRef.current,
      })

      setImportProgress({
        processed: Math.min(processedRef.current, entries.length),
        total: entries.length,
        status: stopRequestedRef.current ? "stopped" : "done",
      })

      const cancelled = Math.max(0, entries.length - (importedCount + failedCount))
      setImportResult({
        imported: importedCount,
        cancelled,
        total: entries.length,
        status: stopRequestedRef.current ? "stopped" : "done",
      })

      if (stopRequestedRef.current) {
        startBackgroundEnrichment()
        return
      }

      startBackgroundEnrichment()
      toast.success(`Imported ${entries.length} bookmark${entries.length === 1 ? "" : "s"}`)
      setImportPreview(null)
    },
    [
      addBookmark,
      bookmarks,
      createGroup,
      enrichCreatedBookmark,
      groups,
      importPreview,
      importProgress.status,
      normalizeGroupName,
      sortBookmarks,
      sortGroups,
      userId,
      setBookmarks,
      setGroups,
    ],
  )

  const handleClearImport = useCallback(() => {
    if (importProgress.status === "importing") {
      stopRequestedRef.current = true
      setImportProgress((prev) => ({ ...prev, status: "stopping" }))
      toast.info("Stopping import…")
      return
    }
    if (importProgress.status === "stopping") {
      return
    }

    stopRequestedRef.current = false
    setImportPreview(null)
    setImportProgress({ processed: 0, total: 0, status: "idle" })
    setImportResult(null)
  }, [importProgress.status])

  const handleUpdateImportAction = useCallback((action: "skip" | "override") => {
    setImportPreview((prev) => {
      if (!prev) return null
      return {
        ...prev,
        entries: prev.entries.map((entry) => ({
          ...entry,
          action: entry.isDuplicate ? action : "add",
        })),
      }
    })
  }, [])

  return {
    importPreview,
    importProgress,
    importResult,
    handleImportFileSelected,
    handleConfirmImport,
    handleClearImport,
    handleUpdateImportAction,
  }
}
