import { apiFetch, getSettings } from "./js/api.js"
import { MAX_NAME_LENGTH } from "./js/config.js"
import { loadGrabbedLinks, createGroupFromLinks } from "./js/grabber.js"
import { fetchPageMeta } from "./js/metadata.js"
import { loadTabSession, saveTabSession } from "./js/sessions.js"
import { elements, setStatus, switchTab, setLoading } from "./js/ui.js"

const destinationState = {
  save: { mode: "existing" },
  links: { mode: "existing" },
  session: { mode: "existing" },
}

const popupState = {
  groups: "loading",
  metadata: "loading",
}

const groupSelects = {}
const GROUP_CACHE_MAX_AGE_MS = 5 * 60 * 1000

function getNow() {
  return Date.now()
}

function isFreshTimestamp(timestamp) {
  return Number.isFinite(timestamp) && getNow() - timestamp < GROUP_CACHE_MAX_AGE_MS
}

async function readCachedGroups() {
  const { rewayGroups, rewayGroupsFetchedAt } = await chrome.storage.local.get([
    "rewayGroups",
    "rewayGroupsFetchedAt",
  ])

  return {
    groups: Array.isArray(rewayGroups) ? rewayGroups : [],
    fetchedAt: typeof rewayGroupsFetchedAt === "number" ? rewayGroupsFetchedAt : null,
  }
}

async function clearGroupCache() {
  await chrome.storage.local.remove(["rewayGroups", "rewayGroupsFetchedAt"])
}

function getFlowStatusTarget(flow) {
  return flow === "save" ? elements.status : document.getElementById(`${flow}-status`)
}

function setPopupHeader(mode) {
  const titleEl = document.getElementById("popup-header-title")
  const subtitleEl = document.getElementById("popup-header-subtitle")
  if (!titleEl || !subtitleEl) return

  if (mode === "auth") {
    titleEl.textContent = "Save to Reway"
    subtitleEl.textContent = "Log in to sync groups and keep capture fast"
    return
  }

  if (mode === "error") {
    titleEl.textContent = "Save to Reway"
    subtitleEl.textContent = "The popup is ready while Reway finishes reconnecting"
    return
  }

  titleEl.textContent = "Save to Reway"
  subtitleEl.textContent = "Pick the way you want to save."
}

function setButtonDisabled(button, disabled) {
  if (!button) return
  button.disabled = disabled
}

function getActionButtons() {
  return {
    save: elements.saveBookmarkBtn,
    links: document.getElementById("create-group-from-links"),
    session: document.getElementById("save-session"),
  }
}

function syncActionAvailability() {
  const buttons = getActionButtons()
  const groupsReady = popupState.groups === "ready"

  Object.keys(destinationState).forEach((flow) => {
    const button = buttons[flow]
    if (!button) return

    const requiresReadyGroups = !groupsReady
    setButtonDisabled(button, requiresReadyGroups)
  })
}

function updateStartupPanel() {
  const panel = document.getElementById("startup-panel")
  const title = document.getElementById("startup-panel-title")
  const message = document.getElementById("startup-panel-message")
  const loginButton = document.getElementById("login-button")
  const retryButton = document.getElementById("retry-startup")

  if (!panel || !title || !message || !loginButton || !retryButton) return

  if (popupState.groups === "auth_required") {
    panel.classList.remove("hidden")
    title.textContent = "Connect to Reway"
    message.textContent = "Log in to load your groups and start saving."
    loginButton.classList.remove("hidden")
    retryButton.classList.add("hidden")
    setPopupHeader("auth")
    return
  }

  if (popupState.groups === "error") {
    panel.classList.remove("hidden")
    title.textContent = "Groups are taking longer than expected"
    message.textContent = "You can keep preparing your save while Reway reconnects."
    loginButton.classList.add("hidden")
    retryButton.classList.remove("hidden")
    setPopupHeader("error")
    return
  }

  panel.classList.add("hidden")
  loginButton.classList.add("hidden")
  retryButton.classList.add("hidden")
  setPopupHeader("main")
}

function setSettingsPanelOpen(isOpen) {
  document.querySelector(".shell")?.classList.toggle("settings-open", isOpen)
  elements.devPanel?.classList.toggle("open", isOpen)
  elements.settingsToggle?.setAttribute("aria-expanded", String(isOpen))
  elements.settingsToggle?.setAttribute("aria-label", isOpen ? "Close settings" : "Open settings")
  elements.settingsToggle?.setAttribute("title", isOpen ? "Close settings" : "Settings")
}

