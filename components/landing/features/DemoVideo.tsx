"use client"

import { PlayIcon, PauseIcon, Maximize01Icon, Minimize01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DemoVideoProps {
  src: string
  poster?: string
  className?: string
  hideControls?: boolean
  onProgressUpdate?: (progress: number) => void
  onEnded?: () => void
  loop?: boolean
  isHovered?: boolean
  blurDataURL?: string
}

export function DemoVideo({
  src,
  poster,
  className,
  hideControls,
  onProgressUpdate,
  onEnded,
  loop = true,
  isHovered: isHoveredExternally,
  blurDataURL,
}: DemoVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayVideoRef = useRef<HTMLVideoElement>(null)
  const onProgressUpdateRef = useRef(onProgressUpdate)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isHoveredInternally, setIsHoveredInternally] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isTouchUI, setIsTouchUI] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // 2-phase loading states
  const [shouldAttachSource, setShouldAttachSource] = useState(false)
  // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [shouldPlay, setShouldPlay] = useState(false)

  const isHovered = isHoveredExternally ?? isHoveredInternally

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate
  }, [onProgressUpdate])

  useEffect(() => {
    let rafId: number
    const updateProgress = () => {
      const video = videoRef.current
      if (video && !video.paused) {
        const duration = video.duration
        const current = video.currentTime
        if (duration > 0) {
          const newProgress = (current / duration) * 100
          if (!hideControls) setProgress(newProgress)
          onProgressUpdateRef.current?.(newProgress)
        }
      }
      rafId = requestAnimationFrame(updateProgress)
    }
    rafId = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(rafId)
  }, [hideControls])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio
        if (entry.isIntersecting) setShouldAttachSource(true)
        setShouldPlay(ratio >= 0.5)
      },
      { rootMargin: "300px", threshold: [0, 0.1, 0.5] },
    )
    if (videoRef.current) observer.observe(videoRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!videoRef.current) return
    if (shouldPlay && !isMaximized) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [shouldPlay, isMaximized])

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)")
    const update = () => setIsTouchUI(Boolean(mql.matches))
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])

  // Sync overlay video currentTime when opening maximize
  useEffect(() => {
    if (isMaximized && overlayVideoRef.current && videoRef.current) {
      overlayVideoRef.current.currentTime = videoRef.current.currentTime
      overlayVideoRef.current.play().catch(() => {})
    }
  }, [isMaximized])

  // Lock body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMaximized])

  // Close on Escape key
  useEffect(() => {
    if (!isMaximized) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMaximized(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isMaximized])

  const handleMaximize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMaximized(true)
  }, [])

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Sync time back to main video before closing
    if (overlayVideoRef.current && videoRef.current) {
      videoRef.current.currentTime = overlayVideoRef.current.currentTime
    }
    setIsMaximized(false)
  }, [])

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [])

  const handleWrapperClick = useCallback(() => {
    if (!videoRef.current || isMaximized) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isMaximized])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video && !isReady && video.currentTime > 0) setIsReady(true)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (videoRef.current) {
      const seekValue = parseFloat(e.target.value)
      const seekTime = (seekValue / 100) * videoRef.current.duration
      videoRef.current.currentTime = seekTime
      setProgress(seekValue)
    }
  }

  return (
    <>
      <div
        ref={wrapperRef}
        role="button"
        tabIndex={0}
        className={cn(
          "group relative h-full w-full overflow-hidden cursor-pointer",
          "bg-muted/20",
          className,
        )}
        onClick={handleWrapperClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleWrapperClick() }}
        onMouseEnter={() => setIsHoveredInternally(true)}
        onMouseLeave={() => setIsHoveredInternally(false)}
      >
        {blurDataURL && (
          // eslint-disable-next-line @next/next/no-img-element, react-doctor/nextjs-no-img-element
          <img
            src={blurDataURL}
            alt=""
            aria-hidden
            className={cn(
              "absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-opacity duration-500",
              isReady ? "opacity-0" : "opacity-100",
            )}
          />
        )}

        <video
          ref={videoRef}
          poster={poster}
          preload="none"
          loop={loop}
          muted
          playsInline
          className={cn(
            "h-full w-full object-contain transition-opacity duration-300",
            isReady || isPlaying ? "opacity-100" : "opacity-0",
          )}
          onTimeUpdate={handleTimeUpdate}
          onEnded={onEnded}
          onLoadedData={() => setIsReady(true)}
          onCanPlay={() => setIsReady(true)}
          onPlaying={() => setIsReady(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          {shouldAttachSource && <source src={src} />}
        </video>

        {/* Maximize button — always visible, no state-driven opacity */}
        {hideControls && (
          <button
            onClick={handleMaximize}
            className="absolute right-3 top-3 z-10 flex h-7 items-center gap-1 px-2 rounded-lg bg-black/30 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/50 transition-colors duration-150 cursor-pointer"
            aria-label="Maximize"
            type="button"
          >
            <HugeiconsIcon icon={Maximize01Icon} size={13} />
            {!isTouchUI && (
              <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">
                Maximize
              </span>
            )}
          </button>
        )}

        {!isReady && <div className="absolute inset-0 bg-muted/40" />}

        {!hideControls && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col justify-end p-4 transition-opacity duration-200",
              isTouchUI
                ? isPlaying
                  ? "opacity-60"
                  : "opacity-100"
                : isHovered || !isPlaying
                  ? "opacity-100"
                  : "opacity-0",
            )}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="flex size-8 items-center justify-center rounded-xl ring-1 ring-foreground/8 bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
                type="button"
              >
                <HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} size={14} />
              </button>

              <div className="relative flex-1 flex items-center h-4">
                <div className="absolute w-full h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-foreground"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleSeek}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                />
              </div>

              <button
                onClick={handleMaximize}
                className="flex size-8 items-center justify-center rounded-xl ring-1 ring-foreground/8 bg-background text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Maximize"
                title="Maximize"
                type="button"
              >
                <HugeiconsIcon icon={Maximize01Icon} size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portal overlay — rendered directly under document.body, outside all stacking contexts */}
      {typeof window !== "undefined" &&
        isMaximized &&
        createPortal(
          <div
            role="button"
            tabIndex={0}
            aria-label="Close fullscreen"
            className="fixed inset-0 z-9999 flex items-center justify-center bg-gray-950"
            onClick={handleMinimize}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") handleMinimize(e as never) }}
          >
            <video
              ref={overlayVideoRef}
              loop={loop}
              muted
              playsInline
              autoPlay
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            >
              <source src={src} />
            </video>

            {/* Minimize button — always in DOM, always visible, no state dependencies */}
            <button
              onClick={handleMinimize}
              className="absolute right-4 top-4 flex h-8 items-center gap-1.5 px-2.5 rounded-xl bg-black/50 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/70 transition-colors cursor-pointer"
              aria-label="Minimize"
              type="button"
            >
              <HugeiconsIcon icon={Minimize01Icon} size={14} />
              {!isTouchUI && (
                <span className="text-[10px] font-semibold uppercase tracking-wider leading-none">
                  Minimize
                </span>
              )}
            </button>

            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-white/40 text-xs">
              {isTouchUI
                ? "Tap the Minimize button or anywhere outside to close"
                : "Press Esc or click anywhere to close"}
            </p>
          </div>,
          document.body,
        )}
    </>
  )
}
