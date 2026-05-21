import { useEffect, useRef, useState } from "react"

export function useFolderGridColumns(options: {
  isExtendedFolderGrid: boolean
  selectedFolderId: string | null
}) {
  const { isExtendedFolderGrid, selectedFolderId } = options

  const [gridColumns, setGridColumns] = useState(1)
  const [folderGridColumns, setFolderGridColumns] = useState(1)

  const foldersGridRef = useRef<HTMLDivElement | null>(null)
  const activeGridRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isExtendedFolderGrid) return

    const target = foldersGridRef.current
    if (!target) return

    const updateColumns = () => {
      const width = target.clientWidth || 0
      const gap = 24
      const minFolderWidth = 420
      const columns = Math.max(1, Math.floor((width + gap) / (minFolderWidth + gap)))
      setFolderGridColumns(columns)
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(target)
    return () => observer.disconnect()
  }, [isExtendedFolderGrid])

  useEffect(() => {
    if (!selectedFolderId) return

    const target = activeGridRef.current
    if (!target) return

    const updateColumns = () => {
      const width = target.clientWidth || 0
      const gap = 12
      const minCardWidth = 120
      const columns = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)))
      setGridColumns(columns)
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(target)
    return () => {
      observer.disconnect()
    }
  }, [selectedFolderId])

  return {
    gridColumns,
    folderGridColumns: isExtendedFolderGrid ? folderGridColumns : 1,
    foldersGridRef,
    activeGridRef,
    setGridColumns,
  }
}
