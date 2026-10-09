"use client"

/**
* Video editor (doc.type "video", doc.config = VideoConfig).
* Media import (object URLs, session-scoped with relink UI), multi-track
* timeline with drag/trim/snap, canvas preview player, text/sticker overlays,
* subtitles with SRT import, and realtime WebM/MP4 export via MediaRecorder.
*/

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DesignDoc, VideoClip, VideoTrack } from "@/lib/design/types"
import { uid } from "@/lib/design/types"
import {
  ASPECT_PRESETS,
  clipEnd,
  createClip,
  ensureVideoConfig,
  fileKindOf,
  fmtClock,
  formatSrt,
  isActiveAt,
  parseSrt,
  probeMedia,
  totalDurationMs,
  trackForKind,
} from "./video/model"
import { MediaPool } from "./video/media-pool"
import { exportCurrentFramePng, pickVideoMime, recordTimeline, renderThumbnail } from "./video/export"
import { PreviewPlayer } from "./video/preview"
import { Timeline } from "./video/timeline"
import { PropertiesPanel } from "./video/properties-panel"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import { HistoryStore } from "@/lib/editor/history"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Clock,
  Film,
  Info,
  Loader2,
  MonitorPlay,
  Redo2,
  Type as TypeIcon,
  Undo2,
  Upload,
} from "lucide-react"

const clampMs = (v: number, min: number, max: number) => Math.min(Math.max(Math.round(v), min), max)

interface VideoConfigShape {
  clips?: unknown
  tracks?: unknown
}

function maxEndOnTrack(clips: VideoClip[], trackId: string): number {
  return clips.reduce((max, c) => (c.trackId === trackId ? Math.max(max, clipEnd(c)) : max), 0)
}

