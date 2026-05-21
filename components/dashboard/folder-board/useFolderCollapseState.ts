import { useEffect, useState } from "react"

const COLLAPSE_STORAGE_KEY = "reway.folder.collapsed"

export function useFolderCollapseState() {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [isCollapseReady, setIsCollapseReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY)
      if (stored) {
        setCollapsedGroups(JSON.parse(stored))
      }
    } catch (error) {
      console.warn("Failed to load folder collapse state:", error)
    } finally {
      setIsCollapseReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isCollapseReady) return
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(collapsedGroups))
    } catch (error) {
      console.warn("Failed to persist folder collapse state:", error)
    }
  }, [collapsedGroups, isCollapseReady])

  return {
    collapsedGroups,
    setCollapsedGroups,
    isCollapseReady,
  }
}
