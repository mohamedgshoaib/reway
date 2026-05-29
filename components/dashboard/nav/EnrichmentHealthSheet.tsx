"use client"

import { Alert02Icon, Refresh01Icon, Wrench01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LoadingBarsIcon } from "@/components/dashboard/LoadingState"
import type { BookmarkRow } from "@/lib/supabase/queries"
import { getDomain } from "@/lib/utils"
import {
  formatEnrichmentAge,
  getCreatedAge,
  getEnrichmentHealthSummary,
  isStuck,
  needsFailedAttention,
  needsRefresh,
} from "./enrichment-health"

const DETAIL_LOAD_LIMIT = 20

interface EnrichmentHealthSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarks: BookmarkRow[]
  onRefreshBookmark: (id: string) => Promise<void>
  onLoadBookmarkDetails: (id: string) => Promise<BookmarkRow | null>
  onSelectBookmarks: (ids: string[]) => void
}

export function EnrichmentHealthSheet({
  open,
  onOpenChange,
  bookmarks,
  onRefreshBookmark,
  onLoadBookmarkDetails,
  onSelectBookmarks,
}: EnrichmentHealthSheetProps) {
  const [now, setNow] = useState(() => Date.now())
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(() => new Set())
  const loadedDetailIdsRef = useRef<Set<string>>(new Set())
  const onLoadBookmarkDetailsRef = useRef(onLoadBookmarkDetails)

  useEffect(() => {
    onLoadBookmarkDetailsRef.current = onLoadBookmarkDetails
  }, [onLoadBookmarkDetails])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const summary = useMemo(() => getEnrichmentHealthSummary(bookmarks, now), [bookmarks, now])

  const actionableBookmarks = useMemo(
    () =>
      bookmarks
        .filter(
          (bookmark) =>
            needsRefresh(bookmark) || needsFailedAttention(bookmark) || isStuck(bookmark, now),
        )
        .toSorted((a, b) => {
          const aFailed = needsFailedAttention(a)
          const bFailed = needsFailedAttention(b)
          if (aFailed && !bFailed) return -1
          if (!aFailed && bFailed) return 1
          return getCreatedAge(b, now) - getCreatedAge(a, now)
        }),
    [bookmarks, now],
  )

  useEffect(() => {
    if (!open) return

    const failedWithoutDetails: BookmarkRow[] = []
    for (const bookmark of actionableBookmarks) {
      if (failedWithoutDetails.length >= DETAIL_LOAD_LIMIT) break
      if (!needsFailedAttention(bookmark) || loadedDetailIdsRef.current.has(bookmark.id)) continue
      failedWithoutDetails.push(bookmark)
    }

    for (const bookmark of failedWithoutDetails) {
      loadedDetailIdsRef.current.add(bookmark.id)
      void onLoadBookmarkDetailsRef.current(bookmark.id)
    }
  }, [actionableBookmarks, open])

  const refreshOne = async (id: string) => {
    setRefreshingIds((prev) => new Set(prev).add(id))
    try {
      await onRefreshBookmark(id)
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const refreshActionable = async () => {
    const ids: string[] = []
    for (const bookmark of actionableBookmarks) {
      if (!bookmark.is_enriching) ids.push(bookmark.id)
    }

    if (ids.length === 0) return

    await Promise.all(ids.map(refreshOne))
    toast.success(`Retrying ${ids.length} bookmark${ids.length === 1 ? "" : "s"}`)
  }

  const selectActionable = () => {
    const ids = actionableBookmarks.map((bookmark) => bookmark.id)
    if (ids.length === 0) return

    onSelectBookmarks(ids)
    onOpenChange(false)
  }

  const hasWork = summary.active > 0 || summary.needsRefresh > 0 || summary.failed > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={Wrench01Icon} size={18} />
            Enrichment health
          </SheetTitle>
          <SheetDescription>
            Metadata should keep improving after saves and imports. Review anything that stalls.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-muted/20 p-3 ring-1 ring-foreground/8">
              <div className="text-[11px] font-medium text-muted-foreground">Active</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{summary.active}</div>
            </div>
            <div className="rounded-xl bg-muted/20 p-3 ring-1 ring-foreground/8">
              <div className="text-[11px] font-medium text-muted-foreground">Refresh</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {summary.needsRefresh}
              </div>
            </div>
            <div className="rounded-xl bg-muted/20 p-3 ring-1 ring-foreground/8">
              <div className="text-[11px] font-medium text-muted-foreground">Stuck</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{summary.stuck}</div>
            </div>
            <div className="rounded-xl bg-muted/20 p-3 ring-1 ring-foreground/8">
              <div className="text-[11px] font-medium text-muted-foreground">Failed</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{summary.failed}</div>
            </div>
          </section>

          {summary.active > 0 ? (
            <div className="rounded-xl bg-muted/15 px-3 py-2 text-xs text-muted-foreground ring-1 ring-foreground/8">
              Oldest active enrichment:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatEnrichmentAge(summary.oldestActiveAge)}
              </span>
            </div>
          ) : null}

          {!hasWork ? (
            <div className="rounded-xl bg-muted/15 px-3 py-4 text-sm text-muted-foreground ring-1 ring-foreground/8">
              Everything looks settled.
            </div>
          ) : null}

          {actionableBookmarks.length > 0 ? (
            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="shrink-0 whitespace-nowrap text-sm font-semibold">
                  Needs attention
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg cursor-pointer"
                    onClick={selectActionable}
                  >
                    Select affected
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-lg cursor-pointer"
                    disabled={refreshingIds.size > 0}
                    onClick={refreshActionable}
                  >
                    Retry all
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {actionableBookmarks.map((bookmark) => {
                  const stuck = isStuck(bookmark, now)
                  const refreshNeeded = needsRefresh(bookmark)
                  const failed = needsFailedAttention(bookmark)
                  const refreshing = refreshingIds.has(bookmark.id) || Boolean(bookmark.is_enriching)

                  return (
                    <article
                      key={bookmark.id}
                      className="rounded-xl bg-muted/15 p-3 ring-1 ring-foreground/8"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-semibold">
                            {bookmark.title || bookmark.url}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {getDomain(bookmark.url)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-lg cursor-pointer"
                          disabled={refreshing}
                          onClick={() => void refreshOne(bookmark.id)}
                          aria-label="Retry enrichment"
                        >
                          {refreshing ? (
                            <LoadingBarsIcon />
                          ) : (
                            <HugeiconsIcon icon={Refresh01Icon} size={16} />
                          )}
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                        {failed ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-destructive">
                            <HugeiconsIcon icon={Alert02Icon} size={13} />
                            Failed
                          </span>
                        ) : null}
                        {refreshNeeded ? (
                          <span className="rounded-lg bg-sky-500/10 px-2 py-1 text-sky-500">
                            Refresh needed
                          </span>
                        ) : null}
                        {stuck ? (
                          <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-amber-500">
                            Stuck {formatEnrichmentAge(getCreatedAge(bookmark, now))}
                          </span>
                        ) : null}
                      </div>

                      {failed ? (
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                          {bookmark.error_reason || "No error detail was recorded for this bookmark."}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          ) : null}
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
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
