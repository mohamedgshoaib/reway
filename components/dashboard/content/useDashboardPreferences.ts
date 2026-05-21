"use client"

import { useEffect } from "react"
import { migrateLocalStorageToCookies, setPreferenceCookie } from "@/lib/cookies"
import {
  type DashboardPaletteTheme,
  DASHBOARD_THEMES,
  getPaletteThemeClassName,
} from "@/lib/themes"

export function useDashboardPreferences({
  viewModeAll,
  viewModeGroups,
  rowContent,
  showNotesTodos,
  layoutDensity,
  commandMode,
  paletteTheme,
  folderHeaderTint,
}: {
  viewModeAll: "list" | "card" | "folders"
  viewModeGroups: "list" | "card" | "folders"
  rowContent: "date" | "group"
  showNotesTodos: boolean
  layoutDensity: "compact" | "extended"
  commandMode: "add" | "search"
  paletteTheme: DashboardPaletteTheme
  folderHeaderTint: "off" | "low" | "medium" | "high"
}) {
  useEffect(() => {
    migrateLocalStorageToCookies()
  }, [])

  useEffect(() => {
    setPreferenceCookie("viewMode.all", viewModeAll)
  }, [viewModeAll])

  useEffect(() => {
    setPreferenceCookie("viewMode.groups", viewModeGroups)
  }, [viewModeGroups])

  useEffect(() => {
    setPreferenceCookie("rowContent", rowContent)
  }, [rowContent])

  useEffect(() => {
    setPreferenceCookie("showNotesTodos", showNotesTodos ? "true" : "false")
  }, [showNotesTodos])

  useEffect(() => {
    setPreferenceCookie("layoutDensity", layoutDensity)
  }, [layoutDensity])

  useEffect(() => {
    setPreferenceCookie("commandMode", commandMode)
  }, [commandMode])

  useEffect(() => {
    setPreferenceCookie("paletteTheme", paletteTheme)
  }, [paletteTheme])

  useEffect(() => {
    setPreferenceCookie("folderHeaderTint", folderHeaderTint)
  }, [folderHeaderTint])

  useEffect(() => {
    const root = document.body
    const dashboardRoot = document.querySelector("[data-dashboard-root]")
    const classToApply = getPaletteThemeClassName(paletteTheme)
    const knownClasses = DASHBOARD_THEMES.map((theme) =>
      getPaletteThemeClassName(theme.value),
    ).filter(Boolean)

    root.classList.remove(...knownClasses)
    if (dashboardRoot instanceof HTMLElement) {
      dashboardRoot.classList.remove(...knownClasses)
    }

    if (classToApply) {
      root.classList.add(classToApply)
      if (dashboardRoot instanceof HTMLElement) {
        dashboardRoot.classList.add(classToApply)
      }
    }

    return () => {
      root.classList.remove(...knownClasses)
      if (dashboardRoot instanceof HTMLElement) {
        dashboardRoot.classList.remove(...knownClasses)
      }
    }
  }, [paletteTheme])
}
