"use client"

/**
 * SlideStage — a deliberately lightweight interactive Konva stage for
 * presentation slides (fit-to-screen, no pan/zoom).
 *
 * Supports select / drag / rotate / resize for text, shape and image
 * elements, double-click inline text editing, and renders every other
 * element type (charts, tables, QR, icons…) through the shared headless
 * renderer (same pixels as PDF/PNG export).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import Konva from "konva"
import { Arrow as KArrow, Group, Image as KImage, Layer, Line as KLine, Path as KPath, Rect, Stage, Text as KText, Transformer } from "react-konva"
import type { DesignDoc, DesignElement, ImageElement, PageModel, ShapeElement, TextElement } from "@/lib/design/types"
import { measureTextBlockHeight, gradientEndpoints, lineGeometry, shapePathData } from "@/lib/editor/geometry"
import { useProcessedImages } from "@/components/studio/editors/canvas/use-canvas-assets"
import { rasterizeElementToDataUrl } from "./exports"

export interface ElementPatch {
  id: string
  patch: Partial<DesignElement>
}

export interface SlideStageProps {
  doc: DesignDoc
  page: PageModel
  canEdit: boolean
  selectedIds: string[]
  onSelectIds: (ids: string[], additive?: boolean) => void
  onUpdateElements: (patches: ElementPatch[], opts?: { coalesceKey?: string }) => void
  editingId: string | null
  onStartEdit: (id: string | null) => void
}

/* --------------------------- rasterized elements --------------------------- */

const RASTER_TYPES = new Set(["chart", "table", "qr", "icon", "media", "sticky", "freehand", "connector", "frame"])

const rasterCache = new Map<string, string>()

async function cachedRaster(doc: DesignDoc, el: DesignElement): Promise<string> {
  const key = `${doc.width}x${doc.height}|${JSON.stringify(el)}`
  const hit = rasterCache.get(key)
  if (hit) return hit
  const url = await rasterizeElementToDataUrl(doc, el)
  if (rasterCache.size > 140) rasterCache.clear()
  rasterCache.set(key, url)
  return url
}

