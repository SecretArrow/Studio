/**
* Video editor — canvas frame renderer.
* Draws one frame of the timeline at time t: background, video/image clips
* (contain-fit with fade/slide transitions), text/sticker overlays and
* subtitles. Shared by the live preview, PNG export and WebM recording.
*/

import type { VideoClip, VideoConfig } from "@/lib/design/types"
import type { MediaPool } from "./media-pool"
import { isActiveAt, slideOffsetAt, visualAlphaAt } from "./model"

interface TextStyleProps {
  text: string
  fontSize: number
  color: string
  fontFamily: string
  fontWeight: number
  align: "left" | "center" | "right"
  x: number
  y: number
}

const DEFAULT_TEXT: TextStyleProps = {
  text: "Text",
  fontSize: 64,
  color: "#ffffff",
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  align: "center",
  x: 0,
  y: 0,
}

function textPropsOf(clip: VideoClip, canvasWidth: number, canvasHeight: number): TextStyleProps {
  const raw = (clip.element ?? {}) as Record<string, unknown>
  const num = (v: unknown, fallback: number): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback)
  const str = (v: unknown, fallback: string): string => (typeof v === "string" && v ? v : fallback)
  return {
    text: str(raw.text, "Text"),
    fontSize: Math.max(8, num(raw.fontSize, Math.round(canvasHeight * 0.08))),
    color: str(raw.color, "#ffffff"),
    fontFamily: str(raw.fontFamily, DEFAULT_TEXT.fontFamily),
    fontWeight: num(raw.fontWeight, 700),
    align: raw.align === "left" || raw.align === "right" ? raw.align : "center",
    x: num(raw.x, canvasWidth / 2),
    y: num(raw.y, canvasHeight / 2),
  }
}

/** Draw src media contain-fit into the full canvas. */
function drawContain(
  ctx: CanvasRenderingContext2D,
  media: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  offsetX = 0,
): void {
  if (srcWidth <= 0 || srcHeight <= 0) return
  const scale = Math.min(canvasWidth / srcWidth, canvasHeight / srcHeight)
  const w = srcWidth * scale
  const h = srcHeight * scale
  ctx.drawImage(media, (canvasWidth - w) / 2 + offsetX, (canvasHeight - h) / 2, w, h)
}

function drawMediaClip(ctx: CanvasRenderingContext2D, clip: VideoClip, t: number, pool: MediaPool, config: VideoConfig): void {
  const { width, height } = config.canvas
  const alpha = visualAlphaAt(clip, t)
  if (alpha <= 0.01) return
  const offsetX = slideOffsetAt(clip, t, width)
  ctx.save()
  ctx.globalAlpha *= alpha
  if (clip.kind === "video") {
    const el = pool.videoEl(clip.id)
    if (el && el.readyState >= 2 && el.videoWidth > 0) drawContain(ctx, el, el.videoWidth, el.videoHeight, width, height, offsetX)
  } else if (clip.kind === "image") {
    const img = pool.imageEl(clip.id)
    if (img && img.complete && img.naturalWidth > 0) drawContain(ctx, img, img.naturalWidth, img.naturalHeight, width, height, offsetX)
  }
  ctx.restore()
}

function drawTextClip(ctx: CanvasRenderingContext2D, clip: VideoClip, t: number, config: VideoConfig): void {
  const { width, height } = config.canvas
  const alpha = visualAlphaAt(clip, t)
  if (alpha <= 0.01) return
  const p = textPropsOf(clip, width, height)
  const offsetX = clip.kind === "text" || clip.kind === "sticker" ? slideOffsetAt(clip, t, width) : 0
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${p.fontWeight} ${p.fontSize}px ${p.fontFamily}`
  ctx.textBaseline = "middle"
  ctx.textAlign = p.align
  const lines = p.text.split("\n")
  const lineHeight = p.fontSize * 1.25
  const centerY = p.y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => {
    const y = centerY + i * lineHeight
    const x = p.x + offsetX
    if (p.align === "center") ctx.fillText(line, x, y, width)
    else if (p.align === "right") ctx.fillText(line, Math.min(x, width), y, width)
    else ctx.fillText(line, Math.max(0, x), y, width)
  })
  ctx.restore()
}

function drawSubtitles(ctx: CanvasRenderingContext2D, config: VideoConfig, t: number): void {
  const subs = config.subtitles ?? []
  if (!subs.length) return
  const { width, height } = config.canvas
  const active = subs.find((s) => t >= s.start && t < s.end)
  if (!active || !active.text) return
  const fontSize = Math.max(18, Math.round(height * 0.045))
  ctx.save()
  ctx.font = `600 ${fontSize}px Inter, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "bottom"
  const lines = active.text.split("\n")
  const lineHeight = fontSize * 1.3
  lines.forEach((line, i) => {
    const y = height - height * 0.06 - (lines.length - 1 - i) * lineHeight
    ctx.lineWidth = Math.max(2, fontSize / 8)
    ctx.strokeStyle = "rgba(0,0,0,0.85)"
    ctx.lineJoin = "round"
    ctx.strokeText(line, width / 2, y, width * 0.9)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(line, width / 2, y, width * 0.9)
  })
  ctx.restore()
}

/** Render the full frame at timeline time t (ms). */
export function drawFrame(ctx: CanvasRenderingContext2D, config: VideoConfig, t: number, pool: MediaPool): void {
  const { width, height, background } = config.canvas
  ctx.save()
  ctx.fillStyle = background || "#000000"
  ctx.fillRect(0, 0, width, height)

  // Track order defines z-order: video first, overlay (text/images) on top.
  for (const track of config.tracks) {
    if (track.hidden || track.kind === "audio") continue
    const clips = config.clips
      .filter((c) => c.trackId === track.id && isActiveAt(c, t))
      .sort((a, b) => a.start - b.start)
    for (const clip of clips) {
      if (clip.kind === "video" || clip.kind === "image") drawMediaClip(ctx, clip, t, pool, config)
      else if (clip.kind === "text" || clip.kind === "sticker") drawTextClip(ctx, clip, t, config)
    }
  }
  drawSubtitles(ctx, config, t)
  ctx.restore()
}
