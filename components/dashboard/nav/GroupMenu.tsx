"use client"

import { Folder01Icon, RepeatIcon } from "@hugeicons/core-free-icons"
import { type IconSvgElement } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { GroupRow as GroupRowType } from "@/lib/supabase/queries"
import {
  ALL_BOOKMARKS_GROUP_ID,
  ALL_BOOKMARKS_GROUP_NAME,
  MOST_VISITED_GROUP_ID,
  MOST_VISITED_GROUP_NAME,
  NO_GROUP_ID,
} from "@/lib/system-groups"
import type { IconPickerPopoverProps } from "../IconPickerPopover"
import { AllBookmarksItem } from "./group-menu/AllBookmarksItem"
import { GroupCreateRow } from "./group-menu/GroupCreateRow"
import { GroupDeleteDialogs } from "./group-menu/GroupDeleteDialogs"
import { GroupEditRow } from "./group-menu/GroupEditRow"
import { GroupMenuTrigger } from "./group-menu/GroupMenuTrigger"
import { GroupRow } from "./group-menu/GroupRow"
import { NoGroupItem } from "./group-menu/NoGroupItem"
import { SelectionModeHeader } from "./group-menu/SelectionModeHeader"

const IconPickerPopover = dynamic<IconPickerPopoverProps>(
  () => import("../IconPickerPopover").then((mod) => mod.IconPickerPopover),
  {
    loading: () => <div className="size-8 animate-pulse rounded-lg bg-primary/10" />,
    ssr: false,
  },
)

interface GroupMenuProps {
  groups: GroupRowType[]
  activeGroupId: string
  groupCounts?: Record<string, number>
  onGroupSelect: (id: string) => void
  onGroupOpen?: (id: string) => void
  onDeleteGroupClick: (id: string) => void
  editingGroupId: string | null
  editGroupName: string
  setEditGroupName: (value: string) => void
  editGroupIcon: string
  setEditGroupIcon: (value: string) => void
  editGroupColor: string | null
  setEditGroupColor: (value: string | null) => void
  isUpdating: boolean
  onUpdateGroup: (id: string, onError?: () => void) => void
  isInlineCreating: boolean
  setIsInlineCreating: (value: boolean) => void
  newGroupName: string
  setNewGroupName: (value: string) => void
  newGroupIcon: string
  setNewGroupIcon: (value: string) => void
  newGroupColor: string | null
  setNewGroupColor: (value: string | null) => void
  isCreating: boolean
  onInlineCreate: (onError?: () => void) => void
  onInlineCreateCancel: () => void
  setEditingGroupId: (value: string | null) => void
}

