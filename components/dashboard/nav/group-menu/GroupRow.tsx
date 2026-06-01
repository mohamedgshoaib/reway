/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import {
  ArrowUpRight03Icon,
  CheckmarkSquare02Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { GroupRow } from "@/lib/supabase/queries"

export function GroupRow({
  group,
  GroupIcon,
  selectionMode,
  active,
  selected,
  onToggleSelected,
  onSelectGroup,
  onOpenGroup,
  onEnterSelectionModeAndToggle,
  onToggleInSelectionMode,
  onEditGroup,
  onDeleteGroup,
  onToggleShowInQuickAccess,
}: {
  group: GroupRow
  GroupIcon: IconSvgElement
  selectionMode: boolean
  active: boolean
  selected: boolean
  onToggleSelected: () => void
  onSelectGroup: () => void
  onOpenGroup?: () => void
  onEnterSelectionModeAndToggle: () => void
  onToggleInSelectionMode: () => void
  onEditGroup: () => void
  onDeleteGroup: () => void
  onToggleShowInQuickAccess: (show: boolean) => void
}) {
  return (
    <div className="group/menu-row relative flex items-center gap-3 rounded-xl">
      <DropdownMenuItem
        asChild
        className={`group flex-1 cursor-pointer py-2 pr-20 ${
          active ? "bg-muted text-foreground font-bold" : "text-muted-foreground"
        }`}
        onSelect={(event) => {
          if (!selectionMode) return
          event.preventDefault()
        }}
      >
        {selectionMode ? (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleSelected()
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                event.stopPropagation()
                onToggleSelected()
              }
            }}
            className="flex w-full items-center justify-between gap-3 px-3 text-left transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Checkbox
                checked={selected}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={() => {
                  onToggleSelected()
                }}
              />
              <span className="truncate">{group.name}</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelectGroup()
            }}
            className="flex w-full items-center justify-between gap-3 px-3 text-left transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <HugeiconsIcon
                icon={GroupIcon}
                size={16}
                strokeWidth={2}
                style={{ color: group.color || undefined }}
                className={group.color ? "" : "text-foreground/80"}
              />
              <span className="truncate">{group.name}</span>
            </div>
          </button>
        )}
      </DropdownMenuItem>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              suppressHydrationWarning
              className="size-11 md:h-7 md:w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 cursor-pointer text-muted-foreground/90 hover:text-primary/90 transition-colors duration-200"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${group.name} options`}
              disabled={selectionMode}
            >
              <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-52">
            <DropdownMenuItem
              onSelect={() => {
                if (!selectionMode) {
                  onEnterSelectionModeAndToggle()
                } else {
                  onToggleInSelectionMode()
                }
              }}
              className="gap-2 text-xs rounded-lg cursor-pointer"
            >
              <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
              {selectionMode ? "Toggle selection" : "Select groups"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenGroup}
              className="gap-2 text-xs rounded-lg cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowUpRight03Icon} size={14} />
              Open group
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onEditGroup}
              className="gap-2 text-xs rounded-lg cursor-pointer"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
              Edit group
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDeleteGroup}
              variant="destructive"
              className="gap-2 text-xs rounded-lg cursor-pointer"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
              Delete group
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onToggleShowInQuickAccess(group.show_in_fab === false)
              }}
              className="gap-2 text-xs rounded-lg cursor-pointer"
            >
              <HugeiconsIcon icon={ZapIcon} size={14} />
              {group.show_in_fab === false
                ? "Show in extension quick access"
                : "Hide from extension quick access"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