function useRasterizedUrls(doc: DesignDoc, elements: DesignElement[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    let alive = true
    const targets = elements.filter((el) => RASTER_TYPES.has(el.type))
    const t = setTimeout(() => {
      if (targets.length === 0) {
        if (alive) setUrls((prev) => (Object.keys(prev).length > 0 ? {} : prev))
        return
      }
      void Promise.all(targets.map(async (el) => [el.id, await cachedRaster(doc, el)] as const)).then((entries) => {
        if (alive) setUrls(Object.fromEntries(entries))
      })
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [doc, elements])
  return urls
}

/* -------------------------------- helpers -------------------------------- */

/** Text vertical offset (doc px) so vAlign matches the export renderer. */
function vAlignOffset(el: TextElement): number {
  const h = measureTextBlockHeight(
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
    2,
  )
  if (el.vAlign === "middle") return Math.max(0, (el.height - h) / 2)
  if (el.vAlign === "bottom") return Math.max(0, el.height - h)
  return 0
}

function groupMemberIds(all: DesignElement[], el: DesignElement): string[] {
  if (!el.groupId) return [el.id]
  return all.filter((m) => m.groupId === el.groupId).map((m) => m.id)
}

/* --------------------------------- stage --------------------------------- */

export function SlideStage({ doc, page, canEdit, selectedIds, onSelectIds, onUpdateElements, editingId, onStartEdit }: SlideStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const [size, setSize] = useState({ w: 960, h: 540 })

  const elements = page.elements
  const images = useProcessedImages(elements, page.background)
  const rasterUrls = useRasterizedUrls(doc, elements)
  const bgImage = page.background.type === "image" ? images["__pagebg__"] : undefined

  /* container sizing */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r) setSize({ w: Math.max(80, r.width), h: Math.max(60, r.height) })
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  const scale = Math.min(size.w / doc.width, size.h / doc.height) * 0.94
  const offsetX = (size.w - doc.width * scale) / 2
  const offsetY = (size.h - doc.height * scale) / 2

  /* transformer sync (imperative, no setState) */
  useEffect(() => {
    const layer = layerRef.current
    const tr = trRef.current
    if (!layer || !tr) return
    const nodes = layer.getChildren((n: Konva.Node) => n.getAttr("elementId") && selectedIds.includes(String(n.getAttr("elementId"))))
    tr.nodes(nodes as Konva.Node[])
    tr.getLayer()?.batchDraw()
  }, [selectedIds, elements, size, scale])

  const handleSelect = useCallback(
    (el: DesignElement, additive: boolean) => {
      onSelectIds(groupMemberIds(elements, el), additive)
    },
    [elements, onSelectIds],
  )

  const commitDrag = useCallback(
    (el: DesignElement, node: Konva.Node) => {
      const dx = node.x() - (el.x + el.width / 2)
      const dy = node.y() - (el.y + el.height / 2)
      const patches: ElementPatch[] = [{ id: el.id, patch: { x: Math.round(el.x + dx), y: Math.round(el.y + dy) } }]
      if (el.groupId) {
        for (const m of elements) {
          if (m.groupId === el.groupId && m.id !== el.id) {
            patches.push({ id: m.id, patch: { x: Math.round(m.x + dx), y: Math.round(m.y + dy) } })
          }
        }
      }
      onUpdateElements(patches)
    },
    [elements, onUpdateElements],
  )

  const commitTransform = useCallback(
    (el: DesignElement, node: Konva.Node) => {
      const sx = node.scaleX() || 1
      const sy = node.scaleY() || 1
      node.scaleX(1)
      node.scaleY(1)
      const cx = node.x()
      const cy = node.y()
      const w = Math.max(24, Math.round(el.width * sx))
      const h = Math.max(16, Math.round(el.height * sy))
      node.x(cx)
      node.y(cy)
      const patch: Partial<DesignElement> = {
        x: Math.round(cx - w / 2),
        y: Math.round(cy - h / 2),
        width: w,
        height: h,
        rotation: Math.round(node.rotation()),
      }
      if (el.type === "text") {
        const fs = Math.max(8, Math.round((el as TextElement).fontSize * Math.min(sx, sy)))
        ;(patch as Partial<TextElement>).fontSize = fs
      }
      const patches: ElementPatch[] = [{ id: el.id, patch }]
      if (el.groupId) {
        // scale group members proportionally around the same gesture
        for (const m of elements) {
          if (m.groupId === el.groupId && m.id !== el.id) {
            const p: Partial<DesignElement> = {
              x: Math.round(cx - w / 2 + (m.x - el.x) * sx),
              y: Math.round(cy - h / 2 + (m.y - el.y) * sy),
              width: Math.max(24, Math.round(m.width * sx)),
              height: Math.max(16, Math.round(m.height * sy)),
            }
            if (m.type === "text") {
              ;(p as Partial<TextElement>).fontSize = Math.max(8, Math.round((m as TextElement).fontSize * Math.min(sx, sy)))
            }
            patches.push({ id: m.id, patch: p })
          }
        }
      }
      onUpdateElements(patches)
    },
    [elements, onUpdateElements],
  )

  /* ------------------------- text inline editing ------------------------- */

  const editingEl = editingId ? (elements.find((e) => e.id === editingId) as TextElement | undefined) : undefined

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-muted/60">
      <Stage
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={offsetX}
        y={offsetY}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            onStartEdit(null)
            onSelectIds([])
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) {
            onStartEdit(null)
            onSelectIds([])
          }
        }}
      >
        <Layer ref={layerRef}>
          {/* background */}
          <Rect
            x={0}
            y={0}
            width={doc.width}
            height={doc.height}
            listening={false}
            fill={page.background.type === "solid" ? page.background.color ?? "#ffffff" : undefined}
            fillLinearGradient={
              page.background.type === "gradient" && page.background.gradient
                ? (() => {
                    const ep = gradientEndpoints(page.background.gradient.angle, doc.width, doc.height)
                    return { start: { x: ep.x0, y: ep.y0 }, end: { x: ep.x1, y: ep.y1 } }
                  })()
                : undefined
            }
            fillGradientStops={
              page.background.type === "gradient" && page.background.gradient ? [0, page.background.gradient.from, 1, page.background.gradient.to] : undefined
            }
          />
          {page.background.type === "image" && bgImage ? (
            <KImage
              listening={false}
              image={bgImage.source as CanvasImageSource}
              x={0}
              y={0}
              width={doc.width}
              height={doc.height}
              crop={
                (() => {
                  const ratio = Math.max(doc.width / bgImage.natW, doc.height / bgImage.natH)
                  const dw = bgImage.natW * ratio
                  const dh = bgImage.natH * ratio
                  return { x: (dw - doc.width) / 2 / ratio, y: (dh - doc.height) / 2 / ratio, width: doc.width / ratio, height: doc.height / ratio }
                })()
              }
            />
          ) : null}

          {/* elements */}
          {elements.map((el) =>
            el.hidden ? null : (
              <SlideNode
                key={el.id}
                el={el}
                canEdit={canEdit}
                images={images}
                rasterUrls={rasterUrls}
                selected={selectedIds.includes(el.id)}
                onSelect={handleSelect}
                onDragCommit={commitDrag}
                onTransformCommit={commitTransform}
                onStartEdit={onStartEdit}
              />
            ),
          )}

          {canEdit ? (
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              borderStroke="#8b5cf6"
              anchorStroke="#8b5cf6"
              anchorFill="#ffffff"
              anchorSize={9}
              rotateAnchorOffset={26}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 24 || newBox.height < 16 ? oldBox : newBox)}
            />
          ) : null}
        </Layer>
      </Stage>

      {/* inline text editor overlay */}
      {editingEl && canEdit ? (
        <textarea
          autoFocus
          defaultValue={editingEl.text}
          className="absolute resize-none rounded border-2 border-primary bg-white/95 p-0 shadow-lg outline-none"
          style={{
            left: offsetX + editingEl.x * scale,
            top: offsetY + (editingEl.y + vAlignOffset(editingEl)) * scale,
            width: Math.max(80, editingEl.width * scale),
            height: Math.max(36, editingEl.height * scale + 8),
            fontSize: editingEl.fontSize * scale,
            fontFamily: `${editingEl.fontFamily}, sans-serif`,
            fontWeight: editingEl.fontWeight,
            fontStyle: editingEl.italic ? "italic" : "normal",
            lineHeight: editingEl.lineHeight,
            letterSpacing: `${editingEl.letterSpacing * scale}px`,
            color: editingEl.color,
            textAlign: editingEl.align,
          }}
          onChange={(e) => {
            onUpdateElements([{ id: editingEl.id, patch: { text: e.target.value } }], { coalesceKey: `text:${editingEl.id}` })
          }}
          onBlur={() => onStartEdit(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur()
            e.stopPropagation()
          }}
          aria-label="Edit text"
        />
      ) : null}
    </div>
  )
}

