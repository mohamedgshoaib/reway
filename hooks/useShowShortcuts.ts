"use client"

import { useEffect, useState } from "react"

export function useShowShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(pointer: fine)")

    const update = () => {
      setShowShortcuts(media.matches)
    }

    update()

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update)
      return () => media.removeEventListener("change", update)
    }

    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  return showShortcuts
}
