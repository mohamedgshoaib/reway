import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-input/20 ring-1 ring-foreground/5 focus-visible:ring-primary/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 resize-none rounded-xl px-3 py-3 text-base transition-[color,background-color,box-shadow] focus-visible:ring-2 aria-invalid:ring-2 md:text-sm placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-none",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
