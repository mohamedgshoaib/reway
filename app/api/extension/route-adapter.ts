// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { jsonResponse } from "./utils"

export async function getAuthenticatedExtensionUserId(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false as const,
      response: jsonResponse({ error: "Unauthorized" }, { status: 401, request }),
    }
  }

  return {
    ok: true as const,
    userId: user.id,
  }
}

export async function broadcastExtensionInsert(
  userId: string,
  entity: "bookmarks" | "groups",
  payload: unknown,
) {
  try {
    const channel = supabaseAdmin.channel(`user:${userId}:${entity}`, {
      config: { private: true },
    })
    await channel.send({
      type: "broadcast",
      event: "INSERT",
      payload,
    })
    supabaseAdmin.removeChannel(channel)
  } catch (broadcastError) {
    console.warn(`Realtime broadcast failed (${entity}):`, broadcastError)
  }
}

export function isDuplicateConstraintError(error: { code?: string } | null | undefined) {
  return error?.code === "23505"
}
