"use client"

/**
* Video editor — preview player.
* Canvas rendering driven by a requestAnimationFrame loop that advances a
* shared playhead ref; the editor holds playhead React state at ~10 Hz for
* UI (time display, timeline playhead line) to avoid per-frame re-renders.
*/

import { useCallback, useEffect, useRef } from "react"
import type { VideoConfig } from "@/lib/design/types"
import type { MediaPool } from "./media-pool"
import { driveMedia } from "./media-pool"
import { drawFrame } from "./render"
import { fmtClock, totalDurationMs } from "./model"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Pause, Play, Square, TriangleAlert } from "lucide-react"

interface PreviewPlayerProps {
  config: VideoConfig
  playing: boolean
  /** true while an export owns the media elements — skip preview syncing */
  suspended: boolean
  playheadRef: { current: number }
  playheadMs: number
  pool: MediaPool
  deadCount: number
  onTogglePlay: () => void
  onStop: () => void
  onEnded: () => void
  onTimeUpdate: (ms: number) => void
}

export function PreviewPlayer({ config, playing, suspended, playheadRef, playheadMs, pool, deadCount, onTogglePlay, onStop, onEnded, onTimeUpdate }: PreviewPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const lastUiRef = useRef(0)

  const total = totalDurationMs(config)
  const { canvasWidth, canvasHeight } = { canvasWidth: config.canvas.width, canvasHeight: config.canvas.height }

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      drawFrame(ctx, config, t, pool)
    },
    [config, pool, canvasWidth, canvasHeight],
  )

  // Paused / scrub / edit sync: pause media, seek active clips, redraw frame.
  useEffect(() => {
    if (playing || suspended) return
    const t = playheadRef.current
    driveMedia(config, pool, t, false)
    draw(t)
  }, [playing, suspended, config, pool, playheadRef, draw, playheadMs])

  // Playback loop.
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(100, now - last)
      last = now
      const next = playheadRef.current + dt
      if (next >= total) {
        playheadRef.current = total
        driveMedia(config, pool, total, false)
        draw(total)
        onEnded()
        return
      }
      playheadRef.current = next
      driveMedia(config, pool, next, true)
      draw(next)
      if (now - lastUiRef.current > 100) {
        lastUiRef.current = now
        onTimeUpdate(next)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      pool.pauseAll()
    }
  }, [playing, total, config, pool, playheadRef, draw, onEnded, onTimeUpdate])

  const atEnd = playheadMs >= total - 30

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-3 lg:p-4">
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          aria-label="Video preview canvas"
          className="h-auto max-h-full w-auto max-w-full rounded-lg border border-black/20 bg-black shadow-md"
        />
        {deadCount > 0 && (
          <div className="absolute left-2 top-2 flex max-w-[90%] items-center gap-1.5 rounded-md bg-amber-500/90 px-2 py-1 text-[11px] font-medium text-amber-950">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            <span>
              {deadCount} clip{deadCount > 1 ? "s" : ""} missing media — relink in the timeline below.
            </span>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xl shrink-0 items-center justify-center gap-2">
        <Button
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={onTogglePlay}
          disabled={total <= 0 && !playing}
          aria-label={playing ? "Pause" : atEnd ? "Replay" : "Play"}
          title="Play/Pause (Space)"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button size="icon" variant="outline" className="h-11 w-11 rounded-full" onClick={onStop} aria-label="Stop and rewind" title="Stop (rewind to start)">
          <Square className="h-4 w-4" />
        </Button>
        <span className={cn("ml-2 font-mono text-sm tabular-nums text-muted-foreground")} aria-live="off">
          {fmtClock(playheadMs)} <span className="opacity-60">/ {fmtClock(total)}</span>
        </span>
      </div>
    </div>
  )
}
