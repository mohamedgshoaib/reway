import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const CROSS_GROUP_DROP_TOAST_DELAY_MS = 240;

export function useFolderDnd<T extends { id: string; group_id?: string | null }>(options: {
  bookmarks: T[];
  bookmarkBuckets: Record<string, T[]>;
  onReorder: (groupId: string, newOrder: T[]) => void;
  disabled?: boolean;
}) {
  const { bookmarks, bookmarkBuckets, onReorder, disabled = false } = options;

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeBookmark = useMemo(
    () => (activeId ? (bookmarks.find((bookmark) => bookmark.id === activeId) ?? null) : null),
    [activeId, bookmarks],
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) {
      setActiveId(null);
      return;
    }
    const { active, over } = event;
    const activeGroupId = active.data?.current?.sortable?.containerId as
      | string
      | undefined;
    const overGroupId = over?.data?.current?.sortable?.containerId as
      | string
      | undefined;

    if (!activeGroupId || !overGroupId || activeGroupId !== overGroupId) {
      setActiveId(null);

      if (activeGroupId && overGroupId && activeGroupId !== overGroupId) {
        window.setTimeout(() => {
          toast.error("Bookmarks can’t be dragged between groups");
        }, CROSS_GROUP_DROP_TOAST_DELAY_MS);
      }
      return;
    }

    if (over && active.id !== over.id) {
      const groupBookmarks = bookmarkBuckets[activeGroupId] ?? [];
      const oldIndex = groupBookmarks.findIndex((b) => b.id === active.id);
      const newIndex = groupBookmarks.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(groupBookmarks, oldIndex, newIndex);
      onReorder(activeGroupId, newOrder);
    }
    setActiveId(null);
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    activeBookmark,
    activeId,
    handleDragStart,
    handleDragEnd,
    setActiveId,
  };
}
