"use client"

import { startTransition, useRef, useState } from "react"
import { useIsMac } from "@/hooks/useIsMac"
import { BookmarkRow } from "@/lib/supabase/queries"
import { CommandBarInput } from "./command-bar/CommandBarInput"
import { useCommandHandlers } from "./command-bar/useCommandHandlers"
import type { EnrichmentResult } from "./content/dashboard-types"

interface CommandBarProps {
  onAddBookmark: (bookmark: BookmarkRow) => void
  onApplyEnrichment?: (id: string, enrichment?: EnrichmentResult) => void
  onReplaceBookmarkId?: (stableId: string, actualId: string) => void
  activeGroupId: string
  mode?: "add" | "search"
  searchQuery?: string
  onModeChange?: (mode: "add" | "search") => void
  onSearchChange?: (query: string) => void
}

export function CommandBar({
  onAddBookmark,
  onApplyEnrichment,
  onReplaceBookmarkId,
  activeGroupId,
  mode = "add",
  searchQuery = "",
  onModeChange,
  onSearchChange,
}: CommandBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [addStatus, setAddStatus] = useState<string | null>(null)
  const [isAddBusy, setIsAddBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect OS for keyboard shortcuts
  const isMac = useIsMac()

  const { handleSubmit } = useCommandHandlers({
    onAddBookmark,
    onApplyEnrichment,
    onReplaceBookmarkId,
    onModeChange,
    onSearchChange,
    activeGroupId,
    inputRef,
    onAddStatusChange: setAddStatus,
    onAddBusyChange: setIsAddBusy,
  })

  const handleModeChange = (nextMode: "add" | "search") => {
    if (nextMode === mode) return

    if (nextMode === "search") {
      startTransition(() => {
        onSearchChange?.(inputValue)
      })
    } else if (nextMode === "add") {
      setInputValue(searchQuery)
      startTransition(() => {
        onSearchChange?.("")
      })
    }

    onModeChange?.(nextMode)
  }

  return (
    <CommandBarInput
      mode={mode}
      searchQuery={searchQuery}
      inputValue={inputValue}
      addStatus={addStatus}
      isAddBusy={isAddBusy}
      isFocused={isFocused}
      isMac={isMac}
      inputRef={inputRef}
      onModeChange={handleModeChange}
      onSearchChange={onSearchChange}
      onInputValueChange={setInputValue}
      onFocusChange={setIsFocused}
      onSubmit={(e) => handleSubmit(e, mode, inputValue, searchQuery, setInputValue)}
    />
  )
}
