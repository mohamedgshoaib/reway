"use client"

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTheme } from "next-themes"
import { useRef, useState, useSyncExternalStore } from "react"
import RewayLogo from "@/components/logo"
import { ThemeIcon } from "@/components/theme-icons/ThemeIcon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DASHBOARD_THEMES,
  getPaletteThemeClassName,
  type DashboardPaletteTheme,
} from "@/lib/themes"

import { BookmarksGrid } from "./hero-demo/BookmarksGrid"
import { DemoShell } from "./hero-demo/DemoShell"
import { useHeroDemoAutoplay } from "./hero-demo/useHeroDemoAutoplay"
import { GroupsDropdown } from "./hero-demo/GroupsDropdown"
import { GroupsSidebar } from "./hero-demo/GroupsSidebar"
import { NotesSectionPreview, TodosSectionPreview } from "./hero-demo/NotesTodosPreviews"
import { NotesTodosSidebar } from "./hero-demo/NotesTodosSidebar"
import { useHeroDemoState } from "./hero-demo/useHeroDemoState"

let __heroDemoHydrated = false

function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!__heroDemoHydrated) {
        __heroDemoHydrated = true
        queueMicrotask(onStoreChange)
      }
      return () => {}
    },
    () => __heroDemoHydrated,
    () => false,
  )
}

