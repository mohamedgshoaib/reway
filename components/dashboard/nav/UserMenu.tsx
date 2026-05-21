"use client"

import {
  HelpCircleIcon,
  Logout01Icon,
  Settings01Icon,
  Download02Icon,
  FileImportIcon,
  FileExportIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
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
import type { DashboardPaletteTheme } from "@/lib/themes"
import { SettingsDialog } from "../SettingsDialog"
import type { User } from "./types"

function LogoutItem() {
  const { pending } = useFormStatus()

  return (
    <DropdownMenuItem
      asChild
      onSelect={(event) => event.preventDefault()}
      variant="destructive"
      className="rounded-xl flex items-center gap-2 cursor-pointer w-full py-2"
    >
      <button
        type="submit"
        className="w-full text-left"
        disabled={pending}
        aria-disabled={pending ? "true" : "false"}
      >
        <HugeiconsIcon icon={Logout01Icon} size={16} />
        {pending ? "Logging out..." : "Log out"}
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
}: UserMenuProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpenRequest = () => setOpen(true)
    const handleCloseRequest = () => setOpen(false)
    window.addEventListener("reway:open-user-menu", handleOpenRequest)
    window.addEventListener("reway:close-user-menu", handleCloseRequest)
    return () => {
      window.removeEventListener("reway:open-user-menu", handleOpenRequest)
      window.removeEventListener("reway:close-user-menu", handleCloseRequest)
    }
  }, [])

  return (
    <>
      <SettingsDialog
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

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            data-onboarding="user-menu"
            suppressHydrationWarning
            className="size-8 rounded-full p-0 flex shrink-0 hover:bg-muted/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
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
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            data-onboarding="start-onboarding"
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
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
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
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
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
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
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
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
            className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
            onSelect={(event) => {
              event.preventDefault()
              setOpen(false)
              onOpenDuplicatesSheet()
            }}
          >
            <HugeiconsIcon icon={Wrench01Icon} size={16} />
            Duplicates
          </DropdownMenuItem>

          <ExtensionInstallDialog>
            <DropdownMenuItem
              data-onboarding="extension"
              className="rounded-xl flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground font-medium py-2"
              onSelect={(event) => event.preventDefault()}
            >
              <HugeiconsIcon icon={Download02Icon} size={16} />
              Download Extension
            </DropdownMenuItem>
          </ExtensionInstallDialog>
          <form action={signOut}>
            <LogoutItem />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
