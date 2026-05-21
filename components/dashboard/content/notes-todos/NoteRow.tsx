import {
  CheckmarkSquare02Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
import type { NoteRow as NoteRowType } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { NOTE_COLORS } from "./config"

export function NoteRow({
  note,
  expanded,
  onToggleExpanded,
  selectionMode,
  selected,
  onToggleSelected,
  onEnterSelectionMode,
  onEdit,
  onDelete,
  showActions = true,
  variant = "app",
  onActionMenuOpenChange,
}: {
  note: NoteRowType
  expanded: boolean
  onToggleExpanded: () => void
  selectionMode: boolean
  selected: boolean
  onToggleSelected: () => void
  onEnterSelectionMode: () => void
  onEdit: () => void
  onDelete: () => void
  showActions?: boolean
  variant?: "demo" | "app"
  onActionMenuOpenChange?: (open: boolean) => void
}) {
  const dotMarginTop = variant === "demo" ? "mt-1" : "mt-[7px]"

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
      className="group flex items-start gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 hover:text-primary cursor-pointer active:scale-[0.97] outline-none"
    >
      {selectionMode ? (
        <div className="flex items-start gap-3 min-w-0 flex-1 text-left">
          <div className={cn("flex gap-2 min-w-0 flex-1", "items-start")}>
            <span className={cn("mt-0", "cursor-pointer")}>
              <Checkbox
                checked={selected}
                onClick={(event) => event.stopPropagation()}
                onCheckedChange={onToggleSelected}
              />
            </span>
            <span
              className={cn("size-2 rounded-full", "mt-1")}
              style={{ backgroundColor: note.color ?? NOTE_COLORS[5] }}
            />
            <span
              className={cn(
                "min-w-0 flex-1",
                expanded ? "whitespace-pre-wrap wrap-break-word" : "truncate",
              )}
            >
              {note.text}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 min-w-0 flex-1 text-left">
          <div className={cn("flex gap-2 min-w-0 flex-1", "items-start")}>
            <span
              className={cn("size-2 rounded-full", dotMarginTop)}
              style={{ backgroundColor: note.color ?? NOTE_COLORS[5] }}
            />
            <span
              className={cn(
                "min-w-0 flex-1",
                expanded ? "whitespace-pre-wrap wrap-break-word" : "truncate",
              )}
            >
              {note.text}
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
                "text-muted-foreground/50 transition-all duration-200 size-6 rounded-md flex items-center justify-center cursor-pointer self-start mt-0",
                selectionMode
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100 hover:text-primary/90 hover:bg-muted/50 md:opacity-0 md:group-hover:opacity-100",
              )}
              aria-label="Note options"
            >
              <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40">
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
              {selectionMode ? "Toggle selection" : "Select notes"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit} className="gap-2 text-xs cursor-pointer">
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
              Edit note
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onDelete}
              variant="destructive"
              className="gap-2 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
              Delete note
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
          {selectionMode ? "Toggle selection" : "Select notes"}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onEdit} className="gap-2 text-xs cursor-pointer">
          <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
          Edit note
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={onDelete}
          variant="destructive"
          className="gap-2 text-xs cursor-pointer"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Delete note
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
