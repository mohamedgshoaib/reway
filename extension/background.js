import {
  readCachedBookmarks,
  readCachedGroups,
  touchBookmarkCache,
  writeCachedBookmarks,
  writeCachedGroups,
} from "./js/access-cache.js";
import { apiFetch, getSettings } from "./js/api.js";

const REWAY_DEBUG = false;
const ACCESS_COMMAND_KEY = "rewayAccessCommand";
const SEARCH_FALLBACK_BOOKMARK_LIMIT = 500;
const NO_GROUP_ID = "no-group";

const rewayWorkerLogSeen = new Map();
let accessCommandStorageReady = null;
let useLocalAccessCommandStorage = false;

function rewayErrorOnce(key, ...args) {
  const now = Date.now();
  const last = rewayWorkerLogSeen.get(key) || 0;
  if (now - last < 60_000) return;
  rewayWorkerLogSeen.set(key, now);
  console.error(...args);
}

function summarizeError(error) {
  return {
    message: String(error?.message || error || "Failed"),
    status: error?.status,
    url: error?.url,
    data: error?.data,
  };
}

function rewayWarnOnce(key, ...args) {
  const now = Date.now();
  const last = rewayWorkerLogSeen.get(key) || 0;
  if (now - last < 60_000) return;
  rewayWorkerLogSeen.set(key, now);
  console.warn(...args);
}

function getAccessCommandStorageArea() {
  if (useLocalAccessCommandStorage || !chrome.storage.session) {
    return chrome.storage.local;
  }

  return chrome.storage.session;
}

async function prepareAccessCommandStorage() {
  if (accessCommandStorageReady) return accessCommandStorageReady;

  accessCommandStorageReady = (async () => {
    if (!chrome.storage.session?.setAccessLevel) {
      useLocalAccessCommandStorage = true;
      return;
    }

    await chrome.storage.session.setAccessLevel({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
    });
  })().catch((error) => {
    accessCommandStorageReady = null;
    useLocalAccessCommandStorage = true;
    rewayWarnOnce(
      "access-command-storage-unavailable",
      "Quick access command storage setup failed:",
      error,
    );
  });

  return accessCommandStorageReady;
}

void prepareAccessCommandStorage();

// ============================================
// Link Grab Storage Manager
// ============================================

function getGrabbedStorageArea() {
  return chrome.storage.session || chrome.storage.local;
}

async function getGrabbedLinks() {
  const storage = getGrabbedStorageArea();
  const { grabbedLinks } = await storage.get(["grabbedLinks"]);
  return Array.isArray(grabbedLinks) ? grabbedLinks : [];
}

async function addGrabbedLink(
  url,
  title,
  source = "manual",
  favIconUrl = null,
) {
  const links = await getGrabbedLinks();

  // Check for duplicates
  const exists = links.some((link) => link.url === url);
  if (exists) {
    return { success: false, reason: "duplicate" };
  }

  // Avoid cross-origin HTML fetching in the service worker.
  // Use a safe fallback title + favicon derivation.
  let fetchedTitle = title;
  let fetchedFavIcon = favIconUrl;

  if (source === "manual" && !title) {
    try {
      const urlObj = new URL(url);
      fetchedTitle = urlObj.hostname;
      fetchedFavIcon = `${urlObj.origin}/favicon.ico`;
    } catch (error) {
      rewayWarnOnce(
        "derive-metadata-failed",
        "Failed to derive metadata:",
        error,
      );
    }
  }

  const newLink = {
    url,
    title: fetchedTitle || url,
    source,
    favIconUrl: fetchedFavIcon,
    timestamp: new Date().toISOString(),
  };

  links.unshift(newLink); // Add to beginning
  const storage = getGrabbedStorageArea();
  await storage.set({ grabbedLinks: links });

  // Update badge
  await updateGrabbedLinksBadge(links.length);

  return { success: true, link: newLink };
}

async function removeGrabbedLink(url) {
  const links = await getGrabbedLinks();
  const filtered = links.filter((link) => link.url !== url);
  const storage = getGrabbedStorageArea();
  await storage.set({ grabbedLinks: filtered });
  await updateGrabbedLinksBadge(filtered.length);
  return { success: true, count: filtered.length };
}

