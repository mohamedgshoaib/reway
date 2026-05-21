"use client"

import Link from "next/link"
import RewayLogo from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { useScroll } from "@/hooks/use-scroll"
import { cn } from "@/lib/utils"

export const navLinks = [
  {
    label: "Features",
    href: { pathname: "/", hash: "features" },
  },
  {
    label: "Extension",
    href: { pathname: "/", hash: "extension" },
  },
  {
    label: "About",
    href: { pathname: "/about" },
  },
]

export function Header() {
  const scrolled = useScroll(10)

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "md:transition-[top] md:duration-200 md:ease-out",
        scrolled ? "md:top-2" : "md:top-4",
      )}
    >
      <div
        className={cn(
          "w-full border-b border-foreground/8",
          "md:rounded-4xl md:border md:border-foreground/8",
          "md:origin-top md:transform-gpu md:transition-[background-color,border-color,box-shadow,opacity,transform,max-width] md:duration-200 md:ease-out",
          scrolled
            ? "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:mx-auto md:max-w-5xl md:translate-y-0 md:scale-100"
            : "md:mx-auto md:max-w-6xl md:translate-y-2 md:scale-100",
        )}
      >
        <nav
          className={cn(
            "flex h-14 w-full items-center justify-between px-4 sm:px-6 md:px-2 md:h-12 md:transition-[padding] md:duration-200 md:ease-out",
            {
              "md:px-2": scrolled,
            },
          )}
        >
          <Link
            className={cn(
              "-m-2 rounded-md p-2",
              "transition-[opacity,transform] duration-200 ease-out",
              "active:scale-[0.97]",
              "motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Reway Home"
            href="/"
          >
            <span className="flex items-center gap-2">
              <RewayLogo className="size-8" aria-hidden="true" focusable="false" />
              <span className="text-base font-bold text-foreground">Reway</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <div>
              {navLinks.map((link) => (
                <Button asChild key={link.label} size="sm" variant="ghost">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>

            <Button
              asChild
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 rounded-4xl transition-colors ring-0"
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>

          <MobileNav />
        </nav>
      </div>
    </header>
  )
}
