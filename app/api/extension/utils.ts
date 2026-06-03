export class ExtensionApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ExtensionApiError"
    this.status = status
  }
}

export function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin")

  // Chrome and Firefox extensions set the Origin header
  // Validating the origin to ensure it's from a known source
  const isAllowed =
    origin &&
    (origin.startsWith("chrome-extension://") ||
      origin.startsWith("moz-extension://") ||
      origin.startsWith("http://localhost:") ||
      origin.includes("reway.page"))

  // When credentials mode is 'include', the origin MUST be explicitly echoed
  // and cannot be a wildcard "*". Fallback to the canonical domain.
  const allowedOrigin = isAllowed ? origin : "https://www.reway.page"

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers": "X-Reway-Timing",
  }
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new ExtensionApiError(400, "Invalid JSON body")
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function jsonResponse(body: unknown, init?: ResponseInit & { request?: Request }) {
  const headers = new Headers(init?.headers ?? {})
  headers.set("Content-Type", "application/json")

  if (init?.request) {
    const cors = getCorsHeaders(init.request)
    Object.entries(cors).forEach(([key, value]) => {
      headers.set(key, value)
    })
  } else {
    // Fallback if request is not provided - uses the canonical domain
    headers.set("Access-Control-Allow-Origin", "https://www.reway.page")
    headers.set("Access-Control-Allow-Credentials", "true")
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}
