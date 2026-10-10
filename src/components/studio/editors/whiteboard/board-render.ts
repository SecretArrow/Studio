/**
 * Whiteboard — pure helpers shared by the board editor modules.
 *
 * Everything here is side-effect free so it can be unit reasoned about and
 * reused by both the interactive stage (Konva) and the export pipeline
 * (headless canvas via src/lib/editor/export.ts).
 */

import type {
  ConnectorElement,
  DesignDoc,
  DesignElement,
  FreehandElement,
  PageModel,
  ShapeVariant,
} from "@/lib/design/types"

/* ------------------------------ shared types ------------------------------ */

export interface BoardView {
  zoom: number
  panX: number
  panY: number
}

export type BoardTool = "select" | "pen" | "eraser" | "sticky" | "shape" | "line" | "arrow" | "text" | "connector" | "frame"

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export const MIN_ZOOM = 0.04
export const MAX_ZOOM = 8

export const STICKY_COLORS = ["#fde68a", "#bbf7d0", "#fbcfe8", "#fed7aa", "#e9d5ff", "#d9f99d"] as const

export const PEN_COLORS = ["#111827", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"] as const

export const PEN_WIDTHS = [2, 4, 8, 14] as const

export const FRAME_DEFAULTS = {
  fill: "rgba(139,92,246,0.05)",
  stroke: "#8b5cf6",
  strokeWidth: 2,
  cornerRadius: 12,
}

export function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}

/* ------------------------------ votes (name convention) ------------------------------ */
/**
 * Vote counts are stored on the sticky's `name` field using the " votes:N"
 * suffix convention, so they survive round-trips without schema changes.
 */
export function voteCountOf(el: DesignElement): number {
  const m = /votes:(\d+)/.exec(el.name ?? "")
  return m ? Math.max(0, parseInt(m[1], 10) || 0) : 0
}

export function withVoteDelta(el: DesignElement, delta: number): string | undefined {
  const base = (el.name ?? "").replace(/\s*votes:\d+/, "").trim()
  const next = Math.max(0, voteCountOf(el) + delta)
  const label = `${base ? base + " " : ""}votes:${next}`
  return label.trim() === "" ? undefined : label
}

/* ------------------------------ freehand ------------------------------ */

/** Drop points closer than `minDist` to their predecessor (doc px). */
function simplify(raw: number[], minDist = 1.5): number[] {
  if (raw.length < 4) return raw.slice()
  const out: number[] = [raw[0], raw[1]]
  for (let i = 2; i < raw.length; i += 2) {
    const dx = raw[i] - out[out.length - 2]
    const dy = raw[i + 1] - out[out.length - 1]
    if (dx * dx + dy * dy >= minDist * minDist) out.push(raw[i], raw[i + 1])
  }
  return out
}

/**
 * Pressure-ish smoothing: upsample the raw stroke by sampling the quadratic
 * Bézier chain built through segment midpoints (control = original vertex).
 * The stored points stay a plain polyline so the Konva stage AND the headless
 * export renderer draw identical smooth strokes.
 */
export function smoothFreehand(raw: number[]): number[] {
  const pts = simplify(raw)
  if (pts.length < 5) return pts
  const mids: number[] = []
  for (let i = 0; i < pts.length - 2; i += 2) {
    mids.push((pts[i] + pts[i + 2]) / 2, (pts[i + 1] + pts[i + 3]) / 2)
  }
  const out: number[] = [pts[0], pts[1]]
  const STEPS = 5
  for (let m = 0; m < mids.length - 2; m += 2) {
    const x0 = mids[m]
    const y0 = mids[m + 1]
    const cx = pts[m + 2]
    const cy = pts[m + 3]
    const x1 = mids[m + 2]
    const y1 = mids[m + 3]
    for (let s = 1; s <= STEPS; s += 1) {
      const t = s / STEPS
      const it = 1 - t
      out.push(it * it * x0 + 2 * it * t * cx + t * t * x1, it * it * y0 + 2 * it * t * cy + t * t * y1)
    }
  }
  out.push(pts[pts.length - 2], pts[pts.length - 1])
  return out
}

export function freehandBounds(points: number[]): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    if (points[i] < minX) minX = points[i]
    if (points[i] > maxX) maxX = points[i]
    if (points[i + 1] < minY) minY = points[i + 1]
    if (points[i + 1] > maxY) maxY = points[i + 1]
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 1, height: 1 }
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}

/** Squared distance from point p to segment ab. */
function segDist2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = Math.max(0, Math.min(1, t))
  const qx = ax + t * dx - px
  const qy = ay + t * dy - py
  return qx * qx + qy * qy
}

/** Freehand strokes whose path passes within `radius` of the given doc point. */
export function freehandHits(elements: DesignElement[], x: number, y: number, radius: number): string[] {
  const hits: string[] = []
  for (const el of elements) {
    if (el.type !== "freehand" || el.hidden) continue
    const fh = el as FreehandElement
    const r = radius + fh.strokeWidth / 2
    const r2 = r * r
    for (let i = 0; i + 3 < fh.points.length; i += 2) {
      if (segDist2(x, y, fh.points[i], fh.points[i + 1], fh.points[i + 2], fh.points[i + 3]) <= r2) {
        hits.push(el.id)
        break
      }
    }
  }
  return hits
}

/* ------------------------------ connectors ------------------------------ */

/** Best edge anchor on `bounds` facing towards point `t`. */
export function anchorOnBounds(b: Bounds, t: { x: number; y: number }): { x: number; y: number } {
  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  const dx = t.x - cx
  const dy = t.y - cy
  const hw = Math.max(1, b.width / 2)
  const hh = Math.max(1, b.height / 2)
  if (Math.abs(dx) / hw >= Math.abs(dy) / hh) {
    return { x: dx >= 0 ? b.x + b.width : b.x, y: cy }
  }
  return { x: cx, y: dy >= 0 ? b.y + b.height : b.y }
}

