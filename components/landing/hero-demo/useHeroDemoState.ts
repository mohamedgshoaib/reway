import { BulbIcon, Folder01Icon, Search01Icon, ToolsIcon } from "@hugeicons/core-free-icons"
import { useMemo, useState } from "react"

import type { TodoPriority } from "@/components/dashboard/content/notes-todos/types"
import type { NoteRow, TodoRow } from "@/lib/supabase/queries"

import { extractUrlsFromText } from "@/components/dashboard/command-bar/helpers"
import { fetchDemoMetadata } from "./actions"
import { getInitialHeroGroups } from "./data"
import {
  createBookmarkFromCommandInput,
  createInitialHeroBookmarks,
  createInitialNotes,
  createInitialTodos,
  createStableBookmarkSlots,
  filterVisibleHeroBookmarks,
  makeHeroDemoId,
  updateTodoCompleted,
  updateTodoValues,
} from "./helpers"
import type { HeroGroup, HeroGroupId } from "./types"

const HERO_GROUP_PRESETS: Record<string, { icon: typeof Folder01Icon; color: string }> = {
  Research: { icon: Search01Icon, color: "#3b82f6" },
  Inspiration: { icon: BulbIcon, color: "#f59e0b" },
  Build: { icon: ToolsIcon, color: "#10b981" },
}

const HERO_DEMO_SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z"

const HERO_DEMO_SEED_GROUP_IDS = new Set<HeroGroupId>([
  "all",
  "No Group",
  "Research",
  "Inspiration",
  "Build",
  "Learn",
])

