import { apiFetch, getSettings } from "./js/api.js";

const GROUP_CACHE_TTL = 5 * 60 * 1000;
const LAST_GROUP_KEY = "rewayAccessLastGroup";

const state = {
  groups: [],
  groupsReady: false,
  selectedGroupId: "",
  selectedGroupName: "",
  hiddenHosts: [],
  settingsOpen: false,
};

let currentEnv = "prod";

// ── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabUrl = tab?.url || "";
  const isHttpPage = tabUrl.startsWith("http://") || tabUrl.startsWith("https://");

  if (isHttpPage) {
    const { rewayAccessFabEnabled, rewayAccessFabHiddenHosts } =
      await chrome.storage.local.get(["rewayAccessFabEnabled", "rewayAccessFabHiddenHosts"]);
    const fabEnabled = rewayAccessFabEnabled !== false;
    const hiddenHosts = Array.isArray(rewayAccessFabHiddenHosts) ? rewayAccessFabHiddenHosts : [];
    let tabHost = "";
    try { tabHost = new URL(tabUrl).hostname.toLowerCase(); } catch {}
    const isHiddenHost = hiddenHosts.some((h) => h.toLowerCase() === tabHost);

    if (fabEnabled && !isHiddenHost) {
      try { await chrome.tabs.sendMessage(tab.id, { type: "rewayOpenFab" }); } catch {}
      window.close();
      return;
    }

    // FAB disabled or hidden on this host — pre-fill URL and show popup
    document.getElementById("save-url").value = tabUrl;
    const noticeEl = document.getElementById("notice");
    noticeEl.textContent = isHiddenHost
      ? `Reway is hidden on ${tabHost}.`
      : "The Reway button is disabled. You can still save here.";
    noticeEl.hidden = false;
  } else {
    const noticeEl = document.getElementById("notice");
    noticeEl.textContent = "Reway can't access this page type.";
    noticeEl.hidden = false;
  }

  bindEvents();
  void hydrateGroups();
  void hydrateAccessSettings();
  void hydrateEnvironment();

  document.getElementById("shell").style.opacity = "1";
  if (!isHttpPage) document.getElementById("save-url").focus();
});

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById("settings-btn").addEventListener("click", toggleSettings);

  const groupBtn = document.getElementById("group-btn");
  const groupMenu = document.getElementById("group-menu");
  groupBtn.addEventListener("click", () => {
    if (groupMenu.hidden) openGroupMenu();
    else closeGroupMenu();
  });
  document.addEventListener("click", (e) => {
    if (!groupBtn.contains(e.target) && !groupMenu.contains(e.target)) closeGroupMenu();
  });

  document.getElementById("save-url").addEventListener("input", updateSaveButton);
  document.getElementById("save-url").addEventListener("paste", () => setTimeout(updateSaveButton, 0));
  document.getElementById("save-btn").addEventListener("click", handleSave);

  document.getElementById("library-btn").addEventListener("click", async () => {
    const { baseUrl } = await getSettings();
    chrome.tabs.create({ url: baseUrl });
  });

  document.getElementById("fab-toggle").addEventListener("change", () => persistSettings({ silent: true }));
  document.getElementById("x-toggle").addEventListener("change", () => persistSettings({ silent: true }));

  document.getElementById("add-host-btn").addEventListener("click", addHiddenHost);
  document.getElementById("host-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addHiddenHost(); }
  });

  const advancedToggle = document.getElementById("advanced-toggle");
  advancedToggle.addEventListener("click", () => {
    const open = advancedToggle.getAttribute("aria-expanded") === "true";
    advancedToggle.setAttribute("aria-expanded", String(!open));
    document.getElementById("advanced-panel").hidden = open;
  });

  document.getElementById("env-prod").addEventListener("click", () => switchEnv("prod"));
  document.getElementById("env-local").addEventListener("click", () => switchEnv("local"));
  document.getElementById("apply-env-btn").addEventListener("click", applyEnvironment);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!document.getElementById("group-menu").hidden) closeGroupMenu();
      else if (state.settingsOpen) toggleSettings();
    }
  });
}

// ── Settings panel ────────────────────────────────────────────────────────────

function toggleSettings() {
  state.settingsOpen = !state.settingsOpen;
  const shell = document.getElementById("shell");
  shell.toggleAttribute("data-settings-open", state.settingsOpen);
  document.getElementById("settings-btn").setAttribute("aria-expanded", String(state.settingsOpen));
  document.getElementById("main-view").hidden = state.settingsOpen;
  document.getElementById("settings-view").hidden = !state.settingsOpen;
}

// ── Group picker ──────────────────────────────────────────────────────────────

