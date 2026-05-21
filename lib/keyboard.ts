export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function isInFloatingOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('[data-slot="dialog-content"]') ||
    target.closest('[data-slot="alert-dialog-content"]') ||
    target.closest('[data-slot="sheet-content"]') ||
    target.closest('[data-slot="dropdown-menu-content"]') ||
    target.closest('[data-slot="context-menu-content"]') ||
    target.closest('[data-slot="popover-content"]') ||
    target.closest('[data-slot="select-content"]') ||
    target.closest('[data-slot="tooltip-content"]'),
  )
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest("button") ||
    target.closest("a[href]") ||
    target.closest('[role="button"]') ||
    target.closest('[role="link"]'),
  )
}

export function shouldIgnoreDashboardHotkey(event: KeyboardEvent): boolean {
  const target = event.target
  if (isInFloatingOverlay(target)) return true
  if (isInteractiveTarget(target)) return true
  if (isTypingTarget(target)) return true
  return false
}

export function isModKeyPressed(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

export function normalizeAlphaNumericKey(event: KeyboardEvent): string | null {
  const raw = event.key
  if (typeof raw === "string" && raw.length === 1) {
    const lower = raw.toLowerCase()
    if ((lower >= "a" && lower <= "z") || (lower >= "0" && lower <= "9")) {
      return lower
    }
  }

  const code = event.code
  if (typeof code !== "string") return null

  if (code.startsWith("Key") && code.length === 4) {
    return code.slice(3).toLowerCase()
  }

  if (code.startsWith("Digit") && code.length === 6) {
    return code.slice(5)
  }

  return null
}