function setAdvancedSettingsOpen(isOpen) {
  elements.advancedSettingsToggle?.setAttribute("aria-expanded", String(isOpen))
  elements.advancedSettingsPanel?.classList.toggle("hidden", !isOpen)
}

function setGroupUiState(flow, state, message = "") {
  const select = groupSelects[flow]
  const trigger = document.getElementById(`${flow}-group-trigger`)
  const statusTarget = getFlowStatusTarget(flow)
  const existingToggle = document.querySelector(
    `.destination-toggle-button[data-flow="${flow}"][data-mode="existing"]`,
  )
  const newToggle = document.querySelector(
    `.destination-toggle-button[data-flow="${flow}"][data-mode="new"]`,
  )

  let placeholder = flow === "save" ? "No group" : "Select a group"
  let disabled = false

  if (state === "loading") {
    placeholder = "Loading groups…"
    disabled = true
  } else if (state === "auth_required") {
    placeholder = "Log in to load groups"
    disabled = true
  } else if (state === "error") {
    placeholder = "Couldn’t load groups"
    disabled = true
  }

  select?.setDisabled(disabled)
  select?.setPlaceholder(placeholder)
  trigger?.setAttribute("aria-busy", String(state === "loading"))
  trigger?.setAttribute("data-loading", String(state === "loading"))

  if (existingToggle) {
    existingToggle.disabled = state !== "ready"
  }

  if (newToggle) {
    newToggle.disabled = state !== "ready"
  }

  setStatus(message, message ? "error" : "", statusTarget)
}

function applyGroupsState(state) {
  popupState.groups = state

  if (state === "loading") {
    ;["save", "links", "session"].forEach((flow) => setGroupUiState(flow, state))
  } else if (state === "auth_required") {
    ;["save", "links", "session"].forEach((flow) =>
      setGroupUiState(flow, state, "Log in to choose a group and save."),
    )
  } else if (state === "error") {
    ;["save", "links", "session"].forEach((flow) =>
      setGroupUiState(flow, state, "Couldn’t load groups right now. Try again."),
    )
  } else {
    ;["save", "links", "session"].forEach((flow) => setGroupUiState(flow, state))
  }

  updateStartupPanel()
  syncActionAvailability()
}

function setDestinationMode(flow, mode) {
  destinationState[flow].mode = mode

  document.querySelectorAll(`.destination-toggle-button[data-flow="${flow}"]`).forEach((button) => {
    const isActive = button.dataset.mode === mode
    button.classList.toggle("active", isActive)
    button.setAttribute("aria-pressed", String(isActive))
  })

  const existingField = document.getElementById(`${flow}-existing-group-field`)
  const newField = document.getElementById(`${flow}-new-group-field`)

  existingField?.classList.toggle("hidden", mode !== "existing")
  newField?.classList.toggle("hidden", mode !== "new")

  if (mode !== "existing") {
    groupSelects[flow]?.close()
  }

  setStatus("", "", getFlowStatusTarget(flow))

  if (popupState.groups !== "ready" && mode === "existing") {
    const stateMessage =
      popupState.groups === "auth_required"
        ? "Log in to choose a group and save."
        : popupState.groups === "error"
          ? "Couldn’t load groups right now. Try again."
          : ""
    setStatus(
      stateMessage,
      popupState.groups === "loading" ? "" : "error",
      getFlowStatusTarget(flow),
    )
  }

  syncActionAvailability()
}

