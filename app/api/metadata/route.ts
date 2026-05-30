import { NextRequest, NextResponse } from "next/server"
import { fetchMetadata } from "@/lib/metadata"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const metadata = await fetchMetadata(url)
    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Scraper Error:", error)

    if (
      error instanceof Error &&
      (error.message === "Access to private IP addresses is prohibited" ||
        error.message.startsWith("Invalid URL"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to scrape metadata" }, { status: 500 })
  }
}
