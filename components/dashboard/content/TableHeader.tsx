"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

interface TableHeaderProps {
  viewMode: "list" | "card" | "folders"
  keyboardContext: "folder" | "bookmark"
  isMac: boolean
}

export function TableHeader({ viewMode, keyboardContext, isMac }: TableHeaderProps) {
  return (
    <div className="hidden md:flex items-center gap-6 px-5 pt-6 pb-3 text-[11px] font-medium text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <KbdGroup className="gap-0.5">
          {viewMode !== "list" ? (
            <>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">←</Kbd>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">↑</Kbd>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">↓</Kbd>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">→</Kbd>
            </>
          ) : (
            <>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">↑</Kbd>
              <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">↓</Kbd>
            </>
          )}
        </KbdGroup>
        <span>navigate</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd className="h-[18px] min-w-[18px] text-[10px] px-1.5">Space</Kbd>
        <span>preview</span>
      </div>
      <div className="flex items-center gap-1.5">
        <KbdGroup className="gap-0.5">
          <Kbd className="h-[18px] min-w-[18px] text-[10px] px-1.5">{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">⏎</Kbd>
        </KbdGroup>
        <span>
          {viewMode === "folders"
            ? keyboardContext === "folder"
              ? "open folder"
              : "open"
            : "open"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd className="h-[18px] min-w-[18px] text-[10px] px-0.5">⏎</Kbd>
        <span>copy</span>
      </div>
      <div className="flex items-center gap-1.5">
        <KbdGroup className="gap-0.5">
          <Kbd className="h-[18px] min-w-[18px] text-[10px] px-1">Shift</Kbd>
          <Kbd className="h-[18px] min-w-[18px] text-[10px] px-1">Click</Kbd>
        </KbdGroup>
        <span>bulk select</span>
      </div>
    </div>
  )
}
