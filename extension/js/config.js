export const DEFAULT_BASE_URL = "https://reway.page"
export const MAX_NAME_LENGTH = 18

const EXCLUDED_HOSTS = [
  "reway.page",
  "www.reway.page",
  "reway-app.vercel.app",
  "localhost",
  "127.0.0.1",
]

export function isDashboardUrl(url, baseUrl = DEFAULT_BASE_URL) {
  try {
    const urlObj = new URL(url)
    const baseObj = new URL(baseUrl)

    // Filter by hostname first - exclude current baseUrl, hardcoded domains, and localhost
    const isDashboardHost =
      urlObj.hostname === baseObj.hostname || EXCLUDED_HOSTS.includes(urlObj.hostname)

    if (!isDashboardHost) return false

    // Then check if it's the dashboard path
    return urlObj.pathname === "/dashboard" || urlObj.pathname.startsWith("/dashboard/")
  } catch {
    return false
  }
}
