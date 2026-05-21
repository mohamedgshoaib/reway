"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { checkDuplicateGroup, toggleHideFromAllBookmarks } from "@/app/dashboard/actions/groups"
import type { BookmarkRow, GroupRow } from "@/lib/supabase/queries"
import { ALL_BOOKMARKS_GROUP_ID } from "@/lib/system-groups"

interface UseGroupActionsOptions {
  userId: string
  activeGroupId: string
  groups: GroupRow[]
  bookmarks: BookmarkRow[]
  setGroups: React.Dispatch<React.SetStateAction<GroupRow[]>>
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkRow[]>>
  sortBookmarks: (items: BookmarkRow[]) => BookmarkRow[]
  sortGroups: (items: GroupRow[]) => GroupRow[]
  setActiveGroupId: (id: string) => void
  editGroupName: string
  editGroupIcon: string
  editGroupColor: string | null
  setEditingGroupId: (value: string | null) => void
  isUpdatingGroup: boolean
  setIsUpdatingGroup: (value: boolean) => void
  lastDeletedGroupRef: React.MutableRefObject<GroupRow | null>
  createGroup: (formData: { name: string; icon: string; color?: string | null }) => Promise<string>
  updateGroup: (
    id: string,
    formData: {
      name: string
      icon: string
      color?: string | null
      hide_from_all_bookmarks?: boolean | null
    },
  ) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  restoreGroup: (group: {
    id: string
    name: string
    icon: string
    color?: string | null
    hide_from_all_bookmarks?: boolean | null
  }) => Promise<void>
  restoreBookmark: (bookmark: BookmarkRow) => Promise<void>
  lastDeletedGroupBookmarksRef: React.MutableRefObject<BookmarkRow[]>
  initialGroups: GroupRow[]
  newGroupName: string
  newGroupIcon: string
  newGroupColor: string | null
  setIsInlineCreating: (value: boolean) => void
  setNewGroupName: (value: string) => void
  setNewGroupIcon: (value: string) => void
  setNewGroupColor: (value: string | null) => void
  isCreatingGroup: boolean
  setIsCreatingGroup: (value: boolean) => void
}