export function useHeroDemoState() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeGroup, setActiveGroup] = useState<HeroGroupId>("all")
  const [commandMode, setCommandMode] = useState<"add" | "search">("add")
  const [commandInputValue, setCommandInputValue] = useState("")
  const [isCommandFocused, setIsCommandFocused] = useState(false)

  const [heroBookmarks, setHeroBookmarks] = useState(createInitialHeroBookmarks)
  const [notes, setNotes] = useState<NoteRow[]>(createInitialNotes)
  const [activeNotesTodosSection, setActiveNotesTodosSection] = useState<"notes" | "todos">("notes")
  const [heroGroups, setHeroGroups] = useState<HeroGroup[]>(() =>
    getInitialHeroGroups({
      folder: Folder01Icon,
      search: Search01Icon,
      bulb: BulbIcon,
      tools: ToolsIcon,
    }),
  )

  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupIcon, setNewGroupIcon] = useState<
    typeof Search01Icon | typeof BulbIcon | typeof ToolsIcon | typeof Folder01Icon
  >(Folder01Icon)
  const [newGroupColor, setNewGroupColor] = useState<string | null>(null)

  const [dropdownCreatingGroup, setDropdownCreatingGroup] = useState(false)
  const [dropdownNewGroupName, setDropdownNewGroupName] = useState("")
  const [dropdownNewGroupIcon, setDropdownNewGroupIcon] = useState<
    typeof Search01Icon | typeof BulbIcon | typeof ToolsIcon | typeof Folder01Icon
  >(Folder01Icon)
  const [dropdownNewGroupColor, setDropdownNewGroupColor] = useState<string | null>(null)

  const [todos, setTodos] = useState<TodoRow[]>(createInitialTodos)

  const visibleBookmarks = useMemo(
    () =>
      filterVisibleHeroBookmarks({
        activeGroup,
        bookmarks: heroBookmarks,
        commandMode,
        searchQuery: commandInputValue,
      }),
    [activeGroup, commandMode, heroBookmarks, commandInputValue],
  )

  const stableBookmarkSlots = useMemo(
    () => createStableBookmarkSlots(visibleBookmarks),
    [visibleBookmarks],
  )

  const handleCreateHeroGroupFromDropdown = () => {
    const name = dropdownNewGroupName.trim()
    if (!name) return
    const id = makeHeroDemoId()

    setHeroGroups((prev) => {
      const seeded = prev.filter((g) => HERO_DEMO_SEED_GROUP_IDS.has(g.id as HeroGroupId))
      const user = prev.filter((g) => !HERO_DEMO_SEED_GROUP_IDS.has(g.id as HeroGroupId))
      const nextUser = user.length >= 3 ? [...user.slice(1)] : [...user]

      return [
        ...seeded,
        ...nextUser,
        {
          id,
          label: name,
          icon: dropdownNewGroupIcon,
          color: dropdownNewGroupColor,
        },
      ]
    })

    setDropdownCreatingGroup(false)
    setDropdownNewGroupName("")
    setDropdownNewGroupIcon(Folder01Icon)
    setDropdownNewGroupColor(null)
    setActiveGroup("all")
  }

  const handleCreateHeroGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const id = makeHeroDemoId()
    const preset = HERO_GROUP_PRESETS[name] ?? null

    setHeroGroups((prev) => {
      const seeded = prev.filter((g) => HERO_DEMO_SEED_GROUP_IDS.has(g.id as HeroGroupId))
      const user = prev.filter((g) => !HERO_DEMO_SEED_GROUP_IDS.has(g.id as HeroGroupId))
      const nextUser = user.length >= 3 ? [...user.slice(1)] : [...user]

      return [
        ...seeded,
        ...nextUser,
        {
          id,
          label: name,
          icon: preset?.icon ?? newGroupIcon,
          color: preset?.color ?? newGroupColor,
        },
      ]
    })

    setCreatingGroup(false)
    setNewGroupName("")
    setNewGroupIcon(Folder01Icon)
    setNewGroupColor(null)
    setActiveGroup("all")
  }

  const cancelCreateHeroGroup = () => {
    setCreatingGroup(false)
    setNewGroupName("")
    setNewGroupIcon(Folder01Icon)
    setNewGroupColor(null)
  }

  const cancelCreateHeroGroupFromDropdown = () => {
    setDropdownCreatingGroup(false)
    setDropdownNewGroupName("")
    setDropdownNewGroupIcon(Folder01Icon)
    setDropdownNewGroupColor(null)
  }

  const submitCommandInput = () => {
    if (commandMode !== "add") return

    const value = commandInputValue.trim()
    if (!value) return

    const extracted = extractUrlsFromText(value)
    const urls = extracted.length ? extracted : [value]

    const createdIds: string[] = []

    const nextBookmarks = urls.map((url) => {
      const id = makeHeroDemoId()
      createdIds.push(id)

      return createBookmarkFromCommandInput({
        activeGroup,
        value: url,
        id,
        shimmerUrl: true,
      })
    })

    setHeroBookmarks((prev) => {
      const next = [...nextBookmarks, ...prev]
      return next.slice(0, 9)
    })

    setCommandInputValue("")

    urls.forEach((url, index) => {
      const createdId = createdIds[index]
      fetchDemoMetadata(url).then((meta) => {
        setHeroBookmarks((prev) =>
          prev.map((b) => {
            if (b.id === createdId) {
              return {
                ...b,
                shimmerUrl: false,
                title: meta?.title || b.title,
                domain: meta?.domain || b.domain,
              }
            }
            return b
          }),
        )
      })
    })
  }

  const handleToggleTodoCompleted = (id: string, completed: boolean) => {
    void handleSetTodoCompleted(id, completed)
  }

  const handleCreateNote = async (formData: { text: string; color?: string | null }) => {
    const id = makeHeroDemoId()

    setNotes((prev) => {
      const seeded = prev.filter((note) => note.created_at === HERO_DEMO_SEED_TIMESTAMP)
      const user = prev.filter((note) => note.created_at !== HERO_DEMO_SEED_TIMESTAMP)

      const nextUser = user.length >= 3 ? user.slice(1) : user
      const created_at = new Date().toISOString()

      return [
        ...seeded,
        ...nextUser,
        {
          id,
          user_id: "hero",
          text: formData.text,
          color: formData.color ?? null,
          created_at,
          updated_at: created_at,
          order_index: seeded.length + nextUser.length,
        },
      ]
    })

    return id
  }

  const handleUpdateNote = async (
    id: string,
    formData: { text: string; color?: string | null },
  ) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              text: formData.text,
              color: formData.color ?? null,
              updated_at: new Date().toISOString(),
            }
          : note,
      ),
    )
  }

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const handleDeleteNotes = async (ids: string[]) => {
    const idSet = new Set(ids)
    setNotes((prev) => prev.filter((note) => !idSet.has(note.id)))
  }

  const handleCreateTodo = async (formData: { text: string; priority: TodoPriority }) => {
    const id = makeHeroDemoId()

    setTodos((prev) => {
      const seeded = prev.filter((todo) => todo.created_at === HERO_DEMO_SEED_TIMESTAMP)
      const user = prev.filter((todo) => todo.created_at !== HERO_DEMO_SEED_TIMESTAMP)
      const nextUser = user.length >= 3 ? user.slice(1) : user
      const created_at = new Date().toISOString()

      return [
        ...seeded,
        ...nextUser,
        {
          id,
          user_id: "hero",
          text: formData.text,
          priority: formData.priority,
          completed: false,
          created_at,
          updated_at: created_at,
          completed_at: null,
          order_index: seeded.length + nextUser.length,
        },
      ]
    })

    return id
  }

  const handleUpdateTodo = async (
    id: string,
    formData: { text: string; priority: TodoPriority },
  ) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updateTodoValues(todo, formData) : todo)),
    )
  }

  const handleDeleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  const handleDeleteTodos = async (ids: string[]) => {
    const idSet = new Set(ids)
    setTodos((prev) => prev.filter((todo) => !idSet.has(todo.id)))
  }

  const handleSetTodoCompleted = async (id: string, completed: boolean) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? updateTodoCompleted(todo, completed) : todo)),
    )
  }

  const handleSetTodosCompleted = async (ids: string[], completed: boolean) => {
    const idSet = new Set(ids)
    setTodos((prev) =>
      prev.map((todo) => (idSet.has(todo.id) ? updateTodoCompleted(todo, completed) : todo)),
    )
  }

  const handleCopy = async (event: React.MouseEvent, bookmarkUrl: string, index: number) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(bookmarkUrl)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      setCopiedIndex(null)
    }
  }

  const handleOpen = (event: React.MouseEvent, bookmarkUrl: string) => {
    event.preventDefault()
    event.stopPropagation()
    window.open(bookmarkUrl, "_blank", "noopener,noreferrer")
  }

  const handleEdit = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return {
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
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
    handleDeleteNotes,
    handleCreateTodo,
    handleUpdateTodo,
    handleDeleteTodo,
    handleDeleteTodos,
    handleSetTodoCompleted,
    handleSetTodosCompleted,
  }
}