async function clearGrabbedLinks() {
  const storage = getGrabbedStorageArea();
  await storage.set({ grabbedLinks: [] });
  await updateGrabbedLinksBadge(0);
  return { success: true };
}

async function captureCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.url) {
    return { success: false, reason: "no-tab" };
  }

  return addGrabbedLink(
    tab.url,
    tab.title || tab.url,
    "current-tab",
    tab.favIconUrl,
  );
}

async function updateGrabbedLinksBadge(count) {
  if (count > 0) {
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: "#18181b" });
    if (typeof chrome.action.setBadgeTextColor === "function") {
      await chrome.action.setBadgeTextColor({ color: "#ffffff" });
    }
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }
}

function respondAsync(sendResponse, handler) {
  (async () => {
    try {
      await handler();
    } catch (error) {
      rewayErrorOnce(
        "worker-handler-failed",
        "Background handler failed:",
        summarizeError(error),
      );
      sendResponse({
        success: false,
        error: {
          message: String(error?.message || "Failed"),
          status: error?.status,
          code: deriveErrorCode(error?.status),
        },
      });
    }
  })();
  return true;
}

function deriveErrorCode(status) {
  if (status === 401 || status === 403) return "AUTH_EXPIRED";
  if (status === 429) return "RATE_LIMITED";
  if (typeof status === "number" && status >= 500) return "SERVER_ERROR";
  return "REQUEST_FAILED";
}

function isHttpUrl(candidateUrl) {
  try {
    const parsed = new URL(candidateUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeHttpUrls(urls) {
  return urls
    .flatMap((candidateUrl) => {
      try {
        const parsed = new URL(candidateUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return [];
        }
        return [parsed.toString()];
      } catch {
        return [];
      }
    });
}

async function openUrlsInBackgroundTabs(urls) {
  const batchSize = 10;
  const delayMs = 150;

  for (let index = 0; index < urls.length; index += batchSize) {
    const batch = urls.slice(index, index + batchSize);
    await Promise.all(
      batch.map((tabUrl) => chrome.tabs.create({ url: tabUrl, active: false })),
    );

    if (index + batchSize < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function openUrlInForegroundTab(url) {
  if (!isHttpUrl(url)) {
    throw new Error("Invalid bookmark URL");
  }

  await chrome.tabs.create({ url, active: true });
}

async function handleGrabbedLinksMessage(message) {
  if (message?.type === "getGrabbedLinks") {
    const links = await getGrabbedLinks();
    return { success: true, links };
  }

  if (message?.type === "addGrabbedLink") {
    return addGrabbedLink(
      message.url,
      message.title,
      message.source,
      message.favIconUrl,
    );
  }

  if (message?.type === "removeGrabbedLink") {
    return removeGrabbedLink(message.url);
  }

  if (message?.type === "clearGrabbedLinks") {
    return clearGrabbedLinks();
  }

  if (message?.type === "captureCurrentTab") {
    return captureCurrentTab();
  }

  return null;
}

async function fetchExtensionGroups() {
  return apiFetch("/api/extension/groups");
}

function getVisibleAccessGroups(groups) {
  return Array.isArray(groups)
    ? groups.filter((group) => group.show_in_fab !== false)
    : [];
}

async function fetchAccessGroups() {
  const data = await apiFetch("/api/extension/groups");
  const groups = getVisibleAccessGroups(data.groups);
  await writeCachedGroups(groups);
  return groups;
}

async function refreshAccessGroups(tabId) {
  try {
    const groups = await fetchAccessGroups();
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: "rewayAccessGroupsUpdated",
          groups,
        });
      } catch {
        // Page may have navigated or the content script may not be active yet.
      }
    }
  } catch (error) {
    rewayWarnOnce(
      `access-groups-refresh-failed:${error?.status || error?.message || "failed"}`,
      "Access groups refresh failed:",
      error,
    );
  }
}

async function getAccessGroups(tabId) {
  const cached = await readCachedGroups();
  if (cached.groups.length > 0) {
    if (!cached.isFresh) {
      void refreshAccessGroups(tabId);
    }
    return { ok: true, groups: cached.groups, stale: !cached.isFresh };
  }

  const groups = await fetchAccessGroups();
  return { ok: true, groups, stale: false };
}

async function fetchAccessBookmarks(groupId, options = {}) {
  const { limit, cache = true } = options;
  const cacheKey = groupId || NO_GROUP_ID;
  const params = new URLSearchParams();
  params.set("groupId", cacheKey);
  if (Number.isFinite(limit)) {
    params.set("limit", String(limit));
  }
  const data = await apiFetch(`/api/extension/bookmarks?${params.toString()}`);
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  if (cache) {
    await writeCachedBookmarks(cacheKey, bookmarks);
  }
  return bookmarks;
}

async function refreshAccessBookmarks(groupId, tabId) {
  try {
    const bookmarks = await fetchAccessBookmarks(groupId);
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: "rewayAccessBookmarksUpdated",
          groupId: groupId || NO_GROUP_ID,
          bookmarks,
        });
      } catch {
        // Page may have navigated or the content script may not be active yet.
      }
    }
  } catch (error) {
    rewayWarnOnce(
      `access-bookmarks-refresh-failed:${groupId || NO_GROUP_ID}:${error?.status || error?.message || "failed"}`,
      "Access bookmarks refresh failed:",
      error,
    );
  }
}

