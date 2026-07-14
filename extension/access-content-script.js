const ROOT_ID = "reway-access-root";
const FAB_SIZE = 44;
const EDGE_MARGIN = 8;
const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 220;
const SEARCH_DELAY_MS = 180;
const MENU_OPEN_SETTLE_MS = 220;
const MIN_VIEWPORT_WIDTH = 720;
const MIN_VIEWPORT_HEIGHT = 420;
const MENU_WIDTH = 252;
const MENU_MAX_HEIGHT = 600;
const MENU_GAP = 10;
const MENU_VIEWPORT_GAP = 8;
const SUBMENU_SAFE_TRIANGLE_PADDING = 12;
const SUBMENU_WIDTH = 300;
const SUBMENU_VIEWPORT_GAP = 8;
const SUBMENU_EDGE_GAP = 6;
const SUBMENU_ANCHOR_RISE = 22;
const DEFAULT_GROUP_COLOR = "#a7adb6";
const NO_GROUP_ID = "no-group";
const ACCESS_COMMAND_KEY = "rewayAccessCommand";
const GROUP_ICON_MANIFEST_PATH = "js/group-icon-manifest.js";
const GROUP_ICON_MANIFEST_ASSIGNMENT =
  "globalThis.REWAY_GROUP_ICON_MANIFEST = ";
const MENU_ID = "reway-access-menu";
const MENU_TITLE_ID = "reway-access-menu-title";
const SUBMENU_ID = "reway-access-submenu";
const GROUP_ROW_ID_PREFIX = "reway-access-group";
const BOOKMARK_ROW_ID_PREFIX = "reway-access-bookmark";

const ICONS = {
  logo: `<svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="256" fill="#1a1a1a"/><g transform="matrix(12.135672 0 0 12.135672 110.37194 110.37192)"><path fill="#ffffff" d="M4 17.9808V9.70753C4 6.07416 4 4.25748 5.17157 3.12874C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.12874C20 4.25748 20 6.07416 20 9.70753V17.9808C20 20.2867 20 21.4396 19.2272 21.8523C17.7305 22.6514 14.9232 19.9852 13.59 19.1824C12.8168 18.7168 12.4302 18.484 12 18.484C11.5698 18.484 11.1832 18.7168 10.41 19.1824C9.0768 19.9852 6.26947 22.6514 4.77285 21.8523C4 21.4396 4 20.2867 4 17.9808Z"/></g></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h9M4 17h7"/><circle cx="18" cy="17" r="3"/></svg>`,
};

const SCROLL_CUE_ICONS = {
  up: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const state = {
  enabled: true,
  introSeen: false,
  position: null,
  menuOpen: false,
  keyboardMode: false,
  groupsStatus: "idle",
  groups: [],
  activeGroupId: null,
  bookmarksByGroup: new Map(),
  bookmarksStatusByGroup: new Map(),
  searchQuery: "",
  searchStatus: "idle",
  searchResults: [],
  activeIndex: null,
  activeList: "groups",
  suppressHoverUntil: 0,
  activeRequestId: 0,
  armedOpenGroupIds: new Set(),
  menuSettleUntil: 0,
};

let host;
let shadow;
let refs = {};
let openTimer = 0;
let closeTimer = 0;
let submenuCloseTimer = 0;
let searchTimer = 0;
let introTimer = 0;
let dragState = null;
let pendingQuickAccessOpen = false;
let ignoreGroupListScrollUntil = 0;
let menuResizeTimer = 0;
let deferredPanelTimer = 0;
let dragFrame = 0;
let lifecycleController = null;
let groupIconManifest = globalThis.REWAY_GROUP_ICON_MANIFEST || null;
let groupIconManifestPromise = null;
const openGroupConfirmTimers = new Map();
let menuResizeObserver = null;
let menuResizeFrame = 0;

chrome.runtime.onMessage.addListener(handleRuntimeMessage);
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    (area !== "session" && area !== "local") ||
    !changes[ACCESS_COMMAND_KEY]
  ) {
    return;
  }

  const cmd = changes[ACCESS_COMMAND_KEY].newValue;
  if (cmd?.action === "open-quick-access") {
    handleQuickAccessCommand();
  }
});
void boot().catch((error) => {
  if (isInvalidExtensionContextError(error)) {
    cleanupQuickAccess();
  }
});

function handleGlobalKeyDown(event) {
  if (!refs.fab || !ensureLiveExtensionContext()) return;

  if (isQuickAccessKeyboardEvent(event)) {
    event.preventDefault();
    event.stopPropagation();
    handleQuickAccessCommand();
    return;
  }

  if (shouldRouteMenuKey(event)) {
    routeMenuKeyToSearch(event);
  }
}

function isQuickAccessKeyboardEvent(event) {
  const isDefaultShortcut =
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    event.code === "KeyY";
  const isLegacyShortcut =
    event.altKey &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    event.code === "KeyR";

  return isDefaultShortcut || isLegacyShortcut;
}

function shouldRouteMenuKey(event) {
  if (!state.menuOpen || !refs.search) return false;
  if (event.defaultPrevented || event.isComposing) return false;
  if (isSearchEventTarget(event)) return false;
  if (isPanelKeyboardEventTarget(event)) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  return (
    isMenuNavigationKey(event.key) ||
    isSearchEditingKey(event.key) ||
    isPrintableKey(event)
  );
}

function routeMenuKeyToSearch(event) {
  event.preventDefault();
  event.stopPropagation();
  refs.search.focus({ preventScroll: true });

  if (isPrintableKey(event)) {
    insertSearchText(event.key);
    return;
  }

  if (isSearchEditingKey(event.key)) {
    editSearchText(event.key);
    return;
  }

  handleSearchKeyDown(event);
}

function insertSearchText(text) {
  const start = refs.search.selectionStart ?? refs.search.value.length;
  const end = refs.search.selectionEnd ?? refs.search.value.length;
  refs.search.setRangeText(text, start, end, "end");
  refs.search.dispatchEvent(new Event("input", { bubbles: true }));
}

function editSearchText(key) {
  const valueLength = refs.search.value.length;
  const start = refs.search.selectionStart ?? valueLength;
  const end = refs.search.selectionEnd ?? valueLength;

  if (start !== end) {
    refs.search.setRangeText("", start, end, "end");
  } else if (key === "Backspace" && start > 0) {
    refs.search.setRangeText("", start - 1, start, "end");
  } else if (key === "Delete" && start < valueLength) {
    refs.search.setRangeText("", start, start + 1, "end");
  }

  refs.search.dispatchEvent(new Event("input", { bubbles: true }));
}

function isSearchEventTarget(event) {
  return (
    event.composedPath?.().includes(refs.search) || event.target === refs.search
  );
}

function isPanelKeyboardEventTarget(event) {
  const path = event.composedPath?.() || [];
  return path.some(
    (node) =>
      node instanceof Element &&
      (refs.menu?.contains(node) || refs.submenu?.contains(node)),
  );
}

function isMenuNavigationKey(key) {
  return [
    "ArrowDown",
    "ArrowUp",
    "ArrowRight",
    "ArrowLeft",
    "Enter",
    "Escape",
  ].includes(key);
}

function isPrintableKey(event) {
  return event.key.length === 1;
}

function isSearchEditingKey(key) {
  return key === "Backspace" || key === "Delete";
}

async function boot() {
  if (!isEligiblePage() || !ensureLiveExtensionContext()) return;

  const settings = await readSettings();
  if (
    !settings.enabled ||
    isHiddenHost(settings.hiddenHosts) ||
    isRewayOrigin(settings.baseUrl)
  )
    return;
  state.enabled = true;
  state.introSeen = settings.introSeen;
  state.position = settings.position;

  inject();
  await applyStyles();
  applyInitialPosition();
  revealHost();
  bindEvents();
  flushPendingQuickAccessCommand();
}

