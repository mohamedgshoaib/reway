import { NOTE_COLORS } from "@/components/dashboard/content/notes-todos/config"
import type { NoteRow as NoteRowType } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"

export function HeroNoteRow({
  note,
  expanded,
  onToggleExpanded,
}: {
  note: NoteRowType
  expanded: boolean
  onToggleExpanded: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggleExpanded}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onToggleExpanded()
        }
      }}
      className="group flex items-start gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 hover:text-primary cursor-pointer text-left active:scale-[0.97] outline-none"
    >
      <div className="flex gap-2 min-w-0 flex-1 items-start">
        <span
          className="h-2 w-2 rounded-full mt-1 shrink-0"
          style={{ backgroundColor: note.color ?? NOTE_COLORS[5] }}
        />
        <span
          className={cn(
            "min-w-0 flex-1 text-xs",
            expanded ? "whitespace-pre-wrap wrap-break-word" : "truncate",
          )}
        >
          {note.text}
        </span>
      </div>
    </div>
  )
}
