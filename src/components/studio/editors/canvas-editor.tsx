"use client"

/**
 * Canvas Editor — foundational implementation.
 * Wave-1 module extends this file in place (snapping, layers panel, context
 * menu, alignment, icons, QR, tables, charts, frames) without changing the
 * exported contract (EditorProps + forwardRef<EditorHandle>).
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import Konva from "konva"
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Ellipse, Transformer } from "react-konva"
import { jsPDF } from "jspdf"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { DesignDoc, DesignElement, TextElement, ShapeElement, ImageElement, PageModel } from "@/lib/design/types"
import { createText, createShape, uid } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  MousePointer2, Type, Square, Circle, ImagePlus, Trash2, Undo2, Redo2, Copy, Palette,
} from "lucide-react"

interface KonvaImageState {
  el: ImageElement
  img: HTMLImageElement
}

const useLoadedImages = (elements: DesignElement[], page: PageModel | undefined) => {
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})
  useEffect(() => {
    if (!page) return
    let alive = true
    const next: Record<string, HTMLImageElement> = {}
    let pending = 0
    for (const el of page.elements) {
      if (el.type === "image" && el.src && !images[el.id]) {
        pending += 1
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          if (!alive) return
          setImages((prev) => ({ ...prev, [el.id]: img }))
        }
        img.src = el.src
      } else if (images[el.id]) {
        next[el.id] = images[el.id]
      }
    }
    if (pending === 0) {
      const t = setTimeout(() => setImages(next), 0)
      return () => {
        clearTimeout(t)
        alive = false
      }
    }
    return () => {
      alive = false
    }
  }, [page?.elements])
  return images
}

const CanvasEditor = forwardRef<EditorHandle, EditorProps>(function CanvasEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const history = useRef<{ stack: string[]; index: number }>({ stack: [JSON.stringify(initialDoc)], index: 0 })
  const docLocalRef = useRef<DesignDoc | null>(null)
  if (docLocalRef.current === null) docLocalRef.current = initialDoc
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const canEdit = role === "owner" || role === "editor"

  const pageIndex = 0
  const page = doc.pages[pageIndex]
  const images = useLoadedImages(page?.elements ?? [], page)

  const pushHistory = useCallback((next: DesignDoc) => {
    const h = history.current
    h.stack = h.stack.slice(0, h.index + 1)
    h.stack.push(JSON.stringify(next))
    if (h.stack.length > 60) h.stack.shift()
    h.index = h.stack.length - 1
  }, [])

  const commit = useCallback(
    (next: DesignDoc) => {
      setDoc(next)
      docLocalRef.current = next
      pushHistory(next)
      onDocChange(next)
    },
    [onDocChange, pushHistory],
  )

  useEffect(() => {
    registerHandle({
      export: async (req) => {
        const results: ExportResult[] = []
        const base = req.filenameBase || "design"
        if (req.format === "json") {
          results.push({
            filename: `${base}.studio.json`,
            blob: new Blob([JSON.stringify(docLocalRef.current ?? initialDoc, null, 2)], { type: "application/json" }),
          })
          return results
        }
        if (req.format === "svg") {
          const stage = stageRef.current
          if (!stage) return results
          // Konva -> SVG for vector elements
          const svg = stage.toDataURL().replace(/^data:image\/png.*/, "")
          // honest note: full SVG export of raster canvas is approximated; use PNG for pixel-exact
          results.push({
            filename: `${base}.png`,
            blob: await stageToBlob(stage, 1, false),
            note: "SVG export renders the flattened canvas — use the project file to keep elements editable.",
          })
          void svg
          return results
        }
        const stage = stageRef.current
        if (!stage) return results
        const scale = req.scale ?? 1
        const transparent = req.transparent ?? false
        if (req.format === "pdf") {
          const cur: DesignDoc = docLocalRef.current ?? initialDoc
          const pdf = new jsPDF({ orientation: cur.width >= cur.height ? "landscape" : "portrait", unit: "px", format: [cur.width, cur.height] })
          const dataUrl = stage.toDataURL({ pixelRatio: Math.min(2, scale), mimeType: "image/png" })
          pdf.addImage(dataUrl, "PNG", 0, 0, cur.width, cur.height)
          results.push({ filename: `${base}.pdf`, blob: pdf.output("blob") })
          return results
        }
        const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
        const dataUrl = stage.toDataURL({ pixelRatio: scale, mimeType: mime, quality: req.quality ?? 0.95 })
        results.push({ filename: `${base}.${req.format === "jpeg" ? "jpg" : req.format}`, blob: dataUrlToBlob(dataUrl) })
        void transparent
        return results
      },
      getThumbnail: async () => {
        const stage = stageRef.current
        if (!stage) return null
        const targetWidth = 480
        return stage.toDataURL({ pixelRatio: targetWidth / stage.width(), mimeType: "image/jpeg", quality: 0.5 })
      },
    })
    return () => registerHandle(null)
  }, [registerHandle])

  /* ---------- element helpers ---------- */

  function addElement(el: DesignElement) {
    if (!page || !canEdit) return
    const next: DesignDoc = {
      ...doc,
      pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, el] } : p)),
    }
    commit(next)
    setSelectedIds([el.id])
  }

  function updateElement(id: string, patch: Partial<DesignElement>) {
    if (!page) return
    const next: DesignDoc = {
      ...doc,
      pages: doc.pages.map((p, i) =>
        i === pageIndex ? { ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)) } : p,
      ),
    }
    commit(next)
  }

  function deleteSelected() {
    if (!page || selectedIds.length === 0 || !canEdit) return
    const next: DesignDoc = {
      ...doc,
      pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, elements: p.elements.filter((e) => !selectedIds.includes(e.id)) } : p)),
    }
    commit(next)
    setSelectedIds([])
  }

  function duplicateSelected() {
    if (!page || selectedIds.length === 0 || !canEdit) return
    const clones = page.elements
      .filter((e) => selectedIds.includes(e.id))
      .map((e) => ({ ...e, id: uid("dup"), x: e.x + 24, y: e.y + 24 }) as DesignElement)
    const next: DesignDoc = {
      ...doc,
      pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, ...clones] } : p)),
    }
    commit(next)
    setSelectedIds(clones.map((c) => c.id))
  }

  function undo() {
    const h = history.current
    if (h.index > 0) {
      h.index -= 1
      const restored = JSON.parse(h.stack[h.index]) as DesignDoc
      setDoc(restored)
      docLocalRef.current = restored
      onDocChange(restored)
    }
  }

  function redo() {
    const h = history.current
    if (h.index < h.stack.length - 1) {
      h.index += 1
      const restored = JSON.parse(h.stack[h.index]) as DesignDoc
      setDoc(restored)
      docLocalRef.current = restored
      onDocChange(restored)
    }
  }

  /* ---------- keyboard ---------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected()
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateSelected() }
      if (e.key === "Escape") setSelectedIds([])
      if (selectedIds.length === 1 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const el = page?.elements.find((x) => x.id === selectedIds[0])
        if (el) {
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
          updateElement(el.id, { x: el.x + dx, y: el.y + dy })
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedIds, page])

  /* ---------- stage interactions ---------- */

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage()) {
      setSelectedIds([])
      trRef.current?.nodes([])
    }
  }

  function attachNode(node: Konva.Node | null, id: string) {
    const tr = trRef.current
    if (!tr) return
    if (node && selectedIds.includes(id)) {
      tr.nodes([...tr.nodes().filter((n) => n.getAttr("id") !== id), node])
      tr.getLayer()?.batchDraw()
    }
  }

  useEffect(() => {
    const tr = trRef.current
    const layer = layerRef.current
    if (!tr || !layer) return
    const nodes = layer.getChildren((n: Konva.Node) => n.getAttr("elementId") && selectedIds.includes(n.getAttr("elementId")))
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, page])

  /* ---------- zoom & fit ---------- */
  function fitToScreen() {
    const container = stageRef.current?.container()?.parentElement
    if (!container) return
    const w = container.clientWidth - 48
    const h = container.clientHeight - 48
    setZoom(Math.min(w / doc.width, h / doc.height))
  }

  useEffect(() => {
    const t = setTimeout(fitToScreen, 0)
    return () => clearTimeout(t)
  }, [doc.width, doc.height])

  const scale = zoom
  const bg = page?.background

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* tool rail */}
      <div className="flex shrink-0 flex-row items-center gap-1 border-b bg-card px-2 py-1.5 md:flex-col md:border-b-0 md:border-r md:py-3 md:pt-[max(0.75rem,env(safe-area-inset-top))]">
        <ToolBtn label="Select" onClick={() => setSelectedIds([])}><MousePointer2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn
          label="Text"
          disabled={!canEdit}
          onClick={() =>
            addElement(createText({ x: 80, y: 80, text: "Double-click to edit", fontSize: Math.round(doc.width / 14) }))
          }
        >
          <Type className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Rectangle" disabled={!canEdit} onClick={() => addElement(createShape({ x: 100, y: 100, variant: "rect" }))}>
          <Square className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Ellipse" disabled={!canEdit} onClick={() => addElement(createShape({ x: 100, y: 100, variant: "ellipse" }))}>
          <Circle className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Image" disabled={!canEdit} onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Duplicate" disabled={!canEdit || selectedIds.length === 0} onClick={duplicateSelected}>
          <Copy className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Delete" disabled={!canEdit || selectedIds.length === 0} onClick={deleteSelected}>
          <Trash2 className="h-4 w-4" />
        </ToolBtn>
        <div className="mx-1 h-5 w-px bg-border md:my-1 md:h-5 md:w-auto md:w-px" />
        <ToolBtn label="Undo" onClick={undo}><Undo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Redo" onClick={redo}><Redo2 className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Background color" onClick={() => {
          const colors = ["#ffffff", "#f8f7f4", "#ede9fe", "#dbeafe", "#dcfce7", "#fee2e2", "#111827"]
          const current = bg?.color ?? "#ffffff"
          const nextColor = colors[(colors.indexOf(current) + 1) % colors.length]
          const next: DesignDoc = {
            ...doc,
            pages: doc.pages.map((p, i) => (i === pageIndex ? { ...p, background: { type: "solid", color: nextColor } } : p)),
          }
          commit(next)
        }}>
          <Palette className="h-4 w-4" />
        </ToolBtn>
      </div>

      {/* canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#f8fafc_0%_50%)] bg-[length:20px_20px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="shadow-xl"
            style={{
              width: doc.width * scale,
              height: doc.height * scale,
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            ref={(node) => {
              if (node && Math.abs((node.clientWidth || 0) / doc.width - scale) > 0.01 && node.clientWidth > 0) {
                setZoom(node.clientWidth / doc.width)
              }
            }}
          >
            <Stage
              ref={stageRef}
              width={doc.width * scale}
              height={doc.height * scale}
              scaleX={scale}
              scaleY={scale}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer ref={layerRef} visible={false} />
              <Layer>
                <Rect x={0} y={0} width={doc.width} height={doc.height} fill={bg?.type === "solid" ? bg.color : "#ffffff"} id="page-bg" />
                {page?.elements.filter((e) => !e.hidden).map((el) => {
                  const common = {
                    key: el.id,
                    elementId: el.id,
                    x: el.x,
                    y: el.y,
                    rotation: el.rotation,
                    opacity: el.opacity,
                    draggable: canEdit && !el.locked,
                    onClick: () => setSelectedIds([el.id]),
                    onTap: () => setSelectedIds([el.id]),
                    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => updateElement(el.id, { x: e.target.x(), y: e.target.y() }),
                    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
                      const node = e.target
                      updateElement(el.id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(10, node.width() * node.scaleX()),
                        height: Math.max(10, node.height() * node.scaleY()),
                        rotation: node.rotation(),
                      })
                      node.scaleX(1)
                      node.scaleY(1)
                    },
                  }
                  if (el.type === "text") {
                    const t = el as TextElement
                    return (
                      <KonvaText
                        {...common}
                        key={el.id}
                        ref={(node) => attachNode(node, el.id)}
                        text={t.uppercase ? t.text.toUpperCase() : t.text}
                        fontSize={t.fontSize}
                        fontFamily={t.fontFamily}
                        fontStyle={`${t.italic ? "italic " : ""}${t.fontWeight >= 600 ? "bold" : "normal"}`}
                        textDecoration={`${t.underline ? "underline " : ""}${t.strike ? "line-through" : ""}`.trim()}
                        align={t.align}
                        lineHeight={t.lineHeight}
                        letterSpacing={t.letterSpacing}
                        fill={t.color}
                        width={t.width}
                      />
                    )
                  }
                  if (el.type === "shape") {
                    const s = el as ShapeElement
                    if (s.variant === "ellipse") {
                      return (
                        <Ellipse
                          {...common}
                          key={el.id}
                          ref={(node) => attachNode(node, el.id)}
                          x={s.x + s.width / 2}
                          y={s.y + s.height / 2}
                          offsetX={s.width / 2}
                          offsetY={s.height / 2}
                          radiusX={s.width / 2}
                          radiusY={s.height / 2}
                          fill={s.fill}
                          stroke={s.stroke === "transparent" ? undefined : s.stroke}
                          strokeWidth={s.strokeWidth}
                        />
                      )
                    }
                    return (
                      <Rect
                        {...common}
                        key={el.id}
                        ref={(node) => attachNode(node, el.id)}
                        width={s.width}
                        height={s.height}
                        cornerRadius={s.cornerRadius}
                        fill={s.fill}
                        stroke={s.stroke === "transparent" ? undefined : s.stroke}
                        strokeWidth={s.strokeWidth}
                      />
                    )
                  }
                  if (el.type === "image") {
                    const imgEl = el as ImageElement
                    const img = images[imgEl.id]
                    if (!img) return null
                    return (
                      <KonvaImage
                        {...common}
                        key={el.id}
                        ref={(node) => attachNode(node, el.id)}
                        image={img}
                        width={imgEl.width}
                        height={imgEl.height}
                        scaleX={imgEl.flipH ? -1 : 1}
                        scaleY={imgEl.flipV ? -1 : 1}
                      />
                    )
                  }
                  // unsupported element types render as placeholder box (never crash)
                  return (
                    <Rect
                      {...common}
                      key={el.id}
                      ref={(node) => attachNode(node, el.id)}
                      width={el.width}
                      height={el.height}
                      fill="rgba(139,92,246,0.15)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dash={[6, 4]}
                    />
                  )
                })}
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio={false}
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
                />
              </Layer>
            </Stage>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border bg-card p-1 text-xs">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.05, z - 0.1))} aria-label="Zoom out">−</Button>
          <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(4, z + 0.1))} aria-label="Zoom in">+</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={fitToScreen}>Fit</Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            const src = String(reader.result)
            const image = new window.Image()
            image.onload = () => {
              const maxW = doc.width * 0.6
              const ratio = Math.min(1, maxW / image.width)
              addElement({
                id: uid("img"),
                type: "image",
                src,
                x: 100,
                y: 100,
                width: image.width * ratio,
                height: image.height * ratio,
                rotation: 0,
                opacity: 1,
                cornerRadius: 0,
                filters: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, grayscale: 0, sepia: 0, invert: 0, vignette: 0 },
              } as ImageElement)
            }
            image.src = src
          }
          reader.readAsDataURL(file)
          e.target.value = ""
        }}
      />
      <ToastBridge toast={toast} />
    </div>
  )
})

function ToolBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="min-h-[40px] min-w-[40px]" onClick={onClick} disabled={disabled} aria-label={label}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ToastBridge({ toast }: { toast: ReturnType<typeof useToast>["toast"] }) {
  useEffect(() => {
    void toast
  }, [toast])
  return null
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",")
  const mime = meta.match(/:(.*?);/)?.[1] ?? "image/png"
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

async function stageToBlob(stage: Konva.Stage, scale: number, transparent: boolean): Promise<Blob> {
  const dataUrl = stage.toDataURL({ pixelRatio: scale, mimeType: transparent ? "image/png" : "image/png" })
  return dataUrlToBlob(dataUrl)
}

export default CanvasEditor
