"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  Refresh01Icon,
  Tick01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardLoadingState, LoadingBarsIcon } from "../LoadingState"

interface BookmarkActionsProps {
  isCopied: boolean
  isRefreshing?: boolean
  onEdit: (e?: MouseEvent) => void
  onRefresh: (e?: MouseEvent) => void
  onCopyLink: (e?: MouseEvent) => void | Promise<void>
  onOpen: (e?: MouseEvent) => void
  onPreview: () => void
  onDelete: (e?: MouseEvent) => void
  onBulkSelect?: () => void
  showBulkSelect?: boolean
  variant?: "compact" | "extended"
}

export function BookmarkActions({
  isCopied,
  isRefreshing = false,
  onEdit,
  onRefresh,
  onCopyLink,
  onOpen,
  onPreview,
  onDelete,
  onBulkSelect,
  showBulkSelect = false,
  variant = "extended",
}: BookmarkActionsProps) {
  const showOverflowMenu = variant === "extended"
  const actionButtonClass =
    "size-10 rounded-lg hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
  const destructiveButtonClass =
    "size-10 rounded-lg transition-transform duration-150 ease-out cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-[0.97] motion-reduce:transition-none"
  const trailingActionClass = "-mr-1"

  return (
    <div
      role="presentation"
      className="absolute inset-y-1 right-1 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto cursor-default"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className={actionButtonClass}
        onClick={onEdit}
        aria-label="Edit bookmark"
      >
        <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
      </Button>

      {!showOverflowMenu ? (
        <Button
          variant="ghost"
          size="icon"
          className={actionButtonClass}
          onClick={onRefresh}
          aria-label={isRefreshing ? "Refreshing metadata" : "Refresh metadata"}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <LoadingBarsIcon />
          ) : (
            <HugeiconsIcon icon={Refresh01Icon} size={14} />
          )}
        </Button>
      ) : null}

      <Button
        variant="ghost"
        size="icon"
        className={actionButtonClass}
        onClick={onCopyLink}
        aria-label={isCopied ? "URL copied" : "Copy link"}
      >
        <div
          className="transition-transform duration-200 ease-in-out"
          key={isCopied ? "tick" : "copy"}
        >
          <HugeiconsIcon
            icon={isCopied ? Tick01Icon : Copy01Icon}
            size={14}
            className={isCopied ? "text-green-500" : ""}
          />
        </div>
      </Button>

      {showOverflowMenu ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`${actionButtonClass} ${trailingActionClass}`}
              aria-label="More bookmark actions"
            >
              <HugeiconsIcon icon={MoreVerticalIcon} size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-2xl p-2 ring-1 ring-foreground/8 shadow-none"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer"
              onClick={onPreview}
            >
              <HugeiconsIcon icon={ViewIcon} size={16} className="text-muted-foreground" />
              Quick Glance
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer"
              onClick={onOpen}
            >
              <HugeiconsIcon icon={ArrowUpRight03Icon} size={16} className="text-muted-foreground" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              {isRefreshing ? (
                <DashboardLoadingState label="Refreshing" />
              ) : (
                <>
                  <HugeiconsIcon icon={Refresh01Icon} size={16} className="text-muted-foreground" />
                  Refresh Metadata
                </>
              )}
            </DropdownMenuItem>
            {showBulkSelect && onBulkSelect ? (
              <DropdownMenuItem
                className="rounded-xl flex items-center gap-2 cursor-pointer"
                onClick={() => onBulkSelect()}
              >
                <HugeiconsIcon icon={Tick01Icon} size={16} className="text-muted-foreground" />
                Bulk select
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              className="rounded-xl flex items-center gap-2 cursor-pointer font-medium"
              onClick={onDelete}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={actionButtonClass}
            onClick={onOpen}
            aria-label="Open link in new tab"
          >
            <HugeiconsIcon icon={ArrowUpRight03Icon} size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`${destructiveButtonClass} ${trailingActionClass}`}
            onClick={onDelete}
            aria-label="Delete bookmark"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
          </Button>
        </>
      )}
    </div>
  )
}
