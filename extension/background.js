const DEFAULT_BASE_URL = "https://www.reway.page"

const REWAY_DEBUG = false

async function getSettings() {
  const { rewayBaseUrl } = await chrome.storage.local.get(["rewayBaseUrl"])
  return {
    baseUrl: rewayBaseUrl || DEFAULT_BASE_URL,
  }
}

const rewayWorkerLogSeen = new Map()

function rewayErrorOnce(key, ...args) {
  const now = Date.now()
  const last = rewayWorkerLogSeen.get(key) || 0
  if (now - last < 60_000) return
  rewayWorkerLogSeen.set(key, now)
  console.error(...args)
}

function rewayWarnOnce(key, ...args) {
  const now = Date.now()
  const last = rewayWorkerLogSeen.get(key) || 0
  if (now - last < 60_000) return
  rewayWorkerLogSeen.set(key, now)
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
      rewayWarnOnce("derive-metadata-failed", "Failed to derive metadata:", error)
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

function respondAsync(sendResponse, handler) {
  ;(async () => {
    try {
      await handler()
    } catch (error) {
      rewayErrorOnce("worker-handler-failed", "Background handler failed:", error)
      sendResponse({ success: false, error: String(error?.message || "Failed") })
    }
  })()
  return true
}

function isHttpUrl(candidateUrl) {
  try {
    const parsed = new URL(candidateUrl)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeHttpUrls(urls, limit = 25) {
  return urls
    .flatMap((candidateUrl) => {
      try {
        const parsed = new URL(candidateUrl)
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return []
        }
        return [parsed.toString()]
      } catch {
        return []
      }
    })
    .slice(0, limit)
}

async function openUrlsInBackgroundTabs(urls) {
  await Promise.all(urls.map((tabUrl) => chrome.tabs.create({ url: tabUrl, active: false })))
}

async function handleGrabbedLinksMessage(message) {
  if (message?.type === "getGrabbedLinks") {
    const links = await getGrabbedLinks()
    return { success: true, links }
  }

  if (message?.type === "addGrabbedLink") {
    return addGrabbedLink(message.url, message.title, message.source, message.favIconUrl)
  }

  if (message?.type === "removeGrabbedLink") {
    return removeGrabbedLink(message.url)
  }

  if (message?.type === "clearGrabbedLinks") {
    return clearGrabbedLinks()
  }

  if (message?.type === "captureCurrentTab") {
    return captureCurrentTab()
  }

  return null
}

async function fetchExtensionGroups(baseUrl) {
  const groupsResponse = await fetch(`${baseUrl}/api/extension/groups`, {
    credentials: "include",
  })

  if (!groupsResponse.ok) {
    console.error("Failed to fetch groups:", groupsResponse.status)
    throw new Error("Failed to fetch groups")
  }

  return groupsResponse.json()
}

async function resolveXBookmarksGroup(baseUrl, groupsData) {
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

  if (xBookmarksGroup) {
    return xBookmarksGroup
  }

  const createGroupResponse = await fetch(`${baseUrl}/api/extension/groups`, {
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
  xBookmarksGroup = createGroupData.group
  await chrome.storage.local.set({
    xBookmarksGroupId: xBookmarksGroup.id,
  })

  return xBookmarksGroup
}

async function createTwitterBookmark(baseUrl, groupId, message) {
  const bookmarkTitle = message.title?.trim() || message.description?.trim() || message.url
  const bookmarkDescription = message.description?.trim() || ""
  const bookmarkFavicon = message.faviconUrl?.trim() || null

  if (REWAY_DEBUG) {
    console.log("Creating bookmark with:", {
      url: message.url,
      title: bookmarkTitle.substring(0, 100),
      groupId,
    })
  }

  const bookmarkResponse = await fetch(`${baseUrl}/api/extension/bookmarks`, {
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
      groupId,
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

  return bookmarkResponse.json()
}

async function handleTwitterBookmark(message, sendResponse) {
  if (REWAY_DEBUG) console.log("Received Twitter bookmark message:", message)

  try {
    const settings = await getSettings()
    if (REWAY_DEBUG) {
      console.log("Settings retrieved:", {
        baseUrl: settings.baseUrl,
      })
      console.log("Fetching groups...")
    }

    const groupsData = await fetchExtensionGroups(settings.baseUrl)
    if (REWAY_DEBUG) console.log("Groups fetched:", groupsData)

    const xBookmarksGroup = await resolveXBookmarksGroup(settings.baseUrl, groupsData)
    if (REWAY_DEBUG) console.log("X Bookmarks group exists:", !!xBookmarksGroup)

    const bookmarkData = await createTwitterBookmark(settings.baseUrl, xBookmarksGroup.id, message)
    if (REWAY_DEBUG) console.log("Bookmark created successfully:", bookmarkData)

    sendResponse({ success: true })
  } catch (error) {
    const errorMessage = String(error?.message || "Failed")
    if (REWAY_DEBUG) {
      console.error("Twitter bookmark failed:", error)
    } else {
      rewayWarnOnce(
        `twitter-bookmark-failed:${errorMessage}`,
        "Twitter bookmark failed:",
        errorMessage,
      )
    }
    sendResponse({ success: false, error: errorMessage })
  }
}

async function fetchGroupBookmarkUrls(baseUrl, groupId) {
  const url = new URL(`${baseUrl}/api/extension/bookmarks`)
  if (groupId) {
    url.searchParams.set("groupId", groupId)
  }

  const response = await fetch(url.toString(), {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch bookmarks")
  }

  const data = await response.json()
  const bookmarks = data.bookmarks || []
  return normalizeHttpUrls(bookmarks.map((bookmark) => bookmark.url).filter(Boolean))
}

async function validateOpenGroupSender(sender, baseUrl) {
  if (!sender?.url) return
  const senderUrl = new URL(sender.url)
  const allowedOrigin = new URL(baseUrl).origin
  if (senderUrl.origin !== allowedOrigin) {
    throw new Error("Invalid sender origin")
  }
}

async function handleOpenGroup(message, sender, sendResponse) {
  try {
    const settings = await getSettings()
    await validateOpenGroupSender(sender, settings.baseUrl)

    const directUrls = Array.isArray(message.urls) ? message.urls.filter(Boolean) : []
    const normalizedUrls = normalizeHttpUrls(directUrls)

    if (normalizedUrls.length > 0) {
      await openUrlsInBackgroundTabs(normalizedUrls)
      sendResponse({ ok: true, count: normalizedUrls.length })
      return
    }

    const bookmarkUrls = await fetchGroupBookmarkUrls(settings.baseUrl, message.groupId)
    await openUrlsInBackgroundTabs(bookmarkUrls)
    sendResponse({ ok: true, count: bookmarkUrls.length })
  } catch (error) {
    const msg = String(error?.message || "Failed")
    rewayErrorOnce(`open-group-failed:${msg}`, "Open group failed:", error)
    sendResponse({ ok: false, error: error?.message || "Failed" })
  }
}

// Listen for messages from web pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "checkExtension") {
    sendResponse({ installed: true, extensionId: chrome.runtime.id })
    return
  }

  if (
    message?.type === "getGrabbedLinks" ||
    message?.type === "addGrabbedLink" ||
    message?.type === "removeGrabbedLink" ||
    message?.type === "clearGrabbedLinks" ||
    message?.type === "captureCurrentTab"
  ) {
    return respondAsync(sendResponse, async () => {
      sendResponse(await handleGrabbedLinksMessage(message))
    })
  }

  if (message?.type === "twitterBookmark") {
    return respondAsync(sendResponse, async () => {
      await handleTwitterBookmark(message, sendResponse)
    })
  }

  if (message?.type === "openGroup") {
    return respondAsync(sendResponse, async () => {
      await handleOpenGroup(message, sender, sendResponse)
    })
  }
})
