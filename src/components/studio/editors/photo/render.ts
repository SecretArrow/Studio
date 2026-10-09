"use client"

/**
 * Photo rendering engine.
 *
 * One consistent pipeline renders the interactive preview, every export
 * format, thumbnails and the crop bake — so what you see is exactly what
 * you get. Pure DOM canvas (no Konva) to keep the module light.
 */

import type { ExportRequest, ExportResult } from "../types"
import type { BackgroundSpec, DesignDoc, DesignElement, ImageElement, PageModel, ShapeElement, TextElement } from "@/lib/design/types"
import { loadImage } from "@/lib/editor/export"
import {
  arrowHeadPoints,
  fontString,
  gradientEndpoints,
  lineGeometry,
  shapePathData,
  textVisualLines,
} from "@/lib/editor/geometry"
import {
  applyPixelPass,
  cssFilterString,
  drawTemperatureTint,
  drawVignette,
  hasPixelPass,
  toPhotoFilters,
  type PhotoFilters,
} from "./filters"

/* ------------------------------ background ------------------------------ */

function paintBackground(ctx: CanvasRenderingContext2D, bg: BackgroundSpec, w: number, h: number): void {
  if (bg.type === "solid") {
    ctx.fillStyle = bg.color ?? "#ffffff"
    ctx.fillRect(0, 0, w, h)
  } else if (bg.type === "gradient" && bg.gradient) {
    const ep = gradientEndpoints(bg.gradient.angle, w, h)
    const grad = ctx.createLinearGradient(ep.x0, ep.y0, ep.x1, ep.y1)
    grad.addColorStop(0, bg.gradient.from)
    grad.addColorStop(1, bg.gradient.to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  } else if (bg.type === "image" && bg.imageUrl) {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
  }
  // "image" backgrounds are painted after loading by the caller (cover-fit)
}

/* ------------------------------ subject geometry ------------------------------ */

export interface SubjectDraw {
  img: HTMLImageElement
  sx: number
  sy: number
  sw: number
  sh: number
  box: { x: number; y: number; width: number; height: number }
  rotation: number
  flipH: boolean
  flipV: boolean
  /** source px per doc unit (cover scale) — used to bake crops at native density */
  scale: number
}

export function computeSubjectDraw(subject: ImageElement, img: HTMLImageElement): SubjectDraw {
  const crop = subject.crop ?? { x: 0, y: 0, width: 1, height: 1 }
  const sx = crop.x * img.naturalWidth
  const sy = crop.y * img.naturalHeight
  const sw = Math.max(1, crop.width * img.naturalWidth)
  const sh = Math.max(1, crop.height * img.naturalHeight)
  const box = { x: subject.x, y: subject.y, width: subject.width, height: subject.height }
  const rad = (Math.abs(subject.rotation) * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const needW = sw * c + sh * s
  const needH = sw * s + sh * c
  const scale = Math.max(box.width / needW, box.height / needH)
  return { img, sx, sy, sw, sh, box, rotation: subject.rotation, flipH: !!subject.flipH, flipV: !!subject.flipV, scale }
}

function roundedRectPathOn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  ctx.beginPath()
  if (rr <= 0.01) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Draw the subject with rotation / flip / cover-scale (filters are the caller's job). */
export function drawSubjectTransformed(ctx: CanvasRenderingContext2D, d: SubjectDraw, cornerRadius = 0): void {
  const { box } = d
  ctx.save()
  if (cornerRadius > 0) {
    roundedRectPathOn(ctx, box.x, box.y, box.width, box.height, cornerRadius)
    ctx.clip()
  }
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2)
  if (d.rotation) ctx.rotate((d.rotation * Math.PI) / 180)
  if (d.flipH || d.flipV) ctx.scale(d.flipH ? -1 : 1, d.flipV ? -1 : 1)
  ctx.scale(d.scale, d.scale)
  ctx.drawImage(d.img, d.sx, d.sy, d.sw, d.sh, -d.sw / 2, -d.sh / 2, d.sw, d.sh)
  ctx.restore()
}

/* ------------------------------ overlays ------------------------------ */

function drawOverlayText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  const pad = 2
  const text = el.uppercase ? el.text.toUpperCase() : el.text
  const lines = textVisualLines(
    {
      text: el.text,
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      italic: el.italic,
      uppercase: el.uppercase,
      lineHeight: el.lineHeight,
      letterSpacing: el.letterSpacing,
      listStyle: el.listStyle,
    },
    el.width,
    pad,
  )
  const lh = el.fontSize * el.lineHeight
  const blockH = lines.length * lh
  let offsetY = 0
  if (el.vAlign === "middle") offsetY = Math.max(0, (el.height - blockH) / 2)
  else if (el.vAlign === "bottom") offsetY = Math.max(0, el.height - blockH)

  ctx.save()
  ctx.translate(el.x, el.y)
  if (el.rotation) {
    ctx.translate(el.width / 2, el.height / 2)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-el.width / 2, -el.height / 2)
  }
  if (el.bgColor) {
    ctx.fillStyle = el.bgColor
    ctx.fillRect(0, 0, el.width, Math.max(el.height, blockH))
  }
  ctx.font = fontString(el.fontFamily, el.fontSize, el.fontWeight, el.italic)
  const ctx2 = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if (el.letterSpacing) ctx2.letterSpacing = `${el.letterSpacing}px`
  ctx.fillStyle = el.color
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = el.align === "center" ? "center" : el.align === "right" ? "right" : "left"
  lines.forEach((line, i) => {
    const x = el.align === "center" ? el.width / 2 : el.align === "right" ? el.width : 0
    const y = offsetY + i * lh + el.fontSize * 0.82 + pad
    ctx.fillText(line, x, y, el.width)
    if ((el.underline || el.strike) && line.trim() !== "") {
      const w = ctx.measureText(line).width
      const x0 = el.align === "center" ? el.width / 2 - w / 2 : el.align === "right" ? el.width - w : x
      ctx.strokeStyle = el.color
      ctx.lineWidth = Math.max(1, el.fontSize / 16)
      ctx.beginPath()
      if (el.strike) {
        ctx.moveTo(x0, y - el.fontSize * 0.3)
        ctx.lineTo(x0 + w, y - el.fontSize * 0.3)
      } else {
        ctx.moveTo(x0, y + el.fontSize * 0.12)
        ctx.lineTo(x0 + w, y + el.fontSize * 0.12)
      }
      ctx.stroke()
    }
  })
  if (el.letterSpacing) ctx2.letterSpacing = "0px"
  ctx.restore()
}

