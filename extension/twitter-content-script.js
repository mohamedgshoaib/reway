// Twitter/X-specific content script for bookmark detection
// Detects when user bookmarks a tweet and sends data to background script

;(function () {
  "use strict"

  let xAutoCaptureEnabled = true
  let xAutoCaptureReady = null

  async function hydrateXAutoCaptureSetting() {
    if (xAutoCaptureReady) return xAutoCaptureReady

    xAutoCaptureReady = chrome.storage.local
      .get("rewayXAutoCaptureEnabled")
      .then(({ rewayXAutoCaptureEnabled }) => {
        xAutoCaptureEnabled = rewayXAutoCaptureEnabled !== false
      })
      .catch(() => {
        xAutoCaptureEnabled = true
      })

    return xAutoCaptureReady
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.rewayXAutoCaptureEnabled) return
    xAutoCaptureEnabled = changes.rewayXAutoCaptureEnabled.newValue !== false
  })

  void hydrateXAutoCaptureSetting()

  // Helper to extract tweet URL from tweet element
  function getTweetUrl(tweetElement) {
    try {
      // Look for the timestamp link which contains the tweet URL
      const timeLink = tweetElement.querySelector('a[href*="/status/"]')
      if (timeLink) {
        const href = timeLink.getAttribute("href")
        if (href) {
          // Convert relative URL to absolute
          return href.startsWith("http") ? href : `https://x.com${href}`
        }
      }
    } catch (error) {
      console.error("Error extracting tweet URL:", error)
    }
    return null
  }

  // Helper to extract tweet text content
  function getTweetText(tweetElement) {
    try {
      // Twitter's tweet text is in a div with specific data attribute or lang attribute
      const textElement = tweetElement.querySelector('[data-testid="tweetText"]')
      if (textElement) {
        return textElement.textContent.trim()
      }
    } catch (error) {
      console.error("Error extracting tweet text:", error)
    }
    return ""
  }

  // Helper to extract username from tweet
  function getUsername(tweetElement) {
    try {
      // Look for the username link (format: @username)
      const userLink = tweetElement.querySelector('a[href^="/"][role="link"]')
      if (userLink) {
        const href = userLink.getAttribute("href")
        if (href && href.startsWith("/") && !href.includes("/status/")) {
          // Remove leading slash and return username
          return href.substring(1)
        }
      }
    } catch (error) {
      console.error("Error extracting username:", error)
    }
    return null
  }

  // Helper to extract profile picture URL
  function getProfilePicture(tweetElement) {
    try {
      // Profile picture is in an img tag with src containing "profile_images"
      const profileImg = tweetElement.querySelector('img[src*="profile_images"]')
      if (profileImg) {
        return profileImg.src
      }
    } catch (error) {
      console.error("Error extracting profile picture:", error)
    }
    return null
  }

  // Helper to find the parent tweet article element from bookmark button
  function findTweetArticle(element) {
    let current = element
    while (current && current !== document.body) {
      if (current.tagName === "ARTICLE" && current.getAttribute("data-testid") === "tweet") {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  function isRuntimeReady() {
    try {
      return !!chrome?.runtime?.id
    } catch (error) {
      console.warn("Extension runtime check failed:", error)
      return false
    }
  }

  // Handle bookmark button click
  async function handleBookmarkClick(event) {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return

    // Find the bookmark button - it has data-testid="bookmark" or "removeBookmark"
    const bookmarkButton =
      target.closest('[data-testid="bookmark"]') || target.closest('[data-testid="removeBookmark"]')

    if (!bookmarkButton) return

    // Only proceed if this is a bookmark action (not unbookmark)
    const isBookmarking = bookmarkButton.getAttribute("data-testid") === "bookmark"
    if (!isBookmarking) return

    await hydrateXAutoCaptureSetting()
    if (!xAutoCaptureEnabled) return

    // Find the parent tweet article
    const tweetArticle = findTweetArticle(bookmarkButton)
    if (!tweetArticle) {
      console.warn("Could not find tweet article for bookmark button")
      return
    }

    // Extract tweet data
    const url = getTweetUrl(tweetArticle)
    const description = getTweetText(tweetArticle)
    const username = getUsername(tweetArticle)
    const profilePicture = getProfilePicture(tweetArticle)

    if (!url) {
      console.warn("Could not extract tweet URL")
      return
    }

    // Format title with username if available
    let title = description || ""
    if (username) {
      title = `@${username}: ${title}`
    }

    if (!isRuntimeReady()) {
      return
    }

    // Send bookmark data to background script
    try {
      chrome.runtime.sendMessage(
        {
          type: "twitterBookmark",
          url,
          title: title.substring(0, 200) || url, // Limit title length
          description: description || "",
          faviconUrl: profilePicture || null,
          timestamp: new Date().toISOString(),
        },
        (response) => {
          try {
            const lastError = chrome?.runtime?.lastError
            if (lastError) {
              console.error("Error sending bookmark to background:", lastError)
              return
            }

            if (response?.success) {
              console.log("Tweet bookmarked to Reway:", url)
            }
          } catch (error) {
            console.warn("Bookmark callback failed:", error)
          }
        },
      )
    } catch (error) {
      if (String(error).includes("Extension context invalidated")) {
        return
      }
      // Extension context was invalidated (extension reloaded)
      // The bookmark action was likely still successful
      console.log("Extension context invalidated, but bookmark may have been saved:", url)
    }
  }

  // Listen for clicks on the document
  document.addEventListener("click", handleBookmarkClick, true)

  console.log("Reway Twitter content script loaded")
})()
