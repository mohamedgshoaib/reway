import { Folder01Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import React from "react"
import { Button as UIButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GroupRow } from "@/lib/supabase/queries"
import type { IconPickerPopoverProps } from "../../IconPickerPopover"
import { CharacterCount } from "./CharacterCount"

const MAX_GROUP_NAME_LENGTH = 18

export function GroupEditRow({
  group,
  iconsMap,
  IconPickerPopover,
  editGroupName,
  setEditGroupName,
  editGroupIcon,
  setEditGroupIcon,
  editGroupColor,
  setEditGroupColor,
  onUpdateGroup,
  isUpdating,
  setEditingGroupId,
}: {
  group: GroupRow
  iconsMap: Record<string, IconSvgElement> | null
  IconPickerPopover: React.ComponentType<IconPickerPopoverProps>
  editGroupName: string
  setEditGroupName: (value: string) => void
  editGroupIcon: string
  setEditGroupIcon: (value: string) => void
  editGroupColor: string | null
  setEditGroupColor: (value: string | null) => void
  onUpdateGroup: (id: string, onError?: () => void) => void
  isUpdating: boolean
  setEditingGroupId: (value: string | null) => void
}) {
  return (
    <div
      className="relative mx-1 my-1.5 px-3 py-3 space-y-3 bg-muted/20 rounded-xl ring-1 ring-foreground/8 after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-white/5 after:pointer-events-none after:content-[''] shadow-none isolate"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <IconPickerPopover
          selectedIcon={editGroupIcon}
          onIconSelect={setEditGroupIcon}
          color={editGroupColor}
          onColorChange={setEditGroupColor}
        >
          <button
            type="button"
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-muted/40 hover:bg-muted/60 cursor-pointer"
            aria-label="Select group icon"
          >
            <HugeiconsIcon
              icon={iconsMap?.[editGroupIcon] ?? iconsMap?.["folder"] ?? Folder01Icon}
              size={16}
              strokeWidth={2}
              style={{ color: editGroupColor || "#6366f1" }}
              className="text-primary"
            />
          </button>
        </IconPickerPopover>
        <Input
          value={editGroupName}
          onChange={(e) => {
            setEditGroupName(e.target.value.slice(0, MAX_GROUP_NAME_LENGTH))
          }}
          placeholder="Group name"
          className="h-8 flex-1 text-sm rounded-lg"
          maxLength={MAX_GROUP_NAME_LENGTH}
          autoFocus
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Enter") {
              onUpdateGroup(group.id)
            } else if (e.key === "Escape") {
              setEditingGroupId(null)
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <UIButton
          size="sm"
          variant="secondary"
          className="h-7 px-3 text-xs rounded-4xl font-bold"
          onClick={(e) => {
            e.stopPropagation()
            setEditingGroupId(null)
          }}
        >
          Cancel
        </UIButton>
        <div className="flex items-center justify-end flex-1 gap-2">
          <CharacterCount current={editGroupName.length} max={MAX_GROUP_NAME_LENGTH} />
          <UIButton
            size="sm"
            className="h-7 px-3 text-xs rounded-4xl whitespace-nowrap min-w-[72px]"
            onClick={() => onUpdateGroup(group.id)}
            disabled={!editGroupName.trim() || isUpdating}
          >
            {isUpdating ? "Saving..." : "Save"}
          </UIButton>
        </div>
      </div>
    </div>
  )
}
