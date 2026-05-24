import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { NoteRow } from "@/lib/supabase/queries"
import { ColorPicker } from "./pickers"

export function NoteEditCard({
  note,
  editText,
  setEditText,
  editColor,
  setEditColor,
  isUpdating,
  onCancel,
  onSave,
}: {
  note: NoteRow
  editText: string
  setEditText: (v: string) => void
  editColor: string | null
  setEditColor: (v: string) => void
  isUpdating: boolean
  onCancel: () => void
  onSave: () => void
}) {
  void note
  return (
    <div className="relative my-2 p-2 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
      <div className="space-y-2">
        <ColorPicker value={editColor} onChange={setEditColor} />
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Note"
          className="h-8 text-sm rounded-lg"
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
          className="h-7 px-3 text-xs rounded-lg font-bold cursor-pointer"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 px-3 text-xs rounded-lg cursor-pointer"
          onClick={onSave}
          disabled={!editText.trim() || isUpdating}
        >
          {isUpdating ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
