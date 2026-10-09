/**
* Video editor — document helpers.
* Pure functions over VideoConfig: defaults, factories, timing math,
* snapping, SRT import/export and media probing. No React here.
*/

import type { DesignDoc, VideoClip, VideoConfig, VideoTrack } from "@/lib/design/types"
import { uid } from "@/lib/design/types"

export type SubEntry = { start: number; end: number; text: string }

export const ASPECT_PRESETS = [
  { id: "16-9", label: "16:9", width: 1920, height: 1080 },
  { id: "9-16", label: "9:16", width: 1080, height: 1920 },
  { id: "1-1", label: "1:1", width: 1080, height: 1080 },
  { id: "4-5", label: "4:5", width: 1080, height: 1350 },
] as const

export const MIN_CLIP_MS = 100
export const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

export function defaultTracks(): VideoTrack[] {
  return [
    { id: "track-video", kind: "video", name: "Video", muted: false, hidden: false, height: 56 },
    { id: "track-overlay", kind: "overlay", name: "Overlay", muted: false, hidden: false, height: 44 },
    { id: "track-audio", kind: "audio", name: "Audio", muted: false, hidden: false, height: 44 },
  ]
}

export function defaultVideoConfig(width: number, height: number): VideoConfig {
  return {
    canvas: { width, height, background: "#000000" },
    clips: [],
    tracks: defaultTracks(),
    subtitles: [],
  }
}

/** Read doc.config as a VideoConfig, normalizing missing/legacy shapes. */
export function ensureVideoConfig(doc: DesignDoc): VideoConfig {
  const raw = (doc.config ?? {}) as Partial<VideoConfig>
  const canvas = raw.canvas && raw.canvas.width > 0 ? raw.canvas : { width: doc.width, height: doc.height, background: "#000000" }
  const tracks = Array.isArray(raw.tracks) && raw.tracks.length ? raw.tracks : defaultTracks()
  return {
    canvas: { width: canvas.width, height: canvas.height, background: canvas.background || "#000000" },
    clips: Array.isArray(raw.clips) ? raw.clips : [],
    tracks,
    subtitles: Array.isArray(raw.subtitles) ? raw.subtitles : [],
  }
}

export function createClip(partial: Partial<VideoClip> & { trackId: string; kind: VideoClip["kind"]; start: number; duration: number }): VideoClip {
  return {
    id: uid("clip"),
    name: partial.name ?? partial.kind,
    inPoint: 0,
    outPoint: partial.duration,
    speed: 1,
    volume: 1,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
    transitionIn: "none",
    transitionOut: "none",
    ...partial,
  }
}

export function trackForKind(config: VideoConfig, kind: "video" | "audio" | "image"): string {
  const wanted = kind === "image" ? "overlay" : kind
  const track = config.tracks.find((t) => t.kind === wanted) ?? config.tracks[0]
  return track?.id ?? "track-video"
}

export function clipEnd(clip: VideoClip): number {
  return clip.start + clip.duration
}

export function totalDurationMs(config: VideoConfig): number {
  return config.clips.reduce((max, c) => Math.max(max, clipEnd(c)), 0)
}

export function isActiveAt(clip: VideoClip, t: number): boolean {
  return t >= clip.start && t < clip.start + clip.duration
}

/** Source-media time (ms) that corresponds to timeline time t. */
export function sourceTimeMs(clip: VideoClip, t: number): number {
  return clip.inPoint + (t - clip.start) * clip.speed
}

/** Linear gain envelope from fade in/out (does not include clip.volume). */
export function gainAt(clip: VideoClip, t: number): number {
  const local = t - clip.start
  let g = 1
  if (clip.fadeIn > 0) g *= Math.min(1, Math.max(0, local / clip.fadeIn))
  if (clip.fadeOut > 0) g *= Math.min(1, Math.max(0, (clip.duration - local) / clip.fadeOut))
  return Math.min(1, Math.max(0, g))
}

/** Visual alpha for video/image clips: fadeIn/out sliders + fade transitions. */
export function visualAlphaAt(clip: VideoClip, t: number): number {
  const local = t - clip.start
  let a = 1
  const inMs = clip.transitionIn === "fade" ? Math.max(clip.fadeIn, Math.min(500, clip.duration / 2)) : clip.fadeIn
  const outMs = clip.transitionOut === "fade" ? Math.max(clip.fadeOut, Math.min(500, clip.duration / 2)) : clip.fadeOut
  if (inMs > 0) a *= Math.min(1, Math.max(0, local / inMs))
  if (outMs > 0) a *= Math.min(1, Math.max(0, (clip.duration - local) / outMs))
  return Math.min(1, Math.max(0, a))
}

