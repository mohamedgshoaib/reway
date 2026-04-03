"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { BookmarkRow } from "@/lib/supabase/queries";
import type { EnrichmentResult } from "../content/dashboard-types";
import {
  addBookmark,
  enrichCreatedBookmark,
} from "@/app/dashboard/actions/bookmarks";
import { extractUrlsFromText, isUrl } from "./helpers";
import { useGlobalKeydown } from "@/hooks/useGlobalKeydown";
import { isTypingTarget } from "@/lib/keyboard";
import {
  isAllBookmarksGroupId,
  isMostVisitedGroupId,
  isNoGroupId,
} from "@/lib/system-groups";

interface UseCommandHandlersOptions {
  onAddBookmark: (bookmark: BookmarkRow) => void;
  onApplyEnrichment?: (id: string, enrichment?: EnrichmentResult) => void;
  onReplaceBookmarkId?: (stableId: string, actualId: string) => void;
  onModeChange?: (mode: "add" | "search") => void;
  onSearchChange?: (query: string) => void;
  activeGroupId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onAddStatusChange?: (status: string | null) => void;
  onAddBusyChange?: (busy: boolean) => void;
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
  const isSubmittingRef = useRef(false);
  const getActiveTargetGroupId = useCallback(() => {
    if (
      isAllBookmarksGroupId(activeGroupId) ||
      isMostVisitedGroupId(activeGroupId) ||
      isNoGroupId(activeGroupId)
    ) {
      return null;
    }

    return activeGroupId;
  }, [activeGroupId]);

  const setAddStatus = useCallback(
    (status: string | null, busy?: boolean) => {
      onAddStatusChange?.(status);
      if (typeof busy === "boolean") {
        onAddBusyChange?.(busy);
      }
    },
    [onAddBusyChange, onAddStatusChange],
  );

  const processUrls = useCallback(
    async (urls: string[]) => {
      const executeAdd = async (url: string) => {
        const stableId = crypto.randomUUID();
        let createdId: string | null = null;
        const targetGroupId = getActiveTargetGroupId();
        const optimistic = {
          id: stableId,
          url,
          title: url,
          favicon_url: null,
          description: null,
          group_id: targetGroupId,
          user_id: "",
          created_at: new Date().toISOString(),
          order_index: Number.MIN_SAFE_INTEGER,
          status: "pending",
          visit_count: 0,
          last_visited_at: null,
        } as BookmarkRow;

        onAddBookmark(optimistic);

        try {
          const bookmarkId = await addBookmark({
            url,
            id: stableId,
            group_id: targetGroupId ?? undefined,
          });
          createdId = bookmarkId ?? null;
          if (bookmarkId) {
            onReplaceBookmarkId?.(stableId, bookmarkId);
          }
          if (!bookmarkId) {
            throw new Error("Failed to create bookmark");
          }

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Enrichment timeout")), 30000);
          });
          const enrichmentPromise = enrichCreatedBookmark(bookmarkId, url);

          const enrichment = (await Promise.race([
            enrichmentPromise,
            timeoutPromise,
          ])) as EnrichmentResult | undefined;

          onApplyEnrichment?.(bookmarkId, enrichment);
        } catch (error) {
          console.error("Failed to add bookmark:", error);
          toast.error(`Failed to add ${url}`);
          onApplyEnrichment?.(createdId ?? stableId, {
            status: "failed",
            error_reason: error instanceof Error ? error.message : "Failed to add",
          });
        }
      };

      if (urls.length === 1) {
        const u = urls[0];
        const fullUrl = u.startsWith("http") ? u : `https://${u}`;
        const stableId = crypto.randomUUID();
        let createdId: string | null = null;
        const targetGroupId = getActiveTargetGroupId();
        const optimistic = {
          id: stableId,
          url: fullUrl,
          title: fullUrl,
          favicon_url: null,
          description: null,
          group_id: targetGroupId,
          user_id: "",
          created_at: new Date().toISOString(),
          order_index: Number.MIN_SAFE_INTEGER,
          status: "pending",
          is_enriching: true,
          visit_count: 0,
          last_visited_at: null,
        } as BookmarkRow;

        onAddBookmark(optimistic);

        try {
          const bookmarkId = await addBookmark({
            url: fullUrl,
            id: stableId,
            group_id: targetGroupId ?? undefined,
          });
          createdId = bookmarkId ?? null;
          if (bookmarkId) {
            onReplaceBookmarkId?.(stableId, bookmarkId);
          }
          if (!bookmarkId) {
            throw new Error("Failed to create bookmark");
          }

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Enrichment timeout")), 30000);
          });
          const enrichmentPromise = enrichCreatedBookmark(bookmarkId, fullUrl);

          const enrichment = (await Promise.race([
            enrichmentPromise,
            timeoutPromise,
          ])) as EnrichmentResult | undefined;

          onApplyEnrichment?.(bookmarkId, enrichment);
        } catch (error) {
          console.error("Failed to add bookmark:", error);
          toast.error(`Failed to add ${fullUrl}`);
          onApplyEnrichment?.(createdId ?? stableId, {
            status: "failed",
            error_reason: error instanceof Error ? error.message : "Failed to add",
          });
        }
        return;
      }

      const fullUrls = urls.map((u) => (u.startsWith("http") ? u : `https://${u}`));
      await Promise.all(fullUrls.map(executeAdd));
    },
    [getActiveTargetGroupId, onAddBookmark, onApplyEnrichment, onReplaceBookmarkId],
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              toast.error("Pasting images is not supported. Paste text only.");
              return;
            }
          }
        }
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target;
      if (isTypingTarget(target) && target !== inputRef.current) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onModeChange?.("search");
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onModeChange?.("add");
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    },
    [inputRef, onModeChange],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  useGlobalKeydown(handleKeyDown);

  const handleSubmit = useCallback(
    async (
      e: React.FormEvent,
      mode: "add" | "search",
      inputValue: string,
      searchQuery: string,
      setInputValue: (value: string) => void,
    ) => {
      e.preventDefault();

      if (isSubmittingRef.current) return;
      const value = mode === "search" ? searchQuery.trim() : inputValue.trim();
      if (!value) return;

      if (mode === "search") {
        onSearchChange?.(value);
        inputRef.current?.blur();
        return;
      }

      setInputValue("");
      inputRef.current?.blur();

      isSubmittingRef.current = true;

      if (isUrl(value) && !value.includes(" ")) {
        setAddStatus("Adding link...", true);
        try {
          await processUrls([value]);
        } finally {
          setAddStatus(null, false);
          isSubmittingRef.current = false;
        }
      } else {
        setAddStatus("Extracting links from text...", true);
        try {
          const urls = extractUrlsFromText(value);
          if (urls.length > 0) {
            setAddStatus("Adding links from text...", true);
            await processUrls(urls);
          } else {
            toast.error("No links found");
          }
        } finally {
          setAddStatus(null, false);
          isSubmittingRef.current = false;
        }
      }
    },
    [inputRef, onSearchChange, processUrls, setAddStatus],
  );

  return {
    handleSubmit,
  };
}