function handleQuickAccessCommand() {
  if (!ensureLiveExtensionContext()) return;
  if (!document.hasFocus()) return;

  if (!refs.fab) {
    pendingQuickAccessOpen = true;
    return;
  }

  openMenu({ focusSearch: true });
}

function flushPendingQuickAccessCommand() {
  if (!pendingQuickAccessOpen) return;
  pendingQuickAccessOpen = false;
  handleQuickAccessCommand();
}

function isEligiblePage() {
  if (window.top !== window) return false;
  if (document.getElementById(ROOT_ID)) return false;
  if (location.protocol !== "http:" && location.protocol !== "https:")
    return false;
  if (isRewayOrigin()) return false;
  return hasDesktopViewport();
}

function hasDesktopViewport() {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    window.innerWidth >= MIN_VIEWPORT_WIDTH &&
    window.innerHeight >= MIN_VIEWPORT_HEIGHT
  );
}

async function readSettings() {
  const keys = [
    "rewayBaseUrl",
    "rewayAccessFabEnabled",
    "rewayAccessFabPosition",
    "rewayAccessFabHiddenHosts",
    "rewayAccessFabIntroSeen",
  ];
  const values = await chrome.storage.local.get(keys);
  return {
    baseUrl: values.rewayBaseUrl || "https://www.reway.page",
    enabled: values.rewayAccessFabEnabled !== false,
    position: isPosition(values.rewayAccessFabPosition)
      ? values.rewayAccessFabPosition
      : null,
    hiddenHosts: Array.isArray(values.rewayAccessFabHiddenHosts)
      ? values.rewayAccessFabHiddenHosts
      : [],
    introSeen: values.rewayAccessFabIntroSeen === true,
  };
}

function isPosition(position) {
  return (
    position &&
    typeof position === "object" &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y)
  );
}

function isHiddenHost(hiddenHosts) {
  const currentHost = location.hostname.toLowerCase();
  return hiddenHosts.some(
    (hostName) => String(hostName).toLowerCase() === currentHost,
  );
}

function isRewayOrigin(baseUrl) {
  const origins = new Set(["https://reway.page", "https://www.reway.page"]);
  if (baseUrl) {
    try {
      origins.add(new URL(baseUrl).origin);
    } catch {}
  }
  return origins.has(location.origin);
}

