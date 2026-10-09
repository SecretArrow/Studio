/**
* Video editor — media element pool.
* Owns one <video>/<audio>/<img> element per clip id, tracks source durations,
* and hosts a shared AudioContext so preview audio keeps working after export
* mixing (source nodes persist; only the recording destination is toggled).
* Also drives element state (play/seek/volume) from timeline time.
*/

import type { VideoClip, VideoConfig } from "@/lib/design/types"
import { gainAt, isActiveAt, sourceTimeMs } from "./model"

const DRIFT_PLAY_MS = 120
const DRIFT_SEEK_MS = 40

function makeVideoEl(src: string): HTMLVideoElement {
  const el = document.createElement("video")
  el.preload = "auto"
  el.playsInline = true
  el.crossOrigin = "anonymous"
  el.src = src
  return el
}

function makeAudioEl(src: string): HTMLAudioElement {
  const el = document.createElement("audio")
  el.preload = "auto"
  el.crossOrigin = "anonymous"
  el.src = src
  return el
}

export class MediaPool {
  private videos = new Map<string, HTMLVideoElement>()
  private audios = new Map<string, HTMLAudioElement>()
  private images = new Map<string, HTMLImageElement>()
  private srcs = new Map<string, string>()
  private audioCtx: AudioContext | null = null
  private srcNodes = new Map<HTMLMediaElement, MediaElementAudioSourceNode>()
  /** clipId → source duration in ms (from loadedmetadata) */
  sourceDurations = new Map<string, number>()

  videoEl(clipId: string): HTMLVideoElement | undefined {
    return this.videos.get(clipId)
  }

  audioEl(clipId: string): HTMLAudioElement | undefined {
    return this.audios.get(clipId)
  }

  imageEl(clipId: string): HTMLImageElement | undefined {
    return this.images.get(clipId)
  }

  /** Create/remove elements so the pool matches the clip list. */
  sync(clips: VideoClip[]): void {
    const wanted = new Set(clips.map((c) => c.id))
    for (const [id, el] of this.videos) {
      if (!wanted.has(id)) this.dropMedia(el, this.videos, id)
    }
    for (const [id, el] of this.audios) {
      if (!wanted.has(id)) this.dropMedia(el, this.audios, id)
    }
    for (const [id, el] of this.images) {
      if (!wanted.has(id)) this.images.delete(id)
    }
    for (const clip of clips) {
      if (!clip.src || clip.kind === "text" || clip.kind === "sticker") continue
      if (this.srcs.get(clip.id) === clip.src) continue
      // (re)create for new clip or new src (relink)
      this.remove(clip.id)
      this.srcs.set(clip.id, clip.src)
      if (clip.kind === "video") {
        const el = makeVideoEl(clip.src)
        el.onloadedmetadata = () => {
          if (Number.isFinite(el.duration)) this.sourceDurations.set(clip.id, el.duration * 1000)
        }
        this.videos.set(clip.id, el)
      } else if (clip.kind === "audio") {
        const el = makeAudioEl(clip.src)
        el.onloadedmetadata = () => {
          if (Number.isFinite(el.duration)) this.sourceDurations.set(clip.id, el.duration * 1000)
        }
        this.audios.set(clip.id, el)
      } else {
        const img = new Image()
        img.decoding = "async"
        img.src = clip.src
        this.images.set(clip.id, img)
      }
    }
  }

  private dropMedia(el: HTMLMediaElement, map: Map<string, HTMLMediaElement>, id: string): void {
    el.pause()
    el.removeAttribute("src")
    el.load()
    map.delete(id)
    this.srcs.delete(id)
    this.sourceDurations.delete(id)
  }

  remove(clipId: string): void {
    const v = this.videos.get(clipId)
    if (v) this.dropMedia(v, this.videos, clipId)
    const a = this.audios.get(clipId)
    if (a) this.dropMedia(a, this.audios, clipId)
    this.images.delete(clipId)
    this.srcs.delete(clipId)
  }

