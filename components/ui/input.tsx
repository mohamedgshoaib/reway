import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-input/20 ring-1 ring-foreground/5 focus-visible:ring-primary/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-lg px-3 py-1 text-base transition-[color,background-color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-2 aria-invalid:ring-2 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 shadow-none",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