export function HeroDemoPreview() {
  const [demoTheme, setDemoTheme] = useState<DashboardPaletteTheme>("default")
  const { resolvedTheme, setTheme } = useTheme()
  const hasHydrated = useHasHydrated()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const {
    copiedIndex,
    activeGroup,
    setActiveGroup,
    commandMode,
    setCommandMode,
    commandInputValue,
    setCommandInputValue,
    isCommandFocused,
    setIsCommandFocused,
    stableBookmarkSlots,
    heroGroups,
    creatingGroup,
    setCreatingGroup,
    newGroupName,
    setNewGroupName,
    newGroupIcon,
    setNewGroupIcon,
    newGroupColor,
    setNewGroupColor,
    dropdownCreatingGroup,
    setDropdownCreatingGroup,
    dropdownNewGroupName,
    setDropdownNewGroupName,
    dropdownNewGroupIcon,
    setDropdownNewGroupIcon,
    dropdownNewGroupColor,
    setDropdownNewGroupColor,
    activeNotesTodosSection,
    setActiveNotesTodosSection,
    notes,
    todos,
    handleCreateHeroGroupFromDropdown,
    handleCreateHeroGroup,
    cancelCreateHeroGroup,
    cancelCreateHeroGroupFromDropdown,
    submitCommandInput,
    handleCopy,
    handleOpen,
    handleEdit,
    handleToggleTodoCompleted,
    addAutoplayBookmark,
    resetAutoplayBookmarks,
    handleCreateNote,
    handleCreateTodo,
  } = useHeroDemoState()

  useHeroDemoAutoplay({
    activeGroup,
    inputRef,
    setCommandInputValue,
    addAutoplayBookmark,
    resetAutoplayBookmarks,
  })

  const themeClassName = getPaletteThemeClassName(demoTheme)
  const isDark = hasHydrated && resolvedTheme === "dark"

  const demoControls = (
    <div className="flex flex-wrap items-center gap-3">
      <span id="hero-demo-theme-label" className="text-xs font-medium text-muted-foreground">
        Theme:
      </span>
      <Select
        value={demoTheme}
        onValueChange={(value) => setDemoTheme(value as DashboardPaletteTheme)}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby="hero-demo-theme-label"
          className="h-7 w-42 rounded-lg bg-background/60 px-2 text-xs font-medium ring-0 after:content-none hover:bg-background/60 dark:hover:bg-background/60"
        >
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent align="start">
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

      <Button
        type="button"
        variant={hasHydrated ? (!isDark ? "default" : "outline") : "outline"}
        size="icon"
        className="size-6 rounded-lg cursor-pointer"
        onClick={() => setTheme("light")}
        aria-label="Light"
        title="Light"
        suppressHydrationWarning
      >
        <HugeiconsIcon icon={Sun01Icon} size={13} />
      </Button>
      <Button
        type="button"
        variant={hasHydrated ? (isDark ? "default" : "outline") : "outline"}
        size="icon"
        className="size-6 rounded-lg cursor-pointer"
        onClick={() => setTheme("dark")}
        aria-label="Dark"
        title="Dark"
        suppressHydrationWarning
      >
        <HugeiconsIcon icon={Moon02Icon} size={13} />
      </Button>
    </div>
  )

  return (
    <div className="mx-auto mt-12 w-full max-w-350">
      <DemoShell controls={demoControls}>
        <div className="flex">
          <div className={`${themeClassName} flex flex-1 bg-background text-foreground`}>
            <GroupsSidebar
              activeGroup={activeGroup}
              heroGroups={heroGroups}
              creatingGroup={creatingGroup}
              newGroupName={newGroupName}
              newGroupIcon={newGroupIcon}
              newGroupColor={newGroupColor}
              setNewGroupName={setNewGroupName}
              setNewGroupIcon={setNewGroupIcon}
              setNewGroupColor={setNewGroupColor}
              onSelectGroup={setActiveGroup}
              onOpenCreate={() => setCreatingGroup(true)}
              onCancelCreate={cancelCreateHeroGroup}
              onCreate={handleCreateHeroGroup}
            />

            <div className="flex-1 min-w-0 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <RewayLogo className="size-7" aria-hidden="true" focusable="false" />

                    <GroupsDropdown
                      activeGroup={activeGroup}
                      heroGroups={heroGroups}
                      dropdownCreatingGroup={dropdownCreatingGroup}
                      dropdownNewGroupName={dropdownNewGroupName}
                      dropdownNewGroupIcon={dropdownNewGroupIcon}
                      dropdownNewGroupColor={dropdownNewGroupColor}
                      setDropdownNewGroupName={setDropdownNewGroupName}
                      setDropdownCreatingGroup={setDropdownCreatingGroup}
                      setDropdownNewGroupIcon={setDropdownNewGroupIcon}
                      setDropdownNewGroupColor={setDropdownNewGroupColor}
                      onSelectGroup={(id) => setActiveGroup(id)}
                      onCreateGroup={handleCreateHeroGroupFromDropdown}
                      onCancelCreate={cancelCreateHeroGroupFromDropdown}
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Avatar className="size-7">
                      <AvatarImage src="https://api.dicebear.com/9.x/thumbs/svg?seed=Reway" />
                      <AvatarFallback className="bg-secondary text-[10px] text-secondary-foreground">
                        RW
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="relative w-full" data-onboarding="command-bar">
                  <div
                    className={`group relative flex items-center justify-between gap-2 rounded-2xl px-1.5 py-1.5 after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:pointer-events-none after:content-[''] shadow-none isolate ${
                      isCommandFocused
                        ? "ring-1 ring-primary/30 after:ring-white/10"
                        : "ring-1 ring-foreground/8 after:ring-white/5"
                    }`}
                  >
                    <div className="relative flex-1 min-w-0">
                      <form
                        action={() => {
                          submitCommandInput()
                        }}
                      >
                        <input
                          ref={inputRef}
                          type="text"
                          value={commandInputValue}
                          onChange={(e) => setCommandInputValue(e.target.value)}
                          onFocus={() => setIsCommandFocused(true)}
                          onBlur={() => setIsCommandFocused(false)}
                          placeholder={
                            commandMode === "search"
                              ? "Search bookmarks..."
                              : "Paste a link to save..."
                          }
                          className="w-full bg-transparent p-0 pl-1.5 text-sm font-medium outline-none placeholder:text-muted-foreground selection:bg-primary/20 cursor-text"
                          aria-label="Paste link or search bookmarks"
                        />
                      </form>
                    </div>

                      <div className="flex items-center gap-1 rounded-xl bg-muted/20 p-1 ring-1 ring-inset ring-foreground/5">
                      <button
                        type="button"
                        onClick={() => setCommandMode("add")}
                          className={`flex items-center gap-1 px-1.5 py-1 text-[11px] rounded-lg cursor-pointer ${
                          commandMode === "add"
                            ? "bg-muted/40 text-primary"
                            : "text-muted-foreground hover:text-primary hover:bg-muted/40"
                        }`}
                        aria-label="Add bookmarks"
                      >
                        <span>Add</span>
                        <KbdGroup className="hidden md:inline-flex">
                          <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">CtrlK</Kbd>
                        </KbdGroup>
                      </button>
                      <button
                        type="button"
                        onClick={() => {}}
                          className={`flex items-center gap-1 px-1.5 py-1 text-[11px] rounded-lg cursor-pointer ${
                          commandMode === "search"
                            ? "bg-muted/40 text-primary"
                            : "text-muted-foreground hover:text-primary hover:bg-muted/40"
                        }`}
                        aria-label="Search bookmarks"
                      >
                        <span>Search</span>
                        <KbdGroup className="hidden md:inline-flex">
                          <Kbd className="h-4.5 min-w-4.5 text-[10px] px-1">CtrlF</Kbd>
                        </KbdGroup>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden flex-wrap items-center gap-4 text-[10px] text-muted-foreground sm:flex">
                  <div className="flex items-center gap-1.5">
                    <KbdGroup className="gap-0.5">
                      <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">↑</Kbd>
                      <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">↓</Kbd>
                      <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">←</Kbd>
                      <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">→</Kbd>
                    </KbdGroup>
                    navigate
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Kbd className="h-4.5 min-w-4.5 px-1 text-[9px]">Space</Kbd>
                    preview
                  </div>
                  <div className="flex items-center gap-1.5">
                    <KbdGroup className="gap-0.5">
                      <Kbd className="h-4.5 min-w-4.5 px-1 text-[9px]">Ctrl</Kbd>
                      <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">⏎</Kbd>
                    </KbdGroup>
                    open
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Kbd className="h-4.5 min-w-4.5 px-0.5 text-[9px]">⏎</Kbd>
                    copy
                  </div>
                  <div className="flex items-center gap-1.5">
                    <KbdGroup className="gap-0.5">
                      <Kbd className="h-4.5 min-w-4.5 px-1 text-[9px]">Shift</Kbd>
                      <Kbd className="h-4.5 min-w-4.5 px-1 text-[9px]">Click</Kbd>
                    </KbdGroup>
                    bulk select
                  </div>
                </div>

                <BookmarksGrid
                  stableBookmarkSlots={stableBookmarkSlots}
                  copiedIndex={copiedIndex}
                  onCopy={handleCopy}
                  onOpen={handleOpen}
                  onEdit={handleEdit}
                />
              </div>
            </div>

            <NotesTodosSidebar
              activeNotesTodosSection={activeNotesTodosSection}
              setActiveNotesTodosSection={setActiveNotesTodosSection}
              notes={notes}
              todos={todos}
              NotesSectionPreview={NotesSectionPreview}
              TodosSectionPreview={(props) => (
                <TodosSectionPreview {...props} onToggleCompleted={handleToggleTodoCompleted} />
              )}
              onCreateNote={handleCreateNote}
              onCreateTodo={handleCreateTodo}
            />
          </div>
        </div>
      </DemoShell>
    </div>
  )
}