/**
 * Resolve a bound connector's geometry from the current bounds of its
 * endpoints. Returns null when the connector is unbound or dangling.
 */
export function resolveConnector(
  el: ConnectorElement,
  boundsById: Map<string, Bounds>,
): { points: number[]; x: number; y: number; width: number; height: number } | null {
  if (!el.fromId || !el.toId) return null
  const from = boundsById.get(el.fromId)
  const to = boundsById.get(el.toId)
  if (!from || !to) return null
  const a1 = anchorOnBounds(from, { x: to.x + to.width / 2, y: to.y + to.height / 2 })
  const a2 = anchorOnBounds(to, { x: from.x + from.width / 2, y: from.y + from.height / 2 })
  return {
    points: [a1.x, a1.y, a2.x, a2.y],
    x: Math.min(a1.x, a2.x),
    y: Math.min(a1.y, a2.y),
    width: Math.abs(a2.x - a1.x),
    height: Math.abs(a2.y - a1.y),
  }
}

export function boundsMapOf(elements: DesignElement[]): Map<string, Bounds> {
  const map = new Map<string, Bounds>()
  for (const el of elements) {
    if (el.type === "connector") continue
    map.set(el.id, { x: el.x, y: el.y, width: el.width, height: el.height })
  }
  return map
}

/** Patch list that re-anchors bound connectors after their endpoints moved. */
export function connectorPatchesFor(
  elements: DesignElement[],
  changedIds: Iterable<string>,
): { id: string; patch: Partial<ConnectorElement> }[] {
  const changed = new Set(changedIds)
  if (changed.size === 0) return []
  const bounds = boundsMapOf(elements)
  const patches: { id: string; patch: Partial<ConnectorElement> }[] = []
  for (const el of elements) {
    if (el.type !== "connector") continue
    const cn = el as ConnectorElement
    if (!cn.fromId || !cn.toId) continue
    if (!changed.has(cn.fromId) && !changed.has(cn.toId)) continue
    const r = resolveConnector(cn, bounds)
    if (!r) continue
    patches.push({ id: cn.id, patch: { x: r.x, y: r.y, width: r.width, height: r.height, points: r.points } })
  }
  return patches
}

/** Connector ids bound to any of the given element ids (cleanup on delete). */
export function connectorsBoundTo(elements: DesignElement[], ids: Iterable<string>): string[] {
  const set = new Set(ids)
  const out: string[] = []
  for (const el of elements) {
    if (el.type !== "connector") continue
    const cn = el as ConnectorElement
    if ((cn.fromId && set.has(cn.fromId)) || (cn.toId && set.has(cn.toId))) out.push(el.id)
  }
  return out
}

/* ------------------------------ bounds / export ------------------------------ */

export function elementBounds(el: DesignElement): Bounds {
  if (el.type === "freehand") {
    return freehandBounds((el as FreehandElement).points)
  }
  if (el.type === "connector") {
    const cn = el as ConnectorElement
    const pts = cn.points && cn.points.length >= 4 ? cn.points : [cn.x, cn.y, cn.x + cn.width, cn.y + cn.height]
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i])
      maxX = Math.max(maxX, pts[i])
      minY = Math.min(minY, pts[i + 1])
      maxY = Math.max(maxY, pts[i + 1])
    }
    return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height }
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (list.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of list) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Content bounds of the board, or null when empty. */
export function contentBounds(elements: DesignElement[]): Bounds | null {
  return unionBounds(elements.filter((el) => !el.hidden).map(elementBounds))
}

/**
 * Build a plain DesignDoc cropped to `bounds` for the headless export renderer.
 * Freehand/connector point arrays are absolute doc coordinates, so both the
 * element origin and every point are shifted; bound connectors are re-anchored
 * first so they render attached to their (moved) endpoints.
 */
export function buildWhiteboardExportDoc(doc: DesignDoc, page: PageModel, bounds: Bounds): DesignDoc {
  const byId = boundsMapOf(page.elements)
  const bx = bounds.x
  const by = bounds.y
  const elements = page.elements
    .filter((el) => !el.hidden)
    .map((el) => {
      const clone = { ...el } as DesignElement
      clone.x = el.x - bx
      clone.y = el.y - by
      if (el.type === "freehand") {
        const fh = clone as FreehandElement
        fh.points = fh.points.map((v, i) => (i % 2 === 0 ? v - bx : v - by))
      } else if (el.type === "connector") {
        const cn = clone as ConnectorElement
        const r = resolveConnector(el as ConnectorElement, byId)
        if (r) {
          cn.x = r.x - bx
          cn.y = r.y - by
          cn.width = r.width
          cn.height = r.height
          cn.points = r.points.map((v, i) => (i % 2 === 0 ? v - bx : v - by))
        } else if (cn.points && cn.points.length >= 4) {
          cn.points = cn.points.map((v, i) => (i % 2 === 0 ? v - bx : v - by))
        }
      }
      return clone
    })
  return {
    ...doc,
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height)),
    pages: [{ ...page, elements }],
  }
}

/** Default nominal size for a freshly drawn shape variant. */
export function shapeDefaultSize(variant: ShapeVariant): { width: number; height: number } {
  switch (variant) {
    case "ellipse":
      return { width: 160, height: 160 }
    case "diamond":
      return { width: 200, height: 200 }
    default:
      return { width: 180, height: 140 }
  }
}