function inject() {
  host = document.createElement("div");
  host.id = ROOT_ID;
  host.style.setProperty("display", "none", "important");
  document.documentElement.append(host);
  shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <div class="root" data-menu-open="false" data-menu-x="left" data-menu-y="above">
      <button class="fab" type="button" aria-label="Open Reway quick access" aria-haspopup="dialog" aria-expanded="false" aria-controls="${MENU_ID}">
        <span class="fab-icon">${ICONS.logo}</span>
      </button>
      <div class="intro" role="status">
        <p class="intro-title">Reway quick access</p>
        <p class="intro-copy">Hover to open saved links</p>
      </div>
      <section class="menu" id="${MENU_ID}" role="dialog" aria-labelledby="${MENU_TITLE_ID}" aria-modal="false">
        <h2 class="sr-only" id="${MENU_TITLE_ID}">Reway quick access</h2>
        <div class="search-wrap">
          <input class="search-input" type="search" name="quick-access-search" autocomplete="off" spellcheck="false" placeholder="Search bookmarks…" aria-label="Search bookmarks" />
        </div>
        <div class="panel"></div>
      </section>
      <section class="submenu" id="${SUBMENU_ID}" role="region" aria-label="Group bookmarks"></section>
    </div>
  `;
  refs = {
    root: shadow.querySelector(".root"),
    fab: shadow.querySelector(".fab"),
    intro: shadow.querySelector(".intro"),
    menu: shadow.querySelector(".menu"),
    panel: shadow.querySelector(".panel"),
    search: shadow.querySelector(".search-input"),
    submenu: shadow.querySelector(".submenu"),
  };
}

function revealHost() {
  const node = host;
  if (!node?.isConnected) return;
  node.style.removeProperty("display");
}

async function applyStyles() {
  const style = document.createElement("style");
  try {
    const css = await fetch(chrome.runtime.getURL("access-content.css")).then(
      (response) => response.text(),
    );
    style.textContent = css;
  } catch {
    style.textContent = `.root{position:fixed;z-index:2147483647}.fab{width:44px;height:44px;border-radius:999px}`;
  }
  if (!shadow) return;
  shadow.prepend(style);
}

function applyInitialPosition() {
  const fallback = {
    x: window.innerWidth - FAB_SIZE - 28,
    y: window.innerHeight - FAB_SIZE - 28,
  };
  const next = clampPosition(state.position || fallback);
  setPosition(next, false);
}

function clampPosition(position) {
  return {
    x: Math.max(
      EDGE_MARGIN,
      Math.min(window.innerWidth - FAB_SIZE - EDGE_MARGIN, position.x),
    ),
    y: Math.max(
      EDGE_MARGIN,
      Math.min(window.innerHeight - FAB_SIZE - EDGE_MARGIN, position.y),
    ),
  };
}

function setPosition(position, persist = true) {
  if (!refs.root) return;
  state.position = clampPosition(position);
  refs.root.style.left = `${state.position.x}px`;
  refs.root.style.top = `${state.position.y}px`;
  if (persist) {
    void safeStorageLocalSet({ rewayAccessFabPosition: state.position });
  }
}

function bindEvents() {
  lifecycleController?.abort();
  lifecycleController = new AbortController();
  const { signal } = lifecycleController;

  window.addEventListener("keydown", handleGlobalKeyDown, {
    capture: true,
    signal,
  });
  refs.root.addEventListener("mouseenter", handlePointerEnter, { signal });
  refs.root.addEventListener("mouseleave", handlePointerLeave, { signal });
  refs.menu.addEventListener("mouseenter", () => clearTimeout(closeTimer), {
    signal,
  });
  refs.menu.addEventListener("mouseleave", scheduleClose, { signal });
  refs.submenu.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
    clearTimeout(submenuCloseTimer);
  }, { signal });
  refs.submenu.addEventListener("mouseleave", () => {
    submenuCloseTimer = setTimeout(closeSubmenu, HOVER_CLOSE_DELAY_MS);
    scheduleClose();
  }, { signal });
  refs.fab.addEventListener("pointerdown", startDrag, { signal });
  refs.fab.addEventListener("click", (event) => {
    event.preventDefault();
  }, { signal });
  refs.search.addEventListener("input", handleSearchInput, { signal });
  refs.search.addEventListener("keydown", handleSearchKeyDown, { signal });
  refs.search.addEventListener("blur", handleSearchBlur, { signal });
  window.addEventListener("resize", handleResize, { signal });
}

function handlePointerEnter() {
  clearTimeout(closeTimer);
  clearTimeout(openTimer);
  if (state.menuOpen) return;
  if (Date.now() < state.suppressHoverUntil) return;
  openTimer = setTimeout(
    () => openMenu({ focusSearch: false }),
    HOVER_OPEN_DELAY_MS,
  );
}

function handlePointerLeave() {
  clearTimeout(openTimer);
  if (
    !isSearchEngaged() &&
    !isPanelFocusEngaged() &&
    !refs.menu?.matches(":hover") &&
    !refs.submenu?.matches(":hover")
  ) {
    scheduleClose();
  }
}

function scheduleClose() {
  clearTimeout(closeTimer);
  if (isSearchEngaged() || isPanelFocusEngaged()) return;
  closeTimer = setTimeout(() => {
    if (isSearchEngaged() || isPanelFocusEngaged()) return;
    if (
      !refs.root?.matches(":hover") &&
      !refs.menu?.matches(":hover") &&
      !refs.submenu?.matches(":hover")
    ) {
      closeMenu();
    }
  }, HOVER_CLOSE_DELAY_MS);
}

function isSearchEngaged() {
  return Boolean(
    refs.search?.matches(":focus") ||
      (state.menuOpen && state.searchQuery.length > 0),
  );
}

function maybeCloseAfterSearchDisengaged() {
  if (!state.menuOpen || isSearchEngaged() || isPanelFocusEngaged()) return;
  if (
    !refs.root?.matches(":hover") &&
    !refs.menu?.matches(":hover") &&
    !refs.submenu?.matches(":hover")
  ) {
    scheduleClose();
  }
}

function openMenu({ focusSearch }) {
  dismissIntro();
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  const wasOpen = state.menuOpen;
  state.menuOpen = true;
  if (!wasOpen) {
    state.menuSettleUntil = Date.now() + MENU_OPEN_SETTLE_MS;
  }
  state.keyboardMode = Boolean(focusSearch);
  state.activeList = "groups";
  state.activeIndex = null;
  refs.root.dataset.menuOpen = "true";
  refs.root.dataset.keyboardMode = String(state.keyboardMode);
  refs.fab.dataset.open = "true";
  refs.fab.setAttribute("aria-expanded", "true");
  attachMenuResizeObserver();
  renderPanel();
  syncMenuPosition();
  if (state.groupsStatus === "idle") {
    void loadGroups();
  }
  if (focusSearch) {
    refs.search.focus({ preventScroll: true });
  }
}

function closeMenu() {
  if (!refs.root || !refs.search || !refs.fab || !refs.menu) return;
  const shouldRestoreFocus = shouldRestoreFocusToFab();
  clearTimeout(menuResizeTimer);
  clearTimeout(deferredPanelTimer);
  detachMenuResizeObserver();
  state.menuOpen = false;
  state.keyboardMode = false;
  state.searchQuery = "";
  state.activeGroupId = null;
  clearAllOpenGroupConfirmations({ rerender: false });
  state.activeIndex = null;
  state.activeList = "groups";
  state.menuSettleUntil = 0;
  refs.search.value = "";
  clearVirtualActiveDescendant();
  refs.root.dataset.menuOpen = "false";
  refs.root.dataset.keyboardMode = "false";
  refs.fab.dataset.open = "false";
  refs.fab.setAttribute("aria-expanded", "false");
  refs.menu.style.height = "";
  refs.menu.style.overflow = "";
  closeSubmenu();
  renderPanel();
  if (shouldRestoreFocus) {
    refs.fab.focus({ preventScroll: true });
  }
}

function positionMenus() {
  if (!refs.root || !refs.menu) return;
  const rect = refs.root.getBoundingClientRect();
  const layout = getViewportAwareMenuLayout(rect);
  refs.root.dataset.menuX = layout.x;
  refs.root.dataset.menuY = layout.y;
  refs.menu.style.setProperty("--menu-left", `${layout.left}px`);
  refs.menu.style.setProperty("--menu-top", `${layout.top}px`);
  refs.menu.style.setProperty("--menu-max-height", `${layout.maxHeight}px`);
  positionSubmenu();
}

function getViewportAwareMenuLayout(anchorRect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const menuWidth = Math.min(
    MENU_WIDTH,
    viewportWidth - MENU_VIEWPORT_GAP * 2,
  );
  const availableAbove = Math.max(
    0,
    anchorRect.top - MENU_GAP - MENU_VIEWPORT_GAP,
  );
  const availableBelow = Math.max(
    0,
    viewportHeight - anchorRect.bottom - MENU_GAP - MENU_VIEWPORT_GAP,
  );
  const preferredBelow = availableBelow >= availableAbove;
  const availableHeight = preferredBelow ? availableBelow : availableAbove;
  const maxHeight = Math.max(
    180,
    Math.min(MENU_MAX_HEIGHT, availableHeight, viewportHeight - MENU_VIEWPORT_GAP * 2),
  );
  const measuredHeight = getMeasuredMenuHeight(maxHeight);
  const fitsAbove = measuredHeight <= availableAbove;
  const fitsBelow = measuredHeight <= availableBelow;
  const unclampedLeft =
    anchorRect.right - menuWidth >= MENU_VIEWPORT_GAP
      ? anchorRect.right - menuWidth
      : anchorRect.left;
  const left = clampNumber(
    unclampedLeft,
    MENU_VIEWPORT_GAP,
    viewportWidth - menuWidth - MENU_VIEWPORT_GAP,
  );
  const openBelow =
    fitsBelow && !fitsAbove
      ? true
      : fitsAbove && !fitsBelow
        ? false
        : preferredBelow;
  const top = openBelow
    ? anchorRect.bottom + MENU_GAP
    : anchorRect.top - MENU_GAP - measuredHeight;

  return {
    x: anchorRect.right - menuWidth >= MENU_VIEWPORT_GAP ? "left" : "right",
    y: openBelow ? "below" : "above",
    left,
    top: clampNumber(
      top,
      MENU_VIEWPORT_GAP,
      viewportHeight - measuredHeight - MENU_VIEWPORT_GAP,
    ),
    maxHeight,
  };
}

function getMeasuredMenuHeight(maxHeight) {
  if (!refs.menu) return maxHeight;

  const visualHeight = refs.menu.getBoundingClientRect().height;
  const contentHeight = refs.menu.scrollHeight;
  const isAnimatingHeight = refs.menu.style.height !== "";

  if (isAnimatingHeight && visualHeight > 0) {
    return Math.min(visualHeight, maxHeight);
  }

  if (contentHeight > 0) {
    return Math.min(contentHeight, maxHeight);
  }

  if (visualHeight > 0) {
    return Math.min(visualHeight, maxHeight);
  }

  return maxHeight;
}

function attachMenuResizeObserver() {
  if (menuResizeObserver || !refs.menu || typeof ResizeObserver !== "function") {
    return;
  }

  menuResizeObserver = new ResizeObserver(() => {
    if (!state.menuOpen || !refs.menu) return;
    if (menuResizeFrame) return;
    menuResizeFrame = requestAnimationFrame(() => {
      menuResizeFrame = 0;
      if (!state.menuOpen || !refs.menu) return;
      syncMenuPosition();
    });
  });

  menuResizeObserver.observe(refs.menu);
}

function detachMenuResizeObserver() {
  if (menuResizeFrame) {
    cancelAnimationFrame(menuResizeFrame);
    menuResizeFrame = 0;
  }
  menuResizeObserver?.disconnect();
  menuResizeObserver = null;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shouldRestoreFocusToFab() {
  if (!shadow) return false;
  const activeElement = shadow.activeElement;
  if (!activeElement) return false;
  return refs.menu?.contains(activeElement) || refs.submenu?.contains(activeElement);
}

function isPanelFocusEngaged() {
  if (!shadow) return false;
  const activeElement = shadow.activeElement;
  if (!(activeElement instanceof Element)) return false;
  return refs.menu?.contains(activeElement) || refs.submenu?.contains(activeElement);
}

function handleResize() {
  if (!host || !refs.root) return;
  setPosition(
    state.position || {
      x: window.innerWidth - FAB_SIZE - 28,
      y: window.innerHeight - FAB_SIZE - 28,
    },
  );
  if (!hasDesktopViewport()) {
    host?.style?.setProperty("display", "none", "important");
    return;
  }
  revealHost();
  if (state.menuOpen) {
    positionMenus();
  }
}

function dismissIntro() {
  if (state.introSeen) return;
  state.introSeen = true;
  clearTimeout(introTimer);
  refs.intro.dataset.open = "false";
  void safeStorageLocalSet({ rewayAccessFabIntroSeen: true });
}

function startDrag(event) {
  if (event.button !== 0) return;
  dismissIntro();
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  state.suppressHoverUntil = Date.now() + 350;
  const rootRect = refs.root.getBoundingClientRect();
  dragState = {
    pointerId: event.pointerId,
    originX: event.clientX,
    originY: event.clientY,
    baseX: state.position.x,
    baseY: state.position.y,
    offsetX: event.clientX - rootRect.left,
    offsetY: event.clientY - rootRect.top,
    nextX: state.position.x,
    nextY: state.position.y,
    moved: false,
    closedMenu: false,
  };
  refs.fab.setPointerCapture(event.pointerId);
  refs.fab.addEventListener("pointermove", moveDrag);
  refs.fab.addEventListener("pointerup", endDrag);
  refs.fab.addEventListener("pointercancel", endDrag);
}

function moveDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const dx = event.clientX - dragState.originX;
  const dy = event.clientY - dragState.originY;
  if (!dragState.moved && Math.hypot(dx, dy) < 5) return;

  if (!dragState.moved) {
    dragState.moved = true;
    refs.fab.dataset.dragging = "true";
  }

  state.suppressHoverUntil = Date.now() + 350;
  if (!dragState.closedMenu) {
    dragState.closedMenu = true;
    closeMenu();
  }

  const next = clampPosition({
    x: event.clientX - dragState.offsetX,
    y: event.clientY - dragState.offsetY,
  });
  dragState.nextX = next.x;
  dragState.nextY = next.y;
  scheduleDragFrame();
}

function scheduleDragFrame() {
  if (dragFrame) return;
  dragFrame = requestAnimationFrame(() => {
    dragFrame = 0;
    const fab = refs.fab;
    if (!dragState || !fab) return;
    const dx = dragState.nextX - dragState.baseX;
    const dy = dragState.nextY - dragState.baseY;
    fab.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  });
}

function endDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const fab = refs.fab;
  if (!fab) {
    dragState = null;
    return;
  }
  if (dragFrame) {
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
  }
  const finalPosition = {
    x: dragState.nextX,
    y: dragState.nextY,
  };
  fab.releasePointerCapture(event.pointerId);
  fab.removeEventListener("pointermove", moveDrag);
  fab.removeEventListener("pointerup", endDrag);
  fab.removeEventListener("pointercancel", endDrag);
  if (dragState.moved && event.type !== "pointercancel") {
    fab.style.transform = "translate3d(0, 0, 0)";
    setPosition(finalPosition, true);
    requestAnimationFrame(() => {
      if (!fab.isConnected) return;
      fab.style.transform = "";
      fab.dataset.dragging = "false";
    });
  } else {
    fab.style.transform = "";
    fab.dataset.dragging = "false";
  }
  dragState = null;
}

async function loadGroups() {
  state.groupsStatus = "loading";
  renderPanel();
  try {
    const response = await sendMessage({ type: "rewayAccessGetGroups" });
    await ensureGroupIconManifest();
    state.groups = normalizeGroups(response?.groups || []);
    state.groupsStatus = "ready";
  } catch (error) {
    state.groupsStatus = error?.status === 401 ? "auth" : "error";
  }
  renderPanelAfterMenuSettle();
}

function normalizeGroups(groups) {
  const regularGroups = groups
    .filter((group) => group?.id && group.show_in_fab !== false)
    .map((group) => ({
      id: String(group.id),
      name: String(group.name || "Untitled group"),
      color: group.color || DEFAULT_GROUP_COLOR,
      icon: typeof group.icon === "string" ? group.icon : "",
    }));
  return [
    ...regularGroups,
    {
      id: NO_GROUP_ID,
      name: "No Group",
      color: DEFAULT_GROUP_COLOR,
      icon: "folder",
    },
  ];
}

async function loadBookmarks(groupId) {
  const requestId = ++state.activeRequestId;
  state.bookmarksStatusByGroup.set(groupId, "loading");
  renderSubmenu();
  try {
    const response = await sendMessage({
      type: "rewayAccessGetGroupBookmarks",
      groupId,
    });
    if (requestId !== state.activeRequestId) return;
    state.bookmarksByGroup.set(
      groupId,
      normalizeBookmarks(response?.bookmarks || []),
    );
    state.bookmarksStatusByGroup.set(groupId, "ready");
    if (
      state.activeGroupId === groupId &&
      state.activeList === "group" &&
      state.activeIndex === null
    ) {
      state.activeIndex = getFirstBookmarkIndex(groupId);
      updateActiveRows();
    }
  } catch (error) {
    state.bookmarksStatusByGroup.set(
      groupId,
      error?.status === 401 ? "auth" : "error",
    );
  }
  renderSubmenu();
}

function normalizeBookmarks(bookmarks) {
  return bookmarks
    .map((bookmark) => ({
      id: String(bookmark.id || ""),
      title: String(bookmark.title || bookmark.url || "Untitled bookmark"),
      url: String(bookmark.url || ""),
      domain: String(bookmark.domain || safeDomain(bookmark.url) || ""),
      faviconCandidates: buildFaviconCandidates(bookmark),
    }))
    .filter((bookmark) => isHttpUrl(bookmark.url));
}

function buildFaviconCandidates(bookmark) {
  const primary = normalizeFaviconUrl(bookmark.favicon_url || bookmark.faviconUrl);
  const domain = safeDomain(bookmark.url);
  const candidates = [];

  if (primary) {
    candidates.push(primary);
  }

  if (isPublicFaviconDomain(domain)) {
    candidates.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`,
    );
  }

  return [...new Set(candidates)];
}

