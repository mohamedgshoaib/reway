"use client"

import { memo, startTransition, useDeferredValue, useEffect, useRef, useState } from "react"
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

export const CommandBar = memo(function CommandBar({
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
  const [searchDraft, setSearchDraft] = useState(searchQuery)
  const [addStatus, setAddStatus] = useState<string | null>(null)
  const [isAddBusy, setIsAddBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const deferredSearchDraft = useDeferredValue(searchDraft)

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

  useEffect(() => {
    if (mode !== "search") {
      setSearchDraft(searchQuery)
      return
    }

    if (searchQuery === deferredSearchDraft) return

    startTransition(() => {
      onSearchChange?.(deferredSearchDraft)
    })
  }, [deferredSearchDraft, mode, onSearchChange, searchQuery])

  const handleModeChange = (nextMode: "add" | "search") => {
    if (nextMode === mode) return

    if (nextMode === "search") {
      setSearchDraft(inputValue)
    } else if (nextMode === "add") {
      setInputValue("")
      setSearchDraft("")
      onSearchChange?.("")
    }

    onModeChange?.(nextMode)
  }

  return (
    <CommandBarInput
      mode={mode}
      searchQuery={searchDraft}
      inputValue={inputValue}
      addStatus={addStatus}
      isAddBusy={isAddBusy}
      isFocused={isFocused}
      isMac={isMac}
      inputRef={inputRef}
      onModeChange={handleModeChange}
      onSearchChange={setSearchDraft}
      onInputValueChange={setInputValue}
      onFocusChange={setIsFocused}
      onSubmit={(e) => handleSubmit(e, mode, inputValue, searchDraft, setInputValue)}
    />
  )
})
