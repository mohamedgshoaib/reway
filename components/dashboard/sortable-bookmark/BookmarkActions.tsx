"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { MouseEventHandler } from "react"
import { Button } from "@/components/ui/button"

interface BookmarkActionsProps {
  isCopied: boolean
  onEdit: MouseEventHandler<HTMLButtonElement>
  onCopyLink: MouseEventHandler<HTMLButtonElement>
  onOpen: MouseEventHandler<HTMLButtonElement>
  onDelete: MouseEventHandler<HTMLButtonElement>
}

export function BookmarkActions({
  isCopied,
  onEdit,
  onCopyLink,
  onOpen,
  onDelete,
}: BookmarkActionsProps) {
  return (
    <div
      role="presentation"
      className="absolute right-0 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto cursor-default"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
        onClick={onEdit}
        aria-label="Edit bookmark"
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
        onClick={onCopyLink}
        aria-label={isCopied ? "URL copied" : "Copy link"}
      >
        <div
          className="transition-transform duration-200 ease-in-out"
          key={isCopied ? "tick" : "copy"}
        >
          <HugeiconsIcon
            icon={isCopied ? Tick01Icon : Copy01Icon}
            size={16}
            className={isCopied ? "text-green-500" : ""}
          />
        </div>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
        onClick={onOpen}
        aria-label="Open link in new tab"
      >
        <HugeiconsIcon icon={ArrowUpRight03Icon} size={16} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-xl transition-transform duration-150 ease-out cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-[0.97] motion-reduce:transition-none"
        onClick={onDelete}
        aria-label="Delete bookmark"
      >
        <div className="transition-transform duration-200 ease-in-out" key="delete">
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </div>
      </Button>
    </div>
  )
}
