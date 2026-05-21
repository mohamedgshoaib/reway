import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TodoRow as TodoRowType } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { normalizePriority, priorityConfig } from "./config"

export function TodoRow({
  todo,
  expanded,
  onToggleExpanded,
  selectionMode,
  selected,
  onToggleSelected,
  onEnterSelectionMode,
  onToggleCompleted,
  onEdit,
  onDelete,
  showActions = true,
  variant = "app",
  onActionMenuOpenChange,
}: {
  todo: TodoRowType
  expanded: boolean
  onToggleExpanded: () => void
  selectionMode: boolean
  selected: boolean
  onToggleSelected: () => void
  onEnterSelectionMode: () => void
  onToggleCompleted: () => void
  onEdit: () => void
  onDelete: () => void
  showActions?: boolean
  variant?: "demo" | "app"
  onActionMenuOpenChange?: (open: boolean) => void
}) {
  const priority = normalizePriority(todo.priority)
  const pCfg = priorityConfig[priority]

  const checkboxMarginTop = variant === "demo" ? "mt-[0.5px]" : "mt-[2.7px]"
  const priorityMarginTop = variant === "demo" ? "mt-[2.5px]" : "mt-[5.5px]"
  const [checkboxHovered, setCheckboxHovered] = useState(false)

  const Row = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (selectionMode) {
          onToggleSelected()
        } else {
          onToggleExpanded()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (selectionMode) {
            onToggleSelected()
          } else {
            onToggleExpanded()
          }
        }
      }}
      className={cn(
        "flex items-start gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.97] outline-none",
        !checkboxHovered && "group hover:text-primary",
      )}
    >
      {selectionMode ? (
        <div className="flex items-start gap-3 min-w-0 flex-1 text-left">
          <div className={cn("flex gap-2 min-w-0 flex-1", "items-start")}>
            <div
              className="mt-0 cursor-pointer"
              onMouseEnter={() => setCheckboxHovered(true)}
              onMouseLeave={() => setCheckboxHovered(false)}
            >
              <Checkbox
                checked={selected}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={onToggleSelected}
              />
            </div>
            <span className={cn("text-xs font-semibold leading-none", pCfg.colorClass, "mt-px")}>
              {pCfg.letter}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1",
                todo.completed ? "line-through opacity-60" : "",
                expanded ? "whitespace-pre-wrap wrap-break-word" : "truncate",
              )}
            >
              {todo.text}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 min-w-0 flex-1 text-left">
          <div className={cn("flex gap-2 min-w-0 flex-1", "items-start")}>
            <div
              onMouseEnter={() => setCheckboxHovered(true)}
              onMouseLeave={() => setCheckboxHovered(false)}
              className={cn(checkboxMarginTop, "cursor-pointer")}
            >
              <Checkbox
                checked={todo.completed}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={onToggleCompleted}
              />
            </div>
            <span
              className={cn(
                "text-xs font-semibold leading-none",
                pCfg.colorClass,
                priorityMarginTop,
              )}
            >
              {pCfg.letter}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1",
                todo.completed ? "line-through opacity-60" : "",
                expanded ? "whitespace-pre-wrap wrap-break-word" : "truncate",
              )}
            >
              {todo.text}
            </span>
          </div>
        </div>
      )}

      {showActions ? (
        <DropdownMenu onOpenChange={onActionMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              suppressHydrationWarning
              className={cn(
                "text-muted-foreground/50 transition-all duration-200 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer self-start mt-0",
                selectionMode
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 hover:text-primary/90 hover:bg-muted/50 md:opacity-0 md:group-hover:opacity-100",
              )}
              aria-label="Todo options"
            >
              <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                if (selectionMode) {
                  onToggleSelected()
                } else {
                  onEnterSelectionMode()
                }
              }}
              className="gap-2 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
              {selectionMode ? "Toggle selection" : "Select todos"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleCompleted} className="gap-2 text-xs cursor-pointer">
              <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
              {todo.completed ? "Mark as active" : "Mark as completed"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit} className="gap-2 text-xs cursor-pointer">
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
              Edit todo
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDelete}
              variant="destructive"
              className="gap-2 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
              Delete todo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )

  if (!showActions) {
    return Row
  }

  return (
    <ContextMenu onOpenChange={onActionMenuOpenChange}>
      <ContextMenuTrigger asChild>{Row}</ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem
          onSelect={() => {
            if (selectionMode) {
              onToggleSelected()
            } else {
              onEnterSelectionMode()
            }
          }}
          className="gap-2 text-xs cursor-pointer"
        >
          <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
          {selectionMode ? "Toggle selection" : "Select todos"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onToggleCompleted} className="gap-2 text-xs cursor-pointer">
          <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
          {todo.completed ? "Mark as active" : "Mark as completed"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onEdit} className="gap-2 text-xs cursor-pointer">
          <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
          Edit todo
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={onDelete}
          variant="destructive"
          className="gap-2 text-xs cursor-pointer"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Delete todo
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
