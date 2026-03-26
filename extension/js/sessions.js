import { apiFetch } from "./api.js";
import { setStatus, setLoading } from "./ui.js";
import { isDashboardUrl } from "./config.js";

export async function loadTabSession() {
  const tabCountEl = document.getElementById("tab-count");
  const sessionPreview = document.getElementById("session-preview");
  const emptyState = document.getElementById("session-empty");
  const sessionNameInput = document.getElementById("session-name");
  const saveBtn = document.getElementById("save-session");

  try {
    const currentWindow = await chrome.windows.getCurrent({ populate: true });
    const tabs = currentWindow?.tabs || [];
    const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl");

    const validTabs = tabs.filter(
      (tab) =>
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://") &&
        !isDashboardUrl(tab.url, rewayBaseUrl),
    );

    tabCountEl.textContent = `${validTabs.length} tabs`;
    sessionPreview
      .querySelectorAll(".session-tab-item")
      .forEach((item) => item.remove());

    if (validTabs.length === 0) {
      emptyState.style.display = "block";
      sessionNameInput.disabled = true;
      saveBtn.disabled = true;
      return;
    }

    emptyState.style.display = "none";
    sessionNameInput.disabled = false;
    saveBtn.disabled = false;

    validTabs.forEach((tab) => {
      const item = document.createElement("div");
      item.className = "session-tab-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "session-tab-checkbox";
      checkbox.dataset.id = String(tab.id);
      checkbox.checked = true;

      const favicon = document.createElement("img");
      favicon.className = "session-tab-favicon";
      favicon.src = tab.favIconUrl || "icons/icon16.png";
      favicon.onerror = () => {
        favicon.src = "icons/icon16.png";
      };

      const title = document.createElement("div");
      title.className = "session-tab-title";
      title.textContent = tab.title || tab.url;

      item.appendChild(checkbox);
      item.appendChild(favicon);
      item.appendChild(title);
      sessionPreview.appendChild(item);
    });
  } catch (error) {
    console.error("Failed to load session:", error);
  }
}

export async function saveTabSession(destination) {
  const saveBtn = document.getElementById("save-session");
  const statusTarget = document.getElementById("session-status");
  const mode = destination?.mode || "new";
  const sessionName = destination?.groupName?.trim() || "";
  const existingGroupId = destination?.groupId || "";

  if (mode === "new" && !sessionName) {
    setStatus(
      "Please enter a session name",
      "error",
      statusTarget,
    );
    return;
  }

  if (mode === "existing" && !existingGroupId) {
    setStatus("Please select an existing group", "error", statusTarget);
    return;
  }

  setLoading(saveBtn, true, "Saving...");

  try {
    const currentWindow = await chrome.windows.getCurrent({ populate: true });
    const { rewayBaseUrl } = await chrome.storage.local.get("rewayBaseUrl");
    const validTabs = currentWindow.tabs.filter(
      (tab) =>
        tab.url &&
        !tab.url.startsWith("chrome-") &&
        !isDashboardUrl(tab.url, rewayBaseUrl),
    );

    const checkedTabIds = Array.from(
      document.querySelectorAll(".session-tab-checkbox:checked"),
    ).map((cb) => parseInt(cb.dataset.id));

    const selectedTabs = validTabs.filter((tab) =>
      checkedTabIds.includes(tab.id),
    );

    const selectedHttpTabs = selectedTabs.filter((tab) => {
      try {
        const parsed = new URL(tab.url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    });

    if (selectedTabs.length === 0) {
      setLoading(saveBtn, false, mode === "existing" ? "Add to existing group" : "Add to new group");
      setStatus("No tabs selected", "error", statusTarget);
      return;
    }

    if (selectedHttpTabs.length === 0) {
      setLoading(saveBtn, false, mode === "existing" ? "Add to existing group" : "Add to new group");
      setStatus("No supported tabs selected", "error", statusTarget);
      return;
    }

    let groupId = existingGroupId;

    if (mode === "new") {
      const groupData = await apiFetch("/api/extension/groups", {
        method: "POST",
        body: JSON.stringify({ name: sessionName }),
      });

      groupId = groupData.group.id;
    }

    const results = await Promise.allSettled(
      selectedHttpTabs.map((tab) =>
        apiFetch("/api/extension/bookmarks", {
          method: "POST",
          body: JSON.stringify({
            url: tab.url,
            title: tab.title || tab.url,
            groupId,
          }),
        }),
      ),
    );

    const isDuplicate = (err) => {
      const code = err?.data?.code;
      if (code === "23505") return true;
      const msg = String(err?.message || "").toLowerCase();
      return msg.includes("duplicate") || msg.includes("unique constraint");
    };

    const rejected = results.filter((r) => r.status === "rejected");
    const duplicates = rejected.filter((r) => isDuplicate(r.reason));
    const nonDuplicateFailures = rejected.filter((r) => !isDuplicate(r.reason));

    if (nonDuplicateFailures.length > 0) {
      throw nonDuplicateFailures[0].reason;
    }

    if (duplicates.length > 0) {
      saveBtn.classList.add("success");
      setLoading(saveBtn, false, "✓ Saved!");
      setStatus(
        `Saved session. Skipped ${duplicates.length} duplicate bookmark(s).`,
        "success",
        statusTarget,
      );
      setTimeout(() => window.close(), 900);
      return;
    }

    saveBtn.classList.add("success");
    setLoading(saveBtn, false, "✓ Saved!");
    setTimeout(() => window.close(), 800);
  } catch (err) {
    setLoading(saveBtn, false, mode === "existing" ? "Add to existing group" : "Add to new group");

    let message = "Failed to save session";
    if (err.status === 409) {
      message =
        "A group with this name already exists. Switch to Add to existing group.";
    } else if (mode === "existing") {
      message = "Failed to add tabs to group";
    }

    setStatus(message, "error", statusTarget);
  }
}