function createGroupSelect(flow) {
  const trigger = document.getElementById(`${flow}-group-trigger`)
  const label = document.getElementById(`${flow}-group-label`)
  const menu = document.getElementById(`${flow}-group-menu`)
  const container = trigger?.closest(".select")
  const defaultPlaceholder = flow === "save" ? "No group" : "Select a group"

  if (!trigger || !label || !menu || !container) return null

  let options = []
  let selectedId = ""
  let disabled = false
  let placeholder = defaultPlaceholder

  const createCheckIcon = () => {
    const svgNs = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNs, "svg")
    svg.setAttribute("viewBox", "0 0 16 16")
    svg.setAttribute("fill", "none")
    svg.setAttribute("aria-hidden", "true")

    const path = document.createElementNS(svgNs, "path")
    path.setAttribute("d", "M3.75 8.25 6.6 11.1 12.25 5.45")
    path.setAttribute("stroke", "currentColor")
    path.setAttribute("stroke-width", "1.85")
    path.setAttribute("stroke-linecap", "round")
    path.setAttribute("stroke-linejoin", "round")

    svg.appendChild(path)
    return svg
  }

  const updateLabel = () => {
    const selected = options.find((option) => option.id === selectedId)
    label.textContent = selected?.name || placeholder
  }

  const renderOptions = () => {
    menu.replaceChildren()

    options.forEach((option, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "select-option"
      button.setAttribute("role", "option")
      button.setAttribute("tabindex", "-1")
      button.dataset.index = String(index)
      button.dataset.groupId = option.id
      const isSelected = option.id === selectedId
      button.setAttribute("aria-selected", String(isSelected))
      button.dataset.selected = String(isSelected)

      if (isSelected) {
        button.classList.add("active")
      }

      const text = document.createElement("span")
      text.className = "select-option-text"
      text.textContent = option.name

      const check = document.createElement("span")
      check.className = "select-option-check"
      check.appendChild(createCheckIcon())

      button.appendChild(text)
      button.appendChild(check)

      button.addEventListener("click", () => {
        selectedId = option.id
        updateLabel()
        renderOptions()
        close()
        trigger.focus()
      })

      menu.appendChild(button)
    })
  }

  const close = () => {
    container.classList.remove("open")
    trigger.setAttribute("aria-expanded", "false")
  }

  const focusSelectedOrFirst = () => {
    const activeOption =
      menu.querySelector(".select-option.active") || menu.querySelector(".select-option")
    activeOption?.focus()
  }

  const open = () => {
    if (disabled || options.length === 0) return
    container.classList.add("open")
    trigger.setAttribute("aria-expanded", "true")
    focusSelectedOrFirst()
  }

  const toggle = () => {
    if (disabled) return

    if (container.classList.contains("open")) {
      close()
      return
    }

    Object.values(groupSelects).forEach((select) => select?.close())
    open()
  }

  trigger.addEventListener("click", toggle)
  trigger.addEventListener("keydown", (event) => {
    if (disabled) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggle()
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!container.classList.contains("open")) {
        open()
      } else {
        const first = menu.querySelector(".select-option")
        first?.focus()
      }
    }
  })

  container.addEventListener("keydown", (event) => {
    const optionElements = Array.from(menu.querySelectorAll(".select-option"))
    const currentIndex = optionElements.indexOf(document.activeElement)

    if (event.key === "Escape") {
      close()
      trigger.focus()
      return
    }

    if (event.key === "ArrowDown" && optionElements.length > 0) {
      event.preventDefault()
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % optionElements.length
      optionElements[nextIndex]?.focus()
    }

    if (event.key === "ArrowUp" && optionElements.length > 0) {
      event.preventDefault()
      const prevIndex =
        currentIndex < 0
          ? optionElements.length - 1
          : (currentIndex - 1 + optionElements.length) % optionElements.length
      optionElements[prevIndex]?.focus()
    }
  })

  updateLabel()

  return {
    close,
    setDisabled(nextDisabled) {
      disabled = nextDisabled
      trigger.disabled = nextDisabled
      if (nextDisabled) {
        close()
      }
    },
    setPlaceholder(nextPlaceholder) {
      placeholder = nextPlaceholder || defaultPlaceholder
      updateLabel()
    },
    setOptions(groups) {
      options =
        flow === "save"
          ? [
              { id: "", name: "No group" },
              ...groups.map((group) => ({ id: group.id, name: group.name })),
            ]
          : groups.map((group) => ({ id: group.id, name: group.name }))
      if (!options.some((option) => option.id === selectedId)) {
        selectedId = ""
      }
      updateLabel()
      renderOptions()
    },
    getValue() {
      return selectedId
    },
  }
}

function setupGroupSelects() {
  ;["save", "links", "session"].forEach((flow) => {
    groupSelects[flow] = createGroupSelect(flow)
  })

  document.addEventListener("click", (event) => {
    Object.entries(groupSelects).forEach(([flow, select]) => {
      const container = document.getElementById(`${flow}-group-trigger`)?.closest(".select")
      if (container && !container.contains(event.target)) {
        select?.close()
      }
    })
  })
}

function renderGroups(groups) {
  Object.values(groupSelects).forEach((select) => select?.setOptions(groups))
}

