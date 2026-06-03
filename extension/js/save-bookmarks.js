import { apiFetch } from "./api.js"

const DEFAULT_BATCH_CONCURRENCY = 4

export async function resolveDestinationGroupId({ mode, existingGroupId, groupName }) {
  if (mode !== "new") {
    return existingGroupId
  }

  const groupData = await apiFetch("/api/extension/groups", {
    method: "POST",
    body: JSON.stringify({ name: groupName }),
  })

  return groupData.group.id
}

export async function saveBookmarkBatch(
  items,
  buildPayload,
  concurrency = DEFAULT_BATCH_CONCURRENCY,
) {
  const results = []

  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map((item) =>
        apiFetch("/api/extension/bookmarks", {
          method: "POST",
          body: JSON.stringify(buildPayload(item)),
        }),
      ),
    )
    results.push(...batchResults)
  }

  return results
}

export function isDuplicateBookmarkError(error) {
  if (error?.status === 409) return true

  const code = error?.data?.code
  if (code === "23505") return true

  const message = String(error?.message || "").toLowerCase()
  return (
    message.includes("already exists") ||
    message.includes("duplicate") ||
    message.includes("unique constraint")
  )
}

export function partitionBookmarkBatchResults(results) {
  const fulfilled = results.filter((result) => result.status === "fulfilled")
  const rejected = results.filter((result) => result.status === "rejected")
  const conflicts = rejected.filter((result) => isDuplicateBookmarkError(result.reason))
  const nonConflictFailures = rejected.filter((result) => !isDuplicateBookmarkError(result.reason))

  return {
    fulfilled,
    rejected,
    conflicts,
    nonConflictFailures,
  }
}
