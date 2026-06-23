import { NO_GROUP_ID } from "./state.js";

// Set by the entry point once the host element exists; used by cleanupFab.
let _cleanupFn = null;
export function registerCleanup(fn) {
  _cleanupFn = fn;
}

export function isExtensionContextValid() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

export function isInvalidExtensionContextError(error) {
  return String(error?.message || error)
    .toLowerCase()
    .includes("extension context invalidated");
}

export function ensureLiveExtensionContext() {
  if (isExtensionContextValid()) return true;
  _cleanupFn?.();
  return false;
}

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!ensureLiveExtensionContext()) {
      reject(new Error("Extension context invalidated"));
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          const error = new Error(err.message);
          if (isInvalidExtensionContextError(error)) _cleanupFn?.();
          reject(error);
          return;
        }
        if (response?.ok === false || response?.success === false) {
          const payload =
            response?.error && typeof response.error === "object"
              ? response.error
              : { message: response?.error || "Request failed" };
          const error = new Error(payload.message || "Request failed");
          error.status = payload.status ?? response.status;
          error.code = payload.code;
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      if (isInvalidExtensionContextError(error)) _cleanupFn?.();
      reject(error);
    }
  });
}

export async function safeStorageLocalSet(value) {
  if (!ensureLiveExtensionContext()) return;
  try {
    await chrome.storage.local.set(value);
  } catch (error) {
    if (isInvalidExtensionContextError(error)) _cleanupFn?.();
  }
}

// ── Message helpers ──────────────────────────────────────────────────────────

export function msgGetGroups() {
  return sendMessage({ type: "rewayAccessGetGroups" });
}

export function msgGetGroupBookmarks(groupId) {
  return sendMessage({ type: "rewayAccessGetGroupBookmarks", groupId: groupId || NO_GROUP_ID });
}

export function msgSearchBookmarks(query, limit = 20) {
  return sendMessage({ type: "rewayAccessSearchBookmarks", query, limit });
}

export function msgOpenBookmark(url, bookmarkId) {
  return sendMessage({ type: "rewayAccessOpenBookmark", url, bookmarkId });
}

export function msgOpenGroup(groupId, urls) {
  return sendMessage({ type: "rewayAccessOpenGroup", groupId, urls });
}

export function msgSaveBookmark(payload) {
  return sendMessage({ type: "rewayAccessSaveBookmark", ...payload });
}

export function msgDeleteBookmark(bookmarkId) {
  return sendMessage({ type: "rewayAccessDeleteBookmark", bookmarkId });
}

export function msgGetDashboardUrl() {
  return sendMessage({ type: "rewayAccessGetDashboardUrl" });
}
