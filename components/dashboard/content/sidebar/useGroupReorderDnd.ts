import {
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useMemo, useState } from "react"
import type { GroupRow } from "@/lib/supabase/queries"

export function useGroupReorderDnd({
  groups,
  onReorderGroups,
}: {
  groups: GroupRow[]
  onReorderGroups: (newOrder: GroupRow[]) => void
}) {
  const [activeDragGroupId, setActiveDragGroupId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleGroupDragStart = (event: DragStartEvent) => {
    setActiveDragGroupId(event.active.id as string)
  }

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragGroupId(null)
    if (!over || active.id === over.id) return

    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    onReorderGroups(arrayMove(groups, oldIndex, newIndex))
  }

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return closestCenter(args)
  }

  const activeGroup = useMemo(() => {
    return activeDragGroupId ? (groups.find((g) => g.id === activeDragGroupId) ?? null) : null
  }, [activeDragGroupId, groups])

  return {
    sensors,
    collisionDetection,
    activeGroup,
    handleGroupDragStart,
    handleGroupDragEnd,
  }
}
