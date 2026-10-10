"use client"

/**
 * BoardMinimap — bottom-right overview of the whole board.
 * Elements are drawn as simplified rectangles; the draggable viewport rect
 * pans the main canvas. Clicking anywhere jumps there too.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DesignElement } from "@/lib/design/types"
import { contentBounds, elementBounds, type BoardView, type Bounds } from "./board-render"

interface BoardMinimapProps {
  elements: DesignElement[]
  view: BoardView
  viewport: { w: number; h: number }
  docBackground: string
  onPanTo: (docX: number, docY: number) => void
}

const MAP_W = 176
const MAP_H = 128
const PAD = 10

function colorFor(el: DesignElement): string {
  switch (el.type) {
    case "sticky":
      return (el as Extract<DesignElement, { type: "sticky" }>).color
    case "freehand":
      return (el as Extract<DesignElement, { type: "freehand" }>).stroke
    case "connector":
      return (el as Extract<DesignElement, { type: "connector" }>).stroke
    case "shape":
      return (el as Extract<DesignElement, { type: "shape" }>).fill === "transparent"
        ? (el as Extract<DesignElement, { type: "shape" }>).stroke
        : (el as Extract<DesignElement, { type: "shape" }>).fill
    case "frame":
      return (el as Extract<DesignElement, { type: "frame" }>).stroke
    case "image":
      return "#94a3b8"
    default:
      return "#a1a1aa"
  }
}

export function BoardMinimap({ elements, view, viewport, docBackground, onPanTo }: BoardMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const [world, setWorld] = useState<Bounds | null>(null)

  /** World bounds = content + current viewport, so the rect always fits. */
  const computeWorld = useCallback((): Bounds | null => {
    const cb = contentBounds(elements)
    const vp: Bounds = {
      x: -view.panX / (view.zoom || 1),
      y: -view.panY / (view.zoom || 1),
      width: viewport.w / (view.zoom || 1),
      height: viewport.h / (view.zoom || 1),
    }
    if (!cb) return vp
    const x = Math.min(cb.x, vp.x) - PAD
    const y = Math.min(cb.y, vp.y) - PAD
    return {
      x,
      y,
      width: Math.max(PAD * 2, Math.max(cb.x + cb.width, vp.x + vp.width) - x),
      height: Math.max(PAD * 2, Math.max(cb.y + cb.height, vp.y + vp.height) - y),
    }
  }, [elements, view.panX, view.panY, view.zoom, viewport.w, viewport.h])

  useEffect(() => {
    const t = setTimeout(() => setWorld(computeWorld()), 0)
    return () => clearTimeout(t)
  }, [computeWorld])

  const scale = useMemo(() => {
    if (!world || world.width <= 0 || world.height <= 0) return 0
    return Math.min(MAP_W / world.width, MAP_H / world.height)
  }, [world])

  const toMap = useCallback(
    (docX: number, docY: number): { x: number; y: number } => {
      if (!world || scale <= 0) return { x: 0, y: 0 }
      const ox = (MAP_W - world.width * scale) / 2
      const oy = (MAP_H - world.height * scale) / 2
      return { x: ox + (docX - world.x) * scale, y: oy + (docY - world.y) * scale }
    },
    [world, scale],
  )

  const toDoc = useCallback(
    (mapX: number, mapY: number): { x: number; y: number } => {
      if (!world || scale <= 0) return { x: 0, y: 0 }
      const ox = (MAP_W - world.width * scale) / 2
      const oy = (MAP_H - world.height * scale) / 2
      return { x: world.x + (mapX - ox) / scale, y: world.y + (mapY - oy) / scale }
    },
    [world, scale],
  )

  /* redraw whenever anything changes */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = MAP_W * dpr
    canvas.height = MAP_H * dpr
    canvas.style.width = `${MAP_W}px`
    canvas.style.height = `${MAP_H}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, MAP_W, MAP_H)
    ctx.fillStyle = docBackground
    ctx.fillRect(0, 0, MAP_W, MAP_H)
    if (!world || scale <= 0) return
    for (const el of elements) {
      if (el.hidden) continue
      const b = elementBounds(el)
      const p = toMap(b.x, b.y)
      const w = Math.max(2, b.width * scale)
      const h = Math.max(2, b.height * scale)
      ctx.fillStyle = colorFor(el)
      if (el.type === "frame") {
        ctx.globalAlpha = 0.55
        ctx.strokeStyle = colorFor(el)
        ctx.lineWidth = 1
        ctx.strokeRect(p.x, p.y, w, h)
        ctx.globalAlpha = 1
      } else if (el.type === "connector") {
        ctx.strokeStyle = colorFor(el)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        const pts = (el as Extract<DesignElement, { type: "connector" }>).points
        if (pts && pts.length >= 4) {
          const a = toMap(pts[0], pts[1])
          const c = toMap(pts[pts.length - 2], pts[pts.length - 1])
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(c.x, c.y)
        } else {
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + w, p.y + h)
        }
        ctx.stroke()
      } else {
        ctx.globalAlpha = el.type === "freehand" ? 0.8 : 0.9
        ctx.fillRect(p.x, p.y, w, h)
        ctx.globalAlpha = 1
      }
    }
  }, [elements, world, scale, docBackground, toMap])

  /* viewport rect position */
  const rect = useMemo(() => {
    if (!world || scale <= 0) return null
    const vx = -view.panX / (view.zoom || 1)
    const vy = -view.panY / (view.zoom || 1)
    const p = toMap(vx, vy)
    return {
      left: p.x,
      top: p.y,
      width: Math.max(8, (viewport.w / (view.zoom || 1)) * scale),
      height: Math.max(8, (viewport.h / (view.zoom || 1)) * scale),
    }
  }, [world, scale, view.panX, view.panY, view.zoom, viewport.w, viewport.h, toMap])

  const panFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current
      if (!wrap) return
      const r = wrap.getBoundingClientRect()
      const d = toDoc(clientX - r.left, clientY - r.top)
      onPanTo(d.x, d.y)
    },
    [onPanTo, toDoc],
  )

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-lg border bg-card/95 shadow-md backdrop-blur"
      style={{ width: MAP_W, height: MAP_H, cursor: rect ? "pointer" : "default" }}
      role="img"
      aria-label="Board minimap — click or drag to move the view"
      onPointerDown={(e) => {
        dragging.current = true
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        panFromEvent(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (dragging.current) panFromEvent(e.clientX, e.clientY)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
    >
      <canvas ref={canvasRef} className="block" />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded border-2 border-primary bg-primary/10"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ) : null}
    </div>
  )
}
