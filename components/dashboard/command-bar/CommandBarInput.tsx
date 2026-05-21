"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

function StatusSpinner() {
  return (
    <span
      className="inline-block size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
      aria-hidden="true"
    />
  )
}

interface CommandBarInputProps {
  mode: "add" | "search"
  searchQuery: string
  inputValue: string
  addStatus?: string | null
  isAddBusy?: boolean
  isFocused: boolean
  isMac: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onModeChange?: (mode: "add" | "search") => void
  onSearchChange?: (query: string) => void
  onInputValueChange: (value: string) => void
  onFocusChange: (focused: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

export function CommandBarInput({
  mode,
  searchQuery,
  inputValue,
  addStatus,
  isAddBusy = false,
  isFocused,
  isMac,
  inputRef,
  onModeChange,
  onSearchChange,
  onInputValueChange,
  onFocusChange,
  onSubmit,
}: CommandBarInputProps) {
  return (
    <div className="relative w-full" data-onboarding="command-bar">
      <form
        onSubmit={onSubmit}
        className={`group relative flex items-center justify-between gap-2 rounded-2xl px-1.5 py-1.5 ${
          isFocused
            ? "ring-1 ring-primary/30 after:ring-white/10"
            : "ring-1 ring-foreground/8 after:ring-white/5"
        } after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:pointer-events-none after:content-[''] shadow-none isolate`}
      >
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={mode === "search" ? searchQuery : inputValue}
            onChange={(e) => {
              if (mode === "search") {
                onSearchChange?.(e.target.value)
              } else {
                onInputValueChange(e.target.value)
              }
            }}
            placeholder={
              mode === "search"
                ? "Search bookmarks..."
                : mode === "add" && isAddBusy && addStatus
                  ? ""
                  : "Paste a link to save..."
            }
            className="w-full bg-transparent p-0 pl-1.5 text-sm font-medium outline-none placeholder:text-muted-foreground selection:bg-primary/20 disabled:opacity-50"
            disabled={mode === "add" && isAddBusy}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            aria-label="Paste link or search bookmarks"
          />
          {mode === "add" && isAddBusy && addStatus ? (
            <div className="pointer-events-none absolute inset-0 flex items-center gap-2 pl-1.5 text-sm font-medium text-muted-foreground">
              <StatusSpinner />
              <span className="truncate">{addStatus}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted/20 p-1 ring-1 ring-inset ring-foreground/5">
          <button
            type="button"
            onClick={() => onModeChange?.("add")}
            data-onboarding="add-bookmarks"
            className={`flex items-center gap-1 px-1.5 py-1 text-[11px] rounded-lg cursor-pointer ${
              mode === "add"
                ? "bg-muted/40 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-muted/40"
            }`}
            aria-pressed={mode === "add"}
            aria-label="Add bookmarks"
          >
            <span>Add</span>
            <KbdGroup className="hidden md:inline-flex">
              <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">{isMac ? "⌘K" : "CtrlK"}</Kbd>
            </KbdGroup>
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.("search")}
            data-onboarding="search-bookmarks"
            className={`flex items-center gap-1 px-1.5 py-1 text-[11px] rounded-lg cursor-pointer ${
              mode === "search"
                ? "bg-muted/40 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-muted/40"
            }`}
            aria-pressed={mode === "search"}
            aria-label="Search bookmarks"
          >
            <span>Search</span>
            <KbdGroup className="hidden md:inline-flex">
              <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">{isMac ? "⌘F" : "CtrlF"}</Kbd>
            </KbdGroup>
          </button>
        </div>
      </form>

      {!isFocused && !inputValue ? (
        <div className="absolute -bottom-6 left-1/2 hidden -translate-x-1/2 opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 md:block">
          <p className="text-[10px] font-bold uppercase text-muted-foreground/30">
            Press <span className="text-muted-foreground/50">{isMac ? "⌘F" : "CtrlF"}</span> to
            search · <span className="text-muted-foreground/50">{isMac ? "⌘K" : "CtrlK"}</span> to
            add
          </p>
        </div>
      ) : null}
    </div>
  )
}
