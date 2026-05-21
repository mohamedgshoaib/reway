"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type ReactNode } from "react"

export function SortableGroupRowItem({
  id,
  disabled,
  children,
}: {
  id: string
  disabled?: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing" : "cursor-pointer"}
      data-slot="group-row-sortable"
    >
      {children}
    </div>
  )
}
