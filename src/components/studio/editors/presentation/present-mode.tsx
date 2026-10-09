"use client"

/**
 * PresentMode — fullscreen presentation overlay.
 *
 *  • Fullscreen API with graceful fallback to a fixed overlay
 *  • Keyboard: ←/→/space/Home/End, Esc exits; click zones; touch swipe
 *  • Slide transitions via CSS animation classes (per-slide setting)
 *  • Presenter view toggle: notes (editable) + next-slide preview
 *  • Optional autoplay using each slide's durationMs
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { DesignDoc } from "@/lib/design/types"
import { renderPageToCanvas } from "@/lib/editor/export"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, GripVertical, Loader2, MonitorPlay, Pause, Play, X, Maximize, Minimize } from "lucide-react"

export interface PresentModeProps {
  doc: DesignDoc
  pageIndex: number
  onIndexChange: (index: number) => void
  onExit: () => void
  onNotesChange: (pageIndex: number, notes: string) => void
}

const ANIMATION_MS: Record<string, number> = { none: 0, fade: 420, slide: 420, zoom: 420 }

export function PresentMode({ doc, pageIndex, onIndexChange, onExit, onNotesChange }: PresentModeProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const slideCache = useRef(new Map<string, string>())
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [presenter, setPresenter] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const pages = doc.pages
  const clamped = Math.max(0, Math.min(pageIndex, pages.length - 1))
  const page = pages[clamped]
  const nextPage = pages[clamped + 1]

  /* ------------------------- fullscreen handling ------------------------- */
  useEffect(() => {
    const el = rootRef.current
    if (el && !document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => {
        /* fallback: fixed overlay stays usable */
      })
    }
    function onFsChange() {
      const active = !!document.fullscreenElement
      setIsFullscreen(active)
      if (!active) onExit()
    }
    document.addEventListener("fullscreenchange", onFsChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
      slideCache.current.clear()
    }
  }, [onExit])

  /* ---------------------------- slide rendering ---------------------------- */
  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      const want = [clamped - 1, clamped, clamped + 1].filter((i) => i >= 0 && i < pages.length)
      void Promise.all(
        want.map(async (i) => {
          const p = pages[i]
          if (slideCache.current.has(p.id)) return null
          const canvas = await renderPageToCanvas(doc, p, { maxSide: 1600 })
          const url = canvas.toDataURL("image/jpeg", 0.86)
          slideCache.current.set(p.id, url)
          return p.id
        }),
      ).then((ids) => {
        if (!alive) return
        setUrls((prev) => {
          const next = { ...prev }
          let changed = false
          for (const id of ids) {
            if (id) {
              const url = slideCache.current.get(id)
              if (url && next[id] !== url) {
                next[id] = url
                changed = true
              }
            }
          }
          return changed ? next : prev
        })
      })
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [doc, clamped, pages])

  /* ------------------------------ navigation ------------------------------ */
  const go = useCallback(
    (delta: number) => {
      const target = Math.max(0, Math.min(pageIndex + delta, pages.length - 1))
      if (target !== pageIndex) onIndexChange(target)
    },
    [onIndexChange, pageIndex, pages.length],
  )

  const goTo = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(i, pages.length - 1))
      if (target !== pageIndex) onIndexChange(target)
    },
    [onIndexChange, pageIndex, pages.length],
  )

  /* keyboard */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
        case "Enter":
          e.preventDefault()
          go(1)
          break
        case "ArrowLeft":
        case "PageUp":
        case "Backspace":
          e.preventDefault()
          go(-1)
          break
        case "Home":
          e.preventDefault()
          goTo(0)
          break
        case "End":
          e.preventDefault()
          goTo(pages.length - 1)
          break
        case "Escape":
          e.preventDefault()
          onExit()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, goTo, onExit, pages.length])

  /* autoplay */
  useEffect(() => {
    if (!playing) return
    const duration = Math.max(1000, page?.durationMs ?? 5000)
    const timer = setInterval(() => {
      if (pageIndex >= pages.length - 1) setPlaying(false)
      else onIndexChange(pageIndex + 1)
    }, duration)
    return () => clearInterval(timer)
  }, [onIndexChange, pageIndex, page?.durationMs, pages.length, playing])

  const transition = page?.transition ?? "none"
  const animMs = ANIMATION_MS[transition] ?? 0

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] flex flex-col bg-black text-white select-none" role="dialog" aria-label="Presentation mode">
      {/* transition keyframes */}
      <style>{`
        @keyframes pres-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pres-slide { from { transform: translateX(5%); opacity: .35 } to { transform: none; opacity: 1 } }
        @keyframes pres-zoom { from { transform: scale(.94); opacity: 0 } to { transform: none; opacity: 1 } }
        .pres-fade { animation: pres-fade ${ANIMATION_MS.fade}ms ease both }
        .pres-slide { animation: pres-slide ${ANIMATION_MS.slide}ms cubic-bezier(.22,.8,.36,1) both }
        .pres-zoom { animation: pres-zoom ${ANIMATION_MS.zoom}ms cubic-bezier(.22,.8,.36,1) both }
      `}</style>

      {/* progress */}
      <div className="h-1 w-full shrink-0 bg-white/10">
        <div className="h-full bg-primary transition-all" style={{ width: `${((clamped + 1) / Math.max(1, pages.length)) * 100}%` }} />
      </div>

      {/* main stage area */}
      <div className="relative flex min-h-0 flex-1">
        {/* click / touch zones */}
        <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-10 w-1/4 cursor-w-resize" />
        <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute inset-y-0 right-0 z-10 w-3/4 cursor-e-resize" />

        <div
          className={cn("flex flex-1 items-center justify-center overflow-hidden", transition !== "none" && `pres-${transition}`)}
          key={`${page?.id}-${clamped}`}
          onTouchStart={(e) => {
            const t = e.touches[0]
            touchStart.current = { x: t.clientX, y: t.clientY }
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current
            touchStart.current = null
            if (!start) return
            const t = e.changedTouches[0]
            const dx = t.clientX - start.x
            const dy = t.clientY - start.y
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
          }}
        >
          {urls[page?.id] ? (
            <img src={urls[page.id]} alt={`Slide ${clamped + 1}`} className="max-h-full max-w-full object-contain" draggable={false} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xs">Rendering slide…</p>
            </div>
          )}
        </div>

        {/* presenter view */}
        {presenter ? (
          <aside className="hidden w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/15 bg-zinc-950/95 p-3 md:flex" aria-label="Presenter view">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">Next slide</p>
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black">
                {nextPage ? (
                  urls[nextPage.id] ? (
                    <img src={urls[nextPage.id]} alt="Next slide preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                  )
                ) : (
                  <span className="text-xs text-white/40">End of deck</span>
                )}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">Notes — slide {clamped + 1}</p>
              <Textarea
                value={page?.notes ?? ""}
                onChange={(e) => onNotesChange(clamped, e.target.value)}
                placeholder="No notes for this slide."
                className="min-h-[140px] flex-1 resize-none border-white/15 bg-white/5 text-xs text-white placeholder:text-white/30"
                aria-label="Presenter notes"
              />
            </div>
          </aside>
        ) : null}
      </div>

      {/* controls */}
      <div className="flex h-14 shrink-0 items-center justify-center gap-1.5 bg-zinc-950/95 px-3 pb-[env(safe-area-inset-bottom)]">
        <Button variant="ghost" size="icon" className="h-11 w-11 text-white hover:bg-white/10" onClick={() => go(-1)} disabled={clamped === 0} aria-label="Previous slide">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11 text-white hover:bg-white/10" onClick={() => go(1)} disabled={clamped >= pages.length - 1} aria-label="Next slide">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span className="mx-2 min-w-[64px] text-center text-sm tabular-nums text-white/80">
          {clamped + 1} / {pages.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-white hover:bg-white/10"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause autoplay" : "Start autoplay"}
          title={`Autoplay uses each slide's duration (${Math.round((page?.durationMs ?? 5000) / 1000)}s here)`}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          variant={presenter ? "secondary" : "ghost"}
          size="icon"
          className="h-11 w-11 text-white hover:bg-white/10"
          onClick={() => setPresenter((p) => !p)}
          aria-pressed={presenter}
          aria-label="Toggle presenter view"
          title="Presenter view (notes + next slide)"
        >
          <MonitorPlay className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-white hover:bg-white/10"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
            else void rootRef.current?.requestFullscreen?.().catch(() => {})
          }}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-11 w-11 text-white hover:bg-white/10" onClick={onExit} aria-label="Exit presentation">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-white/70" style={{ animation: `pres-fade ${Math.max(animMs, 400) + 3200}ms ease both` }}>
        <GripVertical className="h-3 w-3" /> ←/→ or space to navigate · swipe on touch · Esc to exit
      </div>
    </div>
  )
}
