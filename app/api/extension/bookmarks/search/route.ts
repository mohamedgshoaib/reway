import { z } from "zod"
import { searchBookmarksForExtension } from "@/lib/library/server/reads"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedExtensionUserId, toExtensionErrorResponse } from "../../route-adapter"
import { ExtensionApiError, getCorsHeaders, jsonResponse } from "../../utils"

const searchParamsSchema = z.object({
  q: z.string().trim().min(2, "Search query must be at least 2 characters").max(200),
  limit: z.coerce.number().int().min(1).max(20).default(20),
})

function parseSearchParams(searchParams: URLSearchParams) {
  const parsed = searchParamsSchema.safeParse({
    q: searchParams.get("q") ?? "",
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    throw new ExtensionApiError(400, parsed.error.issues[0]?.message || "Invalid search query")
  }

  return parsed.data
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) })
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedExtensionUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const { searchParams } = new URL(request.url)
    const { q, limit } = parseSearchParams(searchParams)

    const { data, error } = await searchBookmarksForExtension(supabaseAdmin, auth.userId, q, limit)

    if (error) {
      console.error("Failed to search extension bookmarks:", error)
      return jsonResponse({ error: "Failed to search bookmarks" }, { status: 500, request })
    }

    return jsonResponse({ bookmarks: data ?? [] }, { request })
  } catch (error) {
    return toExtensionErrorResponse(error, request, "Extension bookmark search failed:")
  }
}
