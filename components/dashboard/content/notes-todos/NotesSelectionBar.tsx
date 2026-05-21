import { Button } from "@/components/ui/button"

export function NotesSelectionBar({
  selectedCount,
  onCancel,
  onDelete,
}: {
  selectedCount: number
  onCancel: () => void
  onDelete: () => void
}) {
  return (
    <div className="mb-1 rounded-2xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs rounded-4xl font-bold cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 px-3 text-xs rounded-4xl cursor-pointer"
            onClick={onDelete}
            disabled={selectedCount === 0}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
