export const DEFAULT_BASE_URL = "https://www.reway.page"

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

export async function getSettings() {
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

export async function apiFetch(endpoint, options = {}) {
  const { baseUrl } = await getSettings()
  const url = `${baseUrl}${endpoint}`

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.remove("rewayGroups")
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
        bodyText = await response.text()
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

  return response.json()
}
