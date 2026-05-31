// oxlint-disable-next-line import/no-unassigned-import
import "server-only"

import { createClient } from "@/lib/supabase/server"
import { ExtensionApiError, jsonResponse } from "./utils"

export async function getAuthenticatedExtensionUserId(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    const status = error.status === 401 || error.status === 403 ? 401 : 503
    return {
      ok: false as const,
      response: jsonResponse({ error: status === 401 ? "Unauthorized" : "Auth service unavailable" }, { status, request }),
    }
  }

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

export function isDuplicateConstraintError(error: { code?: string } | null | undefined) {
  return error?.code === "23505"
}

export function toExtensionErrorResponse(error: unknown, request: Request, fallbackMessage: string) {
  if (error instanceof ExtensionApiError) {
    return jsonResponse({ error: error.message }, { status: error.status, request })
  }

  console.error(fallbackMessage, error)
  return jsonResponse({ error: "Internal server error" }, { status: 500, request })
}
