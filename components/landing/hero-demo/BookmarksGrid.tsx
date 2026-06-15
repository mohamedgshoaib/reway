"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { m, AnimatePresence } from "motion/react"
import { Favicon } from "@/components/dashboard/Favicon"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"

import TextShimmer from "@/components/ui/text-shimmer"
import type { HeroBookmark } from "./types"

// Container owns the stagger — fires once when inView flips true, never again.
// Individual cards inherit the variant and enter without per-card delay.
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
}

// Card enter/hidden — no transition here; each card gets its own via variants.visible.
const cardVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.27, ease: [0.2, 0, 0, 1] as [number, number, number, number] },
  },
}

function BookmarkFavicon({ bookmark }: { bookmark: HeroBookmark }) {
  if (bookmark.shimmerUrl) {
    return (
      <Favicon
        url={bookmark.favicon || ""}
        domain={bookmark.domain}
        title={bookmark.title}
        isEnriching
        className="size-9 shrink-0"
      />
    )
  }

  if (bookmark.faviconIcon) {
    const Icon = bookmark.faviconIcon
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 22 }}
        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background overflow-hidden"
      >
        <Icon className="size-6" />
      </m.div>
    )
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.80 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className="shrink-0"
    >
      <Favicon
        url={bookmark.favicon || ""}
        domain={bookmark.domain}
        title={bookmark.title}
        className="size-9 shrink-0"
      />
    </m.div>
  )
}

export function BookmarksGrid({
  stableBookmarkSlots,
  copiedIndex,
  onCopy,
  onOpen,
  onEdit,
  inView,
}: {
  stableBookmarkSlots: Array<
    { kind: "bookmark"; value: HeroBookmark } | { kind: "placeholder"; key: string }
  >
  copiedIndex: number | null
  onCopy: (event: React.MouseEvent, bookmarkUrl: string, index: number) => void
  onOpen: (event: React.MouseEvent, bookmarkUrl: string) => void
  onEdit: (event: React.MouseEvent) => void
  inView: boolean
}) {
  return (
    <RewayLazyMotion>
      {/* Grid is the stagger orchestrator — drives hidden→visible once */}
      <m.div
        className="w-full grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 min-h-49"
        variants={gridVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {/* popLayout pops the exiting card to absolute so grid reflows immediately
            without adding a phantom extra row. No layout prop on cards = no FLIP
            side-effects on survivors. */}
        <AnimatePresence mode="popLayout">
          {stableBookmarkSlots.map((slot, index) =>
            slot.kind === "placeholder" ? (
              <div
                key={slot.key}
                className={`rounded-2xl bg-muted/10 p-4 ring-1 ring-foreground/8 opacity-0 ${
                  index >= 3 ? "hidden sm:block" : ""
                } ${index >= 6 ? "sm:hidden lg:block" : ""} h-26`}
                aria-hidden="true"
              />
            ) : (
              <m.div
                key={slot.value.id}
                variants={cardVariants}
                exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
                className={`group rounded-2xl bg-muted/20 p-4 ring-1 ring-foreground/8 transition-colors hover:bg-muted/30 cursor-pointer ${
                  index >= 3 ? "hidden sm:block" : ""
                } ${index >= 6 ? "sm:hidden lg:block" : ""} h-26`}
              >
                <a
                  href={slot.value.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
                  aria-label={`Open ${slot.value.title}`}
                >
                  <BookmarkFavicon bookmark={slot.value} />
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.p
                        key={
                          slot.value.shimmerUrl
                            ? `title-shim-${slot.value.id}`
                            : `title-done-${slot.value.id}`
                        }
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          y: -6,
                          transition: { duration: 0.1, ease: [0.3, 0, 1, 1] },
                        }}
                        transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                        className="line-clamp-1 text-base font-semibold leading-tight text-foreground group-hover:text-primary"
                      >
                        {slot.value.title}
                      </m.p>
                    </AnimatePresence>
                    {slot.value.shimmerUrl ? (
                      <TextShimmer
                        as="p"
                        className="block truncate text-xs font-medium"
                        duration={2.5}
                      >
                        {slot.value.url}
                      </TextShimmer>
                    ) : (
                      <m.p
                        key={`d-${slot.value.id}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0, 0, 1], delay: 0.1 }}
                        className="truncate text-xs text-muted-foreground"
                      >
                        {slot.value.domain}
                      </m.p>
                    )}
                  </div>
                </a>
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  {slot.value.shimmerUrl ? (
                    <TextShimmer as="span" className="text-[10px] font-medium" duration={2.25}>
                      Enriching…
                    </TextShimmer>
                  ) : (
                    <m.span
                      key={`g-${slot.value.id}`}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    >
                      {slot.value.group}
                    </m.span>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex size-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      aria-label="Edit bookmark"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => onCopy(event, slot.value.url, index)}
                      className="flex size-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      aria-label="Copy link"
                    >
                      <HugeiconsIcon
                        icon={copiedIndex === index ? Tick01Icon : Copy01Icon}
                        size={12}
                        className={copiedIndex === index ? "text-green-500" : ""}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => onOpen(event, slot.value.url)}
                      className="flex size-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      aria-label="Open link"
                    >
                      <HugeiconsIcon icon={ArrowUpRight03Icon} size={12} />
                    </button>
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-200 ease-out text-destructive hover:bg-destructive/10 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      aria-label="Delete bookmark"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </button>
                  </div>
                </div>
              </m.div>
            ),
          )}
        </AnimatePresence>
      </m.div>
    </RewayLazyMotion>
  )
}
