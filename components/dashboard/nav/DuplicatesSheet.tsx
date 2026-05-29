"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { deleteBookmarks } from "@/app/dashboard/actions/bookmarks"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DashboardLoadingState } from "@/components/dashboard/LoadingState"
import { normalizeUrl } from "@/lib/metadata"
import type { BookmarkRow } from "@/lib/supabase/queries"

interface DuplicatesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarks: BookmarkRow[]
  onRemoveBookmarks?: (ids: string[]) => void
}

export function DuplicatesSheet({
  open,
  onOpenChange,
  bookmarks,
  onRemoveBookmarks,
}: DuplicatesSheetProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [reviewedDuplicateGroups, setReviewedDuplicateGroups] = useState<
    { key: string; items: BookmarkRow[] }[]
  >([])
  const [reviewedDuplicateCount, setReviewedDuplicateCount] = useState(0)
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState<Set<string>>(() => new Set())

  const computeDuplicateReview = (items: BookmarkRow[]) => {
    const map = new Map<string, BookmarkRow[]>()
    for (const b of items) {
      const key = (() => {
        const raw = (b.normalized_url || b.url || "").trim()
        if (!raw) return ""
        if (b.normalized_url) return raw
        try {
          return normalizeUrl(raw)
        } catch {
          return raw
        }
      })()
      if (!key) continue
      const list = map.get(key)
      if (list) list.push(b)
      else map.set(key, [b])
    }

    const dupes: { key: string; items: BookmarkRow[] }[] = []
    for (const [key, groupItems] of map.entries()) {
      if (groupItems.length > 1) {
        groupItems.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
        dupes.push({ key, items: groupItems })
      }
    }
    dupes.sort((a, b) => b.items.length - a.items.length)

    let count = 0
    const defaultIds: string[] = []
    for (const g of dupes) {
      count += Math.max(0, g.items.length - 1)
      const [, ...rest] = g.items
      rest.forEach((b) => defaultIds.push(b.id))
    }

    return { dupes, count, defaultIds }
  }

  const review = useMemo(() => computeDuplicateReview(bookmarks), [bookmarks])

  useEffect(() => {
    if (!open) return

    // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setIsReviewing(true)
    // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setReviewedDuplicateGroups([])
    // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setReviewedDuplicateCount(0)
    // react-doctor-disable-next-line react-doctor/no-adjust-state-on-prop-change
    setSelectedDuplicateIds(new Set())

    const id = window.setTimeout(() => {
      setReviewedDuplicateGroups(review.dupes)
      setReviewedDuplicateCount(review.count)
      setSelectedDuplicateIds(new Set(review.defaultIds))
      setIsReviewing(false)
    }, 0)

    return () => window.clearTimeout(id)
  }, [open, review.count, review.defaultIds, review.dupes])

  const toggleDuplicateSelected = (id: string) => {
    setSelectedDuplicateIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    const ids: string[] = []
    for (const group of reviewedDuplicateGroups) {
      const [, ...rest] = group.items
      rest.forEach((b) => ids.push(b.id))
    }
    setSelectedDuplicateIds(new Set(ids))
  }

  const handleClearAll = () => {
    setSelectedDuplicateIds(new Set())
  }

  const handleCleanDuplicates = async () => {
    if (isCleaning) return
    if (selectedDuplicateIds.size === 0) return

    const idsToDelete = Array.from(selectedDuplicateIds)

    setIsCleaning(true)
    try {
      onRemoveBookmarks?.(idsToDelete)
      toast.success("Deleting duplicates…")
      await deleteBookmarks(idsToDelete)
      toast.success("Duplicates removed")
      onOpenChange(false)
    } catch (error) {
      console.error("Cleanup duplicates failed:", error)
      toast.error("Failed to remove duplicates")
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg p-0">
        <SheetHeader>
          <SheetTitle>Duplicate links</SheetTitle>
          <SheetDescription>Review and select which duplicates to delete.</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {isReviewing ? (
            <div className="text-sm text-muted-foreground">
              <DashboardLoadingState label="Reviewing" />
            </div>
          ) : reviewedDuplicateCount === 0 ? (
            <div className="text-sm text-muted-foreground">No duplicates found.</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedDuplicateIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg cursor-pointer"
                    onClick={handleSelectAll}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg cursor-pointer"
                    disabled={selectedDuplicateIds.size === 0}
                    onClick={handleClearAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {reviewedDuplicateGroups.map((group) => (
                  <div
                    key={group.key}
                    className="rounded-lg border border-border/60 bg-muted/10 p-2"
                  >
                    <div className="text-[11px] font-semibold truncate">{group.key}</div>
                    <div className="mt-2 space-y-1">
                      {group.items.map((b, index) => {
                        const isDeletable = index > 0
                        const checked = selectedDuplicateIds.has(b.id)
                        return (
                          <label
                            key={b.id}
                            className="flex items-center gap-2 text-[11px] text-muted-foreground"
                          >
                            <Checkbox
                              disabled={!isDeletable}
                              checked={isDeletable ? checked : false}
                              onCheckedChange={() => {
                                if (!isDeletable) return
                                toggleDuplicateSelected(b.id)
                              }}
                            />
                            <span className="truncate">
                              {b.title || b.url}
                              {!isDeletable ? " (keep)" : ""}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetBody>

        <SheetFooter className="gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full rounded-lg cursor-pointer"
                disabled={selectedDuplicateIds.size === 0 || isCleaning}
              >
                {isCleaning ? <DashboardLoadingState label="Deleting" /> : "Delete selected"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete selected duplicates?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete {selectedDuplicateIds.size} bookmark
                  {selectedDuplicateIds.size === 1 ? "" : "s"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-lg cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="rounded-lg cursor-pointer"
                  onClick={(event) => {
                    event.preventDefault()
                    void handleCleanDuplicates()
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant="secondary"
            className="w-full rounded-lg cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