function openGroupMenu() {
  if (!state.groups.length) return;
  const groupMenu = document.getElementById("group-menu");
  groupMenu.hidden = false;
  document.getElementById("group-btn").setAttribute("aria-expanded", "true");
  groupMenu.querySelector("[aria-selected='true']")?.focus();
}

function closeGroupMenu() {
  document.getElementById("group-menu").hidden = true;
  document.getElementById("group-btn").setAttribute("aria-expanded", "false");
}

function renderGroupMenu() {
  const menu = document.getElementById("group-menu");
  menu.innerHTML = "";
  state.groups.forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "group-option";
    btn.setAttribute("role", "option");
    btn.setAttribute("aria-selected", String(g.id === state.selectedGroupId));
    btn.dataset.groupId = g.id;
    const nameSpan = document.createElement("span");
    nameSpan.className = "group-option-name";
    nameSpan.textContent = g.name;
    const checkSpan = document.createElement("span");
    checkSpan.className = "group-option-check";
    checkSpan.setAttribute("aria-hidden", "true");
    checkSpan.textContent = "✓";
    btn.append(nameSpan, checkSpan);
    btn.addEventListener("click", () => {
      selectGroup(g.id, g.name);
      closeGroupMenu();
      document.getElementById("group-btn").focus();
    });
    menu.appendChild(btn);
  });
}

function selectGroup(id, name) {
  state.selectedGroupId = id;
  state.selectedGroupName = name;
  document.getElementById("group-label").textContent = name;
  void chrome.storage.local.set({ [LAST_GROUP_KEY]: id });
  updateSaveButton();
}

// ── Save ──────────────────────────────────────────────────────────────────────

function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

function updateSaveButton() {
  const url = document.getElementById("save-url").value.trim();
  const valid = isValidHttpUrl(url);
  const saveBtn = document.getElementById("save-btn");
  const saveLabel = document.getElementById("save-label");
  saveBtn.disabled = !valid || !state.groupsReady;
  if (valid && state.selectedGroupName) {
    saveLabel.textContent = `Save to ${state.selectedGroupName}`;
  } else {
    saveLabel.textContent = "Save";
  }
}

async function handleSave() {
  const url = document.getElementById("save-url").value.trim();
  if (!isValidHttpUrl(url)) return;

  const saveBtn = document.getElementById("save-btn");
  const saveStatus = document.getElementById("save-status");
  saveBtn.disabled = true;
  setStatus(saveStatus, "", "");

  try {
    const data = await apiFetch("/api/extension/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        url,
        title: "",
        description: "",
        faviconUrl: null,
        groupId: state.selectedGroupId || null,
      }),
    });

    if (data?.bookmark) void broadcastBookmark(data.bookmark);

    saveBtn.classList.add("is-success");
    document.getElementById("save-label").textContent = "Saved ✓";
    document.querySelector(".cta-star").style.display = "none";
    setTimeout(() => window.close(), 900);
  } catch (error) {
    saveBtn.disabled = false;
    if (error?.status === 401) {
      setStatus(saveStatus, "Sign in to Reway to save.", "error");
    } else if (error?.status === 409) {
      setStatus(saveStatus, "Already saved in this group.", "error");
    } else {
      setStatus(saveStatus, "Save failed. Try again.", "error");
    }
  }
}

async function broadcastBookmark(bookmark) {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({ url: `${settings.baseUrl}/*` });
  tabs.forEach((tab) => {
    chrome.tabs.sendMessage(tab.id, { type: "broadcastBookmark", bookmark }).catch(() => {});
  });
}

// ── Groups loading ────────────────────────────────────────────────────────────

async function hydrateGroups() {
  const keys = ["rewayGroups", "rewayGroupsFetchedAt", LAST_GROUP_KEY];
  const stored = await chrome.storage.local.get(keys);
  const cached = Array.isArray(stored.rewayGroups) ? stored.rewayGroups : [];
  const fetchedAt = typeof stored.rewayGroupsFetchedAt === "number" ? stored.rewayGroupsFetchedAt : 0;
  const freshEnough = Date.now() - fetchedAt < GROUP_CACHE_TTL;
  const lastGroup = stored[LAST_GROUP_KEY] || null;

  if (cached.length) applyGroups(cached, lastGroup);

  if (freshEnough && cached.length) return;

  try {
    const data = await apiFetch("/api/extension/groups");
    const groups = data.groups || [];
    await chrome.storage.local.set({ rewayGroups: groups, rewayGroupsFetchedAt: Date.now() });
    applyGroups(groups, lastGroup);
  } catch (error) {
    if (!cached.length) {
      const groupLabel = document.getElementById("group-label");
      groupLabel.textContent = error?.status === 401 ? "Sign in to load groups" : "Couldn't load groups";
      if (error?.status === 401) {
        setStatus(document.getElementById("save-status"), "Sign in to Reway to save bookmarks.", "error");
      }
    }
  }
}

