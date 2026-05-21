"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import RewayLogo from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useScroll } from "@/hooks/use-scroll"
import { createClient } from "@/lib/supabase/client"
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

type HeaderUser = {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export function Header() {
  const scrolled = useScroll(10)
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [isDashboardNavLoading, setIsDashboardNavLoading] = useState(false)
  const { push } = useRouter()

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!data?.user) {
          setUser(null)
          return
        }

        setUser({
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
          avatar_url: data.user.user_metadata?.avatar_url,
        })
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  const initials = useMemo(() => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [user])

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

            {user ? (
              <>
                <Button
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-4xl transition-colors ring-0 cursor-pointer"
                  onClick={() => {
                    if (isDashboardNavLoading) return
                    setIsDashboardNavLoading(true)
                    push("/dashboard")
                  }}
                  disabled={isDashboardNavLoading}
                >
                  {isDashboardNavLoading ? "Loading..." : "Dashboard"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="size-8 rounded-full p-0 flex shrink-0 hover:bg-muted/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Open user menu"
                    >
                      <Avatar className="size-8 transition-transform cursor-pointer">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem variant="destructive" onSelect={onLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                asChild
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90 rounded-4xl transition-colors ring-0"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            )}
          </div>

          <MobileNav user={user} initials={initials} />
        </nav>
      </div>
    </header>
  )
}
