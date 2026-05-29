"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Refresh01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { recordBookmarkVisit } from "@/lib/bookmark-visits"
import { GroupRow } from "@/lib/supabase/queries"
import { Favicon } from "./Favicon"
import { BookmarkContextMenu } from "./sortable-bookmark/BookmarkContextMenu"

interface SortableBookmarkCardProps {
  id: string
  title: string
  url: string
  domain: string
  status?: string
  favicon?: string
  isEnriching?: boolean
  createdAt: string
  groupId: string
  rowContent?: "date" | "group"
  groupsMap?: Map<string, GroupRow>
  activeGroupId?: string
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

export const SortableBookmarkCard = memo(function SortableBookmarkCard({
  id,
  title,
  url,
  domain,
  status = "ready",
  favicon,
  isEnriching = false,
  createdAt,
  groupId,
  rowContent = "date",
  groupsMap,
  activeGroupId,
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
}: SortableBookmarkCardProps) {
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

  const metaLabel =
    rowContent === "group" && activeGroupId !== "all" && activeGroupId === groupId
      ? createdAt
      : rowContent === "group"
        ? groupsMap?.get(groupId)?.name || "No Group"
        : createdAt

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
      setIsCopied(true)
      toast.success("URL copied to clipboard")
      setTimeout(() => setIsCopied(false), 2000)
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

  const handleBulkSelect = () => {
    if (selectionMode) return
    onEnterSelectionMode?.()
    onToggleSelection?.(id)
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

  const needsRefresh = status === "pending" && !isEnriching

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            style={{ ...style, contentVisibility: "auto" }}
            {...attributes}
            {...(selectionMode ? {} : listeners)}
            data-slot="bookmark-card"
            className={`group relative flex flex-col gap-3 rounded-2xl bg-muted/20 p-3 ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate hover:bg-muted/30 overflow-hidden ${
              selectionMode
                ? "cursor-pointer"
                : dragDisabled
                  ? "cursor-default"
                  : isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
            } ${
              isSelectionChecked || isSelected ? "ring-2 ring-primary/30" : ""
            } ${dragDimmed ? "opacity-40 saturate-0" : ""} ${isDragging ? "opacity-0" : ""}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {selectionMode ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleSelection?.(id)
                  }}
                  className="size-8 shrink-0 flex items-center justify-center rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-transform duration-150 active:scale-95"
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

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground transition-colors duration-200 group-hover:text-primary! hover:text-primary!">
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
                    {title}
                  </a>
                </p>
                <p className="truncate text-xs text-muted-foreground">
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
                    {domain}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[70%] transition-opacity duration-200 md:group-hover:opacity-0">
                {needsRefresh ? "Refresh needed" : isEnriching ? "Refreshing..." : metaLabel}
              </span>
              <div
                role="presentation"
                className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
                  onClick={handleEdit}
                  aria-label="Edit bookmark"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
                  onClick={handleRefresh}
                  aria-label={isEnriching ? "Refreshing metadata" : "Refresh metadata"}
                  disabled={isEnriching}
                >
                  <HugeiconsIcon
                    icon={Refresh01Icon}
                    size={14}
                    className={isEnriching ? "animate-spin" : ""}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
                  onClick={handleCopy}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg hover:bg-background hover:text-primary cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none"
                  onClick={handleOpen}
                  aria-label="Open link"
                >
                  <HugeiconsIcon icon={ArrowUpRight03Icon} size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg transition-transform duration-150 ease-out cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-[0.97] motion-reduce:transition-none"
                  onClick={handleDeleteRequest}
                  aria-label="Delete bookmark"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </Button>
              </div>
            </div>
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
