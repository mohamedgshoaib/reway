import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TodoRow } from "@/lib/supabase/queries"
import { PriorityPicker } from "./pickers"
import type { TodoPriority } from "./types"

export function TodoEditCard({
  todo,
  editText,
  setEditText,
  editPriority,
  setEditPriority,
  isUpdating,
  onCancel,
  onSave,
}: {
  todo: TodoRow
  editText: string
  setEditText: (v: string) => void
  editPriority: TodoPriority
  setEditPriority: (v: TodoPriority) => void
  isUpdating: boolean
  onCancel: () => void
  onSave: () => void
}) {
  void todo
  return (
    <div className="relative my-2 p-3 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
      <div className="space-y-2">
        <PriorityPicker value={editPriority} onChange={setEditPriority} />
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Todo"
          className="h-8 text-sm rounded-xl"
          disabled={isUpdating}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isUpdating) {
              onSave()
            } else if (e.key === "Escape") {
              onCancel()
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs rounded-4xl font-bold cursor-pointer"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs rounded-4xl cursor-pointer"
          onClick={onSave}
          disabled={!editText.trim() || isUpdating}
        >
          {isUpdating ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
