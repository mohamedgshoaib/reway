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
  accessSettingsStatus: "#access-settings-status",
  saveAccessSettings: "#save-access-settings",
  cancelAccessSettings: "#cancel-access-settings",
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
    btn.setAttribute("aria-selected", isActive)
  })

  contents.forEach((content) => {
    const isActive = content.id === `tab-${tabId}`
    content.classList.toggle("active", isActive)
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
