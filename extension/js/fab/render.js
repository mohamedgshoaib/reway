import { state, STRIP, VIEW, NO_GROUP_ID } from "./state.js";
import { escapeHtml, escapeAttribute } from "./utils.js";
import { renderGroupIconChip, renderFavicon, attachFaviconFallback } from "./icons.js";

// ── HugeIcons SVG strings ─────────────────────────────────────────────────────

function _ico(paths) {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">${paths}</svg>`;
}

const SVG_PIN = _ico(`<path d="M3 21L8 16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M13.2585 18.8714C9.51516 18.0215 5.97844 14.4848 5.12853 10.7415C4.99399 10.1489 4.92672 9.85266 5.12161 9.37197C5.3165 8.89129 5.55457 8.74255 6.03071 8.44509C7.10705 7.77265 8.27254 7.55888 9.48209 7.66586C11.1793 7.81598 12.0279 7.89104 12.4512 7.67048C12.8746 7.44991 13.1622 6.93417 13.7376 5.90269L14.4664 4.59604C14.9465 3.73528 15.1866 3.3049 15.7513 3.10202C16.316 2.89913 16.6558 3.02199 17.3355 3.26771C18.9249 3.84236 20.1576 5.07505 20.7323 6.66449C20.978 7.34417 21.1009 7.68401 20.898 8.2487C20.6951 8.8134 20.2647 9.05346 19.4039 9.53358L18.0672 10.2792C17.0376 10.8534 16.5229 11.1406 16.3024 11.568C16.0819 11.9955 16.162 12.8256 16.3221 14.4859C16.4399 15.7068 16.2369 16.88 15.5555 17.9697C15.2577 18.4458 15.1088 18.6839 14.6283 18.8786C14.1477 19.0733 13.8513 19.006 13.2585 18.8714Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_CHEVRON_R = _ico(`<path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_CHEVRON_L = _ico(`<path d="M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_UNFOLD_MORE = _ico(`<path d="M18 14C18 14 13.5811 19 12 19C10.4188 19 6 14 6 14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M18 9.99996C18 9.99996 13.5811 5.00001 12 5C10.4188 4.99999 6 10 6 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_UNFOLD_LESS = _ico(`<path d="M18 19C18 19 13.5811 14 12 14C10.4188 14 6 19 6 19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M18 5.00004C18 5.00004 13.5811 9.99999 12 10C10.4188 10 6 5 6 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_BOOKMARK = _ico(`<path d="M4 17.9808V9.70753C4 6.07416 4 4.25748 5.17157 3.12874C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.12874C20 4.25748 20 6.07416 20 9.70753V17.9808C20 20.2867 20 21.4396 19.2272 21.8523C17.7305 22.6514 14.9232 19.9852 13.59 19.1824C12.8168 18.7168 12.4302 18.484 12 18.484C11.5698 18.484 11.1832 18.7168 10.41 19.1824C9.0768 19.9852 6.26947 22.6514 4.77285 21.8523C4 21.4396 4 20.2867 4 17.9808Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_MORE = _ico(`<path d="M6.00449 12.5V12M18.0045 12.5V12M12.0045 12.5V12M7.00449 12.5C7.00449 11.9477 6.55677 11.5 6.00449 11.5C5.4522 11.5 5.00449 11.9477 5.00449 12.5C5.00449 13.0523 5.4522 13.5 6.00449 13.5C6.55677 13.5 7.00449 13.0523 7.00449 12.5ZM19.0045 12.5C19.0045 11.9477 18.5568 11.5 18.0045 11.5C17.4522 11.5 17.0045 11.9477 17.0045 12.5C17.0045 13.0523 17.4522 13.5 18.0045 13.5C18.5568 13.5 19.0045 13.0523 19.0045 12.5ZM13.0045 12.5C13.0045 11.9477 12.5568 11.5 12.0045 11.5C11.4522 11.5 11.0045 11.9477 11.0045 12.5C11.0045 13.0523 11.4522 13.5 12.0045 13.5C12.5568 13.5 13.0045 13.0523 13.0045 12.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);
const SVG_CHECK = _ico(`<path d="M5 14.5C5 14.5 6.5 14.5 8.5 18C8.5 18 14.0588 8.83333 19 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>`);

let _refs = {};
export function setRefs(refs) { _refs = refs; }

// ── Top-level ────────────────────────────────────────────────────────────────

export function renderPanel() {
  if (!_refs.strip || !_refs.body) return;

  _refs.strip.innerHTML = stripHtml();
  _refs.body.innerHTML = bodyHtml();

  // Attach favicon fallback listeners to freshly-created img elements
  _refs.body.querySelectorAll("[data-bookmark-idx]").forEach((row) => {
    const img = row.querySelector(".bookmark-favicon");
    if (!img) return;
    const idx = Number(row.dataset.bookmarkIdx);
    const bookmarks = activeBookmarkList();
    if (bookmarks[idx]) attachFaviconFallback(img, bookmarks[idx]);
  });

  // Restore session name input value
  const nameInput = _refs.strip.querySelector(".session-name");
  if (nameInput && state.stripMode === STRIP.SESSION) {
    nameInput.value = state.sessionName;
    nameInput.select();
  }

  // Show/hide persistent search input, footer, and strip based on current view
  const inDrillIn = state.view === VIEW.DRILL_IN;
  _refs.strip?.classList.toggle("is-hidden", inDrillIn);
  _refs.searchWrap?.classList.toggle("is-hidden", inDrillIn || state.pickerMode);
  _refs.footer?.classList.toggle("is-hidden", inDrillIn);
}

function activeBookmarkList() {
  if (state.view === VIEW.DRILL_IN && state.activeGroupId) {
    return state.bookmarksByGroup.get(state.activeGroupId) || [];
  }
  if (state.view === VIEW.SEARCH) return state.searchResults.bookmarks || [];
  return [];
}

// ── Save strip ───────────────────────────────────────────────────────────────

function stripHtml() {
  if (state.stripMode === STRIP.SESSION) return sessionStripHtml();
  if (state.stripMode === STRIP.SUCCESS) return successStripHtml();
  return pageStripHtml();
}

function pageStripHtml() {
  const chipLabel = state.lastGroupName ? escapeHtml(state.lastGroupName) : "Pick a group";
  const pickerIcon = state.pickerMode ? SVG_UNFOLD_LESS : SVG_UNFOLD_MORE;
  const sessionLine = state.sessionTabCount >= 2
    ? `<button class="session-micro" data-action="session-mode">or save ${state.sessionTabCount} open tabs as a session →</button>`
    : "";
  return `
    <div class="page-context">
      <span class="page-title">${escapeHtml(state.pageTitle || "This page")}</span>
    </div>
    <div class="cta-row">
      <button class="save-cta" data-action="save" data-group-id="${escapeAttribute(state.lastGroupId || "")}">
        <span class="cta-icon" aria-hidden="true">${SVG_BOOKMARK}</span>
        <span class="cta-label">Save</span>
      </button>
      <button class="group-chip${state.pickerMode ? " is-active" : ""}" data-action="open-picker" aria-label="Change destination group">
        <span class="group-chip-name">${chipLabel}</span>
        ${pickerIcon}
      </button>
    </div>
    ${sessionLine}`;
}

function sessionStripHtml() {
  const chipLabel = state.lastGroupName ? escapeHtml(state.lastGroupName) : "Pick a group";
  const pickerIcon = state.pickerMode ? SVG_UNFOLD_LESS : SVG_UNFOLD_MORE;
  return `
    <div class="strip-nav">
      <button class="back-btn" data-action="back" aria-label="Back to page save">${SVG_CHEVRON_L}</button>
      <span class="strip-nav-title">Save as session</span>
    </div>
    <input class="session-name" type="text" placeholder="Session name" aria-label="Session name" />
    <div class="cta-row">
      <button class="save-cta" data-action="save-session" data-group-id="${escapeAttribute(state.lastGroupId || "")}">
        <span class="cta-icon" aria-hidden="true">${SVG_BOOKMARK}</span>
        <span class="cta-label">Save</span>
      </button>
      <button class="group-chip${state.pickerMode ? " is-active" : ""}" data-action="open-picker" aria-label="Change destination group">
        <span class="group-chip-name">${chipLabel}</span>
        ${pickerIcon}
      </button>
    </div>`;
}

function successStripHtml() {
  const bm = state.successBookmark;
  const groupLabel = bm?.groupName ? escapeHtml(bm.groupName) : "group";
  return `
    <div class="page-context">
      <span class="page-title">${escapeHtml(state.pageTitle || "This page")}</span>
    </div>
    <div class="save-cta save-cta--success" role="status" aria-live="polite">
      <span class="cta-icon cta-check" aria-hidden="true">${SVG_CHECK}</span>
      <span class="cta-label">Saved to ${groupLabel}</span>
    </div>
    <div class="success-row">
      <button class="save-again-btn" data-action="save-again">Also save to another group</button>
    </div>`;
}

// ── Panel body ───────────────────────────────────────────────────────────────

function bodyHtml() {
  if (state.pickerMode) return pickerHtml();
  if (state.view === VIEW.DRILL_IN) return drillInHtml();
  if (state.view === VIEW.SEARCH) return searchResultsHtml();
  return groupsHtml();
}

function groupsHtml() {
  const { groupsStatus: s, groups, pinnedGroupIds, recentGroupIds } = state;
  if (s === "idle" || s === "loading") return skeletonHtml(5);
  if (s === "auth") return stateCardHtml("Sign in to Reway", "Your session has expired.", "Sign in", "auth");
  if (s === "error") return stateCardHtml("Couldn't load groups", "Check your connection and try again.", "Retry", "retry-groups");

  const pinned = groups.filter((g) => pinnedGroupIds.has(g.id));
  const recent = recentGroupIds
    .map((id) => groups.find((g) => !pinnedGroupIds.has(g.id) && g.id === id))
    .filter(Boolean);
  const recentSet = new Set(recent.map((g) => g.id));
  const rest = groups.filter((g) => !pinnedGroupIds.has(g.id) && !recentSet.has(g.id));

  const sections = [];
  if (pinned.length) sections.push(sectionHtml("Pinned", pinned.map((g) => groupRowHtml(g, true))));
  if (recent.length) sections.push(sectionHtml("Recently saved", recent.map((g) => groupRowHtml(g, false))));
  if (rest.length) {
    const sep = (pinned.length || recent.length) ? `<div class="groups-separator" role="separator"></div>` : "";
    sections.push(sep + rest.map((g) => groupRowHtml(g, false)).join(""));
  }
  return `<div class="groups-list">${sections.join("")}</div>`;
}

function sectionHtml(label, rowHtmls) {
  return `<div class="group-section"><div class="section-label">${escapeHtml(label)}</div>${rowHtmls.join("")}</div>`;
}

function groupRowHtml(group, isPinned) {
  const pin = `<button class="pin-btn${isPinned ? " is-pinned" : ""}" data-action="toggle-pin" data-group-id="${escapeAttribute(group.id)}" aria-label="${isPinned ? "Unpin" : "Pin"} ${escapeAttribute(group.name)}" aria-pressed="${isPinned}">${SVG_PIN}</button>`;
  return `<div class="group-row" role="button" tabindex="0" data-action="drill-in" data-group-id="${escapeAttribute(group.id)}">${renderGroupIconChip(group)}<span class="group-name-wrap group-name-wrap--has-pin"><span class="group-name">${escapeHtml(group.name)}</span>${pin}</span><span class="drill-chevron" aria-hidden="true">${SVG_CHEVRON_R}</span></div>`;
}

function pickerHtml() {
  const { groups, pickerSelectedIds } = state;
  const count = pickerSelectedIds.size;
  const rows = groups.map((g) => {
    const isSelected = pickerSelectedIds.has(g.id);
    return `<div class="group-row group-row--picker${isSelected ? " is-selected" : ""}" role="checkbox" aria-checked="${isSelected}" tabindex="0" data-action="toggle-pick-group" data-group-id="${escapeAttribute(g.id)}">${renderGroupIconChip(g)}<span class="group-name">${escapeHtml(g.name)}</span>${isSelected ? `<span class="pick-check" aria-hidden="true">${SVG_CHECK}</span>` : ""}</div>`;
  });
  const ctaLabel = count === 0 ? "Select a group" : count === 1 ? "Save to 1 group" : `Save to ${count} groups`;
  return `<div class="picker-wrap"><div class="groups-list">${rows.join("")}</div><div class="picker-footer"><button class="picker-cta"${count === 0 ? " disabled" : ""} data-action="confirm-multi-pick">${ctaLabel}</button></div></div>`;
}

function drillInHtml() {
  const group = state.groups.find((g) => g.activeGroupId === state.activeGroupId)
    ?? state.groups.find((g) => g.id === state.activeGroupId);
  const groupLabel = group ? escapeHtml(group.name) : "";
  const groupIcon = group ? renderGroupIconChip(group) : "";
  const bms = state.bookmarksByGroup.get(state.activeGroupId) || [];
  const bmsStatus = state.bookmarksStatusByGroup.get(state.activeGroupId) || "idle";

  let listHtml;
  if (bmsStatus === "idle" || bmsStatus === "loading") listHtml = skeletonHtml(5);
  else if (bmsStatus === "auth") listHtml = stateCardHtml("Session expired", "", "Sign in", "auth");
  else if (bmsStatus === "error") listHtml = stateCardHtml("Couldn't load bookmarks", "", "Retry", `retry-bookmarks:${state.activeGroupId}`);
  else if (!bms.length) listHtml = stateCardHtml("No bookmarks yet", "Save this page here to get started.", "", "");
  else listHtml = `<div class="bookmarks-list">${bms.map(bookmarkRowHtml).join("")}</div>`;

  const isActionsOpen = state.groupActionsOpen;
  const header = `<div class="drill-header"><button class="back-btn" data-action="back" aria-label="Back to groups">${SVG_CHEVRON_L}</button>${groupIcon}<span class="drill-group-name">${groupLabel}</span><button class="dots-btn${isActionsOpen ? " is-active" : ""}" data-action="group-actions" data-group-id="${escapeAttribute(state.activeGroupId || "")}" aria-label="Group actions" aria-expanded="${isActionsOpen}">${SVG_MORE}</button></div>`;
  const groupActionsPanel = isActionsOpen ? groupActionsPanelHtml(state.activeGroupId) : "";
  const drillSearch = `<div class="drill-search-wrap"><input class="drill-search" type="search" placeholder="Search bookmarks…" aria-label="Search in group" autocomplete="off" spellcheck="false" /></div>`;
  let pageShortName = "this page";
  if (state.pageTitle) {
    const base = state.pageTitle.split(/\s+-\s+|[|—·•]/)[0].trim() || state.pageTitle;
    pageShortName = base.length > 25 ? base.slice(0, 23) + "…" : base;
  } else {
    try { pageShortName = new URL(state.pageUrl).hostname.replace(/^www\./, ""); } catch {}
  }
  const footer = `<div class="drill-footer"><button class="save-here-btn" data-action="save-here" data-group-id="${escapeAttribute(state.activeGroupId || "")}">+ Save ${escapeHtml(pageShortName)} here</button></div>`;

  return header + groupActionsPanel + drillSearch + listHtml + footer;
}

function groupActionsPanelHtml(groupId) {
  const bms = state.bookmarksByGroup.get(groupId) || [];
  const count = bms.length;
  if (!count) return "";
  return `<div class="group-actions-panel"><button class="group-actions-item" data-action="open-all-tabs" data-group-id="${escapeAttribute(groupId)}">Open all ${count} tab${count !== 1 ? "s" : ""}</button></div>`;
}

function bookmarkRowHtml(bookmark, idx) {
  return `<div class="bookmark-row" role="button" tabindex="0" data-action="open-bookmark" data-url="${escapeAttribute(bookmark.url)}" data-bookmark-id="${escapeAttribute(bookmark.id)}" data-bookmark-idx="${idx}">${renderFavicon(bookmark)}<span class="bookmark-info"><span class="bookmark-title">${escapeHtml(bookmark.title)}</span><span class="bookmark-domain">${escapeHtml(bookmark.domain)}</span></span></div>`;
}

function searchResultsHtml() {
  const { searchStatus, searchResults } = state;
  if (searchStatus === "loading") return skeletonHtml(4);
  if (!searchResults.groups?.length && !searchResults.bookmarks?.length) {
    return stateCardHtml("No results", `Nothing matched "${escapeHtml(state.searchQuery)}"`, "", "");
  }

  const groupRows = (searchResults.groups || [])
    .map((g) => `<div class="group-row" role="button" tabindex="0" data-action="drill-in" data-group-id="${escapeAttribute(g.id)}">${renderGroupIconChip(g)}<span class="group-name-wrap"><span class="group-name">${escapeHtml(g.name)}</span></span><span class="drill-chevron" aria-hidden="true">${SVG_CHEVRON_R}</span></div>`)
    .join("");
  const bmRows = (searchResults.bookmarks || [])
    .map((b, i) => bookmarkRowHtml(b, i))
    .join("");

  return (groupRows ? `<div class="results-section"><div class="results-label">Groups</div>${groupRows}</div>` : "")
    + (bmRows ? `<div class="results-section"><div class="results-label">Bookmarks</div>${bmRows}</div>` : "");
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function skeletonHtml(n) {
  return `<div class="skeleton-list">${Array.from({ length: n }, () =>
    `<div class="skeleton-row"><span class="skeleton skeleton-icon"></span><span class="skeleton skeleton-text"></span></div>`,
  ).join("")}</div>`;
}

function stateCardHtml(title, copy, actionLabel, actionKey) {
  const btn = actionLabel
    ? `<button class="state-action" data-action="${escapeAttribute(actionKey)}">${escapeHtml(actionLabel)}</button>`
    : "";
  return `<div class="state-card"><div class="state-title">${escapeHtml(title)}</div>${copy ? `<div class="state-copy">${escapeHtml(copy)}</div>` : ""}${btn}</div>`;
}
