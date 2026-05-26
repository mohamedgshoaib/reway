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

export async function createGroup(formData: { name: string; icon: string; color?: string | null }) {
  return groupsMutations.create(formData)
}

export async function updateGroup(
  id: string,
  formData: {
    name: string
    icon: string
    color?: string | null
    hide_from_all_bookmarks?: boolean | null
  },
) {
  return groupsMutations.update(id, formData)
}

export async function updateGroupsOrder(updates: { id: string; order_index: number }[]) {
  return groupsMutations.updateOrder(updates)
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
}) {
  return groupsMutations.restore(group)
}

export async function toggleHideFromAllBookmarks(id: string, hide: boolean) {
  return groupsMutations.setHiddenFromAllBookmarks(id, hide)
}
