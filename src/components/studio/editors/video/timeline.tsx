"use client"

/**
* Video editor — timeline.
* Horizontal lanes per track with draggable/trimmable clip blocks, edge
* snapping (clip edges + playhead), a tick ruler with scrubbing, a playhead
* line and a px-per-second zoom slider.
*/

import { useCallback, useMemo, useRef } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import type { VideoClip, VideoConfig, VideoTrack } from "@/lib/design/types"
import { MIN_CLIP_MS, clipEnd, fmtRuler, snapCandidates, snapTime } from "./model"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Copy, Eye, EyeOff, Link2, Scissors, Trash2, Volume2, VolumeX, ZoomIn } from "lucide-react"

const HEADER_W = 104
const RULER_H = 30
const PAD_RIGHT = 200

type DragMode = "move" | "in" | "out"
interface DragState {
  id: string
  mode: DragMode
  startMs: number
  orig: VideoClip
}

interface TimelineProps {
  config: VideoConfig
  total: number
  zoom: number // px per second
  onZoomChange: (pxPerSec: number) => void
  playheadMs: number
  onScrub: (ms: number) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  canEdit: boolean
  onPatchClip: (id: string, patch: Partial<VideoClip>, coalesceKey?: string) => void
  onPatchTrack: (id: string, patch: Partial<VideoTrack>) => void
  onSplit: () => void
  onDuplicate: () => void
  onDelete: () => void
  deadIds: Set<string>
  onRelink: (clipId: string) => void
  getSourceDuration: (clipId: string) => number | undefined
}

const CLIP_COLORS: Record<VideoClip["kind"], string> = {
  video: "bg-violet-500/85 text-white",
  audio: "bg-emerald-500/85 text-emerald-950",
  text: "bg-amber-400/90 text-amber-950",
  sticker: "bg-fuchsia-400/90 text-fuchsia-950",
  image: "bg-rose-400/90 text-rose-950",
}

function rulerStepMs(zoom: number): number {
  const candidates = [100, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000]
  for (const c of candidates) {
    if ((c / 1000) * zoom >= 64) return c
  }
  return 60000
}

