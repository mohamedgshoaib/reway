"use client"

import { DndContext, DragOverlay, MeasuringStrategy } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { RepeatIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
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
import type { DashboardGroupControlsAdapter, DashboardLibraryAdapter } from "./workspace-shell-types"
import { AllBookmarksRow } from "./sidebar/AllBookmarksRow"
import { BulkDeleteGroupsDialog, DeleteGroupDialog } from "./sidebar/DeleteGroupDialogs"
import { GroupRowItem } from "./sidebar/GroupRowItem"
import { SelectionModeBar } from "./sidebar/SelectionModeBar"
import { SortableGroupRowItem } from "./sidebar/SortableGroupRowItem"
import { useGroupReorderDnd } from "./sidebar/useGroupReorderDnd"
import { useGroupSelection } from "./sidebar/useGroupSelection"
import type { GroupCreateCardProps } from "./sidebar/GroupCreateCard"
import type { GroupEditCardProps } from "./sidebar/GroupEditCard"
import type { GroupDragOverlayRowProps } from "./sidebar/GroupReorderRows"

const IconPickerPopover = dynamic<IconPickerPopoverProps>(
  () => import("../IconPickerPopover").then((mod) => mod.IconPickerPopover),
  {
    loading: () => <div className="size-8 animate-pulse rounded-lg bg-primary/10" />,
    ssr: false,
  },
)

const GroupCreateCard = dynamic<GroupCreateCardProps>(
  () => import("./sidebar/GroupCreateCard").then((mod) => mod.GroupCreateCard),
  { loading: () => null, ssr: false },
)

const GroupEditCard = dynamic<GroupEditCardProps>(
  () => import("./sidebar/GroupEditCard").then((mod) => mod.GroupEditCard),
  { loading: () => null, ssr: false },
)

const GroupDragOverlayRow = dynamic<GroupDragOverlayRowProps>(
  () => import("./sidebar/GroupReorderRows").then((mod) => mod.GroupDragOverlayRow),
  { loading: () => null, ssr: false },
)

function subscribeViewportWidth(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange, { passive: true })
  return () => window.removeEventListener("resize", onStoreChange)
}

function getViewportWidthSnapshot() {
  return window.innerWidth
}

function getServerViewportWidthSnapshot() {
  return 0
}

interface DashboardSidebarProps {
  library: Pick<DashboardLibraryAdapter, "groups" | "bookmarks" | "activeGroupId" | "setActiveGroupId" | "layoutDensity"> & {
    handleOpenGroup: (groupId: string) => void
    reorderGroups: (newOrder: GroupRow[], movedGroupId: string) => Promise<void>
  }
  groupControls: DashboardGroupControlsAdapter
}