function drawOverlayShape(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  ctx.save()
  ctx.globalAlpha *= 1
  ctx.translate(el.x, el.y)
  if (el.rotation) {
    ctx.translate(el.width / 2, el.height / 2)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-el.width / 2, -el.height / 2)
  }
  if (el.variant === "line" || el.variant === "arrow") {
    const { x1, y1, x2, y2 } = lineGeometry(el.width, el.height)
    ctx.strokeStyle = el.fill === "transparent" ? el.stroke : el.fill
    ctx.lineWidth = Math.max(1, el.strokeWidth || 3)
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    if (el.variant === "arrow" && el.arrowHead !== "none") {
      const head = arrowHeadPoints(x1, y1, x2, y2, Math.max(10, ctx.lineWidth * 3.4))
      ctx.fillStyle = ctx.strokeStyle
      ctx.beginPath()
      ctx.moveTo(head[0].x, head[0].y)
      ctx.lineTo(head[1].x, head[1].y)
      ctx.lineTo(head[2].x, head[2].y)
      ctx.closePath()
      ctx.fill()
    }
  } else {
    const path = new Path2D(shapePathData(el.variant, el.width, el.height, el.cornerRadius))
    if (el.fill && el.fill !== "transparent") {
      ctx.fillStyle = el.fill
      ctx.fill(path)
    }
    if (el.stroke && el.stroke !== "transparent" && el.strokeWidth > 0) {
      ctx.strokeStyle = el.stroke
      ctx.lineWidth = el.strokeWidth
      ctx.lineJoin = "round"
      ctx.stroke(path)
    }
  }
  ctx.restore()
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = "rgba(139,92,246,0.14)"
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = "#8b5cf6"
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.strokeRect(1, 1, w - 2, h - 2)
  ctx.setLineDash([])
}

function drawOverlayElement(ctx: CanvasRenderingContext2D, el: DesignElement): void {
  if (el.hidden) return
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity))
  if (el.type === "text") drawOverlayText(ctx, el)
  else if (el.type === "shape") drawOverlayShape(ctx, el)
  else drawPlaceholder(ctx, el.width, el.height)
  ctx.restore()
}

/* ------------------------------ full-page render ------------------------------ */

export interface PhotoRenderOpts {
  /** canvas px per doc unit (used for both axes unless scaleX/scaleY given) */
  scale: number
  /** independent horizontal scale (resize & compress dialog) */
  scaleX?: number
  /** independent vertical scale (resize & compress dialog) */
  scaleY?: number
  /** skip all color edits — the untouched original (before/after view) */
  compare?: boolean
  /** skip the page background (transparent export) */
  transparent?: boolean
  /** force a white backdrop (JPEG/PDF cannot store transparency) */
  forceOpaque?: boolean
  includeOverlays?: boolean
}