export function Timeline(props: TimelineProps) {
  const { config, total, zoom, onZoomChange, playheadMs, onScrub, selectedId, onSelect, canEdit, onPatchClip, onPatchTrack, onSplit, onDuplicate, onDelete, deadIds, onRelink, getSourceDuration } = props
  const dragRef = useRef<DragState | null>(null)

  const contentMs = Math.max(total + 4000, 20000)
  const contentWidth = (contentMs / 1000) * zoom
  const snapThresholdMs = (10 / zoom) * 1000

  const xToMs = useCallback((clientX: number, lane: HTMLElement) => {
    const rect = lane.getBoundingClientRect()
    return ((clientX - rect.left) / zoom) * 1000
  }, [zoom])

  /* ---------------- clip drag / trim ---------------- */

  const startDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, clip: VideoClip, mode: DragMode) => {
      if (!canEdit) return
      e.stopPropagation()
      onSelect(clip.id)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* pointer capture unavailable — drag still works while held */
      }
      const lane = e.currentTarget.parentElement
      const startMs = lane ? xToMs(e.clientX, lane) : (e.clientX / zoom) * 1000
      dragRef.current = { id: clip.id, mode, startMs, orig: { ...clip } }
    },
    [canEdit, onSelect, xToMs, zoom],
  )

  const onDragMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag) return
      const { orig, mode, id, startMs } = drag
      const lane = e.currentTarget.parentElement
      if (!lane) return
      const rawDx = xToMs(e.clientX, lane) - startMs
      const candidates = snapCandidates(config, id, playheadMs)
      const speed = Math.max(0.01, orig.speed)
      const sourceDur = getSourceDuration(id)

      if (mode === "move") {
        const start = snapTime(orig.start + rawDx, candidates, snapThresholdMs)
        onPatchClip(id, { start: Math.max(0, start) }, `move:${id}`)
        return
      }
      if (mode === "in") {
        let start = snapTime(orig.start + rawDx, candidates, snapThresholdMs)
        start = Math.min(start, clipEnd(orig) - MIN_CLIP_MS)
        const delta = start - orig.start
        // extending left is bounded by the available inPoint
        if (delta < 0 && -delta * speed > orig.inPoint) start = orig.start - orig.inPoint / speed
        const d2 = start - orig.start
        onPatchClip(
          id,
          {
            start: Math.max(0, Math.round(start)),
            duration: Math.round(orig.duration - d2),
            inPoint: Math.round(Math.max(0, orig.inPoint + d2 * speed)),
          },
          `trim:${id}`,
        )
        return
      }
      // mode "out": extend/shorten the right edge
      let end = snapTime(clipEnd(orig) + rawDx, candidates, snapThresholdMs)
      let duration = end - orig.start
      if (sourceDur) duration = Math.min(duration, (sourceDur - orig.inPoint) / speed)
      duration = Math.max(MIN_CLIP_MS, duration)
      end = orig.start + duration
      onPatchClip(
        id,
        { duration: Math.round(duration), outPoint: Math.round(orig.inPoint + duration * speed) },
        `trim:${id}`,
      )
    },
    [config, getSourceDuration, onPatchClip, playheadMs, snapThresholdMs, xToMs],
  )

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  /* ---------------- scrub ---------------- */

  const scrubFrom = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const lane = e.currentTarget
      onScrub(Math.max(0, xToMs(e.clientX, lane)))
      try {
        lane.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    },
    [onScrub, xToMs],
  )

  const ticks = useMemo(() => {
    const step = rulerStepMs(zoom)
    const out: number[] = []
    for (let t = 0; t <= contentMs; t += step) out.push(t)
    return out
  }, [zoom, contentMs])

  const fitZoom = useCallback(() => {
    const viewport = Math.max(320, window.innerWidth - HEADER_W - 80)
    onZoomChange(Math.max(20, Math.min(400, viewport / Math.max(2, contentMs / 1000))))
  }, [contentMs, onZoomChange])

  const hasSelection = !!selectedId && config.clips.some((c) => c.id === selectedId)

  return (
    <div className="flex min-h-0 flex-col border-t bg-card">
      {/* toolbar (wraps on narrow phones: 3 buttons + zoom cluster exceed 360px on one line) */}
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
        <Button variant="outline" size="sm" className="h-8 gap-1" disabled={!canEdit || !hasSelection} onClick={onSplit} title="Split selected clip at playhead">
          <Scissors className="h-3.5 w-3.5" /> Split
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" disabled={!canEdit || !hasSelection} onClick={onDuplicate} title="Duplicate selected clip">
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-destructive" disabled={!canEdit || !hasSelection} onClick={onDelete} title="Delete selected clip">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
        <div className="ml-auto flex w-40 items-center gap-2 sm:w-56">
          <ZoomIn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={20}
            max={400}
            step={5}
            onValueChange={([z]) => onZoomChange(z)}
            aria-label="Timeline zoom"
          />
          <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={fitZoom}>
            Fit
          </Button>
        </div>
      </div>

      {/* scrollable timeline body */}
      <div className="max-h-[240px] overflow-auto" role="region" aria-label="Video timeline">
        <div className="relative" style={{ width: HEADER_W + contentWidth + PAD_RIGHT }}>
          {/* ruler */}
          <div className="sticky top-0 z-30 flex bg-card" style={{ height: RULER_H }}>
            <div className="sticky left-0 z-40 shrink-0 border-r bg-card" style={{ width: HEADER_W }} />
            <div
              className="relative shrink-0 cursor-ew-resize select-none"
              style={{ width: contentWidth }}
              onPointerDown={scrubFrom}
              onPointerMove={(e) => e.buttons > 0 && dragRef.current === null && onScrub(Math.max(0, xToMs(e.clientX, e.currentTarget)))}
            >
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full border-l border-border/70 pl-1 text-[9px] leading-none text-muted-foreground" style={{ left: (t / 1000) * zoom }}>
                  <span className="relative top-1">{fmtRuler(t)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* tracks */}
          {config.tracks.map((track, ti) => (
            <div key={track.id} className="flex border-t border-border/60" style={{ height: track.height }}>
              <div className="sticky left-0 z-20 flex shrink-0 items-center gap-1 border-r bg-card px-1.5" style={{ width: HEADER_W }}>
                <span className="truncate text-[11px] font-medium">{track.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6 shrink-0"
                  aria-label={track.muted ? `Unmute ${track.name}` : `Mute ${track.name}`}
                  disabled={!canEdit}
                  onClick={() => onPatchTrack(track.id, { muted: !track.muted })}
                >
                  {track.muted ? <VolumeX className="h-3 w-3 text-destructive" /> : <Volume2 className="h-3 w-3" />}
                </Button>
                {track.kind !== "audio" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label={track.hidden ? `Show ${track.name}` : `Hide ${track.name}`}
                    disabled={!canEdit}
                    onClick={() => onPatchTrack(track.id, { hidden: !track.hidden })}
                  >
                    {track.hidden ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3" />}
                  </Button>
                )}
              </div>
              <div
                className={cn("relative shrink-0", ti % 2 ? "bg-muted/40" : "bg-muted/20")}
                style={{ width: contentWidth }}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) {
                    onSelect(null)
                    scrubFrom(e)
                  }
                }}
                onPointerMove={(e) => {
                  if (e.target === e.currentTarget && e.buttons > 0) onScrub(Math.max(0, xToMs(e.clientX, e.currentTarget)))
                }}
              >
                {config.clips
                  .filter((c) => c.trackId === track.id)
                  .map((clip) => {
                    const selected = clip.id === selectedId
                    const dead = deadIds.has(clip.id)
                    return (
                      <div
                        key={clip.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${clip.name}, ${Math.round(clip.duration / 1000)} seconds`}
                        className={cn(
                          "group absolute inset-y-1 overflow-hidden rounded-md border text-[10px] shadow-sm transition-shadow",
                          CLIP_COLORS[clip.kind],
                          selected ? "z-10 border-foreground ring-2 ring-primary" : "border-black/20",
                          canEdit && "cursor-grab active:cursor-grabbing",
                        )}
                        style={{ left: (clip.start / 1000) * zoom, width: Math.max(6, (clip.duration / 1000) * zoom) }}
                        onPointerDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const localX = e.clientX - rect.left
                          const mode: DragMode = canEdit ? (localX < 8 ? "in" : localX > rect.width - 8 ? "out" : "move") : "move"
                          if (canEdit) startDrag(e, clip, mode)
                          else onSelect(clip.id)
                        }}
                        onPointerMove={onDragMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={(e) => {
                          // Enter selects; Space is left for global play/pause
                          if (e.key === "Enter") {
                            e.preventDefault()
                            onSelect(clip.id)
                          }
                        }}
                      >
                        <span className="pointer-events-none block truncate px-2 py-0.5 font-medium">{clip.name}</span>
                        {dead && (
                          <button
                            className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white hover:bg-black/80"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              onRelink(clip.id)
                            }}
                          >
                            <Link2 className="h-3 w-3" /> Relink media
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}

          {/* playhead */}
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-[15] w-0.5 bg-primary"
            style={{ left: HEADER_W + (playheadMs / 1000) * zoom }}
            aria-hidden
          >
            <div className="absolute -left-[3px] top-0 h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