function normalizeFaviconUrl(url) {
  if (!url) return "";

  if (typeof url !== "string") return "";
  const value = url.trim();
  if (!value) return "";

  if (value.startsWith("data:image/")) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {}

  return "";
}

function safeDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isPublicFaviconDomain(domain) {
  if (!domain) return false;
  const normalized = domain.toLowerCase();
  if (
    normalized === "localhost" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    !normalized.includes(".")
  ) {
    return false;
  }

  if (normalized.includes(":")) {
    return false;
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    const parts = normalized.split(".").map(Number);
    const [a, b] = parts;
    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return false;
    }
  }

  return true;
}

function handleSearchInput() {
  clearAllOpenGroupConfirmations({ rerender: false });
  state.searchQuery = refs.search.value.trim();
  state.activeList = state.searchQuery.length >= 2 ? "search" : "groups";
  state.activeIndex = null;
  clearVirtualActiveDescendant();
  clearTimeout(searchTimer);
  if (state.searchQuery.length < 2) {
    state.searchStatus = "idle";
    state.searchResults = [];
    renderPanel();
    requestAnimationFrame(maybeCloseAfterSearchDisengaged);
    return;
  }
  state.searchStatus = "loading";
  renderPanel();
  searchTimer = setTimeout(runSearch, SEARCH_DELAY_MS);
}

async function runSearch() {
  const query = state.searchQuery;
  if (query.length < 2) return;
  try {
    const response = await sendMessage({
      type: "rewayAccessSearchBookmarks",
      query,
      limit: 20,
    });
    if (state.searchQuery !== query) return;
    state.searchResults = normalizeBookmarks(response?.bookmarks || []);
    state.searchStatus = "ready";
  } catch (error) {
    state.searchStatus = error?.status === 401 ? "auth" : "error";
  }
  renderPanel();
}

function handleSearchBlur() {
  requestAnimationFrame(maybeCloseAfterSearchDisengaged);
}

