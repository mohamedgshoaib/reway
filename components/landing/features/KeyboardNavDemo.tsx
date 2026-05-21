"use client"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

export function KeyboardNavDemo() {
  return (
    <div className="flex w-full justify-center">
      <div className="grid w-fit grid-cols-3 gap-6 text-[10px] text-muted-foreground sm:gap-4">
        {[
          { label: "Switch Group", keys: ["Shift", "A–Z"] },
          { label: "Move", keys: ["↑", "↓", "←", "→"] },
          { label: "Open", keys: ["⌘/Ctrl", "⏎"] },
          { label: "Preview", keys: ["Space"] },
          { label: "Bulk Delete", keys: ["Shift", "Click"] },
          { label: "Copy", keys: ["⏎"] },
        ].map((shortcut) => (
          <div key={shortcut.label} className="flex flex-col items-center gap-2">
            <KbdGroup className="gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key} className="h-5.5 min-w-5.5 px-1 text-[9px] font-sans">
                  {key}
                </Kbd>
              ))}
            </KbdGroup>
            <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
              {shortcut.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
