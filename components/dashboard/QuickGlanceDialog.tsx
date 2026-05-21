"use client"

import {
  PencilEdit01Icon,
  Delete02Icon,
  Copy01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import NextImage from "next/image"
import React from "react"
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { recordBookmarkVisit } from "@/lib/bookmark-visits"
import { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import { getDomain } from "@/lib/utils"
import { Favicon } from "./Favicon"

interface QuickGlanceDialogProps {
  bookmark: BookmarkRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (bookmark: BookmarkRow) => void
  onDelete: (id: string) => void
  groups: GroupRow[]
}

export function QuickGlanceDialog({
  bookmark,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  groups,
}: QuickGlanceDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  React.useEffect(() => {
    setDeleteDialogOpen(false)
  }, [bookmark?.id, open])

  const handleDeleteRequest = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(bookmark?.id || "")
    setDeleteDialogOpen(false)
    onOpenChange(false)
  }

  if (!bookmark) return null

  const domain = getDomain(bookmark.url)
  const dateFormatted = new Date(bookmark.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url)
    toast.success("URL copied to clipboard")
  }

  const handleOpenUrl = () => {
    recordBookmarkVisit(bookmark.id)
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  const group = groups.find((g) => g.id === bookmark.group_id)
  const previewImageUrl = bookmark.og_image_url || bookmark.image_url || null

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-125 p-0 overflow-hidden bg-background rounded-4xl focus:outline-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Bookmark Preview: {bookmark.title}</DialogTitle>
          <DialogDescription className="sr-only">
            A quick preview of the bookmark titled {bookmark.title}
          </DialogDescription>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground/90">Quick glance</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground/40 hover:text-primary/90 p-1"
                aria-label="Close dialog"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-6">
              {/* Top Info Area */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Favicon
                    url={bookmark.favicon_url || ""}
                    domain={domain}
                    title={bookmark.title}
                    className="size-10 rounded-lg border-border/50 shrink-0 mt-1"
                  />
                  <div className="flex flex-col min-w-0 gap-1.5">
                    <h3 className="text-lg font-semibold text-foreground leading-snug wrap-break-word">
                      {bookmark.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground font-medium">
                      <span>{domain}</span>

                      {group && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                          <div
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: group.color || "#6366f1",
                            }}
                          />
                          <span className="text-[11px] font-semibold text-foreground/70">
                            {group.name}
                          </span>
                        </div>
                      )}

                      <span className="tabular-nums opacity-60">{dateFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg text-muted-foreground hover:text-primary/90"
                    onClick={() => onEdit(bookmark)}
                    aria-label="Edit bookmark"
                  >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-lg text-muted-foreground hover:text-destructive"
                    onClick={handleDeleteRequest}
                    title="Delete"
                    aria-label="Delete bookmark"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </Button>
                </div>
              </div>

              {/* Preview Image */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted/20 border border-border/50">
                {previewImageUrl ? (
                  <NextImage
                    src={previewImageUrl}
                    alt={bookmark.title}
                    fill
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-8 bg-muted/5">
                    <Favicon
                      url={bookmark.favicon_url || ""}
                      domain={domain}
                      title={bookmark.title}
                      className="size-12 border-0 shadow-none bg-transparent opacity-20"
                    />
                  </div>
                )}
              </div>

              {/* Description Area */}
              {bookmark.description && (
                <p className="text-[14px] leading-relaxed text-muted-foreground font-medium line-clamp-4">
                  {bookmark.description}
                </p>
              )}

              {/* Subtle Separator */}
              <div className="h-px w-full bg-border/40" />

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="secondary"
                  className="h-9 px-4 rounded-xl text-[13px] font-semibold gap-2"
                  onClick={handleCopyUrl}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={16} />
                  Copy URL
                </Button>
                <Button
                  variant="default"
                  className="h-9 px-6 rounded-xl text-[13px] font-semibold gap-2"
                  onClick={handleOpenUrl}
                >
                  <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
}