/** Horizontal offset (px in canvas coords) for slide transitions. */
export function slideOffsetAt(clip: VideoClip, t: number, canvasWidth: number): number {
  const local = t - clip.start
  const travel = canvasWidth / 6
  if (clip.transitionIn === "slide" && local < 400) return -travel * (1 - Math.min(1, Math.max(0, local / 400)))
  const outLocal = clip.duration - local
  if (clip.transitionOut === "slide" && outLocal < 400) return travel * (1 - Math.min(1, Math.max(0, outLocal / 400)))
  return 0
}

/**
* Snap `target` (ms) to the closest candidate within threshold, excluding the
* clip being dragged. Returns target unchanged when nothing is close.
*/
export function snapTime(target: number, candidates: number[], thresholdMs: number): number {
  let best = target
  let bestDist = thresholdMs
  for (const c of candidates) {
    const d = Math.abs(c - target)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return Math.max(0, Math.round(best))
}

export function snapCandidates(config: VideoConfig, excludeId: string, playheadMs: number): number[] {
  const pts = [0, playheadMs]
  for (const c of config.clips) {
    if (c.id === excludeId) continue
    pts.push(c.start, clipEnd(c))
  }
  return pts
}

/* ---------------- media probing ---------------- */

export type MediaKind = "video" | "audio" | "image"

export function fileKindOf(mime: string): MediaKind | null {
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  if (mime.startsWith("image/")) return "image"
  return null
}

export interface ProbeResult {
  dead: boolean
  duration: number
  width: number
  height: number
}

/**
* Probe a media source by actually loading it. A source that fires `error`
* (typical for object URLs from a previous session) is reported as dead.
*/
export function probeMedia(src: string, kind: MediaKind): Promise<ProbeResult> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (r: ProbeResult) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve(r)
    }
    const timer = window.setTimeout(() => finish({ dead: false, duration: 0, width: 0, height: 0 }), 6000)

    if (kind === "image") {
      const img = new Image()
      img.onload = () => finish({ dead: false, duration: 0, width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => finish({ dead: true, duration: 0, width: 0, height: 0 })
      img.src = src
      return
    }
    const el = document.createElement("video")
    el.preload = "metadata"
    el.onloadedmetadata = () => finish({ dead: false, duration: Number.isFinite(el.duration) ? el.duration * 1000 : 0, width: el.videoWidth, height: el.videoHeight })
    el.onerror = () => finish({ dead: true, duration: 0, width: 0, height: 0 })
    el.src = src
  })
}

/* ---------------- SRT ---------------- */

export function parseSrtTime(raw: string): number {
  const m = raw.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/)
  if (!m) return -1
  const h = m[1] ? parseInt(m[1], 10) : 0
  const min = parseInt(m[2], 10)
  const s = parseInt(m[3], 10)
  const ms = parseInt(m[4].padEnd(3, "0"), 10)
  return ((h * 60 + min) * 60 + s) * 1000 + ms
}

/** Minimal SRT parser — blocks separated by blank lines, "00:00:01,000 --> 00:00:04,000". */
export function parseSrt(text: string): SubEntry[] {
  const out: SubEntry[] = []
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/)
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim().length > 0)
    if (!lines.length) continue
    const arrowIdx = lines.findIndex((l) => l.includes("-->"))
    if (arrowIdx < 0) continue
    const [fromRaw, toRaw] = lines[arrowIdx].split("-->")
    const start = parseSrtTime(fromRaw ?? "")
    const end = parseSrtTime(toRaw ?? "")
    const body = lines.slice(arrowIdx + 1).join("\n").trim()
    if (start < 0 || end < 0 || !body) continue
    out.push({ start, end: Math.max(end, start + 200), text: body })
  }
  return out.sort((a, b) => a.start - b.start)
}

function srtTime(ms: number): string {
  const clamped = Math.max(0, Math.round(ms))
  const h = Math.floor(clamped / 3600000)
  const m = Math.floor((clamped % 3600000) / 60000)
  const s = Math.floor((clamped % 60000) / 1000)
  const rest = clamped % 1000
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(rest).padStart(3, "0")}`
}

export function formatSrt(subs: SubEntry[]): string {
  return subs
    .map((s, i) => `${i + 1}\n${srtTime(s.start)} --> ${srtTime(s.end)}\n${s.text}`)
    .join("\n\n")
}

/* ---------------- formatting ---------------- */

/** "1:23.4" style clock for the transport display. */
export function fmtClock(ms: number): string {
  const total = Math.max(0, ms)
  const m = Math.floor(total / 60000)
  const s = Math.floor((total % 60000) / 1000)
  const tenth = Math.floor((total % 1000) / 100)
  return `${m}:${String(s).padStart(2, "0")}.${tenth}`
}

/** "1:23" style label for ruler ticks. */
export function fmtRuler(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export const STICKERS = ["😀", "😍", "🤣", "😎", "🥳", "👍", "🔥", "💜", "⭐", "🎉", "❤️", "✨", "🎬", "🎵", "📢", "💡", "🚀", "🌈", "🍕", "☕"]
