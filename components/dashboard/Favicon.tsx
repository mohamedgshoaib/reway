"use client"

import { Bookmark01Icon, Refresh01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface FaviconProps {
  url: string
  domain: string
  title: string
  isEnriching?: boolean
  needsRefresh?: boolean
  className?: string
}

// Global cache for origin status to avoid redundant requests across instances
// and between view mode switches. This persists for the current browser session.
const originStatusCache: Record<string, "valid" | "invalid"> = {}

/**
 * Validates if a URL is likely a usable image.
 */
const isValidImageUrl = (src: string | null | undefined): boolean => {
  if (!src || typeof src !== "string") return false
  const trimmed = src.trim()
  if (trimmed.length === 0) return false

  // We allow URLs from providers like Google Favicon Service if they are the primary URL.
  // Rejecting them broke existing user data where these were the only icons available.

  if (trimmed.startsWith("data:")) {
    // Valid data URLs should have format: data:[<mediatype>][;base64],<data>
    const dataMatch = trimmed.match(/^data:([^;,]*)(;base64)?,(.+)$/)
    if (!dataMatch || !dataMatch[3] || dataMatch[3].length < 4) return false
  }
  return true
}

export function Favicon({ url, domain, title, isEnriching, needsRefresh, className }: FaviconProps) {
  const hasValidUrl = isValidImageUrl(url)
  const originKnownInvalid = domain ? originStatusCache[domain] === "invalid" : false
  const initialFallbackLevel: "primary" | "origin" | "service" | "letter" = hasValidUrl
    ? "primary"
    : originKnownInvalid
      ? "service"
      : "origin"

  return (
    <FaviconInner
      key={`${url}::${domain}`}
      url={url}
      domain={domain}
      title={title}
      isEnriching={isEnriching}
      needsRefresh={needsRefresh}
      className={className}
      initialFallbackLevel={initialFallbackLevel}
    />
  )
}

function FaviconInner({
  url,
  domain,
  title,
  isEnriching,
  needsRefresh,
  className,
  initialFallbackLevel,
}: FaviconProps & {
  initialFallbackLevel: "primary" | "origin" | "service" | "letter"
}) {
  // react-doctor-disable-next-line react-doctor/no-derived-useState
  const [fallbackLevel, setFallbackLevel] = useState<"primary" | "origin" | "service" | "letter">(
    initialFallbackLevel,
  )

  // Initialize status from global cache to avoid probes on remount
  const [originStatus, setOriginStatus] = useState<"unknown" | "valid" | "invalid">(
    domain ? originStatusCache[domain] || "unknown" : "unknown",
  )

  const originFallbackUrl = domain ? `https://${domain}/favicon.ico` : null
  const serviceFallbackUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : null

  /**
   * Handle image loading errors by falling back to the next level.
   * If the domain's root favicon fails, we mark it as invalid globally
   * so other components and future mounts don't even try to load it.
   */
  const handleImageError = () => {
    if (fallbackLevel === "primary") {
      setFallbackLevel("origin")
    } else if (fallbackLevel === "origin" && domain) {
      originStatusCache[domain] = "invalid"
      setOriginStatus("invalid")
      setFallbackLevel("service")
    } else if (fallbackLevel === "service") {
      setFallbackLevel("letter")
    } else {
      setFallbackLevel("letter")
    }
  }

  /**
   * Mark the domain as valid in the global cache when an origin favicon
   * loads successfully. This prevents re-probing on view switches.
   */
  const handleImageLoad = () => {
    if (fallbackLevel === "origin" && domain) {
      originStatusCache[domain] = "valid"
      setOriginStatus("valid")
    }
  }

  // Determine initials and colors for fallback
  const firstChar = (domain?.[0] || title?.[0] || "?").toUpperCase()
  const initials = {
    char: firstChar,
    color: "bg-muted/30 text-muted-foreground border-border",
  }

  const currentImageUrl =
    fallbackLevel === "primary"
      ? url
      : fallbackLevel === "origin"
        ? originFallbackUrl
        : fallbackLevel === "service"
          ? serviceFallbackUrl
          : null

  // We show the image if we are on a valid fallback level and haven't confirmed it's invalid.
  const shouldTryImage =
    fallbackLevel !== "letter" &&
    (fallbackLevel === "primary" || fallbackLevel === "service" || originStatus !== "invalid")

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-transform overflow-hidden",
        isEnriching
          ? "animate-pulse bg-muted/30 border-muted/50"
          : needsRefresh
            ? "relative bg-muted/20 border-dashed border-muted-foreground/30 text-muted-foreground"
          : fallbackLevel === "letter"
            ? `${initials.color}`
            : "bg-background border-border hover:bg-muted/30",
        className,
      )}
    >
      {isEnriching ? (
        <HugeiconsIcon icon={Bookmark01Icon} size={20} className="text-muted-foreground/20" />
      ) : shouldTryImage && currentImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        // react-doctor-disable-next-line react-doctor/nextjs-no-img-element, next/no-img-element
        <img
          key={currentImageUrl}
          src={currentImageUrl}
          alt=""
          width={24}
          height={24}
          className={cn("size-6 rounded-md object-contain", needsRefresh ? "opacity-45" : "")}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      ) : (
        <span
          className={cn(
            "text-sm font-bold text-foreground",
            needsRefresh ? "text-muted-foreground/60" : "",
          )}
        >
          {initials.char}
        </span>
      )}
      {needsRefresh ? (
        <span className="absolute right-0 top-0 flex size-3.5 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <HugeiconsIcon icon={Refresh01Icon} size={10} className="text-muted-foreground" />
        </span>
      ) : null}
    </div>
  )
}