/* ------------------------------- node render ------------------------------- */

interface SlideNodeProps {
  el: DesignElement
  canEdit: boolean
  images: Record<string, { source: HTMLCanvasElement | HTMLImageElement; natW: number; natH: number }>
  rasterUrls: Record<string, string>
  selected: boolean
  onSelect: (el: DesignElement, additive: boolean) => void
  onDragCommit: (el: DesignElement, node: Konva.Node) => void
  onTransformCommit: (el: DesignElement, node: Konva.Node) => void
  onStartEdit: (id: string | null) => void
}

function SlideNode({ el, canEdit, images, rasterUrls, onSelect, onDragCommit, onTransformCommit, onStartEdit }: SlideNodeProps) {
  const draggable = canEdit && !el.locked
  const listening = canEdit && !el.locked
  const common = {
    id: el.id,
    elementId: el.id,
    name: el.id,
    x: el.x + el.width / 2,
    y: el.y + el.height / 2,
    offsetX: el.width / 2,
    offsetY: el.height / 2,
    width: el.width,
    height: el.height,
    rotation: el.rotation,
    opacity: Math.max(0, Math.min(1, el.opacity)),
    draggable,
    listening,
    onMouseDown: listening ? (e: Konva.KonvaEventObject<MouseEvent>) => onSelect(el, e.evt.shiftKey) : undefined,
    onTap: listening ? () => onSelect(el, false) : undefined,
    onDragEnd: listening ? (e: Konva.KonvaEventObject<DragEvent>) => onDragCommit(el, e.target) : undefined,
    onTransformEnd: listening ? (e: Konva.KonvaEventObject<Event>) => onTransformCommit(el, e.target) : undefined,
  }

  switch (el.type) {
    case "text": {
      const t = el as TextElement
      const vo = vAlignOffset(t)
      return (
        <Group
          {...common}
          onDblClick={canEdit ? () => onStartEdit(t.id) : undefined}
          onDblTap={canEdit ? () => onStartEdit(t.id) : undefined}
        >
          <KText
            width={t.width}
            padding={2}
            x={-t.width / 2}
            y={-t.height / 2 + vo}
            text={t.uppercase ? t.text.toUpperCase() : t.text}
            fontFamily={t.fontFamily}
            fontSize={t.fontSize}
            fontStyle={`${t.italic ? "italic " : ""}${t.fontWeight}`}
            align={t.align}
            lineHeight={t.lineHeight}
            letterSpacing={t.letterSpacing}
            fill={t.color}
            textDecoration={[t.underline ? "underline" : "", t.strike ? "line-through" : ""].filter(Boolean).join(" ") || "normal"}
            shadowColor={t.shadow ? t.shadow.color : undefined}
            shadowBlur={t.shadow?.blur ?? 0}
            shadowOffset={t.shadow ? { x: t.shadow.offsetX, y: t.shadow.offsetY } : undefined}
          />
        </Group>
      )
    }
    case "shape": {
      const s = el as ShapeElement
      if (s.variant === "line" || s.variant === "arrow") {
        const g = lineGeometry(s.width, s.height)
        const stroke = s.fill === "transparent" ? s.stroke : s.fill
        if (s.variant === "arrow" && s.arrowHead !== "none") {
          return (
            <KArrow
              {...common}
              points={[-s.width / 2 + g.x1, -s.height / 2 + g.y1, -s.width / 2 + g.x2, -s.height / 2 + g.y2]}
              stroke={stroke}
              strokeWidth={Math.max(1, s.strokeWidth || 3)}
              fill={stroke}
              lineCap="round"
              pointerLength={12}
              pointerWidth={10}
              dash={s.dash ?? undefined}
            />
          )
        }
        return (
          <KLine
            {...common}
            points={[-s.width / 2 + g.x1, -s.height / 2 + g.y1, -s.width / 2 + g.x2, -s.height / 2 + g.y2]}
            stroke={stroke}
            strokeWidth={Math.max(1, s.strokeWidth || 3)}
            lineCap="round"
            dash={s.dash ?? undefined}
          />
        )
      }
      return (
        <KPath
          {...common}
          data={shapePathData(s.variant, s.width, s.height, s.cornerRadius)}
          fill={s.fill === "transparent" ? undefined : s.fill}
          stroke={s.stroke === "transparent" || s.strokeWidth === 0 ? undefined : s.stroke}
          strokeWidth={s.strokeWidth}
          dash={s.dash ?? undefined}
          shadowColor={s.shadow ? s.shadow.color : undefined}
          shadowBlur={s.shadow?.blur ?? 0}
          shadowOffset={s.shadow ? { x: s.shadow.offsetX, y: s.shadow.offsetY } : undefined}
        />
      )
    }
    case "image": {
      const img = el as ImageElement
      const proc = images[img.id]
      if (!proc) {
        return <Rect {...common} fill="rgba(139,92,246,0.12)" cornerRadius={img.cornerRadius} />
      }
      const crop = img.crop ?? { x: 0, y: 0, width: 1, height: 1 }
      return (
        <KImage
          {...common}
          image={proc.source as CanvasImageSource}
          crop={{
            x: crop.x * proc.natW,
            y: crop.y * proc.natH,
            width: Math.max(1, crop.width * proc.natW),
            height: Math.max(1, crop.height * proc.natH),
          }}
          cornerRadius={img.cornerRadius}
        />
      )
    }
    default: {
      const url = rasterUrls[el.id]
      if (!url) {
        return <Rect {...common} fill="rgba(139,92,246,0.12)" cornerRadius={8} />
      }
      return <RasterNode key={el.id} {...common} url={url} />
    }
  }
}

/** KImage that waits for its data URL to decode (per node, deferred setState). */
function RasterNode(props: { url: string } & Record<string, unknown>) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const url = props.url
  useEffect(() => {
    let alive = true
    const image = new Image()
    image.onload = () => {
      if (alive) setImg(image)
    }
    image.onerror = () => {
      /* leave placeholder */
    }
    image.src = url
    return () => {
      alive = false
    }
  }, [url])
  if (!img) return <Rect {...(props as object)} fill="rgba(139,92,246,0.12)" cornerRadius={8} />
  return <KImage {...(props as object)} image={img} />
}
