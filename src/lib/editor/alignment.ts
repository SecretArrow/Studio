/**
 * Alignment & distribution — pure functions operating on the current
 * selection. They return per-element patches so the caller can apply them
 * through the normal update pipeline (undo/redo for free).
 */

import type { DesignElement } from "@/lib/design/types"

export interface ElementPatch {
  id: string
  patch: Partial<DesignElement>
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export function elementBox(el: DesignElement): Box {
  return { x: el.x, y: el.y, width: el.width, height: el.height }
}

export function unionBox(boxes: Box[]): Box {
  if (boxes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  const minX = Math.min(...boxes.map((b) => b.x))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxX = Math.max(...boxes.map((b) => b.x + b.width))
  const maxY = Math.max(...boxes.map((b) => b.y + b.height))
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function selectionBounds(els: DesignElement[]): Box {
  return unionBox(els.map(elementBox))
}

export type AlignMode = "left" | "center-h" | "right" | "top" | "middle" | "bottom"
export type DistributeAxis = "h" | "v"

/**
 * Align elements. With a single element the reference is the page; with
 * multiple, the reference is the selection bounding box.
 */
export function alignPatches(els: DesignElement[], mode: AlignMode, pageW: number, pageH: number): ElementPatch[] {
  if (els.length === 0) return []
  const ref = els.length === 1 ? { x: 0, y: 0, width: pageW, height: pageH } : selectionBounds(els)
  return els.map((el) => {
    const b = elementBox(el)
    let { x, y } = b
    if (mode === "left") x = ref.x
    if (mode === "center-h") x = ref.x + (ref.width - b.width) / 2
    if (mode === "right") x = ref.x + ref.width - b.width
    if (mode === "top") y = ref.y
    if (mode === "middle") y = ref.y + (ref.height - b.height) / 2
    if (mode === "bottom") y = ref.y + ref.height - b.height
    x = Math.round(x)
    y = Math.round(y)
    return x === b.x && y === b.y ? { id: el.id, patch: {} } : { id: el.id, patch: { x, y } as Partial<DesignElement> }
  })
}

/**
 * Distribute elements with equal spacing between their bounding boxes.
 * Requires ≥ 3 elements on the axis; the outermost elements stay fixed.
 */
export function distributePatches(els: DesignElement[], axis: DistributeAxis): ElementPatch[] {
  if (els.length < 3) return []
  const isH = axis === "h"
  const sorted = [...els].sort((a, b) => (isH ? a.x - b.x : a.y - b.y))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const startPos = isH ? first.x + first.width : first.y + first.height
  const endPos = isH ? last.x : last.y
  const totalGap = endPos - startPos
  const sizes = sorted.slice(1, -1).reduce((acc, el) => acc + (isH ? el.width : el.height), 0)
  const count = sorted.length - 1
  if (totalGap <= sizes) return []
  const gap = (totalGap - sizes) / count
  const patches: ElementPatch[] = []
  let cursor = startPos
  for (let i = 1; i < sorted.length - 1; i += 1) {
    const el = sorted[i]
    cursor += gap
    const pos = Math.round(cursor)
    const patch: Partial<DesignElement> = isH ? { x: pos } : { y: pos }
    patches.push({ id: el.id, patch })
    cursor += isH ? el.width : el.height
  }
  return patches
}