function renderPanel() {
  closeSubmenuIfSearching();
  if (state.searchQuery.length >= 2) {
    renderSearchResults();
    return;
  }

  if (state.groupsStatus === "idle" || state.groupsStatus === "loading") {
    refs.panel.innerHTML = renderSkeleton();
    return;
  }

  if (state.groupsStatus === "auth") {
    refs.panel.innerHTML = renderState(
      ICONS.lock,
      "Sign in required",
      "Open Reway to access your saved links.",
      "Open Reway",
    );
    refs.panel
      .querySelector(".state-action")
      ?.addEventListener("click", openLogin);
    return;
  }

  if (state.groupsStatus === "error") {
    refs.panel.innerHTML = renderState(
      ICONS.alert,
      "Could not load groups",
      "Check your connection and try again.",
      "Retry",
    );
    refs.panel
      .querySelector(".state-action")
      ?.addEventListener("click", loadGroups);
    return;
  }

  if (state.groups.length === 0) {
    refs.panel.innerHTML = renderState(
      ICONS.empty,
      "No bookmarks yet",
      "Saved links will appear here.",
      "",
    );
    return;
  }

  const list = document.createElement("ul");
  list.className = "list";
  state.groups.forEach((group, index) => {
    const item = document.createElement("li");
    item.className = "group-row";
    const surface = document.createElement("div");
    surface.className = "group-row-surface";
    const isActive = isGroupActive(group.id, index);
    surface.dataset.active = String(isActive);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "row-button";
    row.id = getGroupRowId(group.id);
    row.dataset.source = "groups";
    row.dataset.index = String(index);
    row.dataset.groupId = group.id;
    row.dataset.active = String(isActive);
    row.setAttribute("aria-expanded", String(state.activeGroupId === group.id));
    row.setAttribute("aria-controls", SUBMENU_ID);
    row.style.setProperty("--group-color", group.color);
    row.innerHTML = `${renderGroupIconChip(group)}<span class="row-label"></span>`;
    row.querySelector(".row-label").textContent = group.name;
    surface.addEventListener("mouseenter", (event) => {
      if (!shouldDeferGroupActivation(event, group.id)) {
        activateGroup(group.id, index);
      }
    });
    row.addEventListener("focus", () => handleGroupRowFocus(group.id, index));
    row.addEventListener("click", () => activateGroup(group.id, index));
    row.addEventListener("keydown", handleFocusableRowKeyDown);
    const isArmed = isOpenGroupArmed(group.id);
    const openGroupButton = document.createElement("button");
    openGroupButton.type = "button";
    openGroupButton.className = "group-open-button";
    openGroupButton.dataset.confirm = String(isArmed);
    openGroupButton.title = isArmed
      ? `Confirm opening all bookmarks in ${group.name}`
      : `Open all bookmarks in ${group.name}`;
    openGroupButton.setAttribute(
      "aria-label",
      isArmed
        ? `Confirm opening all bookmarks in ${group.name}`
        : `Open all bookmarks in ${group.name}`,
    );
    openGroupButton.innerHTML = isArmed
      ? `<span class="group-open-button-label">Open?</span>`
      : ICONS.external;
    openGroupButton.addEventListener("focus", () => {
      clearVirtualActiveDescendant();
      state.activeList = "groups";
      state.activeIndex = index;
      updateActiveRows();
    });
    openGroupButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (isOpenGroupArmed(group.id)) {
        void openConfirmedGroup(group);
        return;
      }
      armOpenGroupConfirmation(group.id);
    });
    openGroupButton.addEventListener("keydown", handleFocusableRowKeyDown);
    surface.append(row, openGroupButton);
    item.append(surface);
    list.append(item);
  });
  list.addEventListener("scroll", handleGroupListScroll, { passive: true });
  const scrollTop = getPanelListScrollTop();
  updatePanelContent(() => {
    refs.panel.replaceChildren(createScrollFrame(list));
    restoreListScrollTop(list, scrollTop);
  });
}

function getPanelListScrollTop() {
  const list = refs.panel.querySelector(".list");
  return list ? list.scrollTop : 0;
}

function restoreListScrollTop(list, scrollTop) {
  if (!scrollTop) return;
  ignoreGroupListScrollUntil = Date.now() + 120;
  list.scrollTop = scrollTop;
  requestAnimationFrame(() => {
    if (refs.panel.contains(list)) {
      ignoreGroupListScrollUntil = Date.now() + 120;
      list.scrollTop = scrollTop;
      updateScrollIndicators(list);
    }
  });
}

function createScrollFrame(list) {
  const frame = document.createElement("div");
  frame.className = "scroll-frame";
  frame.dataset.scrollTop = "false";
  frame.dataset.scrollBottom = "false";

  const topCue = document.createElement("span");
  topCue.className = "scroll-cue scroll-cue-top";
  topCue.setAttribute("aria-hidden", "true");
  topCue.innerHTML = SCROLL_CUE_ICONS.up;

  const bottomCue = document.createElement("span");
  bottomCue.className = "scroll-cue scroll-cue-bottom";
  bottomCue.setAttribute("aria-hidden", "true");
  bottomCue.innerHTML = SCROLL_CUE_ICONS.down;

  list.addEventListener("scroll", () => updateScrollIndicators(list), {
    passive: true,
  });
  frame.append(list, topCue, bottomCue);
  requestAnimationFrame(() => updateScrollIndicators(list));
  return frame;
}

function updateScrollIndicators(list) {
  const frame = list.closest(".scroll-frame");
  if (!frame) return;
  const maxScrollTop = list.scrollHeight - list.clientHeight;
  const canScroll = maxScrollTop > 1;
  frame.dataset.scrollTop = String(canScroll && list.scrollTop > 1);
  frame.dataset.scrollBottom = String(
    canScroll && list.scrollTop < maxScrollTop - 1,
  );
}

function updatePanelContent(update) {
  const shouldAnimate =
    state.menuOpen &&
    refs.menu &&
    refs.root.dataset.keyboardMode !== "true" &&
    Date.now() >= state.menuSettleUntil;
  const beforeHeight = shouldAnimate ? refs.menu.getBoundingClientRect().height : 0;

  update();
  syncVirtualActiveDescendant();

  if (shouldAnimate) {
    animateMenuHeightFrom(beforeHeight);
  }
  syncMenuPosition();
}

function renderPanelAfterMenuSettle() {
  clearTimeout(deferredPanelTimer);
  const delay = Math.max(0, state.menuSettleUntil - Date.now());
  if (!state.menuOpen || delay === 0) {
    renderPanel();
    syncMenuPosition();
    return;
  }

  deferredPanelTimer = setTimeout(() => {
    if (!state.menuOpen) return;
    renderPanel();
    syncMenuPosition();
  }, delay);
}

function syncMenuPosition() {
  if (!state.menuOpen || !refs.root || !refs.menu) return;
  positionMenus();
  requestAnimationFrame(() => {
    if (state.menuOpen && refs.root && refs.menu) {
      positionMenus();
    }
  });
}

function animateMenuHeightFrom(beforeHeight) {
  const menu = refs.menu;
  if (!menu) return;
  const afterHeight = menu.getBoundingClientRect().height;
  if (Math.abs(afterHeight - beforeHeight) < 1) return;

  clearTimeout(menuResizeTimer);
  menu.style.overflow = "hidden";
  menu.style.height = `${beforeHeight}px`;
  menu.getBoundingClientRect();
  menu.style.height = `${afterHeight}px`;

  menuResizeTimer = setTimeout(() => {
    if (!menu.isConnected) return;
    menu.style.height = "";
    menu.style.overflow = "";
    syncMenuPosition();
  }, 220);
}

function renderSearchResults() {
  if (state.searchStatus === "loading") {
    updatePanelContent(() => {
      refs.panel.innerHTML = renderSkeleton();
    });
    return;
  }

  if (state.searchStatus === "auth") {
    updatePanelContent(() => {
      refs.panel.innerHTML = renderState(
        ICONS.lock,
        "Sign in required",
        "Open Reway to search bookmarks.",
        "Open Reway",
      );
    });
    refs.panel
      .querySelector(".state-action")
      ?.addEventListener("click", openLogin);
    return;
  }

  if (state.searchStatus === "error") {
    updatePanelContent(() => {
      refs.panel.innerHTML = renderState(
        ICONS.alert,
        "Search failed",
        "Try again in a moment.",
        "",
      );
    });
    return;
  }

  if (state.searchResults.length === 0) {
    updatePanelContent(() => {
      refs.panel.innerHTML = renderState(
        ICONS.empty,
        "No matches",
        "Try a different bookmark title or domain.",
        "",
      );
    });
    return;
  }

  updatePanelContent(() => {
    refs.panel.replaceChildren(
      createScrollFrame(renderBookmarkList(state.searchResults, "search")),
    );
  });
}

