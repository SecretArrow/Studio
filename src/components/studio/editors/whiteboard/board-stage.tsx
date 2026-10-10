"use client"

/**
 * BoardStage — the interactive infinite-canvas Konva stage for the whiteboard.
 *
 *  • pan (space+drag, middle-drag, plain wheel / two-finger) & zoom (ctrl+wheel,
 *    pinch, buttons via onSetView)
 *  • tools: select, pen (smoothed freehand), eraser, sticky, shape, line/arrow,
 *    text, connector (click source → click target), frame
 *  • click / shift-click / rubber-band multi-select, multi-drag, frames carry
 *    contained elements, bound connectors follow moved elements live
 *  • double-click inline editing for text & stickies (overlay textarea)
 *  • vote mode: clicking a sticky increments its votes badge
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Konva from "konva"
import {
  Arrow as KArrow,
  Circle,
  Group,
  Image as KImage,
  Layer,
  Line as KLine,
  Path as KPath,
  Rect,
  Stage,
  Text as KText,
  Transformer,
} from "react-konva"
import type { KonvaEventObject } from "konva/lib/Node"
import type { ConnectorElement, DesignDoc, DesignElement, FrameElement, ImageElement, PageModel, ShapeElement, ShapeVariant, StickyElement, TextElement } from "@/lib/design/types"
import { createConnector, createFreehand, createShape, createSticky, createText } from "@/lib/design/types"
import { computeSnap, type GuideLine } from "@/lib/editor/snapping"
import { measureTextBlockHeight, shapePathData } from "@/lib/editor/geometry"
import { useProcessedImages } from "../canvas/use-canvas-assets"
import {
  FRAME_DEFAULTS,
  anchorOnBounds,
  boundsMapOf,
  clampZoom,
  connectorPatchesFor,
  elementBounds,
  freehandHits,
  resolveConnector,
  shapeDefaultSize,
  smoothFreehand,
  voteCountOf,
  type BoardTool,
  type BoardView,
} from "./board-render"

const GRID_SIZE = 24

interface BoardStageProps {
  doc: DesignDoc
  page: PageModel
  canEdit: boolean
  selectedIds: string[]
  view: BoardView
  tool: BoardTool
  penColor: string
  penWidth: number
  stickyColor: string
  shapeVariant: ShapeVariant
  snapToGrid: boolean
  voteMode: boolean
  editingId: string | null
  connectorSourceId: string | null
  onViewportResize: (w: number, h: number) => void
  onSelect: (ids: string[], additive?: boolean) => void
  onAddElements: (els: DesignElement[]) => string[]
  onUpdateElements: (patches: { id: string; patch: Partial<DesignElement> }[], coalesceKey?: string) => void
  onDeleteElements: (ids: string[]) => void
  onSetView: (patch: Partial<BoardView>) => void
  onStartEditing: (id: string | null) => void
  onToolDone: () => void
  onConnectorSource: (id: string | null) => void
  onVote: (id: string) => void
}

type DrawGesture =
  | { kind: "pen"; points: number[]; node: Konva.Line }
  | { kind: "erase"; ids: Set<string> }
  | { kind: "draw"; tool: BoardTool; startX: number; startY: number; node: Konva.Shape }

interface DragState {
  draggedId: string
  moved: Set<string>
  orig: Map<string, { x: number; y: number }>
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function isTextEntry(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
}

export function BoardStage(props: BoardStageProps) {
  const {
    doc,
    page,
    canEdit,
    selectedIds,
    view,
    tool,
    penColor,
    penWidth,
    stickyColor,
    shapeVariant,
    snapToGrid,
    voteMode,
    editingId,
    connectorSourceId,
    onViewportResize,
    onSelect,
    onAddElements,
    onUpdateElements,
    onDeleteElements,
    onSetView,
    onStartEditing,
    onToolDone,
    onConnectorSource,
    onVote,
  } = props

  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const contentLayerRef = useRef<Konva.Layer>(null)
  const overlayLayerRef = useRef<Konva.Layer>(null)
  const fxLayerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const marqueeRef = useRef<Konva.Rect>(null)

  const [size, setSize] = useState({ w: 800, h: 600 })
  const [editingRect, setEditingRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  const elements = page.elements
  const images = useProcessedImages(elements, page.background)

  const dragState = useRef<DragState | null>(null)
  const drawGesture = useRef<DrawGesture | null>(null)
  const panState = useRef<{ active: boolean; lastX: number; lastY: number } | null>(null)
  const spaceDown = useRef(false)
  const marquee = useRef<{ active: boolean; startX: number; startY: number; additive: boolean } | null>(null)
  const gestureCommit = useRef<ReturnType<typeof setTimeout> | null>(null)

  const boundsById = useMemo(() => boundsMapOf(elements), [elements])

  // unmount hygiene: drop a pending view-gesture commit so it can never fire
  // into a torn-down stage (closure released immediately)
  useEffect(() => {
    return () => {
      if (gestureCommit.current) clearTimeout(gestureCommit.current)
    }
  }, [])

  /* ------------------------- container sizing ------------------------- */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r) {
        setSize({ w: Math.max(100, r.width), h: Math.max(100, r.height) })
        onViewportResize(r.width, r.height)
      }
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [onViewportResize])

  /* ------------------------- space pan cursor ------------------------- */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !isTextEntry(e.target)) {
        spaceDown.current = true
        if (wrapRef.current && !e.repeat) wrapRef.current.style.cursor = "grab"
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        spaceDown.current = false
        if (wrapRef.current) wrapRef.current.style.cursor = ""
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  /* cursor per tool */
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    wrap.style.cursor = tool === "select" ? "default" : tool === "text" ? "text" : tool === "sticky" ? "copy" : "crosshair"
  }, [tool])

  /* ------------------------- selection outline sync ------------------------- */
  useEffect(() => {
    const layer = contentLayerRef.current
    const tr = trRef.current
    if (!layer || !tr) return
    const nodes = layer.getChildren((n: Konva.Node) => n.getAttr("elementId") && selectedIds.includes(String(n.getAttr("elementId"))))
    tr.nodes(nodes as Konva.Node[])
    tr.getLayer()?.batchDraw()
  }, [selectedIds, elements, size])

  /* ------------------------- view gesture commit ------------------------- */
  const commitGesture = useCallback(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    if (gestureCommit.current) clearTimeout(gestureCommit.current)
    gestureCommit.current = setTimeout(() => {
      onSetView({ zoom: layer.scaleX(), panX: layer.x(), panY: layer.y() })
    }, 140)
  }, [onSetView])

  useEffect(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    layer.position({ x: view.panX, y: view.panY })
    layer.scale({ x: view.zoom, y: view.zoom })
    layer.batchDraw()
  }, [view.zoom, view.panX, view.panY])

  /* keep overlay + fx layers aligned with the content layer */
  useEffect(() => {
    for (const layer of [overlayLayerRef.current, fxLayerRef.current]) {
      if (!layer) continue
      layer.position({ x: view.panX, y: view.panY })
      layer.scale({ x: view.zoom, y: view.zoom })
      layer.batchDraw()
    }
  }, [view.zoom, view.panX, view.panY])

  /* ------------------------- guides (imperative, fx layer) ------------------------- */
  const drawGuides = useCallback((guides: GuideLine[]) => {
    const layer = fxLayerRef.current
    if (!layer) return
    layer.destroyChildren()
    const z = viewRef.current.zoom || 1
    for (const g of guides) {
      layer.add(
        new Konva.Line({
          points: g.axis === "v" ? [g.pos, g.from, g.pos, g.to] : [g.from, g.pos, g.to, g.pos],
          stroke: "#ec4899",
          strokeWidth: 1 / z,
          dash: [4 / z, 4 / z],
          listening: false,
        }),
      )
    }
    layer.batchDraw()
  }, [])

  const clearFx = useCallback(() => {
    const layer = fxLayerRef.current
    if (!layer) return
    layer.destroyChildren()
    layer.batchDraw()
  }, [])

  /* ------------------------- helpers ------------------------- */

  const stagePos = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current
    if (!stage) return null
    const p = stage.getPointerPosition()
    return p ? { x: p.x, y: p.y } : null
  }, [])

  const docPos = useCallback((): { x: number; y: number } | null => {
    const layer = contentLayerRef.current
    const p = stagePos()
    if (!layer || !p) return null
    const rel = layer.getRelativePointerPosition()
    return rel ? { x: rel.x, y: rel.y } : null
  }, [stagePos])

  const snapPoint = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!snapToGrid) return { x, y }
      return { x: Math.round(x / GRID_SIZE) * GRID_SIZE, y: Math.round(y / GRID_SIZE) * GRID_SIZE }
    },
    [snapToGrid],
  )

  function containedInFrame(frame: DesignElement, all: DesignElement[]): string[] {
    const fx = frame.x
    const fy = frame.y
    const fr = frame.x + frame.width
    const fb = frame.y + frame.height
    return all
      .filter((o) => o.id !== frame.id && o.type !== "connector" && !o.hidden)
      .filter((o) => {
        const b = elementBounds(o)
        return b.x >= fx - 2 && b.y >= fy - 2 && b.x + b.width <= fr + 2 && b.y + b.height <= fb + 2
      })
      .map((o) => o.id)
  }

  function dragSetFor(el: DesignElement): string[] {
    const base = selectedIds.includes(el.id) ? [...selectedIds] : [el.id]
    const frames = base.filter((id) => {
      const f = elements.find((e) => e.id === id)
      return f && f.type === "frame"
    })
    for (const fid of frames) {
      const frame = elements.find((e) => e.id === fid)
      if (frame) for (const cid of containedInFrame(frame, elements)) if (!base.includes(cid)) base.push(cid)
    }
    return base
  }

  /** Effective bounds map while dragging: base bounds + live offsets. */
  function liveBounds(st: DragState, draggedNode: Konva.Node): Map<string, { x: number; y: number; width: number; height: number }> {
    const map = new Map(boundsById)
    const origDragged = st.orig.get(st.draggedId)
    if (!origDragged) return map
    const dx = draggedNode.x() - origDragged.x
    const dy = draggedNode.y() - origDragged.y
    for (const id of st.moved) {
      const o = st.orig.get(id)
      const base = boundsById.get(id)
      if (o && base) map.set(id, { x: base.x + dx, y: base.y + dy, width: base.width, height: base.height })
    }
    return map
  }

  function updateBoundConnectorsLive(st: DragState, draggedNode: Konva.Node) {
    const layer = contentLayerRef.current
    if (!layer) return
    const map = liveBounds(st, draggedNode)
    for (const el of elements) {
      if (el.type !== "connector") continue
      const cn = el as ConnectorElement
      if (!cn.fromId || !cn.toId) continue
      if (!st.moved.has(cn.fromId) && !st.moved.has(cn.toId)) continue
      const r = resolveConnector(cn, map)
      if (!r) continue
      const node = layer.findOne(`#${cn.id}`)
      if (!node) continue
      const lineNode = node as unknown as Konva.Line
      lineNode.position({ x: r.x, y: r.y })
      lineNode.points([0, 0, r.points[2] - r.points[0], r.points[3] - r.points[1]])
    }
  }

  /* ------------------------- drag handlers ------------------------- */

  function onDragStart(_e: KonvaEventObject<DragEvent>, el: DesignElement) {
    const layer = contentLayerRef.current
    if (!layer) return
    const dragSet = dragSetFor(el)
    const orig = new Map<string, { x: number; y: number }>()
    for (const id of dragSet) {
      const node = layer.findOne(`#${id}`)
      if (node) orig.set(id, { x: node.x(), y: node.y() })
    }
    dragState.current = { draggedId: el.id, moved: new Set(dragSet), orig }
  }

  function onDragMove(e: KonvaEventObject<DragEvent>, el: DesignElement) {
    const node = e.target
    const layer = contentLayerRef.current
    const st = dragState.current
    if (!layer || !st) return
    const zoom = layer.scaleX() || 1
    const snap = computeSnap(
      { id: el.id, x: node.x(), y: node.y(), width: el.width, height: el.height },
      elements.filter((o) => !o.hidden && !st.moved.has(o.id)).map((o) => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height })),
      {
        threshold: 6 / zoom,
        gridSize: snapToGrid ? GRID_SIZE : null,
        pageW: doc.width,
        pageH: doc.height,
        withPage: false,
      },
    )
    node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy })
    drawGuides(snap.guides)
    const orig = st.orig.get(el.id)
    if (orig) {
      const dx = node.x() - orig.x
      const dy = node.y() - orig.y
      for (const [id, o] of st.orig) {
        if (id === el.id) continue
        const n = layer.findOne(`#${id}`)
        if (n) n.position({ x: o.x + dx, y: o.y + dy })
      }
    }
    updateBoundConnectorsLive(st, node)
    layer.batchDraw()
  }

  function onDragEnd(e: KonvaEventObject<DragEvent>, el: DesignElement) {
    const node = e.target
    const st = dragState.current
    dragState.current = null
    clearFx()
    if (!st) return
    const orig = st.orig.get(el.id)
    if (!orig) return
    const dx = node.x() - orig.x
    const dy = node.y() - orig.y
    if (dx === 0 && dy === 0) return
    const patches: { id: string; patch: Partial<DesignElement> }[] = []
    const nextById = new Map<string, DesignElement>()
    for (const [id, o] of st.orig) {
      const nx = Math.round(id === el.id ? node.x() : o.x + dx)
      const ny = Math.round(id === el.id ? node.y() : o.y + dy)
      patches.push({ id, patch: { x: nx, y: ny } })
      const src = elements.find((e2) => e2.id === id)
      if (src) nextById.set(id, { ...src, x: nx, y: ny })
    }
    const nextElements = elements.map((e2) => nextById.get(e2.id) ?? e2)
    for (const cp of connectorPatchesFor(nextElements, st.moved)) {
      patches.push(cp)
    }
    onUpdateElements(patches)
  }

  /* ------------------------- gestures: pen / erase / draw ------------------------- */

  function beginPen(p: { x: number; y: number }) {
    const fx = fxLayerRef.current
    if (!fx) return
    const node = new Konva.Line({
      points: [p.x, p.y],
      stroke: penColor,
      strokeWidth: penWidth,
      lineCap: "round",
      lineJoin: "round",
      tension: 0,
      listening: false,
      globalCompositeOperation: "source-over",
    })
    fx.add(node)
    fx.batchDraw()
    drawGesture.current = { kind: "pen", points: [p.x, p.y], node }
  }

  function movePen(p: { x: number; y: number }) {
    const g = drawGesture.current
    if (!g || g.kind !== "pen") return
    g.points.push(p.x, p.y)
    const smoothed = smoothFreehand(g.points)
    if (smoothed.length >= 4) g.node.points(smoothed)
    g.node.getLayer()?.batchDraw()
  }

  function endPen() {
    const g = drawGesture.current
    drawGesture.current = null
    clearFx()
    if (!g || g.kind !== "pen") return
    const pts = smoothFreehand(g.points)
    if (pts.length < 4) return
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
    const stroke = createFreehand({
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      points: pts,
      stroke: penColor,
      strokeWidth: penWidth,
    })
    onAddElements([stroke])
  }

  function eraseAt(p: { x: number; y: number }) {
    const g = drawGesture.current
    const layer = contentLayerRef.current
    if (!g || g.kind !== "erase" || !layer) return
    const hits = freehandHits(elements, p.x, p.y, 10 / (viewRef.current.zoom || 1))
    for (const id of hits) {
      if (g.ids.has(id)) continue
      g.ids.add(id)
      const node = layer.findOne(`#${id}`)
      if (node) node.visible(false)
    }
    layer.batchDraw()
  }

  function beginDraw(p: { x: number; y: number }, drawTool: BoardTool) {
    const fx = fxLayerRef.current
    if (!fx) return
    const z = viewRef.current.zoom || 1
    let node: Konva.Shape
    if (drawTool === "line" || drawTool === "arrow") {
      node = new Konva.Line({
        points: [p.x, p.y, p.x, p.y],
        stroke: "#3f3f46",
        strokeWidth: 3,
        lineCap: "round",
        listening: false,
        ...(drawTool === "arrow"
          ? { pointerLength: 10, pointerWidth: 10, fill: "#3f3f46" }
          : {}),
      })
    } else {
      node = new Konva.Rect({
        x: p.x,
        y: p.y,
        width: 0,
        height: 0,
        stroke: "#8b5cf6",
        strokeWidth: 1.5 / z,
        dash: [6 / z, 4 / z],
        listening: false,
      })
    }
    fx.add(node)
    fx.batchDraw()
    drawGesture.current = { kind: "draw", tool: drawTool, startX: p.x, startY: p.y, node }
  }

  function moveDraw(p: { x: number; y: number }) {
    const g = drawGesture.current
    if (!g || g.kind !== "draw") return
    if (g.tool === "line" || g.tool === "arrow") {
      ;(g.node as Konva.Line).points([g.startX, g.startY, p.x, p.y])
    } else {
      ;(g.node as Konva.Rect).position({ x: Math.min(g.startX, p.x), y: Math.min(g.startY, p.y) })
      ;(g.node as Konva.Rect).size({ width: Math.abs(p.x - g.startX), height: Math.abs(p.y - g.startY) })
    }
    g.node.getLayer()?.batchDraw()
  }

  function endDraw(p: { x: number; y: number }) {
    const g = drawGesture.current
    drawGesture.current = null
    clearFx()
    if (!g || g.kind !== "draw") return
    const dx = p.x - g.startX
    const dy = p.y - g.startY
    const tiny = Math.hypot(dx, dy) < 8

    if (g.tool === "line" || g.tool === "arrow") {
      const x1 = g.startX
      const y1 = g.startY
      const x2 = p.x
      const y2 = p.y
      const el = tiny
        ? createConnector({ x: g.startX, y: g.startY, width: 160, height: 0, points: [g.startX, g.startY, g.startX + 160, g.startY], arrowHead: g.tool === "arrow" ? "arrow" : "none" })
        : createConnector({
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
            points: [x1, y1, x2, y2],
            stroke: "#3f3f46",
            strokeWidth: 3,
            arrowHead: g.tool === "arrow" ? "arrow" : "none",
          })
      onAddElements([el])
      return
    }

    if (g.tool === "frame") {
      const sizeW = tiny ? 360 : Math.abs(dx)
      const sizeH = tiny ? 260 : Math.abs(dy)
      const at = snapPoint(tiny ? g.startX : Math.min(g.startX, p.x), tiny ? g.startY : Math.min(g.startY, p.y))
      const frame: FrameElement = {
        id: `frame_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        type: "frame",
        x: at.x,
        y: at.y,
        width: sizeW,
        height: sizeH,
        rotation: 0,
        opacity: 1,
        ...FRAME_DEFAULTS,
        label: "Section",
      }
      onAddElements([frame])
      return
    }

    // shapes: rect / ellipse / diamond
    const def = shapeDefaultSize(g.tool === "shape" ? shapeVariant : "rect")
    const w = tiny ? def.width : Math.abs(dx)
    const h = tiny ? def.height : Math.abs(dy)
    const at = snapPoint(tiny ? g.startX - def.width / 2 : Math.min(g.startX, p.x), tiny ? g.startY - def.height / 2 : Math.min(g.startY, p.y))
    const variant: ShapeVariant = g.tool === "shape" ? shapeVariant : "rect"
    const el = createShape({
      x: at.x,
      y: at.y,
      variant,
      width: w,
      height: h,
      fill: "#ede9fe",
      stroke: "#7c3aed",
      strokeWidth: 2,
      cornerRadius: variant === "rect" ? 10 : 0,
    })
    onAddElements([el])
  }

  /* ------------------------- stage pointer handlers ------------------------- */

  function beginPan(x: number, y: number) {
    panState.current = { active: true, lastX: x, lastY: y }
    if (wrapRef.current) wrapRef.current.style.cursor = "grabbing"
  }

  function movePan(x: number, y: number) {
    const layer = contentLayerRef.current
    const pan = panState.current
    if (!layer || !pan?.active) return
    layer.position({ x: layer.x() + (x - pan.lastX), y: layer.y() + (y - pan.lastY) })
    for (const l of [overlayLayerRef.current, fxLayerRef.current]) {
      l?.position({ x: layer.x(), y: layer.y() })
    }
    layer.batchDraw()
    pan.lastX = x
    pan.lastY = y
  }

  function endPan() {
    if (!panState.current?.active) return
    panState.current = null
    if (wrapRef.current) wrapRef.current.style.cursor = spaceDown.current ? "grab" : ""
    commitGesture()
  }

  function onStageMouseDown(e: KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current
    if (!stage) return
    const sp = stagePos()
    if (!sp) return
    if (spaceDown.current || e.evt.button === 1) {
      e.evt.preventDefault()
      beginPan(sp.x, sp.y)
      return
    }
    if (e.evt.button !== 0) return
    const p = docPos()
    if (!p || !canEdit) {
      if (e.target === stage && !canEdit) onSelect([])
      return
    }
    if (tool === "pen") {
      beginPen(p)
    } else if (tool === "eraser") {
      drawGesture.current = { kind: "erase", ids: new Set() }
      eraseAt(p)
    } else if (tool === "sticky") {
      const at = snapPoint(p.x - 110, p.y - 110)
      onAddElements([createSticky({ x: at.x, y: at.y, color: stickyColor })])
    } else if (tool === "text") {
      const at = snapPoint(p.x, p.y - 22)
      const el = createText({ x: at.x, y: at.y, text: "", fontSize: 28, fontWeight: 600, width: 280, height: 44, color: "#111827" })
      const ids = onAddElements([el])
      onToolDone()
      if (ids[0]) onStartEditing(ids[0])
    } else if (tool === "shape" || tool === "line" || tool === "arrow" || tool === "frame") {
      beginDraw(p, tool)
    } else if (tool === "connector") {
      if (e.target === stage) onConnectorSource(null)
    } else if (e.target === stage) {
      // rubber-band selection
      const marq = marqueeRef.current
      marquee.current = { active: true, startX: p.x, startY: p.y, additive: e.evt.shiftKey }
      if (marq) {
        marq.position({ x: p.x, y: p.y })
        marq.size({ width: 0, height: 0 })
        marq.visible(true)
        marq.getLayer()?.batchDraw()
      }
    }
  }

  function onStageMouseMove(_e: KonvaEventObject<MouseEvent>) {
    const sp = stagePos()
    if (!sp) return
    if (panState.current?.active) {
      movePan(sp.x, sp.y)
      return
    }
    const g = drawGesture.current
    if (g) {
      const p = docPos()
      if (!p) return
      if (g.kind === "pen") movePen(p)
      else if (g.kind === "erase") eraseAt(p)
      else moveDraw(p)
      return
    }
    const mq = marquee.current
    const m = marqueeRef.current
    if (mq?.active && m) {
      const p = docPos()
      if (!p) return
      m.position({ x: Math.min(mq.startX, p.x), y: Math.min(mq.startY, p.y) })
      m.size({ width: Math.abs(p.x - mq.startX), height: Math.abs(p.y - mq.startY) })
      m.getLayer()?.batchDraw()
    }
  }

  function onStageMouseUp() {
    if (panState.current?.active) {
      endPan()
      return
    }
    const g = drawGesture.current
    if (g) {
      const p = docPos()
      if (g.kind === "pen") endPen()
      else if (g.kind === "erase") {
        const ids = Array.from(g.ids)
        drawGesture.current = null
        if (ids.length > 0) onDeleteElements(ids)
      } else if (p) endDraw(p)
      else {
        drawGesture.current = null
        clearFx()
      }
      return
    }
    const mq = marquee.current
    const m = marqueeRef.current
    if (mq?.active && m) {
      m.visible(false)
      m.getLayer()?.batchDraw()
      const box = {
        x: Math.min(mq.startX, m.x()),
        y: Math.min(mq.startY, m.y()),
        width: m.width(),
        height: m.height(),
      }
      marquee.current = null
      if (box.width > 3 || box.height > 3) {
        const hits = elements
          .filter((el) => !el.hidden && !el.locked && el.type !== "frame")
          .filter((el) => {
            const b = elementBounds(el)
            return b.x < box.x + box.width && b.x + b.width > box.x && b.y < box.y + box.height && b.y + b.height > box.y
          })
          .map((el) => el.id)
        if (hits.length === 0) {
          // a marquee over frames only selects frames it overlaps
          for (const el of elements) {
            if (el.type !== "frame" || el.hidden) continue
            const b = elementBounds(el)
            if (b.x < box.x + box.width && b.x + b.width > box.x && b.y < box.y + box.height && b.y + b.height > box.y) hits.push(el.id)
          }
        }
        onSelect(hits, mq.additive)
      } else if (!mq.additive) {
        onSelect([])
      }
    }
  }

  /* ------------------------- touch: pinch zoom + pan ------------------------- */
  const touchGesture = useRef<{ startDist: number; startScale: number; startCenter: { x: number; y: number }; startLayerPos: { x: number; y: number } } | null>(null)

  function onStageTouchStart(e: KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current
    if (!stage) return
    const touches = e.evt.touches
    const sp = stagePos()
    if (touches.length === 2) {
      const [a, b] = [touches[0], touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const layer = contentLayerRef.current
      touchGesture.current = {
        startDist: dist || 1,
        startScale: layer?.scaleX() ?? 1,
        startCenter: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
        startLayerPos: { x: layer?.x() ?? 0, y: layer?.y() ?? 0 },
      }
      // cancel any drawing gesture when pinching
      if (drawGesture.current) {
        if (drawGesture.current.kind === "pen") endPen()
        else if (drawGesture.current.kind === "erase") {
          const ids = Array.from(drawGesture.current.ids)
          drawGesture.current = null
          if (ids.length > 0) onDeleteElements(ids)
        } else {
          drawGesture.current = null
          clearFx()
        }
      }
      panState.current = null
      return
    }
    if (!canEdit) {
      if (sp) beginPan(sp.x, sp.y)
      return
    }
    const p = docPos()
    if (!p) return
    if (tool === "pen") beginPen(p)
    else if (tool === "eraser") {
      drawGesture.current = { kind: "erase", ids: new Set() }
      eraseAt(p)
    } else if (e.target === stage) {
      if (sp) beginPan(sp.x, sp.y)
    }
  }

  function onStageTouchMove(e: KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current
    const sp = stagePos()
    const touches = e.evt.touches
    const layer = contentLayerRef.current
    if (touches.length === 2 && layer && touchGesture.current && stage) {
      e.evt.preventDefault()
      const [a, b] = [touches[0], touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const scale = clamp(touchGesture.current.startScale * (dist / touchGesture.current.startDist), 0.04, 8)
      const rect = stage.container().getBoundingClientRect()
      const cx = touchGesture.current.startCenter.x - rect.left
      const cy = touchGesture.current.startCenter.y - rect.top
      const g = touchGesture.current
      const docX = (cx - g.startLayerPos.x) / g.startScale
      const docY = (cy - g.startLayerPos.y) / g.startScale
      const curX = (a.clientX + b.clientX) / 2 - rect.left
      const curY = (a.clientY + b.clientY) / 2 - rect.top
      for (const l of [layer, overlayLayerRef.current, fxLayerRef.current]) {
        if (!l) continue
        l.scale({ x: scale, y: scale })
        l.position({ x: curX - docX * scale, y: curY - docY * scale })
      }
      layer.batchDraw()
      commitGesture()
      return
    }
    if (panState.current?.active && sp) {
      movePan(sp.x, sp.y)
      return
    }
    const g = drawGesture.current
    if (g) {
      const p = docPos()
      if (!p) return
      if (g.kind === "pen") movePen(p)
      else if (g.kind === "erase") eraseAt(p)
      else moveDraw(p)
    }
  }

  function onStageTouchEnd() {
    touchGesture.current = null
    if (panState.current?.active) {
      endPan()
      return
    }
    const g = drawGesture.current
    if (g) {
      if (g.kind === "pen") endPen()
      else if (g.kind === "erase") {
        const ids = Array.from(g.ids)
        drawGesture.current = null
        if (ids.length > 0) onDeleteElements(ids)
      } else {
        const p = docPos()
        drawGesture.current = null
        if (p) endDraw(p)
        else clearFx()
      }
    }
  }

  /* ------------------------- wheel ------------------------- */

  function onWheel(e: KonvaEventObject<WheelEvent>) {
    const layer = contentLayerRef.current
    const stage = stageRef.current
    if (!layer || !stage) return
    e.evt.preventDefault()
    const pos = stage.getPointerPosition()
    if (!pos) return
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = layer.scaleX()
      const newScale = clampZoom(oldScale * Math.exp(-e.evt.deltaY * 0.0016))
      const docX = (pos.x - layer.x()) / oldScale
      const docY = (pos.y - layer.y()) / oldScale
      for (const l of [layer, overlayLayerRef.current, fxLayerRef.current]) {
        if (!l) continue
        l.scale({ x: newScale, y: newScale })
        l.position({ x: pos.x - docX * newScale, y: pos.y - docY * newScale })
      }
      layer.batchDraw()
      commitGesture()
    } else {
      for (const l of [layer, overlayLayerRef.current, fxLayerRef.current]) {
        if (!l) continue
        l.position({ x: l.x() - e.evt.deltaX, y: l.y() - e.evt.deltaY })
      }
      layer.batchDraw()
      commitGesture()
    }
  }

  /* ------------------------- connector preview ------------------------- */
  useEffect(() => {
    const fx = fxLayerRef.current
    if (!fx) return
    fx.destroyChildren()
    const source = connectorSourceId ? elements.find((el) => el.id === connectorSourceId) : null
    if (!source) {
      fx.batchDraw()
      return
    }
    const b = boundsById.get(source.id)
    if (!b) return
    const ring = new Konva.Rect({
      x: b.x - 4,
      y: b.y - 4,
      width: b.width + 8,
      height: b.height + 8,
      stroke: "#8b5cf6",
      strokeWidth: 2 / (viewRef.current.zoom || 1),
      dash: [6 / (viewRef.current.zoom || 1), 4 / (viewRef.current.zoom || 1)],
      cornerRadius: 4,
      listening: false,
    })
    fx.add(ring)
    fx.batchDraw()
  }, [connectorSourceId, elements, boundsById])

  /* ------------------------- inline editing ------------------------- */
  useEffect(() => {
    if (!editingId) {
      const t = setTimeout(() => setEditingRect(null), 0)
      return () => clearTimeout(t)
    }
    const layer = contentLayerRef.current
    const stage = stageRef.current
    if (!layer || !stage) return
    const node = layer.findOne(`#${editingId}`)
    if (!node) {
      const t = setTimeout(() => setEditingRect(null), 0)
      return () => clearTimeout(t)
    }
    const rect = node.getClientRect({ relativeTo: stage })
    const r = requestAnimationFrame(() => {
      setEditingRect({ left: rect.x, top: rect.y, width: Math.max(40, rect.width), height: Math.max(28, rect.height) })
    })
    return () => cancelAnimationFrame(r)
  }, [editingId, view.zoom, view.panX, view.panY, elements])

  const editingElement = useMemo(() => elements.find((el) => el.id === editingId), [elements, editingId])

  function commitEditing(value: string) {
    if (!editingElement) return
    const id = editingElement.id
    if (editingElement.type === "text") {
      const t = editingElement as TextElement
      if (value.trim() === "" && t.text.trim() === "") {
        onDeleteElements([id])
      } else {
        const measured = measureTextBlockHeight(
          { text: value, fontFamily: t.fontFamily, fontSize: t.fontSize, fontWeight: t.fontWeight, italic: false, uppercase: false, lineHeight: 1.25, letterSpacing: 0 },
          t.width,
        )
        onUpdateElements([{ id, patch: { text: value, height: Math.max(t.height, measured) } as Partial<DesignElement> }])
      }
    } else if (editingElement.type === "sticky") {
      onUpdateElements([{ id, patch: { text: value } }])
    }
    onStartEditing(null)
    onSelect([id])
  }

  /* ------------------------- node plumbing ------------------------- */

  function handleSelect(el: DesignElement, additive: boolean) {
    onSelect([el.id], additive)
  }

  function onElementClick(e: KonvaEventObject<MouseEvent>, el: DesignElement) {
    e.cancelBubble = true
    if (voteMode && el.type === "sticky" && canEdit) {
      onVote(el.id)
      return
    }
    if (tool === "connector" && canEdit) {
      if (!connectorSourceId) {
        onConnectorSource(el.id)
      } else if (el.id !== connectorSourceId) {
        onCreateConnectorPublic(connectorSourceId, el.id)
      }
      return
    }
    if (tool === "select") handleSelect(el, e.evt.shiftKey)
  }

  function onCreateConnectorPublic(fromId: string, toId: string) {
    const from = boundsById.get(fromId)
    const to = boundsById.get(toId)
    if (!from || !to) {
      onConnectorSource(null)
      return
    }
    const a1 = anchorOnBounds(from, { x: to.x + to.width / 2, y: to.y + to.height / 2 })
    const a2 = anchorOnBounds(to, { x: from.x + from.width / 2, y: from.y + from.height / 2 })
    const el = createConnector({
      x: Math.min(a1.x, a2.x),
      y: Math.min(a1.y, a2.y),
      width: Math.abs(a2.x - a1.x),
      height: Math.abs(a2.y - a1.y),
      points: [a1.x, a1.y, a2.x, a2.y],
      fromId,
      toId,
      stroke: "#3f3f46",
      strokeWidth: 3,
      arrowHead: "arrow",
    })
    onAddElements([el])
    onConnectorSource(null)
  }

  function nodeHandlers(el: DesignElement) {
    const isBound = el.type === "connector" && !!(el as ConnectorElement).fromId && !!(el as ConnectorElement).toId
    return {
      id: el.id,
      elementId: el.id,
      visible: editingId !== el.id,
      draggable: canEdit && tool === "select" && !editingId && !voteMode && !el.locked && !isBound,
      listening: !el.locked,
      onClick: (e: KonvaEventObject<MouseEvent>) => onElementClick(e, el),
      onTap: (e: KonvaEventObject<TouchEvent>) => {
        e.cancelBubble = true
        if (voteMode && el.type === "sticky" && canEdit) onVote(el.id)
        else if (tool === "select") handleSelect(el, false)
      },
      onDblClick: (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true
        if (canEdit && tool === "select" && (el.type === "text" || el.type === "sticky")) onStartEditing(el.id)
      },
      onDblTap: (e: KonvaEventObject<TouchEvent>) => {
        e.cancelBubble = true
        if (canEdit && tool === "select" && (el.type === "text" || el.type === "sticky")) onStartEditing(el.id)
      },
      onDragStart: (e: KonvaEventObject<DragEvent>) => onDragStart(e, el),
      onDragMove: (e: KonvaEventObject<DragEvent>) => onDragMove(e, el),
      onDragEnd: (e: KonvaEventObject<DragEvent>) => onDragEnd(e, el),
    }
  }

  const baseTransform = (el: DesignElement) => ({
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
  })

  /* ------------------------- renderers ------------------------- */

  function renderShape(el: ShapeElement) {
    return (
      <KPath
        {...baseTransform(el)}
        {...nodeHandlers(el)}
        data={shapePathData(el.variant, el.width, el.height, el.cornerRadius)}
        fill={el.fill === "transparent" ? undefined : el.fill}
        stroke={el.stroke === "transparent" || el.strokeWidth === 0 ? undefined : el.stroke}
        strokeWidth={el.strokeWidth}
        shadowColor={el.shadow?.color}
        shadowBlur={el.shadow?.blur ?? 0}
      />
    )
  }

  function renderSticky(el: StickyElement) {
    const votes = voteCountOf(el)
    return (
      <Group {...baseTransform(el)} {...nodeHandlers(el)}>
        <Rect width={el.width} height={el.height} cornerRadius={6} fill={el.color} shadowColor="rgba(0,0,0,0.2)" shadowBlur={10} shadowOffsetY={4} listening={false} />
        <KText text={el.text} width={el.width} height={el.height} padding={14} fontSize={el.fontSize} fontFamily={el.fontFamily} lineHeight={1.3} fill="#1f2937" listening={false} />
        {votes > 0 ? (
          <Group x={el.width - 16} y={-12} listening={false}>
            <Circle radius={13} fill="#8b5cf6" stroke="#ffffff" strokeWidth={2} />
            <KText text={String(votes)} width={26} height={26} x={-13} y={-13} align="center" verticalAlign="middle" fontSize={12} fontFamily="Inter" fontStyle="bold" fill="#ffffff" listening={false} />
          </Group>
        ) : null}
      </Group>
    )
  }

  function renderFreehand(el: Extract<DesignElement, { type: "freehand" }>) {
    const pts: number[] = []
    for (let i = 0; i < el.points.length; i += 2) pts.push(el.points[i] - el.x, el.points[i + 1] - el.y)
    return (
      <KLine
        {...baseTransform(el)}
        {...nodeHandlers(el)}
        points={pts}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={Math.max(12, el.strokeWidth * 2)}
      />
    )
  }

  function renderConnector(el: ConnectorElement) {
    const resolved = resolveConnector(el, boundsById)
    const x = resolved ? resolved.x : el.x
    const y = resolved ? resolved.y : el.y
    const abs = resolved ? resolved.points : el.points && el.points.length >= 4 ? el.points : [el.x, el.y, el.x + el.width, el.y + el.height]
    const rel: number[] = []
    for (let i = 0; i < abs.length; i += 2) rel.push(abs[i] - x, abs[i + 1] - y)
    return (
      <KArrow
        x={x}
        y={y}
        rotation={el.rotation}
        opacity={el.opacity}
        {...nodeHandlers(el)}
        points={rel}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        fill={el.stroke}
        pointerLength={el.arrowHead === "arrow" ? Math.max(8, el.strokeWidth * 3.2) : 0}
        pointerWidth={el.arrowHead === "arrow" ? Math.max(8, el.strokeWidth * 3.2) : 0}
        dash={el.dash ?? undefined}
        lineCap="round"
        hitStrokeWidth={Math.max(12, el.strokeWidth * 2)}
      />
    )
  }

  function renderFrame(el: FrameElement) {
    return (
      <Group {...baseTransform(el)} {...nodeHandlers(el)}>
        <Rect width={el.width} height={el.height} cornerRadius={el.cornerRadius} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} dash={[10, 7]} listening={false} />
        {el.label ? (
          <KText text={el.label} width={el.width} x={0} y={10} align="center" fontSize={Math.max(14, Math.min(24, el.width / 14))} fontFamily="Inter" fontStyle="600" fill="rgba(60,60,70,0.75)" listening={false} />
        ) : null}
      </Group>
    )
  }

  function renderElement(el: DesignElement) {
    if (el.hidden) return null
    switch (el.type) {
      case "sticky":
        return renderSticky(el)
      case "freehand":
        return renderFreehand(el)
      case "connector":
        return renderConnector(el)
      case "frame":
        return renderFrame(el)
      case "shape":
        return renderShape(el)
      case "text": {
        const t = el as TextElement
        return (
          <KText
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            text={t.text}
            width={t.width}
            height={t.height}
            fontSize={t.fontSize}
            fontFamily={t.fontFamily}
            fontStyle={`${t.italic ? "italic " : ""}${t.fontWeight >= 600 ? "bold" : "normal"}`}
            align={t.align}
            verticalAlign={t.vAlign ?? "top"}
            lineHeight={t.lineHeight}
            fill={t.color}
            padding={2}
          />
        )
      }
      case "image": {
        const proc = images[el.id]
        if (!proc) return null
        const img = el as ImageElement
        return <KImage {...baseTransform(el)} {...nodeHandlers(el)} image={proc.source} width={img.width} height={img.height} cornerRadius={img.cornerRadius} />
      }
      default:
        return null
    }
  }

  const zoom = view.zoom
  const boardBg = page.background.type === "solid" ? page.background.color ?? "#f8f7f4" : "#f8f7f4"
  const dotSize = GRID_SIZE * zoom

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full select-none overflow-hidden"
      style={{
        backgroundColor: boardBg,
        backgroundImage: "radial-gradient(circle, rgba(113,113,122,0.35) 1px, transparent 1px)",
        backgroundSize: `${dotSize}px ${dotSize}px`,
        backgroundPosition: `${view.panX}px ${view.panY}px`,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onMouseDown={onStageMouseDown}
        onMouseMove={onStageMouseMove}
        onMouseUp={onStageMouseUp}
        onMouseLeave={onStageMouseUp}
        onTouchStart={onStageTouchStart}
        onTouchMove={onStageTouchMove}
        onTouchEnd={onStageTouchEnd}
        onWheel={onWheel}
      >
        <Layer ref={contentLayerRef} x={view.panX} y={view.panY} scaleX={zoom} scaleY={zoom}>
          {elements.map((el) => (el.type === "frame" ? <Fragment key={el.id}>{renderElement(el)}</Fragment> : null))}
          {elements.map((el) => (el.type !== "frame" ? <Fragment key={el.id}>{renderElement(el)}</Fragment> : null))}
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            resizeEnabled={false}
            borderStroke="#8b5cf6"
            borderStrokeWidth={2}
            anchorSize={0}
            padding={4}
            ignoreStroke
          />
        </Layer>
        <Layer ref={overlayLayerRef} x={view.panX} y={view.panY} scaleX={zoom} scaleY={zoom} listening={false}>
          <Rect ref={marqueeRef} visible={false} fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" strokeWidth={1 / zoom} dash={[4 / zoom, 3 / zoom]} />
        </Layer>
        <Layer ref={fxLayerRef} x={view.panX} y={view.panY} scaleX={zoom} scaleY={zoom} listening={false} />
      </Stage>

      {/* inline text editor overlay */}
      {editingId && editingRect && editingElement && (editingElement.type === "text" || editingElement.type === "sticky") ? (
        <textarea
          autoFocus
          defaultValue={(editingElement as TextElement).text}
          onBlur={(e) => commitEditing(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              commitEditing((e.target as HTMLTextAreaElement).value)
            }
            e.stopPropagation()
          }}
          aria-label="Edit text"
          className="absolute z-20 resize-none overflow-hidden rounded-sm border-2 border-primary bg-white/95 p-0 shadow-lg outline-none"
          style={{
            left: editingRect.left,
            top: editingRect.top,
            width: editingRect.width,
            height: editingRect.height,
            fontFamily: (editingElement as TextElement).fontFamily,
            fontSize: (editingElement as TextElement).fontSize * zoom,
            fontWeight: (editingElement as TextElement).fontWeight,
            lineHeight: (editingElement as TextElement).type === "text" ? 1.25 : 1.3,
            color: "#1f2937",
            background: editingElement.type === "sticky" ? (editingElement as StickyElement).color : undefined,
            padding: editingElement.type === "sticky" ? 12 * zoom : 2,
            transformOrigin: "top left",
          }}
        />
      ) : null}
    </div>
  )
}
