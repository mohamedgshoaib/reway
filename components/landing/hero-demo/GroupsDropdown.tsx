"use client"

import {
  Add01Icon,
  ArrowDown01Icon,
  BulbIcon,
  Folder01Icon,
  Search01Icon,
  ToolsIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import type { HeroGroupId, HeroGroup } from "./types"

export function GroupsDropdown({
  activeGroup,
  heroGroups,
  dropdownCreatingGroup,
  dropdownNewGroupName,
  dropdownNewGroupIcon,
  dropdownNewGroupColor,
  setDropdownNewGroupName,
  setDropdownCreatingGroup,
  setDropdownNewGroupIcon,
  setDropdownNewGroupColor,
  onSelectGroup,
  onCreateGroup,
  onCancelCreate,
}: {
  activeGroup: HeroGroupId
  heroGroups: HeroGroup[]
  dropdownCreatingGroup: boolean
  dropdownNewGroupName: string
  dropdownNewGroupIcon:
    | typeof Search01Icon
    | typeof BulbIcon
    | typeof ToolsIcon
    | typeof Folder01Icon
  dropdownNewGroupColor: string | null
  setDropdownNewGroupName: (v: string) => void
  setDropdownCreatingGroup: (v: boolean) => void
  setDropdownNewGroupIcon: (
    v: typeof Search01Icon | typeof BulbIcon | typeof ToolsIcon | typeof Folder01Icon,
  ) => void
  setDropdownNewGroupColor: (v: string | null) => void
  onSelectGroup: (id: HeroGroupId) => void
  onCreateGroup: () => void
  onCancelCreate: () => void
}) {
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="min-[855px]:hidden flex items-center gap-1.5 rounded-xl px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary/90 hover:bg-muted/30 transition-colors cursor-pointer"
          aria-label="Switch group"
        >
          <span className="truncate max-w-28">
            {activeGroup === "all" ? "All Bookmarks" : activeGroup}
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {heroGroups.map((g) => (
          <DropdownMenuItem
            key={g.id}
            onSelect={() => {
              if (
                g.id === "all" ||
                g.id === "Research" ||
                g.id === "Inspiration" ||
                g.id === "Build" ||
                g.id === "Learn"
              ) {
                onSelectGroup(g.id)
              }
            }}
            className="gap-2 text-xs cursor-pointer"
          >
            <HugeiconsIcon
              // Issue: `g.icon` was typed as a loose SVG tuple structure, forcing `as any`.
              // Fix: type `HeroIcon` as `IconSvgElement` so `HugeiconsIcon` receives the correct icon type.
              icon={g.icon}
              size={14}
              strokeWidth={2}
              style={{ color: g.color || undefined }}
              className={g.color ? "" : "text-muted-foreground"}
            />
            <span className="truncate">{g.label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {dropdownCreatingGroup ? (
          <div className="p-2" onMouseDown={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0"
                      aria-label="Pick group icon"
                    >
                      <HugeiconsIcon
                        icon={dropdownNewGroupIcon}
                        size={16}
                        strokeWidth={2}
                        style={{ color: dropdownNewGroupColor || undefined }}
                        className={dropdownNewGroupColor ? "" : "text-muted-foreground"}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownNewGroupIcon(Search01Icon)
                          setDropdownNewGroupColor("#3b82f6")
                          setIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          dropdownNewGroupIcon === Search01Icon ? "ring-2 ring-foreground/40" : ""
                        }`}
                        aria-label="Use Research icon"
                      >
                        <HugeiconsIcon
                          icon={Search01Icon}
                          size={16}
                          strokeWidth={2}
                          style={{ color: "#3b82f6" }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownNewGroupIcon(BulbIcon)
                          setDropdownNewGroupColor("#f59e0b")
                          setIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          dropdownNewGroupIcon === BulbIcon ? "ring-2 ring-foreground/40" : ""
                        }`}
                        aria-label="Use Inspiration icon"
                      >
                        <HugeiconsIcon
                          icon={BulbIcon}
                          size={16}
                          strokeWidth={2}
                          style={{ color: "#f59e0b" }}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownNewGroupIcon(ToolsIcon)
                          setDropdownNewGroupColor("#10b981")
                          setIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          dropdownNewGroupIcon === ToolsIcon ? "ring-2 ring-foreground/40" : ""
                        }`}
                        aria-label="Use Build icon"
                      >
                        <HugeiconsIcon
                          icon={ToolsIcon}
                          size={16}
                          strokeWidth={2}
                          style={{ color: "#10b981" }}
                        />
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  value={dropdownNewGroupName}
                  onChange={(e) => setDropdownNewGroupName(e.target.value)}
                  placeholder="New group"
                  className="h-8 text-sm rounded-xl"
                 
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      onCreateGroup()
                    } else if (e.key === "Escape") {
                      onCancelCreate()
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-3 text-xs rounded-4xl font-bold cursor-pointer"
                  onClick={onCancelCreate}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs rounded-4xl cursor-pointer"
                  onClick={onCreateGroup}
                  disabled={!dropdownNewGroupName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setDropdownCreatingGroup(true)
            }}
            className="gap-2 text-xs cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            Create group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
