"use client"

import {
  Settings01Icon,
  Moon02Icon,
  Sun01Icon,
  ComputerIcon,
  Delete02Icon,
  ViewSidebarRightIcon,
  ColorsIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { deleteAccount } from "@/app/dashboard/actions/account"
import { ThemeIcon } from "@/components/theme-icons/ThemeIcon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardLoadingState } from "./LoadingState"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetBody,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DASHBOARD_THEMES, type DashboardPaletteTheme } from "@/lib/themes"

interface SettingsDialogProps {
  children?: React.ReactNode
  rowContent: "date" | "group"
  onRowContentChange: (value: "date" | "group") => void
  showNotesTodos: boolean
  onShowNotesTodosChange: (value: boolean) => void
  layoutDensity: "compact" | "extended"
  onLayoutDensityChange: (value: "compact" | "extended") => void
  userName: string
  paletteTheme: DashboardPaletteTheme
  onPaletteThemeChange: (value: DashboardPaletteTheme) => void
  folderHeaderTint: "off" | "low" | "medium" | "high"
  onFolderHeaderTintChange: (value: "off" | "low" | "medium" | "high") => void
}

export function SettingsDialog({
  children,
  rowContent,
  onRowContentChange,
  showNotesTodos,
  onShowNotesTodosChange,
  layoutDensity,
  onLayoutDensityChange,
  userName,
  paletteTheme,
  onPaletteThemeChange,
  folderHeaderTint,
  onFolderHeaderTintChange,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [themeSelectOpen, setThemeSelectOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { theme, setTheme } = useTheme()
  const { push } = useRouter()
  const normalizedName = useMemo(() => userName.trim(), [userName])
  const confirmPhrase = normalizedName || "your name"
  const isConfirmMatch = confirmValue.trim() === normalizedName

  useEffect(() => {
    const handleOpenSettings = () => setOpen(true)
    const handleCloseSettings = () => {
      setThemeSelectOpen(false)
      setOpen(false)
    }
    const handleOpenThemeSelect = () => setThemeSelectOpen(true)
    const handleCloseThemeSelect = () => setThemeSelectOpen(false)

    window.addEventListener("reway:open-settings", handleOpenSettings)
    window.addEventListener("reway:close-settings", handleCloseSettings)
    window.addEventListener("reway:open-theme-select", handleOpenThemeSelect)
    window.addEventListener("reway:close-theme-select", handleCloseThemeSelect)

    return () => {
      window.removeEventListener("reway:open-settings", handleOpenSettings)
      window.removeEventListener("reway:close-settings", handleCloseSettings)
      window.removeEventListener("reway:open-theme-select", handleOpenThemeSelect)
      window.removeEventListener("reway:close-theme-select", handleCloseThemeSelect)
    }
  }, [])

  const handleDeleteAccount = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (!isConfirmMatch || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success("Account deleted successfully")
      setConfirmOpen(false)
      setOpen(false)
      push("/login")
    } catch (error) {
      console.error("Delete account failed:", error)
      toast.error("Failed to delete account. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children ? <SheetTrigger asChild>{children}</SheetTrigger> : null}
      <SheetContent
        side="right"
        data-onboarding="settings-sheet"
        className="flex w-full flex-col sm:max-w-md p-0"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={Settings01Icon} size={20} strokeWidth={2} />
            Settings
          </SheetTitle>
          <SheetDescription>Customize your Reway experience</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <div data-onboarding="settings-controls" className="space-y-5">
            <SheetSection className="hidden md:block">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={ViewSidebarRightIcon} size={16} />
                Layout
              </h3>
              <div
                data-onboarding="layout-density-controls"
                className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-2"
              >
                <p className="text-xs text-muted-foreground px-1">
                  Control how much content is shown on desktop screens.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={layoutDensity === "compact" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onLayoutDensityChange("compact")}
                  >
                    Compact
                  </Button>
                  <Button
                    variant={layoutDensity === "extended" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onLayoutDensityChange("extended")}
                  >
                    Extended
                  </Button>
                </div>
              </div>
            </SheetSection>

            <SheetSection>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={ViewSidebarRightIcon} size={16} />
                Row Content
              </h3>
              <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-2">
                <p className="text-xs text-muted-foreground px-1">
                  Choose what to display in the right column of your bookmarks.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={rowContent === "date" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onRowContentChange("date")}
                  >
                    Date
                  </Button>
                  <Button
                    variant={rowContent === "group" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onRowContentChange("group")}
                  >
                    Group
                  </Button>
                </div>
              </div>
            </SheetSection>

            <SheetSection>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={ViewSidebarRightIcon} size={16} />
                Notes & Todos Sidebar
              </h3>
              <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-2">
                <p className="text-xs text-muted-foreground px-1">
                  Toggle the Notes & Todos sidebar visibility (desktop only).
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={showNotesTodos ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onShowNotesTodosChange(true)}
                  >
                    Show
                  </Button>
                  <Button
                    variant={!showNotesTodos ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                    onClick={() => onShowNotesTodosChange(false)}
                  >
                    Hide
                  </Button>
                </div>
              </div>
            </SheetSection>

            <SheetSection>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={ColorsIcon} size={16} />
                Appearance
              </h3>
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-2">
                <div data-onboarding="appearance-controls" className="space-y-2">
                  <div className="space-y-1">
                    <Label className="px-1">Folder header color</Label>
                    <p className="text-xs text-muted-foreground px-1">
                      Tint folder headers using the group color in folder view.
                    </p>
                  </div>

                  <Select
                    value={folderHeaderTint}
                    onValueChange={(value) =>
                      onFolderHeaderTintChange(value as "off" | "low" | "medium" | "high")
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg">
                      <span className="min-w-0 truncate">
                        <SelectValue placeholder="Folder header color" />
                      </span>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1 pt-2">
                    <Label className="px-1">Dashboard theme</Label>
                    <p className="text-xs text-muted-foreground px-1">
                      Choose the color palette used across the dashboard.
                    </p>
                  </div>

                  <Select
                    value={paletteTheme}
                    open={themeSelectOpen}
                    onOpenChange={setThemeSelectOpen}
                    onValueChange={(value) => onPaletteThemeChange(value as DashboardPaletteTheme)}
                  >
                    <SelectTrigger data-onboarding="palette-theme-trigger" className="w-full rounded-lg">
                      <span className="min-w-0 truncate">
                        <SelectValue placeholder="Theme" />
                      </span>
                    </SelectTrigger>
                    <SelectContent data-onboarding="palette-theme-options" align="start">
                      <SelectGroup>
                        {DASHBOARD_THEMES.map((themeOption) => (
                          <SelectItem key={themeOption.value} value={themeOption.value}>
                            <span className="flex items-center gap-2 min-w-0">
                              <ThemeIcon theme={themeOption.value} />
                              <span className="font-medium truncate">{themeOption.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1 pt-2">
                    <Label className="px-1">Color mode</Label>
                    <p className="text-xs text-muted-foreground px-1">
                      Switch between light, dark, or system appearance.
                    </p>
                  </div>

                  <div data-onboarding="color-mode-controls" className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      onClick={() => setTheme("light")}
                      aria-label="Light mode"
                      title="Light mode"
                    >
                      <HugeiconsIcon icon={Sun01Icon} size={16} />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      onClick={() => setTheme("dark")}
                      aria-label="Dark mode"
                      title="Dark mode"
                    >
                      <HugeiconsIcon icon={Moon02Icon} size={16} />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2 rounded-lg transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none cursor-pointer"
                      onClick={() => setTheme("system")}
                      aria-label="System mode"
                      title="System mode"
                    >
                      <HugeiconsIcon icon={ComputerIcon} size={16} />
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </SheetSection>
          </div>

          <SheetSection className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={Delete02Icon} size={18} />
              Danger Zone
            </h3>
            <div className="ml-7 space-y-2">
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive cursor-pointer"
                  >
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all bookmarks, groups, and your account. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="delete-account-confirmation">
                      Please Enter {confirmPhrase} to confirm
                    </Label>
                    <Input
                      id="delete-account-confirmation"
                      value={confirmValue}
                      onChange={(event) => setConfirmValue(event.target.value)}
                      placeholder={confirmPhrase}
                      disabled={isDeleting}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg cursor-pointer" disabled={isDeleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      className="rounded-lg cursor-pointer"
                      disabled={!isConfirmMatch || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {isDeleting ? <DashboardLoadingState label="Deleting" /> : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground">
                This action is irreversible. All your data will be removed.
              </p>
            </div>
          </SheetSection>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
