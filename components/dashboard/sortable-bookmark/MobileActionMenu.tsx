"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  Refresh01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileActionMenuProps {
  isCopied: boolean
  isRefreshing?: boolean
  onEdit: (e?: React.MouseEvent) => void
  onRefresh: (e?: React.MouseEvent) => void
  onCopyLink: (e?: React.MouseEvent) => void | Promise<void>
  onOpen: (e?: React.MouseEvent) => void
  onDelete: (e?: React.MouseEvent) => void
  onBulkSelect?: () => void
  showBulkSelect?: boolean
}

export function MobileActionMenu({
  isCopied,
  isRefreshing = false,
  onEdit,
  onRefresh,
  onCopyLink,
  onOpen,
  onDelete,
  onBulkSelect,
  showBulkSelect = false,
}: MobileActionMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // Issue: `suppressHydrationWarning` should only be used when a mismatch is expected.
            // Fix: remove it here; the trigger is deterministic and should hydrate consistently.
            className="size-8 -mr-2 rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label="Open bookmark actions"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={16} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40 rounded-2xl p-2 ring-1 ring-foreground/8 shadow-none isolate after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-['']"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onEdit()
            }}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer"
            disabled={isRefreshing}
            onClick={(e) => {
              e.stopPropagation()
              onRefresh()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onRefresh()
            }}
          >
            <HugeiconsIcon
              icon={Refresh01Icon}
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Metadata"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onCopyLink()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onCopyLink()
            }}
          >
            <HugeiconsIcon
              icon={isCopied ? Tick01Icon : Copy01Icon}
              size={16}
              className={isCopied ? "text-green-500" : ""}
            />
            {isCopied ? "Copied!" : "Copy Link"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onOpen()
            }}
          >
            <HugeiconsIcon icon={ArrowUpRight03Icon} size={16} /> Open
          </DropdownMenuItem>
          {showBulkSelect && onBulkSelect ? (
            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onBulkSelect()
              }}
              onTouchEnd={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setOpen(false)
                onBulkSelect()
              }}
            >
              <HugeiconsIcon icon={Tick01Icon} size={16} /> Bulk select
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            className="rounded-xl flex items-center gap-2 cursor-pointer font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete()
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
