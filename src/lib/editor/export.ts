/**
 * Headless export engine.
 * Renders DesignDoc pages to canvas / SVG without touching the interactive
 * Konva stage, so exports are consistent for every page and work even when
 * the stage is not mounted. Heavy deps (jspdf / jszip / qrcode) are
 * dynamically imported inside the functions that need them.
 */

import type { ExportRequest, ExportResult } from "@/components/studio/editors/types"
import type { BackgroundSpec, DesignDoc, DesignElement, ImageElement, PageModel, ShapeElement, TableElement, TextElement, StickyElement, FrameElement, QrElement, ChartElement, FreehandElement, ConnectorElement, IconElement } from "@/lib/design/types"
import { ICON_LIBRARY, iconToSvg } from "@/lib/design/icons"
import { LruMap } from "@/lib/studio/lru"
import {
  arrowHeadPoints,
  fontString,
  gradientEndpoints,
  lineGeometry,
  roundedRectPath,
  shapePathData,
  textVisualLines,
} from "./geometry"
import { layoutChart } from "./charts"

/* ------------------------------ image loading ------------------------------ */

const imageCache = new LruMap<string, Promise<HTMLImageElement | null>>(120)

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  const hit = imageCache.get(src)
  if (hit) return hit
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
  imageCache.set(src, p)
  return p
}

/** Convert a remote URL to a data URL (best effort, for SVG embedding). */
async function toDataUrl(src: string): Promise<string | null> {
  if (src.startsWith("data:")) return src
  try {
    const res = await fetch(src, { mode: "cors" })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string | null>((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null)
      fr.onerror = () => resolve(null)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/* ------------------------------ QR generation ------------------------------ */

let qrPromise: Promise<typeof import("qrcode")> | null = null
const qrCache = new LruMap<string, Promise<string>>(100)

/** QR code as PNG data URL. `qrcode` is dynamically imported to keep bundles lean. */
export function qrDataUrl(data: string, fg = "#111827", bg = "#ffffff", width = 512): Promise<string> {
  const key = `${data}|${fg}|${bg}|${width}`
  const hit = qrCache.get(key)
  if (hit) return hit
  if (!qrPromise) qrPromise = import("qrcode")
  const p = qrPromise.then((QR) =>
    QR.toDataURL(data || " ", {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: fg, light: bg },
    }),
  )
  qrCache.set(key, p)
  return p
}

/* ------------------------------ filters ------------------------------ */

export function filtersToCss(el: ImageElement): string {
  const f = el.filters
  if (!f) return "none"
  const parts: string[] = []
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`)
  if (f.hue) parts.push(`hue-rotate(${f.hue}deg)`)
  if (f.blur) parts.push(`blur(${f.blur}px)`)
  if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`)
  if (f.sepia) parts.push(`sepia(${f.sepia}%)`)
  if (f.invert) parts.push(`invert(${f.invert}%)`)
  return parts.length > 0 ? parts.join(" ") : "none"
}

function roundRectOn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

/* ------------------------------ page renderer ------------------------------ */

export interface RenderOpts {
  scale?: number
  /** skip background (transparent export) */
  transparent?: boolean
  /** cap the largest side in px (thumbnails) */
  maxSide?: number
}

function paintBackground(ctx: CanvasRenderingContext2D, bg: BackgroundSpec, w: number, h: number): void {
  if (bg.type === "solid" && bg.color) {
    ctx.fillStyle = bg.color
    ctx.fillRect(0, 0, w, h)
  } else if (bg.type === "gradient" && bg.gradient) {
    const { from, to, angle } = bg.gradient
    const ep = gradientEndpoints(angle, w, h)
    const grad = ctx.createLinearGradient(ep.x0, ep.y0, ep.x1, ep.y1)
    grad.addColorStop(0, from)
    grad.addColorStop(1, to)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  } else if (bg.type === "image" && bg.imageUrl) {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, w, h)
  }
}

async function drawElement(ctx: CanvasRenderingContext2D, el: DesignElement): Promise<void> {
  if (el.hidden || el.type === "group") return
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity))
  ctx.translate(el.x, el.y)
  if (el.rotation) {
    ctx.translate(el.width / 2, el.height / 2)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-el.width / 2, -el.height / 2)
  }

  switch (el.type) {
    case "shape":
      drawShape(ctx, el)
      break
    case "text":
      drawText(ctx, el)
      break
    case "image":
      await drawImageEl(ctx, el)
      break
    case "icon":
      drawIcon(ctx, el)
      break
    case "chart":
      drawChart(ctx, el)
      break
    case "table":
      drawTable(ctx, el)
      break
    case "qr":
      await drawQr(ctx, el)
      break
    case "frame":
      drawFrame(ctx, el)
      break
    case "sticky":
      drawSticky(ctx, el)
      break
    case "freehand":
      drawFreehand(ctx, el)
      break
    case "connector":
      drawConnector(ctx, el)
      break
    case "media":
      drawMediaPlaceholder(ctx, el)
      break
    default:
      drawPlaceholder(ctx, (el as { width: number }).width, (el as { height: number }).height)
  }
  ctx.restore()
}

function drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  if (el.variant === "line" || el.variant === "arrow") {
    const { x1, y1, x2, y2 } = lineGeometry(el.width, el.height)
    ctx.strokeStyle = el.fill === "transparent" ? el.stroke : el.fill
    ctx.lineWidth = Math.max(1, el.strokeWidth || 3)
    ctx.lineCap = "round"
    ctx.setLineDash(el.dash ?? [])
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.setLineDash([])
    if (el.variant === "arrow" && el.arrowHead !== "none") {
      ctx.fillStyle = ctx.strokeStyle as string
      ctx.beginPath()
      const head = arrowHeadPoints(x1, y1, x2, y2, Math.max(10, ctx.lineWidth * 3.4))
      ctx.moveTo(head[0].x, head[0].y)
      ctx.lineTo(head[1].x, head[1].y)
      ctx.lineTo(head[2].x, head[2].y)
      ctx.closePath()
      ctx.fill()
    }
    return
  }
  const d = shapePathData(el.variant, el.width, el.height, el.cornerRadius)
  const path = new Path2D(d)
  if (el.fill && el.fill !== "transparent") {
    ctx.fillStyle = el.fill
    ctx.fill(path)
  }
  if (el.stroke && el.stroke !== "transparent" && el.strokeWidth > 0) {
    ctx.strokeStyle = el.stroke
    ctx.lineWidth = el.strokeWidth
    ctx.lineJoin = "round"
    ctx.setLineDash(el.dash ?? [])
    ctx.stroke(path)
    ctx.setLineDash([])
  }
  if (el.shadow && el.shadow.blur > 0) {
    // shadow pass beneath (simple approximation: redraw filled path with shadow, then content)
    ctx.save()
    ctx.globalAlpha *= 0.5
    ctx.shadowColor = el.shadow.color
    ctx.shadowBlur = el.shadow.blur
    ctx.shadowOffsetX = el.shadow.offsetX
    ctx.shadowOffsetY = el.shadow.offsetY
    ctx.fillStyle = "rgba(0,0,0,1)"
    ctx.fill(path)
    ctx.restore()
  }
}

interface TextDrawProps extends TextElement {
  width: number
  height: number
}

function drawText(ctx: CanvasRenderingContext2D, el: TextDrawProps): void {
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

  const align: "left" | "center" | "right" = el.align
  ctx.font = fontString(el.fontFamily, el.fontSize, el.fontWeight, el.italic)
  const ctx2 = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if (el.letterSpacing) ctx2.letterSpacing = `${el.letterSpacing}px`
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left"

  if (el.bgColor) {
    ctx.fillStyle = el.bgColor
    roundRectOn(ctx, 0, 0, el.width, Math.max(el.height, blockH), Math.min(8, el.fontSize / 3))
    ctx.fill()
  }

  const indent = el.listStyle && el.listStyle !== "none" ? el.fontSize * 0.9 : 0
  let numberCounter = 1
  let prevWasListStart = false
  lines.forEach((line, i) => {
    const baseY = offsetY + i * lh + el.fontSize * 0.82 + pad
    let prefix = ""
    let extraIndent = 0
    if (el.listStyle === "bullet") {
      const isStart = line !== "" && !prevWasListStart
      prefix = isStart ? "•  " : ""
      extraIndent = prefix === "" ? indent : 0
      prevWasListStart = line === "" ? false : isStart ? true : prevWasListStart
    } else if (el.listStyle === "number") {
      const isStart = line !== "" && !prevWasListStart
      prefix = isStart ? `${numberCounter}.  ` : ""
      if (isStart) numberCounter += 1
      extraIndent = prefix === "" ? indent : 0
      prevWasListStart = line === "" ? false : isStart ? true : prevWasListStart
    }
    const drawX = (align === "center" ? el.width / 2 : align === "right" ? el.width : 0) + (align === "left" ? indent - extraIndent : 0)
    const lineText = `${prefix}${line}`
    if (lineText.trim() !== "" || prefix !== "") {
      if (el.shadow && el.shadow.blur >= 0) {
        ctx.save()
        ctx.shadowColor = el.shadow.color
        ctx.shadowBlur = el.shadow.blur
        ctx.shadowOffsetX = el.shadow.offsetX
        ctx.shadowOffsetY = el.shadow.offsetY
        ctx.fillStyle = el.color
        ctx.fillText(lineText, drawX, baseY)
        ctx.restore()
      } else {
        ctx.fillStyle = el.color
        ctx.fillText(lineText, drawX, baseY)
      }
      if (el.stroke && el.stroke.width > 0 && el.stroke.color !== "transparent") {
        ctx.strokeStyle = el.stroke.color
        ctx.lineWidth = el.stroke.width
        ctx.strokeText(lineText, drawX, baseY)
      }
    }
    // underline / strike
    if ((el.underline || el.strike) && line.trim() !== "") {
      const w = ctx.measureText(lineText).width
      const x0 = el.align === "center" ? el.width / 2 - w / 2 : el.align === "right" ? el.width - w : drawX
      ctx.strokeStyle = el.color
      ctx.lineWidth = Math.max(1, el.fontSize / 16)
      ctx.beginPath()
      if (el.strike) {
        ctx.moveTo(x0, baseY - el.fontSize * 0.3)
        ctx.lineTo(x0 + w, baseY - el.fontSize * 0.3)
      } else {
        ctx.moveTo(x0, baseY + el.fontSize * 0.12)
        ctx.lineTo(x0 + w, baseY + el.fontSize * 0.12)
      }
      ctx.stroke()
    }
  })
  if (el.letterSpacing) ctx2.letterSpacing = "0px"
}

