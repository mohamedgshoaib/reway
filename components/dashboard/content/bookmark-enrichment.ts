"use client"

import type { EnrichmentResult } from "./dashboard-types"

export class BookmarkEnrichmentTimeoutError extends Error {
  constructor(message = "Enrichment timeout") {
    super(message)
    this.name = "BookmarkEnrichmentTimeoutError"
  }
}

export function isBookmarkEnrichmentTimeoutError(
  error: unknown,
): error is BookmarkEnrichmentTimeoutError {
  return error instanceof BookmarkEnrichmentTimeoutError
}

export function buildBookmarkEnrichmentFailure(
  error: unknown,
  attemptedAt = new Date().toISOString(),
): EnrichmentResult {
  return {
    status: "failed",
    error_reason: error instanceof Error ? error.message : "Enrichment failed",
    last_fetched_at: attemptedAt,
  }
}

export async function enrichBookmarkWithTimeout({
  bookmarkId,
  url,
  timeoutMs,
  enrichCreatedBookmark,
}: {
  bookmarkId: string
  url: string
  timeoutMs: number
  enrichCreatedBookmark: (id: string, url: string) => Promise<EnrichmentResult | undefined>
}): Promise<EnrichmentResult | undefined> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new BookmarkEnrichmentTimeoutError()), timeoutMs)
  })

  return (await Promise.race([
    enrichCreatedBookmark(bookmarkId, url),
    timeoutPromise,
  ])) as EnrichmentResult | undefined
}
