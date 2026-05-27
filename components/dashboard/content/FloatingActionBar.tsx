"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FloatingActionBarProps {
  selectedCount: number
  groups: { id: string; name: string }[]
  onOpenSelected: () => void
  onRefreshSelected: () => Promise<void>
  onBulkDelete: () => void
  onMoveSelectedToGroup: (groupId: string | null) => Promise<void>
  onCancelSelection: () => void
}

export function FloatingActionBar({
  selectedCount,
  groups,
  onOpenSelected,
  onRefreshSelected,
  onBulkDelete,
  onMoveSelectedToGroup,
  onCancelSelection,
}: FloatingActionBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moveValue, setMoveValue] = useState<string | undefined>(undefined)
  const [isMoving, setIsMoving] = useState(false)

  const moveOptions = [
    { id: "no-group", name: "No Group" },
    ...groups.flatMap((group) =>
      group.id !== "no-group" ? [{ id: group.id, name: group.name }] : []
    ),
  ]

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200 motion-reduce:animate-none">
        <p className="sr-only" aria-live="polite">
          {selectedCount} selected.
        </p>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background ring-1 ring-foreground/8 shadow-none isolate after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-white/5 after:pointer-events-none">
          <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap shrink-0">
            {selectedCount} selected
          </span>
          <div className="h-4 w-px bg-border/50" />
          <button
            type="button"
            onClick={onOpenSelected}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-sm transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
            aria-label="Open selected bookmarks"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => {
              void onRefreshSelected()
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-foreground font-medium text-sm transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
            aria-label="Refresh selected bookmark metadata"
          >
            Refresh
          </button>
          <Select
            value={moveValue}
            onValueChange={async (value) => {
              if (isMoving) return
              setMoveValue(value)
              setIsMoving(true)
              try {
                await onMoveSelectedToGroup(value === "no-group" ? null : value)
              } finally {
                setIsMoving(false)
                setMoveValue(undefined)
              }
            }}
            disabled={isMoving}
          >
            <SelectTrigger
              size="sm"
              className="h-8 rounded-lg bg-muted/50 hover:bg-muted text-foreground font-medium text-sm"
              aria-label="Move selected bookmarks to a group"
            >
              <SelectValue placeholder={isMoving ? "Moving..." : "Move to"} />
            </SelectTrigger>
            <SelectContent>
              {moveOptions.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"
            aria-label="Delete selected bookmarks"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onCancelSelection}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-foreground font-medium text-sm transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
            aria-label="Cancel selection"
          >
            Cancel
          </button>
        </div>
      </div>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected bookmarks?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the selected bookmarks from your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-lg cursor-pointer"
            onClick={() => {
              onBulkDelete()
              setDeleteDialogOpen(false)
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