function drawBackgroundImage(ctx: CanvasRenderingContext2D, url: string, w: number, h: number): Promise<void> {
  return loadImage(url).then((img) => {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
    if (!img) return
    const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * ratio
    const dh = img.naturalHeight * ratio
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  })
}

export async function renderPhotoDoc(doc: DesignDoc, page: PageModel, opts: PhotoRenderOpts): Promise<HTMLCanvasElement> {
  const sx = Math.max(0.001, opts.scaleX ?? opts.scale)
  const sy = Math.max(0.001, opts.scaleY ?? opts.scaleX ?? opts.scale)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(doc.width * sx))
  canvas.height = Math.max(1, Math.round(doc.height * sy))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D is not available in this browser")
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    /* older browsers */
  }
  ctx.scale(canvas.width / doc.width, canvas.height / doc.height)

  const bg = page.background
  if (opts.transparent) {
    // leave fully transparent (PNG with no background)
  } else if (bg.type === "image" && bg.imageUrl) {
    await drawBackgroundImage(ctx, bg.imageUrl, doc.width, doc.height)
  } else if (bg.type === "transparent") {
    if (opts.forceOpaque) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, doc.width, doc.height)
    }
    // otherwise keep transparent
  } else {
    paintBackground(ctx, bg, doc.width, doc.height)
  }

  const subject = page.elements.find((el): el is ImageElement => el.type === "image" && !el.hidden) ?? null
  if (subject && subject.src) {
    const img = await loadImage(subject.src)
    const f = toPhotoFilters(subject.filters)
    const off = document.createElement("canvas")
    off.width = canvas.width
    off.height = canvas.height
    const octx = off.getContext("2d")
    if (img && octx) {
      const draw = computeSubjectDraw(subject, img)
      if (!opts.compare) {
        const css = cssFilterString(f)
        if (css !== "none") octx.filter = css
      }
      drawSubjectTransformed(octx, draw, subject.cornerRadius)
      octx.filter = "none"
      if (!opts.compare) {
        if (hasPixelPass(f)) applyPixelPass(octx, 0, 0, off.width, off.height, f)
        if (f.temperature) drawTemperatureTint(octx, draw.box.x, draw.box.y, draw.box.width, draw.box.height, f.temperature)
        if (f.vignette) drawVignette(octx, draw.box.x, draw.box.y, draw.box.width, draw.box.height, f.vignette)
      }
      ctx.drawImage(off, 0, 0, doc.width, doc.height)
    } else {
      drawPlaceholder(ctx, subject.width, subject.height)
    }
  }

  if (opts.includeOverlays !== false) {
    for (const el of page.elements) {
      if (el.type === "image") continue
      drawOverlayElement(ctx, el)
    }
  }
  return canvas
}

/** Small preview for the preset cards (subject + one preset applied). */
export async function renderPresetThumb(img: HTMLImageElement, filters: PhotoFilters, size = 120): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  // cover-fit the whole image into the square
  const ratio = Math.max(size / img.naturalWidth, size / img.naturalHeight)
  const dw = img.naturalWidth * ratio
  const dh = img.naturalHeight * ratio
  const css = cssFilterString(filters)
  if (css !== "none") ctx.filter = css
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  ctx.filter = "none"
  if (hasPixelPass(filters)) applyPixelPass(ctx, 0, 0, size, size, filters)
  if (filters.temperature) drawTemperatureTint(ctx, 0, 0, size, size, filters.temperature)
  if (filters.vignette) drawVignette(ctx, 0, 0, size, size, filters.vignette)
  return canvas.toDataURL("image/jpeg", 0.8)
}

/* ------------------------------ crop bake ------------------------------ */

export interface BakeResult {
  /** encoded image (webp when supported) — upload this when possible */
  blob: Blob | null
  /** fallback data URL when blob encoding is unavailable */
  dataUrl: string | null
  width: number
  height: number
}

/**
 * Bake the current geometry (crop rect + rotation + straighten + flip) of the
 * subject into a new image. Filters stay untouched (non-destructive).
 * The rect is given in doc coordinates; the bake replays the exact display
 * transform, so the output matches what the user sees inside the rect.
 */
