import { useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Link from "next/link"
import React from "react"
import { navLinks } from "@/components/header"
import { RewayLazyMotion } from "@/components/motion/RewayLazyMotion"
import { Button } from "@/components/ui/button"
import { Portal, PortalBackdrop } from "@/components/ui/portal"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const shouldReduceMotion = useReducedMotion()

  React.useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const onToggle = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  return (
    <div className="md:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle menu"
        className={cn(
          "md:hidden",
          "border-0 bg-transparent shadow-none",
          "hover:bg-muted/50 active:scale-[0.97]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={onToggle}
        size="icon"
        variant="ghost"
        type="button"
      >
        <MenuMorphIcon isOpen={open} reduceMotion={shouldReduceMotion ?? false} />
      </Button>
      {open && (
        <Portal id="mobile-menu">
          <PortalBackdrop onClick={() => setOpen(false)} />
          <div
            className={cn(
              "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
              "size-full",
              "pb-[env(safe-area-inset-bottom)]",
              "pt-[calc(3.5rem+env(safe-area-inset-top))]",
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="mx-auto w-full max-w-4xl px-4 pt-3">
              <div className="grid gap-y-1">
                {navLinks.map((link) => (
                  <Button
                    asChild
                    className="-mx-2 h-10 justify-start px-2"
                    key={link.label}
                    variant="ghost"
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
              <div className="mt-8 border-t border-foreground/8 pt-4">
                <Button
                  asChild
                  className="w-full ring-1 ring-foreground/8"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function MenuMorphIcon({ isOpen, reduceMotion }: { isOpen: boolean; reduceMotion: boolean }) {
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <RewayLazyMotion>
      <m.svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        initial={false}
        animate={isOpen ? "open" : "closed"}
      >
        <m.path
          d="M5 7h14"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={{
            closed: {
              transform: "translateY(0px) rotate(0deg)",
              opacity: 1,
              originX: 0.5,
              originY: 0.5,
            },
            open: {
              transform: "translateY(5px) rotate(45deg)",
              opacity: 1,
              originX: 0.5,
              originY: 0.5,
            },
          }}
          transition={transition}
        />
        <m.path
          d="M5 12h14"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={transition}
        />
        <m.path
          d="M5 17h14"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={{
            closed: {
              transform: "translateY(0px) rotate(0deg)",
              opacity: 1,
              originX: 0.5,
              originY: 0.5,
            },
            open: {
              transform: "translateY(-5px) rotate(-45deg)",
              opacity: 1,
              originX: 0.5,
              originY: 0.5,
            },
          }}
          transition={transition}
        />
      </m.svg>
    </RewayLazyMotion>
  )
}
