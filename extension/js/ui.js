export const selectors = {
  // Sections
  authSection: "#auth-section",
  mainSection: "#main-section",
  // Tabs
  tabButtons: ".tab-button",
  tabContents: ".tab-content",
  // Common
  status: "#status",
  logo: "#extension-logo",
  // Auth/Dev
  loginButton: "#login-button",
  devPanel: "#dev-mode-panel",
  settingsToggle: "#settings-toggle",
  generalSettingsToggle: "#general-settings-toggle",
  quickAccessSettingsToggle: "#quick-access-settings-toggle",
  advancedSettingsToggle: "#advanced-settings-toggle",
  advancedSettingsPanel: "#advanced-settings-panel",
  envProd: "#env-prod",
  envLocal: "#env-local",
  localPortField: "#local-port-field",
  localPort: "#local-port",
  saveDevSettings: "#save-dev-settings",
  accessToggle: "#quick-access-toggle",
  xAutoCaptureToggle: "#x-auto-capture-toggle",
  hiddenHostInput: "#hidden-host-input",
  addHiddenHost: "#add-hidden-host",
  hiddenHostList: "#hidden-host-list",
  hiddenHostEmpty: "#hidden-host-empty",
  quickAccessSettingsGroup: "#quick-access-settings-group",
  accessSettingsStatus: "#access-settings-status",
  // Save Page
  saveBookmarkBtn: "#save",
  favicon: "#favicon",
  pageUrl: "#page-url",
  title: "#title",
  description: "#description",
}

export const elements = Object.fromEntries(
  Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)]),
)

export function setStatus(text, tone = "", target = elements.status) {
  if (!target) return
  target.textContent = text
  target.dataset.tone = tone
}

function createLoadingIcon() {
  const svgNs = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(svgNs, "svg")
  svg.setAttribute("class", "button-status-icon")
  svg.setAttribute("viewBox", "0 0 16 16")
  svg.setAttribute("fill", "none")
  svg.setAttribute("aria-hidden", "true")

  const bars = [
    { x: "1", begin: "0s" },
    { x: "6", begin: "0.2s" },
    { x: "11", begin: "0.4s" },
  ]

  bars.forEach(({ x, begin }) => {
    const rect = document.createElementNS(svgNs, "rect")
    rect.setAttribute("x", x)
    rect.setAttribute("y", "2")
    rect.setAttribute("width", "4")
    rect.setAttribute("height", "8")
    rect.setAttribute("rx", "1.5")
    rect.setAttribute("fill", "currentColor")

    const animate = document.createElementNS(svgNs, "animateTransform")
    animate.setAttribute("attributeName", "transform")
    animate.setAttribute("attributeType", "XML")
    animate.setAttribute("type", "translate")
    animate.setAttribute("values", "0 0; 0 5; 0 0")
    animate.setAttribute("begin", begin)
    animate.setAttribute("dur", "0.6s")
    animate.setAttribute("repeatCount", "indefinite")

    rect.appendChild(animate)
    svg.appendChild(rect)
  })

  return svg
}

function createSuccessIcon() {
  const svgNs = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(svgNs, "svg")
  svg.setAttribute("class", "button-status-icon")
  svg.setAttribute("viewBox", "0 0 16 16")
  svg.setAttribute("fill", "none")
  svg.setAttribute("aria-hidden", "true")

  const circle = document.createElementNS(svgNs, "circle")
  circle.setAttribute("cx", "8")
  circle.setAttribute("cy", "8")
  circle.setAttribute("r", "6")
  circle.setAttribute("stroke", "currentColor")
  circle.setAttribute("stroke-width", "1.75")

  const path = document.createElementNS(svgNs, "path")
  path.setAttribute("d", "M4.8 8.3 7.2 10.7 11.4 6.5")
  path.setAttribute("stroke", "currentColor")
  path.setAttribute("stroke-width", "1.85")
  path.setAttribute("stroke-linecap", "round")
  path.setAttribute("stroke-linejoin", "round")

  svg.appendChild(circle)
  svg.appendChild(path)
  return svg
}

function createIconSlot(icon = null) {
  const slot = document.createElement("span")
  slot.className = "button-icon-slot"

  if (icon) {
    slot.appendChild(icon)
  }

  return slot
}

function setButtonContent(button, text, state = "idle") {
  button.replaceChildren()

  const content = document.createElement("span")
  content.className = "button-content"

  const icon =
    state === "loading" ? createLoadingIcon() : state === "success" ? createSuccessIcon() : null

  content.appendChild(createIconSlot(icon))

  const label = document.createElement("span")
  label.className = "button-label"
  label.textContent = text
  content.appendChild(label)

  button.appendChild(content)
}

/**
 * Unified Loading Indicator
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 * @param {string} originalText
 */
