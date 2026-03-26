"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries";
import { normalizeUrl } from "@/lib/metadata";
import type {
  EnrichmentResult,
  ImportEntry,
  ImportGroupSummary,
} from "./dashboard-types";
import { pickRandomGroupColor } from "./import/colors";
import { runWithConcurrency } from "./import/concurrency";
import { parseBookmarksHtml } from "./import/parse-bookmarks-html";
import { buildImportPreview } from "./import/build-import-preview";

interface UseImportHandlersOptions {
  bookmarks: BookmarkRow[];
  groups: GroupRow[];
  userId: string;
  normalizeGroupName: (value?: string | null) => string;
  isValidImportUrl: (url: string) => boolean;
  sortBookmarks: (items: BookmarkRow[]) => BookmarkRow[];
  sortGroups: (items: GroupRow[]) => GroupRow[];
  addBookmark: (formData: {
    url: string;
    id?: string;
    title?: string;
    group_id?: string;
    order_index?: number;
  }) => Promise<string | undefined>;
  createGroup: (formData: {
    name: string;
    icon: string;
    color?: string | null;
  }) => Promise<string>;
  enrichCreatedBookmark: (id: string, url: string) => Promise<unknown>;
  checkDuplicateBookmarks: (urls: string[]) => Promise<{
    duplicates: Record<string, { id: string; title: string; url: string }>;
  }>;
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkRow[]>>;
  setGroups: React.Dispatch<React.SetStateAction<GroupRow[]>>;
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
    groups: ImportGroupSummary[];
    entries: ImportEntry[];
  } | null>(null);
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
    status: "idle" as
      | "idle"
      | "importing"
      | "stopping"
      | "done"
      | "error"
      | "stopped",
  });

  const [importResult, setImportResult] = useState<{
    imported: number;
    cancelled: number;
    total: number;
    status: "done" | "stopped" | "error";
  } | null>(null);

  const stopRequestedRef = useRef(false);
  const processedRef = useRef(0);

  const parseBookmarkHtml = useCallback(
    (content: string) =>
      parseBookmarksHtml({ content, isValidImportUrl, normalizeGroupName }),
    [isValidImportUrl, normalizeGroupName],
  );

  const handleImportFileSelected = useCallback(
    async (file: File) => {
      const content = await file.text();
      const rawEntries = parseBookmarkHtml(content);
      if (rawEntries.length === 0) {
        toast.error("No bookmarks found in file");
        return;
      }

      const preview = await buildImportPreview({
        rawEntries,
        checkDuplicateBookmarks,
        normalizeGroupName,
        onDuplicateCheckError: (error) => {
          console.error("Failed to check for duplicates:", error);
        },
      });

      setImportPreview({
        groups: preview.groupSummaries,
        entries: preview.entries,
      });
    },
    [checkDuplicateBookmarks, normalizeGroupName, parseBookmarkHtml],
  );

  const handleConfirmImport = useCallback(
    async (selectedGroups: string[]) => {
      if (!importPreview) return;
      if (importProgress.status === "importing") return;

      stopRequestedRef.current = false;
      processedRef.current = 0;
      setImportResult(null);

      const allowed = new Set(
        selectedGroups.map((name) => normalizeGroupName(name)),
      );
      const entries = importPreview.entries
        .map((entry) => ({
          ...entry,
          groupName: normalizeGroupName(entry.groupName),
        }))
        .filter(
          (entry) => allowed.has(entry.groupName) && entry.action !== "skip",
        );
      if (entries.length === 0) {
        return;
      }

      setImportProgress({
        processed: 0,
        total: entries.length,
        status: "importing",
      });

      const existingGroups = new Map<string, GroupRow>();
      groups.forEach((group) => {
        const name = normalizeGroupName(group.name);
        if (name !== "Ungrouped") {
          existingGroups.set(name, group);
        }
      });

      const groupNamesToCreate = Array.from(
        new Set(
          entries
            .map((entry) => entry.groupName)
            .filter(
              (name) => name !== "Ungrouped" && !existingGroups.has(name),
            ),
        ),
      );

      const createdGroups = await Promise.all(
        groupNamesToCreate.map(async (name) => {
          const color = pickRandomGroupColor();
          const newGroupId = await createGroup({
            name,
            icon: "folder",
            color,
          });
          return {
            id: newGroupId,
            name,
            icon: "folder",
            color,
            user_id: userId,
            created_at: new Date().toISOString(),
            hide_from_all_bookmarks: false,
            order_index: null,
          } satisfies GroupRow;
        }),
      );

      const groupMap = new Map<string, GroupRow>([...existingGroups]);
      createdGroups.forEach((group) => groupMap.set(group.name, group));

      if (createdGroups.length > 0) {
        setGroups((prev) => sortGroups([...prev, ...createdGroups]));
      }

      const currentMinOrder = bookmarks.reduce<number>((min, bookmark) => {
        const orderValue = bookmark.order_index ?? Number.POSITIVE_INFINITY;
        return orderValue < min ? orderValue : min;
      }, Number.POSITIVE_INFINITY);
      const startingOrder =
        currentMinOrder === Number.POSITIVE_INFINITY ? 0 : currentMinOrder;

      const pendingEntries = entries.map((entry, index) => {
        const groupId =
          entry.groupName === "Ungrouped"
            ? null
            : (groupMap.get(entry.groupName)?.id ?? null);
        return {
          entry,
          groupId,
          optimisticId: crypto.randomUUID(),
          orderIndex: startingOrder - (entries.length - index),
          normalizedUrl: (() => {
            try {
              return normalizeUrl(entry.url);
            } catch {
              return entry.url;
            }
          })(),
        };
      });

      let importedCount = 0;
      let failedCount = 0;
      const enrichmentQueue: Array<{ id: string; url: string }> = [];

      const CREATE_CONCURRENCY = 3;
      const ENRICH_CONCURRENCY = 2;

      const handleCreate = async ({
        entry,
        groupId,
        optimisticId,
        orderIndex,
        normalizedUrl,
      }: (typeof pendingEntries)[number]) => {
        // Check stop BEFORE doing ANY work (including optimistic insert)
        if (stopRequestedRef.current) {
          return;
        }

        try {
          // Issue: without optimistic rows, the UI won't show import "batches" while work is running.
          // Fix: insert a lightweight optimistic bookmark row immediately, then update/replace it as we get a real id + enrichment.
          setBookmarks((prev) =>
            sortBookmarks([
              {
                id: optimisticId,
                url: entry.url,
                normalized_url: normalizedUrl,
                domain: null,
                title: entry.title || entry.url,
                description: null,
                favicon_url: null,
                og_image_url: null,
                image_url: null,
                screenshot_url: null,
                group_id: groupId,
                user_id: userId,
                created_at: new Date().toISOString(),
                order_index: orderIndex,
                status: "pending",
                is_enriching: true,
                last_fetched_at: null,
                error_reason: null,
              },
              ...prev,
            ]),
          );

          const bookmarkId = await addBookmark({
            url: entry.url,
            id: optimisticId,
            title: entry.title,
            group_id: groupId ?? undefined,
            order_index: orderIndex,
          });

          const stableId = bookmarkId ?? optimisticId;
          if (bookmarkId && bookmarkId !== optimisticId) {
            setBookmarks((prev) =>
              prev.map((item) =>
                item.id === optimisticId
                  ? {
                      ...item,
                      id: bookmarkId,
                      order_index: orderIndex,
                    }
                  : item,
              ),
            );
          }

          enrichmentQueue.push({ id: stableId, url: entry.url });
          importedCount += 1;
        } catch (error) {
          console.error("Import add failed:", error);
          failedCount += 1;
          setBookmarks((prev) =>
            prev.map((item) =>
              item.id === optimisticId
                ? {
                    ...item,
                    status: "failed",
                    is_enriching: false,
                    error_reason: "Import failed",
                  }
                : item,
            ),
          );
        } finally {
          processedRef.current += 1;
          setImportProgress((prev) => {
            if (prev.status !== "importing") return prev;
            return {
              ...prev,
              processed: Math.min(processedRef.current, entries.length),
            };
          });
        }
      };

      const enrichmentWorker = async ({
        id,
        url,
      }: {
        id: string;
        url: string;
      }) => {
        try {
          // Timeout wrapper to prevent infinite pending state
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Enrichment timeout")), 120000); // 2 minute timeout for slow network requests
          });

          const enrichmentPromise = enrichCreatedBookmark(id, url);

          const enrichment = (await Promise.race([
            enrichmentPromise,
            timeoutPromise,
          ])) as EnrichmentResult | undefined;

          if (enrichment?.status === "ready") {
            setBookmarks((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      title: enrichment.title ?? item.title,
                      description: enrichment.description ?? item.description,
                      favicon_url: enrichment.favicon_url ?? item.favicon_url,
                      og_image_url:
                        enrichment.og_image_url ?? item.og_image_url,
                      image_url: enrichment.image_url ?? item.image_url,
                      status: "ready",
                      is_enriching: false,
                      error_reason: null,
                      last_fetched_at:
                        enrichment.last_fetched_at ?? item.last_fetched_at,
                    }
                  : item,
              ),
            );
          } else if (enrichment?.status === "failed") {
            setBookmarks((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: "failed",
                      is_enriching: false,
                      error_reason:
                        enrichment.error_reason ?? "Enrichment failed",
                    }
                  : item,
              ),
            );
          }
        } catch (error) {
          // Handle timeout or any other error - mark as failed so it's not stuck pending
          console.error("Enrichment worker error for", url, error);
          setBookmarks((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "failed",
                    is_enriching: false,
                    error_reason:
                      error instanceof Error
                        ? error.message
                        : "Enrichment error",
                  }
                : item,
            ),
          );
        }
      };

      const startBackgroundEnrichment = () => {
        if (enrichmentQueue.length === 0) return;
        // Skip stop check for enrichment - always complete enrichment for created bookmarks
        void runWithConcurrency(
          [...enrichmentQueue],
          ENRICH_CONCURRENCY,
          enrichmentWorker,
          {
            shouldStop: () => stopRequestedRef.current,
            skipStopCheck: true,
          },
        );
      };

      await runWithConcurrency(
        pendingEntries,
        CREATE_CONCURRENCY,
        handleCreate,
        {
          shouldStop: () => stopRequestedRef.current,
        },
      );

      setImportProgress({
        processed: Math.min(processedRef.current, entries.length),
        total: entries.length,
        status: stopRequestedRef.current ? "stopped" : "done",
      });

      const cancelled = Math.max(
        0,
        entries.length - (importedCount + failedCount),
      );
      setImportResult({
        imported: importedCount,
        cancelled,
        total: entries.length,
        status: stopRequestedRef.current ? "stopped" : "done",
      });

      if (stopRequestedRef.current) {
        startBackgroundEnrichment();
        return;
      }

      startBackgroundEnrichment();
      toast.success(
        `Imported ${entries.length} bookmark${entries.length === 1 ? "" : "s"}`,
      );
      setImportPreview(null);
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
  );

  const handleClearImport = useCallback(() => {
    if (importProgress.status === "importing") {
      stopRequestedRef.current = true;
      setImportProgress((prev) => ({ ...prev, status: "stopping" }));
      toast.info("Stopping import…");
      return;
    }
    if (importProgress.status === "stopping") {
      return;
    }

    stopRequestedRef.current = false;
    setImportPreview(null);
    setImportProgress({ processed: 0, total: 0, status: "idle" });
    setImportResult(null);
  }, [importProgress.status]);

  const handleUpdateImportAction = useCallback(
    (action: "skip" | "override") => {
      setImportPreview((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          entries: prev.entries.map((entry) => ({
            ...entry,
            action: entry.isDuplicate ? action : "add",
          })),
        };
      });
    },
    [],
  );

  return {
    importPreview,
    importProgress,
    importResult,
    handleImportFileSelected,
    handleConfirmImport,
    handleClearImport,
    handleUpdateImportAction,
  };
}