async function drawImageEl(ctx: CanvasRenderingContext2D, el: ImageElement): Promise<void> {
  const img = await loadImage(el.src)
  if (!img) {
    drawPlaceholder(ctx, el.width, el.height)
    return
  }
  ctx.save()
  roundRectOn(ctx, 0, 0, el.width, el.height, el.cornerRadius)
  ctx.clip()
  if (el.flipH || el.flipV) {
    ctx.translate(el.flipH ? el.width : 0, el.flipV ? el.height : 0)
    ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1)
  }
  const cssFilter = filtersToCss(el)
  if (cssFilter !== "none") ctx.filter = cssFilter
  const crop = el.crop ?? { x: 0, y: 0, width: 1, height: 1 }
  const sx = crop.x * img.naturalWidth
  const sy = crop.y * img.naturalHeight
  const sw = Math.max(1, crop.width * img.naturalWidth)
  const sh = Math.max(1, crop.height * img.naturalHeight)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, el.width, el.height)
  ctx.filter = "none"
  const vig = el.filters?.vignette ?? 0
  if (vig > 0) {
    const grad = ctx.createRadialGradient(el.width / 2, el.height / 2, Math.min(el.width, el.height) * 0.35, el.width / 2, el.height / 2, Math.max(el.width, el.height) * 0.72)
    grad.addColorStop(0, "rgba(0,0,0,0)")
    grad.addColorStop(1, `rgba(0,0,0,${(vig / 100) * 0.85})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, el.width, el.height)
  }
  ctx.restore()
}

function drawIcon(ctx: CanvasRenderingContext2D, el: IconElement): void {
  const def = ICON_LIBRARY[el.icon]
  if (!def) {
    drawPlaceholder(ctx, el.width, el.height)
    return
  }
  ctx.scale(el.width / 24, el.height / 24)
  ctx.strokeStyle = el.color
  ctx.lineWidth = 2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  for (const d of def.paths) {
    ctx.stroke(new Path2D(d))
  }
}

function drawChart(ctx: CanvasRenderingContext2D, el: ChartElement): void {
  for (const p of layoutChart(el)) {
    if (p.kind === "rect") {
      if (p.fill) {
        ctx.fillStyle = p.fill
        if (p.cornerRadius) {
          roundRectOn(ctx, p.x, p.y, p.width, p.height, p.cornerRadius)
          ctx.fill()
        } else ctx.fillRect(p.x, p.y, p.width, p.height)
      }
    } else if (p.kind === "path") {
      const path = new Path2D(p.d)
      if (p.fill) {
        ctx.fillStyle = p.fill
        ctx.fill(path)
      }
      if (p.stroke) {
        ctx.strokeStyle = p.stroke
        ctx.lineWidth = p.strokeWidth ?? 1
        ctx.stroke(path)
      }
    } else if (p.kind === "polyline") {
      ctx.strokeStyle = p.stroke
      ctx.lineWidth = p.strokeWidth
      ctx.lineJoin = "round"
      ctx.lineCap = "round"
      ctx.beginPath()
      for (let i = 0; i < p.points.length; i += 2) {
        if (i === 0) ctx.moveTo(p.points[0], p.points[1])
        else ctx.lineTo(p.points[i], p.points[i + 1])
      }
      ctx.stroke()
    } else if (p.kind === "text") {
      ctx.font = fontString("Inter", p.size, p.weight ?? 400)
      ctx.fillStyle = p.color
      ctx.textAlign = p.align
      ctx.textBaseline = "alphabetic"
      ctx.fillText(p.text, p.x, p.y)
    } else if (p.kind === "hline") {
      ctx.strokeStyle = p.stroke
      ctx.lineWidth = 1
      ctx.setLineDash(p.dash ?? [])
      ctx.beginPath()
      ctx.moveTo(p.x1, p.y)
      ctx.lineTo(p.x2, p.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}

function drawTable(ctx: CanvasRenderingContext2D, el: TableElement): void {
  const rows = el.rows
  if (rows.length === 0) return
  const cols = Math.max(...rows.map((r) => r.length))
  const colW = el.width / cols
  const rowH = el.height / rows.length
  ctx.font = fontString(el.fontFamily, el.fontSize, el.headerRow ? 600 : 400)
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const x = ci * colW
      const y = ri * rowH
      let bg = el.rowBg
      if (el.headerRow && ri === 0) bg = el.headerBg
      else if (ri % 2 === 1) bg = el.altRowBg
      ctx.fillStyle = bg
      ctx.fillRect(x, y, colW, rowH)
      ctx.strokeStyle = el.borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, colW - 1, rowH - 1)
      ctx.fillStyle = el.headerRow && ri === 0 ? el.headerColor : el.color
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      const maxW = colW - 16
      let text = cell ?? ""
      while (text.length > 1 && ctx.measureText(text).width > maxW) text = text.slice(0, -2) + "…"
      ctx.fillText(text, x + 8, y + rowH / 2 + 1, maxW)
    })
  })
}

async function drawQr(ctx: CanvasRenderingContext2D, el: QrElement): Promise<void> {
  try {
    const url = await qrDataUrl(el.data, el.fg, el.bg)
    const img = await loadImage(url)
    if (img) {
      ctx.drawImage(img, 0, 0, el.width, el.height)
      return
    }
  } catch {
    /* fall through to placeholder */
  }
  drawPlaceholder(ctx, el.width, el.height)
}

function drawFrame(ctx: CanvasRenderingContext2D, el: FrameElement): void {
  const path = new Path2D(roundedRectPath(el.width, el.height, el.cornerRadius))
  if (el.fill && el.fill !== "transparent") {
    ctx.fillStyle = el.fill
    ctx.fill(path)
  }
  if (el.stroke && el.stroke !== "transparent" && el.strokeWidth > 0) {
    ctx.strokeStyle = el.stroke
    ctx.lineWidth = el.strokeWidth
    ctx.setLineDash([10, 7])
    ctx.stroke(path)
    ctx.setLineDash([])
  }
  if (el.label) {
    ctx.font = fontString("Inter", Math.max(14, Math.min(24, el.width / 12)), 500)
    ctx.fillStyle = "rgba(60,60,70,0.75)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(el.label, el.width / 2, el.height / 2, el.width - 24)
  }
}

function drawSticky(ctx: CanvasRenderingContext2D, el: StickyElement): void {
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.18)"
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  ctx.fillStyle = el.color
  roundRectOn(ctx, 0, 0, el.width, el.height, 6)
  ctx.fill()
  ctx.restore()
  const pad = 14
  const lines = textVisualLines(
    { text: el.text, fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: 400, italic: false, uppercase: false, lineHeight: 1.3, letterSpacing: 0 },
    el.width,
    pad,
  )
  ctx.font = fontString(el.fontFamily, el.fontSize, 400)
  ctx.fillStyle = "#1f2937"
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  lines.forEach((line, i) => {
    ctx.fillText(line, pad, pad + i * el.fontSize * 1.3 + el.fontSize * 0.85, el.width - pad * 2)
  })
}

function drawFreehand(ctx: CanvasRenderingContext2D, el: FreehandElement): void {
  if (el.points.length < 4) return
  ctx.translate(-el.x, -el.y)
  ctx.strokeStyle = el.stroke
  ctx.lineWidth = el.strokeWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  if (el.erase) {
    ctx.globalCompositeOperation = "destination-out"
  }
  ctx.beginPath()
  ctx.moveTo(el.points[0], el.points[1])
  for (let i = 2; i < el.points.length; i += 2) ctx.lineTo(el.points[i], el.points[i + 1])
  ctx.stroke()
}

function drawConnector(ctx: CanvasRenderingContext2D, el: ConnectorElement): void {
  const pts = el.points && el.points.length >= 4 ? el.points : [0, 0, el.width, el.height]
  ctx.translate(-el.x, -el.y)
  ctx.strokeStyle = el.stroke
  ctx.lineWidth = el.strokeWidth
  ctx.lineCap = "round"
  ctx.setLineDash(el.dash ?? [])
  ctx.beginPath()
  ctx.moveTo(pts[0], pts[1])
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1])
  ctx.stroke()
  ctx.setLineDash([])
  if (el.arrowHead === "arrow") {
    const n = pts.length
    const head = arrowHeadPoints(pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1], Math.max(10, el.strokeWidth * 3.4))
    ctx.fillStyle = el.stroke
    ctx.beginPath()
    ctx.moveTo(head[0].x, head[0].y)
    ctx.lineTo(head[1].x, head[1].y)
    ctx.lineTo(head[2].x, head[2].y)
    ctx.closePath()
    ctx.fill()
  }
  if (el.label) {
    const mx = (pts[0] + pts[pts.length - 2]) / 2
    const my = (pts[1] + pts[pts.length - 1]) / 2
    ctx.font = fontString("Inter", 14, 500)
    ctx.fillStyle = el.stroke
    ctx.textAlign = "center"
    ctx.fillText(el.label, mx, my - 8)
  }
}

function drawMediaPlaceholder(ctx: CanvasRenderingContext2D, el: DesignElement): void {
  ctx.fillStyle = "rgba(120,120,140,0.18)"
  roundRectOn(ctx, 0, 0, el.width, el.height, 12)
  ctx.fill()
  ctx.fillStyle = "#6b7280"
  ctx.font = fontString("Inter", 16, 600)
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(el.type === "media" ? "Media clip" : "Unsupported", el.width / 2, el.height / 2)
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

/** Render one page (or any subset) to an offscreen canvas. */
export async function renderPageToCanvas(doc: DesignDoc, page: PageModel, opts: RenderOpts = {}): Promise<HTMLCanvasElement> {
  let scale = opts.scale ?? 1
  if (opts.maxSide) {
    scale = Math.min(scale, opts.maxSide / Math.max(doc.width, doc.height))
  }
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(doc.width * scale))
  canvas.height = Math.max(1, Math.round(doc.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D not available in this browser")
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    /* older browsers */
  }
  ctx.scale(canvas.width / doc.width, canvas.height / doc.height)
  if (!opts.transparent) {
    if (page.background.type === "image" && page.background.imageUrl) {
      const img = await loadImage(page.background.imageUrl)
      if (img) {
        // cover-fit
        const ratio = Math.max(doc.width / img.naturalWidth, doc.height / img.naturalHeight)
        const dw = img.naturalWidth * ratio
        const dh = img.naturalHeight * ratio
        ctx.drawImage(img, (doc.width - dw) / 2, (doc.height - dh) / 2, dw, dh)
      } else {
        paintBackground(ctx, { type: "solid", color: "#ffffff" }, doc.width, doc.height)
      }
    } else if (page.background.type === "transparent") {
      /* leave transparent */
    } else {
      paintBackground(ctx, page.background, doc.width, doc.height)
    }
  }
  for (const el of page.elements) {
    await drawElement(ctx, el)
  }
  return canvas
}

export async function renderPageThumbnail(doc: DesignDoc, page: PageModel, width = 320): Promise<string> {
  const canvas = await renderPageToCanvas(doc, page, { scale: width / doc.width })
  return canvas.toDataURL("image/jpeg", 0.72)
}

/* ------------------------------ SVG builder ------------------------------ */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

async function rasterizeElement(doc: DesignDoc, el: DesignElement): Promise<string | null> {
  const tmpDoc: DesignDoc = { ...doc, pages: [{ ...doc.pages[0], background: { type: "transparent" }, elements: [el] }] }
  const canvas = await renderPageToCanvas(tmpDoc, tmpDoc.pages[0], { transparent: true, scale: 2 })
  return canvas.toDataURL("image/png")
}

/** Build a real SVG document for a page. Non-vectorizable elements are rasterized and embedded. */
export async function buildPageSvg(doc: DesignDoc, page: PageModel, scale = 1): Promise<{ svg: string; notes: string[] }> {
  const notes: string[] = []
  const W = doc.width
  const H = doc.height
  const out: string[] = []
  const defs: string[] = []

  // background
  const bg = page.background
  if (bg.type === "solid" && bg.color) {
    out.push(`<rect width="${W}" height="${H}" fill="${bg.color}"/>`)
  } else if (bg.type === "gradient" && bg.gradient) {
    const ep = gradientEndpoints(bg.gradient.angle, W, H)
    defs.push(`<linearGradient id="bgGrad" x1="${ep.x0}" y1="${ep.y0}" x2="${ep.x1}" y2="${ep.y1}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${bg.gradient.from}"/><stop offset="1" stop-color="${bg.gradient.to}"/></linearGradient>`)
    out.push(`<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>`)
  } else if (bg.type === "image" && bg.imageUrl) {
    const data = await toDataUrl(bg.imageUrl)
    if (data) out.push(`<image href="${data}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`)
    else notes.push("Background image could not be embedded (cross-origin).")
  }

  for (const el of page.elements) {
    if (el.hidden || el.type === "group") continue
    const op = el.opacity !== 1 ? ` opacity="${el.opacity}"` : ""
    const rot = el.rotation ? ` transform="rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})"` : ""
    const gOpen = `<g${op}>`
    switch (el.type) {
      case "shape": {
        const s = el
        if (s.variant === "line" || s.variant === "arrow") {
          const { x1, y1, x2, y2 } = lineGeometry(s.width, s.height)
          const color = s.fill === "transparent" ? s.stroke : s.fill
          const dash = s.dash ? ` stroke-dasharray="${s.dash.join(" ")}"` : ""
          out.push(`${gOpen}<line x1="${s.x + x1}" y1="${s.y + y1}" x2="${s.x + x2}" y2="${s.y + y2}" stroke="${color}" stroke-width="${Math.max(1, s.strokeWidth || 3)}" stroke-linecap="round"${dash}${rot}/></g>`)
          if (s.variant === "arrow" && s.arrowHead !== "none") {
            const head = arrowHeadPoints(s.x + x1, s.y + y1, s.x + x2, s.y + y2, Math.max(10, (s.strokeWidth || 3) * 3.4))
            out.push(`<g${op}><polygon points="${head.map((p) => `${p.x},${p.y}`).join(" ")}" fill="${color}"${rot}/></g>`)
          }
        } else {
          const d = shapePathData(s.variant, s.width, s.height, s.cornerRadius)
          const dash = s.dash ? ` stroke-dasharray="${s.dash.join(" ")}"` : ""
          out.push(`${gOpen}<path d="${d}" transform="translate(${s.x} ${s.y})${el.rotation ? ` rotate(${el.rotation} ${s.width / 2} ${s.height / 2})` : ""}" fill="${s.fill === "transparent" ? "none" : s.fill}" stroke="${s.stroke === "transparent" ? "none" : s.stroke}" stroke-width="${s.strokeWidth}" stroke-linejoin="round"${dash}/></g>`)
        }
        break
      }
      case "text": {
        const t = el
        const pad = 2
        const lines = textVisualLines(
          { text: t.text, fontFamily: t.fontFamily, fontSize: t.fontSize, fontWeight: t.fontWeight, italic: t.italic, uppercase: t.uppercase, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, listStyle: t.listStyle },
          t.width,
          pad,
        )
        const lh = t.fontSize * t.lineHeight
        const blockH = lines.length * lh
        let offsetY = 0
        if (t.vAlign === "middle") offsetY = Math.max(0, (t.height - blockH) / 2)
        else if (t.vAlign === "bottom") offsetY = Math.max(0, t.height - blockH)
        const anchor = t.align === "center" ? "middle" : t.align === "right" ? "end" : "start"
        const ax = t.align === "center" ? t.x + t.width / 2 : t.align === "right" ? t.x + t.width : t.x
        const shadow = t.shadow ? ` filter="drop-shadow(${t.shadow.offsetX}px ${t.shadow.offsetY}px ${t.shadow.blur}px ${t.shadow.color})"` : ""
        const tspans = lines
          .map((line, i) => `<tspan x="${ax}" y="${round2(t.y + offsetY + i * lh + t.fontSize * 0.82 + pad)}">${esc(line)}</tspan>`)
          .join("")
        out.push(
          `<text font-family="${esc(t.fontFamily)}" font-size="${t.fontSize}" font-weight="${t.fontWeight}"${t.italic ? ' font-style="italic"' : ""} fill="${t.color}" text-anchor="${anchor}" letter-spacing="${t.letterSpacing}"${shadow}${rot}>${tspans}</text>`,
        )
        break
      }
      case "image": {
        const img = el
        const data = await toDataUrl(img.src)
        if (data) {
          const clipId = `clip_${img.id}`
          if (img.cornerRadius > 0) {
            defs.push(`<clipPath id="${clipId}"><rect x="${img.x}" y="${img.y}" width="${img.width}" height="${img.height}" rx="${img.cornerRadius}"/></clipPath>`)
          }
          const filter = img.filters && filtersToCss(img) !== "none" ? ` style="filter:${filtersToCss(img)}"` : ""
          const clip = img.cornerRadius > 0 ? ` clip-path="url(#${clipId})"` : ""
          const flip = img.flipH || img.flipV ? ` transform="translate(${img.x + (img.flipH ? img.width : 0)} ${img.y + (img.flipV ? img.height : 0)}) scale(${img.flipH ? -1 : 1} ${img.flipV ? -1 : 1})"` : ` transform="translate(${img.x} ${img.y})"`
          out.push(`<image href="${data}" x="${img.flipH ? 0 : 0}" y="0" width="${img.width}" height="${img.height}" preserveAspectRatio="none"${clip}${filter}${flip}${op}/>`)
        } else {
          notes.push(`Image "${img.name || img.id}" skipped (cross-origin fetch blocked).`)
        }
        break
      }
      case "icon": {
        const icon = el
        const svgStr = iconToSvg(icon.icon, icon.color, 24)
        const s = Math.min(icon.width, icon.height) / 24
        if (svgStr) {
          const inner = svgStr.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")
          out.push(`<g transform="translate(${icon.x} ${icon.y}) scale(${s})"${op}>${inner}</g>`)
        }
        break
      }
      case "sticky": {
        const st = el
        out.push(`${gOpen}<rect x="${st.x}" y="${st.y}" width="${st.width}" height="${st.height}" rx="6" fill="${st.color}"${rot}/></g>`)
        const lines = textVisualLines({ text: st.text, fontFamily: st.fontFamily, fontSize: st.fontSize, fontWeight: 400, italic: false, uppercase: false, lineHeight: 1.3, letterSpacing: 0 }, st.width, 14)
        const tspans = lines.map((line, i) => `<tspan x="${st.x + 14}" y="${round2(st.y + 14 + i * st.fontSize * 1.3 + st.fontSize * 0.85)}">${esc(line)}</tspan>`).join("")
        out.push(`<text font-family="${esc(st.fontFamily)}" font-size="${st.fontSize}" fill="#1f2937">${tspans}</text>`)
        break
      }
      case "frame": {
        const f = el
        out.push(`${gOpen}<rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="${f.cornerRadius}" fill="${f.fill}" stroke="${f.stroke}" stroke-width="${f.strokeWidth}" stroke-dasharray="10 7"${rot}/></g>`)
        if (f.label) {
          out.push(`<text x="${f.x + f.width / 2}" y="${f.y + f.height / 2}" font-family="Inter" font-size="16" fill="rgba(60,60,70,0.75)" text-anchor="middle" dominant-baseline="middle">${esc(f.label)}</text>`)
        }
        break
      }
      case "table": {
        const tb = el
        const cols = Math.max(...tb.rows.map((r) => r.length), 1)
        const colW = tb.width / cols
        const rowH = tb.height / Math.max(1, tb.rows.length)
        tb.rows.forEach((row, ri) => {
          row.forEach((cell, ci) => {
            const x = tb.x + ci * colW
            const y = tb.y + ri * rowH
            let fill = tb.rowBg
            if (tb.headerRow && ri === 0) fill = tb.headerBg
            else if (ri % 2 === 1) fill = tb.altRowBg
            out.push(`<rect x="${round2(x)}" y="${round2(y)}" width="${round2(colW)}" height="${round2(rowH)}" fill="${fill}" stroke="${tb.borderColor}"/>`)
            const color = tb.headerRow && ri === 0 ? tb.headerColor : tb.color
            out.push(`<text x="${round2(x + 8)}" y="${round2(y + rowH / 2)}" font-family="${esc(tb.fontFamily)}" font-size="${tb.fontSize}" fill="${color}" dominant-baseline="middle">${esc(cell ?? "")}</text>`)
          })
        })
        break
      }
      case "freehand": {
        const fh = el
        const pts: string[] = []
        for (let i = 0; i < fh.points.length; i += 2) pts.push(`${round2(fh.points[i])},${round2(fh.points[i + 1])}`)
        out.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="${fh.stroke}" stroke-width="${fh.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${op}/>`)
        break
      }
      case "connector": {
        const cn = el
        const pts = cn.points && cn.points.length >= 4 ? cn.points : [cn.x, cn.y, cn.x + cn.width, cn.y + cn.height]
        const dash = cn.dash ? ` stroke-dasharray="${cn.dash.join(" ")}"` : ""
        const pstr: string[] = []
        for (let i = 0; i < pts.length; i += 2) pstr.push(`${round2(pts[i])},${round2(pts[i + 1])}`)
        out.push(`<polyline points="${pstr.join(" ")}" fill="none" stroke="${cn.stroke}" stroke-width="${cn.strokeWidth}" stroke-linecap="round"${dash}${op}/>`)
        if (cn.arrowHead === "arrow") {
          const head = arrowHeadPoints(pts[pts.length - 4], pts[pts.length - 3], pts[pts.length - 2], pts[pts.length - 1], Math.max(10, cn.strokeWidth * 3.4))
          out.push(`<polygon points="${head.map((p) => `${p.x},${p.y}`).join(" ")}" fill="${cn.stroke}"${op}/>`)
        }
        break
      }
      default: {
        // chart / qr / media — rasterize just this element
        const data = await rasterizeElement(doc, el)
        if (data) {
          out.push(`<image href="${data}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"${rot}${op}/>`)
        } else {
          notes.push(`Element "${el.name || el.id}" could not be exported.`)
        }
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${round2(W * scale)}" height="${round2(H * scale)}" viewBox="0 0 ${W} ${H}"><defs>${defs.join("")}</defs>${out.join("\n")}</svg>`
  return { svg, notes }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

/* ------------------------------ format exports ------------------------------ */

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",")
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/png"
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

async function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas encode failed"))), mime, quality)
  })
}

