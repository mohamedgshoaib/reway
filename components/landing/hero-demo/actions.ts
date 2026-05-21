"use server"

import { fetchMetadata } from "@/lib/metadata"

export async function fetchDemoMetadata(url: string) {
  try {
    const data = await fetchMetadata(url)
    return {
      title: data.title,
      domain: data.domain,
      favicon: data.favicon,
    }
  } catch {
    return null
  }
}
