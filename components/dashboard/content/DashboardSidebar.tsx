"use client"

import { DndContext, DragOverlay, MeasuringStrategy } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { RepeatIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { ALL_ICONS_MAP } from "@/lib/hugeicons-list"
import type { GroupRow } from "@/lib/supabase/queries"
import {
  ALL_BOOKMARKS_GROUP_ID,
  MOST_VISITED_GROUP_ID,
  MOST_VISITED_GROUP_NAME,
  NO_GROUP_ID,
  NO_GROUP_NAME,
} from "@/lib/system-groups"
import type { IconPickerPopoverProps } from "../IconPickerPopover"
import { AllBookmarksRow } from "./sidebar/AllBookmarksRow"
import { BulkDeleteGroupsDialog, DeleteGroupDialog } from "./sidebar/DeleteGroupDialogs"
import { GroupCreateCard } from "./sidebar/GroupCreateCard"
import { GroupEditCard } from "./sidebar/GroupEditCard"
import { GroupDragOverlayRow } from "./sidebar/GroupReorderRows"
import { GroupRowItem } from "./sidebar/GroupRowItem"
import { SelectionModeBar } from "./sidebar/SelectionModeBar"
import { SortableGroupRowItem } from "./sidebar/SortableGroupRowItem"
import { useGroupReorderDnd } from "./sidebar/useGroupReorderDnd"
import { useGroupSelection } from "./sidebar/useGroupSelection"

const IconPickerPopover = dynamic<IconPickerPopoverProps>(
  () => import("../IconPickerPopover").then((mod) => mod.IconPickerPopover),
  {
    loading: () => <div className="size-8 animate-pulse rounded-lg bg-primary/10" />,
    ssr: false,
  },
)

interface DashboardSidebarProps {
  groups: GroupRow[]
  activeGroupId: string
  setActiveGroupId: (id: string) => void
  onReorderGroups: (newOrder: GroupRow[]) => void
  handleOpenGroup: (groupId: string) => void
  editingGroupId: string | null
  setEditingGroupId: (value: string | null) => void
  editGroupName: string
  setEditGroupName: (value: string) => void
  editGroupIcon: string
  setEditGroupIcon: (value: string) => void
  editGroupColor: string | null
  setEditGroupColor: (value: string | null) => void
  isUpdatingGroup: boolean
  handleSidebarGroupUpdate: (groupId: string, onError?: () => void) => void
  onDeleteGroup: (groupId: string) => void
  isInlineCreating: boolean
  setIsInlineCreating: (value: boolean) => void
  newGroupName: string
  setNewGroupName: (value: string) => void
  newGroupIcon: string
  setNewGroupIcon: (value: string) => void
  newGroupColor: string | null
  setNewGroupColor: (value: string | null) => void
  isCreatingGroup: boolean
  handleInlineCreateGroup: (onError?: () => void) => void
  onToggleHideFromAllBookmarks: (id: string, hide: boolean) => void
  layoutDensity?: "compact" | "extended"
}

export function DashboardSidebar({
  groups,
  activeGroupId,
  setActiveGroupId,
  onReorderGroups,
  handleOpenGroup,
  editingGroupId,
  setEditingGroupId,
  editGroupName,
  setEditGroupName,
  editGroupIcon,
  setEditGroupIcon,
  editGroupColor,
  setEditGroupColor,
  isUpdatingGroup,
  handleSidebarGroupUpdate,
  onDeleteGroup,
  isInlineCreating,
  setIsInlineCreating,
  newGroupName,
  setNewGroupName,
  newGroupIcon,
  setNewGroupIcon,
  newGroupColor,
  setNewGroupColor,
  isCreatingGroup,
  handleInlineCreateGroup,
  onToggleHideFromAllBookmarks,
  layoutDensity = "compact",
}: DashboardSidebarProps) {
  const reorderableGroups = groups.filter((g) => g.id !== NO_GROUP_ID)

  const [viewportWidth, setViewportWidth] = useState<number>(0)
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const pointerInsideRef = useRef(false)
  const openActionMenuCountRef = useRef(0)

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth)
    update()
    window.addEventListener("resize", update, { passive: true })
    return () => window.removeEventListener("resize", update)
  }, [])

  const canPin = useMemo(() => {
    const mainMaxWidth = layoutDensity === "extended" ? 1600 : 768
    const sidebarWidth = 240
    const gutters = 24 + 24
    const required = mainMaxWidth + sidebarWidth * 2 + gutters
    return viewportWidth >= required
  }, [layoutDensity, viewportWidth])

  const scheduleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      if (openActionMenuCountRef.current > 0) return
      setIsHoverOpen(false)
    }, 250)
  }

  const cancelClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const handleSidebarMouseEnter = () => {
    pointerInsideRef.current = true
    cancelClose()
    setIsHoverOpen(true)
  }

  const handleSidebarMouseLeave = () => {
    pointerInsideRef.current = false
    if (!isPinnedOpen) scheduleClose()
  }

  const handleActionMenuOpenChange = (open: boolean) => {
    openActionMenuCountRef.current = Math.max(0, openActionMenuCountRef.current + (open ? 1 : -1))

    if (open) {
      cancelClose()
      setIsHoverOpen(true)
      return
    }

    if (!isPinnedOpen && !pointerInsideRef.current) {
      scheduleClose()
    }
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      cancelClose()
      setIsHoverOpen(true)
    }
    const handleClose = () => {
      setIsHoverOpen(false)
    }

    window.addEventListener("reway:open-sidebar-groups", handleOpen)
    window.addEventListener("reway:close-sidebar-groups", handleClose)

    return () => {
      window.removeEventListener("reway:open-sidebar-groups", handleOpen)
      window.removeEventListener("reway:close-sidebar-groups", handleClose)
    }
  }, [])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroupRow | null>(null)
  const {
    selectionMode,
    selectedGroupIds,
    selectedCount,
    selectedGroups,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelected,
    requestBulkDelete,
  } = useGroupSelection({ groups })

  const openDeleteDialog = (group: GroupRow) => {
    setDeleteTarget(group)
    setDeleteDialogOpen(true)
  }

  const { sensors, collisionDetection, activeGroup, handleGroupDragStart, handleGroupDragEnd } =
    useGroupReorderDnd({ groups: reorderableGroups, onReorderGroups })

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteGroup(deleteTarget.id)
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleConfirmBulkDelete = () => {
    if (selectedGroups.length === 0) return
    selectedGroups.forEach((g) => onDeleteGroup(g.id))
    setBulkDeleteDialogOpen(false)
    exitSelectionMode()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      setEditingGroupId(null)
      exitSelectionMode()
    }
  }

  const sidebarBody = (
    <>
      <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <KbdGroup className="gap-0.5">
          <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">Shift</Kbd>
          <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">A–Z</Kbd>
        </KbdGroup>
        <span>Switch Group</span>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-1 cursor-default">
        <AllBookmarksRow
          active={activeGroupId === ALL_BOOKMARKS_GROUP_ID}
          selectionMode={selectionMode}
          onSelectAll={() => setActiveGroupId(ALL_BOOKMARKS_GROUP_ID)}
          onOpenAll={() => handleOpenGroup(ALL_BOOKMARKS_GROUP_ID)}
          onToggleSelectionMode={() => {
            if (selectionMode) exitSelectionMode()
            else enterSelectionMode()
          }}
          onActionMenuOpenChange={handleActionMenuOpenChange}
        />

        <AllBookmarksRow
          active={activeGroupId === MOST_VISITED_GROUP_ID}
          selectionMode={selectionMode}
          onSelectAll={() => setActiveGroupId(MOST_VISITED_GROUP_ID)}
          onOpenAll={() => handleOpenGroup(MOST_VISITED_GROUP_ID)}
          onToggleSelectionMode={() => {
            if (selectionMode) exitSelectionMode()
            else enterSelectionMode()
          }}
          label={MOST_VISITED_GROUP_NAME}
          openLabel="Open most visited"
          icon={RepeatIcon}
          onActionMenuOpenChange={handleActionMenuOpenChange}
        />

        {selectionMode ? (
          <SelectionModeBar
            selectedCount={selectedCount}
            onCancel={exitSelectionMode}
            onDelete={requestBulkDelete}
          />
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hover-only">
          <DndContext
            id="groups-sidebar-dnd"
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={(event) => {
              if (selectionMode || editingGroupId || isInlineCreating) return
              handleGroupDragStart(event)
            }}
            onDragEnd={(event) => {
              if (selectionMode || editingGroupId || isInlineCreating) return
              handleGroupDragEnd(event)
            }}
            modifiers={[restrictToVerticalAxis]}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.WhileDragging,
              },
            }}
          >
            <SortableContext
              items={reorderableGroups.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {groups.map((group) => {
                  if (group.id === NO_GROUP_ID) {
                    const isActive = activeGroupId === NO_GROUP_ID
                    const NoGroupIcon =
                      ALL_ICONS_MAP[group.icon || "folder"] ?? ALL_ICONS_MAP["folder"]
                    return (
                      <div
                        key={group.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (selectionMode) return
                          setActiveGroupId(NO_GROUP_ID)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            if (selectionMode) return
                            setActiveGroupId(NO_GROUP_ID)
                          }
                        }}
                        className={`group flex items-center gap-3 px-2 py-1.5 transition-all duration-200 cursor-pointer active:scale-[0.97] outline-none ${
                          isActive
                            ? "text-primary font-semibold"
                            : selectionMode
                              ? ""
                              : "hover:text-primary"
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
                              icon={NoGroupIcon}
                              size={16}
                              strokeWidth={2}
                              className="text-foreground/80"
                            />
                            <span className="truncate max-w-32">{NO_GROUP_NAME}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  const isEditing = editingGroupId === group.id
                  const dndDisabled =
                    selectionMode || isInlineCreating || Boolean(editingGroupId) || isEditing

                  if (isEditing) {
                    return (
                      <GroupEditCard
                        key={group.id}
                        group={group}
                        IconPickerPopover={IconPickerPopover}
                        editGroupName={editGroupName}
                        setEditGroupName={setEditGroupName}
                        editGroupIcon={editGroupIcon}
                        setEditGroupIcon={setEditGroupIcon}
                        editGroupColor={editGroupColor}
                        setEditGroupColor={setEditGroupColor}
                        isUpdatingGroup={isUpdatingGroup}
                        onCancel={() => setEditingGroupId(null)}
                        onSave={() => handleSidebarGroupUpdate(group.id)}
                      />
                    )
                  }

                  return (
                    <SortableGroupRowItem key={group.id} id={group.id} disabled={dndDisabled}>
                      <GroupRowItem
                        group={group}
                        active={activeGroupId === group.id}
                        selectionMode={selectionMode}
                        isSelected={selectedGroupIds.has(group.id)}
                        onToggleSelected={() => toggleSelected(group.id)}
                        onSelectGroup={() => setActiveGroupId(group.id)}
                        onEnterSelectionMode={enterSelectionMode}
                        onOpenGroup={() => handleOpenGroup(group.id)}
                        onEdit={() => {
                          setEditingGroupId(group.id)
                          setEditGroupName(group.name)
                          setEditGroupIcon(group.icon || "folder")
                          setEditGroupColor(group.color || "#6366f1")
                        }}
                        onRequestDelete={() => openDeleteDialog(group)}
                        onToggleHideFromAllBookmarks={(hide) =>
                          onToggleHideFromAllBookmarks(group.id, hide)
                        }
                        onActionMenuOpenChange={handleActionMenuOpenChange}
                      />
                    </SortableGroupRowItem>
                  )
                })}
              </div>
            </SortableContext>

            {typeof document !== "undefined" &&
              createPortal(
                <DragOverlay dropAnimation={null} adjustScale={false}>
                  {activeGroup ? <GroupDragOverlayRow group={activeGroup} /> : null}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        </div>
      </div>

      <GroupCreateCard
        isInlineCreating={isInlineCreating}
        setIsInlineCreating={setIsInlineCreating}
        IconPickerPopover={IconPickerPopover}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        newGroupIcon={newGroupIcon}
        setNewGroupIcon={setNewGroupIcon}
        newGroupColor={newGroupColor}
        setNewGroupColor={setNewGroupColor}
        isCreatingGroup={isCreatingGroup}
        onCreate={() => handleInlineCreateGroup()}
      />
    </>
  )

  const sidebarDialogs = (
    <>
      <DeleteGroupDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteTarget(null)
        }}
        target={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />

      <BulkDeleteGroupsDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        selectedCount={selectedCount}
        onConfirm={handleConfirmBulkDelete}
      />
    </>
  )

  if (layoutDensity !== "extended") {
    const canReveal = viewportWidth >= 900

    return (
      <>
        {canPin ? (
          <aside
            className="fixed left-6 top-43 bottom-6 z-30 w-60 flex flex-col gap-2 text-sm text-muted-foreground"
            data-onboarding="groups-desktop"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            {sidebarBody}
          </aside>
        ) : canReveal ? (
          <>
            <button
              type="button"
              data-onboarding="groups-trigger"
              className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-14 w-7 items-center justify-center rounded-r-2xl bg-muted/20 ring-1 ring-inset ring-foreground/10 text-muted-foreground text-[11px] hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label="Toggle groups sidebar"
              onClick={() => {
                setIsPinnedOpen((p) => !p)
                setIsHoverOpen(true)
              }}
              onMouseEnter={() => {
                handleSidebarMouseEnter()
              }}
              onMouseLeave={() => {
                handleSidebarMouseLeave()
              }}
            >
              {/* Issue: single-letter handles are hard to discover.
                  Fix: use a compact, vertical label to preserve space while being self-explanatory. */}
              <span className="[writing-mode:vertical-rl] text-[10px] tracking-wide">Groups</span>
            </button>

            <aside
              data-onboarding="groups-desktop"
              className={`fixed left-0 top-43 bottom-6 z-50 w-60 transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                isPinnedOpen || isHoverOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              onMouseEnter={() => {
                handleSidebarMouseEnter()
              }}
              onMouseLeave={() => {
                handleSidebarMouseLeave()
              }}
            >
              <div className="h-full rounded-r-3xl bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70 ring-1 ring-foreground/8 p-2 flex flex-col gap-2 text-sm text-muted-foreground">
                {sidebarBody}
              </div>
            </aside>
          </>
        ) : null}

        {sidebarDialogs}
      </>
    )
  }

  return (
    <>
      <aside
        className={`hidden min-[1200px]:flex fixed left-6 top-43 bottom-6 z-50 w-60 flex-col gap-2 text-sm text-muted-foreground ${
          canPin ? "" : "min-[1200px]:hidden"
        }`}
        data-onboarding="groups-desktop"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {sidebarBody}
      </aside>

      {!canPin ? (
        <>
          <button
            type="button"
            data-onboarding="groups-trigger"
            className="hidden min-[1200px]:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 h-24 w-5 items-center justify-center rounded-r-2xl bg-muted/20 ring-1 ring-inset ring-foreground/10 text-muted-foreground text-[11px] hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle groups sidebar"
            onClick={() => {
              setIsPinnedOpen((p) => !p)
              setIsHoverOpen((prev) => (prev ? prev : true))
            }}
            onMouseEnter={() => {
              handleSidebarMouseEnter()
            }}
            onMouseLeave={() => {
              handleSidebarMouseLeave()
            }}
          >
            <span className="[writing-mode:vertical-rl] text-[10px] tracking-wide">Groups</span>
          </button>

          <aside
            data-onboarding="groups-desktop"
            className={`hidden min-[1200px]:block fixed left-0 top-43 bottom-6 z-50 w-60 transition-transform duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              isPinnedOpen || isHoverOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onMouseEnter={() => {
              handleSidebarMouseEnter()
            }}
            onMouseLeave={() => {
              handleSidebarMouseLeave()
            }}
          >
            <div className="h-full rounded-r-3xl bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70 ring-1 ring-foreground/8 p-2 flex flex-col gap-2 text-sm text-muted-foreground">
              {sidebarBody}
            </div>
          </aside>
        </>
      ) : null}

      {sidebarDialogs}
    </>
  )
}
