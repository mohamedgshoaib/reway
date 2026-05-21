import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React from "react"
import { Button as UIButton } from "@/components/ui/button"

export function SelectionModeHeader({
  selectedCount,
  onCancel,
  onDelete,
  disableDelete,
}: {
  selectedCount: number
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void
  disableDelete: boolean
}) {
  return (
    <div className="px-1 pb-2">
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
          <div className="flex items-center gap-2">
            <UIButton
              size="sm"
              variant="secondary"
              className="size-7 p-0 rounded-4xl font-bold cursor-pointer"
              onClick={onCancel}
              aria-label="Cancel selection"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </UIButton>
            <UIButton
              size="sm"
              variant="destructive"
              className="size-7 p-0 rounded-4xl cursor-pointer"
              onClick={onDelete}
              disabled={disableDelete}
              aria-label="Delete selected groups"
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} />
            </UIButton>
          </div>
        </div>
      </div>
    </div>
  )
}
