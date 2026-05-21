"use client"

import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState } from "react"

export function ScrollToTopButton() {
  const [opacityMode, setOpacityMode] = useState<"hidden" | "dim" | "shown">("hidden")
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const update = () => {
      const currentY = window.scrollY
      const isAtTop = currentY < 100
      const isScrollingDown = currentY > lastScrollYRef.current

      if (isAtTop) {
        setOpacityMode("hidden")
      } else if (isScrollingDown) {
        setOpacityMode("dim")
      } else {
        setOpacityMode("shown")
      }

      lastScrollYRef.current = currentY
    }

    lastScrollYRef.current = window.scrollY
    update()

    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-2xl bg-background/70 text-foreground ring-1 ring-foreground/8 backdrop-blur cursor-pointer active:scale-[0.97] transition-[opacity,transform] duration-150 ease-out hover:opacity-100 motion-reduce:transition-none motion-reduce:transform-none ${
        opacityMode === "hidden"
          ? "opacity-0 pointer-events-none translate-y-1 scale-[0.97]"
          : opacityMode === "dim"
            ? "opacity-20"
            : "opacity-100"
      }`}
    >
      <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={2} />
    </button>
  )
}
