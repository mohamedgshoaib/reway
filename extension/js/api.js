export const DEFAULT_BASE_URL = "https://www.reway.page"
const ACCESS_CACHE_KEYS = ["rewayGroups", "rewayGroupsFetchedAt", "rewayAccessBookmarksByGroup"]
const MAX_ERROR_BODY_LENGTH = 240
const SETTINGS_CACHE_KEYS = ["rewayBaseUrl", "rewayGroups"]

let cachedSettings = null
let settingsRequest = null

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return
    if (SETTINGS_CACHE_KEYS.some((key) => Object.hasOwn(changes, key))) {
      cachedSettings = null
      settingsRequest = null
    }
  })
}

function isLocalhostBaseUrl(baseUrl) {
  try {
    const url = new URL(baseUrl)
    return url.hostname === "localhost" || url.hostname === "127.0.0.1"
  } catch {
    return false
  }
}

async function isReachable(baseUrl) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)
    const response = await fetch(`${baseUrl}/`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    // Any HTTP response means the host is reachable.
    return response && typeof response.status === "number"
  } catch {
    return false
  }
}

async function loadSettings() {
  const { rewayBaseUrl, rewayGroups } = await chrome.storage.local.get([
    "rewayBaseUrl",
    "rewayGroups",
  ])

  const configuredBaseUrl = rewayBaseUrl || DEFAULT_BASE_URL

  if (rewayBaseUrl && isLocalhostBaseUrl(configuredBaseUrl)) {
    const reachable = await isReachable(configuredBaseUrl)
    if (!reachable) {
      await chrome.storage.local.remove("rewayBaseUrl")
      return {
        baseUrl: DEFAULT_BASE_URL,
        groups: Array.isArray(rewayGroups) ? rewayGroups : [],
      }
    }
  }

  return {
    baseUrl: configuredBaseUrl,
    groups: Array.isArray(rewayGroups) ? rewayGroups : [],
  }
}

export async function getSettings() {
  if (cachedSettings) return cachedSettings

  settingsRequest ??= loadSettings().then((settings) => {
    cachedSettings = settings
    return settings
  })

  try {
    return await settingsRequest
  } finally {
    settingsRequest = null
  }
}

export async function apiFetch(endpoint, options = {}) {
  const { returnMeta = false, ...fetchOptions } = options
  const startedAt = performance.now()
  const { baseUrl } = await getSettings()
  const settingsMs = performance.now() - startedAt
  const url = `${baseUrl}${endpoint}`
  const headers = new Headers(fetchOptions.headers)
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null
  const method = String(fetchOptions.method || "GET").toUpperCase()

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const fetchStartedAt = performance.now()
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers,
  })
  const fetchMs = performance.now() - fetchStartedAt

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.remove(ACCESS_CACHE_KEYS)
    }

    let bodyText = ""
    let bodyData = null
    try {
      const contentType = response.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const data = await response.json()
        bodyData = data
        bodyText = data?.error || data?.message || (data ? JSON.stringify(data) : "")
      } else {
        bodyText = summarizeResponseText(await response.text())
      }
    } catch {
      bodyText = ""
    }

    const err = new Error(bodyText || `Request failed with status ${response.status}`)
    err.status = response.status
    err.url = url
    err.data = bodyData
    throw err
  }

  if (response.status === 204) {
    return null
  }

  const jsonStartedAt = performance.now()
  const data = await response.json()
  const jsonMs = performance.now() - jsonStartedAt
  if (returnMeta) {
    return {
      data,
      timing: response.headers.get("X-Reway-Timing"),
      clientTiming: {
        settingsMs: Math.round(settingsMs),
        fetchMs: Math.round(fetchMs),
        jsonMs: Math.round(jsonMs),
        totalMs: Math.round(performance.now() - startedAt),
        method,
      },
      status: response.status,
      url,
    }
  }

  return data
}

function summarizeResponseText(text) {
  const value = String(text || "").trim()
  if (!value) return ""

  const titleMatch = value.match(/<title[^>]*>(.*?)<\/title>/i)
  const summary = titleMatch?.[1]?.trim() || value.replace(/\s+/g, " ")

  return summary.length > MAX_ERROR_BODY_LENGTH
    ? `${summary.slice(0, MAX_ERROR_BODY_LENGTH)}...`
    : summary
}
