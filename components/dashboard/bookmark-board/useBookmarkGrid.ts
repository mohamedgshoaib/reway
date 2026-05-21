"use client"

import { useEffect, useState } from "react"

interface UseBookmarkGridOptions {
  viewMode: "list" | "card"
  isGridView: boolean
  minItemWidth?: number
  boardRef: React.RefObject<HTMLDivElement | null>
}

export function useBookmarkGrid({
  viewMode,
  isGridView,
  minItemWidth,
  boardRef,
}: UseBookmarkGridOptions) {
  const [gridColumns, setGridColumns] = useState(1)

  useEffect(() => {
    if (!boardRef.current || !isGridView) return

    const updateColumns = () => {
      const width = boardRef.current?.clientWidth || 0
      const gap = 12
      const minCardWidth = minItemWidth ?? 120
      const columns = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)))
      setGridColumns(columns)
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(boardRef.current)
    return () => {
      observer.disconnect()
    }
  }, [viewMode, isGridView, boardRef, minItemWidth])

  return gridColumns
}
