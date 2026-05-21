export const normalizeUrl = (url: string) => {
  let normalized = url.trim()
  if (!normalized.startsWith("http")) {
    normalized = `https://${normalized}`
  }
  try {
    const parsed = new URL(normalized)
    if (parsed.pathname === "/") {
      return parsed.origin
    }
    return parsed.href.replace(/\/$/, "")
  } catch {
    return normalized
  }
}

export const isUrl = (value: string) => {
  try {
    new URL(value.startsWith("http") ? value : `https://${value}`)
    return value.includes(".")
  } catch {
    return false
  }
}

function trimTrailingPunctuation(url: string) {
  return url.replace(/[\]\[\)\}>,.;:!?"']+$/g, "")
}

export const extractUrlsFromText = (input: string) => {
  const text = input.trim()
  if (!text) return []

  const candidates = new Set<string>()

  const urlLikeRegex = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi
  for (const match of text.matchAll(urlLikeRegex)) {
    candidates.add(trimTrailingPunctuation(match[0]))
  }

  const domainRegex = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^^\s<>()"']*)?/gi
  for (const match of text.matchAll(domainRegex)) {
    const raw = trimTrailingPunctuation(match[0])
    const index = typeof match.index === "number" ? match.index : -1
    const precededByScheme = index >= 3 && text.slice(index - 3, index) === "://"
    if (precededByScheme) continue

    if (!raw.startsWith("http") && !raw.startsWith("www.")) {
      candidates.add(raw)
    }
  }

  const results = Array.from(candidates).flatMap((u) => {
    const t = u.trim()
    return t && isUrl(t) ? [t] : []
  })

  return results
}
