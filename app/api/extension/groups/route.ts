import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
    }

    const userId = user.id

    const { data, error } = await supabaseAdmin
      .from("groups")
      .select("id, name, icon, color, order_index, created_at")
      .eq("user_id", userId)
      .order("order_index", { ascending: true })

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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
    }

    const userId = user.id
    const body = await request.json()

    const name = body.name.trim()
    if (!name) {
      return jsonResponse({ error: "Group name is required" }, { status: 400, request })
    }

    const icon = body.icon || "folder"
    const color =
      body.color || ((icon === "folder" || !icon) && !body.color ? pickRandomGroupColor() : null)

    // Check for duplicates
    const { data: existingGroup } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", name)
      .maybeSingle()

    if (existingGroup) {
      return jsonResponse(
        { error: "A group with this name already exists" },
        { status: 409, request },
      )
    }

    // Get the maximum order_index to append new group at the end
    const { data: maxOrderData } = await supabaseAdmin
      .from("groups")
      .select("order_index")
      .eq("user_id", userId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = maxOrderData ? (maxOrderData.order_index ?? 0) + 1 : 0

    const { data, error } = await supabaseAdmin
      .from("groups")
      .insert({
        name: body.name.trim(),
        icon,
        color,
        user_id: userId,
        order_index: nextOrderIndex,
      })
      .select("id, name, icon, color, order_index, created_at")
      .single()

    if (error) {
      console.error("Failed to create group:", error)
      return jsonResponse({ error: "Failed to create group" }, { status: 500, request })
    }

    try {
      const channel = supabaseAdmin.channel(`user:${userId}:groups`, {
        config: { private: true },
      })
      await channel.send({
        type: "broadcast",
        event: "INSERT",
        payload: data,
      })
      supabaseAdmin.removeChannel(channel)
    } catch (broadcastError) {
      console.warn("Realtime broadcast failed (groups):", broadcastError)
    }

    return jsonResponse({ group: data }, { request })
  } catch (error) {
    console.error("Extension auth failed:", error)
    return jsonResponse({ error: "Unauthorized" }, { status: 401, request })
  }
}
