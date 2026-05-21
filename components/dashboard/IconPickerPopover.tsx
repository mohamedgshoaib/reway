"use client"

import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { ColorPicker } from "@/components/ui/color-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ICON_CATEGORIES } from "@/lib/hugeicons-list"

export interface IconPickerPopoverProps {
  selectedIcon: string
  onIconSelect: (iconName: string) => void
  color?: string | null
  onColorChange?: (color: string) => void
  children: React.ReactNode
}

export function IconPickerPopover({
  selectedIcon,
  onIconSelect,
  color,
  onColorChange,
  children,
}: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleIconSelect = (iconName: string) => {
    onIconSelect(iconName)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 ring-foreground/8 bg-popover rounded-2xl ring-1 last:relative after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none shadow-none isolate"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="px-3 pt-3 pb-2 border-b border-border/10 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground">Choose Icon</h4>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground/40 hover:text-foreground/70 transition-colors p-0.5 rounded-md cursor-pointer"
            aria-label="Close icon picker"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
        <ScrollArea className="h-70">
          <div className="p-3 space-y-4">
            {onColorChange ? (
              <div className="space-y-2">
                <h5 className="text-[10px] font-semibold uppercase text-muted-foreground/50 px-1">
                  Color Picker
                </h5>
                <div className="flex items-center gap-3 px-1">
                  <ColorPicker
                    value={color || "#6366f1"}
                    onChange={onColorChange}
                    aria-label="Pick group color"
                    className="size-7 rounded-full"
                  />
                </div>
              </div>
            ) : null}
            {ICON_CATEGORIES.map((category) => (
              <div key={category.name} className="space-y-2">
                <h5 className="text-[10px] font-semibold uppercase text-muted-foreground/50 px-1">
                  {category.name}
                </h5>
                <div className="grid grid-cols-7 gap-1.5">
                  {category.icons.map(({ name: iconName, icon: Icon }) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => handleIconSelect(iconName)}
                      title={iconName}
                      className={`flex size-9 items-center justify-center rounded-lg transition-transform duration-150 cursor-pointer ${
                        selectedIcon === iconName
                          ? "bg-primary text-primary-foreground scale-105"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary/90 hover:scale-105"
                      }`}
                    >
                      <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
