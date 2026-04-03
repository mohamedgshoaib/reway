"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import type { BookmarkRow } from "@/lib/supabase/queries";
import { useGlobalEvent } from "@/hooks/useGlobalEvent";
import { EXTENSION_DOWNLOAD_URL } from "@/lib/extension";
import { recordBookmarkVisits } from "@/lib/bookmark-visits";
import {
  hasVisitedBookmark,
  sortBookmarksByVisitRanking,
} from "@/lib/bookmark-sorting";
import { isAllBookmarksGroupId, isMostVisitedGroupId } from "@/lib/system-groups";

interface UseOpenGroupOptions {
  bookmarks: BookmarkRow[];
  deferredSearchQuery: string;
}

export function useOpenGroup({
  bookmarks,
  deferredSearchQuery,
}: UseOpenGroupOptions) {
  const pendingRequestsRef = useRef(
    new Map<
      string,
      (response: { ok: boolean; count?: number; error?: string } | null) => void
    >(),
  );

  useGlobalEvent("message", (event) => {
    if (event?.data?.type !== "reway_open_group_response") return;
    const requestId = event.data.requestId as string | undefined;
    if (!requestId) return;
    const resolver = pendingRequestsRef.current.get(requestId);
    if (!resolver) return;
    pendingRequestsRef.current.delete(requestId);
    resolver(event.data.response ?? null);
  });

  const handleOpenGroup = useCallback(
    async (groupId: string) => {
      const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
      const targetBookmarks = bookmarks.filter((bookmark) => {
        const matchesGroup =
          isAllBookmarksGroupId(groupId)
            ? true
            : isMostVisitedGroupId(groupId)
              ? hasVisitedBookmark(bookmark)
              : bookmark.group_id === groupId;
        if (!matchesGroup) return false;
        if (!normalizedQuery) return true;
        const haystack = [bookmark.title, bookmark.url, bookmark.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

      if (targetBookmarks.length === 0) return;
      const orderedTargetBookmarks = isMostVisitedGroupId(groupId)
        ? sortBookmarksByVisitRanking(targetBookmarks)
        : targetBookmarks;

      recordBookmarkVisits(orderedTargetBookmarks.map((bookmark) => bookmark.id));

      const urls = orderedTargetBookmarks
        .map((bookmark) => bookmark.url)
        .filter(Boolean);

      const requestId = crypto.randomUUID();
      const response = await new Promise<{
        ok: boolean;
        count?: number;
        error?: string;
      } | null>((resolve) => {
        const timer = window.setTimeout(() => {
          pendingRequestsRef.current.delete(requestId);
          resolve(null);
        }, 250);

        pendingRequestsRef.current.set(requestId, (payload) => {
          window.clearTimeout(timer);
          resolve(payload ?? null);
        });

        window.postMessage(
          { type: "reway_open_group", requestId, groupId, urls },
          "*",
        );
      });

      if (response?.ok) {
        toast.success(
          `Opened ${response.count ?? targetBookmarks.length} tabs via extension`,
        );
        return;
      }

      // If extension responded but with error, try manual fallback
      if (response && !response.ok) {
        console.warn("Extension error:", response.error);
      }

      // Manual fallback or no extension detected
      // Open all tabs immediately to avoid popup blocker
      orderedTargetBookmarks.forEach((bookmark) => {
        window.open(bookmark.url, "_blank", "noopener,noreferrer");
      });

      // Only show extension prompt if extension didn't respond at all
      if (response === null) {
        toast.error(
          "Popups blocked. Allow popups or install the Reway extension to open all tabs.",
          {
            action: {
              label: "Download extension",
              onClick: () => {
                window.open(
                  EXTENSION_DOWNLOAD_URL,
                  "_blank",
                  "noopener,noreferrer",
                );
              },
            },
          },
        );
      }
    },
    [bookmarks, deferredSearchQuery],
  );

  return { handleOpenGroup };
}
