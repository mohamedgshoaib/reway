import { NextRequest, NextResponse } from "next/server"
import { parse } from "node-html-parser"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const targetUrl = url.startsWith("http") ? url : `https://${url}`
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    const html = await response.text()
    const root = parse(html)

    // 1. Extract Title
    let title = root.querySelector("title")?.text || ""
    if (!title) {
      title = root.querySelector('meta[property="og:title"]')?.getAttribute("content") || ""
    }
    if (!title) {
      title = root.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || ""
    }

    // 2. Extract Description
    let description = root.querySelector('meta[name="description"]')?.getAttribute("content") || ""
    if (!description) {
      description =
        root.querySelector('meta[property="og:description"]')?.getAttribute("content") || ""
    }

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

    // Resolve relative favicon URLs
    if (favicon && !favicon.startsWith("http")) {
      const baseUrl = new URL(targetUrl)
      favicon = new URL(favicon, baseUrl.origin).toString()
    }

    // Fallback if no favicon found in HTML
    if (!favicon) {
      const baseUrl = new URL(targetUrl)
      favicon = `${baseUrl.origin}/favicon.ico`
    }

    // 4. Extract OG Image
    let ogImage =
      root.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      root.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
      ""

    // Resolve relative OG image URLs
    if (ogImage && !ogImage.startsWith("http")) {
      const baseUrl = new URL(targetUrl)
      ogImage = new URL(ogImage, baseUrl.origin).toString()
    }

    return NextResponse.json({
      title: title.trim(),
      description: description?.trim() || "",
      favicon: favicon,
      ogImage: ogImage,
      domain: new URL(targetUrl).hostname.replace("www.", ""),
      url: targetUrl,
    })
  } catch (error) {
    console.error("Scraper Error:", error)
    return NextResponse.json({ error: "Failed to scrape metadata" }, { status: 500 })
  }
}
