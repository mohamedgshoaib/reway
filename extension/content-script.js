function getDescription() {
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription?.content) return metaDescription.content.trim()

  const ogDescription = document.querySelector('meta[property="og:description"]')
  if (ogDescription?.content) return ogDescription.content.trim()

  const firstParagraph = document.querySelector("p")
  if (firstParagraph?.textContent) {
    return firstParagraph.textContent.trim().slice(0, 280)
  }

  return ""
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "getMeta") {
    sendResponse({
      title: document.title || "",
      description: getDescription(),
    })
  }

  if (message?.type === "broadcastBookmark") {
    window.postMessage(
      {
        type: "reway_broadcast_bookmark",
        bookmark: message.bookmark,
      },
      window.location.origin,
    )
  }
})

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.origin !== window.location.origin) return
  const data = event.data

  // Respond to extension check
  if (data?.type === "reway_extension_check") {
    window.postMessage(
      {
        type: "reway_extension_check_response",
        requestId: data.requestId,
        installed: true,
      },
      window.location.origin,
    )
    return
  }

  // Handle open group request
  if (data?.type === "reway_open_group") {
    if (data.groupId != null && typeof data.groupId !== "string") return
    chrome.runtime.sendMessage(
      {
        type: "openGroup",
        groupId: data.groupId || null,
        urls: Array.isArray(data.urls) ? data.urls : [],
      },
      (response) => {
        window.postMessage(
          {
            type: "reway_open_group_response",
            requestId: data.requestId,
            response,
          },
          window.location.origin,
        )
      },
    )
  }
})