async function getAccessBookmarks(groupId, tabId) {
  const cacheKey = groupId || NO_GROUP_ID;
  const cached = await readCachedBookmarks(cacheKey);
  if (cached.bookmarks.length > 0) {
    await touchBookmarkCache(cacheKey);
    if (!cached.isFresh) {
      void refreshAccessBookmarks(cacheKey, tabId);
    }
    return {
      ok: true,
      groupId: cacheKey,
      bookmarks: cached.bookmarks,
      stale: !cached.isFresh,
    };
  }

  const bookmarks = await fetchAccessBookmarks(cacheKey);
  return { ok: true, groupId: cacheKey, bookmarks, stale: false };
}

async function searchAccessBookmarks(query, limit) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const maxResults = Number.isFinite(limit) ? limit : 20;
  const params = new URLSearchParams();
  params.set("q", normalizedQuery);
  if (maxResults) {
    params.set("limit", String(maxResults));
  }

  let data;
  try {
    data = await apiFetch(`/api/extension/bookmarks/search?${params.toString()}`);
  } catch (error) {
    if (error?.status !== 404) throw error;

    const fallbackBookmarks = await fetchAccessBookmarks("all", {
      limit: SEARCH_FALLBACK_BOOKMARK_LIMIT,
      cache: false,
    });
    return {
      ok: true,
      bookmarks: filterBookmarksLocally(
        fallbackBookmarks,
        normalizedQuery,
        maxResults,
      ),
      fallback: true,
    };
  }

  return {
    ok: true,
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
  };
}

