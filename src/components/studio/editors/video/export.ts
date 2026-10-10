/**
* Video editor — export.
* Renders the timeline to a video blob via canvas.captureStream(30) +
* MediaRecorder in REALTIME playback (progress = timeline duration), mixing
* clip audio through a shared AudioContext → MediaStreamDestination. If audio
* mixing is unavailable the export continues video-only with an honest note.
*/

import type { VideoConfig } from "@/lib/design/types"
import { driveMedia, primeMedia, type MediaPool } from "./media-pool"
import { drawFrame } from "./render"
import { totalDurationMs } from "./model"

export interface RecordOptions {
  config: VideoConfig
  pool: MediaPool
  mimeType: string
  onProgress: (fraction: number) => void
  isCancelled: () => boolean
}

export interface RecordOutcome {
  blob: Blob | null
  note?: string
}

export function pickVideoMime(format: "webm" | "mp4"): string | null {
  if (typeof MediaRecorder === "undefined") return null
  const candidates =
    format === "mp4"
      ? ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"]
      : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m
    } catch {
      /* keep probing */
    }
  }
  return null
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
      mime,
      quality,
    )
  })
}

/** PNG of the current frame at full canvas resolution. */
export async function exportCurrentFramePng(config: VideoConfig, pool: MediaPool, playheadMs: number): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = config.canvas.width
  canvas.height = config.canvas.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is unavailable in this browser.")
  drawFrame(ctx, config, playheadMs, pool)
  return canvasToBlob(canvas, "image/png")
}

/** JPEG thumbnail (≤ ~480px wide) of the current frame. */
export async function renderThumbnail(config: VideoConfig, pool: MediaPool, playheadMs: number): Promise<string> {
  const scale = Math.min(1, 480 / config.canvas.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(2, Math.round(config.canvas.width * scale))
  canvas.height = Math.max(2, Math.round(config.canvas.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is unavailable in this browser.")
  ctx.scale(scale, scale)
  drawFrame(ctx, config, playheadMs, pool)
  return canvas.toDataURL("image/jpeg", 0.6)
}

/**
* Record the whole timeline in real time. Resolves with `blob: null` when the
* user cancels. Throws honest errors for unsupported browsers / empty timelines.
*/
export async function recordTimeline(opts: RecordOptions): Promise<RecordOutcome> {
  const { config, pool, mimeType, onProgress, isCancelled } = opts
  const total = totalDurationMs(config)
  if (total <= 0) throw new Error("The timeline is empty — add at least one clip before exporting.")
  if (typeof MediaRecorder === "undefined") throw new Error("MediaRecorder is not available in this browser, so video export is not possible here.")

  const canvas = document.createElement("canvas")
  canvas.width = config.canvas.width
  canvas.height = config.canvas.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is unavailable in this browser.")

  const stream = canvas.captureStream(30)
  let note: string | undefined
  let dest: MediaStreamAudioDestinationNode | null = null

  // Route clip audio into the recording. Source nodes are created once and
  // stay connected to speakers; only the recording destination is added here.
  try {
    const actx = pool.ensureAudioContext()
    if (!actx) throw new Error("no AudioContext")
    await actx.resume().catch(() => {})
    dest = actx.createMediaStreamDestination()
    for (const el of pool.mediaElements()) {
      const node = pool.mediaNode(el)
      if (node) node.connect(dest)
    }
    for (const track of dest.stream.getAudioTracks()) stream.addTrack(track)
  } catch {
    note = "Audio mixing isn't available in this browser — the export contains video only."
    dest = null
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = () => reject(new Error("Recording failed mid-export. Try a smaller canvas size or shorter timeline."))
  })

  try {
    primeMedia(config, pool, 0)
    recorder.start(250)
    const startedAt = performance.now()
    let lastReport = 0

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (isCancelled()) {
          resolve()
          return
        }
        const elapsed = performance.now() - startedAt
        const t = Math.min(elapsed, total)
        driveMedia(config, pool, t, true)
        drawFrame(ctx, config, t, pool)
        const fraction = t / total
        if (elapsed - lastReport > 100) {
          lastReport = elapsed
          onProgress(fraction)
        }
        if (elapsed >= total) {
          resolve()
          return
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    // Let the encoder flush the final frames.
    await new Promise((r) => setTimeout(r, 150))
    pool.pauseAll()
    if (recorder.state !== "inactive") recorder.stop()
    await stopped
  } finally {
    if (recorder.state !== "inactive") {
      try {
        recorder.stop()
      } catch {
        /* already stopped */
      }
    }
    // Restore preview-only audio routing (also on the error path).
    if (dest) {
      for (const el of pool.mediaElements()) {
        const node = pool.mediaNode(el)
        if (node) {
          try {
            node.disconnect(dest)
          } catch {
            /* already disconnected */
          }
        }
      }
    }
    // Release the canvas capture track and the recording-only audio tracks —
    // MediaStream tracks are never GC'd while live, so they MUST be stopped.
    for (const track of stream.getTracks()) track.stop()
  }

  if (isCancelled()) return { blob: null }
  const blob = new Blob(chunks, { type: mimeType.split(";")[0] })
  if (!blob.size) throw new Error("The recorder produced an empty file — try again or pick WebM.")
  onProgress(1)
  return { blob, note }
}
