"use client"

/**
 * Photo stage: renders the document via the shared photo pipeline, handles
 * overlay selection / dragging / resizing, the hold-to-compare button and
 * the empty state (upload + URL input). The free-crop overlay mounts on top
 * while crop mode is active.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import type { DesignElement } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { renderPhotoDoc } from "./render"
import { importImageFile, importImageUrl } from "./upload"
import { CropOverlay, type Fit } from "./crop-overlay"
import type { PhotoApi } from "./api"
import { Eye, EyeOff, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

interface DragState {
  mode: "move" | "resize"
  id: string
  start: { x: number; y: number }
  orig: { x: number; y: number; width: number; height: number; fontSize?: number }
  anchor: { x: number; y: number }
}

function elementCorners(el: DesignElement): { x: number; y: number }[] {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const rad = (el.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = el.width / 2
  const hh = el.height / 2
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }))
}

function pointInElement(el: DesignElement, px: number, py: number): boolean {
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2
  const rad = (-el.rotation * Math.PI) / 180
  const dx = px - cx
  const dy = py - cy
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad) + el.width / 2
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad) + el.height / 2
  return lx >= 0 && ly >= 0 && lx <= el.width && ly <= el.height
}

function drawSelection(ctx: CanvasRenderingContext2D, el: DesignElement, scale: number, ox: number, oy: number): void {
  ctx.save()
  ctx.translate((ox + (el.x + el.width / 2) * scale), (oy + (el.y + el.height / 2) * scale))
  ctx.rotate((el.rotation * Math.PI) / 180)
  const w = el.width * scale
  const h = el.height * scale
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = "#8b5cf6"
  ctx.lineWidth = 1.5
  ctx.strokeRect(-w / 2, -h / 2, w, h)
  ctx.setLineDash([])
  ctx.fillStyle = "#ffffff"
  ctx.strokeStyle = "#8b5cf6"
  ctx.lineWidth = 1.5
  for (const [cx, cy] of [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ]) {
    ctx.fillRect(cx - 5, cy - 5, 10, 10)
    ctx.strokeRect(cx - 5, cy - 5, 10, 10)
  }
  ctx.restore()
}

export function PhotoStage({ api }: { api: PhotoApi }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [fit, setFit] = useState<Fit>({ scale: 1, ox: 0, oy: 0 })
  const [urlValue, setUrlValue] = useState("")
  const [importing, setImporting] = useState(false)
  const { doc, page, compare, overlays, selectedId, cropMode, canEdit } = api

  /* ---- viewport size ---- */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      setSize((prev) => (Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5 ? prev : { w: r.width, h: r.height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ---- render ---- */
  useEffect(() => {
    let cancelled = false
    async function draw() {
      const canvas = canvasRef.current
      if (!canvas || size.w < 8 || size.h < 8) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(size.w * dpr)
      canvas.height = Math.round(size.h * dpr)
      const pad = size.w < 640 ? 14 : 44
      const scale = Math.max(0.01, Math.min((size.w - pad * 2) / doc.width, (size.h - pad * 2) / doc.height))
      const nf: Fit = { scale, ox: (size.w - doc.width * scale) / 2, oy: (size.h - doc.height * scale) / 2 }
      setFit((prev) =>
        Math.abs(prev.scale - nf.scale) < 1e-4 && Math.abs(prev.ox - nf.ox) < 0.5 && Math.abs(prev.oy - nf.oy) < 0.5 ? prev : nf,
      )
      const rendered = await renderPhotoDoc(doc, page, { scale: scale * dpr, compare })
      if (cancelled) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(rendered, 0, 0)
      if (!cropMode) {
        const sel = overlays.find((o) => o.id === selectedId)
        if (sel) drawSelection(ctx, sel, scale * dpr, nf.ox * dpr, nf.oy * dpr)
      }
    }
    void draw()
    return () => {
      cancelled = true
    }
  }, [doc, page, compare, size, overlays, selectedId, cropMode])

  /* ---- pointer interactions (overlays) ---- */
  const toDoc = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    const f = fit
    return {
      x: rect ? (clientX - rect.left - f.ox) / f.scale : 0,
      y: rect ? (clientY - rect.top - f.oy) / f.scale : 0,
    }
  }, [fit])

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canEdit || cropMode) return
    const p = toDoc(e.clientX, e.clientY)
    const sel = overlays.find((o) => o.id === selectedId)
    // resize handle of the current selection
    if (sel) {
      const corners = elementCorners(sel)
      const hitRadius = 12 / fit.scale
      for (let i = 0; i < corners.length; i += 1) {
        const c = corners[i]
        if (Math.hypot(p.x - c.x, p.y - c.y) <= hitRadius) {
          const anchor = corners[(i + 2) % corners.length]
          dragRef.current = {
            mode: "resize",
            id: sel.id,
            start: p,
            orig: { x: sel.x, y: sel.y, width: sel.width, height: sel.height, fontSize: sel.type === "text" ? sel.fontSize : undefined },
            anchor,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          return
        }
      }
    }
    // topmost overlay under the pointer
    for (let i = overlays.length - 1; i >= 0; i -= 1) {
      const el = overlays[i]
      if (pointInElement(el, p.x, p.y)) {
        api.selectOverlay(el.id)
        dragRef.current = {
          mode: "move",
          id: el.id,
          start: p,
          orig: { x: el.x, y: el.y, width: el.width, height: el.height },
          anchor: { x: 0, y: 0 },
        }
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }
    }
    api.selectOverlay(null)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const p = toDoc(e.clientX, e.clientY)
    if (drag.mode === "move") {
      api.updateOverlay(
        drag.id,
        { x: Math.round(drag.orig.x + (p.x - drag.start.x)), y: Math.round(drag.orig.y + (p.y - drag.start.y)) },
        `move:${drag.id}`,
      )
    } else {
      const d0 = Math.max(4, Math.hypot(drag.start.x - drag.anchor.x, drag.start.y - drag.anchor.y))
      const k = Math.max(0.05, Math.min(40, Math.hypot(p.x - drag.anchor.x, p.y - drag.anchor.y) / d0))
      const width = Math.max(12, Math.round(drag.orig.width * k))
      const height = Math.max(12, Math.round(drag.orig.height * k))
      const patch: Record<string, unknown> = { width, height }
      if (drag.orig.fontSize) patch.fontSize = Math.max(6, Math.round(drag.orig.fontSize * k))
      api.updateOverlay(drag.id, patch, `resize:${drag.id}`)
    }
  }

  const endDrag = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  /* ---- import handlers (also used by the empty state) ---- */
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !canEdit) return
    setImporting(true)
    try {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 12)
      if (list.length === 0) return
      const imported: { src: string; width: number; height: number }[] = []
      for (const file of list) {
        try {
          const one = await importImageFile(file)
          if (one) imported.push(one)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Could not import ${file.name}`)
        }
      }
      if (imported.length === 0) {
        toast.error("No usable image files found")
        return
      }
      const first = imported[0]
      api.replaceSubject(first.src, first)
      api.addToPool(imported.map((i) => i.src))
      toast.success(
        imported.length > 1
          ? `${imported.length} photos added — first one is now the subject`
          : "Photo replaced",
      )
    } finally {
      setImporting(false)
    }
  }

  const onUrlLoad = async () => {
    if (!canEdit || !urlValue.trim()) return
    setImporting(true)
    try {
      const one = await importImageUrl(urlValue)
      if (!one) {
        toast.error("Could not load that URL")
        return
      }
      api.replaceSubject(one.src, one)
      api.addToPool([one.src])
      setUrlValue("")
      toast.success("Image loaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load that URL")
    } finally {
      setImporting(false)
    }
  }

  const empty = !api.subject

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden bg-muted/60">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Photo canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      {cropMode && !empty ? <CropOverlay api={api} fit={fit} /> : null}

      {/* before / after — press and hold */}
      {!empty ? (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 left-3 z-20 gap-1.5 bg-card/95 shadow-md backdrop-blur"
          disabled={!api.subject}
          onPointerDown={() => api.setCompare(true)}
          onPointerUp={() => api.setCompare(false)}
          onPointerLeave={() => api.setCompare(false)}
          onPointerCancel={() => api.setCompare(false)}
          aria-label="Press and hold to see the original photo"
          title="Hold to compare with the original"
        >
          {compare ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {compare ? "Original" : "Hold: before"}
        </Button>
      ) : null}

      {/* busy badge */}
      {importing ? (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-lg border bg-card/95 px-3 py-1.5 text-xs shadow-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Importing…
        </div>
      ) : null}

      {/* empty state */}
      {empty ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-5 text-center shadow-lg">
            <div>
              <h2 className="text-base font-semibold">Add a photo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload an image or paste an image URL. Edits are non-destructive — the original file stays untouched.
              </p>
            </div>
            <label className="flex min-h-[92px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition hover:border-primary hover:bg-accent">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-semibold">Upload photos</span>
              <span className="text-[11px] text-muted-foreground">PNG, JPG or WebP — several at once for collages</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void onFiles(e.target.files)
                  e.target.value = ""
                }}
              />
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onUrlLoad()
                }}
                placeholder="https://example.com/photo.jpg"
                className="h-9 text-xs"
                aria-label="Image URL"
              />
              <Button size="sm" className="h-9" disabled={!urlValue.trim() || importing} onClick={() => void onUrlLoad()}>
                Load
              </Button>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              URLs must allow cross-origin loading, otherwise upload the file instead.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
