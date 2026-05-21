import type { TodoPriority } from "./types"

export const NOTE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

export const priorityConfig: Record<
  TodoPriority,
  { label: string; letter: string; colorClass: string }
> = {
  high: { label: "High", letter: "H", colorClass: "text-red-500" },
  medium: { label: "Med", letter: "M", colorClass: "text-amber-500" },
  low: { label: "Low", letter: "L", colorClass: "text-emerald-500" },
}

export function normalizePriority(value?: string | null): TodoPriority {
  const v = (value ?? "").trim().toLowerCase()
  if (v === "high" || v === "h") return "high"
  if (v === "low" || v === "l") return "low"
  return "medium"
}
