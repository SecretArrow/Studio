/**
 * Pure geometry helpers shared by the Konva stage renderer and the
 * headless export renderer (canvas 2D / SVG). No React, no DOM side effects
 * except an offscreen measuring context created lazily.
 */

import type { ShapeVariant } from "@/lib/design/types"

const TAU = Math.PI * 2

export interface Pt {
  x: number
  y: number
}

/* ------------------------------ polygons ------------------------------ */

export function polygonPoints(n: number, w: number, h: number, startAngleDeg = -90): Pt[] {
  const pts: Pt[] = []
  const cx = w / 2
  const cy = h / 2
  const start = (startAngleDeg * Math.PI) / 180
  for (let i = 0; i < n; i += 1) {
    const a = start + (i * TAU) / n
    pts.push({ x: cx + (w / 2) * Math.cos(a), y: cy + (h / 2) * Math.sin(a) })
  }
  return pts
}

export function starPoints(points: number, w: number, h: number, innerRatio = 0.5, startAngleDeg = -90): Pt[] {
  const cx = w / 2
  const cy = h / 2
  const start = (startAngleDeg * Math.PI) / 180
  const pts: Pt[] = []
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? 1 : innerRatio
    const a = start + (i * Math.PI) / points
    pts.push({ x: cx + (w / 2) * r * Math.cos(a), y: cy + (h / 2) * r * Math.sin(a) })
  }
  return pts
}

function ptsToPath(pts: Pt[], close = true): string {
  if (pts.length === 0) return ""
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ")
  return close ? `${d} Z` : d
}

function round(v: number): number {
  return Math.round(v * 100) / 100
}

/* --------------------------- rounded rectangle --------------------------- */

export function roundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  if (rr <= 0.01) return `M0 0H${round(w)}V${round(h)}H0Z`
  return [
    `M${round(rr)} 0`,
    `H${round(w - rr)}`,
    `A${round(rr)} ${round(rr)} 0 0 1 ${round(w)} ${round(rr)}`,
    `V${round(h - rr)}`,
    `A${round(rr)} ${round(rr)} 0 0 1 ${round(w - rr)} ${round(h)}`,
    `H${round(rr)}`,
    `A${round(rr)} ${round(rr)} 0 0 1 0 ${round(h - rr)}`,
    `V${round(rr)}`,
    `A${round(rr)} ${round(rr)} 0 0 1 ${round(rr)} 0`,
    "Z",
  ].join("")
}

/* ------------------------------- blob / heart ------------------------------- */

function blobPath(w: number, h: number): string {
  const f = (a: number, b: number) => `${round(a * w)} ${round(b * h)}`
  return [
    `M${f(0.23, 0.16)}`,
    `C${f(0.35, 0.06)} ${f(0.54, 0.04)} ${f(0.69, 0.11)}`,
    `C${f(0.84, 0.18)} ${f(0.95, 0.34)} ${f(0.92, 0.5)}`,
    `C${f(0.89, 0.66)} ${f(0.74, 0.81)} ${f(0.56, 0.85)}`,
    `C${f(0.38, 0.89)} ${f(0.17, 0.81)} ${f(0.1, 0.65)}`,
    `C${f(0.03, 0.49)} ${f(0.11, 0.26)} ${f(0.23, 0.16)} Z`,
  ].join(" ")
}

function heartPath(w: number, h: number): string {
  const f = (a: number, b: number) => `${round(a * w)} ${round(b * h)}`
  return [
    `M${f(0.5, 0.94)}`,
    `C${f(0.28, 0.78)} ${f(0.02, 0.55)} ${f(0.01, 0.32)}`,
    `C${f(0.01, 0.13)} ${f(0.14, 0.01)} ${f(0.3, 0.01)}`,
    `C${f(0.39, 0.01)} ${f(0.46, 0.06)} ${f(0.5, 0.14)}`,
    `C${f(0.54, 0.06)} ${f(0.61, 0.01)} ${f(0.7, 0.01)}`,
    `C${f(0.86, 0.01)} ${f(0.99, 0.13)} ${f(0.99, 0.32)}`,
    `C${f(0.98, 0.55)} ${f(0.72, 0.78)} ${f(0.5, 0.94)} Z`,
  ].join(" ")
}

/* ------------------------- sector (pie / doughnut) ------------------------- */

function polar(cx: number, cy: number, r: number, a: number): Pt {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/** SVG path for an annular sector. a0/a1 in radians, clockwise. */
export function sectorPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const p0 = polar(cx, cy, rOuter, a0)
  const p1 = polar(cx, cy, rOuter, a1)
  if (rInner <= 0.01) {
    return [
      `M${round(cx)} ${round(cy)}`,
      `L${round(p0.x)} ${round(p0.y)}`,
      `A${round(rOuter)} ${round(rOuter)} 0 ${large} 1 ${round(p1.x)} ${round(p1.y)}`,
      "Z",
    ].join(" ")
  }
  const p2 = polar(cx, cy, rInner, a1)
  const p3 = polar(cx, cy, rInner, a0)
  return [
    `M${round(p0.x)} ${round(p0.y)}`,
    `A${round(rOuter)} ${round(rOuter)} 0 ${large} 1 ${round(p1.x)} ${round(p1.y)}`,
    `L${round(p2.x)} ${round(p2.y)}`,
    `A${round(rInner)} ${round(rInner)} 0 ${large} 0 ${round(p3.x)} ${round(p3.y)}`,
    "Z",
  ].join(" ")
}

