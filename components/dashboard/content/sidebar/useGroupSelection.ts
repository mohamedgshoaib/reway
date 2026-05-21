import { useCallback, useMemo, useState } from "react"
import type { GroupRow } from "@/lib/supabase/queries"

export function useGroupSelection({ groups }: { groups: GroupRow[] }) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  const selectedCount = selectedGroupIds.size

  const selectedGroups = useMemo(
    () => groups.filter((g) => selectedGroupIds.has(g.id)),
    [groups, selectedGroupIds],
  )

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true)
    setSelectedGroupIds(new Set())
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedGroupIds(new Set())
  }, [])

  const toggleSelected = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }, [])

  const requestBulkDelete = useCallback(() => {
    if (selectedGroups.length === 0) return
    setBulkDeleteDialogOpen(true)
  }, [selectedGroups.length])

  return {
    selectionMode,
    setSelectionMode,
    selectedGroupIds,
    setSelectedGroupIds,
    selectedCount,
    selectedGroups,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelected,
    requestBulkDelete,
  }
}