async function createGroup(name) {
  const data = await apiFetch("/api/extension/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  })

  return data.group?.id || null
}

async function broadcastBookmark(bookmark) {
  const settings = await getSettings()
  const dashboardTabs = await chrome.tabs.query({
    url: `${settings.baseUrl}/*`,
  })

  dashboardTabs.forEach((tab) => {
    chrome.tabs
      .sendMessage(tab.id, {
        type: "broadcastBookmark",
        bookmark,
      })
      .catch(() => {})
  })
}

async function saveBookmark() {
  const statusTarget = elements.status
  const mode = destinationState.save.mode
  const existingGroupId = groupSelects.save?.getValue() || ""
  const newGroupName = document.getElementById("save-group-name")?.value.trim() || ""

  if (mode === "existing" && popupState.groups !== "ready") {
    setStatus("Wait for your groups to finish loading.", "error", statusTarget)
    return
  }

  if (mode === "new" && popupState.groups !== "ready") {
    setStatus("Finish reconnecting to Reway before creating a group.", "error", statusTarget)
    return
  }

  if (mode === "new" && !newGroupName) {
    setStatus("Enter a new group name", "error", statusTarget)
    return
  }

  setLoading(elements.saveBookmarkBtn, true, "Saving")

  try {
    let groupId = null

    if (mode === "existing") {
      groupId = existingGroupId
    } else if (mode === "new") {
      try {
        groupId = await createGroup(newGroupName)
      } catch (error) {
        setLoading(elements.saveBookmarkBtn, false, "Save Page")

        if (error?.status === 409) {
          setStatus(
            "A group with this name already exists. Switch to Existing group.",
            "error",
            statusTarget,
          )
          return
        }

        if (error?.status === 401) {
          await handleAuthRequired({
            flow: "save",
            message: "Log in to create a group and save.",
          })
          return
        }

        setStatus("Failed to create group", "error", statusTarget)
        return
      }
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const payload = {
      url: tab.url,
      title: elements.title.value.trim(),
      description: elements.description.value.trim(),
      groupId,
    }

    const data = await apiFetch("/api/extension/bookmarks", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (data?.bookmark) {
      await broadcastBookmark(data.bookmark)
    }

    elements.saveBookmarkBtn.classList.add("success")
    setLoading(elements.saveBookmarkBtn, false, "Saved")
    setTimeout(() => window.close(), 800)
  } catch (error) {
    setLoading(elements.saveBookmarkBtn, false, "Save Page")

    if (error?.status === 401) {
      await handleAuthRequired({
        flow: "save",
        message: "Log in to keep saving to Reway.",
      })
      return
    }

    if (error?.status === 400) {
      await handleInvalidGroup({
        flow: "save",
        message: "That group is no longer available. Refreshing your groups now.",
      })
      return
    }

    if (error?.status === 409) {
      setStatus(
        mode === "existing"
          ? "This bookmark couldn't be saved because of a conflicting record in this group"
          : "This bookmark couldn't be saved because of a conflicting record",
        "error",
        statusTarget,
      )
      return
    }

    setStatus("Failed to save", "error", statusTarget)
  }
}

let currentDevEnv = "prod"
const accessSettingsDraft = {
  enabled: true,
  xAutoCaptureEnabled: true,
  hiddenHosts: [],
  editingIndex: null,
  savedEnabled: true,
  savedXAutoCaptureEnabled: true,
  savedHiddenHosts: [],
}

function switchEnv(env) {
  currentDevEnv = env
  const isProd = env === "prod"
  elements.envProd?.classList.toggle("active", env === "prod")
  elements.envLocal?.classList.toggle("active", env === "local")
  elements.localPortField.classList.toggle("hidden", isProd)
}

async function handleSaveDevSettings() {
  if (currentDevEnv === "prod") {
    await chrome.storage.local.remove("rewayBaseUrl")
  } else {
    const port = elements.localPort.value.trim() || "3000"
    await chrome.storage.local.set({
      rewayBaseUrl: `http://localhost:${port}`,
    })
  }
  window.location.reload()
}

async function hydrateEnvironmentControls() {
  const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl")

  if (rewayBaseUrl && rewayBaseUrl.includes("localhost")) {
    switchEnv("local")
    try {
      elements.localPort.value = new URL(rewayBaseUrl).port || "3000"
    } catch {
      elements.localPort.value = "3000"
    }
    return
  }

  switchEnv("prod")
}

function normalizeHostInput(value) {
  const raw = String(value || "").trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`)
    const hostname = parsed.hostname.trim().toLowerCase().replace(/\.$/, "")
    if (!hostname || hostname.includes(" ")) return null
    return hostname
  } catch {
    return null
  }
}

function areAccessSettingsDirty() {
  if (accessSettingsDraft.enabled !== accessSettingsDraft.savedEnabled) return true
  if (accessSettingsDraft.xAutoCaptureEnabled !== accessSettingsDraft.savedXAutoCaptureEnabled) {
    return true
  }
  if (accessSettingsDraft.hiddenHosts.length !== accessSettingsDraft.savedHiddenHosts.length) {
    return true
  }
  return accessSettingsDraft.hiddenHosts.some(
    (host, index) => host !== accessSettingsDraft.savedHiddenHosts[index],
  )
}

function setAccessSettingsStatus(message, tone = "") {
  setStatus(message, tone, elements.accessSettingsStatus)
}

function updateAccessSettingsControls() {
  const dirty = areAccessSettingsDirty()
  if (elements.saveAccessSettings) {
    elements.saveAccessSettings.disabled = !dirty
  }
  if (elements.cancelAccessSettings) {
    elements.cancelAccessSettings.disabled = !dirty
  }
}

function renderHiddenHosts() {
  if (!elements.hiddenHostList || !elements.hiddenHostEmpty) return

  elements.hiddenHostList.replaceChildren()
  elements.hiddenHostEmpty.classList.toggle("hidden", accessSettingsDraft.hiddenHosts.length > 0)

  accessSettingsDraft.hiddenHosts.forEach((host, index) => {
    const row = document.createElement("div")
    row.className = "hidden-host-row"
    row.setAttribute("role", "listitem")

    const name = document.createElement("span")
    name.className = "hidden-host-name"
    name.textContent = host

    const actions = document.createElement("span")
    actions.className = "hidden-host-actions"

    const edit = document.createElement("button")
    edit.type = "button"
    edit.className = "ghost icon-button tiny-icon-button"
    edit.setAttribute("aria-label", `Edit ${host}`)
    edit.title = "Edit"
    edit.innerHTML = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.25 11.75 3 13l1.25-.25 7.45-7.45a1.45 1.45 0 0 0-2.05-2.05L3.25 9.65v2.1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`
    edit.addEventListener("click", () => {
      accessSettingsDraft.editingIndex = index
      elements.hiddenHostInput.value = host
      elements.hiddenHostInput.focus()
      elements.addHiddenHost.title = "Save hidden host"
      elements.addHiddenHost.setAttribute("aria-label", "Save hidden host")
      setAccessSettingsStatus("")
    })

    const remove = document.createElement("button")
    remove.type = "button"
    remove.className = "ghost icon-button tiny-icon-button"
    remove.setAttribute("aria-label", `Remove ${host}`)
    remove.title = "Remove"
    remove.innerHTML = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.25 4.25 11.75 11.75M11.75 4.25 4.25 11.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`
    remove.addEventListener("click", () => {
      accessSettingsDraft.hiddenHosts = accessSettingsDraft.hiddenHosts.filter(
        (_, i) => i !== index,
      )
      if (accessSettingsDraft.editingIndex === index) {
        accessSettingsDraft.editingIndex = null
        elements.hiddenHostInput.value = ""
        elements.addHiddenHost.title = "Add hidden host"
        elements.addHiddenHost.setAttribute("aria-label", "Add hidden host")
      } else if (
        accessSettingsDraft.editingIndex !== null &&
        accessSettingsDraft.editingIndex > index
      ) {
        accessSettingsDraft.editingIndex -= 1
      }
      renderHiddenHosts()
      updateAccessSettingsControls()
      setAccessSettingsStatus("")
    })

    actions.append(edit, remove)
    row.append(name, actions)
    elements.hiddenHostList.append(row)
  })

  updateAccessSettingsControls()
}

function addOrUpdateHiddenHost() {
  const host = normalizeHostInput(elements.hiddenHostInput?.value)
  if (!host) {
    setAccessSettingsStatus("Enter a valid host.", "error")
    return
  }

  const existingIndex = accessSettingsDraft.hiddenHosts.indexOf(host)
  if (existingIndex !== -1 && existingIndex !== accessSettingsDraft.editingIndex) {
    setAccessSettingsStatus("Host is already hidden.", "error")
    return
  }

  if (accessSettingsDraft.editingIndex !== null) {
    accessSettingsDraft.hiddenHosts = accessSettingsDraft.hiddenHosts.map((item, index) =>
      index === accessSettingsDraft.editingIndex ? host : item,
    )
  } else {
    accessSettingsDraft.hiddenHosts = [...accessSettingsDraft.hiddenHosts, host]
  }

  accessSettingsDraft.hiddenHosts = [...accessSettingsDraft.hiddenHosts].sort()
  accessSettingsDraft.editingIndex = null
  elements.hiddenHostInput.value = ""
  elements.addHiddenHost.title = "Add hidden host"
  elements.addHiddenHost.setAttribute("aria-label", "Add hidden host")
  setAccessSettingsStatus("")
  renderHiddenHosts()
}

async function hydrateAccessSettings() {
  const { rewayAccessFabEnabled, rewayAccessFabHiddenHosts, rewayXAutoCaptureEnabled } =
    await chrome.storage.local.get([
    "rewayAccessFabEnabled",
    "rewayAccessFabHiddenHosts",
    "rewayXAutoCaptureEnabled",
  ])
  const hiddenHosts = Array.isArray(rewayAccessFabHiddenHosts)
    ? rewayAccessFabHiddenHosts.flatMap((host) => normalizeHostInput(host) || [])
    : []
  const uniqueHosts = Array.from(new Set(hiddenHosts)).sort()

  accessSettingsDraft.enabled = rewayAccessFabEnabled !== false
  accessSettingsDraft.xAutoCaptureEnabled = rewayXAutoCaptureEnabled !== false
  accessSettingsDraft.hiddenHosts = uniqueHosts
  accessSettingsDraft.savedEnabled = accessSettingsDraft.enabled
  accessSettingsDraft.savedXAutoCaptureEnabled = accessSettingsDraft.xAutoCaptureEnabled
  accessSettingsDraft.savedHiddenHosts = [...uniqueHosts]
  accessSettingsDraft.editingIndex = null

  if (elements.accessToggle) {
    elements.accessToggle.checked = accessSettingsDraft.enabled
  }
  if (elements.xAutoCaptureToggle) {
    elements.xAutoCaptureToggle.checked = accessSettingsDraft.xAutoCaptureEnabled
  }
  if (elements.hiddenHostInput) {
    elements.hiddenHostInput.value = ""
  }

  renderHiddenHosts()
  setAccessSettingsStatus("")
}

async function saveAccessSettings() {
  const hiddenHosts = Array.from(new Set(accessSettingsDraft.hiddenHosts)).sort()
  await chrome.storage.local.set({
    rewayAccessFabEnabled: accessSettingsDraft.enabled,
    rewayXAutoCaptureEnabled: accessSettingsDraft.xAutoCaptureEnabled,
    rewayAccessFabHiddenHosts: hiddenHosts,
  })

  accessSettingsDraft.hiddenHosts = hiddenHosts
  accessSettingsDraft.savedEnabled = accessSettingsDraft.enabled
  accessSettingsDraft.savedXAutoCaptureEnabled = accessSettingsDraft.xAutoCaptureEnabled
  accessSettingsDraft.savedHiddenHosts = [...hiddenHosts]
  accessSettingsDraft.editingIndex = null
  renderHiddenHosts()
  setAccessSettingsStatus("Saved. Refresh pages to apply.", "success")
}

function cancelAccessSettings() {
  accessSettingsDraft.enabled = accessSettingsDraft.savedEnabled
  accessSettingsDraft.xAutoCaptureEnabled = accessSettingsDraft.savedXAutoCaptureEnabled
  accessSettingsDraft.hiddenHosts = [...accessSettingsDraft.savedHiddenHosts]
  accessSettingsDraft.editingIndex = null
  if (elements.accessToggle) {
    elements.accessToggle.checked = accessSettingsDraft.enabled
  }
  if (elements.xAutoCaptureToggle) {
    elements.xAutoCaptureToggle.checked = accessSettingsDraft.xAutoCaptureEnabled
  }
  if (elements.hiddenHostInput) {
    elements.hiddenHostInput.value = ""
  }
  renderHiddenHosts()
  setAccessSettingsStatus("")
}

async function hydrateGroups() {
  const cached = await readCachedGroups()
  const hasCachedGroups = cached.groups.length > 0

  if (hasCachedGroups) {
    renderGroups(cached.groups)
    applyGroupsState("ready")
  } else {
    applyGroupsState("loading")
  }

  const shouldShowLoadingState = !hasCachedGroups
  const shouldSkipFetch = !hasCachedGroups && isFreshTimestamp(cached.fetchedAt)

  if (shouldSkipFetch) {
    return
  }

  if (shouldShowLoadingState) {
    applyGroupsState("loading")
  }

  try {
    const data = await apiFetch("/api/extension/groups")
    const groups = data.groups || []
    await chrome.storage.local.set({
      rewayGroups: groups,
      rewayGroupsFetchedAt: getNow(),
    })
    renderGroups(groups)
    applyGroupsState("ready")
  } catch (error) {
    if (error?.status === 401) {
      await clearGroupCache()
      applyGroupsState("auth_required")
      return
    }

    if (!hasCachedGroups) {
      applyGroupsState("error")
    }
  }
}

async function handleAuthRequired(detail = {}) {
  await clearGroupCache()
  applyGroupsState("auth_required")

  if (detail.flow) {
    setStatus(
      detail.message || "Log in to keep saving to Reway.",
      "error",
      getFlowStatusTarget(detail.flow),
    )
  }
}

async function handleInvalidGroup(detail = {}) {
  await clearGroupCache()
  applyGroupsState("loading")
  void hydrateGroups()

  if (detail.flow) {
    setStatus(
      detail.message || "That group is no longer available. Refreshing your groups now.",
      "error",
      getFlowStatusTarget(detail.flow),
    )
  }
}

async function hydratePageMeta() {
  const pageMetaCard = document.getElementById("page-meta-card")
  const metaStatus = document.getElementById("page-meta-status")

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab) {
      popupState.metadata = "unavailable"
      metaStatus?.classList.add("hidden")
      pageMetaCard?.classList.remove("is-loading")
      return
    }

    elements.pageUrl.textContent = tab.url || ""
    elements.favicon.src = tab.favIconUrl || "icons/icon16.png"
    elements.title.value = tab.title || ""

    const meta = await fetchPageMeta(tab.id)
    if (meta?.title) {
      elements.title.value = meta.title
    }
    if (meta?.description) {
      elements.description.value = meta.description
    }

    popupState.metadata = meta ? "ready" : "unavailable"
  } catch {
    popupState.metadata = "unavailable"
  } finally {
    pageMetaCard?.classList.remove("is-loading")
    metaStatus?.classList.add("hidden")
  }
}

function updateChars(input, countEl) {
  if (!input || !countEl) return
  const len = input.value.length
  countEl.textContent = `${len}/${MAX_NAME_LENGTH}`
  countEl.classList.toggle("error", len >= MAX_NAME_LENGTH)
}

async function fetchManualLinkMetadata(url) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1600)

  try {
    return await apiFetch(`/api/metadata?url=${encodeURIComponent(url)}`, {
      method: "GET",
      signal: controller.signal,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

function initializeShell() {
  document.querySelector(".shell").style.opacity = "1"

  setupGroupSelects()
  setDestinationMode("save", "existing")
  setDestinationMode("links", "existing")
  setDestinationMode("session", "existing")
  applyGroupsState("loading")
}

function init() {
  initializeShell()

  void hydrateAccessSettings()
  void hydrateEnvironmentControls()
  void hydrateGroups()
  void hydratePageMeta()
}

document.addEventListener("DOMContentLoaded", init)

elements.saveBookmarkBtn?.addEventListener("click", saveBookmark)

if (elements.loginButton) {
  elements.loginButton.addEventListener("click", async () => {
    const { baseUrl } = await getSettings()
    chrome.tabs.create({ url: `${baseUrl}/login` })
  })
}

document.getElementById("retry-startup")?.addEventListener("click", () => {
  void hydrateGroups()
})

document.addEventListener("reway:auth-required", (event) => {
  void handleAuthRequired(event.detail || {})
})

document.addEventListener("reway:invalid-group", (event) => {
  void handleInvalidGroup(event.detail || {})
})

elements.settingsToggle?.addEventListener("click", () => {
  const isOpen = elements.devPanel?.classList.contains("open")
  setSettingsPanelOpen(!isOpen)
})
elements.advancedSettingsToggle?.addEventListener("click", () => {
  const isOpen = elements.advancedSettingsToggle?.getAttribute("aria-expanded") === "true"
  setAdvancedSettingsOpen(!isOpen)
})
elements.envProd?.addEventListener("click", () => switchEnv("prod"))
elements.envLocal?.addEventListener("click", () => switchEnv("local"))
elements.saveDevSettings?.addEventListener("click", handleSaveDevSettings)

elements.accessToggle?.addEventListener("change", () => {
  accessSettingsDraft.enabled = elements.accessToggle.checked
  setAccessSettingsStatus("")
  updateAccessSettingsControls()
})
elements.xAutoCaptureToggle?.addEventListener("change", () => {
  accessSettingsDraft.xAutoCaptureEnabled = elements.xAutoCaptureToggle.checked
  setAccessSettingsStatus("")
  updateAccessSettingsControls()
})
elements.addHiddenHost?.addEventListener("click", addOrUpdateHiddenHost)
elements.hiddenHostInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    addOrUpdateHiddenHost()
  } else if (event.key === "Escape" && accessSettingsDraft.editingIndex !== null) {
    accessSettingsDraft.editingIndex = null
    elements.hiddenHostInput.value = ""
    elements.addHiddenHost.title = "Add hidden host"
    elements.addHiddenHost.setAttribute("aria-label", "Add hidden host")
    setAccessSettingsStatus("")
  }
})
elements.saveAccessSettings?.addEventListener("click", () => {
  void saveAccessSettings()
})
elements.cancelAccessSettings?.addEventListener("click", cancelAccessSettings)

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.devPanel?.classList.contains("open")) {
    setSettingsPanelOpen(false)
  }
})

document.querySelectorAll(".destination-toggle-button").forEach((button) => {
  button.addEventListener("click", () => {
    setDestinationMode(button.dataset.flow, button.dataset.mode)
  })
})

document.getElementById("create-group-from-links")?.addEventListener("click", () =>
  createGroupFromLinks({
    mode: destinationState.links.mode,
    groupId: groupSelects.links?.getValue() || "",
    groupName: document.getElementById("links-group-name")?.value.trim() || "",
  }),
)

document.getElementById("save-session")?.addEventListener("click", () =>
  saveTabSession({
    mode: destinationState.session.mode,
    groupId: groupSelects.session?.getValue() || "",
    groupName: document.getElementById("session-name")?.value.trim() || "",
  }),
)

const addManualLinkBtn = document.getElementById("add-manual-link")
const manualLinkInput = document.getElementById("links-manual-url")

if (addManualLinkBtn && manualLinkInput) {
  const handleAddLink = async () => {
    const value = manualLinkInput.value.trim()
    if (!value) return

    addManualLinkBtn.disabled = true

    let urlToAdd = value
    if (!/^https?:\/\//i.test(urlToAdd)) {
      urlToAdd = `https://${urlToAdd}`
    }

    try {
      const metadata = await fetchManualLinkMetadata(urlToAdd)
      const response = await chrome.runtime.sendMessage({
        type: "addGrabbedLink",
        url: urlToAdd,
        title: metadata?.title || "",
        favIconUrl: metadata?.favicon || null,
        source: "manual",
      })

      if (response && response.success === false && response.reason === "duplicate") {
        setStatus(
          "This link is already in the list.",
          "error",
          document.getElementById("manual-link-status"),
        )
        setTimeout(() => {
          setStatus("", "", document.getElementById("manual-link-status"))
        }, 3000)
      } else {
        manualLinkInput.value = ""
        loadGrabbedLinks()
      }
    } catch (error) {
      console.error("Failed to add link", error)
    } finally {
      addManualLinkBtn.disabled = false
      manualLinkInput.focus()
    }
  }

  addManualLinkBtn.addEventListener("click", handleAddLink)
  manualLinkInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") handleAddLink()
  })
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    setSettingsPanelOpen(false)
    const tabId = button.dataset.tab
    switchTab(tabId)
    if (tabId === "links") loadGrabbedLinks()
    if (tabId === "session") loadTabSession()
  })
})

document
  .getElementById("save-group-name")
  ?.addEventListener("input", () =>
    updateChars(
      document.getElementById("save-group-name"),
      document.getElementById("save-group-char-count"),
    ),
  )

document
  .getElementById("links-group-name")
  ?.addEventListener("input", () =>
    updateChars(
      document.getElementById("links-group-name"),
      document.getElementById("links-group-char-count"),
    ),
  )

document
  .getElementById("session-name")
  ?.addEventListener("input", () =>
    updateChars(
      document.getElementById("session-name"),
      document.getElementById("session-char-count"),
    ),
  )
