import type { ImportEntry } from "../dashboard-types"

function getTagName(node: Element | null | undefined) {
  return node?.tagName.toLowerCase() ?? ""
}

function getFolderHeading(child: Element) {
  const firstChild = child.firstElementChild
  return getTagName(firstChild) === "h3" ? firstChild : child.querySelector("h3")
}

function getBookmarkLink(child: Element) {
  const firstChild = child.firstElementChild
  return getTagName(firstChild) === "a" ? firstChild : child.querySelector("a")
}

function getNestedDefinitionList(child: Element) {
  let nestedDl = child.nextElementSibling

  if (getTagName(nestedDl) !== "dl") {
    nestedDl = child.querySelector("dl")
  }

  return getTagName(nestedDl) === "dl" ? nestedDl : null
}

function pushBookmarkEntry({
  link,
  stack,
  entries,
  isValidImportUrl,
  normalizeGroupName,
}: {
  link: Element
  stack: string[]
  entries: ImportEntry[]
  isValidImportUrl: (url: string) => boolean
  normalizeGroupName: (value?: string | null) => string
}) {
  const url = link.getAttribute("href") || ""
  const title = link.textContent?.trim() || url
  if (!url || !isValidImportUrl(url)) return

  const groupName = stack.length > 0 ? stack[stack.length - 1] : "Ungrouped"
  entries.push({
    title,
    url,
    groupName: normalizeGroupName(groupName),
  })
}

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
      const tag = getTagName(child)
      if (tag === "dt") {
        const folderHeading = getFolderHeading(child)
        const link = getBookmarkLink(child)

        if (folderHeading) {
          const folderName = folderHeading.textContent?.trim() ?? ""
          const nestedDl = getNestedDefinitionList(child)

          if (nestedDl) {
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
          pushBookmarkEntry({
            link,
            stack,
            entries,
            isValidImportUrl: options.isValidImportUrl,
            normalizeGroupName: options.normalizeGroupName,
          })
        }
      } else {
        traverse(child, stack)
      }
    }
  }

  traverse(root, [])
  return entries
}
