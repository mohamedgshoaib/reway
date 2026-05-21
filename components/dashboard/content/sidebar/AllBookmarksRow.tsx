import {
  ArrowUpRight03Icon,
  CheckmarkSquare02Icon,
  Folder01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
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

export function AllBookmarksRow({
  active,
  selectionMode,
  onSelectAll,
  onOpenAll,
  onToggleSelectionMode,
  label = "All Bookmarks",
  openLabel = "Open bookmarks",
  icon = Folder01Icon,
  onActionMenuOpenChange,
}: {
  active: boolean
  selectionMode: boolean
  onSelectAll: () => void
  onOpenAll: () => void
  onToggleSelectionMode: () => void
  label?: string
  openLabel?: string
  icon?: IconSvgElement
  onActionMenuOpenChange?: (open: boolean) => void
}) {
  return (
    <ContextMenu onOpenChange={onActionMenuOpenChange}>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            onSelectAll()
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onSelectAll()
            }
          }}
          className={`group flex items-center gap-3 px-2 py-1.5 transition-all duration-200 cursor-pointer active:scale-[0.97] outline-none ${
            active ? "text-primary font-semibold" : selectionMode ? "" : "hover:text-primary"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer">
            <span
              className={`h-px ${
                selectionMode
                  ? "w-8 opacity-60"
                  : `transition-[width,opacity] duration-200 ease-out ${
                      active
                        ? "w-12 opacity-80"
                        : "w-8 opacity-60 group-hover:w-12 group-hover:opacity-80"
                    }`
              } bg-current`}
            />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <HugeiconsIcon
                icon={icon}
                size={16}
                strokeWidth={2}
                className="text-muted-foreground"
              />
              <span className="truncate">{label}</span>
            </div>
          </div>

          <DropdownMenu onOpenChange={onActionMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                suppressHydrationWarning
                className={`text-muted-foreground/50 transition-all duration-200 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer ${
                  selectionMode
                    ? "opacity-0 pointer-events-none"
                    : "opacity-0 group-hover:opacity-100 hover:text-primary/90 hover:bg-muted/50"
                }`}
                aria-label="Group options"
              >
                <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-40">
              <DropdownMenuItem onClick={onOpenAll} className="gap-2 text-xs cursor-pointer">
                <HugeiconsIcon icon={ArrowUpRight03Icon} size={14} />
                {openLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem onClick={onOpenAll} className="gap-2 text-xs cursor-pointer">
          <HugeiconsIcon icon={ArrowUpRight03Icon} size={14} />
          {openLabel}
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            onToggleSelectionMode()
          }}
          className="gap-2 text-xs cursor-pointer"
        >
          <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} />
          {selectionMode ? "Exit selection" : "Select groups"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
