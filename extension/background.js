const DEFAULT_BASE_URL = "https://www.reway.page"

const REWAY_DEBUG = false

async function getSettings() {
  const { rewayBaseUrl } = await chrome.storage.local.get(["rewayBaseUrl"])
  return {
    baseUrl: rewayBaseUrl || DEFAULT_BASE_URL,
  }
}

const __rewayWorkerLogSeen = new Map()

function __rewayErrorOnce(key, ...args) {
  const now = Date.now()
  const last = __rewayWorkerLogSeen.get(key) || 0
  if (now - last < 60_000) return
  __rewayWorkerLogSeen.set(key, now)
  console.error(...args)
}

function __rewayWarnOnce(key, ...args) {
  const now = Date.now()
  const last = __rewayWorkerLogSeen.get(key) || 0
  if (now - last < 60_000) return
  __rewayWorkerLogSeen.set(key, now)
  console.warn(...args)
}

// ============================================
// Link Grab Storage Manager
// ============================================

function getGrabbedStorageArea() {
  return chrome.storage.session || chrome.storage.local
}

async function getGrabbedLinks() {
  const storage = getGrabbedStorageArea()
  const { grabbedLinks } = await storage.get(["grabbedLinks"])
  return Array.isArray(grabbedLinks) ? grabbedLinks : []
}

async function addGrabbedLink(url, title, source = "manual", favIconUrl = null) {
  const links = await getGrabbedLinks()

  // Check for duplicates
  const exists = links.some((link) => link.url === url)
  if (exists) {
    return { success: false, reason: "duplicate" }
  }

  // Avoid cross-origin HTML fetching in the service worker.
  // Use a safe fallback title + favicon derivation.
  let fetchedTitle = title
  let fetchedFavIcon = favIconUrl

  if (source === "manual" && !title) {
    try {
      const urlObj = new URL(url)
      fetchedTitle = urlObj.hostname
      fetchedFavIcon = `${urlObj.origin}/favicon.ico`
    } catch (error) {
      __rewayWarnOnce("derive-metadata-failed", "Failed to derive metadata:", error)
    }
  }

  const newLink = {
    url,
    title: fetchedTitle || url,
    source,
    favIconUrl: fetchedFavIcon,
    timestamp: new Date().toISOString(),
  }

  links.unshift(newLink) // Add to beginning
  const storage = getGrabbedStorageArea()
  await storage.set({ grabbedLinks: links })

  // Update badge
  await updateGrabbedLinksBadge(links.length)

  return { success: true, link: newLink }
}

async function removeGrabbedLink(url) {
  const links = await getGrabbedLinks()
  const filtered = links.filter((link) => link.url !== url)
  const storage = getGrabbedStorageArea()
  await storage.set({ grabbedLinks: filtered })
  await updateGrabbedLinksBadge(filtered.length)
  return { success: true, count: filtered.length }
}

async function clearGrabbedLinks() {
  const storage = getGrabbedStorageArea()
  await storage.set({ grabbedLinks: [] })
  await updateGrabbedLinksBadge(0)
  return { success: true }
}

async function captureCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })

  if (!tab?.url) {
    return { success: false, reason: "no-tab" }
  }

  return addGrabbedLink(tab.url, tab.title || tab.url, "current-tab", tab.favIconUrl)
}

async function updateGrabbedLinksBadge(count) {
  if (count > 0) {
    await chrome.action.setBadgeText({ text: String(count) })
    await chrome.action.setBadgeBackgroundColor({ color: "#18181b" })
    if (typeof chrome.action.setBadgeTextColor === "function") {
      await chrome.action.setBadgeTextColor({ color: "#ffffff" })
    }
  } else {
    await chrome.action.setBadgeText({ text: "" })
  }
}

