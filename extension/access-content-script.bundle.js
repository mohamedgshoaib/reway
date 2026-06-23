"use strict";
(() => {
  // extension/js/fab/state.js
  var ROOT_ID = "reway-access-root";
  var PANEL_ID = "reway-fab-panel";
  var FAB_SIZE = 44;
  var EDGE_MARGIN = 16;
  var SEARCH_DEBOUNCE_MS = 180;
  var SUCCESS_RESET_MS = 5e3;
  var NO_GROUP_ID = "no-group";
  var ACCESS_COMMAND_KEY = "rewayAccessCommand";
  var GROUP_ICON_MANIFEST_PATH = "js/group-icon-manifest.js";
  var GROUP_ICON_MANIFEST_ASSIGNMENT = "globalThis.REWAY_GROUP_ICON_MANIFEST = ";
  var MIN_VIEWPORT_WIDTH = 720;
  var MIN_VIEWPORT_HEIGHT = 420;
  var DEFAULT_CORNER = "bottom-right";
  var STRIP = { PAGE: "page", SESSION: "session", SUCCESS: "success" };
  var VIEW = { GROUPS: "groups", DRILL_IN: "drill-in", SEARCH: "search" };
  var state = {
    // lifecycle
    enabled: false,
    panelOpen: false,
    keyboardMode: false,
    fabCorner: DEFAULT_CORNER,
    // save strip
    stripMode: STRIP.PAGE,
    lastGroupId: null,
    lastGroupName: "",
    pickerMode: false,
    pickerReturnTo: STRIP.PAGE,
    pickerSelectedIds: /* @__PURE__ */ new Set(),
    // success state
    successBookmark: null,
    // { id, url, groupId, groupName }
    // session strip
    sessionTabCount: 0,
    sessionName: "",
    // groups panel
    view: VIEW.GROUPS,
    groups: [],
    groupsStatus: "idle",
    // "idle" | "loading" | "ready" | "error"
    pinnedGroupIds: /* @__PURE__ */ new Set(),
    recentGroupIds: [],
    // ordered list of up to 3 recently saved-to group IDs
    // drill-in
    activeGroupId: null,
    groupActionsOpen: false,
    bookmarksByGroup: /* @__PURE__ */ new Map(),
    bookmarksStatusByGroup: /* @__PURE__ */ new Map(),
    // groupId → "idle" | "loading" | "ready" | "error"
    // search
    searchQuery: "",
    searchStatus: "idle",
    // "idle" | "loading" | "ready" | "error"
    searchResults: { groups: [], bookmarks: [] },
    // page context — populated at panel open from the active tab
    pageTitle: "",
    pageUrl: "",
    pageFavicon: "",
    // user settings
    hiddenHosts: []
  };

  // extension/js/fab/api.js
  var _cleanupFn = null;
  function registerCleanup(fn) {
    _cleanupFn = fn;
  }
  function isExtensionContextValid() {
    try {
      return Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  }
  function isInvalidExtensionContextError(error) {
    return String(error?.message || error).toLowerCase().includes("extension context invalidated");
  }
  function ensureLiveExtensionContext() {
    if (isExtensionContextValid()) return true;
    _cleanupFn?.();
    return false;
  }
  function sendMessage(message) {
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
            const payload = response?.error && typeof response.error === "object" ? response.error : { message: response?.error || "Request failed" };
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
  async function safeStorageLocalSet(value) {
    if (!ensureLiveExtensionContext()) return;
    try {
      await chrome.storage.local.set(value);
    } catch (error) {
      if (isInvalidExtensionContextError(error)) _cleanupFn?.();
    }
  }
  function msgGetGroups() {
    return sendMessage({ type: "rewayAccessGetGroups" });
  }
  function msgGetGroupBookmarks(groupId) {
    return sendMessage({ type: "rewayAccessGetGroupBookmarks", groupId: groupId || NO_GROUP_ID });
  }
  function msgSearchBookmarks(query, limit = 20) {
    return sendMessage({ type: "rewayAccessSearchBookmarks", query, limit });
  }
  function msgOpenBookmark(url, bookmarkId) {
    return sendMessage({ type: "rewayAccessOpenBookmark", url, bookmarkId });
  }
  function msgOpenGroup(groupId, urls) {
    return sendMessage({ type: "rewayAccessOpenGroup", groupId, urls });
  }
  function msgSaveBookmark(payload) {
    return sendMessage({ type: "rewayAccessSaveBookmark", ...payload });
  }
  function msgGetDashboardUrl() {
    return sendMessage({ type: "rewayAccessGetDashboardUrl" });
  }

  // extension/js/fab/utils.js
  function isHttpUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }
  function safeDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }
  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  // extension/js/fab/icons.js
  var DEFAULT_GROUP_COLOR = "#a7adb6";
  var groupIconManifest = globalThis.REWAY_GROUP_ICON_MANIFEST || null;
  var groupIconManifestPromise = null;
  async function ensureGroupIconManifest() {
    if (groupIconManifest) return groupIconManifest;
    if (groupIconManifestPromise) return groupIconManifestPromise;
    groupIconManifestPromise = loadGroupIconManifest();
    groupIconManifest = await groupIconManifestPromise;
    return groupIconManifest;
  }
  async function loadGroupIconManifest() {
    try {
      const text = await fetch(chrome.runtime.getURL(GROUP_ICON_MANIFEST_PATH)).then(
        (r) => r.text()
      );
      const start = text.indexOf(GROUP_ICON_MANIFEST_ASSIGNMENT);
      const end = text.lastIndexOf(";");
      if (start === -1 || end === -1 || end <= start) return {};
      return JSON.parse(text.slice(start + GROUP_ICON_MANIFEST_ASSIGNMENT.length, end));
    } catch {
      return {};
    }
  }
  function renderGroupIconChip(group) {
    const entry = groupIconManifest?.[group.icon] || groupIconManifest?.fallback || null;
    const svg = entry ? renderGroupSvg(entry) : `<span class="group-icon-dot"></span>`;
    return `<span class="group-icon" style="--group-color:${escapeAttribute(group.color)}">${svg}</span>`;
  }
  function renderGroupSvg(entry) {
    const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
    return `<svg class="group-icon-svg" viewBox="${escapeAttribute(entry.viewBox || "0 0 24 24")}" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true">${nodes.map(renderSvgNode).join("")}</svg>`;
  }
  function renderSvgNode(node) {
    if (!node || typeof node.tag !== "string" || !node.attrs) return "";
    return `<${node.tag}${renderSvgAttrs(node.attrs)}></${node.tag}>`;
  }
  function renderSvgAttrs(attrs) {
    return Object.entries(attrs).map(([k, v]) => ` ${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${escapeAttribute(String(v))}"`).join("");
  }
  function normalizeGroups(groups) {
    const items = Array.isArray(groups) ? groups : [];
    const regular = items.filter((g) => g?.id && g.show_in_fab !== false).map((g) => ({
      id: String(g.id),
      name: String(g.name || "Untitled group"),
      color: g.color || DEFAULT_GROUP_COLOR,
      icon: typeof g.icon === "string" ? g.icon : ""
    }));
    return [
      ...regular,
      { id: NO_GROUP_ID, name: "No Group", color: DEFAULT_GROUP_COLOR, icon: "folder" }
    ];
  }
  function normalizeBookmarks(bookmarks) {
    return (Array.isArray(bookmarks) ? bookmarks : []).map((b) => ({
      id: String(b.id || ""),
      title: String(b.title || b.url || "Untitled bookmark"),
      url: String(b.url || ""),
      domain: String(b.domain || safeDomain(b.url) || ""),
      faviconCandidates: buildFaviconCandidates(b)
    })).filter((b) => isHttpUrl(b.url));
  }
  function buildFaviconCandidates(bookmark) {
    const primary = normalizeFaviconUrl(bookmark.favicon_url || bookmark.faviconUrl);
    const domain = safeDomain(bookmark.url);
    const candidates = primary ? [primary] : [];
    if (isPublicFaviconDomain(domain)) {
      candidates.push(
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
      );
    }
    return [...new Set(candidates)];
  }
  function normalizeFaviconUrl(url) {
    if (!url || typeof url !== "string") return "";
    const v = url.trim();
    if (v.startsWith("data:image/")) return v;
    try {
      const { protocol } = new URL(v);
      return protocol === "http:" || protocol === "https:" ? v : "";
    } catch {
      return "";
    }
  }
  function isPublicFaviconDomain(domain) {
    if (!domain) return false;
    const d = domain.toLowerCase();
    if (!d.includes(".") || d.includes(":") || d === "localhost" || d.endsWith(".local") || d.endsWith(".internal")) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) {
      const [a, b] = d.split(".").map(Number);
      if (a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168) return false;
    }
    return true;
  }
  function renderFavicon(bookmark) {
    if (!bookmark.faviconCandidates?.length) return createFaviconFallbackMarkup(bookmark);
    return `<img class="bookmark-favicon" src="${escapeAttribute(bookmark.faviconCandidates[0])}" alt="" width="20" height="20" loading="lazy" decoding="async" />`;
  }
  function attachFaviconFallback(image, bookmark) {
    const candidates = bookmark.faviconCandidates || [];
    let idx = 0;
    image.addEventListener("error", () => {
      idx += 1;
      if (idx < candidates.length) {
        image.src = candidates[idx];
      } else {
        image.replaceWith(createFaviconFallback(bookmark));
      }
    });
  }
  function createFaviconFallback(bookmark) {
    const el = document.createElement("span");
    el.className = "bookmark-fallback";
    el.textContent = getFallbackLetter(bookmark);
    el.style.setProperty("--bookmark-fallback-bg", getFallbackColor(bookmark.domain || bookmark.url));
    return el;
  }
  function createFaviconFallbackMarkup(bookmark) {
    return `<span class="bookmark-fallback" style="--bookmark-fallback-bg:${escapeAttribute(getFallbackColor(bookmark.domain || bookmark.url))}">${escapeHtml(getFallbackLetter(bookmark))}</span>`;
  }
  function getFallbackLetter(bookmark) {
    return (bookmark.domain || bookmark.title || "?").charAt(0).toUpperCase();
  }
  function getFallbackColor(seed) {
    const v = String(seed || "?");
    let h = 0;
    for (let i = 0; i < v.length; i++) h = h * 31 + v.charCodeAt(i) >>> 0;
    return `hsl(${h % 360} 34% 34%)`;
  }

  // extension/js/fab/drag.js
  var DRAG_THRESHOLD_PX = 6;
  var dragState = null;
  var dragFrame = 0;
  function startDrag(event, fabEl, onCornerChange) {
    if (event.button !== 0) return;
    event.preventDefault();
    fabEl.setPointerCapture(event.pointerId);
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      onCornerChange
    };
    fabEl.addEventListener("pointermove", onMove);
    fabEl.addEventListener("pointerup", (e) => onEnd(e, fabEl), { once: true });
    fabEl.addEventListener("pointercancel", (e) => onEnd(e, fabEl), { once: true });
  }
  function cornerToPosition(corner) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = EDGE_MARGIN;
    const s = FAB_SIZE;
    const positions = {
      "bottom-right": { x: vw - s - m, y: vh - s - m },
      "bottom-left": { x: m, y: vh - s - m },
      "top-right": { x: vw - s - m, y: m },
      "top-left": { x: m, y: m }
    };
    return positions[corner] ?? positions[DEFAULT_CORNER];
  }
  function applyCorner(corner, rootEl) {
    const { x, y } = cornerToPosition(corner);
    rootEl.style.left = `${x}px`;
    rootEl.style.top = `${y}px`;
  }
  function onMove(event) {
    if (!dragState) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragState.moved = true;
    const fabEl = event.currentTarget;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = requestAnimationFrame(() => {
      const x = Math.max(EDGE_MARGIN, Math.min(window.innerWidth - FAB_SIZE - EDGE_MARGIN, event.clientX - FAB_SIZE / 2));
      const y = Math.max(EDGE_MARGIN, Math.min(window.innerHeight - FAB_SIZE - EDGE_MARGIN, event.clientY - FAB_SIZE / 2));
      const root = fabEl.closest(".root") ?? fabEl.parentElement;
      if (root) {
        root.style.left = `${x}px`;
        root.style.top = `${y}px`;
      }
      dragFrame = 0;
    });
  }
  function onEnd(event, fabEl) {
    fabEl.removeEventListener("pointermove", onMove);
    if (dragFrame) {
      cancelAnimationFrame(dragFrame);
      dragFrame = 0;
    }
    if (!dragState) return;
    const wasDrag = dragState.moved;
    const onCornerChange = dragState.onCornerChange;
    dragState = null;
    if (!wasDrag) return;
    const corner = nearestCorner(event.clientX, event.clientY);
    void safeStorageLocalSet({ rewayAccessFabCorner: corner });
    onCornerChange(corner);
  }
  function nearestCorner(x, y) {
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;
    return `${y >= midY ? "bottom" : "top"}-${x >= midX ? "right" : "left"}`;
  }

  // extension/js/fab/render.js
  function _ico(paths) {
    return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">${paths}</svg>`;
  }
  var SVG_PIN = _ico(`<path d="M3 21L8 16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M13.2585 18.8714C9.51516 18.0215 5.97844 14.4848 5.12853 10.7415C4.99399 10.1489 4.92672 9.85266 5.12161 9.37197C5.3165 8.89129 5.55457 8.74255 6.03071 8.44509C7.10705 7.77265 8.27254 7.55888 9.48209 7.66586C11.1793 7.81598 12.0279 7.89104 12.4512 7.67048C12.8746 7.44991 13.1622 6.93417 13.7376 5.90269L14.4664 4.59604C14.9465 3.73528 15.1866 3.3049 15.7513 3.10202C16.316 2.89913 16.6558 3.02199 17.3355 3.26771C18.9249 3.84236 20.1576 5.07505 20.7323 6.66449C20.978 7.34417 21.1009 7.68401 20.898 8.2487C20.6951 8.8134 20.2647 9.05346 19.4039 9.53358L18.0672 10.2792C17.0376 10.8534 16.5229 11.1406 16.3024 11.568C16.0819 11.9955 16.162 12.8256 16.3221 14.4859C16.4399 15.7068 16.2369 16.88 15.5555 17.9697C15.2577 18.4458 15.1088 18.6839 14.6283 18.8786C14.1477 19.0733 13.8513 19.006 13.2585 18.8714Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_CHEVRON_R = _ico(`<path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_CHEVRON_L = _ico(`<path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_UNFOLD_MORE = _ico(`<path d="M18 14C18 14 13.5811 19 12 19C10.4188 19 6 14 6 14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M18 9.99996C18 9.99996 13.5811 5.00001 12 5C10.4188 4.99999 6 10 6 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_UNFOLD_LESS = _ico(`<path d="M18 19C18 19 13.5811 14 12 14C10.4188 14 6 19 6 19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M18 5.00004C18 5.00004 13.5811 9.99999 12 10C10.4188 10 6 5 6 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_BOOKMARK = _ico(`<path d="M4 17.9808V9.70753C4 6.07416 4 4.25748 5.17157 3.12874C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.12874C20 4.25748 20 6.07416 20 9.70753V17.9808C20 20.2867 20 21.4396 19.2272 21.8523C17.7305 22.6514 14.9232 19.9852 13.59 19.1824C12.8168 18.7168 12.4302 18.484 12 18.484C11.5698 18.484 11.1832 18.7168 10.41 19.1824C9.0768 19.9852 6.26947 22.6514 4.77285 21.8523C4 21.4396 4 20.2867 4 17.9808Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_MORE = _ico(`<path d="M6.00449 12.5V12M18.0045 12.5V12M12.0045 12.5V12M7.00449 12.5C7.00449 11.9477 6.55677 11.5 6.00449 11.5C5.4522 11.5 5.00449 11.9477 5.00449 12.5C5.00449 13.0523 5.4522 13.5 6.00449 13.5C6.55677 13.5 7.00449 13.0523 7.00449 12.5ZM19.0045 12.5C19.0045 11.9477 18.5568 11.5 18.0045 11.5C17.4522 11.5 17.0045 11.9477 17.0045 12.5C17.0045 13.0523 17.4522 13.5 18.0045 13.5C18.5568 13.5 19.0045 13.0523 19.0045 12.5ZM13.0045 12.5C13.0045 11.9477 12.5568 11.5 12.0045 11.5C11.4522 11.5 11.0045 11.9477 11.0045 12.5C11.0045 13.0523 11.4522 13.5 12.0045 13.5C12.5568 13.5 13.0045 13.0523 13.0045 12.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var SVG_CHECK = _ico(`<path d="M5 14.5C5 14.5 6.5 14.5 8.5 18C8.5 18 14.0588 8.83333 19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
  var _refs = {};
  function setRefs(refs2) {
    _refs = refs2;
  }
  function renderPanel() {
    if (!_refs.strip || !_refs.body) return;
    _refs.strip.innerHTML = stripHtml();
    _refs.body.innerHTML = bodyHtml();
    _refs.body.querySelectorAll("[data-bookmark-idx]").forEach((row) => {
      const img = row.querySelector(".bookmark-favicon");
      if (!img) return;
      const idx = Number(row.dataset.bookmarkIdx);
      const bookmarks = activeBookmarkList();
      if (bookmarks[idx]) attachFaviconFallback(img, bookmarks[idx]);
    });
    const nameInput = _refs.strip.querySelector(".session-name");
    if (nameInput && state.stripMode === STRIP.SESSION) {
      nameInput.value = state.sessionName;
      nameInput.select();
    }
    const inDrillIn = state.view === VIEW.DRILL_IN;
    _refs.strip?.classList.toggle("is-hidden", inDrillIn);
    _refs.searchWrap?.classList.toggle("is-hidden", inDrillIn || state.pickerMode);
    _refs.footer?.classList.toggle("is-hidden", inDrillIn);
  }
  function activeBookmarkList() {
    if (state.view === VIEW.DRILL_IN && state.activeGroupId) {
      return state.bookmarksByGroup.get(state.activeGroupId) || [];
    }
    if (state.view === VIEW.SEARCH) return state.searchResults.bookmarks || [];
    return [];
  }
  function stripHtml() {
    if (state.stripMode === STRIP.SESSION) return sessionStripHtml();
    if (state.stripMode === STRIP.SUCCESS) return successStripHtml();
    return pageStripHtml();
  }
  function pageStripHtml() {
    const chipLabel = state.lastGroupName ? escapeHtml(state.lastGroupName) : "Pick a group";
    const pickerIcon = state.pickerMode ? SVG_UNFOLD_LESS : SVG_UNFOLD_MORE;
    const sessionLine = state.sessionTabCount >= 2 ? `<button class="session-micro" data-action="session-mode">or save ${state.sessionTabCount} open tabs as a session \u2192</button>` : "";
    return `
    <div class="page-context">
      <span class="page-title">${escapeHtml(state.pageTitle || "This page")}</span>
    </div>
    <div class="cta-row">
      <button class="save-cta" data-action="save" data-group-id="${escapeAttribute(state.lastGroupId || "")}">
        <span class="cta-icon" aria-hidden="true">${SVG_BOOKMARK}</span>
        <span class="cta-label">Save</span>
      </button>
      <button class="group-chip${state.pickerMode ? " is-active" : ""}" data-action="open-picker" aria-label="Change destination group">
        <span class="group-chip-name">${chipLabel}</span>
        ${pickerIcon}
      </button>
    </div>
    ${sessionLine}`;
  }
  function sessionStripHtml() {
    const chipLabel = state.lastGroupName ? escapeHtml(state.lastGroupName) : "Pick a group";
    const pickerIcon = state.pickerMode ? SVG_UNFOLD_LESS : SVG_UNFOLD_MORE;
    return `
    <div class="strip-nav">
      <button class="back-btn" data-action="back" aria-label="Back to page save">${SVG_CHEVRON_L}</button>
      <span class="strip-nav-title">Save as session</span>
    </div>
    <input class="session-name" type="text" placeholder="Session name" aria-label="Session name" />
    <div class="cta-row">
      <button class="save-cta" data-action="save-session" data-group-id="${escapeAttribute(state.lastGroupId || "")}">
        <span class="cta-icon" aria-hidden="true">${SVG_BOOKMARK}</span>
        <span class="cta-label">Save</span>
      </button>
      <button class="group-chip${state.pickerMode ? " is-active" : ""}" data-action="open-picker" aria-label="Change destination group">
        <span class="group-chip-name">${chipLabel}</span>
        ${pickerIcon}
      </button>
    </div>`;
  }
  function successStripHtml() {
    const bm = state.successBookmark;
    const groupLabel = bm?.groupName ? escapeHtml(bm.groupName) : "group";
    return `
    <div class="page-context">
      <span class="page-title">${escapeHtml(state.pageTitle || "This page")}</span>
    </div>
    <div class="save-cta save-cta--success" role="status" aria-live="polite">
      <span class="cta-icon cta-check" aria-hidden="true">${SVG_CHECK}</span>
      <span class="cta-label">Saved to ${groupLabel}</span>
    </div>
    <div class="success-row">
      <button class="save-again-btn" data-action="save-again">Also save to another group</button>
    </div>`;
  }
  function bodyHtml() {
    if (state.pickerMode) return pickerHtml();
    if (state.view === VIEW.DRILL_IN) return drillInHtml();
    if (state.view === VIEW.SEARCH) return searchResultsHtml();
    return groupsHtml();
  }
  function groupsHtml() {
    const { groupsStatus: s, groups, pinnedGroupIds, recentGroupIds } = state;
    if (s === "idle" || s === "loading") return skeletonHtml(5);
    if (s === "auth") return stateCardHtml("Sign in to Reway", "Your session has expired.", "Sign in", "auth");
    if (s === "error") return stateCardHtml("Couldn't load groups", "Check your connection and try again.", "Retry", "retry-groups");
    const pinned = groups.filter((g) => pinnedGroupIds.has(g.id));
    const recent = recentGroupIds.map((id) => groups.find((g) => !pinnedGroupIds.has(g.id) && g.id === id)).filter(Boolean);
    const recentSet = new Set(recent.map((g) => g.id));
    const rest = groups.filter((g) => !pinnedGroupIds.has(g.id) && !recentSet.has(g.id));
    const sections = [];
    if (pinned.length) sections.push(sectionHtml("Pinned", pinned.map((g) => groupRowHtml(g, true))));
    if (recent.length) sections.push(sectionHtml("Recently saved", recent.map((g) => groupRowHtml(g, false))));
    if (rest.length) {
      const sep = pinned.length || recent.length ? `<div class="groups-separator" role="separator"></div>` : "";
      sections.push(sep + rest.map((g) => groupRowHtml(g, false)).join(""));
    }
    return `<div class="groups-list">${sections.join("")}</div>`;
  }
  function sectionHtml(label, rowHtmls) {
    return `<div class="group-section"><div class="section-label">${escapeHtml(label)}</div>${rowHtmls.join("")}</div>`;
  }
  function groupRowHtml(group, isPinned) {
    const pin = `<button class="pin-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-group-id="${escapeAttribute(group.id)}" aria-label="${isPinned ? "Unpin" : "Pin"} ${escapeAttribute(group.name)}" aria-pressed="${isPinned}">${SVG_PIN}</button>`;
    return `<div class="group-row" role="button" tabindex="0" data-action="drill-in" data-group-id="${escapeAttribute(group.id)}">${renderGroupIconChip(group)}<span class="group-name-wrap group-name-wrap--has-pin"><span class="group-name">${escapeHtml(group.name)}</span>${pin}</span><span class="drill-chevron" aria-hidden="true">${SVG_CHEVRON_R}</span></div>`;
  }
  function pickerHtml() {
    const { groups, pickerSelectedIds } = state;
    const count = pickerSelectedIds.size;
    const rows = groups.map((g) => {
      const isSelected = pickerSelectedIds.has(g.id);
      return `<div class="group-row group-row--picker${isSelected ? " is-selected" : ""}" role="checkbox" aria-checked="${isSelected}" tabindex="0" data-action="toggle-pick-group" data-group-id="${escapeAttribute(g.id)}">${renderGroupIconChip(g)}<span class="group-name">${escapeHtml(g.name)}</span>${isSelected ? `<span class="pick-check" aria-hidden="true">${SVG_CHECK}</span>` : ""}</div>`;
    });
    const ctaLabel = count === 0 ? "Select a group" : count === 1 ? "Save to 1 group" : `Save to ${count} groups`;
    return `<div class="picker-wrap"><div class="groups-list">${rows.join("")}</div><div class="picker-footer"><button class="picker-cta"${count === 0 ? " disabled" : ""} data-action="confirm-multi-pick">${ctaLabel}</button></div></div>`;
  }
  function drillInHtml() {
    const group = state.groups.find((g) => g.activeGroupId === state.activeGroupId) ?? state.groups.find((g) => g.id === state.activeGroupId);
    const groupLabel = group ? escapeHtml(group.name) : "";
    const groupIcon = group ? renderGroupIconChip(group) : "";
    const bms = state.bookmarksByGroup.get(state.activeGroupId) || [];
    const bmsStatus = state.bookmarksStatusByGroup.get(state.activeGroupId) || "idle";
    let listHtml;
    if (bmsStatus === "idle" || bmsStatus === "loading") listHtml = skeletonHtml(5);
    else if (bmsStatus === "auth") listHtml = stateCardHtml("Session expired", "", "Sign in", "auth");
    else if (bmsStatus === "error") listHtml = stateCardHtml("Couldn't load bookmarks", "", "Retry", `retry-bookmarks:${state.activeGroupId}`);
    else if (!bms.length) listHtml = stateCardHtml("No bookmarks yet", "Save this page here to get started.", "", "");
    else listHtml = `<div class="bookmarks-list">${bms.map(bookmarkRowHtml).join("")}</div>`;
    const isActionsOpen = state.groupActionsOpen;
    const header = `<div class="drill-header"><button class="back-btn" data-action="back" aria-label="Back to groups">${SVG_CHEVRON_L}</button>${groupIcon}<span class="drill-group-name">${groupLabel}</span><button class="dots-btn${isActionsOpen ? " is-active" : ""}" data-action="group-actions" data-group-id="${escapeAttribute(state.activeGroupId || "")}" aria-label="Group actions" aria-expanded="${isActionsOpen}">${SVG_MORE}</button></div>`;
    const groupActionsPanel = isActionsOpen ? groupActionsPanelHtml(state.activeGroupId) : "";
    const drillSearch = `<div class="drill-search-wrap"><input class="drill-search" type="search" placeholder="Search bookmarks\u2026" aria-label="Search in group" autocomplete="off" spellcheck="false" /></div>`;
    let pageShortName = "this page";
    if (state.pageTitle) {
      const base = state.pageTitle.split(/\s+-\s+|[|—·•]/)[0].trim() || state.pageTitle;
      pageShortName = base.length > 25 ? base.slice(0, 23) + "\u2026" : base;
    } else {
      try {
        pageShortName = new URL(state.pageUrl).hostname.replace(/^www\./, "");
      } catch {
      }
    }
    const footer = `<div class="drill-footer"><button class="save-here-btn" data-action="save-here" data-group-id="${escapeAttribute(state.activeGroupId || "")}">+ Save ${escapeHtml(pageShortName)} here</button></div>`;
    return header + groupActionsPanel + drillSearch + listHtml + footer;
  }
  function groupActionsPanelHtml(groupId) {
    const bms = state.bookmarksByGroup.get(groupId) || [];
    const count = bms.length;
    if (!count) return "";
    return `<div class="group-actions-panel"><button class="group-actions-item" data-action="open-all-tabs" data-group-id="${escapeAttribute(groupId)}">Open all ${count} tab${count !== 1 ? "s" : ""}</button></div>`;
  }
  function bookmarkRowHtml(bookmark, idx) {
    return `<div class="bookmark-row" role="button" tabindex="0" data-action="open-bookmark" data-url="${escapeAttribute(bookmark.url)}" data-bookmark-id="${escapeAttribute(bookmark.id)}" data-bookmark-idx="${idx}">${renderFavicon(bookmark)}<span class="bookmark-info"><span class="bookmark-title">${escapeHtml(bookmark.title)}</span><span class="bookmark-domain">${escapeHtml(bookmark.domain)}</span></span></div>`;
  }
  function searchResultsHtml() {
    const { searchStatus, searchResults } = state;
    if (searchStatus === "loading") return skeletonHtml(4);
    if (!searchResults.groups?.length && !searchResults.bookmarks?.length) {
      return stateCardHtml("No results", `Nothing matched "${escapeHtml(state.searchQuery)}"`, "", "");
    }
    const groupRows = (searchResults.groups || []).map((g) => `<div class="group-row" role="button" tabindex="0" data-action="drill-in" data-group-id="${escapeAttribute(g.id)}">${renderGroupIconChip(g)}<span class="group-name-wrap"><span class="group-name">${escapeHtml(g.name)}</span></span><span class="drill-chevron" aria-hidden="true">${SVG_CHEVRON_R}</span></div>`).join("");
    const bmRows = (searchResults.bookmarks || []).map((b, i) => bookmarkRowHtml(b, i)).join("");
    return (groupRows ? `<div class="results-section"><div class="results-label">Groups</div>${groupRows}</div>` : "") + (bmRows ? `<div class="results-section"><div class="results-label">Bookmarks</div>${bmRows}</div>` : "");
  }
  function skeletonHtml(n) {
    return `<div class="skeleton-list">${Array.from(
      { length: n },
      () => `<div class="skeleton-row"><span class="skeleton skeleton-icon"></span><span class="skeleton skeleton-text"></span></div>`
    ).join("")}</div>`;
  }
  function stateCardHtml(title, copy, actionLabel, actionKey) {
    const btn = actionLabel ? `<button class="state-action" data-action="${escapeAttribute(actionKey)}">${escapeHtml(actionLabel)}</button>` : "";
    return `<div class="state-card"><div class="state-title">${escapeHtml(title)}</div>${copy ? `<div class="state-copy">${escapeHtml(copy)}</div>` : ""}${btn}</div>`;
  }

  // extension/access-content-script.js
  var LOGO_SVG = `<svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="256" fill="oklch(0.22 0 0)"/><g transform="matrix(12.135672 0 0 12.135672 110.37194 110.37192)"><path fill="#fff" d="M4 17.98V9.71C4 6.07 4 4.26 5.17 3.13 6.34 2 8.23 2 12 2c3.77 0 5.66 0 6.83 1.13C20 4.26 20 6.07 20 9.71v8.27c0 2.31 0 3.46-.77 3.87-1.5.8-4.31-1.87-5.64-2.67C12.82 18.72 12.43 18.48 12 18.48c-.43 0-.82.24-1.59.7C9.08 19.99 6.27 22.66 4.77 21.86 4 21.44 4 20.29 4 17.98Z"/></g></svg>`;
  var host;
  var shadow;
  var refs = {};
  var searchTimer = 0;
  var successTimer = 0;
  var lifecycleController = null;
  if (!document.getElementById(ROOT_ID) && isEligiblePage()) void boot();
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session" && area !== "local" || !changes[ACCESS_COMMAND_KEY]) return;
    const cmd = changes[ACCESS_COMMAND_KEY].newValue;
    if (cmd?.action === "open-quick-access" && document.hasFocus()) togglePanel();
  });
  async function boot() {
    if (!ensureLiveExtensionContext()) return;
    const stored = await chrome.storage.local.get([
      "rewayAccessFabEnabled",
      "rewayAccessFabHiddenHosts",
      "rewayAccessLastGroup",
      "rewayAccessLastGroupName",
      "rewayAccessPinnedGroups",
      "rewayAccessFabCorner",
      "rewayAccessRecentGroups"
    ]);
    if (stored.rewayAccessFabEnabled === false) return;
    const hiddenHosts = Array.isArray(stored.rewayAccessFabHiddenHosts) ? stored.rewayAccessFabHiddenHosts : [];
    if (hiddenHosts.some((h) => h.toLowerCase() === location.hostname.toLowerCase())) return;
    state.fabCorner = stored.rewayAccessFabCorner ?? DEFAULT_CORNER;
    state.lastGroupId = stored.rewayAccessLastGroup ?? null;
    state.lastGroupName = stored.rewayAccessLastGroupName ?? "";
    state.pinnedGroupIds = new Set(Array.isArray(stored.rewayAccessPinnedGroups) ? stored.rewayAccessPinnedGroups : []);
    state.recentGroupIds = Array.isArray(stored.rewayAccessRecentGroups) ? stored.rewayAccessRecentGroups : [];
    state.pageTitle = document.title;
    state.pageUrl = location.href;
    state.sessionTabCount = await getHttpTabCount();
    inject();
    await applyStyles();
    applyCorner(state.fabCorner, refs.root);
    host.style.removeProperty("display");
    registerCleanup(cleanupFab);
    setRefs(refs);
    bindEvents();
    void loadGroups();
  }
  function isEligiblePage() {
    if (location.protocol !== "http:" && location.protocol !== "https:") return false;
    const rewayOrigins = ["https://reway.page", "https://www.reway.page", "http://localhost:3000", "http://localhost:3001"];
    if (rewayOrigins.some((o) => location.origin === o)) return false;
    return window.matchMedia("(hover:hover) and (pointer:fine)").matches && window.innerWidth >= MIN_VIEWPORT_WIDTH && window.innerHeight >= MIN_VIEWPORT_HEIGHT;
  }
  async function getHttpTabCount() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs.filter((t) => t.url?.startsWith("http")).length;
    } catch {
      return 0;
    }
  }
  function inject() {
    host = document.createElement("div");
    host.id = ROOT_ID;
    host.style.setProperty("display", "none", "important");
    document.documentElement.append(host);
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
    <div class="root" data-corner="${state.fabCorner}">
      <button class="fab" type="button" aria-label="Open Reway" aria-haspopup="dialog" aria-expanded="false" aria-controls="${PANEL_ID}">
        ${LOGO_SVG}
      </button>
      <div class="panel" id="${PANEL_ID}" role="dialog" aria-modal="false" aria-label="Reway">
        <div class="strip"></div>
        <div class="search-wrap">
          <input class="search-input" type="search" placeholder="Search groups and links\u2026" aria-label="Search" autocomplete="off" spellcheck="false" />
        </div>
        <div class="panel-body"></div>
        <div class="panel-footer">
          <button class="manage-link" data-action="manage-library">Manage library \u2192</button>
        </div>
      </div>
    </div>`;
    refs = {
      root: shadow.querySelector(".root"),
      fab: shadow.querySelector(".fab"),
      panel: shadow.querySelector(".panel"),
      strip: shadow.querySelector(".strip"),
      searchWrap: shadow.querySelector(".search-wrap"),
      search: shadow.querySelector(".search-input"),
      body: shadow.querySelector(".panel-body"),
      footer: shadow.querySelector(".panel-footer")
    };
  }
  async function applyStyles() {
    const style = document.createElement("style");
    try {
      style.textContent = await fetch(chrome.runtime.getURL("access-content.css")).then((r) => r.text());
    } catch {
      style.textContent = `.root{position:fixed;z-index:2147483647}.fab{width:${FAB_SIZE}px;height:${FAB_SIZE}px;border-radius:999px}`;
    }
    shadow?.prepend(style);
  }
  function bindEvents() {
    lifecycleController?.abort();
    lifecycleController = new AbortController();
    const { signal } = lifecycleController;
    window.addEventListener("keydown", handleKeyDown, { capture: true, signal });
    refs.fab.addEventListener("pointerdown", (e) => startDrag(e, refs.fab, onCornerSnap), { signal });
    refs.fab.addEventListener("click", togglePanel, { signal });
    refs.search.addEventListener("input", handleSearchInput, { signal });
    refs.search.addEventListener("keydown", (e) => e.key === "Escape" && closePanel(), { signal });
    refs.panel.addEventListener("click", handlePanelClick, { signal });
    refs.panel.addEventListener("input", (e) => {
      if (e.target.classList.contains("session-name")) state.sessionName = e.target.value;
      if (e.target.classList.contains("drill-search")) handleDrillSearch(e.target.value);
    }, { signal });
    refs.strip.addEventListener("mouseenter", pauseSuccessTimer, { signal });
    refs.strip.addEventListener("mouseleave", resumeSuccessTimer, { signal });
    document.addEventListener("click", (e) => {
      if (state.panelOpen && !host.contains(e.target)) closePanel();
    }, { capture: true, signal });
    window.addEventListener("resize", () => applyCorner(state.fabCorner, refs.root), { signal });
  }
  function handleKeyDown(e) {
    if (!ensureLiveExtensionContext()) return;
    const isShortcut = e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyR";
    if (isShortcut) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
      return;
    }
    if (e.key === "Escape" && state.panelOpen) {
      e.preventDefault();
      closePanel();
      refs.fab.focus();
    }
  }
  function togglePanel() {
    state.panelOpen ? closePanel() : openPanel();
  }
  function openPanel() {
    state.panelOpen = true;
    state.stripMode = STRIP.PAGE;
    state.pickerMode = false;
    state.view = VIEW.GROUPS;
    state.searchQuery = "";
    refs.search.value = "";
    refs.root.dataset.corner = state.fabCorner;
    refs.fab.setAttribute("aria-expanded", "true");
    refs.panel.dataset.open = "true";
    renderPanel();
  }
  function closePanel() {
    state.panelOpen = false;
    state.view = VIEW.GROUPS;
    state.activeGroupId = null;
    state.pickerMode = false;
    state.groupActionsOpen = false;
    state.searchQuery = "";
    clearTimeout(searchTimer);
    clearTimeout(successTimer);
    refs.fab.setAttribute("aria-expanded", "false");
    delete refs.panel.dataset.open;
  }
  function handlePanelClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const { action } = target.dataset;
    if (action === "save") void doSave(target.dataset.groupId);
    else if (action === "save-session") void doSaveSession(target.dataset.groupId);
    else if (action === "save-here") void doSaveAndReturn(target.dataset.groupId);
    else if (action === "open-picker") openPicker();
    else if (action === "toggle-pick-group") togglePickGroup(target.dataset.groupId);
    else if (action === "confirm-multi-pick") void confirmMultiPick();
    else if (action === "drill-in") drillIn(target.dataset.groupId);
    else if (action === "back") navigateBack();
    else if (action === "toggle-pin") togglePin(target.dataset.groupId);
    else if (action === "session-mode") enterSessionMode();
    else if (action === "undo") void doUndo();
    else if (action === "save-again") {
      state.pickerReturnTo = STRIP.SUCCESS;
      openPicker();
    } else if (action === "view-saved") drillIn(target.dataset.groupId);
    else if (action === "open-bookmark") void msgOpenBookmark(target.dataset.url, target.dataset.bookmarkId);
    else if (action === "group-actions") showGroupActions(target.dataset.groupId);
    else if (action === "open-all-tabs") openAllTabs(target.dataset.groupId);
    else if (action === "manage-library") void openDashboard();
    else if (action === "auth") void openDashboard();
    else if (action === "retry-groups") void loadGroups();
    else if (action?.startsWith("retry-bookmarks:")) void loadBookmarks(action.slice(16));
  }
  async function doSave(groupId) {
    const gid = groupId || state.lastGroupId || null;
    const group = state.groups.find((g) => g.id === gid);
    state.stripMode = STRIP.SUCCESS;
    state.successBookmark = { id: null, url: state.pageUrl, groupId: gid, groupName: group?.name ?? "" };
    renderPanel();
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      state.stripMode = STRIP.PAGE;
      renderPanel();
    }, SUCCESS_RESET_MS);
    try {
      const res = await msgSaveBookmark({ url: state.pageUrl, title: state.pageTitle, groupId: gid });
      if (res?.bookmark?.id) state.successBookmark.id = res.bookmark.id;
      if (res?.bookmark && gid) {
        const normalized = normalizeBookmarks([res.bookmark]);
        if (normalized.length) {
          const existing = state.bookmarksByGroup.get(gid) || [];
          state.bookmarksByGroup.set(gid, [normalized[0], ...existing]);
          state.bookmarksStatusByGroup.set(gid, "ready");
        }
      }
      if (gid && group) {
        state.lastGroupId = gid;
        state.lastGroupName = group.name;
        const recent = [gid, ...state.recentGroupIds.filter((id) => id !== gid)].slice(0, 3);
        state.recentGroupIds = recent;
        void safeStorageLocalSet({ rewayAccessLastGroup: gid, rewayAccessLastGroupName: group.name, rewayAccessRecentGroups: recent });
      }
    } catch {
      clearTimeout(successTimer);
      state.stripMode = STRIP.PAGE;
      renderPanel();
    }
  }
  async function doSaveAndReturn(groupId) {
    state.view = VIEW.GROUPS;
    state.activeGroupId = null;
    state.groupActionsOpen = false;
    await doSave(groupId);
  }
  async function doSaveSession(groupId) {
    const name = state.sessionName.trim() || state.sessionName;
    if (!name) return;
    await doSave(groupId);
  }
  async function doUndo() {
    const bm = state.successBookmark;
    if (!bm?.id) {
      state.stripMode = STRIP.PAGE;
      renderPanel();
      return;
    }
    clearTimeout(successTimer);
    state.stripMode = STRIP.PAGE;
    renderPanel();
    try {
      await sendMessage({ type: "rewayAccessDeleteBookmark", bookmarkId: bm.id });
    } catch {
    }
  }
  function pauseSuccessTimer() {
    clearTimeout(successTimer);
  }
  function resumeSuccessTimer() {
    if (state.stripMode !== STRIP.SUCCESS || state.pickerMode) return;
    clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      state.stripMode = STRIP.PAGE;
      renderPanel();
    }, SUCCESS_RESET_MS);
  }
  function openPicker() {
    if (state.pickerMode) {
      state.pickerMode = false;
      state.pickerSelectedIds = /* @__PURE__ */ new Set();
      state.pickerReturnTo = STRIP.PAGE;
      resumeSuccessTimer();
    } else {
      state.pickerMode = true;
      state.pickerSelectedIds = /* @__PURE__ */ new Set();
      pauseSuccessTimer();
    }
    renderPanel();
  }
  function togglePickGroup(groupId) {
    if (!groupId) return;
    if (state.pickerSelectedIds.has(groupId)) state.pickerSelectedIds.delete(groupId);
    else state.pickerSelectedIds.add(groupId);
    renderPanel();
  }
  async function confirmMultiPick() {
    const selectedIds = [...state.pickerSelectedIds];
    if (!selectedIds.length) return;
    const returnTo = state.pickerReturnTo;
    state.pickerMode = false;
    state.pickerSelectedIds = /* @__PURE__ */ new Set();
    state.pickerReturnTo = STRIP.PAGE;
    if (selectedIds.length === 1) {
      const groupId = selectedIds[0];
      const group = state.groups.find((g) => g.id === groupId);
      if (group && returnTo !== STRIP.SUCCESS) {
        state.lastGroupId = groupId;
        state.lastGroupName = group.name;
      }
      void doSave(groupId);
    } else {
      void doSaveMulti(selectedIds, returnTo);
    }
  }
  async function doSaveMulti(groupIds, returnTo) {
    const groups = groupIds.map((id) => state.groups.find((g) => g.id === id)).filter(Boolean);
    if (!groups.length) return;
    if (returnTo !== STRIP.SUCCESS && groups[0]) {
      state.lastGroupId = groups[0].id;
      state.lastGroupName = groups[0].name;
    }
    state.stripMode = STRIP.SUCCESS;
    state.successBookmark = { id: null, url: state.pageUrl, groupId: groups[0].id, groupName: `${groups.length} groups` };
    resumeSuccessTimer();
    renderPanel();
    await Promise.allSettled(groupIds.map(async (gid) => {
      try {
        const res = await msgSaveBookmark({ url: state.pageUrl, title: state.pageTitle, groupId: gid });
        if (res?.bookmark && gid) {
          const normalized = normalizeBookmarks([res.bookmark]);
          if (normalized.length) {
            const existing = state.bookmarksByGroup.get(gid) || [];
            state.bookmarksByGroup.set(gid, [normalized[0], ...existing]);
            state.bookmarksStatusByGroup.set(gid, "ready");
          }
        }
      } catch {
      }
    }));
    for (const group of [...groups].reverse()) {
      state.recentGroupIds = [group.id, ...state.recentGroupIds.filter((id) => id !== group.id)].slice(0, 3);
    }
    void safeStorageLocalSet({
      rewayAccessLastGroup: state.lastGroupId,
      rewayAccessLastGroupName: state.lastGroupName,
      rewayAccessRecentGroups: state.recentGroupIds
    });
  }
  function drillIn(groupId) {
    state.view = VIEW.DRILL_IN;
    state.activeGroupId = groupId;
    state.groupActionsOpen = false;
    renderPanel();
    if (!state.bookmarksByGroup.has(groupId)) void loadBookmarks(groupId);
  }
  function navigateBack() {
    if (state.view === VIEW.DRILL_IN) {
      state.view = VIEW.GROUPS;
      state.activeGroupId = null;
    } else if (state.stripMode === STRIP.SESSION) state.stripMode = STRIP.PAGE;
    renderPanel();
  }
  function togglePin(groupId) {
    if (state.pinnedGroupIds.has(groupId)) state.pinnedGroupIds.delete(groupId);
    else state.pinnedGroupIds.add(groupId);
    void safeStorageLocalSet({ rewayAccessPinnedGroups: [...state.pinnedGroupIds] });
    renderPanel();
  }
  function enterSessionMode() {
    const autoName = `${document.title}${state.sessionTabCount > 1 ? ` + ${state.sessionTabCount - 1} more` : ""}`;
    state.sessionName = autoName;
    state.stripMode = STRIP.SESSION;
    renderPanel();
  }
  function showGroupActions(groupId) {
    if (state.groupActionsOpen) {
      state.groupActionsOpen = false;
    } else {
      const bms = state.bookmarksByGroup.get(groupId) || [];
      if (!bms.length) return;
      state.groupActionsOpen = true;
    }
    renderPanel();
  }
  function openAllTabs(groupId) {
    const bms = state.bookmarksByGroup.get(groupId) || [];
    state.groupActionsOpen = false;
    renderPanel();
    void msgOpenGroup(groupId, bms.map((b) => b.url));
  }
  async function openDashboard() {
    const res = await msgGetDashboardUrl();
    if (res?.url) await sendMessage({ type: "rewayAccessOpenBookmark", url: res.url });
  }
  function onCornerSnap(corner) {
    state.fabCorner = corner;
    refs.root.dataset.corner = corner;
    applyCorner(corner, refs.root);
  }
  async function loadGroups() {
    state.groupsStatus = "loading";
    renderPanel();
    try {
      const [res] = await Promise.all([msgGetGroups(), ensureGroupIconManifest()]);
      state.groups = normalizeGroups(res?.groups || []);
      state.groupsStatus = "ready";
    } catch (err) {
      state.groupsStatus = err?.code === "AUTH_EXPIRED" ? "auth" : "error";
    }
    renderPanel();
  }
  async function loadBookmarks(groupId) {
    const gid = groupId || NO_GROUP_ID;
    state.bookmarksStatusByGroup.set(gid, "loading");
    renderPanel();
    try {
      const res = await msgGetGroupBookmarks(gid);
      state.bookmarksByGroup.set(gid, normalizeBookmarks(res?.bookmarks || []));
      state.bookmarksStatusByGroup.set(gid, "ready");
    } catch (err) {
      state.bookmarksStatusByGroup.set(gid, err?.code === "AUTH_EXPIRED" ? "auth" : "error");
    }
    if (state.view === VIEW.DRILL_IN && state.activeGroupId === gid) renderPanel();
  }
  function handleSearchInput() {
    const query = refs.search.value.trim();
    state.searchQuery = query;
    clearTimeout(searchTimer);
    if (query.length < 2) {
      state.view = VIEW.GROUPS;
      state.searchStatus = "idle";
      state.searchResults = { groups: [], bookmarks: [] };
      renderPanel();
      return;
    }
    state.view = VIEW.SEARCH;
    state.searchStatus = "loading";
    renderPanel();
    searchTimer = setTimeout(() => void runSearch(query), SEARCH_DEBOUNCE_MS);
  }
  async function runSearch(query) {
    try {
      const res = await msgSearchBookmarks(query);
      if (state.searchQuery !== query) return;
      const bookmarks = normalizeBookmarks(res?.bookmarks || []);
      state.searchResults = {
        groups: state.groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())),
        bookmarks
      };
      state.searchStatus = "ready";
    } catch {
      state.searchStatus = "error";
    }
    renderPanel();
  }
  function handleDrillSearch(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
      renderPanel();
      return;
    }
    const all = state.bookmarksByGroup.get(state.activeGroupId) || [];
    const filtered = all.filter(
      (b) => b.title.toLowerCase().includes(query) || b.domain.toLowerCase().includes(query)
    );
    refs.body.querySelector(".bookmarks-list")?.replaceWith(
      Object.assign(document.createElement("div"), {
        className: "bookmarks-list",
        innerHTML: filtered.map(
          (b, i) => `<div class="bookmark-row" role="button" tabindex="0" data-action="open-bookmark" data-url="${b.url}" data-bookmark-id="${b.id}">${b.title}</div>`
        ).join("")
      })
    );
  }
  function handleRuntimeMessage(message) {
    if (message?.type === "rewayOpenFab") {
      if (!state.panelOpen) togglePanel();
      return;
    }
    if (message?.type === "rewayAccessGroupsUpdated") {
      state.groups = normalizeGroups(message.groups || []);
      state.groupsStatus = "ready";
      renderPanel();
    }
    if (message?.type === "rewayAccessBookmarksUpdated") {
      const gid = message.groupId || NO_GROUP_ID;
      state.bookmarksByGroup.set(gid, normalizeBookmarks(message.bookmarks || []));
      state.bookmarksStatusByGroup.set(gid, "ready");
      if (state.view === VIEW.DRILL_IN && state.activeGroupId === gid) renderPanel();
    }
  }
  function cleanupFab() {
    clearTimeout(searchTimer);
    clearTimeout(successTimer);
    lifecycleController?.abort();
    lifecycleController = null;
    state.panelOpen = false;
    refs = {};
    shadow = null;
    host?.remove();
    host = null;
  }
})();
