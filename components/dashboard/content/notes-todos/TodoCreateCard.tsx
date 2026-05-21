import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { priorityConfig } from "./config"
import { PriorityPicker } from "./pickers"
import type { TodoPriority } from "./types"

export function TodoCreateCard({
  creating,
  setCreating,
  text,
  setText,
  priority,
  setPriority,
  isCreating,
  onCreate,
}: {
  creating: boolean
  setCreating: (v: boolean) => void
  text: string
  setText: (v: string) => void
  priority: TodoPriority
  setPriority: (v: TodoPriority) => void
  isCreating: boolean
  onCreate: () => void
}) {
  const priorityLabel = priorityConfig[priority]
  const [priorityPopoverOpen, setPriorityPopoverOpen] = useState(false)

  return (
    <div className="pt-3 mt-2 border-t border-border/40">
      {creating ? (
        <div className="relative mt-2 p-3 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0"
                    aria-label="Pick priority"
                    disabled={isCreating}
                  >
                    <span className={cn("text-[11px] font-semibold", priorityLabel.colorClass)}>
                      {priorityLabel.letter}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-3">
                  <PriorityPicker
                    value={priority}
                    onChange={(next) => {
                      setPriority(next)
                      setPriorityPopoverOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="New todo"
                className="h-8 text-sm rounded-xl"
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    onCreate()
                  } else if (e.key === "Escape") {
                    setCreating(false)
                    setText("")
                    setPriority("medium")
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-3 text-xs rounded-4xl font-bold cursor-pointer"
              onClick={() => {
                setCreating(false)
                setText("")
                setPriority("medium")
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs rounded-4xl cursor-pointer"
              onClick={onCreate}
              disabled={!text.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary/90 cursor-pointer active:scale-[0.97] transition-all duration-200"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Create todo
        </button>
      )}
    </div>
  )
}
