"use client"

import {
  Add01Icon,
  BulbIcon,
  Folder01Icon,
  Search01Icon,
  ToolsIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import type { HeroGroupId, HeroGroup } from "./types"

export function GroupsSidebar({
  activeGroup,
  heroGroups,
  creatingGroup,
  newGroupName,
  newGroupIcon,
  newGroupColor,
  setNewGroupName,
  setNewGroupIcon,
  setNewGroupColor,
  onSelectGroup,
  onOpenCreate,
  onCancelCreate,
  onCreate,
}: {
  activeGroup: HeroGroupId
  heroGroups: HeroGroup[]
  creatingGroup: boolean
  newGroupName: string
  newGroupIcon: typeof Search01Icon | typeof BulbIcon | typeof ToolsIcon | typeof Folder01Icon
  newGroupColor: string | null
  setNewGroupName: (v: string) => void
  setNewGroupIcon: (
    v: typeof Search01Icon | typeof BulbIcon | typeof ToolsIcon | typeof Folder01Icon,
  ) => void
  setNewGroupColor: (v: string | null) => void
  onSelectGroup: (id: HeroGroupId) => void
  onOpenCreate: () => void
  onCancelCreate: () => void
  onCreate: () => void
}) {
  const heroIcon = (icon: HeroGroup["icon"]): React.ComponentProps<typeof HugeiconsIcon>["icon"] =>
    icon as React.ComponentProps<typeof HugeiconsIcon>["icon"]

  const [createIconPopoverOpen, setCreateIconPopoverOpen] = useState(false)

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 px-4 pb-4 pt-19 text-xs text-muted-foreground min-[855px]:flex overflow-hidden">
      <div className="flex flex-1 flex-col gap-1 overflow-hidden cursor-default">
        {heroGroups.map((item) => {
          const isActive = item.id === activeGroup || (item.id === "all" && activeGroup === "all")

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (item.id === "all") {
                  onSelectGroup("all")
                  return
                }
                if (
                  item.id === "Research" ||
                  item.id === "Inspiration" ||
                  item.id === "Build" ||
                  item.id === "Learn"
                ) {
                  onSelectGroup(item.id)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  if (item.id === "all") {
                    onSelectGroup("all")
                    return
                  }
                  if (
                    item.id === "Research" ||
                    item.id === "Inspiration" ||
                    item.id === "Build" ||
                    item.id === "Learn"
                  ) {
                    onSelectGroup(item.id)
                  }
                }
              }}
              className={`group flex items-center gap-3 px-2 py-1.5 transition-all duration-200 cursor-pointer active:scale-[0.97] outline-none ${
                isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer">
                <span
                  className={`h-px transition-[width,opacity] duration-200 ease-out ${
                    isActive
                      ? "w-12 opacity-80"
                      : "w-8 opacity-60 group-hover:w-12 group-hover:opacity-80"
                  } bg-current`}
                />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HugeiconsIcon
                    icon={heroIcon(item.icon)}
                    size={16}
                    strokeWidth={2}
                    style={{ color: item.color || undefined }}
                    className={item.color ? "" : "text-muted-foreground"}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-border/40">
        {creatingGroup ? (
          <div className="relative mt-2 p-2 space-y-3 rounded-2xl bg-muted/20 ring-1 ring-inset ring-foreground/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Popover open={createIconPopoverOpen} onOpenChange={setCreateIconPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                        newGroupIcon !== Folder01Icon ? "" : ""
                      }`}
                      aria-label="Pick group icon"
                    >
                      <HugeiconsIcon
                        icon={newGroupIcon}
                        size={16}
                        strokeWidth={2}
                        style={{ color: newGroupColor || undefined }}
                        className={newGroupColor ? "" : "text-muted-foreground"}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewGroupIcon(Search01Icon)
                          setNewGroupColor("#3b82f6")
                          setCreateIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          newGroupIcon === Search01Icon ? "ring-2 ring-foreground/40" : ""
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
                          setNewGroupIcon(BulbIcon)
                          setNewGroupColor("#f59e0b")
                          setCreateIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          newGroupIcon === BulbIcon ? "ring-2 ring-foreground/40" : ""
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
                          setNewGroupIcon(ToolsIcon)
                          setNewGroupColor("#10b981")
                          setCreateIconPopoverOpen(false)
                        }}
                        className={`flex size-8 shrink-0 aspect-square items-center justify-center rounded-full bg-muted/20 ring-1 ring-foreground/8 hover:bg-muted/30 cursor-pointer p-0 ${
                          newGroupIcon === ToolsIcon ? "ring-2 ring-foreground/40" : ""
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
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New group"
                  className="h-8 text-sm rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      onCreate()
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
                  className="h-7 px-3 text-xs rounded-lg font-bold cursor-pointer"
                  onClick={onCancelCreate}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs rounded-lg cursor-pointer"
                  onClick={onCreate}
                  disabled={!newGroupName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary/90 cursor-pointer active:scale-[0.97] transition-all duration-200"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            Create group
          </button>
        )}
      </div>
    </aside>
  )
}
