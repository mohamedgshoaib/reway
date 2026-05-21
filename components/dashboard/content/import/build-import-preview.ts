import { normalizeUrl } from "@/lib/metadata"
import type { ImportEntry, ImportGroupSummary } from "../dashboard-types"

export async function buildImportPreview(options: {
  rawEntries: ImportEntry[]
  checkDuplicateBookmarks: (urls: string[]) => Promise<{
    duplicates: Record<string, { id: string; title: string; url: string }>
  }>
  normalizeGroupName: (value?: string | null) => string
  onDuplicateCheckError?: (error: unknown) => void
}) {
  const normalizedByUrl = new Map<string, string>()
  options.rawEntries.forEach((entry) => {
    try {
      normalizedByUrl.set(entry.url, normalizeUrl(entry.url))
    } catch {
      normalizedByUrl.set(entry.url, entry.url)
    }
  })

  const urls = options.rawEntries.map((entry) => normalizedByUrl.get(entry.url) || entry.url)

  let duplicateMap: Record<string, { id: string; title: string; url: string }> = {}

  try {
    const result = await options.checkDuplicateBookmarks(urls)
    duplicateMap = result.duplicates
  } catch (error) {
    options.onDuplicateCheckError?.(error)
  }

  const entries: ImportEntry[] = options.rawEntries.map((entry) => {
    const normalized = normalizedByUrl.get(entry.url) || entry.url
    const existingBookmark = duplicateMap[normalized]
    return {
      ...entry,
      isDuplicate: !!existingBookmark,
      existingBookmark,
      action: existingBookmark ? "skip" : "add",
    }
  })

  const counts = entries.reduce<Record<string, { count: number; duplicateCount: number }>>(
    (acc, entry) => {
      const groupName = options.normalizeGroupName(entry.groupName)
      if (!acc[groupName]) {
        acc[groupName] = { count: 0, duplicateCount: 0 }
      }
      acc[groupName].count += 1
      if (entry.isDuplicate) {
        acc[groupName].duplicateCount += 1
      }
      return acc
    },
    {},
  )

  const groupSummaries: ImportGroupSummary[] = Object.entries(counts).map(
    ([name, { count, duplicateCount }]) => ({
      name,
      count,
      duplicateCount,
    }),
  )

  return { groupSummaries, entries }
}
