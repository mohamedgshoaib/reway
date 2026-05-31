import { apiFetch } from "./api.js"

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

export async function saveBookmarkBatch(items, buildPayload) {
  const results = []

  for (const item of items) {
    try {
      const value = await apiFetch("/api/extension/bookmarks", {
        method: "POST",
        body: JSON.stringify(buildPayload(item)),
      })
      results.push({ status: "fulfilled", value })
    } catch (reason) {
      results.push({ status: "rejected", reason })
    }
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
  const rejected = results.filter((result) => result.status === "rejected")
  const conflicts = rejected.filter((result) => isDuplicateBookmarkError(result.reason))
  const nonConflictFailures = rejected.filter((result) => !isDuplicateBookmarkError(result.reason))

  return {
    rejected,
    conflicts,
    nonConflictFailures,
  }
}
