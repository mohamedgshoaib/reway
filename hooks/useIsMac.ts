import { useMemo } from "react"

/**
 * Detects if the current platform is macOS/iOS
 * This is a shared utility to avoid duplicate OS detection logic across components
 */
export function useIsMac() {
  return useMemo(
    () => typeof window !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform),
    [],
  )
}
