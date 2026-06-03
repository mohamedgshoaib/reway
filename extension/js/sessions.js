import { apiFetch } from "./api.js"
import { isDashboardUrl } from "./config.js"
import {
  partitionBookmarkBatchResults,
  resolveDestinationGroupId,
  saveBookmarkBatch,
} from "./save-bookmarks.js"
import { setStatus, setLoading, refreshScrollSurface } from "./ui.js"

function notifyPopup(type, detail) {
  document.dispatchEvent(new CustomEvent(type, { detail }))
}

function getSelectedHttpTabs(currentWindow, rewayBaseUrl) {
  const validTabs = currentWindow.tabs.filter(
    (tab) => tab.url && !tab.url.startsWith("chrome-") && !isDashboardUrl(tab.url, rewayBaseUrl),
  )

  const checkedTabIds = Array.from(document.querySelectorAll(".session-tab-checkbox:checked")).map(
    (cb) => parseInt(cb.dataset.id),
  )

  const selectedTabs = validTabs.filter((tab) => checkedTabIds.includes(tab.id))
  const selectedHttpTabs = selectedTabs.filter((tab) => {
    try {
      const parsed = new URL(tab.url)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  })

  return {
    selectedTabs,
    selectedHttpTabs,
  }
}

function showSessionValidationError(saveBtn, statusTarget, message) {
  setLoading(saveBtn, false, "Save Session")
  setStatus(message, "error", statusTarget)
}

function finishSessionSave(saveBtn, statusTarget, conflictCount) {
  saveBtn.classList.add("success")
  setLoading(saveBtn, false, "Saved")

  if (conflictCount > 0) {
    setStatus(
      `Saved session. Skipped ${conflictCount} conflicting bookmark save(s).`,
      "success",
      statusTarget,
    )
    setTimeout(() => window.close(), 900)
    return
  }

  setTimeout(() => window.close(), 800)
}

function showSessionBatchSummary(saveBtn, statusTarget, successCount, conflictCount, failureCount) {
  setLoading(saveBtn, false, failureCount > 0 ? "Save Session" : "Saved")

  if (failureCount > 0) {
    setStatus(
      `${successCount} saved, ${conflictCount} skipped, ${failureCount} failed.`,
      "error",
      statusTarget,
    )
    return
  }

  finishSessionSave(saveBtn, statusTarget, conflictCount)
}

function handleSessionSaveError(err, mode, statusTarget) {
  let message = "Failed to save session"

  if (err.status === 409) {
    message = "A group with this name already exists. Switch to Existing group."
  } else if (err.status === 401) {
    message = "Log in to keep saving sessions to Reway."
    notifyPopup("reway:auth-required", { flow: "session", message })
  } else if (err.status === 400) {
    message = "That group is no longer available. Refreshing your groups now."
    notifyPopup("reway:invalid-group", { flow: "session", message })
  } else if (mode === "existing") {
    message = "Failed to add tabs to group"
  }

  setStatus(message, "error", statusTarget)
}

export async function loadTabSession() {
  const tabCountEl = document.getElementById("tab-count")
  const sessionPreview = document.getElementById("session-preview")
  const emptyState = document.getElementById("session-empty")
  const sessionNameInput = document.getElementById("session-name")
  const saveBtn = document.getElementById("save-session")

  try {
    const currentWindow = await chrome.windows.getCurrent({ populate: true })
    const tabs = currentWindow?.tabs || []
    const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl")

    const validTabs = tabs.filter(
      (tab) =>
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://") &&
        !isDashboardUrl(tab.url, rewayBaseUrl),
    )

    tabCountEl.textContent = `${validTabs.length} tabs`
    sessionPreview.querySelectorAll(".session-tab-item").forEach((item) => item.remove())

    if (validTabs.length === 0) {
      emptyState.classList.remove("hidden")
      sessionNameInput.disabled = true
      saveBtn.disabled = true
      refreshScrollSurface(sessionPreview)
      return
    }

    emptyState.classList.add("hidden")
    sessionNameInput.disabled = false
    saveBtn.disabled = false

    validTabs.forEach((tab) => {
      const item = document.createElement("div")
      item.className = "session-tab-item"

      const checkboxWrap = document.createElement("label")
      checkboxWrap.className = "session-tab-check"
      checkboxWrap.setAttribute("aria-label", `Include ${tab.title || tab.url}`)

      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.className = "session-tab-checkbox"
      checkbox.dataset.id = String(tab.id)
      checkbox.checked = true

      const checkboxIndicator = document.createElement("span")
      checkboxIndicator.className = "session-tab-check-indicator"
      checkboxIndicator.setAttribute("aria-hidden", "true")
      checkboxIndicator.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M3.75 8.25 6.6 11.1 12.25 5.45" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `

      const favicon = document.createElement("img")
      favicon.className = "session-tab-favicon"
      favicon.src = tab.favIconUrl || "icons/icon16.png"
      favicon.onerror = () => {
        favicon.src = "icons/icon16.png"
      }

      const title = document.createElement("div")
      title.className = "session-tab-title"
      title.textContent = tab.title || tab.url

      checkboxWrap.appendChild(checkbox)
      checkboxWrap.appendChild(checkboxIndicator)
      item.appendChild(checkboxWrap)
      item.appendChild(favicon)
      item.appendChild(title)
      sessionPreview.appendChild(item)
    })

    refreshScrollSurface(sessionPreview)
  } catch (error) {
    console.error("Failed to load session:", error)
  }
}

export async function saveTabSession(destination) {
  const saveBtn = document.getElementById("save-session")
  const statusTarget = document.getElementById("session-status")
  const mode = destination?.mode || "new"
  const sessionName = destination?.groupName?.trim() || ""
  const existingGroupId = destination?.groupId || ""

  if (mode === "new" && !sessionName) {
    setStatus("Name the session you want to save.", "error", statusTarget)
    return
  }

  if (mode === "existing" && !existingGroupId) {
    setStatus("Choose a group before you save.", "error", statusTarget)
    return
  }

  setLoading(saveBtn, true, "Saving")

  try {
    const currentWindow = await chrome.windows.getCurrent({ populate: true })
    const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl")
    const { selectedTabs, selectedHttpTabs } = getSelectedHttpTabs(currentWindow, rewayBaseUrl)

    if (selectedTabs.length === 0) {
      showSessionValidationError(saveBtn, statusTarget, "No tabs selected")
      return
    }

    if (selectedHttpTabs.length === 0) {
      showSessionValidationError(saveBtn, statusTarget, "No supported tabs selected")
      return
    }

    const groupId = await resolveDestinationGroupId({
      mode,
      existingGroupId,
      groupName: sessionName,
    })
    const results = await saveBookmarkBatch(selectedHttpTabs, (tab) => ({
      url: tab.url,
      title: tab.title || tab.url,
      groupId,
    }))
    const { fulfilled, conflicts, nonConflictFailures } = partitionBookmarkBatchResults(results)
    const successCount = fulfilled.length
    const failureCount = nonConflictFailures.length

    if (failureCount > 0 && successCount === 0) {
      throw nonConflictFailures[0].reason
    }

    showSessionBatchSummary(
      saveBtn,
      statusTarget,
      successCount,
      conflicts.length,
      failureCount,
    )
  } catch (err) {
    setLoading(saveBtn, false, "Save Session")
    handleSessionSaveError(err, mode, statusTarget)
  }
}
