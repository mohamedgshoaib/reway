"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState, memo } from "react"
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
import { GroupRow } from "@/lib/supabase/queries"
import { Favicon } from "./Favicon"
import { BookmarkActions } from "./sortable-bookmark/BookmarkActions"
import { BookmarkContextMenu } from "./sortable-bookmark/BookmarkContextMenu"
import { MobileActionMenu } from "./sortable-bookmark/MobileActionMenu"

interface SortableBookmarkProps {
  id: string
  title: string
  url: string
  domain: string
  status: string
  favicon?: string
  isEnriching?: boolean
  description?: string
  createdAt: string
  groupId: string
  onDelete?: (id: string) => void
  activeGroupId?: string
  isSelected?: boolean
  onEdit?: (id: string) => void
  onPreview?: (id: string) => void
  rowContent?: "date" | "group"
  groupsMap?: Map<string, GroupRow>
  selectionMode?: boolean
  isSelectionChecked?: boolean
  onToggleSelection?: (id: string) => void
  onEnterSelectionMode?: () => void
  dragDimmed?: boolean
  dragDisabled?: boolean
}

export const SortableBookmark = memo(function SortableBookmark({
  id,
  title,
  url,
  domain,
  status,
  favicon,
  isEnriching = false,
  description,
  createdAt,
  groupId,
  onDelete,
  activeGroupId,
  isSelected,
  onEdit,
  onPreview,
  rowContent = "date",
  groupsMap,
  selectionMode = false,
  isSelectionChecked = false,
  onToggleSelection,
  onEnterSelectionMode,
  dragDimmed = false,
  dragDisabled = false,
}: SortableBookmarkProps) {
  void description
  const [isCopied, setIsCopied] = useState(false)
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

  const dragStyle = isDragging
    ? "z-50 bg-background ring-1 ring-primary/20"
    : isSelected
      ? "bg-foreground/4 ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] isolate shadow-none"
      : ""

  const openInNewTab = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    recordBookmarkVisit(id)
    window.open(url, "_blank")
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

  const handleCopyLink = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      toast.success("URL copied to clipboard")
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
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

  const handleBulkSelect = () => {
    if (selectionMode) return
    onEnterSelectionMode?.()
    onToggleSelection?.(id)
  }

  // Normal Bookmark View
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            className={`group relative flex items-center justify-between rounded-2xl px-4 py-1.5 ${
              status === "pending"
                ? "opacity-60"
                : selectionMode
                  ? "hover:bg-muted/50 cursor-pointer"
                  : dragDisabled
                    ? "hover:bg-muted/50 cursor-default"
                    : "hover:bg-muted/50 cursor-grab active:cursor-grabbing"
            } ${dragStyle} ${dragDimmed ? "opacity-40 saturate-0" : ""} ${
              isDragging ? "opacity-0" : "opacity-100"
            }`}
            style={{ ...style, contentVisibility: "auto" }}
            {...attributes}
            {...(selectionMode ? {} : listeners)}
            data-slot="bookmark-card"
            role="button"
            tabIndex={status === "pending" ? -1 : 0}
            aria-roledescription="Draggable bookmark"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {/* Favicon/Checkbox Container */}
              {selectionMode ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelection?.(id)
                  }}
                  className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-transform duration-150 active:scale-95"
                  aria-label={isSelectionChecked ? "Deselect bookmark" : "Select bookmark"}
                >
                  <div
                    className={`size-4 rounded border-2 flex items-center justify-center ${
                      isSelectionChecked
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
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
                    isEnriching={status === "pending" && isEnriching}
                    className="h-10 w-10"
                  />
                </a>
              )}

              <div className="min-w-0 flex-1">
                <div className="w-fit max-w-full h-5">
                  {status === "pending" ? (
                    <span className="block truncate text-sm font-semibold">
                      {title || "Loading..."}
                    </span>
                  ) : (
                    <a
                      className="block truncate text-sm font-semibold cursor-pointer text-foreground group-hover:text-primary! hover:text-primary! transition-colors duration-200"
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
                    >
                      {title}
                    </a>
                  )}
                </div>
                <div className="w-fit max-w-full h-4">
                  {status === "pending" ? (
                    <span className="block truncate text-xs font-medium text-muted-foreground">
                      {isEnriching ? "Fetching details..." : "Pending"}
                    </span>
                  ) : (
                    <a
                      className="block truncate text-xs font-medium cursor-pointer text-muted-foreground group-hover:text-muted-foreground"
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
                    >
                      {domain}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions / Date Container */}
            <div className="relative flex shrink-0 items-center min-w-28 md:min-w-48 justify-end">
              {/* Desktop Date: Fades out on hover if not mobile */}
              {status === "pending" ? (
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {isEnriching ? "Enriching..." : "Pending"}
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground transition-opacity duration-200 tabular-nums md:block group-hover:opacity-0 max-w-20 truncate text-right">
                  {rowContent === "group"
                    ? (() => {
                        // If viewing a specific group and bookmark belongs to that group, show date instead
                        if (activeGroupId && activeGroupId !== "all" && groupId === activeGroupId) {
                          return createdAt
                        }
                        // Otherwise show group name
                        if (groupId === "all" || !groupsMap || !groupId) return "No Group"
                        const group = groupsMap.get(groupId)
                        return group?.name || "No Group"
                      })()
                    : createdAt}
                </span>
              )}

              {/* Desktop Action Buttons: Visible only on hover and on desktop */}
              {status !== "pending" && !selectionMode ? (
                <BookmarkActions
                  isCopied={isCopied}
                  onEdit={handleEdit}
                  onCopyLink={handleCopyLink}
                  onOpen={openInNewTab}
                  onDelete={handleDeleteRequest}
                />
              ) : null}

              {/* Mobile Action Menu */}
              {status !== "pending" ? (
                <MobileActionMenu
                  isCopied={isCopied}
                  onEdit={handleEdit}
                  onCopyLink={handleCopyLink}
                  onOpen={openInNewTab}
                  onDelete={handleDeleteRequest}
                  onBulkSelect={handleBulkSelect}
                  showBulkSelect={!selectionMode}
                />
              ) : null}
            </div>
          </div>
        </ContextMenuTrigger>

        <BookmarkContextMenu
          onOpen={openInNewTab}
          onPreview={() => onPreview?.(id)}
          onCopyLink={handleCopyLink}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onBulkSelect={handleBulkSelect}
          showBulkSelect={!selectionMode}
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
          <AlertDialogCancel className="rounded-4xl cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-4xl cursor-pointer"
            onClick={handleDeleteConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})