function applyGroups(groups, lastGroupId) {
  state.groups = groups;
  state.groupsReady = true;

  const preferred = groups.find((g) => g.id === lastGroupId) || groups[0];
  if (preferred) {
    state.selectedGroupId = preferred.id;
    state.selectedGroupName = preferred.name;
    document.getElementById("group-label").textContent = preferred.name;
  } else {
    state.selectedGroupId = "";
    state.selectedGroupName = "";
    document.getElementById("group-label").textContent = "No group";
  }

  renderGroupMenu();
  updateSaveButton();
}

// ── Access settings ───────────────────────────────────────────────────────────

async function hydrateAccessSettings() {
  const { rewayAccessFabEnabled, rewayXAutoCaptureEnabled, rewayAccessFabHiddenHosts } =
    await chrome.storage.local.get([
      "rewayAccessFabEnabled",
      "rewayXAutoCaptureEnabled",
      "rewayAccessFabHiddenHosts",
    ]);

  document.getElementById("fab-toggle").checked = rewayAccessFabEnabled !== false;
  document.getElementById("x-toggle").checked = rewayXAutoCaptureEnabled !== false;

  const hosts = Array.isArray(rewayAccessFabHiddenHosts)
    ? rewayAccessFabHiddenHosts.flatMap((h) => normalizeHost(h) ? [normalizeHost(h)] : [])
    : [];
  state.hiddenHosts = [...new Set(hosts)].sort();
  renderHiddenHosts();
}

async function persistSettings({ silent = false } = {}) {
  try {
    await chrome.storage.local.set({
      rewayAccessFabEnabled: document.getElementById("fab-toggle").checked,
      rewayXAutoCaptureEnabled: document.getElementById("x-toggle").checked,
      rewayAccessFabHiddenHosts: [...state.hiddenHosts],
    });
    if (!silent) setStatus(document.getElementById("settings-status"), "Saved. Refresh pages to apply.", "success");
  } catch {
    setStatus(document.getElementById("settings-status"), "Couldn't save settings.", "error");
  }
}

function addHiddenHost() {
  const input = document.getElementById("host-input");
  const host = normalizeHost(input.value);
  const statusEl = document.getElementById("settings-status");
  if (!host) { setStatus(statusEl, "Enter a valid hostname.", "error"); return; }
  if (state.hiddenHosts.includes(host)) { setStatus(statusEl, "Already hidden.", "error"); return; }
  state.hiddenHosts = [...state.hiddenHosts, host].sort();
  input.value = "";
  setStatus(statusEl, "", "");
  renderHiddenHosts();
  void persistSettings({ silent: true });
}

function removeHiddenHost(host) {
  state.hiddenHosts = state.hiddenHosts.filter((h) => h !== host);
  renderHiddenHosts();
  void persistSettings({ silent: true });
}

function renderHiddenHosts() {
  const list = document.getElementById("host-list");
  const empty = document.getElementById("host-empty");
  list.innerHTML = "";
  empty.hidden = state.hiddenHosts.length > 0;

  state.hiddenHosts.forEach((host) => {
    const row = document.createElement("div");
    row.className = "host-row";
    row.setAttribute("role", "listitem");

    const name = document.createElement("span");
    name.className = "host-name";
    name.textContent = host;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "host-remove";
    btn.setAttribute("aria-label", `Remove ${host}`);
    btn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.25 4.25 11.75 11.75M11.75 4.25 4.25 11.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
    btn.addEventListener("click", () => removeHiddenHost(host));

    row.append(name, btn);
    list.append(row);
  });
}

// ── Environment ───────────────────────────────────────────────────────────────

async function hydrateEnvironment() {
  const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl");
  if (rewayBaseUrl?.includes("localhost")) {
    switchEnv("local");
    try { document.getElementById("local-port").value = new URL(rewayBaseUrl).port || "3000"; }
    catch { document.getElementById("local-port").value = "3000"; }
  } else {
    switchEnv("prod");
  }
}

function switchEnv(env) {
  currentEnv = env;
  document.getElementById("env-prod").classList.toggle("active", env === "prod");
  document.getElementById("env-local").classList.toggle("active", env === "local");
  document.getElementById("local-port-field").hidden = env !== "local";
}

async function applyEnvironment() {
  if (currentEnv === "prod") {
    await chrome.storage.local.remove("rewayBaseUrl");
  } else {
    const port = document.getElementById("local-port").value.trim() || "3000";
    await chrome.storage.local.set({ rewayBaseUrl: `http://localhost:${port}` });
  }
  window.location.reload();
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function setStatus(el, message, tone) {
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone || "";
}

function normalizeHost(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const hostname = parsed.hostname.trim().toLowerCase().replace(/\.$/, "");
    return hostname && !hostname.includes(" ") ? hostname : null;
  } catch { return null; }
}
