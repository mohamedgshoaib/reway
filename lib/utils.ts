import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== undefined

export function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return "link"
  }
}

export function fallbackTitleFromDomain(domain: string) {
  const key = (domain || "").toLowerCase()
  if (key === "x.com" || key === "twitter.com") return "X"
  if (key === "tiktok.com") return "TikTok"
  const parts = key.split(".").filter(Boolean)
  const base = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || key
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Link"
}

const normalizeComparableUrl = (value: string) => {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/^https?:\/\//, "")
}

export function getDisplayTitle(input: {
  title?: string | null
  url: string
  normalizedUrl?: string | null
  domain: string
}) {
  const rawTitle = (input.title || "").trim()
  if (!rawTitle) return fallbackTitleFromDomain(input.domain)

  const t = normalizeComparableUrl(rawTitle)
  const u = normalizeComparableUrl(input.url)
  const n = input.normalizedUrl ? normalizeComparableUrl(input.normalizedUrl) : ""

  const isUrlLike =
    t === u ||
    (n ? t === n : false) ||
    rawTitle.startsWith("http://") ||
    rawTitle.startsWith("https://")
  return isUrlLike ? fallbackTitleFromDomain(input.domain) : rawTitle
}
