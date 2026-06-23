import {
  state, STRIP, VIEW, NO_GROUP_ID,
  ROOT_ID, PANEL_ID, ACCESS_COMMAND_KEY,
  FAB_SIZE, EDGE_MARGIN, MIN_VIEWPORT_WIDTH, MIN_VIEWPORT_HEIGHT,
  SEARCH_DEBOUNCE_MS, SUCCESS_RESET_MS, DEFAULT_CORNER,
} from "./js/fab/state.js";
import {
  registerCleanup, ensureLiveExtensionContext, isInvalidExtensionContextError,
  sendMessage, safeStorageLocalSet,
  msgGetGroups, msgGetGroupBookmarks, msgSearchBookmarks,
  msgOpenBookmark, msgOpenGroup, msgSaveBookmark, msgGetDashboardUrl,
} from "./js/fab/api.js";
import { ensureGroupIconManifest, normalizeGroups, normalizeBookmarks } from "./js/fab/icons.js";
import { startDrag, applyCorner, loadSavedCorner, cornerToPosition } from "./js/fab/drag.js";
import { setRefs, renderPanel } from "./js/fab/render.js";

const LOGO_SVG = `<svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="256" fill="oklch(0.22 0 0)"/><g transform="matrix(12.135672 0 0 12.135672 110.37194 110.37192)"><path fill="#fff" d="M4 17.98V9.71C4 6.07 4 4.26 5.17 3.13 6.34 2 8.23 2 12 2c3.77 0 5.66 0 6.83 1.13C20 4.26 20 6.07 20 9.71v8.27c0 2.31 0 3.46-.77 3.87-1.5.8-4.31-1.87-5.64-2.67C12.82 18.72 12.43 18.48 12 18.48c-.43 0-.82.24-1.59.7C9.08 19.99 6.27 22.66 4.77 21.86 4 21.44 4 20.29 4 17.98Z"/></g></svg>`;

let host, shadow, refs = {}, searchTimer = 0, successTimer = 0, lifecycleController = null;

if (!document.getElementById(ROOT_ID) && isEligiblePage()) void boot();

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area !== "session" && area !== "local") || !changes[ACCESS_COMMAND_KEY]) return;
  const cmd = changes[ACCESS_COMMAND_KEY].newValue;
  if (cmd?.action === "open-quick-access" && document.hasFocus()) togglePanel();
});

// ── Boot ─────────────────────────────────────────────────────────────────────

async function boot() {
  if (!ensureLiveExtensionContext()) return;

  const stored = await chrome.storage.local.get([
    "rewayAccessFabEnabled", "rewayAccessFabHiddenHosts",
    "rewayAccessLastGroup", "rewayAccessLastGroupName",
    "rewayAccessPinnedGroups", "rewayAccessFabCorner",
    "rewayAccessRecentGroups",
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
  return window.matchMedia("(hover:hover) and (pointer:fine)").matches
    && window.innerWidth >= MIN_VIEWPORT_WIDTH
    && window.innerHeight >= MIN_VIEWPORT_HEIGHT;
}

async function getHttpTabCount() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter((t) => t.url?.startsWith("http")).length;
  } catch { return 0; }
}

