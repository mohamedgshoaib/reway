import { cn } from "@/lib/utils"
import { NOTE_COLORS, priorityConfig } from "./config"
import type { TodoPriority } from "./types"

export function ColorPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {NOTE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={cn(
            "size-4 rounded-full ring-1 ring-border/60 cursor-pointer",
            value === c ? "ring-2 ring-foreground/40" : "opacity-80",
          )}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
          aria-label={`Select color ${c}`}
        />
      ))}
    </div>
  )
}

export function PriorityPicker({
  value,
  onChange,
}: {
  value: TodoPriority
  onChange: (v: TodoPriority) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {(Object.keys(priorityConfig) as TodoPriority[]).map((p) => {
        const cfg = priorityConfig[p]
        const active = p === value
        return (
          <button
            key={p}
            type="button"
            className={cn(
              "h-6 px-2 text-[11px] rounded-lg border border-border/60 cursor-pointer",
              active
                ? "bg-muted text-foreground"
                : "bg-muted/60 text-muted-foreground hover:text-primary/90",
            )}
            onClick={() => onChange(p)}
          >
            <span className={cn("font-semibold", cfg.colorClass)}>{cfg.letter}</span>
            <span className="ml-1">{cfg.label}</span>
          </button>
        )
      })}
    </div>
  )
}
