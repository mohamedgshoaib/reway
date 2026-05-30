import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { DashboardLoadingState } from "../../LoadingState"
import { Input } from "@/components/ui/input"
import { ALL_ICONS_MAP } from "@/lib/hugeicons-list"
import type { GroupRow } from "@/lib/supabase/queries"
import type { IconPickerPopoverProps } from "../../IconPickerPopover"
import { CharacterCount } from "./CharacterCount"
import { MAX_GROUP_NAME_LENGTH } from "./constants"

export interface GroupEditCardProps {
  group: GroupRow
  IconPickerPopover: React.ComponentType<IconPickerPopoverProps>
  editGroupName: string
  setEditGroupName: (value: string) => void
  editGroupIcon: string
  setEditGroupIcon: (value: string) => void
  editGroupColor: string | null
  setEditGroupColor: (value: string | null) => void
  isUpdatingGroup: boolean
  onCancel: () => void
  onSave: () => void
}

export function GroupEditCard({
  group,
  IconPickerPopover,
  editGroupName,
  setEditGroupName,
  editGroupIcon,
  setEditGroupIcon,
  editGroupColor,
  setEditGroupColor,
  isUpdatingGroup,
  onCancel,
  onSave,
}: GroupEditCardProps) {
  void group
  return (
    <div className="relative my-2 p-2 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
      <div className="flex items-center gap-2">
        <IconPickerPopover
          selectedIcon={editGroupIcon}
          onIconSelect={setEditGroupIcon}
          color={editGroupColor}
          onColorChange={setEditGroupColor}
        >
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-lg bg-primary/10 hover:bg-primary/20 cursor-pointer"
            aria-label="Select group icon"
          >
            <HugeiconsIcon
              icon={ALL_ICONS_MAP[editGroupIcon] || ALL_ICONS_MAP["folder"]}
              size={16}
              strokeWidth={2}
              style={{ color: editGroupColor || "#6366f1" }}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
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
        >
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <CharacterCount current={editGroupName.length} max={MAX_GROUP_NAME_LENGTH} />
          <Button
            size="sm"
            className="h-7 px-3 text-xs rounded-lg cursor-pointer"
            onClick={onSave}
            disabled={!editGroupName.trim() || isUpdatingGroup}
          >
            {isUpdatingGroup ? <DashboardLoadingState label="Saving" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
