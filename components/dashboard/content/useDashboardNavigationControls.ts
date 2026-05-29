"use client"

import { useCallback, useState } from "react"

export function useDashboardNavigationControls({
  importProgressStatus,
  handleClearImport,
  resetExportProgress,
}: {
  importProgressStatus: "idle" | "importing" | "stopping" | "done" | "error" | "stopped"
  handleClearImport: () => void
  resetExportProgress: () => void
}) {
  const [importSheetOpen, setImportSheetOpen] = useState(false)
  const [exportSheetOpen, setExportSheetOpen] = useState(false)
  const [duplicatesSheetOpen, setDuplicatesSheetOpen] = useState(false)
  const [enrichmentHealthSheetOpen, setEnrichmentHealthSheetOpen] = useState(false)
  const [notesTodosSheetOpen, setNotesTodosSheetOpen] = useState(false)
  const [selectedImportGroups, setSelectedImportGroups] = useState<string[]>([])
  const [selectedExportGroups, setSelectedExportGroups] = useState<string[]>([])

  const handleToggleImportGroup = useCallback((name: string) => {
    setSelectedImportGroups((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }, [])

  const handleToggleExportGroup = useCallback((name: string) => {
    setSelectedExportGroups((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    )
  }, [])

  const handleImportOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedImportGroups([])
        if (importProgressStatus !== "importing" && importProgressStatus !== "stopping") {
          handleClearImport()
        }
      }
      setImportSheetOpen(open)
    },
    [handleClearImport, importProgressStatus],
  )

  const handleExportOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedExportGroups([])
        resetExportProgress()
      }
      setExportSheetOpen(open)
    },
    [resetExportProgress],
  )

  const openImportSheet = useCallback(() => setImportSheetOpen(true), [])
  const openExportSheet = useCallback(() => setExportSheetOpen(true), [])
  const openDuplicatesSheet = useCallback(() => setDuplicatesSheetOpen(true), [])
  const openEnrichmentHealthSheet = useCallback(() => setEnrichmentHealthSheetOpen(true), [])

  return {
    importSheetOpen,
    exportSheetOpen,
    duplicatesSheetOpen,
    enrichmentHealthSheetOpen,
    notesTodosSheetOpen,
    selectedImportGroups,
    selectedExportGroups,
    setNotesTodosSheetOpen,
    setDuplicatesSheetOpen,
    setEnrichmentHealthSheetOpen,
    handleImportOpenChange,
    handleExportOpenChange,
    handleToggleImportGroup,
    handleToggleExportGroup,
    openImportSheet,
    openExportSheet,
    openDuplicatesSheet,
    openEnrichmentHealthSheet,
  }
}
