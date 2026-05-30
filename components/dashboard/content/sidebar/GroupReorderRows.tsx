import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Folder01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ALL_ICONS_MAP } from "@/lib/hugeicons-list"
import type { GroupRow } from "@/lib/supabase/queries"

export interface GroupDragOverlayRowProps {
  group: GroupRow
}

export function SortableGroupRow({ group }: { group: GroupRow }) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const GroupIcon = group.icon ? ALL_ICONS_MAP[group.icon] : Folder01Icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-2 py-1.5 rounded-xl ring-1 ring-transparent hover:bg-muted/40 ${
        isDragging ? "bg-muted/40 ring-1 ring-primary/20" : ""
      }`}
      {...attributes}
      data-slot="group-reorder-row"
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="size-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-primary/90 hover:bg-muted/50 cursor-grab active:cursor-grabbing"
        aria-label={`Reorder ${group.name}`}
        {...listeners}
      >
        <span className="grid grid-cols-2 gap-0.5">
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
        </span>
      </button>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HugeiconsIcon
          icon={GroupIcon || Folder01Icon}
          size={16}
          strokeWidth={2}
          style={{ color: group.color || undefined }}
          className={group.color ? "" : "text-foreground/80"}
        />
        <span className="truncate max-w-32">{group.name}</span>
      </div>
    </div>
  )
}

export function GroupDragOverlayRow({ group }: GroupDragOverlayRowProps) {
  const GroupIcon = group.icon ? ALL_ICONS_MAP[group.icon] : Folder01Icon
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl ring-1 ring-primary/20 bg-background shadow-sm">
      <div className="size-6 rounded-md flex items-center justify-center text-muted-foreground/60">
        <span className="grid grid-cols-2 gap-0.5">
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
          <span className="size-1 rounded-full bg-current" />
        </span>
      </div>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <HugeiconsIcon
          icon={GroupIcon || Folder01Icon}
          size={16}
          strokeWidth={2}
          style={{ color: group.color || undefined }}
          className={group.color ? "" : "text-foreground/80"}
        />
        <span className="truncate max-w-32">{group.name}</span>
      </div>
    </div>
  )
}
