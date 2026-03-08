"use client";

import React, { memo, useState, useId, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableBookmark } from "./SortableBookmark";
import { SortableBookmarkCard } from "./SortableBookmarkCard";
import { createPortal } from "react-dom";
import { BookmarkDragOverlay } from "./bookmark-board/BookmarkDragOverlay";
import { EmptyState } from "./bookmark-board/EmptyState";
import { useBookmarkGrid } from "./bookmark-board/useBookmarkGrid";
import { useBookmarkKeyboardNav } from "./bookmark-board/useBookmarkKeyboardNav";
import { BookmarkRow, GroupRow } from "@/lib/supabase/queries";
import { getDisplayTitle, getDomain } from "@/lib/utils";
import { QuickGlanceDialog } from "./QuickGlanceDialog";
import { BookmarkEditSheet } from "./BookmarkEditSheet";
import { useIsMac } from "@/hooks/useIsMac";

const createdAtFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const CROSS_GROUP_DROP_TOAST_DELAY_MS = 240;
const UNGROUPED_DRAG_BUCKET = "__ungrouped__";

interface BookmarkBoardProps {
  bookmarks: BookmarkRow[];
  initialGroups: GroupRow[];
  activeGroupId: string;
  onReorder: (groupId: string, newOrder: BookmarkRow[]) => void;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (
    id: string,
    data: {
      title: string;
      url: string;
      description?: string;
      favicon_url?: string;
      group_id?: string;
      applyFaviconToDomain?: boolean;
    },
  ) => Promise<void>;
  rowContent: "date" | "group";
  viewMode: "list" | "card";
  layoutDensity?: "compact" | "extended";
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onEnterSelectionMode?: () => void;
}

