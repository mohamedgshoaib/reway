import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import React from "react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function NoGroupItem({
  groupId,
  isActive,
  selectionMode,
  GroupIcon,
  onSelect,
}: {
  groupId: string
  isActive: boolean
  selectionMode: boolean
  GroupIcon: IconSvgElement
  onSelect: (id: string) => void
}) {
  return (
    <DropdownMenuItem
      className={`group rounded-xl font-medium cursor-pointer flex items-center justify-between gap-3 py-2 px-3 pr-3 ${
        isActive ? "bg-muted text-foreground font-bold" : "text-muted-foreground"
      }`}
      onSelect={(event) => {
        if (!selectionMode) return
        event.preventDefault()
      }}
      onClick={() => {
        if (selectionMode) return
        onSelect(groupId)
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 mt-0.5">
        <HugeiconsIcon icon={GroupIcon} size={16} strokeWidth={2} className="text-foreground/80" />
        <span>No Group</span>
      </div>
    </DropdownMenuItem>
  )
}
