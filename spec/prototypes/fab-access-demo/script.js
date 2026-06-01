/* ============================================================
   Reway FAB Access Demo — script.js
   ============================================================ */

// ── Fake Data ──────────────────────────────────────────────
const FAKE_GROUPS = [
  {
    id: "all",
    name: "All Bookmarks",
    color: "#79c7d4",
    count: 24,
    bookmarks: [
      {
        id: "b1",
        title: "Reway Dashboard",
        url: "https://reway.page/",
        domain: "reway.page",
      },
      {
        id: "b2",
        title: "GitHub — Reway",
        url: "https://github.com/",
        domain: "github.com",
      },
      {
        id: "b3",
        title: "Figma Design File",
        url: "https://figma.com/",
        domain: "figma.com",
      },
      {
        id: "b4",
        title: "Linear — Issues",
        url: "https://linear.app/",
        domain: "linear.app",
      },
      {
        id: "b5",
        title: "Vercel Deployments",
        url: "https://vercel.com/",
        domain: "vercel.com",
      },
    ],
  },
  {
    id: "g1",
    name: "Work",
    color: "#f4b86a",
    count: 8,
    bookmarks: [
      {
        id: "b6",
        title: "Notion Workspace",
        url: "https://notion.so/",
        domain: "notion.so",
      },
      {
        id: "b7",
        title: "Slack — #team-dev",
        url: "https://slack.com/",
        domain: "slack.com",
      },
      {
        id: "b8",
        title: "Google Calendar",
        url: "https://calendar.google.com/",
        domain: "calendar.google.com",
      },
      {
        id: "b9",
        title: "Jira Board",
        url: "https://atlassian.com/",
        domain: "atlassian.com",
      },
      {
        id: "b10",
        title: "Confluence Docs",
        url: "https://atlassian.com/confluence",
        domain: "atlassian.com",
      },
      {
        id: "b11",
        title: "Zoom Meeting Room",
        url: "https://zoom.us/",
        domain: "zoom.us",
      },
      {
        id: "b12",
        title: "AWS Console",
        url: "https://aws.amazon.com/",
        domain: "aws.amazon.com",
      },
      {
        id: "b13",
        title: "Datadog Monitoring",
        url: "https://datadoghq.com/",
        domain: "datadoghq.com",
      },
    ],
  },
  {
    id: "g2",
    name: "Design",
    color: "#caa7ff",
    count: 5,
    bookmarks: [
      {
        id: "b14",
        title: "Figma Community",
        url: "https://figma.com/community",
        domain: "figma.com",
      },
      {
        id: "b15",
        title: "Dribbble Explore",
        url: "https://dribbble.com/",
        domain: "dribbble.com",
      },
      {
        id: "b16",
        title: "Awwwards",
        url: "https://awwwards.com/",
        domain: "awwwards.com",
      },
      {
        id: "b17",
        title: "Fontshare",
        url: "https://www.fontshare.com/",
        domain: "fontshare.com",
      },
      {
        id: "b18",
        title: "Coolors Palette",
        url: "https://coolors.co/",
        domain: "coolors.co",
      },
    ],
  },
  {
    id: "g3",
    name: "Research",
    color: "#85d8a5",
    count: 6,
    bookmarks: [
      {
        id: "b19",
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org/",
        domain: "developer.mozilla.org",
      },
      {
        id: "b20",
        title: "Can I Use",
        url: "https://caniuse.com/",
        domain: "caniuse.com",
      },
      {
        id: "b21",
        title: "Chrome Devs",
        url: "https://developer.chrome.com/",
        domain: "developer.chrome.com",
      },
      {
        id: "b22",
        title: "Stack Overflow",
        url: "https://stackoverflow.com/",
        domain: "stackoverflow.com",
      },
      {
        id: "b23",
        title: "CSS Tricks",
        url: "https://css-tricks.com/",
        domain: "css-tricks.com",
      },
      {
        id: "b24",
        title: "web.dev",
        url: "https://web.dev/",
        domain: "web.dev",
      },
    ],
  },
  {
    id: "g4",
    name: "Reading",
    color: "#f08ea1",
    count: 4,
    bookmarks: [
      {
        id: "b25",
        title: "Hacker News",
        url: "https://news.ycombinator.com/",
        domain: "ycombinator.com",
      },
      {
        id: "b26",
        title: "The Pragmatic Engineer",
        url: "https://newsletter.pragmaticengineer.com/",
        domain: "pragmaticengineer.com",
      },
      {
        id: "b27",
        title: "Bytes.dev Newsletter",
        url: "https://bytes.dev/",
        domain: "bytes.dev",
      },
      {
        id: "b28",
        title: "Morning Brew",
        url: "https://morningbrew.com/",
        domain: "morningbrew.com",
      },
    ],
  },
  {
    id: "none",
    name: "No Group",
    color: "#a7adb6",
    count: 1,
    bookmarks: [
      {
        id: "b29",
        title: "Interesting article to sort",
        url: "https://example.com/",
        domain: "example.com",
      },
    ],
  },
];

