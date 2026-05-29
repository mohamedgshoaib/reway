"use client"

import { useVirtualizer } from "@tanstack/react-virtual"
import { type ReactNode, useCallback, useEffect, useMemo } from "react"

import { cn } from "@/lib/utils"

interface VirtualizedListProps<TItem> {
  items: TItem[]
  scrollElement: HTMLElement | null
  getItemKey: (item: TItem) => string
  estimateSize: (index: number) => number
  renderItem: (item: TItem, index: number) => ReactNode
  className?: string
  rowClassName?: string
  selectedIndex?: number
  overscan?: number
  gap?: number
}

export function VirtualizedList<TItem>({
  items,
  scrollElement,
  getItemKey,
  estimateSize,
  renderItem,
  className,
  rowClassName,
  selectedIndex = -1,
  overscan = 8,
  gap = 0,
}: VirtualizedListProps<TItem>) {
  const itemKeys = useMemo(() => items.map(getItemKey), [items, getItemKey])
  const getScrollElement = useCallback(() => scrollElement, [scrollElement])
  const getVirtualItemKey = useCallback(
    (index: number) => itemKeys[index] ?? index,
    [itemKeys],
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement,
    estimateSize,
    getItemKey: getVirtualItemKey,
    overscan,
    gap,
  })

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex >= items.length) return
    virtualizer.scrollToIndex(selectedIndex, { align: "auto" })
  }, [items.length, selectedIndex, virtualizer])

  return (
    <div className={className}>
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className={cn("absolute left-0 top-0 w-full will-change-transform", rowClassName)}
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