export async function bakeSubjectCrop(subject: ImageElement, rect: { x: number; y: number; width: number; height: number }): Promise<BakeResult | null> {
  const img = await loadImage(subject.src)
  if (!img) return null
  const d = computeSubjectDraw(subject, img)
  // clamp the rect to the subject footprint
  const x0 = Math.max(d.box.x, rect.x)
  const y0 = Math.max(d.box.y, rect.y)
  const x1 = Math.min(d.box.x + d.box.width, rect.x + rect.width)
  const y1 = Math.min(d.box.y + d.box.height, rect.y + rect.height)
  const w = x1 - x0
  const h = y1 - y0
  if (w < 4 || h < 4) return null

  // native density: 1 source px per output px (capped so exports stay sane)
  let bakeScale = 1 / Math.max(1e-6, d.scale)
  bakeScale = Math.min(bakeScale, 2600 / Math.max(w, h))
  bakeScale = Math.max(bakeScale, 4 / Math.max(w, h))
  const outW = Math.max(1, Math.round(w * bakeScale))
  const outH = Math.max(1, Math.round(h * bakeScale))

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.scale(outW / w, outH / h)
  ctx.translate(-x0, -y0)
  drawSubjectTransformed(ctx, d)

  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.92)
    } catch {
      resolve(null)
    }
  })
  if (blob) return { blob, dataUrl: null, width: outW, height: outH }
  try {
    return { blob: null, dataUrl: canvas.toDataURL("image/png"), width: outW, height: outH }
  } catch {
    return null // tainted canvas (cross-origin image without CORS)
  }
}

/* ------------------------------ blob helpers ------------------------------ */

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), mime, quality)
    } catch {
      resolve(null)
    }
  })
}

/* ------------------------------ exports ------------------------------ */

async function blobToResult(filename: string, blob: Blob, note?: string): Promise<ExportResult> {
  return { filename, blob, note }
}

export async function exportPhotoDoc(doc: DesignDoc, req: ExportRequest): Promise<ExportResult[]> {
  const page = doc.pages[0] ?? doc.pages[doc.pages.length - 1]
  if (!page) return []
  const base = (req.filenameBase || "photo").replace(/[\\/:*?"<>|]+/g, "-")
  const results: ExportResult[] = []

  if (req.format === "json") {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" })
    results.push(await blobToResult(`${base}.studio.json`, blob))
    return results
  }

  if (req.format === "pdf") {
    const { jsPDF } = await import("jspdf")
    const scale = Math.min(2, Math.max(0.2, req.scale ?? 1))
    const canvas = await renderPhotoDoc(doc, page, { scale, forceOpaque: true })
    const pdf = new jsPDF({
      orientation: doc.width >= doc.height ? "landscape" : "portrait",
      unit: "px",
      format: [doc.width, doc.height],
    })
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, doc.width, doc.height)
    results.push(await blobToResult(`${base}.pdf`, pdf.output("blob"), "Single-page PDF of the photo."))
    return results
  }

  const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
  const scale = Math.min(4, Math.max(0.05, req.scale ?? 1))
  const quality = Math.min(1, Math.max(0.1, req.quality ?? 0.92))
  const transparent = req.format === "png" && req.transparent === true
  const canvas = await renderPhotoDoc(doc, page, { scale, transparent, forceOpaque: req.format !== "png" && req.format !== "webp" })
  let blob = await canvasToBlob(canvas, mime, quality)
  if (!blob) {
    // webp unsupported → honest fallback to png
    blob = await canvasToBlob(canvas, "image/png")
    if (!blob) return []
    const ext = req.format === "webp" ? "png" : req.format === "jpeg" ? "jpg" : "png"
    results.push(
      await blobToResult(
        `${base}.${ext}`,
        blob,
        req.format === "webp" ? "WebP is not supported by this browser — exported PNG instead." : undefined,
      ),
    )
    return results
  }
  const ext = req.format === "jpeg" ? "jpg" : req.format
  results.push(await blobToResult(`${base}.${ext}`, blob))
  return results
}

/** Render a small JPEG data URL thumbnail, guaranteed ≤ ~64KB. */
export async function photoThumbnail(doc: DesignDoc, page: PageModel): Promise<string | null> {
  const scales = [512, 384, 256]
  const qualities = [0.85, 0.7, 0.55, 0.4]
  const limit = 87_000 // ≈64KB as base64 chars
  for (const side of scales) {
    const scale = side / Math.max(doc.width, doc.height)
    const canvas = await renderPhotoDoc(doc, page, { scale: Math.min(1, scale), forceOpaque: false })
    for (const q of qualities) {
      const url = canvas.toDataURL("image/jpeg", q)
      if (url.length <= limit) return url
    }
  }
  return null
}
