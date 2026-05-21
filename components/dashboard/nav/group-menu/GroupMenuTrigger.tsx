import { ArrowDown01Icon, Folder01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import type { ComponentPropsWithoutRef, Ref } from "react"
import { Button } from "@/components/ui/button"

export function GroupMenuTrigger({
  activeGroup,
  ActiveIcon,
  className,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof Button> & {
  activeGroup: { name: string; color: string | null }
  ActiveIcon: IconSvgElement
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      data-onboarding="groups-mobile"
      suppressHydrationWarning
      className={`h-9 gap-1.5 px-1.5 rounded-xl text-[13px] font-bold hover:bg-muted/50 transition-transform duration-150 active:scale-[0.98]${
        className ? ` ${className}` : ""
      }`}
      {...props}
    >
      <div className="flex items-center justify-center size-7">
        {ActiveIcon ? (
          <HugeiconsIcon
            icon={ActiveIcon ?? Folder01Icon}
            size={16}
            strokeWidth={2}
            style={{ color: activeGroup.color || undefined }}
            className={activeGroup.color ? "" : "text-foreground/80"}
          />
        ) : null}
      </div>
      <span className="truncate max-w-32">{activeGroup.name}</span>
      <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-muted-foreground/30" />
    </Button>
  )
}