// ── Shadow DOM ───────────────────────────────────────────────────────────────

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
          <input class="search-input" type="search" placeholder="Search groups and links…" aria-label="Search" autocomplete="off" spellcheck="false" />
        </div>
        <div class="panel-body"></div>
        <div class="panel-footer">
          <button class="manage-link" data-action="manage-library">Manage library →</button>
        </div>
      </div>
    </div>`;
  refs = {
    root:       shadow.querySelector(".root"),
    fab:        shadow.querySelector(".fab"),
    panel:      shadow.querySelector(".panel"),
    strip:      shadow.querySelector(".strip"),
    searchWrap: shadow.querySelector(".search-wrap"),
    search:     shadow.querySelector(".search-input"),
    body:       shadow.querySelector(".panel-body"),
    footer:     shadow.querySelector(".panel-footer"),
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

// ── Events ───────────────────────────────────────────────────────────────────

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
  // Pause the success-dismiss timer while the user is reading the success strip
  refs.strip.addEventListener("mouseenter", pauseSuccessTimer, { signal });
  refs.strip.addEventListener("mouseleave", resumeSuccessTimer, { signal });
  document.addEventListener("click", (e) => {
    if (state.panelOpen && !host.contains(e.target)) closePanel();
  }, { capture: true, signal });
  window.addEventListener("resize", () => applyCorner(state.fabCorner, refs.root), { signal });
}

function handleKeyDown(e) {
  if (!ensureLiveExtensionContext()) return;
  const isShortcut = (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyR");
  if (isShortcut) { e.preventDefault(); e.stopPropagation(); togglePanel(); return; }
  if (e.key === "Escape" && state.panelOpen) { e.preventDefault(); closePanel(); refs.fab.focus(); }
}

// ── Panel lifecycle ──────────────────────────────────────────────────────────

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

// ── Panel action delegation ───────────────────────────────────────────────────

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
  else if (action === "save-again") { state.pickerReturnTo = STRIP.SUCCESS; openPicker(); }
  else if (action === "view-saved") drillIn(target.dataset.groupId);
  else if (action === "open-bookmark") void msgOpenBookmark(target.dataset.url, target.dataset.bookmarkId);
  else if (action === "group-actions") showGroupActions(target.dataset.groupId);
  else if (action === "open-all-tabs") openAllTabs(target.dataset.groupId);
  else if (action === "manage-library") void openDashboard();
  else if (action === "auth") void openDashboard();
  else if (action === "retry-groups") void loadGroups();
  else if (action?.startsWith("retry-bookmarks:")) void loadBookmarks(action.slice(16));
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function doSave(groupId) {
  const gid = groupId || state.lastGroupId || null;
  const group = state.groups.find((g) => g.id === gid);
  // Optimistic: show success immediately
  state.stripMode = STRIP.SUCCESS;
  state.successBookmark = { id: null, url: state.pageUrl, groupId: gid, groupName: group?.name ?? "" };
  renderPanel();
  clearTimeout(successTimer);
  successTimer = setTimeout(() => { state.stripMode = STRIP.PAGE; renderPanel(); }, SUCCESS_RESET_MS);
  try {
    const res = await msgSaveBookmark({ url: state.pageUrl, title: state.pageTitle, groupId: gid });
    if (res?.bookmark?.id) state.successBookmark.id = res.bookmark.id;
    // Prepend to cached bookmark list so the UI reflects the save immediately
    if (res?.bookmark && gid) {
      const normalized = normalizeBookmarks([res.bookmark]);
      if (normalized.length) {
        const existing = state.bookmarksByGroup.get(gid) || [];
        state.bookmarksByGroup.set(gid, [normalized[0], ...existing]);
        state.bookmarksStatusByGroup.set(gid, "ready");
      }
    }
    // Persist last-used group
    if (gid && group) {
      state.lastGroupId = gid;
      state.lastGroupName = group.name;
      const recent = [gid, ...state.recentGroupIds.filter((id) => id !== gid)].slice(0, 3);
      state.recentGroupIds = recent;
      void safeStorageLocalSet({ rewayAccessLastGroup: gid, rewayAccessLastGroupName: group.name, rewayAccessRecentGroups: recent });
    }
  } catch {
    // Roll back on error
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
  // TODO: session save via background when session API is wired
  await doSave(groupId);
}

async function doUndo() {
  const bm = state.successBookmark;
  if (!bm?.id) { state.stripMode = STRIP.PAGE; renderPanel(); return; }
  clearTimeout(successTimer);
  state.stripMode = STRIP.PAGE;
  renderPanel();
  try { await sendMessage({ type: "rewayAccessDeleteBookmark", bookmarkId: bm.id }); } catch {}
}

function pauseSuccessTimer() {
  clearTimeout(successTimer);
}

function resumeSuccessTimer() {
  if (state.stripMode !== STRIP.SUCCESS || state.pickerMode) return;
  clearTimeout(successTimer);
  successTimer = setTimeout(() => { state.stripMode = STRIP.PAGE; renderPanel(); }, SUCCESS_RESET_MS);
}

function openPicker() {
  if (state.pickerMode) {
    state.pickerMode = false;
    state.pickerSelectedIds = new Set();
    state.pickerReturnTo = STRIP.PAGE;
    resumeSuccessTimer();
  } else {
    state.pickerMode = true;
    state.pickerSelectedIds = new Set();
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
  state.pickerSelectedIds = new Set();
  state.pickerReturnTo = STRIP.PAGE;
  if (selectedIds.length === 1) {
    const groupId = selectedIds[0];
    const group = state.groups.find((g) => g.id === groupId);
    if (group && returnTo !== STRIP.SUCCESS) { state.lastGroupId = groupId; state.lastGroupName = group.name; }
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
    } catch {}
  }));
  // Prepend in reverse so groups[0] lands at index 0 (most recent)
  for (const group of [...groups].reverse()) {
    state.recentGroupIds = [group.id, ...state.recentGroupIds.filter((id) => id !== group.id)].slice(0, 3);
  }
  void safeStorageLocalSet({
    rewayAccessLastGroup: state.lastGroupId,
    rewayAccessLastGroupName: state.lastGroupName,
    rewayAccessRecentGroups: state.recentGroupIds,
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
  if (state.view === VIEW.DRILL_IN) { state.view = VIEW.GROUPS; state.activeGroupId = null; }
  else if (state.stripMode === STRIP.SESSION) state.stripMode = STRIP.PAGE;
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

// ── Data loading ─────────────────────────────────────────────────────────────

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
      bookmarks,
    };
    state.searchStatus = "ready";
  } catch {
    state.searchStatus = "error";
  }
  renderPanel();
}

function handleDrillSearch(value) {
  const query = value.trim().toLowerCase();
  if (!query) { renderPanel(); return; }
  const all = state.bookmarksByGroup.get(state.activeGroupId) || [];
  const filtered = all.filter((b) =>
    b.title.toLowerCase().includes(query) || b.domain.toLowerCase().includes(query),
  );
  // Temporarily render filtered list without updating permanent state
  refs.body.querySelector(".bookmarks-list")?.replaceWith(
    Object.assign(document.createElement("div"), {
      className: "bookmarks-list",
      innerHTML: filtered.map((b, i) =>
        `<div class="bookmark-row" role="button" tabindex="0" data-action="open-bookmark" data-url="${b.url}" data-bookmark-id="${b.id}">${b.title}</div>`,
      ).join(""),
    }),
  );
}

// ── Background messages ───────────────────────────────────────────────────────

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

// ── Cleanup ───────────────────────────────────────────────────────────────────

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
