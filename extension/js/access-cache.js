export const ACCESS_CACHE_TTL_MS = 5 * 60 * 1000

const GROUP_CACHE_KEYS = ["rewayGroups", "rewayGroupsFetchedAt"]
export const BOOKMARK_CACHE_KEY = "rewayAccessBookmarksByGroup"
const MAX_BOOKMARK_GROUP_CACHE_ENTRIES = 30

function getNow() {
  return Date.now()
}

function isFreshTimestamp(timestamp) {
  return Number.isFinite(timestamp) && getNow() - timestamp < ACCESS_CACHE_TTL_MS
}

function getBookmarkCacheKey(groupId) {
  return groupId || "none"
}

function isQuotaError(error) {
  const message = String(error?.message || error || "").toLowerCase()
  return message.includes("quota") || message.includes("storage")
}

async function setLocalWithBookmarkEviction(value) {
  try {
    await chrome.storage.local.set(value)
  } catch (error) {
    if (!isQuotaError(error)) throw error
    await evictOldestBookmarkCaches()
    await chrome.storage.local.set(value)
  }
}

export async function readCachedGroups() {
  const { rewayGroups, rewayGroupsFetchedAt } = await chrome.storage.local.get(GROUP_CACHE_KEYS)
  const groups = Array.isArray(rewayGroups) ? rewayGroups : []
  const fetchedAt = typeof rewayGroupsFetchedAt === "number" ? rewayGroupsFetchedAt : null

  return {
    groups,
    fetchedAt,
    isFresh: isFreshTimestamp(fetchedAt),
  }
}

export async function writeCachedGroups(groups) {
  await chrome.storage.local.set({
    rewayGroups: Array.isArray(groups) ? groups : [],
    rewayGroupsFetchedAt: getNow(),
  })
}

export async function readCachedBookmarks(groupId) {
  const cacheKey = getBookmarkCacheKey(groupId)
  const { [BOOKMARK_CACHE_KEY]: cache } = await chrome.storage.local.get(BOOKMARK_CACHE_KEY)
  const entry = cache && typeof cache === "object" ? cache[cacheKey] : null
  const bookmarks = Array.isArray(entry?.bookmarks) ? entry.bookmarks : []
  const fetchedAt = typeof entry?.fetchedAt === "number" ? entry.fetchedAt : null

  return {
    bookmarks,
    fetchedAt,
    isFresh: isFreshTimestamp(fetchedAt),
  }
}

export async function writeCachedBookmarks(groupId, bookmarks) {
  const cacheKey = getBookmarkCacheKey(groupId)
  const { [BOOKMARK_CACHE_KEY]: existingCache } = await chrome.storage.local.get(BOOKMARK_CACHE_KEY)
  const cache = existingCache && typeof existingCache === "object" ? existingCache : {}

  const nextCache = {
    ...cache,
    [cacheKey]: {
      bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
      fetchedAt: getNow(),
      lastAccessedAt: getNow(),
    },
  }

  await setLocalWithBookmarkEviction({ [BOOKMARK_CACHE_KEY]: pruneBookmarkCache(nextCache) })
}

export async function touchBookmarkCache(groupId) {
  const cacheKey = getBookmarkCacheKey(groupId)
  const { [BOOKMARK_CACHE_KEY]: existingCache } = await chrome.storage.local.get(BOOKMARK_CACHE_KEY)
  const cache = existingCache && typeof existingCache === "object" ? existingCache : {}
  if (!cache[cacheKey]) return

  await setLocalWithBookmarkEviction({
    [BOOKMARK_CACHE_KEY]: {
      ...cache,
      [cacheKey]: {
        ...cache[cacheKey],
        lastAccessedAt: getNow(),
      },
    },
  })
}

export async function clearAccessCaches() {
  await chrome.storage.local.remove([...GROUP_CACHE_KEYS, BOOKMARK_CACHE_KEY])
}

export async function evictOldestBookmarkCaches(targetSize = MAX_BOOKMARK_GROUP_CACHE_ENTRIES - 5) {
  const { [BOOKMARK_CACHE_KEY]: existingCache } = await chrome.storage.local.get(BOOKMARK_CACHE_KEY)
  const cache = existingCache && typeof existingCache === "object" ? existingCache : {}
  await chrome.storage.local.set({ [BOOKMARK_CACHE_KEY]: pruneBookmarkCache(cache, targetSize) })
}

function pruneBookmarkCache(cache, maxEntries = MAX_BOOKMARK_GROUP_CACHE_ENTRIES) {
  const entries = Object.entries(cache)
  if (entries.length <= maxEntries) return cache

  return Object.fromEntries(
    entries
      .sort(([, a], [, b]) => {
        const aTime = typeof a?.lastAccessedAt === "number" ? a.lastAccessedAt : 0
        const bTime = typeof b?.lastAccessedAt === "number" ? b.lastAccessedAt : 0
        return bTime - aTime
      })
      .slice(0, maxEntries),
  )
}
