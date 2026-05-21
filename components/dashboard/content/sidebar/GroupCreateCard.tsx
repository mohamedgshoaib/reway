import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ALL_ICONS_MAP } from "@/lib/hugeicons-list"
import type { IconPickerPopoverProps } from "../../IconPickerPopover"
import { CharacterCount } from "./CharacterCount"
import { MAX_GROUP_NAME_LENGTH } from "./constants"

export function GroupCreateCard({
  isInlineCreating,
  setIsInlineCreating,
  IconPickerPopover,
  newGroupName,
  setNewGroupName,
  newGroupIcon,
  setNewGroupIcon,
  newGroupColor,
  setNewGroupColor,
  isCreatingGroup,
  onCreate,
}: {
  isInlineCreating: boolean
  setIsInlineCreating: (value: boolean) => void
  IconPickerPopover: React.ComponentType<IconPickerPopoverProps>
  newGroupName: string
  setNewGroupName: (value: string) => void
  newGroupIcon: string
  setNewGroupIcon: (value: string) => void
  newGroupColor: string | null
  setNewGroupColor: (value: string | null) => void
  isCreatingGroup: boolean
  onCreate: () => void
}) {
  return (
    <div className="pt-3 mt-2 border-t border-border/40">
      {isInlineCreating ? (
        <div className="relative mt-2 p-3 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
          <div className="flex items-center gap-2">
            <IconPickerPopover
              selectedIcon={newGroupIcon}
              onIconSelect={setNewGroupIcon}
              color={newGroupColor}
              onColorChange={setNewGroupColor}
            >
              <button
                type="button"
                className="flex items-center justify-center size-8 rounded-xl bg-primary/10 hover:bg-primary/20 cursor-pointer"
                aria-label="Select group icon"
              >
                <HugeiconsIcon
                  icon={ALL_ICONS_MAP[newGroupIcon] || ALL_ICONS_MAP["folder"]}
                  size={16}
                  strokeWidth={2}
                  style={{ color: newGroupColor || "#6366f1" }}
                />
              </button>
            </IconPickerPopover>
            <Input
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value.slice(0, MAX_GROUP_NAME_LENGTH))
              }}
              placeholder="New group"
              className="h-8 flex-1 text-sm rounded-xl"
              maxLength={MAX_GROUP_NAME_LENGTH}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCreate()
                } else if (e.key === "Escape") {
                  setIsInlineCreating(false)
                  setNewGroupName("")
                  setNewGroupIcon("folder")
                  setNewGroupColor("#6366f1")
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-3 text-xs rounded-4xl font-bold cursor-pointer"
              onClick={() => {
                setIsInlineCreating(false)
                setNewGroupName("")
                setNewGroupIcon("folder")
                setNewGroupColor("#6366f1")
              }}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <CharacterCount current={newGroupName.length} max={MAX_GROUP_NAME_LENGTH} />
              <Button
                size="sm"
                className="h-7 px-3 text-xs rounded-4xl cursor-pointer"
                onClick={onCreate}
                disabled={!newGroupName.trim() || isCreatingGroup}
              >
                {isCreatingGroup ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsInlineCreating(true)
          }}
          data-onboarding="create-group-desktop"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary/90 cursor-pointer active:scale-[0.97] transition-all duration-200"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          Create group
        </button>
      )}
    </div>
  )
}
