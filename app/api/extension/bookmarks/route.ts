import { normalizeUrl } from "@/lib/metadata"
import {
  createBookmarkRecord,
  validateGroupAccess,
} from "@/lib/library/server/capture"
import { listBookmarksForExtension } from "@/lib/library/server/reads"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  getAuthenticatedExtensionUserId,
  isDuplicateConstraintError,
  toExtensionErrorResponse,
} from "../route-adapter"
import { ExtensionApiError, getCorsHeaders, isRecord, jsonResponse, parseJsonBody } from "../utils"

interface BookmarkPayload {
  url: string
  title?: string
  description?: string
  groupId?: string | null
  faviconUrl?: string | null
}

function parseBookmarkPayload(body: unknown): BookmarkPayload {
  if (!isRecord(body)) {
    throw new ExtensionApiError(400, "Invalid bookmark payload")
  }

  const url = typeof body.url === "string" ? body.url.trim() : ""
  if (!url) {
    throw new ExtensionApiError(400, "Missing url")
  }

  const groupId =
    body.groupId === null || body.groupId === undefined
      ? null
      : typeof body.groupId === "string"
        ? body.groupId
        : (() => {
            throw new ExtensionApiError(400, "Invalid group")
          })()

  const readOptionalString = (value: unknown) => (typeof value === "string" ? value : undefined)

  return {
    url,
    groupId,
    title: readOptionalString(body.title),
    description: readOptionalString(body.description),
    faviconUrl: readOptionalString(body.faviconUrl),
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) })
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedExtensionUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const userId = auth.userId
    const payload = parseBookmarkPayload(await parseJsonBody(request))

    const groupValidation = await validateGroupAccess(supabaseAdmin, userId, payload.groupId ?? null)
    if (!groupValidation.valid) {
      return jsonResponse({ error: "Invalid group" }, { status: 400, request })
    }

    const { data, error } = await createBookmarkRecord(supabaseAdmin, userId, {
      url: payload.url,
      title: payload.title?.trim() || normalizeUrl(payload.url),
      description: payload.description?.trim() || null,
      favicon_url: payload.faviconUrl?.trim() || null,
      group_id: groupValidation.groupId,
      status: "ready",
      last_fetched_at: new Date().toISOString(),
    })

    if (error) {
      if (isDuplicateConstraintError(error)) {
        return jsonResponse({ error: "Bookmark save conflict", code: error.code }, { status: 409, request })
      }
      console.error("Failed to create bookmark:", error)
      return jsonResponse({ error: "Failed to create bookmark" }, { status: 500, request })
    }

    return jsonResponse({ id: data.id, bookmark: data }, { request })
  } catch (error) {
    return toExtensionErrorResponse(error, request, "Extension bookmark create failed:")
  }
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedExtensionUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const userId = auth.userId
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")

    const { data, error } = await listBookmarksForExtension(supabaseAdmin, userId, groupId)

    if (error) {
      console.error("Failed to fetch bookmarks:", error)
      return jsonResponse({ error: "Failed to fetch bookmarks" }, { status: 500, request })
    }

    return jsonResponse({ bookmarks: data ?? [] }, { request })
  } catch (error) {
    return toExtensionErrorResponse(error, request, "Extension bookmark list failed:")
  }
}