export const BookmarkBoard = memo(function BookmarkBoard({
  bookmarks,
  initialGroups,
  activeGroupId,
  onReorder,
  onDeleteBookmark,
  onEditBookmark,
  rowContent,
  viewMode,
  layoutDensity = "compact",
  selectionMode = false,
  selectedIds,
  onToggleSelection,
  onEnterSelectionMode,
}: BookmarkBoardProps) {
  const stableSelectedIds = useMemo(
    () => selectedIds ?? new Set<string>(),
    [selectedIds],
  );

  // ... existing sensors and handlers
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBookmark, setPreviewBookmark] = useState<BookmarkRow | null>(
    null,
  );
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editSheetBookmark, setEditSheetBookmark] =
    useState<BookmarkRow | null>(null);
  const dndContextId = useId();
  const isExtendedListGrid =
    viewMode === "list" && layoutDensity === "extended";
  const isGridView = viewMode !== "list" || isExtendedListGrid;
  const minCardWidth = layoutDensity === "extended" ? 260 : 320;
  const boardRef = useRef<HTMLDivElement>(null);
  const gridColumns = useBookmarkGrid({
    viewMode,
    isGridView,
    minItemWidth:
      viewMode === "card" ? minCardWidth : isExtendedListGrid ? 360 : undefined,
    boardRef,
  });

  const orderedBookmarks = useMemo(() => {
    if (activeGroupId !== "all") return bookmarks;

    const groupOrder = new Map<string, number>();
    initialGroups.forEach((g, index) => {
      groupOrder.set(g.id, g.order_index ?? index);
    });

    const getGroupKey = (groupId?: string | null) => {
      // In All Bookmarks only, keep sidebar order but render ungrouped first.
      if (!groupId) return Number.NEGATIVE_INFINITY;
      return groupOrder.get(groupId) ?? Number.POSITIVE_INFINITY;
    };

    return bookmarks.toSorted((a, b) => {
      const groupA = getGroupKey(a.group_id);
      const groupB = getGroupKey(b.group_id);
      if (groupA !== groupB) return groupA - groupB;

      const aOrder = a.order_index ?? Number.POSITIVE_INFINITY;
      const bOrder = b.order_index ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [activeGroupId, bookmarks, initialGroups]);

  const renderedBookmarks = useMemo(() => {
    return activeGroupId === "all" ? orderedBookmarks : bookmarks;
  }, [activeGroupId, bookmarks, orderedBookmarks]);

  const renderedDisplayBookmarks = useMemo(() => {
    return renderedBookmarks.map((b) => ({
      id: b.id,
      title: getDisplayTitle({
        title: b.title,
        url: b.url,
        normalizedUrl: b.normalized_url,
        domain: getDomain(b.url),
      }),
      url: b.url,
      image_url: b.image_url || undefined,
      og_image_url: b.og_image_url || undefined,
      domain: getDomain(b.url),
      description: b.description || undefined,
      favicon: b.favicon_url || undefined,
      isEnriching: Boolean(b.is_enriching),
      createdAt: createdAtFormatter.format(new Date(b.created_at)),
      groupId: b.group_id || "all",
      status: b.status || "ready",
    }));
  }, [renderedBookmarks]);

  // Pre-calculate groups map for O(1) lookups in children
  const groupsMap = useMemo(() => {
    return new Map(initialGroups.map((g) => [g.id, g]));
  }, [initialGroups]);

  // Detect OS for keyboard shortcuts
  const isMac = useIsMac();

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBookmark = activeId
    ? (bookmarks.find((b) => b.id === activeId) ?? null)
    : null;

  const getDragBucket = (groupId?: string | null) =>
    groupId ?? UNGROUPED_DRAG_BUCKET;

  const activeDragBucket = activeBookmark
    ? getDragBucket(activeBookmark.group_id)
    : null;

  const isGroupRestrictedDragActive =
    activeGroupId === "all" && Boolean(activeId) && activeDragBucket !== null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    if (activeGroupId === "all") {
      const activeItem = bookmarks.find((b) => b.id === active.id) ?? null;
      const overItem = bookmarks.find((b) => b.id === over.id) ?? null;

      const groupId = activeItem?.group_id ?? null;
      const activeBucket = getDragBucket(groupId);
      const overBucket = overItem ? getDragBucket(overItem.group_id) : null;

      if (!overItem || overBucket !== activeBucket) {
        setActiveId(null);

        if (overItem && overBucket !== activeBucket) {
          window.setTimeout(() => {
            toast.error("Bookmarks can’t be dragged between groups");
          }, CROSS_GROUP_DROP_TOAST_DELAY_MS);
        }
        return;
      }

      if (active.id !== over.id) {
        const groupBookmarks = orderedBookmarks.filter(
          (b) => getDragBucket(b.group_id) === activeBucket,
        );
        const oldIndex = groupBookmarks.findIndex((b) => b.id === active.id);
        const newIndex = groupBookmarks.findIndex((b) => b.id === over.id);
        if (oldIndex >= 0 && newIndex >= 0) {
          onReorder(
            groupId ?? "no-group",
            arrayMove(groupBookmarks, oldIndex, newIndex),
          );
        }
      }

      setActiveId(null);
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(bookmarks, oldIndex, newIndex);
      onReorder(activeGroupId, newOrder);
    }

    setActiveId(null);
  }

  const { clampedSelectedIndex } = useBookmarkKeyboardNav({
    bookmarks: renderedBookmarks,
    isGridView,
    gridColumns,
    onPreview: (bookmark) => {
      setPreviewBookmark(bookmark);
      setIsPreviewOpen(true);
    },
  });
  if (bookmarks.length === 0) {
    return <EmptyState isMac={isMac} />;
  }

  return (
    <div
      className="w-full bookmark-board-empty-space"
      data-slot="bookmark-board"
    >
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{ droppable: { strategy: MeasuringStrategy.WhileDragging } }}
        modifiers={isGridView ? [] : [restrictToVerticalAxis]}
      >
        <SortableContext
          items={renderedDisplayBookmarks.map((b) => b.id)}
          strategy={
            isGridView ? rectSortingStrategy : verticalListSortingStrategy
          }
        >
          <div
            ref={boardRef}
            className={
              viewMode === "list"
                ? isExtendedListGrid
                  ? "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] bookmark-board-empty-space"
                  : "flex flex-col gap-1 bookmark-board-empty-space"
                : viewMode === "card"
                  ? layoutDensity === "extended"
                    ? "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] bookmark-board-empty-space"
                    : "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] bookmark-board-empty-space"
                  : "grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(120px,100%),1fr))] bookmark-board-empty-space"
            }
            data-slot="bookmark-board"
          >
            {renderedDisplayBookmarks.map((bookmark, index) => {
              const bookmarkDragBucket = getDragBucket(
                renderedBookmarks[index]?.group_id ?? null,
              );

              if (viewMode === "card") {
                return (
                  <SortableBookmarkCard
                    key={bookmark.id}
                    isSelected={clampedSelectedIndex === index}
                    selectionMode={selectionMode}
                    isSelectionChecked={stableSelectedIds.has(bookmark.id)}
                    onToggleSelection={onToggleSelection}
                    onEnterSelectionMode={onEnterSelectionMode}
                    groupsMap={groupsMap}
                    activeGroupId={activeGroupId}
                    dragDimmed={
                      Boolean(isGroupRestrictedDragActive) &&
                      activeDragBucket !== null &&
                      bookmarkDragBucket !== activeDragBucket
                    }
                    onDelete={onDeleteBookmark}
                    onEdit={(id: string) => {
                      const target = bookmarks.find((bm) => bm.id === id);
                      if (target) {
                        setEditSheetBookmark(target);
                        setIsEditSheetOpen(true);
                      }
                    }}
                    onPreview={(id: string) => {
                      const b = bookmarks.find((bm) => bm.id === id);
                      if (b) {
                        setPreviewBookmark(b);
                        setIsPreviewOpen(true);
                      }
                    }}
                    rowContent={rowContent}
                    {...bookmark}
                  />
                );
              }

              return (
                <SortableBookmark
                  key={bookmark.id}
                  onDelete={onDeleteBookmark}
                  onEdit={(id: string) => {
                    const target = bookmarks.find((bm) => bm.id === id);
                    if (target) {
                      setEditSheetBookmark(target);
                      setIsEditSheetOpen(true);
                    }
                  }}
                  isSelected={clampedSelectedIndex === index}
                  activeGroupId={activeGroupId}
                  onPreview={(id) => {
                    const b = bookmarks.find((bm) => bm.id === id);
                    if (b) {
                      setPreviewBookmark(b);
                      setIsPreviewOpen(true);
                    }
                  }}
                  rowContent={rowContent}
                  groupsMap={groupsMap}
                  selectionMode={selectionMode}
                  dragDimmed={
                    Boolean(isGroupRestrictedDragActive) &&
                    activeDragBucket !== null &&
                    bookmarkDragBucket !== activeDragBucket
                  }
                  isSelectionChecked={stableSelectedIds.has(bookmark.id)}
                  onToggleSelection={onToggleSelection}
                  onEnterSelectionMode={onEnterSelectionMode}
                  {...bookmark}
                />
              );
            })}
          </div>
        </SortableContext>

        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay dropAnimation={null} adjustScale={false}>
              <BookmarkDragOverlay
                activeBookmark={activeBookmark}
                viewMode={viewMode}
              />
            </DragOverlay>,
            document.body,
          )}
      </DndContext>

      <QuickGlanceDialog
        bookmark={previewBookmark}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onEdit={(bookmark) => {
          setIsPreviewOpen(false);
          setEditSheetBookmark(bookmark);
          setIsEditSheetOpen(true);
        }}
        onDelete={(id) => {
          setIsPreviewOpen(false);
          onDeleteBookmark(id);
        }}
        groups={initialGroups}
      />

      <BookmarkEditSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        bookmark={editSheetBookmark}
        groups={initialGroups}
        onSave={onEditBookmark}
      />
    </div>
  );
});
