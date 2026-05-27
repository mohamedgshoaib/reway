"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Refresh01Icon,
  Tick01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { MouseEventHandler } from "react"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { useShowShortcuts } from "@/hooks/useShowShortcuts"

interface BookmarkContextMenuProps {
  onOpen: MouseEventHandler<HTMLDivElement>
  onPreview: () => void
  onCopyLink: MouseEventHandler<HTMLDivElement>
  onEdit: MouseEventHandler<HTMLDivElement>
  onRefresh: MouseEventHandler<HTMLDivElement>
  onDelete: MouseEventHandler<HTMLDivElement>
  onBulkSelect?: () => void
  showBulkSelect?: boolean
  isRefreshing?: boolean
}

export function BookmarkContextMenu({
  onOpen,
  onPreview,
  onCopyLink,
  onEdit,
  onRefresh,
  onDelete,
  onBulkSelect,
  showBulkSelect = false,
  isRefreshing = false,
}: BookmarkContextMenuProps) {
  const showShortcuts = useShowShortcuts()

  return (
    <ContextMenuContent className="w-56 rounded-2xl p-2">
      <ContextMenuItem
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onOpen}
      >
        <HugeiconsIcon icon={ArrowUpRight03Icon} size={16} className="text-muted-foreground" />
        <span>Open in New Tab</span>
        {showShortcuts ? <ContextMenuShortcut>⏎</ContextMenuShortcut> : null}
      </ContextMenuItem>
      <ContextMenuItem
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onPreview}
      >
        <HugeiconsIcon icon={ViewIcon} size={16} className="text-muted-foreground" />
        <span>Quick Glance</span>
        {showShortcuts ? <ContextMenuShortcut>Space</ContextMenuShortcut> : null}
      </ContextMenuItem>
      <ContextMenuItem
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onCopyLink}
      >
        <HugeiconsIcon icon={Copy01Icon} size={16} className="text-muted-foreground" />
        <span>Copy Link</span>
        {showShortcuts ? <ContextMenuShortcut>C</ContextMenuShortcut> : null}
      </ContextMenuItem>

      {showBulkSelect && onBulkSelect ? (
        <ContextMenuItem
          className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
          onSelect={() => {
            onBulkSelect()
          }}
        >
          <HugeiconsIcon icon={Tick01Icon} size={16} className="text-muted-foreground" />
          <span>Bulk select</span>
        </ContextMenuItem>
      ) : null}

      <ContextMenuItem
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onEdit}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={16} className="text-muted-foreground" />
        <span>Edit Bookmark</span>
        {showShortcuts ? <ContextMenuShortcut>E</ContextMenuShortcut> : null}
      </ContextMenuItem>
      <ContextMenuItem
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <HugeiconsIcon
          icon={Refresh01Icon}
          size={16}
          className={isRefreshing ? "text-muted-foreground animate-spin" : "text-muted-foreground"}
        />
        <span>{isRefreshing ? "Refreshing..." : "Refresh Metadata"}</span>
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        className="rounded-xl flex items-center gap-2.5 py-2 cursor-pointer"
        onClick={onDelete}
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} />
        <span>Delete</span>
        {showShortcuts ? <ContextMenuShortcut>⌫</ContextMenuShortcut> : null}
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
