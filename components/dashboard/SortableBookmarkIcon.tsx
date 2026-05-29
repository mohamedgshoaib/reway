"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { memo, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { recordBookmarkVisit } from "@/lib/bookmark-visits"
import { Favicon } from "./Favicon"
import { BookmarkContextMenu } from "./sortable-bookmark/BookmarkContextMenu"

interface SortableBookmarkIconProps {
  id: string
  title: string
  url: string
  domain: string
  status?: string
  favicon?: string
  isEnriching?: boolean
  isSelected?: boolean
  selectionMode?: boolean
  isSelectionChecked?: boolean
  onToggleSelection?: (id: string) => void
  onEnterSelectionMode?: () => void
  onDelete?: (id: string) => void
  onRefresh?: (id: string) => void
  onEdit?: (id: string) => void
  onPreview?: (id: string) => void
  dragDimmed?: boolean
  dragDisabled?: boolean
}

export const SortableBookmarkIcon = memo(function SortableBookmarkIcon({
  id,
  title,
  url,
  domain,
  status = "ready",
  favicon,
  isEnriching = false,
  isSelected,
  selectionMode = false,
  isSelectionChecked = false,
  onToggleSelection,
  onEnterSelectionMode,
  onDelete,
  onRefresh,
  onEdit,
  onPreview,
  dragDimmed = false,
  dragDisabled = false,
}: SortableBookmarkIconProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: dragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    touchAction: selectionMode ? "auto" : "manipulation",
  }

  const handleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    recordBookmarkVisit(id)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleAnchorClick = (event: React.MouseEvent) => {
    if (event.shiftKey && !selectionMode) {
      event.preventDefault()
      event.stopPropagation()
      onEnterSelectionMode?.()
      onToggleSelection?.(id)
      return
    }

    recordBookmarkVisit(id)
  }

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      toast.success("URL copied to clipboard")
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const handleDeleteRequest = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    onDelete?.(id)
    setDeleteDialogOpen(false)
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onEdit?.(id)
  }

  const handleRefresh = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onRefresh?.(id)
  }

  const handlePreview = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onPreview?.(id)
  }

  const handleBulkSelect = () => {
    if (selectionMode) return
    onEnterSelectionMode?.()
    onToggleSelection?.(id)
  }

  const needsRefresh = status === "pending" && !isEnriching

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(selectionMode ? {} : listeners)}
            data-slot="bookmark-card"
            className={`group relative flex flex-col items-center gap-2.5 rounded-xl bg-muted/20 p-3 text-center ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate hover:bg-muted/30 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
              dragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
            } ${
              isSelectionChecked || isSelected ? "ring-2 ring-primary/30" : ""
            } ${dragDimmed ? "opacity-40 saturate-0" : ""} ${isDragging ? "opacity-0" : ""}`}
          >
            {selectionMode ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleSelection?.(id)
                }}
                className="size-10 flex items-center justify-center rounded-xl border border-border/50 hover:border-border/70 hover:bg-muted/40 transition-transform duration-150"
                aria-label={isSelectionChecked ? "Deselect bookmark" : "Select bookmark"}
              >
                <div
                  className={`size-5 rounded border-2 flex items-center justify-center ${
                    isSelectionChecked ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {isSelectionChecked && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-primary-foreground"
                    >
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ) : (
              <a
                className="cursor-pointer"
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={handleAnchorClick}
                onPointerDown={(event) => {
                  event.stopPropagation()
                }}
                onMouseDown={(event) => {
                  event.stopPropagation()
                }}
                onTouchStart={(event) => {
                  event.stopPropagation()
                }}
                aria-label="Open bookmark"
              >
                  <Favicon
                    url={favicon || ""}
                    domain={domain}
                    title={title}
                    isEnriching={isEnriching}
                    needsRefresh={needsRefresh}
                    className="size-10"
                  />
                </a>
            )}
            <a
              className="text-xs font-semibold text-foreground truncate w-full block cursor-pointer group-hover:text-primary! hover:text-primary! transition-colors duration-200"
              style={{ textDecoration: "none" }}
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={handleAnchorClick}
              onPointerDown={(event) => {
                event.stopPropagation()
              }}
              onMouseDown={(event) => {
                event.stopPropagation()
              }}
              onTouchStart={(event) => {
                event.stopPropagation()
              }}
              aria-label="Open bookmark"
            >
              {title}
            </a>
          </div>
        </ContextMenuTrigger>
        <BookmarkContextMenu
          onOpen={handleOpen}
          onPreview={handlePreview}
          onCopyLink={handleCopy}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          onDelete={handleDeleteRequest}
          onBulkSelect={handleBulkSelect}
          showBulkSelect={!selectionMode}
          isRefreshing={isEnriching}
        />
      </ContextMenu>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete bookmark?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the bookmark from your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-lg cursor-pointer"
            onClick={handleDeleteConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})
