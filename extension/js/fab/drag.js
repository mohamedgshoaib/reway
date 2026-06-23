import { FAB_SIZE, EDGE_MARGIN, VALID_CORNERS, DEFAULT_CORNER } from "./state.js";
import { safeStorageLocalSet } from "./api.js";

const DRAG_THRESHOLD_PX = 6;

let dragState = null;
let dragFrame = 0;

// ── Public API ───────────────────────────────────────────────────────────────

export function startDrag(event, fabEl, onCornerChange) {
  if (event.button !== 0) return;
  event.preventDefault();
  fabEl.setPointerCapture(event.pointerId);

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    onCornerChange,
  };

  fabEl.addEventListener("pointermove", onMove);
  fabEl.addEventListener("pointerup", (e) => onEnd(e, fabEl), { once: true });
  fabEl.addEventListener("pointercancel", (e) => onEnd(e, fabEl), { once: true });
}

export function cornerToPosition(corner) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = EDGE_MARGIN;
  const s = FAB_SIZE;
  const positions = {
    "bottom-right": { x: vw - s - m, y: vh - s - m },
    "bottom-left":  { x: m,          y: vh - s - m },
    "top-right":    { x: vw - s - m, y: m           },
    "top-left":     { x: m,          y: m           },
  };
  return positions[corner] ?? positions[DEFAULT_CORNER];
}

export function applyCorner(corner, rootEl) {
  const { x, y } = cornerToPosition(corner);
  rootEl.style.left = `${x}px`;
  rootEl.style.top = `${y}px`;
}

export async function loadSavedCorner() {
  const { rewayAccessFabCorner } = await chrome.storage.local.get("rewayAccessFabCorner");
  return VALID_CORNERS.includes(rewayAccessFabCorner) ? rewayAccessFabCorner : DEFAULT_CORNER;
}

// ── Internal ─────────────────────────────────────────────────────────────────

function onMove(event) {
  if (!dragState) return;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (!dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
  dragState.moved = true;

  const fabEl = event.currentTarget;
  if (dragFrame) cancelAnimationFrame(dragFrame);
  dragFrame = requestAnimationFrame(() => {
    const x = Math.max(EDGE_MARGIN, Math.min(window.innerWidth - FAB_SIZE - EDGE_MARGIN, event.clientX - FAB_SIZE / 2));
    const y = Math.max(EDGE_MARGIN, Math.min(window.innerHeight - FAB_SIZE - EDGE_MARGIN, event.clientY - FAB_SIZE / 2));
    const root = fabEl.closest(".root") ?? fabEl.parentElement;
    if (root) { root.style.left = `${x}px`; root.style.top = `${y}px`; }
    dragFrame = 0;
  });
}

function onEnd(event, fabEl) {
  fabEl.removeEventListener("pointermove", onMove);
  if (dragFrame) { cancelAnimationFrame(dragFrame); dragFrame = 0; }

  if (!dragState) return;
  const wasDrag = dragState.moved;
  const onCornerChange = dragState.onCornerChange;
  dragState = null;

  if (!wasDrag) return; // treated as click by the browser

  const corner = nearestCorner(event.clientX, event.clientY);
  void safeStorageLocalSet({ rewayAccessFabCorner: corner });
  onCornerChange(corner);
}

function nearestCorner(x, y) {
  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;
  return `${y >= midY ? "bottom" : "top"}-${x >= midX ? "right" : "left"}`;
}