export const DashboardSidebar = memo(function DashboardSidebar({
  library,
  groupControls,
}: DashboardSidebarProps) {
  const reorderableGroups = library.groups.filter((g) => g.id !== NO_GROUP_ID)

  const viewportWidth = useSyncExternalStore(
    subscribeViewportWidth,
    getViewportWidthSnapshot,
    getServerViewportWidthSnapshot,
  )
  const [isPinnedOpen, setIsPinnedOpen] = useState(false)
  const [isHoverOpen, setIsHoverOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const pointerInsideRef = useRef(false)
  const openActionMenuCountRef = useRef(0)

  const canPin = useMemo(() => {
    const mainMaxWidth = library.layoutDensity === "extended" ? 1600 : 768
    const sidebarWidth = 240
    const gutters = 24 + 24
    const required = mainMaxWidth + sidebarWidth * 2 + gutters
    return viewportWidth >= required
  }, [library.layoutDensity, viewportWidth])

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
    const timerRef = closeTimerRef
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
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
  } = useGroupSelection({ groups: library.groups })

  const openDeleteDialog = (group: GroupRow) => {
    setDeleteTarget(group)
    setDeleteDialogOpen(true)
  }

  const { sensors, collisionDetection, activeGroup, handleGroupDragStart, handleGroupDragEnd } =
    useGroupReorderDnd({ groups: reorderableGroups, onReorderGroups: library.reorderGroups })

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      void groupControls.handleDeleteGroup(deleteTarget.id)
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleConfirmBulkDelete = () => {
    if (selectedGroups.length === 0) return
    selectedGroups.forEach((g) => {
      void groupControls.handleDeleteGroup(g.id)
    })
    setBulkDeleteDialogOpen(false)
    exitSelectionMode()
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
          active={library.activeGroupId === ALL_BOOKMARKS_GROUP_ID}
          selectionMode={selectionMode}
          onSelectAll={() => library.setActiveGroupId(ALL_BOOKMARKS_GROUP_ID)}
          onOpenAll={() => library.handleOpenGroup(ALL_BOOKMARKS_GROUP_ID)}
          onToggleSelectionMode={() => {
            if (selectionMode) exitSelectionMode()
            else enterSelectionMode()
          }}
          onActionMenuOpenChange={handleActionMenuOpenChange}
        />

        <AllBookmarksRow
          active={library.activeGroupId === MOST_VISITED_GROUP_ID}
          selectionMode={selectionMode}
          onSelectAll={() => library.setActiveGroupId(MOST_VISITED_GROUP_ID)}
          onOpenAll={() => library.handleOpenGroup(MOST_VISITED_GROUP_ID)}
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
              if (selectionMode || groupControls.editingGroupId || groupControls.isInlineCreating) return
              handleGroupDragStart(event)
            }}
            onDragEnd={(event) => {
              if (selectionMode || groupControls.editingGroupId || groupControls.isInlineCreating) return
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
                {library.groups.map((group) => {
                  if (group.id === NO_GROUP_ID) {
                    const isActive = library.activeGroupId === NO_GROUP_ID
                    const NoGroupIcon =
                      ALL_ICONS_MAP[group.icon || "folder"] ?? ALL_ICONS_MAP["folder"]
                    return (
                      <button
                        type="button"
                        key={group.id}
                        aria-label={NO_GROUP_NAME}
                        onClick={() => {
                          if (selectionMode) return
                          library.setActiveGroupId(NO_GROUP_ID)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            if (selectionMode) return
                            library.setActiveGroupId(NO_GROUP_ID)
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
                      </button>
                    )
                  }

                  const isEditing = groupControls.editingGroupId === group.id
                  const dndDisabled =
                    selectionMode ||
                    groupControls.isInlineCreating ||
                    Boolean(groupControls.editingGroupId) ||
                    isEditing

                  if (isEditing) {
                    return (
                      <GroupEditCard
                        key={group.id}
                        group={group}
                        IconPickerPopover={IconPickerPopover}
                        editGroupName={groupControls.editGroupName}
                        setEditGroupName={groupControls.setEditGroupName}
                        editGroupIcon={groupControls.editGroupIcon}
                        setEditGroupIcon={groupControls.setEditGroupIcon}
                        editGroupColor={groupControls.editGroupColor}
                        setEditGroupColor={groupControls.setEditGroupColor}
                        isUpdatingGroup={groupControls.isUpdatingGroup}
                        onCancel={groupControls.cancelEditingGroup}
                        onSave={() => groupControls.handleSidebarGroupUpdate(group.id)}
                      />
                    )
                  }

                  return (
                    <SortableGroupRowItem key={group.id} id={group.id} disabled={dndDisabled}>
                      <GroupRowItem
                        group={group}
                        active={library.activeGroupId === group.id}
                        selectionMode={selectionMode}
                        isSelected={selectedGroupIds.has(group.id)}
                        onToggleSelected={() => toggleSelected(group.id)}
                        onSelectGroup={() => library.setActiveGroupId(group.id)}
                        onEnterSelectionMode={enterSelectionMode}
                        onOpenGroup={() => library.handleOpenGroup(group.id)}
                        onEdit={() => groupControls.startEditingGroup(group)}
                        onRequestDelete={() => openDeleteDialog(group)}
                        onToggleHideFromAllBookmarks={(hide) =>
                          groupControls.handleToggleHideFromAllBookmarks(group.id, hide)
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
        isInlineCreating={groupControls.isInlineCreating}
        setIsInlineCreating={groupControls.setIsInlineCreating}
        IconPickerPopover={IconPickerPopover}
        newGroupName={groupControls.newGroupName}
        setNewGroupName={groupControls.setNewGroupName}
        newGroupIcon={groupControls.newGroupIcon}
        setNewGroupIcon={groupControls.setNewGroupIcon}
        newGroupColor={groupControls.newGroupColor}
        setNewGroupColor={groupControls.setNewGroupColor}
        isCreatingGroup={groupControls.isCreatingGroup}
        onCreate={() => groupControls.handleInlineCreateGroup()}
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

  if (library.layoutDensity !== "extended") {
    const canReveal = viewportWidth >= 900

    return (
      <>
        {canPin ? (
          <aside
            className="fixed left-6 top-43 bottom-6 z-30 w-60 flex flex-col gap-2 text-sm text-muted-foreground"
            data-onboarding="groups-desktop"
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
})
