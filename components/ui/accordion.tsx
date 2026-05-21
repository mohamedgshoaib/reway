"use client"

import { Accordion as AccordionPrimitive } from "radix-ui"
import * as React from "react"

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        // Issue: `suppressHydrationWarning` in shared UI primitives can mask real hydration bugs.
        // Fix: do not suppress globally here; apply suppression only at the specific call site that has an expected mismatch.
        className={cn(
          "**:data-[slot=accordion-trigger-icon]:text-muted-foreground gap-6 p-4 text-left text-sm font-medium hover:underline **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-[color,background-color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <HugeiconsIcon
          icon={ArrowUp01Icon}
          strokeWidth={2}
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "text-sm overflow-visible data-[state=closed]:[&>div]:opacity-0 data-[state=closed]:[&>div]:translate-y-1 data-[state=open]:[&>div]:opacity-100 data-[state=open]:[&>div]:translate-y-0 [&>div]:transition-[transform,opacity] [&>div]:duration-200 [&>div]:ease-out motion-reduce:[&>div]:transition-none",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "pt-0 pb-0 [&_a]:hover:text-foreground h-auto [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