function renderSubmenu() {
  if (!state.activeGroupId) return;
  const group = state.groups.find((item) => item.id === state.activeGroupId);
  if (!group) return;
  const status = state.bookmarksStatusByGroup.get(group.id) || "idle";
  const bookmarks = state.bookmarksByGroup.get(group.id) || [];

  if (status === "loading" || status === "idle") {
    refs.submenu.replaceChildren(htmlToNode(renderSkeleton()));
    syncSubmenuPosition();
    return;
  }

  if (status === "error") {
    refs.submenu.replaceChildren(
      htmlToNode(
        renderState(
          ICONS.alert,
          "Could not load links",
          "Try hovering the group again.",
          "",
        ),
      ),
    );
    syncSubmenuPosition();
    return;
  }

  if (bookmarks.length === 0) {
    refs.submenu.replaceChildren(
      htmlToNode(
        renderState(
          ICONS.empty,
          "No links here",
          "This group has no bookmarks yet.",
          "",
        ),
      ),
    );
    syncSubmenuPosition();
    return;
  }

  refs.submenu.replaceChildren(
    createScrollFrame(renderBookmarkList(bookmarks, "group")),
  );
  updateActiveRows();
  syncSubmenuPosition();
}

function renderBookmarkList(bookmarks, source) {
  const list = document.createElement("ul");
  list.className = "list";
  bookmarks.forEach((bookmark, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bookmark-button";
    button.id = getBookmarkRowId(bookmark, source, index);
    button.dataset.index = String(index);
    button.dataset.source = source;
    button.dataset.active = String(
      source === state.activeList && index === state.activeIndex,
    );
    button.innerHTML = `${renderFavicon(bookmark)}<span class="bookmark-info"><span class="bookmark-title"></span><span class="bookmark-domain"></span></span>`;
    button.querySelector(".bookmark-title").textContent = bookmark.title;
    button.querySelector(".bookmark-domain").textContent = bookmark.domain;
    const image = button.querySelector(".bookmark-favicon");
    if (image) {
      attachFaviconFallback(image, bookmark);
    }
    const activateBookmarkRow = () => {
      if (source === "search" || source === "group") {
        state.activeList = source;
        state.activeIndex = index;
        updateActiveRows();
      }
    };
    button.addEventListener("mouseenter", activateBookmarkRow);
    button.addEventListener("focus", () => {
      clearVirtualActiveDescendant();
      activateBookmarkRow();
    });
    button.addEventListener("keydown", handleFocusableRowKeyDown);
    button.addEventListener("click", () => openBookmark(bookmark));
    item.append(button);
    list.append(item);
  });
  return list;
}

function renderFavicon(bookmark) {
  if (!bookmark.faviconCandidates.length) {
    return createFaviconFallbackMarkup(bookmark);
  }
  return `<img class="bookmark-favicon" src="${escapeAttribute(bookmark.faviconCandidates[0])}" alt="" width="20" height="20" loading="lazy" decoding="async" />`;
}

function createFaviconFallback(bookmark) {
  const fallback = document.createElement("span");
  fallback.className = "bookmark-fallback";
  fallback.textContent = getBookmarkFallbackLetter(bookmark);
  fallback.style.setProperty(
    "--bookmark-fallback-bg",
    getBookmarkFallbackColor(bookmark.domain || bookmark.url),
  );
  return fallback;
}

function createFaviconFallbackMarkup(bookmark) {
  return `<span class="bookmark-fallback" style="--bookmark-fallback-bg:${escapeAttribute(getBookmarkFallbackColor(bookmark.domain || bookmark.url))}">${escapeHtml(getBookmarkFallbackLetter(bookmark))}</span>`;
}

function attachFaviconFallback(image, bookmark) {
  const candidates = bookmark.faviconCandidates || [];
  let index = 0;

  image.addEventListener("error", () => {
    index += 1;
    if (index < candidates.length) {
      image.src = candidates[index];
      return;
    }
    image.replaceWith(createFaviconFallback(bookmark));
  });
}

function getBookmarkFallbackLetter(bookmark) {
  return (bookmark.domain || bookmark.title || "?").charAt(0).toUpperCase();
}

function getBookmarkFallbackColor(seed) {
  const value = String(seed || "?");
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `hsl(${hash % 360} 34% 34%)`;
}

function renderGroupIconChip(group, options = {}) {
  const className = options.className
    ? `group-icon ${options.className}`
    : "group-icon";
  const entry =
    groupIconManifest?.[group.icon] || groupIconManifest?.fallback || null;
  const iconMarkup = entry ? renderGroupSvg(entry) : `<span class="group-icon-dot"></span>`;
  return `<span class="${className}" style="--group-color:${escapeAttribute(group.color)}">${iconMarkup}</span>`;
}

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
      (response) => response.text(),
    );
    const start = text.indexOf(GROUP_ICON_MANIFEST_ASSIGNMENT);
    const end = text.lastIndexOf(";");
    if (start === -1 || end === -1 || end <= start) return {};
    return JSON.parse(
      text.slice(start + GROUP_ICON_MANIFEST_ASSIGNMENT.length, end),
    );
  } catch {
    return {};
  }
}

function renderGroupSvg(entry) {
  const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
  return `<svg class="group-icon-svg" viewBox="${escapeAttribute(entry.viewBox || "0 0 24 24")}" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true">${nodes
    .map((node) => renderSvgNode(node))
    .join("")}</svg>`;
}

function renderSvgNode(node) {
  if (!node || typeof node.tag !== "string" || !node.attrs) return "";
  return `<${node.tag}${renderSvgAttrs(node.attrs)}></${node.tag}>`;
}

function renderSvgAttrs(attrs) {
  return Object.entries(attrs)
    .map(
      ([key, value]) => ` ${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}="${escapeAttribute(String(value))}"`,
    )
    .join("");
}

function renderSkeleton() {
  return `<div class="skeleton-list">${Array.from({ length: 5 }, () => `<div class="skeleton-row"><span class="skeleton skeleton-icon"></span><span class="skeleton skeleton-text"></span></div>`).join("")}</div>`;
}

function renderState(icon, title, copy, action) {
  return `<div class="state"><span class="state-icon">${icon}</span><div class="state-title">${escapeHtml(title)}</div><div class="state-copy">${escapeHtml(copy)}</div>${action ? `<button class="state-action" type="button">${escapeHtml(action)}</button>` : ""}</div>`;
}

function htmlToNode(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild;
}

function activateGroup(groupId, index, options = {}) {
  clearTimeout(submenuCloseTimer);
  state.activeGroupId = groupId;
  state.activeList = options.focusBookmarks ? "group" : "groups";
  state.activeIndex = options.focusBookmarks ? getFirstBookmarkIndex(groupId) : index;
  updateActiveRows();
  refs.submenu.dataset.open = "true";
  if (!state.bookmarksByGroup.has(groupId)) {
    void loadBookmarks(groupId);
  } else {
    renderSubmenu();
  }
}

function handleGroupRowFocus(groupId, index) {
  clearVirtualActiveDescendant();
  state.activeList = "groups";
  state.activeIndex = index;
  if (state.activeGroupId === groupId) {
    refs.submenu.dataset.open = "true";
  }
  updateActiveRows();
}