// ── State ──────────────────────────────────────────────────
let currentDemoState = "loaded";
let menuOpen = false;
let activeGroupId = null;
let isDragging = false;
let dragThresholdMet = false;
let suppressNextClick = false;
let dragStart = { x: 0, y: 0 };
const DRAG_THRESHOLD = 5;

let openTimer = null,
  closeTimer = null;
let groupOpenTimer = null,
  groupCloseTimer = null;
const HOVER_DELAY = 150;

let fabRoot, fab, menuWrap, groupsMenu, bookmarksMenu;

// ── SVG Icons ──────────────────────────────────────────────
const SVG_BOOKMARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
const SVG_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const SVG_LOGO = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm0 6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2zm0 6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2z"/></svg>`;
const SVG_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const SVG_ALERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const SVG_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 7h18M3 12h18M3 17h9"/><circle cx="19" cy="17" r="3"/><path d="M19 15v2l1 1"/></svg>`;
const SVG_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

// ── Helpers ────────────────────────────────────────────────
function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
function saveFabPos(x, y) {
  try {
    localStorage.setItem("reway_fab_x", x);
    localStorage.setItem("reway_fab_y", y);
  } catch {}
}
function loadFabPos() {
  try {
    const x = localStorage.getItem("reway_fab_x");
    const y = localStorage.getItem("reway_fab_y");
    if (x !== null && y !== null) return { x: parseFloat(x), y: parseFloat(y) };
  } catch {}
  return null;
}
function clampToViewport(x, y) {
  const W = window.innerWidth,
    H = window.innerHeight,
    sz = 44,
    m = 8;
  return {
    x: Math.max(m, Math.min(W - sz - m, x)),
    y: Math.max(m, Math.min(H - sz - m, y)),
  };
}
function applyFabPos(x, y) {
  const c = clampToViewport(x, y);
  fabRoot.style.left = c.x + "px";
  fabRoot.style.top = c.y + "px";
  fabRoot.style.right = "auto";
  fabRoot.style.bottom = "auto";
}
function detectMenuPosition() {
  const rect = fabRoot.getBoundingClientRect();
  menuWrap.classList.toggle("pos-right", rect.left < 240);
  menuWrap.classList.toggle("pos-below", rect.top < 340);
}