export function useGroupActions({
  userId,
  activeGroupId,
  groups,
  bookmarks,
  setGroups,
  setBookmarks,
  sortBookmarks,
  sortGroups,
  setActiveGroupId,
  editGroupName,
  editGroupIcon,
  editGroupColor,
  setEditingGroupId,
  isUpdatingGroup,
  setIsUpdatingGroup,
  lastDeletedGroupRef,
  createGroup,
  updateGroup,
  deleteGroup,
  restoreGroup,
  restoreBookmark,
  lastDeletedGroupBookmarksRef,
  initialGroups,
  newGroupName,
  newGroupIcon,
  newGroupColor,
  setIsInlineCreating,
  setNewGroupName,
  setNewGroupIcon,
  setNewGroupColor,
  isCreatingGroup,
  setIsCreatingGroup,
}: UseGroupActionsOptions) {
  const getDuplicateMessage = (error: unknown) => {
    if (error instanceof Error) {
      if (/already exists/i.test(error.message)) {
        return error.message
      }
    }
    return null
  }

  const handleGroupCreated = useCallback(
    (id: string, name: string, icon: string, color?: string | null) => {
      const newGroup: GroupRow = {
        id,
        name,
        icon,
        user_id: userId,
        created_at: new Date().toISOString(),
        hide_from_all_bookmarks: false,
        color: color ?? null,
        order_index: null,
      }
      setGroups((prev) => sortGroups([...prev, newGroup]))
      setActiveGroupId(id)
    },
    [setActiveGroupId, setGroups, sortGroups, userId],
  )

  const handleUpdateGroup = useCallback(
    async (id: string, name: string, icon: string, color?: string | null) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, name, icon, color: color ?? null } : g)),
      )
      try {
        await updateGroup(id, { name, icon, color: color ?? null })
      } catch (error) {
        console.error("Update group failed:", error)
        toast.error("Failed to update group")
        setGroups((prev) =>
          prev.map((g) => (g.id === id ? groups.find((og) => og.id === id) || g : g)),
        )
      }
    },
    [groups, setGroups, updateGroup],
  )

  const handleSidebarGroupUpdate = useCallback(
    async (id: string, onError?: () => void) => {
      if (!editGroupName.trim() || isUpdatingGroup) return
      setIsUpdatingGroup(true)
      try {
        const { exists } = await checkDuplicateGroup(editGroupName.trim(), id)
        if (exists) {
          toast.error(`A group named "${editGroupName.trim()}" already exists`)
          onError?.()
          return
        }

        await handleUpdateGroup(id, editGroupName.trim(), editGroupIcon, editGroupColor)
        setEditingGroupId(null)
      } catch (error) {
        console.error("Failed to update group:", error)
        const duplicateMessage = getDuplicateMessage(error)
        if (duplicateMessage) {
          toast.error(duplicateMessage)
          onError?.()
        } else {
          toast.error("Failed to update group")
        }
      } finally {
        setIsUpdatingGroup(false)
      }
    },
    [
      editGroupColor,
      editGroupIcon,
      editGroupName,
      handleUpdateGroup,
      isUpdatingGroup,
      setEditingGroupId,
      setIsUpdatingGroup,
    ],
  )

  const handleDeleteGroup = useCallback(
    async (id: string) => {
      let deletedGroup: GroupRow | undefined
      let deletedBookmarks: BookmarkRow[] = []

      setGroups((prev) => {
        deletedGroup = prev.find((g) => g.id === id)
        if (deletedGroup) {
          lastDeletedGroupRef.current = deletedGroup
        }
        return prev.filter((g) => g.id !== id)
      })

      if (activeGroupId === id) {
        setActiveGroupId(ALL_BOOKMARKS_GROUP_ID)
      }

      deletedBookmarks = bookmarks.filter((bookmark) => bookmark.group_id === id)
      lastDeletedGroupBookmarksRef.current = deletedBookmarks
      if (deletedBookmarks.length > 0) {
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.group_id !== id))
      }

      if (deletedGroup) {
        toast.error("Group deleted", {
          action: {
            label: "Undo",
            onClick: async () => {
              const lastDeleted = lastDeletedGroupRef.current
              if (!lastDeleted) return
              setGroups((prev) => {
                if (prev.some((g) => g.id === lastDeleted.id)) return prev
                return sortGroups([...prev, lastDeleted])
              })
              const restoreBookmarks = lastDeletedGroupBookmarksRef.current
              if (restoreBookmarks.length > 0) {
                setBookmarks((prev) => {
                  const existingIds = new Set(prev.map((item) => item.id))
                  const missing = restoreBookmarks.filter(
                    (bookmark) => !existingIds.has(bookmark.id),
                  )
                  if (missing.length === 0) return prev
                  return sortBookmarks([...prev, ...missing])
                })
              }
              try {
                await restoreGroup({
                  id: lastDeleted.id,
                  name: lastDeleted.name,
                  icon: lastDeleted.icon || "folder",
                  color: lastDeleted.color,
                  hide_from_all_bookmarks: lastDeleted.hide_from_all_bookmarks,
                })
                if (restoreBookmarks.length > 0) {
                  await Promise.allSettled(
                    restoreBookmarks.map((bookmark) => restoreBookmark(bookmark)),
                  )
                }
              } catch (error) {
                console.error("Restore group failed:", error)
                toast.error("Failed to restore group")
              }
            },
          },
        })
      }

      try {
        await deleteGroup(id)
      } catch (error) {
        console.error("Delete group failed:", error)
        toast.error("Failed to delete group")
        setGroups((prev) => {
          const deletedFromInitial = initialGroups.find((g) => g.id === id)
          return deletedFromInitial ? sortGroups([...prev, deletedFromInitial]) : prev
        })
        if (deletedBookmarks.length > 0) {
          setBookmarks((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const missing = deletedBookmarks.filter((bookmark) => !existingIds.has(bookmark.id))
            if (missing.length === 0) return prev
            return sortBookmarks([...prev, ...missing])
          })
        }
      }
    },
    [
      activeGroupId,
      bookmarks,
      deleteGroup,
      initialGroups,
      lastDeletedGroupRef,
      lastDeletedGroupBookmarksRef,
      restoreGroup,
      restoreBookmark,
      setActiveGroupId,
      setBookmarks,
      setGroups,
      sortBookmarks,
      sortGroups,
    ],
  )

  const handleInlineCreateGroup = useCallback(
    async (onError?: () => void) => {
      if (!newGroupName.trim() || isCreatingGroup) return
      setIsCreatingGroup(true)
      try {
        const { exists } = await checkDuplicateGroup(newGroupName.trim())
        if (exists) {
          toast.error(`A group named "${newGroupName.trim()}" already exists`)
          onError?.()
          return
        }

        const groupId = await createGroup({
          name: newGroupName.trim(),
          icon: newGroupIcon,
          color: newGroupColor,
        })
        handleGroupCreated(groupId, newGroupName.trim(), newGroupIcon, newGroupColor)
        setIsInlineCreating(false)
        setNewGroupName("")
        setNewGroupIcon("folder")
        setNewGroupColor("#6366f1")
      } catch (error) {
        console.error("Failed to create group:", error)
        const duplicateMessage = getDuplicateMessage(error)
        if (duplicateMessage) {
          toast.error(duplicateMessage)
          onError?.()
        } else {
          toast.error("Failed to create group")
        }
      } finally {
        setIsCreatingGroup(false)
      }
    },
    [
      createGroup,
      handleGroupCreated,
      isCreatingGroup,
      newGroupColor,
      newGroupIcon,
      newGroupName,
      setIsCreatingGroup,
      setIsInlineCreating,
      setNewGroupColor,
      setNewGroupIcon,
      setNewGroupName,
    ],
  )

  const handleToggleHideFromAllBookmarks = useCallback(
    async (id: string, hide: boolean) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, hide_from_all_bookmarks: hide } : g)),
      )

      try {
        await toggleHideFromAllBookmarks(id, hide)
        toast.success(hide ? "Hidden from All" : "Visible in All")
      } catch (error) {
        console.error("Toggle group visibility failed:", error)
        toast.error("Failed to update group visibility")
        setGroups((prev) =>
          prev.map((g) => (g.id === id ? groups.find((og) => og.id === id) || g : g)),
        )
      }
    },
    [groups, setGroups],
  )

  return {
    handleGroupCreated,
    handleUpdateGroup,
    handleSidebarGroupUpdate,
    handleDeleteGroup,
    handleInlineCreateGroup,
    handleToggleHideFromAllBookmarks,
  }
}
