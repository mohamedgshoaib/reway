import {
  NO_GROUP_ID,
  GROUP_ICON_MANIFEST_PATH,
  GROUP_ICON_MANIFEST_ASSIGNMENT,
} from "./state.js";
import { isHttpUrl, safeDomain, escapeHtml, escapeAttribute } from "./utils.js";

const DEFAULT_GROUP_COLOR = "#a7adb6";

let groupIconManifest = globalThis.REWAY_GROUP_ICON_MANIFEST || null;
let groupIconManifestPromise = null;

// ── Group icon manifest ──────────────────────────────────────────────────────

export async function ensureGroupIconManifest() {
  if (groupIconManifest) return groupIconManifest;
  if (groupIconManifestPromise) return groupIconManifestPromise;
  groupIconManifestPromise = loadGroupIconManifest();
  groupIconManifest = await groupIconManifestPromise;
  return groupIconManifest;
}

async function loadGroupIconManifest() {
  try {
    const text = await fetch(chrome.runtime.getURL(GROUP_ICON_MANIFEST_PATH)).then(
      (r) => r.text(),
    );
    const start = text.indexOf(GROUP_ICON_MANIFEST_ASSIGNMENT);
    const end = text.lastIndexOf(";");
    if (start === -1 || end === -1 || end <= start) return {};
    return JSON.parse(text.slice(start + GROUP_ICON_MANIFEST_ASSIGNMENT.length, end));
  } catch {
    return {};
  }
}

export function renderGroupIconChip(group) {
  const entry = groupIconManifest?.[group.icon] || groupIconManifest?.fallback || null;
  const svg = entry ? renderGroupSvg(entry) : `<span class="group-icon-dot"></span>`;
  return `<span class="group-icon" style="--group-color:${escapeAttribute(group.color)}">${svg}</span>`;
}

function renderGroupSvg(entry) {
  const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
  return `<svg class="group-icon-svg" viewBox="${escapeAttribute(entry.viewBox || "0 0 24 24")}" width="18" height="18" fill="none" stroke="currentColor" aria-hidden="true">${nodes.map(renderSvgNode).join("")}</svg>`;
}

function renderSvgNode(node) {
  if (!node || typeof node.tag !== "string" || !node.attrs) return "";
  return `<${node.tag}${renderSvgAttrs(node.attrs)}></${node.tag}>`;
}

function renderSvgAttrs(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => ` ${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${escapeAttribute(String(v))}"`)
    .join("");
}

// ── Data normalization ───────────────────────────────────────────────────────

export function normalizeGroups(groups) {
  const items = Array.isArray(groups) ? groups : [];
  const regular = items
    .filter((g) => g?.id && g.show_in_fab !== false)
    .map((g) => ({
      id: String(g.id),
      name: String(g.name || "Untitled group"),
      color: g.color || DEFAULT_GROUP_COLOR,
      icon: typeof g.icon === "string" ? g.icon : "",
    }));
  return [
    ...regular,
    { id: NO_GROUP_ID, name: "No Group", color: DEFAULT_GROUP_COLOR, icon: "folder" },
  ];
}

export function normalizeBookmarks(bookmarks) {
  return (Array.isArray(bookmarks) ? bookmarks : [])
    .map((b) => ({
      id: String(b.id || ""),
      title: String(b.title || b.url || "Untitled bookmark"),
      url: String(b.url || ""),
      domain: String(b.domain || safeDomain(b.url) || ""),
      faviconCandidates: buildFaviconCandidates(b),
    }))
    .filter((b) => isHttpUrl(b.url));
}

// ── Favicon ──────────────────────────────────────────────────────────────────

function buildFaviconCandidates(bookmark) {
  const primary = normalizeFaviconUrl(bookmark.favicon_url || bookmark.faviconUrl);
  const domain = safeDomain(bookmark.url);
  const candidates = primary ? [primary] : [];
  if (isPublicFaviconDomain(domain)) {
    candidates.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`,
    );
  }
  return [...new Set(candidates)];
}

function normalizeFaviconUrl(url) {
  if (!url || typeof url !== "string") return "";
  const v = url.trim();
  if (v.startsWith("data:image/")) return v;
  try {
    const { protocol } = new URL(v);
    return protocol === "http:" || protocol === "https:" ? v : "";
  } catch {
    return "";
  }
}

function isPublicFaviconDomain(domain) {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (!d.includes(".") || d.includes(":") || d === "localhost" || d.endsWith(".local") || d.endsWith(".internal")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) {
    const [a, b] = d.split(".").map(Number);
    if (a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return false;
  }
  return true;
}

export function renderFavicon(bookmark) {
  if (!bookmark.faviconCandidates?.length) return createFaviconFallbackMarkup(bookmark);
  return `<img class="bookmark-favicon" src="${escapeAttribute(bookmark.faviconCandidates[0])}" alt="" width="20" height="20" loading="lazy" decoding="async" />`;
}

export function attachFaviconFallback(image, bookmark) {
  const candidates = bookmark.faviconCandidates || [];
  let idx = 0;
  image.addEventListener("error", () => {
    idx += 1;
    if (idx < candidates.length) {
      image.src = candidates[idx];
    } else {
      image.replaceWith(createFaviconFallback(bookmark));
    }
  });
}

function createFaviconFallback(bookmark) {
  const el = document.createElement("span");
  el.className = "bookmark-fallback";
  el.textContent = getFallbackLetter(bookmark);
  el.style.setProperty("--bookmark-fallback-bg", getFallbackColor(bookmark.domain || bookmark.url));
  return el;
}

function createFaviconFallbackMarkup(bookmark) {
  return `<span class="bookmark-fallback" style="--bookmark-fallback-bg:${escapeAttribute(getFallbackColor(bookmark.domain || bookmark.url))}">${escapeHtml(getFallbackLetter(bookmark))}</span>`;
}

function getFallbackLetter(bookmark) {
  return (bookmark.domain || bookmark.title || "?").charAt(0).toUpperCase();
}

function getFallbackColor(seed) {
  const v = String(seed || "?");
  let h = 0;
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 34% 34%)`;
}
