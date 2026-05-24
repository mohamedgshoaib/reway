import { Button } from "@/components/ui/button"

export function ReorderModeBar({ onDone }: { onDone: () => void }) {
  return (
    <div className="mb-2 rounded-2xl border border-border/60 bg-muted/20 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Reorder groups</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs rounded-lg font-bold cursor-pointer"
          onClick={onDone}
        >
          Done reordering
        </Button>
      </div>
    </div>
  )
}
