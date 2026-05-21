export type ImportEntry = {
  title: string
  url: string
  groupName: string
  isDuplicate?: boolean
  existingBookmark?: { id: string; title: string; url: string }
  action?: "skip" | "override" | "add"
}

export type ImportGroupSummary = {
  name: string
  count: number
  duplicateCount?: number
}

export type EnrichmentResult =
  | {
      status: "ready"
      title?: string | null
      description?: string | null
      favicon_url?: string | null
      og_image_url?: string | null
      image_url?: string | null
      last_fetched_at?: string | null
      error_reason?: string | null
    }
  | {
      status: "failed"
      error_reason?: string | null
      last_fetched_at?: string | null
    }
