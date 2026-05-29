import { apiFetch } from "./api.js"
import { isDashboardUrl } from "./config.js"
import { setStatus, setLoading } from "./ui.js"

function notifyPopup(type, detail) {
  document.dispatchEvent(new CustomEvent(type, { detail }))
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
    const validTabs = currentWindow.tabs.filter(
      (tab) => tab.url && !tab.url.startsWith("chrome-") && !isDashboardUrl(tab.url, rewayBaseUrl),
    )

    const checkedTabIds = Array.from(
      document.querySelectorAll(".session-tab-checkbox:checked"),
    ).map((cb) => parseInt(cb.dataset.id))

    const selectedTabs = validTabs.filter((tab) => checkedTabIds.includes(tab.id))

    const selectedHttpTabs = selectedTabs.filter((tab) => {
      try {
        const parsed = new URL(tab.url)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    })

    if (selectedTabs.length === 0) {
      setLoading(saveBtn, false, "Save Session")
      setStatus("No tabs selected", "error", statusTarget)
      return
    }

    if (selectedHttpTabs.length === 0) {
      setLoading(saveBtn, false, "Save Session")
      setStatus("No supported tabs selected", "error", statusTarget)
      return
    }

    let groupId = existingGroupId

    if (mode === "new") {
      const groupData = await apiFetch("/api/extension/groups", {
        method: "POST",
        body: JSON.stringify({ name: sessionName }),
      })

      groupId = groupData.group.id
    }

    const results = []
    for (const tab of selectedHttpTabs) {
      try {
        const value = await apiFetch("/api/extension/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            url: tab.url,
            title: tab.title || tab.url,
            groupId,
          }),
        })
        results.push({ status: "fulfilled", value })
      } catch (reason) {
        results.push({ status: "rejected", reason })
      }
    }

    const isDuplicate = (err) => {
      const code = err?.data?.code
      if (code === "23505") return true
      const msg = String(err?.message || "").toLowerCase()
      return msg.includes("duplicate") || msg.includes("unique constraint")
    }

    const rejected = results.filter((r) => r.status === "rejected")
    const duplicates = rejected.filter((r) => isDuplicate(r.reason))
    const nonDuplicateFailures = rejected.filter((r) => !isDuplicate(r.reason))

    if (nonDuplicateFailures.length > 0) {
      throw nonDuplicateFailures[0].reason
    }

    if (duplicates.length > 0) {
      saveBtn.classList.add("success")
      setLoading(saveBtn, false, "Saved")
      setStatus(
        `Saved session. Skipped ${duplicates.length} duplicate bookmark(s).`,
        "success",
        statusTarget,
      )
      setTimeout(() => window.close(), 900)
      return
    }

    saveBtn.classList.add("success")
    setLoading(saveBtn, false, "Saved")
    setTimeout(() => window.close(), 800)
  } catch (err) {
    setLoading(saveBtn, false, "Save Session")

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
}
