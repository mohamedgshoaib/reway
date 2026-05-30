import { parse } from "node-html-parser"

export interface MetadataResult {
  title: string
  description: string
  favicon: string
  ogImage: string
  domain: string
  url: string
}

export function normalizeUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`
  }
  try {
    const parsed = new URL(normalized)
    // Remove trailing slash except for root
    if (parsed.pathname === "/") {
      return parsed.origin
    }
    return parsed.href.replace(/\/$/, "")
  } catch {
    return normalized
  }
}

export function isPrivateIp(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname
    // Basic SSRF protection: block localhost and private IP ranges
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/i,
    ]
    return privatePatterns.some((pattern) => pattern.test(hostname))
  } catch {
    return true // If we can't parse it, treat as unsafe
  }
}

export async function fetchMetadata(url: string): Promise<MetadataResult> {
  const targetUrl = normalizeUrl(url)
  let parsedUrl: URL

  try {
    parsedUrl = new URL(targetUrl)
  } catch {
    throw new Error("Invalid URL")
  }

  if (isPrivateIp(parsedUrl.toString())) {
    throw new Error("Access to private IP addresses is prohibited")
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(8000), // 8s timeout
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }

  const html = await response.text()
  const root = parse(html)

  // 1. Extract Title
  const title =
    root.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    root.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
    root.querySelector("title")?.text ||
    ""

  // 2. Extract Description
  const description =
    root.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
    root.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
    root.querySelector('meta[name="description"]')?.getAttribute("content") ||
    ""

  // 3. Extract Favicon
  let favicon = ""
  const faviconSelectors = [
    'link[rel="apple-touch-icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
    'link[rel="alternate icon"]',
  ]

  for (const selector of faviconSelectors) {
    const element = root.querySelector(selector)
    if (element) {
      favicon = element.getAttribute("href") || ""
      if (favicon) break
    }
  }

  const baseUrl = parsedUrl
  if (favicon && !favicon.startsWith("http")) {
    favicon = new URL(favicon, baseUrl.origin).toString()
  } else if (!favicon) {
    favicon = `${baseUrl.origin}/favicon.ico`
  }

  // 4. Extract OG Image
  let ogImage =
    root.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    root.querySelector('meta[property="og:image:secure_url"]')?.getAttribute("content") ||
    root.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
    root.querySelector('link[rel="image_src"]')?.getAttribute("href") ||
    ""

  if (ogImage && !ogImage.startsWith("http")) {
    ogImage = new URL(ogImage, baseUrl.origin).toString()
  }

  return {
    title: title.trim(),
    description: description.trim(),
    favicon,
    ogImage,
    domain: baseUrl.hostname.replace("www.", ""),
    url: targetUrl,
  }
}
