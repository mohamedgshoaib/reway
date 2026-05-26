import { normalizeUrl } from "@/lib/metadata"
import {
  createBookmarkRecord,
  validateGroupAccess,
} from "@/lib/library/server/capture"
import { listBookmarksForExtension } from "@/lib/library/server/reads"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  broadcastExtensionInsert,
  getAuthenticatedExtensionUserId,
  isDuplicateConstraintError,
} from "../route-adapter"
import { getCorsHeaders, jsonResponse } from "../utils"

interface BookmarkPayload {
  url: string
  title?: string
  description?: string
  groupId?: string | null
  faviconUrl?: string | null
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
    const payload = (await request.json()) as BookmarkPayload

    if (!payload?.url) {
      return jsonResponse({ error: "Missing url" }, { status: 400, request })
    }

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
        return jsonResponse({ error: "Bookmark already exists", code: error.code }, { status: 409, request })
      }
      console.error("Failed to create bookmark:", error)
      return jsonResponse({ error: "Failed to create bookmark" }, { status: 500, request })
    }

    await broadcastExtensionInsert(userId, "bookmarks", data)

    return jsonResponse({ id: data.id, bookmark: data }, { request })
  } catch (error) {
    console.error("Extension auth failed:", error)
    return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
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
    console.error("Extension auth failed:", error)
    return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
  }
}