// ── Render Groups Content ──────────────────────────────────
function renderGroupsContent() {
  const inner = groupsMenu.querySelector(".reway-groups-inner");
  inner.innerHTML = "";

  if (currentDemoState === "loading") {
    inner.innerHTML = `<div class="reway-skel-list">${[1, 2, 3, 4].map(() => `<div class="reway-skel-row"><div class="reway-skel reway-skel-icon"></div><div class="reway-skel reway-skel-text"></div><div class="reway-skel reway-skel-badge"></div></div>`).join("")}</div>`;
    return;
  }
  if (currentDemoState === "auth") {
    inner.innerHTML = `<div class="reway-state-view"><div class="reway-state-ico">${SVG_LOCK}</div><div class="reway-state-ttl">Sign in required</div><div class="reway-state-desc">Sign in to Reway to access your bookmarks.</div><button class="reway-auth-btn" onclick="window.open('https://reway.page/','_blank')">Open Reway</button></div>`;
    return;
  }
  if (currentDemoState === "error") {
    inner.innerHTML = `<div class="reway-state-view"><div class="reway-state-ico">${SVG_ALERT}</div><div class="reway-state-ttl">Couldn't load groups</div><div class="reway-state-desc">Check your connection and try again.</div><button class="reway-retry-btn" onclick="setDemoState('loaded')">${SVG_REFRESH} Retry</button></div>`;
    return;
  }
  if (currentDemoState === "empty") {
    inner.innerHTML = `<div class="reway-state-view"><div class="reway-state-ico">${SVG_EMPTY}</div><div class="reway-state-ttl">No bookmarks yet</div><div class="reway-state-desc">Save your first link from any page using Reway.</div></div>`;
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "reway-groups-list";
  ul.setAttribute("role", "menu");

  FAKE_GROUPS.forEach((group) => {
    const li = document.createElement("li");
    li.className = "reway-group-item";
    li.setAttribute("role", "none");

    const btn = document.createElement("button");
    btn.className = "reway-group-btn";
    btn.setAttribute("role", "menuitem");
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("data-group-id", group.id);
      btn.style.setProperty("--group-color", group.color);
      btn.innerHTML = `<span class="reway-group-marker" aria-hidden="true"></span><span class="reway-group-name">${group.name}</span><span class="reway-group-count">${group.count}</span><span class="reway-group-chevron">${SVG_CHEVRON}</span>`;

    btn.addEventListener("mouseenter", () => {
      clearTimeout(groupCloseTimer);
      groupOpenTimer = setTimeout(
        () => openBookmarksMenu(group, btn),
        HOVER_DELAY,
      );
    });
    btn.addEventListener("mouseleave", () => {
      clearTimeout(groupOpenTimer);
      groupCloseTimer = setTimeout(() => {
        if (!bookmarksMenu.matches(":hover")) closeBookmarksMenu();
      }, HOVER_DELAY + 80);
    });
    btn.addEventListener("click", () => {
      clearTimeout(groupOpenTimer);
      clearTimeout(groupCloseTimer);
      activeGroupId === group.id
        ? closeBookmarksMenu()
        : openBookmarksMenu(group, btn);
    });
    btn.addEventListener("focus", () => {
      groupOpenTimer = setTimeout(
        () => openBookmarksMenu(group, btn),
        HOVER_DELAY,
      );
    });

    li.appendChild(btn);
    ul.appendChild(li);
  });
  inner.appendChild(ul);
}

// ── Render Bookmarks ───────────────────────────────────────
function renderBookmarksContent(group) {
  bookmarksMenu.innerHTML = `
    <div class="reway-bookmarks-header">
      <span class="reway-bm-grp-icon" style="--group-color: ${group.color}" aria-hidden="true"></span>
      <span class="reway-bm-grp-name">${group.name}</span>
    </div>
    <ul class="reway-bookmarks-list" role="menu">
      ${group.bookmarks
        .map(
          (bm) => `
        <li role="none">
          <a class="reway-bm-link" href="${bm.url}" target="_blank" rel="noopener noreferrer" role="menuitem" tabindex="0">
            <img class="reway-bm-favicon" src="${getFaviconUrl(bm.domain)}" alt="" width="16" height="16"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <span class="reway-bm-favicon-fb" style="display:none">${bm.domain[0].toUpperCase()}</span>
            <span class="reway-bm-info">
              <span class="reway-bm-title">${bm.title}</span>
              <span class="reway-bm-domain">${bm.domain}</span>
            </span>
          </a>
        </li>`,
        )
        .join("")}
    </ul>`;
}

// ── Open / Close ───────────────────────────────────────────
function openGroupsMenu() {
  if (menuOpen) return;
  menuOpen = true;
  fab.classList.add("menu-open");
  fab.setAttribute("aria-expanded", "true");
  detectMenuPosition();
  renderGroupsContent();
  groupsMenu.classList.add("open");
}
function closeGroupsMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  fab.classList.remove("menu-open");
  fab.setAttribute("aria-expanded", "false");
  groupsMenu.classList.remove("open");
  closeBookmarksMenu();
}
function toggleGroupsMenu() {
  menuOpen ? closeGroupsMenu() : openGroupsMenu();
}

function openBookmarksMenu(group, triggerBtn) {
  activeGroupId = group.id;
  document
    .querySelectorAll(".reway-group-btn")
    .forEach((b) => b.classList.remove("is-active"));
  if (triggerBtn) triggerBtn.classList.add("is-active");
  renderBookmarksContent(group);

  const triggerRect = triggerBtn.getBoundingClientRect();
  const groupsRect = groupsMenu.getBoundingClientRect();
  const subW = 280,
    subH = 400;
  const flipLeft = window.innerWidth - groupsRect.right < subW + 8;

  bookmarksMenu.classList.toggle("flip-left", flipLeft);
  bookmarksMenu.style.left =
    (flipLeft ? groupsRect.left - subW - 4 : groupsRect.right + 4) + "px";
  bookmarksMenu.style.top =
    Math.max(8, Math.min(window.innerHeight - subH - 8, triggerRect.top)) +
    "px";
  bookmarksMenu.classList.add("open");
}
function closeBookmarksMenu() {
  activeGroupId = null;
  document
    .querySelectorAll(".reway-group-btn")
    .forEach((b) => b.classList.remove("is-active"));
  bookmarksMenu.classList.remove("open");
}