export function setLoading(button, isLoading, loadingText = "") {
  if (!button) return
  if (isLoading) {
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent
    }
    button.disabled = true
    button.classList.add("loading")
    if (loadingText) {
      setButtonContent(button, loadingText, "loading")
    }
  } else {
    button.disabled = false
    button.classList.remove("loading")
    if (loadingText || button.dataset.originalText) {
      const nextText = loadingText || button.dataset.originalText
      const nextState = button.classList.contains("success") ? "success" : "idle"
      setButtonContent(button, nextText, nextState)
      delete button.dataset.originalText
    }
  }
}

export function switchTab(tabId) {
  const buttons = document.querySelectorAll(selectors.tabButtons)
  const contents = document.querySelectorAll(selectors.tabContents)

  buttons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabId
    btn.classList.toggle("active", isActive)
    btn.setAttribute("aria-selected", String(isActive))
    btn.setAttribute("tabindex", isActive ? "0" : "-1")
  })

  contents.forEach((content) => {
    const isActive = content.id === `tab-${tabId}`
    content.classList.toggle("active", isActive)
    content.setAttribute("aria-hidden", String(!isActive))
    content.setAttribute("tabindex", isActive ? "0" : "-1")
  })
}

export function showSection(sectionId) {
  const sections = [elements.authSection, elements.mainSection]
  sections.forEach((sec) => {
    if (sec) {
      sec.classList.toggle("hidden", sec.id !== sectionId)
    }
  })
}

const scrollSurfaceRegistry = new WeakSet()
const scrollSurfaceFrames = new WeakMap()
const SCROLL_CUE_ICONS = {
  up: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}

function getScrollSurfaceFrame(surface) {
  const existingFrame = scrollSurfaceFrames.get(surface)
  if (existingFrame) return existingFrame

  if (surface.parentElement?.classList.contains("scroll-surface-frame")) {
    scrollSurfaceFrames.set(surface, surface.parentElement)
    return surface.parentElement
  }

  const frame = document.createElement("div")
  frame.className = "scroll-surface-frame"

  if (surface.classList.contains("select-menu")) {
    frame.classList.add("select-menu-frame")
  } else if (surface.classList.contains("session-preview")) {
    frame.classList.add("session-preview-frame")
  } else if (surface.tagName === "TEXTAREA") {
    frame.classList.add("textarea-scroll-frame")
  }

  surface.before(frame)
  frame.append(surface)
  scrollSurfaceFrames.set(surface, frame)
  return frame
}

function ensureScrollSurfaceCues(surface) {
  if (surface.tagName === "TEXTAREA") return
  const frame = getScrollSurfaceFrame(surface)
  let topCue = frame.querySelector(":scope > .scroll-cue-top")
  let bottomCue = frame.querySelector(":scope > .scroll-cue-bottom")

  if (!topCue) {
    topCue = document.createElement("span")
    topCue.className = "scroll-cue scroll-cue-top"
    topCue.setAttribute("aria-hidden", "true")
    topCue.innerHTML = SCROLL_CUE_ICONS.up
    frame.append(topCue)
  }

  if (!bottomCue) {
    bottomCue = document.createElement("span")
    bottomCue.className = "scroll-cue scroll-cue-bottom"
    bottomCue.setAttribute("aria-hidden", "true")
    bottomCue.innerHTML = SCROLL_CUE_ICONS.down
    frame.append(bottomCue)
  }
}

function updateScrollSurface(surface) {
  if (!surface) return
  const frame = getScrollSurfaceFrame(surface)
  const maxScrollTop = surface.scrollHeight - surface.clientHeight
  const canScroll = maxScrollTop > 1
  frame.dataset.scrollTop = String(canScroll && surface.scrollTop > 1)
  frame.dataset.scrollBottom = String(
    canScroll && surface.scrollTop < maxScrollTop - 1,
  )
}

function scheduleScrollSurfaceUpdate(surface) {
  if (!surface) return
  updateScrollSurface(surface)
  requestAnimationFrame(() => {
    updateScrollSurface(surface)
    requestAnimationFrame(() => updateScrollSurface(surface))
  })
}

export function initScrollSurface(surface) {
  if (!surface || scrollSurfaceRegistry.has(surface)) return
  scrollSurfaceRegistry.add(surface)
  surface.classList.add("scroll-surface")
  ensureScrollSurfaceCues(surface)
  surface.addEventListener("scroll", () => updateScrollSurface(surface), {
    passive: true,
  })

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => scheduleScrollSurfaceUpdate(surface))
    observer.observe(surface)
  }

  scheduleScrollSurfaceUpdate(surface)
}

export function refreshScrollSurface(surface) {
  if (!surface) return
  if (!scrollSurfaceRegistry.has(surface)) {
    initScrollSurface(surface)
    return
  }
  ensureScrollSurfaceCues(surface)
  scheduleScrollSurfaceUpdate(surface)
}