function sanitizeName(base: string): string {
  return (base || "design").replace(/[^\w\-. ]+/g, "_").slice(0, 60)
}

function pagesFor(req: ExportRequest, doc: DesignDoc): PageModel[] {
  if (req.pages && req.pages.length > 0) return req.pages.map((i) => doc.pages[i]).filter(Boolean)
  return doc.pages
}

/** Main entry — export a document in the requested format. */
export async function exportDoc(doc: DesignDoc, req: ExportRequest): Promise<ExportResult[]> {
  const base = sanitizeName(req.filenameBase || "design")
  const scale = Math.max(0.1, Math.min(3, req.scale ?? 1))
  const results: ExportResult[] = []

  if (req.format === "json") {
    results.push({
      filename: `${base}.studio.json`,
      blob: new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }),
    })
    return results
  }

  if (req.format === "svg") {
    const pages = pagesFor(req, doc)
    const notes: string[] = []
    if (pages.length === 1) {
      const { svg, notes: n } = await buildPageSvg(doc, pages[0])
      notes.push(...n)
      results.push({
        filename: `${base}.svg`,
        blob: new Blob([svg], { type: "image/svg+xml" }),
        note: n.length > 0 ? `SVG exported. ${n[0]}` : "SVG exported with vector text and shapes.",
      })
    } else {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      for (let i = 0; i < pages.length; i += 1) {
        const { svg } = await buildPageSvg(doc, pages[i])
        zip.file(`${base}-page-${i + 1}.svg`, svg)
      }
      results.push({
        filename: `${base}-svg.zip`,
        blob: await zip.generateAsync({ type: "blob" }),
        note: `${pages.length} SVG files zipped.`,
      })
    }
    return results
  }

  if (req.format === "pdf") {
    const { jsPDF } = await import("jspdf")
    const pages = pagesFor(req, doc)
    if (pages.length === 0) return results
    let pdf: import("jspdf").jsPDF | null = null
    for (let i = 0; i < pages.length; i += 1) {
      const p = pages[i]
      const canvas = await renderPageToCanvas(doc, p, { scale: Math.min(2, Math.max(1, scale)) })
      const orientation = doc.width >= doc.height ? "landscape" : "portrait"
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: "px", format: [doc.width, doc.height], compress: true })
      } else {
        pdf.addPage([doc.width, doc.height], orientation)
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
      pdf.addImage(dataUrl, "JPEG", 0, 0, doc.width, doc.height)
    }
    if (pdf) {
      results.push({ filename: `${base}.pdf`, blob: pdf.output("blob"), note: `${pages.length} page(s) exported to PDF.` })
    }
    return results
  }

  if (req.format === "zip") {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    const pages = pagesFor(req, doc)
    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await renderPageToCanvas(doc, pages[i], { scale })
      const blob = await canvasToBlob(canvas, "image/png")
      zip.file(`${base}-page-${i + 1}.png`, blob)
    }
    zip.file("project.json", JSON.stringify(doc, null, 2))
    zip.file(
      "README.txt",
      [
        `Studio export — ${base}`,
        `Pages: ${pages.length}`,
        `Size: ${doc.width}×${doc.height}px`,
        "",
        "page-N.png  — flattened page images",
        "project.json — editable Studio project file (re-import via dashboard → Import)",
      ].join("\n"),
    )
    results.push({ filename: `${base}-pages.zip`, blob: await zip.generateAsync({ type: "blob" }), note: `${pages.length} PNG page(s) + project file zipped.` })
    return results
  }

  // raster formats: png / jpeg / webp
  const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
  const pages = pagesFor(req, doc)
  for (let i = 0; i < pages.length; i += 1) {
    const canvas = await renderPageToCanvas(doc, pages[i], {
      scale,
      transparent: req.transparent === true && (req.format === "png" || req.format === "webp"),
    })
    const quality = req.quality ?? 0.92
    const blob = await canvasToBlob(canvas, mime, quality)
    const suffix = pages.length > 1 ? `-page-${i + 1}` : ""
    const ext = req.format === "jpeg" ? "jpg" : req.format
    results.push({ filename: `${base}${suffix}.${ext}`, blob })
  }
  if (pages.length > 1) results[0].note = `${pages.length} files exported.`
  return results
}

/** Small JPEG thumbnail of the current page, guaranteed ≤ ~64KB. */
export async function getThumbnail(doc: DesignDoc, page: PageModel): Promise<string | null> {
  try {
    const canvas = await renderPageToCanvas(doc, page, { maxSide: 480 })
    for (const q of [0.72, 0.55, 0.4, 0.28]) {
      const url = canvas.toDataURL("image/jpeg", q)
      if (url.length <= 64 * 1024 * 1.34) return url // base64 ≈ +34% vs bytes
    }
    const small = document.createElement("canvas")
    small.width = 320
    small.height = Math.max(1, Math.round((320 * doc.height) / doc.width))
    small.getContext("2d")?.drawImage(canvas, 0, 0, small.width, small.height)
    return small.toDataURL("image/jpeg", 0.4)
  } catch {
    return null
  }
}
