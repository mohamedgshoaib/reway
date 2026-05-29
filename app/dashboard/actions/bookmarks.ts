"use server"

import { bookmarkMutations } from "@/lib/dashboard/server/library-mutations"

export async function getBookmarkDetails(id: string) {
  return bookmarkMutations.getDetails(id)
}

export async function checkDuplicateBookmarks(urls: string[]): Promise<{
  duplicates: Record<string, { id: string; title: string; url: string }>
}> {
  return bookmarkMutations.checkDuplicates(urls)
}

export async function addBookmark(formData: {
  url: string
  id?: string
  title?: string
  favicon_url?: string
  og_image_url?: string
  description?: string
  group_id?: string
  order_index?: number
  rank?: string
}) {
  return bookmarkMutations.add(formData)
}

export async function enrichCreatedBookmark(id: string, url: string) {
  return bookmarkMutations.enrichCreated(id, url)
}

export async function refreshBookmarkMetadata(id: string) {
  return bookmarkMutations.refresh(id)
}

export async function updateBookmarkRank(update: { id: string; rank: string }) {
  return bookmarkMutations.updateRank(update)
}

export async function moveBookmarksToGroup(ids: string[], targetGroupId: string | null) {
  return bookmarkMutations.moveToGroup(ids, targetGroupId)
}

export async function deleteBookmarks(ids: string[]) {
  return bookmarkMutations.deleteMany(ids)
}

export async function restoreBookmark(bookmark: {
  id: string
  url: string
  title: string
  description?: string | null
  group_id?: string | null
  favicon_url?: string | null
  og_image_url?: string | null
  image_url?: string | null
  order_index?: number | null
  rank?: string | null
  created_at?: string | null
  status?: string | null
  visit_count?: number | null
  last_visited_at?: string | null
}) {
  return bookmarkMutations.restore(bookmark)
}

export async function deleteBookmark(id: string) {
  return bookmarkMutations.delete(id)
}

export async function enrichBookmark(
  id: string,
  metadata: {
    title?: string
    favicon_url?: string
    og_image_url?: string
    description?: string
    image_url?: string
    status?: "pending" | "ready" | "failed"
  },
) {
  return bookmarkMutations.enrich(id, metadata)
}

export async function updateBookmark(
  id: string,
  formData: {
    title: string
    url: string
    description?: string
    group_id?: string | null
    favicon_url?: string | null
    apply_favicon_to_domain?: boolean
  },
) {
  return bookmarkMutations.update(id, formData)
}