/* ------------------------------ shape path data ------------------------------ */

/**
 * SVG path `d` for a shape variant drawn inside the 0..w × 0..h local box.
 * Used identically by Konva <Path data> and the canvas renderer (Path2D).
 */
export function shapePathData(variant: ShapeVariant, w: number, h: number, cornerRadius = 0): string {
  switch (variant) {
    case "rect":
      return roundedRectPath(w, h, cornerRadius)
    case "ellipse": {
      const rx = w / 2
      const ry = h / 2
      return `M0 ${round(ry)}A${round(rx)} ${round(ry)} 0 0 1 ${round(w)} ${round(ry)}A${round(rx)} ${round(ry)} 0 0 1 0 ${round(ry)}Z`
    }
    case "triangle":
      return ptsToPath(polygonPoints(3, w, h))
    case "diamond":
      return ptsToPath(polygonPoints(4, w, h))
    case "pentagon":
      return ptsToPath(polygonPoints(5, w, h))
    case "hexagon":
      return ptsToPath(polygonPoints(6, w, h))
    case "star":
      return ptsToPath(starPoints(5, w, h))
    case "badge":
      return ptsToPath(starPoints(14, w, h, 0.86))
    case "heart":
      return heartPath(w, h)
    case "blob":
      return blobPath(w, h)
    case "line":
    case "arrow":
      // drawn with dedicated Line/Arrow primitives, fallback to a thin rect
      return roundedRectPath(w, Math.max(2, h * 0.08), 2)
    default:
      return roundedRectPath(w, h, cornerRadius)
  }
}

/** Points for line/arrow elements in local element coordinates. */
export function lineGeometry(w: number, h: number): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: 0, y1: h / 2, x2: w, y2: h / 2 }
}

/* ------------------------------ text utilities ------------------------------ */

let measureCtx: CanvasRenderingContext2D | null = null
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null
  if (!measureCtx) {
    const c = document.createElement("canvas")
    c.width = 8
    c.height = 8
    measureCtx = c.getContext("2d")
  }
  return measureCtx
}

export function fontString(fontFamily: string, fontSize: number, fontWeight: number, italic?: boolean): string {
  const family = fontFamily.includes(" ") ? `"${fontFamily}"` : fontFamily
  return `${italic ? "italic " : ""}${fontWeight} ${fontSize}px ${family}`
}

/** Greedy word wrap using a 2D canvas measure function. */
export function wrapLines(text: string, maxWidth: number, measure: (line: string) => number): string[] {
  const out: string[] = []
  const paragraphs = text.split("\n")
  for (const para of paragraphs) {
    if (para === "") {
      out.push("")
      continue
    }
    const words = para.split(/(\s+)/)
    let line = ""
    for (const word of words) {
      const candidate = line + word
      if (line !== "" && measure(candidate.trimEnd()) > maxWidth && line.trim() !== "") {
        out.push(line.trimEnd())
        line = word.trimStart()
      } else {
        line = candidate
      }
    }
    if (line.trim() !== "" || out.length === 0) out.push(line.trimEnd())
  }
  return out
}

export interface TextLikeProps {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  uppercase: boolean
  lineHeight: number
  letterSpacing: number
  listStyle?: "none" | "bullet" | "number"
}

/** Compute the wrapped visual lines for a text-like element. */
export function textVisualLines(props: TextLikeProps, width: number, padding = 0): string[] {
  const measureCtx2 = getMeasureCtx()
  const text = props.uppercase ? props.text.toUpperCase() : props.text
  const maxWidth = Math.max(8, width - padding * 2)
  if (!measureCtx2) return text.split("\n")
  const indent = props.listStyle && props.listStyle !== "none" ? props.fontSize * 0.9 : 0
  measureCtx2.font = fontString(props.fontFamily, props.fontSize, props.fontWeight, props.italic)
  try {
    ;(measureCtx2 as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${props.letterSpacing}px`
  } catch {
    /* letterSpacing unsupported — approximate without it */
  }
  const wrapped = wrapLines(text, maxWidth - indent, (s) => measureCtx2!.measureText(s).width)
  return wrapped
}

/** Height (in doc px) a text-like element needs to fully show its content. */
export function measureTextBlockHeight(props: TextLikeProps, width: number, padding = 0): number {
  const lines = textVisualLines(props, width, padding)
  return Math.max(props.fontSize * props.lineHeight, lines.length * props.fontSize * props.lineHeight + padding * 2)
}

/* ------------------------------ misc helpers ------------------------------ */

/** Gradient endpoints across a w×h box for a CSS-style angle (0° = left→right). */
export function gradientEndpoints(angleDeg: number, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } {
  const a = (angleDeg * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const len = Math.abs(dx) * w + Math.abs(dy) * h
  const cx = w / 2
  const cy = h / 2
  return {
    x0: cx - (dx * len) / 2,
    y0: cy - (dy * len) / 2,
    x1: cx + (dx * len) / 2,
    y1: cy + (dy * len) / 2,
  }
}

/** Arrowhead polygon (in doc coords) for a line from (x1,y1)→(x2,y2). */
export function arrowHeadPoints(x1: number, y1: number, x2: number, y2: number, size: number): Pt[] {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const wing = 0.45
  return [
    { x: x2, y: y2 },
    { x: x2 - size * Math.cos(a - wing), y: y2 - size * Math.sin(a - wing) },
    { x: x2 - size * Math.cos(a + wing), y: y2 - size * Math.sin(a + wing) },
  ]
}