// ── Drag ──────────────────────────────────────────────────
function initDrag() {
  fabRoot.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDragging = false;
    dragThresholdMet = false;
    dragStart = { x: e.clientX, y: e.clientY };
    const rect = fabRoot.getBoundingClientRect();
    const ox = e.clientX - rect.left,
      oy = e.clientY - rect.top;
    fabRoot.setPointerCapture(e.pointerId);

    function onMove(ev) {
      const dx = ev.clientX - dragStart.x,
        dy = ev.clientY - dragStart.y;
      if (!dragThresholdMet) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        dragThresholdMet = true;
        isDragging = true;
        fab.classList.add("is-dragging");
        closeGroupsMenu();
        clearTimeout(openTimer);
      }
      applyFabPos(ev.clientX - ox, ev.clientY - oy);
    }
    function onUp() {
      fabRoot.removeEventListener("pointermove", onMove);
      fabRoot.removeEventListener("pointerup", onUp);
      fab.classList.remove("is-dragging");
      if (isDragging) {
        const r = fabRoot.getBoundingClientRect();
        saveFabPos(r.left, r.top);
        suppressNextClick = true;
        setTimeout(() => {
          suppressNextClick = false;
        }, 0);
      }
      isDragging = false;
    }
    fabRoot.addEventListener("pointermove", onMove);
    fabRoot.addEventListener("pointerup", onUp);
  });
}

// ── Hover Intent ──────────────────────────────────────────
function initHoverIntent() {
  fabRoot.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
    openTimer = setTimeout(openGroupsMenu, HOVER_DELAY);
  });
  fabRoot.addEventListener("mouseleave", () => {
    clearTimeout(openTimer);
    if (!groupsMenu.matches(":hover") && !bookmarksMenu.matches(":hover"))
      closeTimer = setTimeout(closeGroupsMenu, HOVER_DELAY + 80);
  });
  groupsMenu.addEventListener("mouseenter", () => clearTimeout(closeTimer));
  groupsMenu.addEventListener("mouseleave", () => {
    clearTimeout(openTimer);
    if (!bookmarksMenu.matches(":hover") && !fabRoot.matches(":hover"))
      closeTimer = setTimeout(closeGroupsMenu, HOVER_DELAY + 80);
  });
  bookmarksMenu.addEventListener("mouseenter", () => {
    clearTimeout(closeTimer);
    clearTimeout(groupCloseTimer);
  });
  bookmarksMenu.addEventListener("mouseleave", () => {
    clearTimeout(groupCloseTimer);
    if (!groupsMenu.matches(":hover") && !fabRoot.matches(":hover")) {
      groupCloseTimer = setTimeout(closeBookmarksMenu, HOVER_DELAY);
      closeTimer = setTimeout(closeGroupsMenu, HOVER_DELAY + 200);
    }
  });
}

// ── Keyboard ──────────────────────────────────────────────
function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      closeGroupsMenu();
      fab.focus();
    }
  });
  fab.addEventListener("click", () => {
    if (suppressNextClick || isDragging) return;
    toggleGroupsMenu();
  });
  fab.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleGroupsMenu();
    }
  });
}

// ── Demo State Switcher ────────────────────────────────────
function setDemoState(state) {
  currentDemoState = state;
  document
    .querySelectorAll(".state-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.state === state));
  if (menuOpen) {
    closeBookmarksMenu();
    renderGroupsContent();
  }
}
window.setDemoState = setDemoState;

// ── Build & Init ───────────────────────────────────────────
function buildFAB() {
  fabRoot = document.getElementById("reway-fab-root");

  fab = document.createElement("button");
  fab.className = "reway-fab";
  fab.setAttribute("aria-label", "Open Reway bookmarks");
  fab.setAttribute("aria-haspopup", "true");
  fab.setAttribute("aria-expanded", "false");
  fab.innerHTML = `<span class="reway-fab-icon">${SVG_BOOKMARK}</span>`;

  menuWrap = document.createElement("div");
  menuWrap.className = "reway-menu-wrap";

  groupsMenu = document.createElement("div");
  groupsMenu.className = "reway-groups-menu";
  groupsMenu.setAttribute("role", "menu");
  groupsMenu.innerHTML = `<div class="reway-menu-header"><span class="reway-menu-logo">${SVG_LOGO}</span><span class="reway-menu-title">Reway</span></div><div class="reway-groups-inner"></div>`;

  bookmarksMenu = document.createElement("div");
  bookmarksMenu.className = "reway-bookmarks-menu";
  bookmarksMenu.setAttribute("role", "menu");
  document.body.appendChild(bookmarksMenu);

  menuWrap.appendChild(groupsMenu);
  fabRoot.appendChild(menuWrap);
  fabRoot.appendChild(fab);
}

document.addEventListener("DOMContentLoaded", () => {
  buildFAB();
  const saved = loadFabPos();
  if (saved) {
    applyFabPos(saved.x, saved.y);
  } else {
    applyFabPos(window.innerWidth - 44 - 28, window.innerHeight - 44 - 28);
  }
  initDrag();
  initHoverIntent();
  initKeyboard();
  window.addEventListener("resize", () => {
    const r = fabRoot.getBoundingClientRect();
    applyFabPos(r.left, r.top);
  });
  document.querySelector('[data-state="loaded"]').classList.add("active");
});
