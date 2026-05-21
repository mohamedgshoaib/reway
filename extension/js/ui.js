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
  footerHomepage: "#footer-homepage-link",
  footerDashboard: "#footer-dashboard-link",
  // Auth/Dev
  loginButton: "#login-button",
  devPanel: "#dev-mode-panel",
  envProd: "#env-prod",
  envLocal: "#env-local",
  localPortField: "#local-port-field",
  localPort: "#local-port",
  saveDevSettings: "#save-dev-settings",
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
      button.textContent = loadingText
    }
  } else {
    button.disabled = false
    button.classList.remove("loading")
    if (loadingText || button.dataset.originalText) {
      button.textContent = loadingText || button.dataset.originalText
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