  pauseAll(): void {
    for (const el of this.videos.values()) el.pause()
    for (const el of this.audios.values()) el.pause()
  }

  /** All media elements (for audio graph wiring). */
  mediaElements(): HTMLMediaElement[] {
    return [...this.videos.values(), ...this.audios.values()]
  }

  ensureAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext()
      return this.audioCtx
    } catch {
      return null
    }
  }

/**
* Lazily route an element through the shared AudioContext (once per element).
* Connected to ctx.destination so preview keeps sounding.
*/
  mediaNode(el: HTMLMediaElement): MediaElementAudioSourceNode | null {
    const ctx = this.ensureAudioContext()
    if (!ctx) return null
    let node = this.srcNodes.get(el)
    if (!node) {
      try {
        node = ctx.createMediaElementSource(el)
        node.connect(ctx.destination)
        this.srcNodes.set(el, node)
      } catch {
        return null
      }
    }
    return node
  }

  destroy(): void {
    this.pauseAll()
    for (const id of [...this.videos.keys()]) this.remove(id)
    for (const id of [...this.audios.keys()]) this.remove(id)
    this.images.clear()
    if (this.audioCtx && this.audioCtx.state !== "closed") void this.audioCtx.close().catch(() => {})
    this.audioCtx = null
    this.srcNodes.clear()
  }
}

/* ---------------- element driving ---------------- */

function applyAudioParams(clip: VideoClip, t: number, el: HTMLMediaElement, trackMuted: boolean): void {
  const muted = clip.muted || trackMuted
  const g = muted ? 0 : clip.volume * gainAt(clip, t)
  el.volume = Math.min(1, Math.max(0, g))
  el.muted = muted
}

function trackMutedFor(config: VideoConfig, clip: VideoClip): boolean {
  return config.tracks.find((tr) => tr.id === clip.trackId)?.muted ?? false
}

function mediaElFor(pool: MediaPool, clip: VideoClip): HTMLMediaElement | undefined {
  if (clip.kind === "video") return pool.videoEl(clip.id)
  if (clip.kind === "audio") return pool.audioEl(clip.id)
  return undefined
}

/**
* Bring every media element in line with timeline time t.
* playing=true keeps elements rolling with drift correction and schedules
* volume/fades; playing=false pauses and precisely seeks active clips.
*/
export function driveMedia(config: VideoConfig, pool: MediaPool, t: number, playing: boolean): void {
  for (const clip of config.clips) {
    const el = mediaElFor(pool, clip)
    if (!el) continue
    const active = isActiveAt(clip, t) && clip.src
    if (!active) {
      if (!el.paused) el.pause()
      continue
    }
    const target = sourceTimeMs(clip, t) / 1000
    if (playing) {
      el.playbackRate = Math.min(4, Math.max(0.25, clip.speed))
      applyAudioParams(clip, t, el, trackMutedFor(config, clip))
      const drift = el.currentTime - target
      if (el.paused) {
        if (Math.abs(drift) > DRIFT_SEEK_MS / 1000) el.currentTime = Math.max(0, target)
        void el.play().catch(() => {})
      } else if (Math.abs(drift) > DRIFT_PLAY_MS / 1000) {
        el.currentTime = Math.max(0, target)
      }
    } else {
      if (!el.paused) el.pause()
      el.playbackRate = 1
      applyAudioParams(clip, t, el, trackMutedFor(config, clip))
      if (Math.abs(el.currentTime - target) > DRIFT_SEEK_MS / 1000) {
        try {
          el.currentTime = Math.max(0, target)
        } catch {
          /* seeking before metadata — ignore */
        }
      }
    }
  }
}

/** Seek helper used by export: position elements for a fresh run from 0 (or t). */
export function primeMedia(config: VideoConfig, pool: MediaPool, t: number): void {
  pool.pauseAll()
  driveMedia(config, pool, t, false)
}
