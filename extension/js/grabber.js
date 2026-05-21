import { apiFetch } from "./api.js"
import { setStatus, setLoading } from "./ui.js"

export async function loadGrabbedLinks() {
  const listContainer = document.getElementById("grabbed-links-list")
  const emptyState = document.getElementById("links-empty")
  const countEl = document.getElementById("links-count")

  let links = []
  try {
    const response = await chrome.runtime.sendMessage({
      type: "getGrabbedLinks",
    })
    links = response?.links || []
  } catch (err) {
    console.warn("Could not fetch grabbed links:", err)
  }

  if (countEl) countEl.textContent = `${links.length} links`

  const groupNameInput = document.getElementById("links-group-name")
  const createBtn = document.getElementById("create-group-from-links")

  if (links.length === 0) {
    emptyState.style.display = "block"
    if (groupNameInput) groupNameInput.disabled = true
    if (createBtn) createBtn.disabled = true
    listContainer.querySelectorAll(".session-tab-item").forEach((item) => item.remove())
    return
  }

  emptyState.style.display = "none"
  if (groupNameInput) groupNameInput.disabled = false
  if (createBtn) createBtn.disabled = false

  listContainer.querySelectorAll(".session-tab-item").forEach((item) => item.remove())

  links.forEach((link) => {
    const item = document.createElement("div")
    item.className = "session-tab-item"

    const favicon = document.createElement("img")
    favicon.className = "session-tab-favicon"
    favicon.src = link.favIconUrl || "icons/icon16.png"
    favicon.onerror = () => {
      favicon.src = "icons/icon16.png"
    }

    const title = document.createElement("div")
    title.className = "session-tab-title"
    title.textContent = link.url

    const removeBtn = document.createElement("button")
    removeBtn.className = "session-tab-remove"
    removeBtn.type = "button"
    removeBtn.setAttribute("aria-label", "Remove link")

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "16")
    svg.setAttribute("height", "16")
    svg.setAttribute("viewBox", "0 0 24 24")
    svg.setAttribute("fill", "none")
    svg.setAttribute("stroke", "currentColor")
    svg.setAttribute("stroke-width", "2")
    svg.setAttribute("stroke-linecap", "round")
    svg.setAttribute("stroke-linejoin", "round")
    svg.setAttribute("aria-hidden", "true")

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path1.setAttribute("d", "M3 6h18")
    const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path2.setAttribute("d", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6")
    const path3 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path3.setAttribute("d", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2")

    svg.appendChild(path1)
    svg.appendChild(path2)
    svg.appendChild(path3)
    removeBtn.appendChild(svg)
    removeBtn.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "removeGrabbedLink",
        url: link.url,
      })
      loadGrabbedLinks()
    })

    item.appendChild(favicon)
    item.appendChild(title)
    item.appendChild(removeBtn)
    listContainer.appendChild(item)
  })
}

export async function createGroupFromLinks(destination) {
  const createBtn = document.getElementById("create-group-from-links")
  const statusTarget = document.getElementById("links-status")
  const mode = destination?.mode || "new"
  const groupName = destination?.groupName?.trim() || ""
  const existingGroupId = destination?.groupId || ""

  if (mode === "new" && !groupName) {
    setStatus("Please enter a group name", "error", statusTarget)
    return
  }

  if (mode === "existing" && !existingGroupId) {
    setStatus("Please select an existing group", "error", statusTarget)
    return
  }

  const { links } = await chrome.runtime.sendMessage({
    type: "getGrabbedLinks",
  })
  if (!links?.length) return

  setLoading(createBtn, true, "Saving...")

  try {
    let groupId = existingGroupId

    if (mode === "new") {
      const groupData = await apiFetch("/api/extension/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName }),
      })

      groupId = groupData.group.id
    }

    const promises = links.map((link) =>
      apiFetch("/api/extension/bookmarks", {
        method: "POST",
        body: JSON.stringify({
          url: link.url,
          title: link.title || link.url,
          groupId,
        }),
      }),
    )

    const results = await Promise.allSettled(promises)
    const rejected = results.filter((r) => r.status === "rejected")
    const duplicates = rejected.filter((r) => {
      const err = r.reason
      if (err?.status === 409) return true
      const code = err?.data?.code
      if (code === "23505") return true
      const msg = String(err?.message || "").toLowerCase()
      return msg.includes("already exists") || msg.includes("duplicate")
    })
    const nonDuplicateFailures = rejected.filter((r) => !duplicates.includes(r))
    if (nonDuplicateFailures.length > 0) {
      throw nonDuplicateFailures[0].reason
    }
    await chrome.runtime.sendMessage({ type: "clearGrabbedLinks" })

    createBtn.classList.add("success")
    setLoading(createBtn, false, "✓ Saved!")
    if (duplicates.length > 0) {
      setStatus(
        `Saved links. Skipped ${duplicates.length} duplicate bookmark(s).`,
        "success",
        statusTarget,
      )
    }
    setTimeout(() => window.close(), 800)
  } catch (err) {
    setLoading(createBtn, false, mode === "existing" ? "Add to existing group" : "Add to new group")

    let message = "Failed to create group"
    if (err.status === 409) {
      message = "A group with this name already exists. Switch to Add to existing group."
    } else if (mode === "existing") {
      message = "Failed to add links to group"
    }

    setStatus(message, "error", statusTarget)
  }
}
