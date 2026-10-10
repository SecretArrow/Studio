"use client"

/**
 * Free-crop overlay: draggable rectangle with corner/edge handles rendered
 * above the stage canvas. The rect lives in doc coordinates; the `fit`
 * transform maps it to screen pixels. Aspect presets constrain handles.
 */

import { useCallback, useRef } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import type { CropRect, PhotoApi } from "./api"

export interface Fit {
  scale: number
  ox: number
  oy: number
}

type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move"

const HANDLE_SIZE = 14

interface DragState {
  handle: HandleId
  startClient: { x: number; y: number }
  orig: CropRect
}

export function CropOverlay({ api, fit }: { api: PhotoApi; fit: Fit }) {
  const dragRef = useRef<DragState | null>(null)
  const cropRect = api.cropRect
  const cropAspect = api.cropAspect

  const bounds = { x0: 0, y0: 0, x1: api.doc.width, y1: api.doc.height }

  const applyAspect = useCallback((r: CropRect, handle: HandleId): CropRect => {
    const aspect = cropAspect
    if (aspect === "free") return r
    const [aw, ah] = aspect === "original"
      ? [api.doc.width, api.doc.height]
      : aspect.split(":").map(Number)
    if (!aw || !ah) return r
    const target = aw / ah
    const out = { ...r }
    if (handle === "n" || handle === "s") {
      out.width = Math.min(bounds.x1 - bounds.x0, out.height * target)
      out.x = handle === "n" ? r.x + (r.width - out.width) / 2 : out.x
      if (out.x < bounds.x0) out.x = bounds.x0
      if (out.x + out.width > bounds.x1) out.x = bounds.x1 - out.width
    } else if (handle === "e" || handle === "w") {
      out.height = Math.min(bounds.y1 - bounds.y0, out.width / target)
      out.y = handle === "w" ? r.y + (r.height - out.height) / 2 : out.y
      if (out.y < bounds.y0) out.y = bounds.y0
      if (out.y + out.height > bounds.y1) out.y = bounds.y1 - out.height
    } else {
      // corner: fit the larger requested dimension, anchor the opposite corner
      const byWidth = r.width / target <= r.height
      if (byWidth) {
        out.height = out.width / target
      } else {
        out.width = out.height * target
      }
      if (handle.includes("w")) out.x = r.x + r.width - out.width
      if (handle.includes("n")) out.y = r.y + r.height - out.height
    }
    return out
  }, [api.doc.height, api.doc.width, bounds.x0, bounds.x1, bounds.y0, bounds.y1, cropAspect])

  const clampRect = useCallback((r: CropRect): CropRect => {
    const min = 24
    const width = Math.max(min, Math.min(r.width, bounds.x1 - bounds.x0))
    const height = Math.max(min, Math.min(r.height, bounds.y1 - bounds.y0))
    const x = Math.max(bounds.x0, Math.min(r.x, bounds.x1 - width))
    const y = Math.max(bounds.y0, Math.min(r.y, bounds.y1 - height))
    return { x, y, width, height }
  }, [bounds.x0, bounds.x1, bounds.y0, bounds.y1])

  const onPointerDown = (handle: HandleId) => (e: ReactPointerEvent<HTMLElement>) => {
    if (!api.canEdit || !cropRect) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { handle, startClient: { x: e.clientX, y: e.clientY }, orig: { ...cropRect } }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || !cropRect) return
    const dx = (e.clientX - drag.startClient.x) / fit.scale
    const dy = (e.clientY - drag.startClient.y) / fit.scale
    const o = drag.orig
    let next: CropRect
    if (drag.handle === "move") {
      next = clampRect({ ...o, x: o.x + dx, y: o.y + dy })
    } else {
      let { x, y, width, height } = o
      if (drag.handle.includes("e")) width = o.width + dx
      if (drag.handle.includes("s")) height = o.height + dy
      if (drag.handle.includes("w")) {
        width = o.width - dx
        x = o.x + dx
      }
      if (drag.handle.includes("n")) {
        height = o.height - dy
        y = o.y + dy
      }
      next = applyAspect(clampRect({ x, y, width, height }), drag.handle)
      next = clampRect(next)
    }
    api.setCropRect(next)
  }

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
  }

  if (!cropRect || !api.cropMode) return null
  const left = fit.ox + cropRect.x * fit.scale
  const top = fit.oy + cropRect.y * fit.scale
  const width = cropRect.width * fit.scale
  const height = cropRect.height * fit.scale
  const half = HANDLE_SIZE / 2

  const handles: { id: HandleId; style: CSSProperties; cursor: string }[] = [
    { id: "nw", cursor: "nwse-resize", style: { left: -half, top: -half } },
    { id: "n", cursor: "ns-resize", style: { left: width / 2 - half, top: -half } },
    { id: "ne", cursor: "nesw-resize", style: { left: width - half, top: -half } },
    { id: "e", cursor: "ew-resize", style: { left: width - half, top: height / 2 - half } },
    { id: "se", cursor: "nwse-resize", style: { left: width - half, top: height - half } },
    { id: "s", cursor: "ns-resize", style: { left: width / 2 - half, top: height - half } },
    { id: "sw", cursor: "nesw-resize", style: { left: -half, top: height - half } },
    { id: "w", cursor: "ew-resize", style: { left: -half, top: height / 2 - half } },
  ]

  return (
    <div className="absolute inset-0 z-10" aria-label="Crop overlay">
      {/* dark mask outside the rect */}
      <div
        className="absolute"
        data-testid="crop-rect"
        style={{
          left,
          top,
          width,
          height,
          boxShadow: "0 0 0 9999px rgba(12,10,24,0.55)",
          cursor: api.canEdit ? "move" : "default",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown("move")}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/30" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/30" />
        </div>
        <div className="pointer-events-none absolute inset-0 border-2 border-white" />
        {api.canEdit
          ? handles.map((h) => (
              <div
                key={h.id}
                aria-label={`Crop handle ${h.id}`}
                className="absolute rounded-sm border-2 border-primary bg-white shadow"
                style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, cursor: h.cursor, touchAction: "none", ...h.style }}
                onPointerDown={onPointerDown(h.id)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            ))
          : null}
      </div>
    </div>
  )
}