const VideoEditor = forwardRef<EditorHandle, EditorProps>(function VideoEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const canEdit = role === "owner" || role === "editor"
  const { toast } = useToast()

  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [playheadMs, setPlayheadMs] = useState(0)
  const [zoom, setZoom] = useState(60) // px per second
  const [deadSrcs, setDeadSrcs] = useState<Record<string, true>>({})
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState({ active: false, progress: 0 })
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })

  const docRef = useRef<DesignDoc>(initialDoc)
  const dirtyRef = useRef(false)
  const playheadRef = useRef(0)
  const cancelExportRef = useRef(false)
  const exportingRef = useRef(false)
  const relinkTargetRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const probedSrcsRef = useRef(new Set<string>())
  const [pool] = useState(() => new MediaPool())
  const [history] = useState(() => new HistoryStore(initialDoc, 60))

  const config = useMemo(() => ensureVideoConfig(doc), [doc])
  const total = totalDurationMs(config)
  const selected = useMemo(() => config.clips.find((c) => c.id === selectedId) ?? null, [config, selectedId])
  const deadSet = useMemo(() => {
    const s = new Set<string>()
    for (const c of config.clips) if (c.src && deadSrcs[c.src]) s.add(c.id)
    return s
  }, [config.clips, deadSrcs])
  const hasMedia = useMemo(() => config.clips.some((c) => !!c.src), [config])
  const deadCount = deadSet.size

  /* ---------------- commit / history ---------------- */

  const syncHistoryState = useCallback(() => {
    setHistoryState({ canUndo: history.canUndo, canRedo: history.canRedo })
  }, [history])

  const commit = useCallback(
    (next: DesignDoc, coalesceKey?: string) => {
      docRef.current = next
      dirtyRef.current = true
      setDoc(next)
      history.push(next, coalesceKey)
      syncHistoryState()
      onDocChange(next)
    },
    [history, onDocChange, syncHistoryState],
  )

  const undo = useCallback(() => {
    const restored = history.undo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
  }, [history, onDocChange, syncHistoryState])

  const redo = useCallback(() => {
    const restored = history.redo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
  }, [history, onDocChange, syncHistoryState])

  /* ---------------- boot: normalize config ---------------- */

  useEffect(() => {
    const t = setTimeout(() => {
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      const raw = (d.config ?? null) as VideoConfigShape | null
      const needsNormalize =
        !raw || !Array.isArray(raw.clips) || !Array.isArray(raw.tracks) || !raw.tracks.length || d.width !== cfg.canvas.width || d.height !== cfg.canvas.height
      if (needsNormalize) {
        commit({ ...d, width: cfg.canvas.width, height: cfg.canvas.height, config: cfg })
      }
    }, 0)
    return () => clearTimeout(t)
  }, [commit])

  /* ---------------- pool + dead-src probing ---------------- */

  useEffect(() => {
    pool.sync(config.clips)
  }, [config.clips, pool])

  useEffect(() => {
    return () => pool.destroy()
  }, [pool])

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      const withSrc = config.clips.filter((c) => c.src && (c.kind === "video" || c.kind === "audio" || c.kind === "image"))
      const results = await Promise.all(
        withSrc.map(async (c) => {
          const src = c.src as string
          if (probedSrcsRef.current.has(src)) return null
          probedSrcsRef.current.add(src)
          const kind = c.kind === "image" ? "image" : c.kind === "audio" ? "audio" : "video"
          const r = await probeMedia(src, kind)
          return { src, dead: r.dead }
        }),
      )
      if (!alive) return
      setDeadSrcs((prev) => {
        const next: Record<string, true> = {}
        for (const k of Object.keys(prev)) next[k] = true
        let changed = false
        for (const r of results) {
          if (!r) continue
          if (r.dead && !next[r.src]) {
            next[r.src] = true
            changed = true
          } else if (!r.dead && next[r.src]) {
            delete next[r.src]
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [config.clips])

  /* ---------------- clip mutations ---------------- */

  const patchClip = useCallback(
    (id: string, patch: Partial<VideoClip>, coalesceKey?: string) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({ ...d, config: { ...cfg, clips: cfg.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) } }, coalesceKey)
    },
    [canEdit, commit],
  )

  const patchTrack = useCallback(
    (id: string, patch: Partial<VideoTrack>) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({ ...d, config: { ...cfg, tracks: cfg.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) } })
    },
    [canEdit, commit],
  )

  const deleteClipById = useCallback(
    (id: string) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({ ...d, config: { ...cfg, clips: cfg.clips.filter((c) => c.id !== id) } })
      setSelectedId((cur) => (cur === id ? null : cur))
    },
    [canEdit, commit],
  )

  const deleteSelected = useCallback(() => {
    if (selectedId) deleteClipById(selectedId)
  }, [deleteClipById, selectedId])

  const splitAtPlayhead = useCallback(() => {
    if (!canEdit) return
    const d = docRef.current
    const cfg = ensureVideoConfig(d)
    const t = playheadRef.current
    const target =
      cfg.clips.find((c) => c.id === selectedId && isActiveAt(c, t)) ?? cfg.clips.find((c) => isActiveAt(c, t))
    if (!target || t <= target.start + 50 || t >= clipEnd(target) - 50) {
      toast({ title: "Nothing to split", description: "Move the playhead over a clip first." })
      return
    }
    const leftDur = t - target.start
    const left: VideoClip = { ...target, duration: leftDur, outPoint: target.inPoint + leftDur * target.speed }
    const right: VideoClip = {
      ...target,
      id: uid("clip"),
      start: t,
      duration: target.duration - leftDur,
      inPoint: target.inPoint + leftDur * target.speed,
      name: `${target.name} (2)`,
    }
    commit({ ...d, config: { ...cfg, clips: cfg.clips.flatMap((c) => (c.id === target.id ? [left, right] : [c])) } })
    setSelectedId(right.id)
  }, [canEdit, commit, selectedId, toast])

  const duplicateSelected = useCallback(() => {
    if (!canEdit || !selectedId) return
    const d = docRef.current
    const cfg = ensureVideoConfig(d)
    const src = cfg.clips.find((c) => c.id === selectedId)
    if (!src) return
    const copy: VideoClip = { ...src, id: uid("clip"), start: clipEnd(src), name: `${src.name} copy` }
    commit({ ...d, config: { ...cfg, clips: [...cfg.clips, copy] } })
    setSelectedId(copy.id)
  }, [canEdit, commit, selectedId])

  const applyAspect = useCallback(
    (presetId: string) => {
      if (!canEdit) return
      const preset = ASPECT_PRESETS.find((p) => p.id === presetId)
      if (!preset) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({
        ...d,
        width: preset.width,
        height: preset.height,
        config: { ...cfg, canvas: { ...cfg.canvas, width: preset.width, height: preset.height } },
      })
    },
    [canEdit, commit],
  )

  const addTextClip = useCallback(
    (kind: "text" | "sticker", text?: string) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      const trackId = trackForKind(cfg, "image")
      const isSticker = kind === "sticker"
      const clip = createClip({
        trackId,
        kind,
        start: playheadRef.current,
        duration: 3000,
        name: isSticker ? "Sticker" : "Text",
        element: isSticker
          ? { text: text ?? "⭐", fontSize: Math.round(cfg.canvas.height * 0.18), color: "#ffffff", align: "center", x: cfg.canvas.width / 2, y: cfg.canvas.height / 2 }
          : {
              text: "Your text",
              fontSize: Math.round(cfg.canvas.height * 0.08),
              color: "#ffffff",
              fontWeight: 700,
              align: "center",
              x: cfg.canvas.width / 2,
              y: cfg.canvas.height / 2,
              fontFamily: "Inter",
            },
      })
      commit({ ...d, config: { ...cfg, clips: [...cfg.clips, clip] } })
      setSelectedId(clip.id)
    },
    [canEdit, commit],
  )

  /* ---------------- subtitles ---------------- */

  const patchSubtitle = useCallback(
    (index: number, patch: Partial<{ start: number; end: number; text: string }>) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      const subs = (cfg.subtitles ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s))
      commit({ ...d, config: { ...cfg, subtitles: subs } }, `sub:${index}`)
    },
    [canEdit, commit],
  )

  const addSubtitle = useCallback(() => {
    if (!canEdit) return
    const d = docRef.current
    const cfg = ensureVideoConfig(d)
    const start = playheadRef.current
    commit({ ...d, config: { ...cfg, subtitles: [...(cfg.subtitles ?? []), { start, end: start + 2000, text: "Subtitle text" }] } })
  }, [canEdit, commit])

  const deleteSubtitle = useCallback(
    (index: number) => {
      if (!canEdit) return
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({ ...d, config: { ...cfg, subtitles: (cfg.subtitles ?? []).filter((_, i) => i !== index) } })
    },
    [canEdit, commit],
  )

  const importSrt = useCallback(
    (text: string) => {
      if (!canEdit) return
      const entries = parseSrt(text)
      if (!entries.length) {
        toast({ title: "No subtitles found", description: "Expected SRT blocks like 00:00:01,000 --> 00:00:04,000 followed by text.", variant: "destructive" })
        return
      }
      const d = docRef.current
      const cfg = ensureVideoConfig(d)
      commit({ ...d, config: { ...cfg, subtitles: entries } })
      toast({ title: `Imported ${entries.length} subtitle${entries.length > 1 ? "s" : ""}` })
    },
    [canEdit, commit, toast],
  )

  const downloadSrt = useCallback(() => {
    const cfg = ensureVideoConfig(docRef.current)
    const subs = cfg.subtitles ?? []
    if (!subs.length) return
    const blob = new Blob([formatSrt(subs)], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.name || "subtitles"}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }, [project.name])

  /* ---------------- media import / relink ---------------- */

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length) return
      const relinkId = relinkTargetRef.current
      relinkTargetRef.current = null

      if (relinkId) {
        const file = files[0]
        const kind = fileKindOf(file.type)
        if (!kind) {
          toast({ title: "Unsupported file type", description: file.name, variant: "destructive" })
          return
        }
        const src = URL.createObjectURL(file)
        const info = await probeMedia(src, kind)
        if (info.dead) {
          toast({ title: "That file could not be decoded", variant: "destructive" })
          return
        }
        const d = docRef.current
        const cfg = ensureVideoConfig(d)
        const clip = cfg.clips.find((c) => c.id === relinkId)
        if (!clip) return
        const sourceDur = kind === "image" ? Number.MAX_SAFE_INTEGER : info.duration || clip.duration
        const inPoint = Math.min(clip.inPoint, Math.max(0, sourceDur - 100))
        const duration = Math.min(clip.duration, Math.max(100, sourceDur - inPoint))
        commit(
          {
            ...d,
            config: { ...cfg, clips: cfg.clips.map((c) => (c.id === relinkId ? { ...c, src, inPoint, outPoint: inPoint + duration, duration } : c)) },
          },
          `relink:${relinkId}`,
        )
        toast({ title: "Media re-linked", description: file.name })
        return
      }

      if (!canEdit) return
      setImporting(true)
      try {
        const d = docRef.current
        const cfg = ensureVideoConfig(d)
        const created: VideoClip[] = []
        for (const file of Array.from(files)) {
          const kind = fileKindOf(file.type)
          if (!kind) {
            toast({ title: `Skipped ${file.name}`, description: "Only video, audio and image files are supported.", variant: "destructive" })
            continue
          }
          const src = URL.createObjectURL(file)
          const info = await probeMedia(src, kind)
          if (info.dead) {
            toast({ title: `${file.name} could not be decoded`, variant: "destructive" })
            continue
          }
          const trackId = trackForKind(cfg, kind)
          const start = maxEndOnTrack(cfg.clips.filter((c) => c.trackId === trackId).concat(created), trackId)
          const duration = kind === "image" ? 4000 : clampMs(info.duration || 4000, 200, 10 * 60_000)
          created.push(
            createClip({
              trackId,
              kind,
              src,
              start,
              duration,
              outPoint: kind === "image" ? duration : Math.min(duration, Math.round(info.duration) || duration),
              name: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || kind,
            }),
          )
        }
        if (created.length) {
          commit({ ...d, config: { ...cfg, clips: [...cfg.clips, ...created] } })
          toast({ title: `Imported ${created.length} file${created.length > 1 ? "s" : ""}`, description: "Media lives in this browser session." })
        }
      } finally {
        setImporting(false)
      }
    },
    [canEdit, commit, toast],
  )

  const openPicker = useCallback((relinkClipId: string | null) => {
    relinkTargetRef.current = relinkClipId
    fileInputRef.current?.click()
  }, [])

  /* ---------------- transport ---------------- */

  const seek = useCallback((ms: number) => {
    playheadRef.current = Math.max(0, Math.round(ms))
    setPlayheadMs(playheadRef.current)
  }, [])

  const onTimeUpdate = useCallback((ms: number) => setPlayheadMs(ms), [])

  const handleEnded = useCallback(() => {
    setPlaying(false)
    setPlayheadMs(playheadRef.current)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false)
      setPlayheadMs(playheadRef.current)
      return
    }
    const cfgTotal = totalDurationMs(ensureVideoConfig(docRef.current))
    if (cfgTotal <= 0) return
    if (playheadRef.current >= cfgTotal) playheadRef.current = 0
    const actx = pool.ensureAudioContext()
    if (actx && actx.state === "suspended") void actx.resume().catch(() => {})
    setPlayheadMs(playheadRef.current)
    setPlaying(true)
  }, [playing, pool])

  const stopPlayback = useCallback(() => {
    setPlaying(false)
    playheadRef.current = 0
    setPlayheadMs(0)
  }, [])

  /* ---------------- keyboard ---------------- */

  useEffect(() => {
    function isTextEntry(el: EventTarget | null): boolean {
      const t = el as HTMLElement | null
      return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTextEntry(e.target)) {
        e.preventDefault()
        togglePlay()
        return
      }
      if (isTextEntry(e.target)) return
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && canEdit) {
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canEdit, deleteSelected, redo, selectedId, togglePlay, undo])

  /* ---------------- editor handle (export / thumbnail) ---------------- */

  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req): Promise<ExportResult[]> => {
        const base = req.filenameBase || "video"
        const d = docRef.current
        if (req.format === "json") {
          return [{ filename: `${base}.studio.json`, blob: new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }) }]
        }
        if (req.format === "png") {
          const cfg = ensureVideoConfig(d)
          const blob = await exportCurrentFramePng(cfg, pool, playheadRef.current)
          return [{ filename: `${base}.png`, blob, note: "Current frame at full canvas size." }]
        }
        if (req.format === "webm" || req.format === "mp4") {
          if (req.format === "mp4" && !(typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/mp4"))) {
            throw new Error("MP4 recording isn't supported by this browser. WebM export is available in the same menu and plays in Chrome, Edge and Firefox.")
          }
          const mime = pickVideoMime(req.format)
          if (!mime) throw new Error("This browser can't record video (MediaRecorder unavailable). Try Chrome, Edge or Firefox.")
          exportingRef.current = true
          setPlaying(false)
          seek(0)
          pool.pauseAll()
          cancelExportRef.current = false
          setExporting({ active: true, progress: 0 })
          try {
            const cfg = ensureVideoConfig(d)
            const { blob, note } = await recordTimeline({
              config: cfg,
              pool,
              mimeType: mime,
              onProgress: (p) => setExporting({ active: true, progress: p }),
              isCancelled: () => cancelExportRef.current,
            })
            if (!blob) return []
            return [
              {
                filename: `${base}.${req.format}`,
                blob,
                note: note ?? `Realtime render — export took about ${fmtClock(totalDurationMs(cfg))} (one pass over the timeline).`,
              },
            ]
          } finally {
            exportingRef.current = false
            setExporting({ active: false, progress: 0 })
          }
        }
        throw new Error(`"${req.format}" isn't available for video projects — use WebM, MP4, PNG or JSON.`)
      },
      getThumbnail: async () => {
        try {
          return await renderThumbnail(ensureVideoConfig(docRef.current), pool, playheadRef.current)
        } catch {
          return null
        }
      },
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [registerHandle, pool, seek])

  /* ---------------- render ---------------- */

  const canvasPresetValue = useMemo(() => {
    const match = ASPECT_PRESETS.find((p) => p.width === config.canvas.width && p.height === config.canvas.height)
    return match ? match.id : "custom"
  }, [config.canvas.width, config.canvas.height])

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      {/* top toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-card px-2 py-1.5">
        <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!canEdit || importing} onClick={() => openPicker(null)}>
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Import media
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={!canEdit} onClick={() => addTextClip("text")}>
          <TypeIcon className="h-3.5 w-3.5" /> Text
        </Button>
        <div className="flex items-center gap-1.5">
          <MonitorPlay className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={canvasPresetValue} disabled={!canEdit} onValueChange={applyAspect}>
            <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Canvas aspect ratio">
              <SelectValue placeholder="Aspect" />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label} · {p.width}×{p.height}
                </SelectItem>
              ))}
              {canvasPresetValue === "custom" && (
                <SelectItem value="custom">
                  {config.canvas.width}×{config.canvas.height}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
            <Clock className="h-3 w-3" /> {fmtClock(total)}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!historyState.canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!historyState.canRedo} aria-label="Redo" title="Redo (Ctrl+Y)">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* session media notice */}
      {hasMedia && (
        <div className="flex items-center gap-1.5 border-b bg-amber-500/10 px-3 py-1 text-[11px] text-amber-900 dark:text-amber-200">
          <Info className="h-3 w-3 shrink-0" />
          <span>
            Media files live in this browser session; re-link after reload.
            {deadCount > 0 && ` ${deadCount} clip${deadCount > 1 ? "s" : ""} need${deadCount === 1 ? "s" : ""} relinking.`}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* preview */}
        <div className="relative flex min-h-[260px] min-w-0 flex-1 flex-col lg:flex-[1.5]">
          <PreviewPlayer
            config={config}
            playing={playing}
            suspended={exporting.active}
            playheadRef={playheadRef}
            playheadMs={playheadMs}
            pool={pool}
            deadCount={deadCount}
            onTogglePlay={togglePlay}
            onStop={stopPlayback}
            onEnded={handleEnded}
            onTimeUpdate={onTimeUpdate}
          />
          {exporting.active && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/85 p-6 backdrop-blur-sm">
              <Film className="h-5 w-5 animate-pulse text-primary" />
              <p className="text-sm font-semibold">Rendering video in real time…</p>
              <Progress value={Math.round(exporting.progress * 100)} className="w-64" />
              <p className="text-center text-xs text-muted-foreground">
                {Math.round(exporting.progress * 100)}% · keep this tab visible until it finishes
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelExportRef.current = true
                }}
              >
                Cancel export
              </Button>
            </div>
          )}
        </div>

        {/* properties */}
        <div className={cn("flex min-h-0 w-full shrink-0 flex-col border-t bg-card lg:w-80 lg:border-l lg:border-t-0")}>
          <PropertiesPanel
            config={config}
            selected={selected}
            canEdit={canEdit}
            playheadMs={playheadMs}
            onPatchClip={patchClip}
            onAddText={() => addTextClip("text")}
            onAddSticker={(char) => addTextClip("sticker", char)}
            onAddSubtitle={addSubtitle}
            onPatchSubtitle={patchSubtitle}
            onDeleteSubtitle={deleteSubtitle}
            onImportSrt={importSrt}
            onDownloadSrt={downloadSrt}
            isDead={(clipId) => deadSet.has(clipId)}
            onRelink={(clipId) => openPicker(clipId)}
            onDeleteClip={deleteClipById}
          />
        </div>
      </div>

      {/* timeline */}
      <Timeline
        config={config}
        total={total}
        zoom={zoom}
        onZoomChange={setZoom}
        playheadMs={playheadMs}
        onScrub={seek}
        selectedId={selectedId}
        onSelect={setSelectedId}
        canEdit={canEdit}
        onPatchClip={patchClip}
        onPatchTrack={patchTrack}
        onSplit={splitAtPlayhead}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        deadIds={deadSet}
        onRelink={(clipId) => openPicker(clipId)}
        getSourceDuration={(clipId) => pool.sourceDurations.get(clipId)}
      />
    </div>
  )
})

export default VideoEditor