function filterBookmarksLocally(bookmarks, query, limit) {
  if (!query) return [];

  return (Array.isArray(bookmarks) ? bookmarks : [])
    .filter((bookmark) => {
      const haystack = [
        bookmark?.title,
        bookmark?.url,
        bookmark?.domain,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .slice(0, limit);
}

async function recordBookmarkVisit(bookmarkId) {
  if (!bookmarkId) return;

  try {
    await apiFetch("/api/bookmarks/visits", {
      method: "POST",
      body: JSON.stringify({ bookmarkIds: [bookmarkId] }),
    });
  } catch (error) {
    rewayWarnOnce(
      `access-visit-failed:${error?.status || error?.message || "failed"}`,
      "Access visit tracking failed:",
      error,
    );
  }
}

async function getExtensionUrl(pathname) {
  const { baseUrl } = await getSettings();
  return new URL(pathname, baseUrl).toString();
}

async function handleAccessMessage(message, sender) {
  const tabId = sender?.tab?.id;

  if (message?.type === "rewayAccessGetGroups") {
    return getAccessGroups(tabId);
  }

  if (message?.type === "rewayAccessGetGroupBookmarks") {
    return getAccessBookmarks(message.groupId || NO_GROUP_ID, tabId);
  }

  if (message?.type === "rewayAccessSearchBookmarks") {
    return searchAccessBookmarks(message.query || "", message.limit);
  }

  if (message?.type === "rewayAccessOpenBookmark") {
    await openUrlInForegroundTab(message.url);
    void recordBookmarkVisit(message.bookmarkId);
    return { ok: true };
  }

  if (message?.type === "rewayAccessOpenGroup") {
    const urls = Array.isArray(message.urls)
      ? normalizeHttpUrls(message.urls)
      : normalizeHttpUrls(
          (await fetchAccessBookmarks(message.groupId || NO_GROUP_ID)).map(
            (b) => b.url,
          ),
        );
    await openUrlsInBackgroundTabs(urls);
    return { ok: true, count: urls.length };
  }

  if (message?.type === "rewayAccessGetLoginUrl") {
    return { ok: true, url: await getExtensionUrl("/login") };
  }

  if (message?.type === "rewayAccessGetDashboardUrl") {
    return { ok: true, url: await getExtensionUrl("/dashboard") };
  }

  return null;
}

async function dispatchQuickAccessCommand() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id || !isHttpUrl(tab.url || "")) return;

  // chrome.tabs.sendMessage requires host_permissions for the target URL in
  // MV3, but our host_permissions only cover Reway origins. Use
  // chrome.storage.session as a broadcast bus instead: the content script
  // listens for changes and opens only on the tab where document.hasFocus().
  await prepareAccessCommandStorage();
  await getAccessCommandStorageArea().set({
    [ACCESS_COMMAND_KEY]: { action: "open-quick-access", ts: Date.now() },
  });
}

async function resolveXBookmarksGroup(baseUrl, groupsData) {
  const { xBookmarksGroupId } = await chrome.storage.local.get([
    "xBookmarksGroupId",
  ]);

  let xBookmarksGroup = xBookmarksGroupId
    ? groupsData.groups?.find((g) => g.id === xBookmarksGroupId)
    : null;

  if (!xBookmarksGroup) {
    xBookmarksGroup = groupsData.groups?.find((g) => g.name === "X Bookmarks");
    if (xBookmarksGroup) {
      await chrome.storage.local.set({
        xBookmarksGroupId: xBookmarksGroup.id,
      });
    }
  }

  if (xBookmarksGroup) {
    return xBookmarksGroup;
  }

  const createGroupResponse = await fetch(`${baseUrl}/api/extension/groups`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "X Bookmarks", icon: "twitter" }),
  });

  if (!createGroupResponse.ok) {
    rewayWarnOnce(
      `x-group-create-failed:${createGroupResponse.status}`,
      "Failed to create X Bookmarks group:",
      createGroupResponse.status,
    );
    throw new Error("Failed to create X Bookmarks group");
  }

  const createGroupData = await createGroupResponse.json();
  xBookmarksGroup = createGroupData.group;
  await chrome.storage.local.set({
    xBookmarksGroupId: xBookmarksGroup.id,
  });

  return xBookmarksGroup;
}

async function createTwitterBookmark(baseUrl, groupId, message) {
  const bookmarkTitle =
    message.title?.trim() || message.description?.trim() || message.url;
  const bookmarkDescription = message.description?.trim() || "";
  const bookmarkFavicon = message.faviconUrl?.trim() || null;

  if (REWAY_DEBUG) {
    console.log("Creating bookmark with:", {
      url: message.url,
      title: bookmarkTitle.substring(0, 100),
      groupId,
    });
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
  });

  if (!bookmarkResponse.ok) {
    rewayWarnOnce(
      `twitter-bookmark-create-failed:${bookmarkResponse.status}`,
      "Failed to create bookmark:",
      bookmarkResponse.status,
      await summarizeResponse(bookmarkResponse),
    );
    throw new Error("Failed to create bookmark");
  }

  return bookmarkResponse.json();
}

async function isTwitterAutoCaptureEnabled() {
  const { rewayXAutoCaptureEnabled } = await chrome.storage.local.get(
    "rewayXAutoCaptureEnabled",
  );
  return rewayXAutoCaptureEnabled !== false;
}

async function summarizeResponse(response) {
  try {
    return String(await response.text()).replace(/\s+/g, " ").slice(0, 240);
  } catch {
    return "";
  }
}

