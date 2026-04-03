"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import type { GroupRow } from "@/lib/supabase/queries";
import { useGlobalKeydown } from "@/hooks/useGlobalKeydown";
import {
  normalizeAlphaNumericKey,
  shouldIgnoreDashboardHotkey,
} from "@/lib/keyboard";
import {
  ALL_BOOKMARKS_GROUP_ID,
  MOST_VISITED_GROUP_ID,
} from "@/lib/system-groups";

interface UseGroupShortcutsOptions {
  groups: GroupRow[];
  setActiveGroupId: (id: string) => void;
}

export function useGroupShortcuts({
  groups,
  setActiveGroupId,
}: UseGroupShortcutsOptions) {
  const letterCycleRef = useRef<Record<string, number>>({});

  const groupsByFirstLetter = useMemo(() => {
    const map: Record<string, string[]> = {};

    const normalizeChar = (char: string): string => {
      return char
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    };

    const allBookmarksFirstLetter = "a";
    if (!map[allBookmarksFirstLetter]) {
      map[allBookmarksFirstLetter] = [];
    }
    map[allBookmarksFirstLetter].push(ALL_BOOKMARKS_GROUP_ID);

    const mostVisitedFirstLetter = "m";
    if (!map[mostVisitedFirstLetter]) {
      map[mostVisitedFirstLetter] = [];
    }
    map[mostVisitedFirstLetter].push(MOST_VISITED_GROUP_ID);

    for (const group of groups) {
      const groupName = group.name ?? "";
      const firstChar = groupName.trim().charAt(0);
      if (!firstChar) continue;

      const normalizedLetter = normalizeChar(firstChar);
      if (/[a-z]/.test(normalizedLetter)) {
        if (!map[normalizedLetter]) {
          map[normalizedLetter] = [];
        }
        map[normalizedLetter].push(group.id);
      }
    }
    return map;
  }, [groups]);

  useEffect(() => {
    letterCycleRef.current = {};
  }, [groups]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!event.shiftKey) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1 && !event.code) return;

      if (shouldIgnoreDashboardHotkey(event)) return;

      const letter = normalizeAlphaNumericKey(event);
      if (!letter || letter.length !== 1) return;
      if (!/[a-z]/.test(letter)) return;
      const groupIds = groupsByFirstLetter[letter];
      if (!groupIds || groupIds.length === 0) return;

      event.preventDefault();
      const currentIndex = letterCycleRef.current[letter] ?? -1;
      const nextIndex = (currentIndex + 1) % groupIds.length;
      letterCycleRef.current[letter] = nextIndex;
      setActiveGroupId(groupIds[nextIndex]);
    },
    [groupsByFirstLetter, setActiveGroupId],
  );

  useGlobalKeydown(handleKeyDown);
}
