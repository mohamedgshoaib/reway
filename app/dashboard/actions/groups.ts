"use server"

import { groupsMutations } from "@/lib/dashboard/server/library-mutations"

export async function checkDuplicateGroup(
  name: string,
  excludeId?: string,
): Promise<{
  exists: boolean
  group?: { id: string; name: string }
}> {
  return groupsMutations.checkDuplicate(name, excludeId)
}

export async function createGroup(formData: {
  name: string
  icon: string
  color?: string | null
  rank?: string | null
}) {
  return groupsMutations.create(formData)
}

export async function updateGroup(
  id: string,
  formData: {
    name: string
    icon: string
    color?: string | null
    hide_from_all_bookmarks?: boolean | null
    show_in_fab?: boolean | null
  },
) {
  return groupsMutations.update(id, formData)
}

export async function updateGroupRank(update: { id: string; rank: string }) {
  return groupsMutations.updateRank(update)
}

export async function deleteGroup(id: string) {
  return groupsMutations.delete(id)
}

export async function restoreGroup(group: {
  id: string
  name: string
  icon: string
  color?: string | null
  hide_from_all_bookmarks?: boolean | null
  show_in_fab?: boolean | null
  order_index?: number | null
  rank?: string | null
}) {
  return groupsMutations.restore(group)
}

export async function toggleHideFromAllBookmarks(id: string, hide: boolean) {
  return groupsMutations.setHiddenFromAllBookmarks(id, hide)
}

export async function toggleShowInQuickAccess(id: string, show: boolean) {
  return groupsMutations.setShownInFab(id, show)
}
