"use client"

import {
  HelpCircleIcon,
  Home01Icon,
  Logout01Icon,
  Settings01Icon,
  Download02Icon,
  FileImportIcon,
  FileExportIcon,
  Wrench01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { signOut } from "@/app/dashboard/actions/auth"
import { ExtensionInstallDialog } from "@/components/extension-install-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BookmarkRow } from "@/lib/supabase/queries"
import type { DashboardPaletteTheme } from "@/lib/themes"
import { DashboardLoadingState } from "../LoadingState"
import { getEnrichmentHealthSummary } from "./enrichment-health"
import type { User } from "./types"

const SettingsDialog = dynamic(
  () => import("../SettingsDialog").then((mod) => mod.SettingsDialog),
  {
    loading: () => null,
    ssr: false,
  },
)

function LogoutItem() {
  const { pending } = useFormStatus()

  return (
    <DropdownMenuItem
      asChild
      onSelect={(event) => event.preventDefault()}
      variant="destructive"
      className="rounded-xl flex items-center gap-2 cursor-pointer w-full px-2.5 py-2"
    >
      <button
        type="submit"
        className="w-full text-left"
        disabled={pending}
        aria-disabled={pending ? "true" : "false"}
      >
        <HugeiconsIcon icon={Logout01Icon} size={16} />
        {pending ? <DashboardLoadingState label="Logging out" /> : "Log out"}
      </button>
    </DropdownMenuItem>
  )
}

interface UserMenuProps {
  user: User
  initials: string
  rowContent: "date" | "group"
  onRowContentChange: (value: "date" | "group") => void
  showNotesTodos: boolean
  onShowNotesTodosChange: (value: boolean) => void
  paletteTheme: DashboardPaletteTheme
  onPaletteThemeChange: (value: DashboardPaletteTheme) => void
  folderHeaderTint: "off" | "low" | "medium" | "high"
  onFolderHeaderTintChange: (value: "off" | "low" | "medium" | "high") => void
  layoutDensity: "compact" | "extended"
  onLayoutDensityChange: (value: "compact" | "extended") => void
  onOpenImportSheet: () => void
  onOpenExportSheet: () => void
  onOpenDuplicatesSheet: () => void
  bookmarks: BookmarkRow[]
  onOpenEnrichmentHealthSheet: () => void
}

export function UserMenu({
  user,
  initials,
  rowContent,
  onRowContentChange,
  showNotesTodos,
  onShowNotesTodosChange,
  paletteTheme,
  onPaletteThemeChange,
  folderHeaderTint,
  onFolderHeaderTintChange,
  layoutDensity,
  onLayoutDensityChange,
  onOpenImportSheet,
  onOpenExportSheet,
  onOpenDuplicatesSheet,
  bookmarks,
  onOpenEnrichmentHealthSheet,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [themeSelectOpen, setThemeSelectOpen] = useState(false)
  const router = useRouter()
  const enrichmentSummary = useMemo(() => getEnrichmentHealthSummary(bookmarks), [bookmarks])
  const enrichmentAttentionCount =
    enrichmentSummary.failed + enrichmentSummary.stuck + enrichmentSummary.needsRefresh

  const goToHomepage = () => {
    document.cookie = "homepage-bypass=1; path=/; max-age=10; SameSite=Strict"
    router.push("/")
  }

  useEffect(() => {
    const handleOpenRequest = () => setOpen(true)
    const handleCloseRequest = () => setOpen(false)
    const handleOpenSettings = () => {
      setSettingsLoaded(true)
      setSettingsOpen(true)
    }
    const handleCloseSettings = () => {
      setThemeSelectOpen(false)
      setSettingsOpen(false)
    }
    const handleOpenThemeSelect = () => {
      setSettingsLoaded(true)
      setSettingsOpen(true)
      setThemeSelectOpen(true)
    }
    const handleCloseThemeSelect = () => setThemeSelectOpen(false)
    window.addEventListener("reway:open-user-menu", handleOpenRequest)
    window.addEventListener("reway:close-user-menu", handleCloseRequest)
    window.addEventListener("reway:open-settings", handleOpenSettings)
    window.addEventListener("reway:close-settings", handleCloseSettings)
    window.addEventListener("reway:open-theme-select", handleOpenThemeSelect)
    window.addEventListener("reway:close-theme-select", handleCloseThemeSelect)
    return () => {
      window.removeEventListener("reway:open-user-menu", handleOpenRequest)
      window.removeEventListener("reway:close-user-menu", handleCloseRequest)
      window.removeEventListener("reway:open-settings", handleOpenSettings)
      window.removeEventListener("reway:close-settings", handleCloseSettings)
      window.removeEventListener("reway:open-theme-select", handleOpenThemeSelect)
      window.removeEventListener("reway:close-theme-select", handleCloseThemeSelect)
    }
  }, [])

  return (
    <>
      {settingsLoaded || settingsOpen ? (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={(nextOpen) => {
            setSettingsOpen(nextOpen)
            if (!nextOpen) {
              setThemeSelectOpen(false)
            }
          }}
          themeSelectOpen={themeSelectOpen}
          onThemeSelectOpenChange={setThemeSelectOpen}
          showNotesTodos={showNotesTodos}
          onShowNotesTodosChange={onShowNotesTodosChange}
          rowContent={rowContent}
          onRowContentChange={onRowContentChange}
          layoutDensity={layoutDensity}
          onLayoutDensityChange={onLayoutDensityChange}
          userName={user.name}
          paletteTheme={paletteTheme}
          onPaletteThemeChange={onPaletteThemeChange}
          folderHeaderTint={folderHeaderTint}
          onFolderHeaderTintChange={onFolderHeaderTintChange}
        />
      ) : null}

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            data-onboarding="user-menu"
            suppressHydrationWarning
            className="size-8 rounded-lg p-0 flex shrink-0 hover:bg-muted/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          >
            <Avatar className="size-8 transition-transform">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="bg-linear-to-br from-pink-500 to-rose-500 text-white font-semibold text-xs transition-transform">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          data-onboarding="user-menu-content"
          className="w-56 rounded-2xl p-2 ring-1 ring-foreground/8 animate-in slide-in-from-top-2 duration-200 motion-reduce:animate-none after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/5 after:pointer-events-none shadow-none isolate"
        >
          <div className="px-2 py-1.5 font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            data-onboarding="start-onboarding"
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent("reway:start-onboarding"))
              }, 50)
            }}
          >
            <HugeiconsIcon icon={HelpCircleIcon} size={16} />
            Start Onboarding
          </DropdownMenuItem>

          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent("reway:open-settings"))
              }, 50)
            }}
          >
            <HugeiconsIcon icon={Settings01Icon} size={16} />
            Settings
          </DropdownMenuItem>

          <div data-onboarding="import-export">
            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
              onSelect={(event) => {
                event.preventDefault()
                setOpen(false)
                onOpenImportSheet()
              }}
            >
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              Import
            </DropdownMenuItem>

            <DropdownMenuItem
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
              onSelect={(event) => {
                event.preventDefault()
                setOpen(false)
                onOpenExportSheet()
              }}
            >
              <HugeiconsIcon icon={FileExportIcon} size={16} />
              Export
            </DropdownMenuItem>
          </div>

          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              onOpenDuplicatesSheet()
            }}
          >
            <HugeiconsIcon icon={Wrench01Icon} size={16} />
            Duplicates
          </DropdownMenuItem>

          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              onOpenEnrichmentHealthSheet()
            }}
          >
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            <span className="min-w-0 flex-1">Enrichment health</span>
            {enrichmentAttentionCount > 0 ? (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-500">
                {enrichmentAttentionCount}
              </span>
            ) : null}
          </DropdownMenuItem>

          <ExtensionInstallDialog>
            <DropdownMenuItem
              data-onboarding="extension"
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
              onSelect={(event) => event.preventDefault()}
            >
              <HugeiconsIcon icon={Download02Icon} size={16} />
              Download Extension
            </DropdownMenuItem>
          </ExtensionInstallDialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium px-2.5 py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              goToHomepage()
            }}
          >
            <HugeiconsIcon icon={Home01Icon} size={16} />
            Homepage
          </DropdownMenuItem>
          <form action={signOut}>
            <LogoutItem />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