// Listen for messages from web pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "checkExtension") {
    sendResponse({ installed: true, extensionId: chrome.runtime.id })
    return
  }

  // ============================================
  // Link Grab Message Handlers
  // ============================================

  if (message?.type === "getGrabbedLinks") {
    ;(async () => {
      const links = await getGrabbedLinks()
      sendResponse({ success: true, links })
    })()
    return true
  }

  if (message?.type === "addGrabbedLink") {
    ;(async () => {
      const result = await addGrabbedLink(message.url, message.title, message.source)
      sendResponse(result)
    })()
    return true
  }

  if (message?.type === "removeGrabbedLink") {
    ;(async () => {
      const result = await removeGrabbedLink(message.url)
      sendResponse(result)
    })()
    return true
  }

  if (message?.type === "clearGrabbedLinks") {
    ;(async () => {
      const result = await clearGrabbedLinks()
      sendResponse(result)
    })()
    return true
  }

  if (message?.type === "captureCurrentTab") {
    ;(async () => {
      const result = await captureCurrentTab()
      sendResponse(result)
    })()
    return true
  }

  // Twitter bookmark handler
  if (message?.type === "twitterBookmark") {
    if (REWAY_DEBUG) console.log("Received Twitter bookmark message:", message)

    ;(async () => {
      try {
        const settings = await getSettings()
        if (REWAY_DEBUG)
          console.log("Settings retrieved:", {
            baseUrl: settings.baseUrl,
          })

        // Check if "X Bookmarks" group exists, create if not
        if (REWAY_DEBUG) console.log("Fetching groups...")
        const groupsResponse = await fetch(`${settings.baseUrl}/api/extension/groups`, {
          credentials: "include",
        })

        if (!groupsResponse.ok) {
          console.error("Failed to fetch groups:", groupsResponse.status)
          throw new Error("Failed to fetch groups")
        }

        const groupsData = await groupsResponse.json()
        if (REWAY_DEBUG) console.log("Groups fetched:", groupsData)

        const { xBookmarksGroupId } = await chrome.storage.local.get(["xBookmarksGroupId"])

        let xBookmarksGroup = xBookmarksGroupId
          ? groupsData.groups?.find((g) => g.id === xBookmarksGroupId)
          : null

        if (!xBookmarksGroup) {
          xBookmarksGroup = groupsData.groups?.find((g) => g.name === "X Bookmarks")
          if (xBookmarksGroup) {
            await chrome.storage.local.set({
              xBookmarksGroupId: xBookmarksGroup.id,
            })
          }
        }

        if (REWAY_DEBUG) console.log("X Bookmarks group exists:", !!xBookmarksGroup)

        // Create group if it doesn't exist
        if (!xBookmarksGroup) {
          if (REWAY_DEBUG) console.log("Creating X Bookmarks group...")
          const createGroupResponse = await fetch(`${settings.baseUrl}/api/extension/groups`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "X Bookmarks", icon: "twitter" }),
          })

          if (!createGroupResponse.ok) {
            console.error("Failed to create X Bookmarks group:", createGroupResponse.status)
            throw new Error("Failed to create X Bookmarks group")
          }

          const createGroupData = await createGroupResponse.json()
          if (REWAY_DEBUG) console.log("X Bookmarks group created:", createGroupData)
          xBookmarksGroup = createGroupData.group
          await chrome.storage.local.set({
            xBookmarksGroupId: xBookmarksGroup.id,
          })
        }

        // Create bookmark
        const bookmarkTitle = message.title?.trim() || message.description?.trim() || message.url
        const bookmarkDescription = message.description?.trim() || ""
        const bookmarkFavicon = message.faviconUrl?.trim() || null

        if (REWAY_DEBUG)
          console.log("Creating bookmark with:", {
            url: message.url,
            title: bookmarkTitle.substring(0, 100),
            groupId: xBookmarksGroup.id,
          })

        const bookmarkResponse = await fetch(`${settings.baseUrl}/api/extension/bookmarks`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: message.url,
            title: bookmarkTitle,
            description: bookmarkDescription,
            faviconUrl: bookmarkFavicon,
            groupId: xBookmarksGroup.id,
          }),
        })

        if (!bookmarkResponse.ok) {
          console.error(
            "Failed to create bookmark:",
            bookmarkResponse.status,
            await bookmarkResponse.text(),
          )
          throw new Error("Failed to create bookmark")
        }

        const bookmarkData = await bookmarkResponse.json()
        if (REWAY_DEBUG) console.log("Bookmark created successfully:", bookmarkData)

        sendResponse({ success: true })
      } catch (error) {
        const message = String(error?.message || "Failed")
        if (REWAY_DEBUG) {
          console.error("Twitter bookmark failed:", error)
        } else {
          __rewayWarnOnce(`twitter-bookmark-failed:${message}`, "Twitter bookmark failed:", message)
        }
        sendResponse({ success: false, error: message })
      }
    })()
    return true
  }

  if (message?.type === "openGroup") {
    ;(async () => {
      try {
        const settings = await getSettings()

        if (sender?.url) {
          const senderUrl = new URL(sender.url)
          const allowedOrigin = new URL(settings.baseUrl).origin
          if (senderUrl.origin !== allowedOrigin) {
            throw new Error("Invalid sender origin")
          }
        }

        const directUrls = Array.isArray(message.urls) ? message.urls.filter(Boolean) : []

        const normalizedUrls = directUrls
          .map((url) => {
            try {
              const parsed = new URL(url)
              if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return null
              }
              return parsed.toString()
            } catch {
              return null
            }
          })
          .filter(Boolean)
          .slice(0, 25)

        if (normalizedUrls.length > 0) {
          await Promise.all(normalizedUrls.map((url) => chrome.tabs.create({ url, active: false })))
          sendResponse({ ok: true, count: normalizedUrls.length })
          return
        }

        const url = new URL(`${settings.baseUrl}/api/extension/bookmarks`)
        if (message.groupId) {
          url.searchParams.set("groupId", message.groupId)
        }

        const response = await fetch(url.toString(), {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch bookmarks")
        }

        const data = await response.json()
        const bookmarks = data.bookmarks || []

        const bookmarkUrls = bookmarks
          .map((bookmark) => bookmark.url)
          .filter(Boolean)
          .map((url) => {
            try {
              const parsed = new URL(url)
              if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return null
              }
              return parsed.toString()
            } catch {
              return null
            }
          })
          .filter(Boolean)
          .slice(0, 25)

        await Promise.all(bookmarkUrls.map((url) => chrome.tabs.create({ url, active: false })))

        sendResponse({ ok: true, count: bookmarkUrls.length })
      } catch (error) {
        const msg = String(error?.message || "Failed")
        __rewayErrorOnce(`open-group-failed:${msg}`, "Open group failed:", error)
        sendResponse({ ok: false, error: error?.message || "Failed" })
      }
    })()
    return true
  }
})
