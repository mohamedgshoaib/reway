import { createGroupRecord, findDuplicateGroupByName } from "@/lib/library/server/capture"
import { listGroupsForExtension } from "@/lib/library/server/reads"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { broadcastExtensionInsert, getAuthenticatedExtensionUserId } from "../route-adapter"
import { getCorsHeaders, jsonResponse } from "../utils"

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
    console.error("Extension auth failed:", error)
    return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedExtensionUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const userId = auth.userId
    const body = await request.json()

    const name = body.name.trim()
    if (!name) {
      return jsonResponse({ error: "Group name is required" }, { status: 400, request })
    }

    const icon = body.icon || "folder"
    const color =
      body.color || ((icon === "folder" || !icon) && !body.color ? pickRandomGroupColor() : null)

    // Check for duplicates
    const { data: existingGroup } = await findDuplicateGroupByName(supabaseAdmin, userId, name)

    if (existingGroup) {
      return jsonResponse(
        { error: "A group with this name already exists" },
        { status: 409, request },
      )
    }

    // Get the maximum order_index to append new group at the end
    const { data, error } = await createGroupRecord(supabaseAdmin, userId, {
      name: body.name.trim(),
      icon,
      color,
    })

    if (error) {
      console.error("Failed to create group:", error)
      return jsonResponse({ error: "Failed to create group" }, { status: 500, request })
    }

    await broadcastExtensionInsert(userId, "groups", data)

    return jsonResponse({ group: data }, { request })
  } catch (error) {
    console.error("Extension auth failed:", error)
    return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
  }
}
