import { createGroupRecord, findDuplicateGroupByName } from "@/lib/library/server/capture"
import { listGroupsForExtension } from "@/lib/library/server/reads"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  broadcastExtensionInsert,
  getAuthenticatedExtensionUserId,
  isDuplicateConstraintError,
  toExtensionErrorResponse,
} from "../route-adapter"
import { ExtensionApiError, getCorsHeaders, isRecord, jsonResponse, parseJsonBody } from "../utils"

interface GroupPayload {
  name: string
  icon?: string
  color?: string | null
}

function parseGroupPayload(body: unknown): GroupPayload {
  if (!isRecord(body)) {
    throw new ExtensionApiError(400, "Invalid group payload")
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) {
    throw new ExtensionApiError(400, "Group name is required")
  }

  const icon = typeof body.icon === "string" ? body.icon : undefined
  const color =
    body.color === null || body.color === undefined
      ? undefined
      : typeof body.color === "string"
        ? body.color
        : (() => {
            throw new ExtensionApiError(400, "Invalid group color")
          })()

  return { name, icon, color }
}

function pickRandomGroupColor() {
  const palette = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ]
  return palette[Math.floor(Math.random() * palette.length)]
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

    const userId = auth.userId

    const { data, error } = await listGroupsForExtension(supabaseAdmin, userId)

    if (error) {
      console.error("Failed to fetch groups:", error)
      return jsonResponse({ error: "Failed to fetch groups" }, { status: 500, request })
    }

    return jsonResponse({ groups: data ?? [] }, { request })
  } catch (error) {
    return toExtensionErrorResponse(error, request, "Extension groups list failed:")
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedExtensionUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const userId = auth.userId
    const body = parseGroupPayload(await parseJsonBody(request))
    const name = body.name

    const icon = body.icon || "folder"
    const color =
      body.color || ((icon === "folder" || !icon) && !body.color ? pickRandomGroupColor() : null)

    // Check for duplicates
    const { data: existingGroup, error: duplicateLookupError } = await findDuplicateGroupByName(
      supabaseAdmin,
      userId,
      name,
    )

    if (duplicateLookupError) {
      console.error("Failed to check duplicate groups:", duplicateLookupError)
      return jsonResponse({ error: "Failed to check group availability" }, { status: 500, request })
    }

    if (existingGroup) {
      return jsonResponse(
        { error: "A group with this name already exists" },
        { status: 409, request },
      )
    }

    // Get the maximum order_index to append new group at the end
    const { data, error } = await createGroupRecord(supabaseAdmin, userId, {
      name,
      icon,
      color,
    })

    if (error) {
      if (isDuplicateConstraintError(error)) {
        return jsonResponse({ error: "A group with this name already exists" }, { status: 409, request })
      }
      console.error("Failed to create group:", error)
      return jsonResponse({ error: "Failed to create group" }, { status: 500, request })
    }

    await broadcastExtensionInsert(userId, "groups", data)

    return jsonResponse({ group: data }, { request })
  } catch (error) {
    return toExtensionErrorResponse(error, request, "Extension group create failed:")
  }
}
