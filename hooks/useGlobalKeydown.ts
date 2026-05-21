"use client"

import { useEffect, useRef } from "react"

type KeydownHandler = (event: KeyboardEvent) => void

const captureHandlers = new Set<KeydownHandler>()
const bubbleHandlers = new Set<KeydownHandler>()
let isCaptureListenerAttached = false
let isBubbleListenerAttached = false

const captureListener = (event: KeyboardEvent) => {
  if (event.isComposing || event.key === "Process") return
  captureHandlers.forEach((handler) => handler(event))
}

const bubbleListener = (event: KeyboardEvent) => {
  if (event.isComposing || event.key === "Process") return
  bubbleHandlers.forEach((handler) => handler(event))
}

function ensureListener(capture: boolean) {
  if (capture) {
    if (isCaptureListenerAttached) return
    window.addEventListener("keydown", captureListener, { capture: true })
    isCaptureListenerAttached = true
    return
  }

  if (isBubbleListenerAttached) return
  window.addEventListener("keydown", bubbleListener)
  isBubbleListenerAttached = true
}

function detachListenerIfUnused(capture: boolean) {
  if (typeof window === "undefined") return
  if (capture) {
    if (!isCaptureListenerAttached) return
    if (captureHandlers.size > 0) return
    window.removeEventListener("keydown", captureListener, { capture: true })
    isCaptureListenerAttached = false
    return
  }

  if (!isBubbleListenerAttached) return
  if (bubbleHandlers.size > 0) return
  window.removeEventListener("keydown", bubbleListener)
  isBubbleListenerAttached = false
}

function registerHandler(handler: KeydownHandler, capture: boolean) {
  const target = capture ? captureHandlers : bubbleHandlers
  target.add(handler)
  if (typeof window !== "undefined") {
    ensureListener(capture)
  }
  return () => {
    target.delete(handler)
    detachListenerIfUnused(capture)
  }
}

export function useGlobalKeydown(handler: KeydownHandler, options?: { capture?: boolean }) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const wrapped: KeydownHandler = (event) => handlerRef.current(event)
    return registerHandler(wrapped, options?.capture ?? false)
  }, [options?.capture])
}
