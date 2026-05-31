"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useEffect, useRef, useState, memo } from "react"
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
  createdAt: string
  groupId: string
  onDelete?: (id: string) => void
  onRefresh?: (id: string) => void
  activeGroupId?: string
  isSelected?: boolean
  onEdit?: (id: string) => void
  onPreview?: (id: string) => void
  rowContent?: "date" | "group"
  layoutDensity?: "compact" | "extended"
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
  createdAt,
  groupId,
  onDelete,
  onRefresh,
  activeGroupId,
  isSelected,
  onEdit,
  onPreview,
  rowContent = "date",
  layoutDensity = "compact",
  groupsMap,
  selectionMode = false,
  isSelectionChecked = false,
  onToggleSelection,
  onEnterSelectionMode,
  dragDimmed = false,
  dragDisabled = false,
}: SortableBookmarkProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      ? "bg-foreground/4 ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] isolate shadow-none"
      : ""

  const openInNewTab = (e?: React.MouseEvent) => {
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

  const handleCopyLink = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      toast.success("URL copied to clipboard")
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current)
      }
      copyResetTimerRef.current = setTimeout(() => setIsCopied(false), 2000)
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

  const handleRefresh = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onRefresh?.(id)
  }

  const handleBulkSelect = () => {
    if (selectionMode) return
    onEnterSelectionMode?.()
    onToggleSelection?.(id)
  }

  const needsRefresh = status === "pending" && !isEnriching
  const isExtendedLayout = layoutDensity === "extended"
  const actionLaneClass = isExtendedLayout ? "min-w-[8rem]" : "min-w-[13.5rem]"
  const textBlockClass = isExtendedLayout
    ? "min-w-0 flex-1 max-w-[11.5rem]"
    : "min-w-0 flex-1 max-w-[20rem]"
  const titleRowClass = "h-5 w-full"
  const metaRowClass = "h-4 w-full"
  const truncatedTextClass = "inline-block max-w-full truncate align-top"

  useEffect(() => {
    const timerRef = copyResetTimerRef
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Normal Bookmark View
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            className={`group relative flex items-center justify-between rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
              status === "pending"
                ? "hover:bg-muted/50 cursor-default"
                : selectionMode
                  ? "hover:bg-muted/50 cursor-pointer"
                  : dragDisabled
                    ? "hover:bg-muted/50 cursor-default"
                    : "hover:bg-muted/50 cursor-grab active:cursor-grabbing"
            } ${dragStyle} ${dragDimmed ? "opacity-40 saturate-0" : ""} ${
              isDragging ? "opacity-0" : "opacity-100"
            }`}
            style={style}
            {...attributes}
            {...(selectionMode ? {} : listeners)}
            data-slot="bookmark-card"
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
                  className="size-10 shrink-0 flex items-center justify-center rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-transform duration-150 active:scale-95"
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
                    isEnriching={isEnriching}
                    needsRefresh={needsRefresh}
                    className="size-8"
                  />
                </a>
              )}

              <div className={textBlockClass}>
                <div className={titleRowClass}>
                  {status === "pending" ? (
                    <span className={`${truncatedTextClass} text-sm font-semibold`}>
                      {title || "Loading"}
                    </span>
                  ) : (
                    <a
                      className={`${truncatedTextClass} text-sm font-semibold cursor-pointer text-foreground group-hover:text-primary! hover:text-primary! transition-colors duration-200`}
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
                <div className={metaRowClass}>
                  {status === "pending" ? (
                    <span className={`${truncatedTextClass} text-xs font-medium text-muted-foreground`}>
                      {isEnriching ? "Fetching details" : "Pending"}
                    </span>
                  ) : isEnriching ? (
                    <span className={`${truncatedTextClass} text-xs font-medium text-muted-foreground`}>
                      Refreshing details
                    </span>
                  ) : (
                    <a
                      className={`${truncatedTextClass} text-xs font-medium cursor-pointer text-muted-foreground group-hover:text-muted-foreground`}
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
            <div className={`relative flex shrink-0 items-center justify-end ${actionLaneClass}`}>
              {/* Desktop Date: Fades out on hover if not mobile */}
              {status === "pending" ? (
                <span className="text-xs font-medium text-muted-foreground tabular-nums transition-opacity duration-200 group-hover:opacity-0">
                  {isEnriching ? "Enriching" : "Refresh needed"}
                </span>
              ) : isEnriching ? (
                <span className="text-xs font-medium text-muted-foreground tabular-nums transition-opacity duration-200 group-hover:opacity-0">
                  Refreshing
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
              {!selectionMode ? (
                <BookmarkActions
                  isCopied={isCopied}
                  isRefreshing={isEnriching}
                  onEdit={handleEdit}
                  onRefresh={handleRefresh}
                  onCopyLink={handleCopyLink}
                  onOpen={openInNewTab}
                  onPreview={() => onPreview?.(id)}
                  onDelete={handleDeleteRequest}
                  onBulkSelect={handleBulkSelect}
                  showBulkSelect={!selectionMode}
                  variant={layoutDensity}
                />
              ) : null}

              {/* Mobile Action Menu */}
              {!selectionMode ? (
                <MobileActionMenu
                  isCopied={isCopied}
                  isRefreshing={isEnriching}
                  onEdit={handleEdit}
                  onRefresh={handleRefresh}
                  onCopyLink={handleCopyLink}
                  onOpen={openInNewTab}
                  onPreview={() => onPreview?.(id)}
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