async function handleTwitterBookmark(message, sendResponse) {
  if (REWAY_DEBUG) console.log("Received Twitter bookmark message:", message);

  try {
    if (!(await isTwitterAutoCaptureEnabled())) {
      sendResponse({ success: false, ignored: true });
      return;
    }

    const settings = await getSettings();
    if (REWAY_DEBUG) {
      console.log("Settings retrieved:", {
        baseUrl: settings.baseUrl,
      });
      console.log("Fetching groups...");
    }

    const groupsData = await fetchExtensionGroups();
    if (REWAY_DEBUG) console.log("Groups fetched:", groupsData);

    const xBookmarksGroup = await resolveXBookmarksGroup(
      settings.baseUrl,
      groupsData,
    );
    if (REWAY_DEBUG)
      console.log("X Bookmarks group exists:", !!xBookmarksGroup);

    const bookmarkData = await createTwitterBookmark(
      settings.baseUrl,
      xBookmarksGroup.id,
      message,
    );
    if (REWAY_DEBUG)
      console.log("Bookmark created successfully:", bookmarkData);

    sendResponse({ success: true });
  } catch (error) {
    const errorMessage = String(error?.message || "Failed");
    if (REWAY_DEBUG) {
      console.error("Twitter bookmark failed:", error);
    } else {
      rewayWarnOnce(
        `twitter-bookmark-failed:${errorMessage}`,
        "Twitter bookmark failed:",
        errorMessage,
      );
    }
    sendResponse({ success: false, error: errorMessage });
  }
}

async function fetchGroupBookmarkUrls(groupId) {
  const params = new URLSearchParams();
  if (groupId) {
    params.set("groupId", groupId);
  }

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const data = await apiFetch(`/api/extension/bookmarks${query}`);
  const bookmarks = data.bookmarks || [];
  return normalizeHttpUrls(
    bookmarks.map((bookmark) => bookmark.url).filter(Boolean),
  );
}

async function validateOpenGroupSender(sender, baseUrl) {
  if (!sender?.url) return;
  const senderUrl = new URL(sender.url);
  const allowedOrigin = new URL(baseUrl).origin;
  if (senderUrl.origin !== allowedOrigin) {
    throw new Error("Invalid sender origin");
  }
}

async function handleOpenGroup(message, sender, sendResponse) {
  try {
    const settings = await getSettings();
    await validateOpenGroupSender(sender, settings.baseUrl);

    const directUrls = Array.isArray(message.urls)
      ? message.urls.filter(Boolean)
      : [];
    const normalizedUrls = normalizeHttpUrls(directUrls);

    if (normalizedUrls.length > 0) {
      await openUrlsInBackgroundTabs(normalizedUrls);
      sendResponse({ ok: true, count: normalizedUrls.length });
      return;
    }

    const bookmarkUrls = await fetchGroupBookmarkUrls(message.groupId);
    await openUrlsInBackgroundTabs(bookmarkUrls);
    sendResponse({ ok: true, count: bookmarkUrls.length });
  } catch (error) {
    const msg = String(error?.message || "Failed");
    rewayErrorOnce(`open-group-failed:${msg}`, "Open group failed:", error);
    sendResponse({
      ok: false,
      error: {
        message: error?.message || "Failed",
        status: error?.status,
        code: deriveErrorCode(error?.status),
      },
      status: error?.status,
    });
  }
}

// Listen for messages from web pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "checkExtension") {
    sendResponse({ installed: true, extensionId: chrome.runtime.id });
    return;
  }

  if (
    message?.type === "getGrabbedLinks" ||
    message?.type === "addGrabbedLink" ||
    message?.type === "removeGrabbedLink" ||
    message?.type === "clearGrabbedLinks" ||
    message?.type === "captureCurrentTab"
  ) {
    return respondAsync(sendResponse, async () => {
      sendResponse(await handleGrabbedLinksMessage(message));
    });
  }

  if (message?.type === "twitterBookmark") {
    return respondAsync(sendResponse, async () => {
      await handleTwitterBookmark(message, sendResponse);
    });
  }

  if (message?.type === "openGroup") {
    return respondAsync(sendResponse, async () => {
      await handleOpenGroup(message, sender, sendResponse);
    });
  }

  if (
    typeof message?.type === "string" &&
    message.type.startsWith("rewayAccess")
  ) {
    return respondAsync(sendResponse, async () => {
      sendResponse(await handleAccessMessage(message, sender));
    });
  }
});

chrome.commands?.onCommand?.addListener((command) => {
  if (command !== "open-quick-access") return;
  void dispatchQuickAccessCommand();
});