function positionSubmenu() {
  if (!state.activeGroupId || !state.menuOpen || !refs.panel || !refs.menu || !refs.submenu) return;
  const activeRow = refs.panel.querySelector(
    `[data-group-id="${cssEscape(state.activeGroupId)}"]`,
  );
  if (!activeRow) return;
  const menuRect = refs.menu.getBoundingClientRect();
  const rowRect = activeRow.getBoundingClientRect();
  const submenuRect = refs.submenu.getBoundingClientRect();
  const submenuWidth = Math.min(
    SUBMENU_WIDTH,
    window.innerWidth - SUBMENU_VIEWPORT_GAP * 2,
  );
  const viewportBottom = window.innerHeight - SUBMENU_VIEWPORT_GAP;
  const idealTop = Math.max(
    SUBMENU_VIEWPORT_GAP,
    rowRect.top - SUBMENU_ANCHOR_RISE,
  );
  const submenuHeight = Math.min(
    refs.submenu.scrollHeight || submenuRect.height || 0,
    window.innerHeight - SUBMENU_VIEWPORT_GAP * 2,
  );
  const shouldFlipLeft =
    window.innerWidth - menuRect.right < submenuWidth + SUBMENU_EDGE_GAP * 2;

  refs.submenu.dataset.side = shouldFlipLeft ? "left" : "right";
  refs.submenu.style.left = shouldFlipLeft
    ? `${Math.max(SUBMENU_VIEWPORT_GAP, menuRect.left - submenuWidth - SUBMENU_EDGE_GAP)}px`
    : `${Math.min(window.innerWidth - submenuWidth - SUBMENU_VIEWPORT_GAP, menuRect.right + SUBMENU_EDGE_GAP)}px`;
  refs.submenu.style.top = `${Math.max(
    SUBMENU_VIEWPORT_GAP,
    Math.min(viewportBottom - submenuHeight, idealTop),
  )}px`;
}

function syncSubmenuPosition() {
  if (!refs.submenu) return;
  positionSubmenu();
  requestAnimationFrame(() => {
    if (!state.menuOpen || refs.submenu?.dataset.open !== "true") return;
    positionSubmenu();
  });
}

function shouldDeferGroupActivation(event, nextGroupId) {
  if (
    !state.activeGroupId ||
    state.activeGroupId === nextGroupId ||
    refs.submenu.dataset.open !== "true" ||
    state.searchQuery.length >= 2
  ) {
    return false;
  }

  const activeRow = refs.panel.querySelector(
    `[data-group-id="${cssEscape(state.activeGroupId)}"]`,
  );
  if (!activeRow) return false;

  const rowRect = activeRow.getBoundingClientRect();
  const submenuRect = refs.submenu.getBoundingClientRect();
  return isPointInSubmenuSafeTriangle(
    event.clientX,
    event.clientY,
    rowRect,
    submenuRect,
  );
}

function isPointInSubmenuSafeTriangle(x, y, rowRect, submenuRect) {
  const pad = SUBMENU_SAFE_TRIANGLE_PADDING;
  const submenuIsLeft = submenuRect.right <= rowRect.left;
  const startX = submenuIsLeft ? rowRect.left : rowRect.right;
  const endX = submenuIsLeft ? submenuRect.right : submenuRect.left;
  const triangle = submenuIsLeft
    ? [
        { x: startX, y: rowRect.top - pad },
        { x: startX, y: rowRect.bottom + pad },
        { x: endX, y: submenuRect.top - pad },
        { x: endX, y: submenuRect.bottom + pad },
      ]
    : [
        { x: startX, y: rowRect.top - pad },
        { x: endX, y: submenuRect.top - pad },
        { x: endX, y: submenuRect.bottom + pad },
        { x: startX, y: rowRect.bottom + pad },
      ];

  return isPointInPolygon({ x, y }, triangle);
}