export function GroupMenu({
  groups,
  activeGroupId,
  groupCounts,
  onGroupSelect,
  onGroupOpen,
  onDeleteGroupClick,
  editingGroupId,
  editGroupName,
  setEditGroupName,
  editGroupIcon,
  setEditGroupIcon,
  editGroupColor,
  setEditGroupColor,
  isUpdating,
  onUpdateGroup,
  isInlineCreating,
  setIsInlineCreating,
  newGroupName,
  setNewGroupName,
  newGroupIcon,
  setNewGroupIcon,
  newGroupColor,
  setNewGroupColor,
  isCreating,
  onInlineCreate,
  onInlineCreateCancel,
  setEditingGroupId,
}: GroupMenuProps) {
  void groupCounts
  const [menuOpen, setMenuOpen] = useState(false)
  const [iconsMap, setIconsMap] = useState<Record<string, IconSvgElement> | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroupRowType | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(() => new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    import("@/lib/hugeicons-list")
      .then((mod) => {
        if (cancelled) return
        setIconsMap(mod.ALL_ICONS_MAP as Record<string, IconSvgElement>)
      })
      .catch(() => {
        if (cancelled) return
        setIconsMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const openHandler = () => setMenuOpen(true)
    const closeHandler = () => setMenuOpen(false)
    window.addEventListener("reway:open-groups-menu", openHandler)
    window.addEventListener("reway:close-groups-menu", closeHandler)
    return () => {
      window.removeEventListener("reway:open-groups-menu", openHandler)
      window.removeEventListener("reway:close-groups-menu", closeHandler)
    }
  }, [])

  const activeGroup =
    activeGroupId === ALL_BOOKMARKS_GROUP_ID
      ? { name: ALL_BOOKMARKS_GROUP_NAME, color: null }
      : activeGroupId === MOST_VISITED_GROUP_ID
        ? { name: MOST_VISITED_GROUP_NAME, color: null }
        : groups.find((g) => g.id === activeGroupId) || {
            name: "Unknown",
            color: null,
          }

  const ActiveIcon =
    activeGroupId === ALL_BOOKMARKS_GROUP_ID
      ? Folder01Icon
      : activeGroupId === MOST_VISITED_GROUP_ID
        ? RepeatIcon
        : (() => {
            const activeGroupRow = groups.find((g) => g.id === activeGroupId)
            return activeGroupRow?.icon
              ? (iconsMap?.[activeGroupRow.icon] ?? Folder01Icon)
              : Folder01Icon
          })()

  const openDeleteDialog = (group: GroupRowType) => {
    setDeleteTarget(group)
    setDeleteDialogOpen(true)
  }

  const enterSelectionMode = () => {
    setSelectionMode(true)
    setSelectedGroupIds(new Set())
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedGroupIds(new Set())
  }

  const toggleSelected = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const selectedCount = selectedGroupIds.size

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteGroupClick(deleteTarget.id)
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const handleBulkDelete = () => {
    if (selectedCount === 0) return
    setBulkDeleteDialogOpen(true)
  }

  const handleConfirmBulkDelete = () => {
    if (selectedGroupIds.size === 0) return
    Array.from(selectedGroupIds).forEach((id) => onDeleteGroupClick(id))
    setBulkDeleteDialogOpen(false)
    exitSelectionMode()
    setMenuOpen(false)
  }

  return (
    <div className="min-[1200px]:hidden">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <GroupMenuTrigger activeGroup={activeGroup} ActiveIcon={ActiveIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          data-onboarding="groups-mobile-content"
          className="w-56 p-2 animate-in slide-in-from-top-2 duration-200 motion-reduce:animate-none shadow-none"
        >
          {selectionMode ? (
            <SelectionModeHeader
              selectedCount={selectedCount}
              disableDelete={selectedCount === 0}
              onCancel={(e) => {
                e.preventDefault()
                e.stopPropagation()
                exitSelectionMode()
              }}
              onDelete={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBulkDelete()
              }}
            />
          ) : null}

          <AllBookmarksItem
            active={activeGroupId === ALL_BOOKMARKS_GROUP_ID}
            selectionMode={selectionMode}
            onSelectAll={() => {
              onGroupSelect(ALL_BOOKMARKS_GROUP_ID)
              setMenuOpen(false)
            }}
          />

          <AllBookmarksItem
            active={activeGroupId === MOST_VISITED_GROUP_ID}
            selectionMode={selectionMode}
            onSelectAll={() => {
              onGroupSelect(MOST_VISITED_GROUP_ID)
              setMenuOpen(false)
            }}
            label={MOST_VISITED_GROUP_NAME}
            icon={RepeatIcon}
          />

          {groups.length > 0 ? (
            <div
              className={`max-h-75 overflow-y-auto ${
                groups.length > 1 ? "border-t border-border/50 my-1 pt-1" : "mt-1"
              }`}
            >
              {groups.map((group) => {
                const GroupIcon = group.icon
                  ? (iconsMap?.[group.icon] ?? Folder01Icon)
                  : Folder01Icon
                const isEditing = editingGroupId === group.id
                const isNoGroup = group.id === NO_GROUP_ID

                if (isNoGroup) {
                  return (
                    <NoGroupItem
                      key={group.id}
                      groupId={group.id}
                      isActive={activeGroupId === group.id}
                      selectionMode={selectionMode}
                      GroupIcon={GroupIcon}
                      onSelect={(id) => {
                        onGroupSelect(id)
                        setMenuOpen(false)
                      }}
                    />
                  )
                }

                if (isEditing) {
                  return (
                    <GroupEditRow
                      key={group.id}
                      group={group}
                      iconsMap={iconsMap}
                      IconPickerPopover={IconPickerPopover}
                      editGroupName={editGroupName}
                      setEditGroupName={setEditGroupName}
                      editGroupIcon={editGroupIcon}
                      setEditGroupIcon={setEditGroupIcon}
                      editGroupColor={editGroupColor}
                      setEditGroupColor={setEditGroupColor}
                      onUpdateGroup={onUpdateGroup}
                      isUpdating={isUpdating}
                      setEditingGroupId={setEditingGroupId}
                    />
                  )
                }

                return (
                  <GroupRow
                    key={group.id}
                    group={group}
                    GroupIcon={GroupIcon}
                    selectionMode={selectionMode}
                    active={activeGroupId === group.id}
                    selected={selectedGroupIds.has(group.id)}
                    onToggleSelected={() => toggleSelected(group.id)}
                    onSelectGroup={() => {
                      onGroupSelect(group.id)
                      setMenuOpen(false)
                    }}
                    onOpenGroup={onGroupOpen ? () => onGroupOpen(group.id) : undefined}
                    onEnterSelectionModeAndToggle={() => {
                      enterSelectionMode()
                      toggleSelected(group.id)
                    }}
                    onToggleInSelectionMode={() => {
                      toggleSelected(group.id)
                    }}
                    onEditGroup={() => {
                      setEditingGroupId(group.id)
                      setEditGroupName(group.name)
                      setEditGroupIcon(group.icon || "folder")
                      setEditGroupColor(group.color || "#6366f1")
                    }}
                    onDeleteGroup={() => {
                      openDeleteDialog(group)
                    }}
                  />
                )
              })}
            </div>
          ) : null}

          <DropdownMenuSeparator className="my-2" />

          <GroupCreateRow
            isInlineCreating={isInlineCreating}
            setIsInlineCreating={setIsInlineCreating}
            iconsMap={iconsMap}
            IconPickerPopover={IconPickerPopover}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            newGroupIcon={newGroupIcon}
            setNewGroupIcon={setNewGroupIcon}
            newGroupColor={newGroupColor}
            setNewGroupColor={setNewGroupColor}
            isCreating={isCreating}
            onInlineCreate={onInlineCreate}
            onInlineCreateCancel={onInlineCreateCancel}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <GroupDeleteDialogs
        deleteDialogOpen={deleteDialogOpen}
        onDeleteDialogOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteTarget(null)
          }
        }}
        deleteTarget={deleteTarget}
        onConfirmDelete={handleDeleteConfirm}
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        onBulkDeleteDialogOpenChange={(open) => setBulkDeleteDialogOpen(open)}
        selectedCount={selectedCount}
        onConfirmBulkDelete={handleConfirmBulkDelete}
      />
    </div>
  )
}
