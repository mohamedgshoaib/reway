"use client"

import { useCallback } from "react"

interface UseCommandModeOptions {
  setCommandMode: (mode: "add" | "search") => void
}

export function useCommandMode({ setCommandMode }: UseCommandModeOptions) {
  const handleCommandModeChange = useCallback(
    (mode: "add" | "search") => {
      setCommandMode(mode)
    },
    [setCommandMode],
  )

  return { handleCommandModeChange }
}
