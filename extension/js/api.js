export const DEFAULT_BASE_URL = "https://www.reway.page"

export async function getSettings() {
  const { rewayBaseUrl, rewayGroups } = await chrome.storage.local.get([
    "rewayBaseUrl",
    "rewayGroups",
  ])

  return {
    baseUrl: rewayBaseUrl || DEFAULT_BASE_URL,
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
