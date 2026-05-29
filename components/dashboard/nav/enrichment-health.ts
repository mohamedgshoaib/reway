import type { BookmarkRow } from "@/lib/supabase/queries"

const STUCK_AFTER_MS = 15 * 60 * 1000

export interface EnrichmentHealthSummary {
  active: number
  needsRefresh: number
  failed: number
  stuck: number
  oldestActiveAge: number
}

export function formatEnrichmentAge(ageMs: number) {
  const minutes = Math.max(0, Math.floor(ageMs / 60000))
  if (minutes < 1) return "<1m"
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return `${Math.floor(hours / 24)}d`
}

export function getCreatedAge(bookmark: BookmarkRow, now: number) {
  const createdAt = Date.parse(bookmark.created_at)
  return Number.isNaN(createdAt) ? 0 : Math.max(0, now - createdAt)
}

export function isActiveEnrichment(bookmark: BookmarkRow) {
  return Boolean(bookmark.is_enriching || bookmark.status === "pending")
}

export function needsRefresh(bookmark: BookmarkRow) {
  return bookmark.status === "pending" && !bookmark.is_enriching
}

function hasUsefulMetadata(bookmark: BookmarkRow) {
  return Boolean(bookmark.favicon_url || bookmark.title?.trim() || bookmark.description?.trim())
}

export function needsFailedAttention(bookmark: BookmarkRow) {
  return bookmark.status === "failed" && !hasUsefulMetadata(bookmark)
}

export function isStuck(bookmark: BookmarkRow, now: number) {
  return isActiveEnrichment(bookmark) && getCreatedAge(bookmark, now) >= STUCK_AFTER_MS
}

export function getEnrichmentHealthSummary(
  bookmarks: BookmarkRow[],
  now = Date.now(),
): EnrichmentHealthSummary {
  let active = 0
  let needsRefreshCount = 0
  let failed = 0
  let stuck = 0
  let oldestActiveAge = 0

  for (const bookmark of bookmarks) {
    if (needsRefresh(bookmark)) needsRefreshCount += 1
    if (needsFailedAttention(bookmark)) failed += 1
    if (!isActiveEnrichment(bookmark)) continue

    active += 1
    const age = getCreatedAge(bookmark, now)
    oldestActiveAge = Math.max(oldestActiveAge, age)
    if (age >= STUCK_AFTER_MS) stuck += 1
  }

  return { active, needsRefresh: needsRefreshCount, failed, stuck, oldestActiveAge }
}
