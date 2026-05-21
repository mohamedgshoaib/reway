"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"

interface UseExportHandlersOptions {
  bookmarks: BookmarkRow[]
  groups: GroupRow[]
}

export function useExportHandlers({ bookmarks, groups }: UseExportHandlersOptions) {
  const [exportProgress, setExportProgress] = useState({
    processed: 0,
    total: 0,
    status: "idle" as "idle" | "exporting" | "done" | "error",
  })

  const resetExportProgress = useCallback(() => {
    setExportProgress({ processed: 0, total: 0, status: "idle" })
  }, [])

  const handleExportBookmarks = useCallback(
    (selectedGroups: string[]) => {
      if (exportProgress.status === "exporting") return

      const allowed = new Set(selectedGroups)
      const groupNameById = new Map<string, string>()
      groups.forEach((g) => {
        groupNameById.set(g.id, g.name)
      })
      const grouped = new Map<string, BookmarkRow[]>()
      bookmarks.forEach((bookmark) => {
        const groupName = bookmark.group_id
          ? groupNameById.get(bookmark.group_id) || "Ungrouped"
          : "Ungrouped"
        if (!allowed.has(groupName)) return
        if (!grouped.has(groupName)) grouped.set(groupName, [])
        grouped.get(groupName)?.push(bookmark)
      })

      const groupNames = Array.from(grouped.keys())
      setExportProgress({
        processed: 0,
        total: groupNames.length,
        status: "exporting",
      })

      if (groupNames.length === 0) {
        setExportProgress({ processed: 0, total: 0, status: "idle" })
        toast.error("No bookmarks to export for the selected groups")
        return
      }

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")

      let html =
        "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n" +
        "<!-- This is an automatically generated file. -->\n" +
        '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n' +
        "<TITLE>Bookmarks</TITLE>\n" +
        "<H1>Bookmarks</H1>\n" +
        "<DL><p>\n" +
        '  <DT><H3 ADD_DATE="' +
        Math.floor(Date.now() / 1000) +
        '" LAST_MODIFIED="0">Reway Export</H3>\n' +
        "  <DL><p>\n"

      groupNames.forEach((groupName, index) => {
        const items = grouped.get(groupName) || []
        html += `    <DT><H3 ADD_DATE=\"${Math.floor(Date.now() / 1000)}\" LAST_MODIFIED=\"0\">${escapeHtml(groupName)}</H3>\n`
        html += "    <DL><p>\n"
        items.forEach((bookmark) => {
          html += `      <DT><A HREF=\"${escapeHtml(bookmark.url)}\">${escapeHtml(bookmark.title || bookmark.url)}</A>\n`
        })
        html += "    </DL><p>\n"
        if ((index + 1) % 10 === 0 || index + 1 === groupNames.length) {
          setExportProgress({
            processed: index + 1,
            total: groupNames.length,
            status: "exporting",
          })
        }
      })

      html += "  </DL><p>\n</DL><p>\n"

      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `reway-bookmarks-${new Date().toISOString().slice(0, 10)}.html`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setExportProgress({
        processed: groupNames.length,
        total: groupNames.length,
        status: "done",
      })

      toast.success(`Exported ${groupNames.length} group${groupNames.length === 1 ? "" : "s"}`)
    },
    [bookmarks, exportProgress.status, groups],
  )

  return { exportProgress, handleExportBookmarks, resetExportProgress }
}
