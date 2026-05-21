const VISITS_ENDPOINT = "/api/bookmarks/visits"
const MAX_VISIT_BATCH_SIZE = 500

function normalizeBookmarkIds(bookmarkIds: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      bookmarkIds
        .map((bookmarkId) => bookmarkId?.trim())
        .filter((bookmarkId): bookmarkId is string => Boolean(bookmarkId)),
    ),
  ).slice(0, MAX_VISIT_BATCH_SIZE)
}

export function recordBookmarkVisit(bookmarkId?: string | null) {
  recordBookmarkVisits(bookmarkId ? [bookmarkId] : [])
}

export function recordBookmarkVisits(bookmarkIds: Array<string | null | undefined>) {
  const ids = normalizeBookmarkIds(bookmarkIds)
  if (ids.length === 0 || typeof window === "undefined") return

  const body = JSON.stringify({ bookmarkIds: ids })

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const payload = new Blob([body], { type: "application/json" })
    if (navigator.sendBeacon(VISITS_ENDPOINT, payload)) {
      return
    }
  }

  void fetch(VISITS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {})
}
