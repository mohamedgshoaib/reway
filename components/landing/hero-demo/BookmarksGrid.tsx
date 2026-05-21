"use client"

import {
  ArrowUpRight03Icon,
  Copy01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "motion/react"
import { Favicon } from "@/components/dashboard/Favicon"

import TextShimmer from "@/components/ui/text-shimmer"
import type { HeroBookmark } from "./types"

export function BookmarksGrid({
  stableBookmarkSlots,
  copiedIndex,
  onCopy,
  onOpen,
  onEdit,
}: {
  stableBookmarkSlots: Array<
    { kind: "bookmark"; value: HeroBookmark } | { kind: "placeholder"; key: string }
  >
  copiedIndex: number | null
  onCopy: (event: React.MouseEvent, bookmarkUrl: string, index: number) => void
  onOpen: (event: React.MouseEvent, bookmarkUrl: string) => void
  onEdit: (event: React.MouseEvent) => void
}) {
  return (
    <div className="w-full grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 min-h-49">
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
          <motion.div
            key={slot.value.id}
            className={`group rounded-2xl bg-muted/20 p-4 ring-1 ring-foreground/8 transition-colors hover:bg-muted/30 cursor-pointer ${
              index >= 3 ? "hidden sm:block" : ""
            } ${index >= 6 ? "sm:hidden lg:block" : ""} h-26`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.22,
              ease: "easeOut",
              delay: index * 0.04,
            }}
          >
            <a
              href={slot.value.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
              aria-label={`Open ${slot.value.title}`}
            >
              <Favicon
                url={slot.value.favicon || ""}
                domain={slot.value.domain}
                title={slot.value.title}
                isEnriching={slot.value.shimmerUrl}
                className="h-9 w-9 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-base font-semibold leading-tight text-foreground group-hover:text-primary">
                  {slot.value.title}
                </p>
                {slot.value.shimmerUrl ? (
                  <TextShimmer as="p" className="block truncate text-xs font-medium" duration={2.5}>
                    {slot.value.url}
                  </TextShimmer>
                ) : (
                  <p className="truncate text-xs text-muted-foreground">{slot.value.domain}</p>
                )}
              </div>
            </a>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{slot.value.group}</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                  aria-label="Edit bookmark"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={12} />
                </button>
                <button
                  type="button"
                  onClick={(event) => onCopy(event, slot.value.url, index)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
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
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/60 transition-[background-color,transform] duration-200 ease-out hover:bg-background hover:text-primary active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                  aria-label="Open link"
                >
                  <HugeiconsIcon icon={ArrowUpRight03Icon} size={12} />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-xl transition-[color,background-color,transform] duration-200 ease-out text-destructive hover:bg-destructive/10 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                  aria-label="Delete bookmark"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ),
      )}
    </div>
  )
}
