/**
 * Snapping — pure functions used while dragging/resizing elements.
 * Targets: page edges + center, other elements' edges + centers.
 * Returns positional deltas plus guide lines for the visual overlay.
 */

export interface SnapTarget {
  id?: string
  x: number
  y: number
  width: number
  height: number
}

export interface GuideLine {
  axis: "v" | "h"
  /** fixed coordinate of the line (doc space) */
  pos: number
  from: number
  to: number
}

export interface SnapOptions {
  threshold?: number
  /** grid size for snap-to-grid; null disables */
  gridSize?: number | null
  pageW: number
  pageH: number
  /** include page edges/center targets (default true) */
  withPage?: boolean
}

export interface SnapResult {
  dx: number
  dy: number
  guides: GuideLine[]
}

interface Candidate {
  line: number
  guide: GuideLine
}

function collectCandidates(target: SnapTarget, axis: "v" | "h", pageW: number, pageH: number, withPage: boolean, sourceId?: string): Candidate[] {
  const cands: Candidate[] = []
  const push = (line: number, from: number, to: number) => {
    if (Number.isFinite(line)) cands.push({ line, guide: { axis, pos: line, from, to } })
  }
  if (withPage) {
    if (axis === "v") {
      push(0, 0, pageH)
      push(pageW / 2, 0, pageH)
      push(pageW, 0, pageH)
    } else {
      push(0, 0, pageW)
      push(pageH / 2, 0, pageW)
      push(pageH, 0, pageW)
    }
  }
  const x0 = axis === "v" ? target.x : target.y
  const x1 = axis === "v" ? target.x + target.width : target.y + target.height
  for (const line of [x0, (x0 + x1) / 2, x1]) {
    // guide spans the source element so the line visually connects
    const from = axis === "v" ? target.y : target.x
    const to = axis === "v" ? target.y + target.height : target.x + target.width
    push(line, from, to)
  }
  void sourceId
  return cands
}

/**
 * Compute snapping for a moving element against page + other elements.
 * `moving` is the un-rotated bounding box of the dragged element.
 */
export function computeSnap(moving: SnapTarget, others: SnapTarget[], opts: SnapOptions): SnapResult {
  const threshold = opts.threshold ?? 6
  const withPage = opts.withPage !== false
  let bestX: { d: number; guide: GuideLine } | null = null
  let bestY: { d: number; guide: GuideLine } | null = null

  const myV: number[] = [moving.x, moving.x + moving.width / 2, moving.x + moving.width]
  const myH: number[] = [moving.y, moving.y + moving.height / 2, moving.y + moving.height]

  for (const other of others) {
    if (other.id && other.id === moving.id) continue
    const ov = [other.x, other.x + other.width / 2, other.x + other.width]
    const oh = [other.y, other.y + other.height / 2, other.y + other.height]
    for (const mv of myV) {
      for (const ol of ov) {
        const d = ol - mv
        if (Math.abs(d) <= threshold && (!bestX || Math.abs(d) < Math.abs(bestX.d))) {
          const from = Math.min(moving.y, other.y) - 8
          const to = Math.max(moving.y + moving.height, other.y + other.height) + 8
          bestX = { d, guide: { axis: "v", pos: ol, from, to } }
        }
      }
    }
    for (const mh of myH) {
      for (const ol of oh) {
        const d = ol - mh
        if (Math.abs(d) <= threshold && (!bestY || Math.abs(d) < Math.abs(bestY.d))) {
          const from = Math.min(moving.x, other.x) - 8
          const to = Math.max(moving.x + moving.width, other.x + other.width) + 8
          bestY = { d, guide: { axis: "h", pos: ol, from, to } }
        }
      }
    }
  }

  // page targets participate too (edges + center)
  if (withPage) {
    const pageV = [0, opts.pageW / 2, opts.pageW]
    const pageH2 = [0, opts.pageH / 2, opts.pageH]
    for (const mv of myV) {
      for (const ol of pageV) {
        const d = ol - mv
        if (Math.abs(d) <= threshold && (!bestX || Math.abs(d) < Math.abs(bestX.d))) {
          bestX = { d, guide: { axis: "v", pos: ol, from: 0, to: opts.pageH } }
        }
      }
    }
    for (const mh of myH) {
      for (const ol of pageH2) {
        const d = ol - mh
        if (Math.abs(d) <= threshold && (!bestY || Math.abs(d) < Math.abs(bestY.d))) {
          bestY = { d, guide: { axis: "h", pos: ol, from: 0, to: opts.pageW } }
        }
      }
    }
  }

  let dx = bestX ? bestX.d : 0
  let dy = bestY ? bestY.d : 0
  const guides: GuideLine[] = []
  if (bestX) guides.push(bestX.guide)
  if (bestY) guides.push(bestY.guide)

  // snap-to-grid when no stronger element/page snap applied
  if (opts.gridSize && opts.gridSize > 0) {
    const g = opts.gridSize
    if (!bestX) {
      const snapped = Math.round(moving.x / g) * g
      if (Math.abs(snapped - moving.x) <= threshold) {
        dx = snapped - moving.x
        guides.push({ axis: "v", pos: snapped, from: moving.y - 8, to: moving.y + moving.height + 8 })
      }
    }
    if (!bestY) {
      const snapped = Math.round(moving.y / g) * g
      if (Math.abs(snapped - moving.y) <= threshold) {
        dy = snapped - moving.y
        guides.push({ axis: "h", pos: snapped, from: moving.x - 8, to: moving.x + moving.width + 8 })
      }
    }
  }

  return { dx, dy, guides }
}
