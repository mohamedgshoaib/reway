import type { ImportEntry } from "../dashboard-types"

export function parseBookmarksHtml(options: {
  content: string
  isValidImportUrl: (url: string) => boolean
  normalizeGroupName: (value?: string | null) => string
}) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(options.content, "text/html")
  const root = doc.querySelector("dl")
  const entries: ImportEntry[] = []

  if (!root) return entries

  const traverse = (node: Element, stack: string[]) => {
    const children = Array.from(node.children)

    for (const child of children) {
      const tag = child.tagName.toLowerCase()
      if (tag === "dt") {
        const firstChild = child.firstElementChild
        const folderHeading =
          firstChild?.tagName.toLowerCase() === "h3" ? firstChild : child.querySelector("h3")
        const link =
          firstChild?.tagName.toLowerCase() === "a" ? firstChild : child.querySelector("a")

        if (folderHeading) {
          const folderName = folderHeading.textContent?.trim() ?? ""
          let nestedDl = child.nextElementSibling

          if (!nestedDl || nestedDl.tagName.toLowerCase() !== "dl") {
            nestedDl = child.querySelector("dl")
          }

          if (nestedDl && nestedDl.tagName.toLowerCase() === "dl") {
            if (folderName.length > 0) {
              stack.push(folderName)
              traverse(nestedDl, stack)
              stack.pop()
            } else {
              traverse(nestedDl, stack)
            }
          }
          continue
        }

        if (link) {
          const url = link.getAttribute("href") || ""
          const title = link.textContent?.trim() || url
          if (url && options.isValidImportUrl(url)) {
            const groupName = stack.length > 0 ? stack[stack.length - 1] : "Ungrouped"
            entries.push({
              title,
              url,
              groupName: options.normalizeGroupName(groupName),
            })
          }
        }
      } else {
        traverse(child, stack)
      }
    }
  }

  traverse(root, [])
  return entries
}
