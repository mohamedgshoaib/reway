import { Add01Icon, Folder01Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import React from "react"
import { Button as UIButton } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { IconPickerPopoverProps } from "../../IconPickerPopover"
import { CharacterCount } from "./CharacterCount"

const MAX_GROUP_NAME_LENGTH = 18

export function GroupCreateRow({
  isInlineCreating,
  setIsInlineCreating,
  iconsMap,
  IconPickerPopover,
  newGroupName,
  setNewGroupName,
  newGroupIcon,
  setNewGroupIcon,
  newGroupColor,
  setNewGroupColor,
  isCreating,
  onInlineCreate,
  onInlineCreateCancel,
}: {
  isInlineCreating: boolean
  setIsInlineCreating: (value: boolean) => void
  iconsMap: Record<string, IconSvgElement> | null
  IconPickerPopover: React.ComponentType<IconPickerPopoverProps>
  newGroupName: string
  setNewGroupName: (value: string) => void
  newGroupIcon: string
  setNewGroupIcon: (value: string) => void
  newGroupColor: string | null
  setNewGroupColor: (value: string | null) => void
  isCreating: boolean
  onInlineCreate: (onError?: () => void) => void
  onInlineCreateCancel: () => void
}) {
  if (isInlineCreating) {
    return (
      <div
        className="relative mx-1 my-1.5 px-3 py-3 space-y-3 bg-muted/20 rounded-xl ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <IconPickerPopover
            selectedIcon={newGroupIcon}
            onIconSelect={setNewGroupIcon}
            color={newGroupColor}
            onColorChange={setNewGroupColor}
          >
            <button
              type="button"
              className="flex items-center justify-center size-8 rounded-xl bg-muted/40 hover:bg-muted/60 cursor-pointer"
              aria-label="Select group icon"
            >
              <HugeiconsIcon
                icon={iconsMap?.[newGroupIcon] ?? iconsMap?.["folder"] ?? Folder01Icon}
                size={16}
                strokeWidth={2}
                style={{ color: newGroupColor || "#6366f1" }}
                className="text-primary"
              />
            </button>
          </IconPickerPopover>
          <Input
            value={newGroupName}
            onChange={(e) => {
              setNewGroupName(e.target.value.slice(0, MAX_GROUP_NAME_LENGTH))
            }}
            placeholder="Group name"
            className="h-8 flex-1 text-sm rounded-lg"
            maxLength={MAX_GROUP_NAME_LENGTH}
           
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter") {
                onInlineCreate()
              } else if (e.key === "Escape") {
                onInlineCreateCancel()
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <UIButton
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs rounded-4xl font-bold"
            onClick={() => {
              onInlineCreateCancel()
            }}
          >
            Cancel
          </UIButton>
          <div className="flex items-center justify-end flex-1 gap-2">
            <CharacterCount current={newGroupName.length} max={MAX_GROUP_NAME_LENGTH} />
            <UIButton
              size="sm"
              className="h-7 px-3 text-xs rounded-4xl whitespace-nowrap min-w-[72px]"
              onClick={() => onInlineCreate()}
              disabled={!newGroupName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Save"}
            </UIButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenuItem
      data-onboarding="create-group-mobile"
      className="rounded-xl text-primary font-medium cursor-pointer flex items-center justify-between gap-3 py-2"
      onSelect={(e) => {
        e.preventDefault()
        setIsInlineCreating(true)
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="shrink-0" />
        <span>New Group</span>
      </div>
    </DropdownMenuItem>
  )
}
