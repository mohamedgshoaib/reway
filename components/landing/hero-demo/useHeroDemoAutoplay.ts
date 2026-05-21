"use client"

import type { ComponentType, SVGProps } from "react"
import type { RefObject } from "react"
import { useEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"
import { ClaudeAI } from "@/components/theme-icons/claude"
import { PerplexityAI } from "@/components/theme-icons/perplexity"
import { Supabase } from "@/components/theme-icons/supabase"
import { Reddit } from "@/components/theme-icons/reddit"
import type { HeroGroupId } from "./types"

// Timing (ms)
const CHAR_DELAY_SINGLE = 48   // deliberate single-URL typing
const CHAR_DELAY_MULTI = 14    // fast multi-URL typing
const PAUSE_BEFORE_SUBMIT = 600
const PAUSE_AFTER_ONE = 1600   // enough to see shimmer resolve, then move on
const PAUSE_AFTER_THREE = 2200
const PAUSE_BETWEEN = 700
const PAUSE_AFTER_RESET = 700
const INITIAL_DELAY = 1400

type BookmarkSpec = {
  url: string
  title: string
  domain: string
  group: Exclude<HeroGroupId, "all">
  faviconIcon: ComponentType<SVGProps<SVGSVGElement>>
}

type Phase = {
  displayText: string
  charDelay: number
  bookmarks: BookmarkSpec[]
  pauseAfter: number
}

const PHASES: Phase[] = [
  {
    displayText: "https://claude.ai/",
    charDelay: CHAR_DELAY_SINGLE,
    bookmarks: [
      {
        url: "https://claude.ai/",
        title: "Claude",
        domain: "claude.ai",
        group: "Build",
        faviconIcon: ClaudeAI,
      },
    ],
    pauseAfter: PAUSE_AFTER_ONE,
  },
  {
    displayText:
      "https://www.perplexity.ai/ https://supabase.com/ https://www.reddit.com/",
    charDelay: CHAR_DELAY_MULTI,
    bookmarks: [
      {
        url: "https://www.perplexity.ai/",
        title: "Perplexity",
        domain: "perplexity.ai",
        group: "Research",
        faviconIcon: PerplexityAI,
      },
      {
        url: "https://supabase.com/",
        title: "Supabase",
        domain: "supabase.com",
        group: "Build",
        faviconIcon: Supabase,
      },
      {
        url: "https://www.reddit.com/",
        title: "Reddit",
        domain: "reddit.com",
        group: "Inspiration",
        faviconIcon: Reddit,
      },
    ],
    pauseAfter: PAUSE_AFTER_THREE,
  },
]

export function useHeroDemoAutoplay({
  activeGroup,
  inputRef,
  setCommandInputValue,
  addAutoplayBookmark,
  resetAutoplayBookmarks,
}: {
  activeGroup: string
  inputRef: RefObject<HTMLInputElement | null>
  setCommandInputValue: (value: string) => void
  addAutoplayBookmark: (spec: {
    url: string
    title: string
    domain: string
    group: Exclude<HeroGroupId, "all">
    faviconIcon?: ComponentType<SVGProps<SVGSVGElement>>
  }) => string
  resetAutoplayBookmarks: () => void
}) {
  const shouldReduceMotion = useReducedMotion()

  const setInputRef = useRef(setCommandInputValue)
  const addRef = useRef(addAutoplayBookmark)
  const resetRef = useRef(resetAutoplayBookmarks)
  useEffect(() => {
    setInputRef.current = setCommandInputValue
  }, [setCommandInputValue])
  useEffect(() => {
    addRef.current = addAutoplayBookmark
  }, [addAutoplayBookmark])
  useEffect(() => {
    resetRef.current = resetAutoplayBookmarks
  }, [resetAutoplayBookmarks])

  useEffect(() => {
    if (shouldReduceMotion) return
    if (activeGroup !== "all") return

    resetRef.current()
    const inputEl = inputRef.current

    let stopped = false
    const pending = new Set<ReturnType<typeof setTimeout>>()

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          pending.delete(t)
          resolve()
        }, ms)
        pending.add(t)
      })

    const typeText = async (text: string, charDelay: number): Promise<boolean> => {
      for (let i = 1; i <= text.length; i++) {
        if (stopped) return false
        setInputRef.current(text.slice(0, i))
        await sleep(charDelay)
      }
      return !stopped
    }

    ;(async () => {
      await sleep(INITIAL_DELAY)
      if (stopped) return
      inputRef.current?.focus()

      for (;;) {
        if (stopped) return
        for (const phase of PHASES) {
          if (stopped) return

          const ok = await typeText(phase.displayText, phase.charDelay)
          if (!ok) return

          await sleep(PAUSE_BEFORE_SUBMIT)
          if (stopped) return

          for (const spec of phase.bookmarks) {
            addRef.current(spec)
          }
          setInputRef.current("")

          await sleep(phase.pauseAfter)
          if (stopped) return

          await sleep(PAUSE_BETWEEN)
          if (stopped) return
        }

        resetRef.current()
        await sleep(PAUSE_AFTER_RESET)
      }
    })()

    return () => {
      stopped = true
      pending.forEach(clearTimeout)
      pending.clear()
      setInputRef.current("")
      inputEl?.blur()
      resetRef.current()
    }
  }, [activeGroup, shouldReduceMotion, inputRef])
}
