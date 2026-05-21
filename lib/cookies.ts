/**
 * Cookie utilities for dashboard preferences
 * Uses cookies instead of localStorage to enable server-side rendering with user preferences
 *
 * SECURITY NOTE:
 * These are client-accessible cookies (NOT httpOnly) because:
 * 1. They store non-sensitive UI preferences only
 * 2. Need to be readable by client-side React components
 * 3. Instant updates without server round-trips
 *
 * For sensitive data (auth tokens, sessions), use server actions with httpOnly cookies.
 */

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year
const IS_PRODUCTION = process.env.NODE_ENV === "production"

export interface DashboardPreferences {
  viewModeAll: "list" | "card" | "icon" | "folders"
  viewModeGroups: "list" | "card" | "icon" | "folders"
  layoutDensity: "compact" | "extended"
  rowContent: "date" | "group"
  commandMode: "add" | "search"
  onboarding: "done" | null
}

/**
 * Set a dashboard preference cookie with security best practices
 */
export function setPreferenceCookie(key: string, value: string) {
  if (typeof document === "undefined") return

  const cookieName = `reway.dashboard.${key}`
  const secureFlag = IS_PRODUCTION ? "; secure" : ""

  document.cookie = `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secureFlag}`
}

/**
 * Get a dashboard preference from cookie (client-side)
 */
export function getPreferenceCookie(key: string): string | null {
  if (typeof document === "undefined") return null

  const cookieName = `reway.dashboard.${key}`
  const matches = document.cookie.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`))
  return matches ? decodeURIComponent(matches[1]) : null
}

/**
 * Validate a view mode value
 */
function isValidViewMode(value: string): value is "list" | "card" | "icon" | "folders" {
  return ["list", "card", "icon", "folders"].includes(value)
}

/**
 * Validate a row content value
 */
function isValidRowContent(value: string): value is "date" | "group" {
  return ["date", "group"].includes(value)
}

/**
 * Validate a command mode value
 */
function isValidCommandMode(value: string): value is "add" | "search" {
  return ["add", "search"].includes(value)
}

/**
 * Validate a layout density value
 */
function isValidLayoutDensity(value: string): value is "compact" | "extended" {
  return ["compact", "extended"].includes(value)
}

/**
 * Migrate from localStorage to cookies (one-time)
 * Validates values before migrating to prevent invalid data
 */
export function migrateLocalStorageToCookies() {
  if (typeof window === "undefined") return

  try {
    const migrations = [
      {
        localStorage: "reway.dashboard.viewMode.all",
        cookie: "viewMode.all",
        validate: isValidViewMode,
      },
      {
        localStorage: "reway.dashboard.viewMode.groups",
        cookie: "viewMode.groups",
        validate: isValidViewMode,
      },
      {
        localStorage: "reway.dashboard.layoutDensity",
        cookie: "layoutDensity",
        validate: isValidLayoutDensity,
      },
      {
        localStorage: "reway.dashboard.rowContent",
        cookie: "rowContent",
        validate: isValidRowContent,
      },
      {
        localStorage: "reway.dashboard.commandMode",
        cookie: "commandMode",
        validate: isValidCommandMode,
      },
    ]

    migrations.forEach(({ localStorage: lsKey, cookie: cookieKey, validate }) => {
      const value = window.localStorage.getItem(lsKey)
      if (value && validate(value) && !getPreferenceCookie(cookieKey)) {
        setPreferenceCookie(cookieKey, value)
      }
    })

    // Migrate onboarding status (any truthy value becomes "done")
    const onboarding = window.localStorage.getItem("reway.dashboard.onboarding.v1")
    if (onboarding && !getPreferenceCookie("onboarding.v1")) {
      setPreferenceCookie("onboarding.v1", "done")
    }

    // Mark migration as complete
    if (window.localStorage.getItem("reway.dashboard.migrated") !== "true") {
      window.localStorage.setItem("reway.dashboard.migrated", "true")
    }
  } catch (error) {
    console.warn("Failed to migrate localStorage to cookies:", error)
    // Fail gracefully - app will use defaults
  }
}