function isPointInPolygon(point, polygon) {
  let inside = false;
  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function closeSubmenu() {
  const previousGroupId = state.activeGroupId;
  if (state.activeList === "group") {
    const groupIndex = state.groups.findIndex(
      (group) => group.id === previousGroupId,
    );
    state.activeList = "groups";
    state.activeIndex = groupIndex >= 0 ? groupIndex : null;
  }
  state.activeGroupId = null;
  refs.submenu.dataset.open = "false";
  updateActiveRows();
}

function closeSubmenuIfSearching() {
  if (state.searchQuery.length >= 2) {
    closeSubmenu();
  }
}

function updateActiveRows() {
  shadow.querySelectorAll("[data-index]").forEach((node) => {
    let isActive;
    if (
      node.dataset.source === "groups" &&
      state.searchQuery.length < 2
    ) {
      node.setAttribute(
        "aria-expanded",
        String(state.activeGroupId === node.dataset.groupId),
      );
      isActive = isGroupActive(node.dataset.groupId, Number(node.dataset.index));
      node.dataset.active = String(isActive);
      updateGroupSurfaceState(node, isActive);
      return;
    }
    isActive =
      node.dataset.source === state.activeList &&
      state.activeIndex !== null &&
      Number(node.dataset.index) === state.activeIndex;
    node.dataset.active = String(isActive);
    updateGroupSurfaceState(node, isActive);
  });
  syncVirtualActiveDescendant();
}

function isGroupActive(groupId, index) {
  if (state.searchQuery.length >= 2) {
    return false;
  }

  if (state.activeGroupId) {
    return groupId === state.activeGroupId;
  }

  return (
    state.activeList === "groups" &&
    state.activeIndex !== null &&
    index === state.activeIndex
  );
}

function updateGroupSurfaceState(node, isActive) {
  if (!node.classList?.contains("row-button")) return;
  const surface = node.closest(".group-row-surface");
  if (surface) {
    surface.dataset.active = String(isActive);
  }
}

function handleGroupListScroll() {
  if (Date.now() < ignoreGroupListScrollUntil) return;
  if (!state.activeGroupId || !state.menuOpen) return;
  closeSubmenu();
}

function handleSearchKeyDown(event) {
  if (!state.menuOpen) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveVirtualCursor(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveVirtualCursor(-1);
  } else if (event.key === "ArrowRight") {
    if (
      state.searchQuery.length < 2 &&
      state.activeList === "groups" &&
      state.activeIndex !== null &&
      state.groups[state.activeIndex]
    ) {
      event.preventDefault();
      const group = state.groups[state.activeIndex];
      activateGroup(group.id, state.activeIndex, { focusBookmarks: true });
    }
  } else if (event.key === "ArrowLeft") {
    if (state.searchQuery.length < 2 && state.activeList === "group") {
      event.preventDefault();
      closeSubmenu();
    }
  } else if (event.key === "Tab") {
    if (!event.shiftKey && state.activeIndex !== null) {
      const activeRow = getVirtualActiveElement();
      if (activeRow) {
        event.preventDefault();
        clearVirtualActiveDescendant();
        activeRow.focus({ preventScroll: true });
      }
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    activateCurrentItem();
  } else if (event.key === "Escape") {
    event.preventDefault();
    if (state.searchQuery) {
      state.searchQuery = "";
      state.activeList = "groups";
      state.activeIndex = null;
      refs.search.value = "";
      clearVirtualActiveDescendant();
      renderPanel();
    } else if (state.activeGroupId) {
      closeSubmenu();
    } else {
      closeMenu();
    }
  }
}

function getCurrentItems() {
  if (state.searchQuery.length >= 2) return state.searchResults;
  if (state.activeList === "group" && state.activeGroupId) {
    return state.bookmarksByGroup.get(state.activeGroupId) || [];
  }
  return state.groups;
}

function moveVirtualCursor(direction) {
  const items = getCurrentItems();
  if (items.length === 0) return;

  if (state.activeIndex === null) {
    if (direction > 0) {
      state.activeIndex = 0;
      updateActiveRows();
    }
    return;
  }

  const nextIndex = clampNumber(
    state.activeIndex + direction,
    0,
    items.length - 1,
  );
  if (nextIndex === state.activeIndex) return;
  state.activeIndex = nextIndex;
  updateActiveRows();
}

function activateCurrentItem() {
  if (state.activeIndex === null) return;
  if (state.searchQuery.length >= 2) {
    const bookmark = state.searchResults[state.activeIndex];
    if (bookmark) openBookmark(bookmark);
    return;
  }
  if (state.activeList === "group" && state.activeGroupId) {
    const bookmark = state.bookmarksByGroup.get(state.activeGroupId)?.[
      state.activeIndex
    ];
    if (bookmark) openBookmark(bookmark);
    return;
  }
  const group = state.groups[state.activeIndex];
  if (group) activateGroup(group.id, state.activeIndex);
}

async function openBookmark(bookmark) {
  await sendMessage({
    type: "rewayAccessOpenBookmark",
    bookmarkId: bookmark.id,
    url: bookmark.url,
  });
  closeMenu();
}

function isOpenGroupArmed(groupId) {
  return state.armedOpenGroupIds.has(groupId);
}

function handleFocusableRowKeyDown(event) {
  if (!state.menuOpen) return;
  if (
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowRight" &&
    event.key !== "ArrowLeft" &&
    event.key !== "Escape"
  ) {
    return;
  }

  if (!refs.search) return;
  event.preventDefault();
  event.stopPropagation();
  refs.search.focus({ preventScroll: true });
  handleSearchKeyDown(event);
}

function getGroupRowId(groupId) {
  return `${GROUP_ROW_ID_PREFIX}-${toDomIdPart(groupId)}`;
}

function getBookmarkRowId(bookmark, source, index) {
  const sourceKey =
    source === "group" && state.activeGroupId
      ? `${source}-${state.activeGroupId}`
      : source;
  const bookmarkKey = bookmark?.id || bookmark?.url || index;
  return `${BOOKMARK_ROW_ID_PREFIX}-${toDomIdPart(sourceKey)}-${toDomIdPart(bookmarkKey)}`;
}

function toDomIdPart(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function getVirtualActiveElement() {
  if (!shadow || state.activeIndex === null) return null;
  return shadow.querySelector(
    `[data-source="${cssEscape(state.activeList)}"][data-index="${state.activeIndex}"]`,
  );
}

function syncVirtualActiveDescendant() {
  if (!refs.search) return;
  if (shadow?.activeElement !== refs.search || state.activeIndex === null) {
    clearVirtualActiveDescendant();
    return;
  }

  const activeElement = getVirtualActiveElement();
  if (!activeElement?.id) {
    clearVirtualActiveDescendant();
    return;
  }

  refs.search.setAttribute("aria-activedescendant", activeElement.id);
}

function clearVirtualActiveDescendant() {
  refs.search?.removeAttribute("aria-activedescendant");
}

function getFirstBookmarkIndex(groupId) {
  const bookmarks = state.bookmarksByGroup.get(groupId) || [];
  return bookmarks.length > 0 ? 0 : null;
}

function armOpenGroupConfirmation(groupId) {
  disarmOpenGroupConfirmation(groupId, { rerender: false });
  state.armedOpenGroupIds.add(groupId);
  const timerId = setTimeout(() => {
    disarmOpenGroupConfirmation(groupId);
  }, 2500);
  openGroupConfirmTimers.set(groupId, timerId);
  renderPanel();
}

function disarmOpenGroupConfirmation(groupId, options = {}) {
  const { rerender = true } = options;
  const timerId = openGroupConfirmTimers.get(groupId);
  if (timerId) {
    clearTimeout(timerId);
    openGroupConfirmTimers.delete(groupId);
  }
  if (!state.armedOpenGroupIds.delete(groupId)) return;
  if (rerender && state.menuOpen && state.searchQuery.length < 2) {
    renderPanel();
  }
}

function clearAllOpenGroupConfirmations(options = {}) {
  const { rerender = true } = options;
  for (const timerId of openGroupConfirmTimers.values()) {
    clearTimeout(timerId);
  }
  openGroupConfirmTimers.clear();
  if (state.armedOpenGroupIds.size === 0) return;
  state.armedOpenGroupIds.clear();
  if (rerender && state.menuOpen && state.searchQuery.length < 2) {
    renderPanel();
  }
}

async function openConfirmedGroup(group) {
  disarmOpenGroupConfirmation(group.id, { rerender: false });
  let bookmarks = state.bookmarksByGroup.get(group.id);
  if (!bookmarks) {
    const response = await sendMessage({
      type: "rewayAccessGetGroupBookmarks",
      groupId: group.id,
    });
    bookmarks = normalizeBookmarks(response?.bookmarks || []);
    state.bookmarksByGroup.set(group.id, bookmarks);
  }
  if (!bookmarks.length) {
    renderPanel();
    return;
  }
  await sendMessage({
    type: "rewayAccessOpenGroup",
    groupId: group.id,
    urls: bookmarks.map((bookmark) => bookmark.url),
  });
  closeMenu();
}

async function openLogin() {
  const response = await sendMessage({ type: "rewayAccessGetLoginUrl" });
  if (response?.url) {
    await sendMessage({ type: "rewayAccessOpenBookmark", url: response.url });
  }
}

function handleRuntimeMessage(message) {
  if (message?.type === "rewayAccessGroupsUpdated") {
    state.groups = normalizeGroups(message.groups || []);
    state.groupsStatus = "ready";
    if (groupIconManifest) {
      renderPanel();
    } else {
      void ensureGroupIconManifest().then(renderPanel);
    }
  }

  if (message?.type === "rewayAccessBookmarksUpdated") {
    const groupId = message.groupId || NO_GROUP_ID;
    state.bookmarksByGroup.set(
      groupId,
      normalizeBookmarks(message.bookmarks || []),
    );
    state.bookmarksStatusByGroup.set(groupId, "ready");
    if (state.activeGroupId === groupId) {
      renderSubmenu();
    }
  }

  if (message?.type === "rewayAccessCommandOpen") {
    if (refs.fab) openMenu({ focusSearch: true });
  }
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    if (!ensureLiveExtensionContext()) {
      reject(new Error("Extension context invalidated"));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          const error = new Error(runtimeError.message);
          if (isInvalidExtensionContextError(error)) {
            cleanupQuickAccess();
          }
          reject(error);
          return;
        }
        if (response?.ok === false || response?.success === false) {
          const errorPayload =
            response?.error && typeof response.error === "object"
              ? response.error
              : { message: response?.error || "Request failed" };
          const error = new Error(errorPayload.message || "Request failed");
          error.status = errorPayload.status ?? response.status;
          error.code = errorPayload.code;
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      if (isInvalidExtensionContextError(error)) {
        cleanupQuickAccess();
      }
      reject(error);
    }
  });
}

async function safeStorageLocalSet(value) {
  if (!ensureLiveExtensionContext()) return;
  try {
    await chrome.storage.local.set(value);
  } catch (error) {
    if (isInvalidExtensionContextError(error)) {
      cleanupQuickAccess();
    }
  }
}

function ensureLiveExtensionContext() {
  if (isExtensionContextValid()) return true;
  cleanupQuickAccess();
  return false;
}

function isExtensionContextValid() {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

function isInvalidExtensionContextError(error) {
  return String(error?.message || error)
    .toLowerCase()
    .includes("extension context invalidated");
}

function cleanupQuickAccess() {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  clearTimeout(submenuCloseTimer);
  clearTimeout(searchTimer);
  clearTimeout(introTimer);
  clearTimeout(menuResizeTimer);
  clearTimeout(deferredPanelTimer);
  detachMenuResizeObserver();
  clearAllOpenGroupConfirmations({ rerender: false });
  if (dragFrame) {
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
  }

  lifecycleController?.abort();
  lifecycleController = null;

  const fab = refs.fab;
  if (fab) {
    fab.style.transform = "";
    fab.dataset.dragging = "false";
    fab.removeEventListener("pointermove", moveDrag);
    fab.removeEventListener("pointerup", endDrag);
    fab.removeEventListener("pointercancel", endDrag);
  }

  dragState = null;
  pendingQuickAccessOpen = false;
  state.menuOpen = false;
  refs = {};
  shadow = null;
  host?.remove();
  host = null;
}

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}
