"use client"

/**
 * StageView — the interactive Konva canvas.
 *
 *  • pan (space+drag, middle-drag, wheel, two-finger touch) & zoom (ctrl+wheel,
 *    pinch, buttons via api.setView)
 *  • click / shift-click / rubber-band multi-select, group-aware selection
 *  • dragging with snapping (page center/edges, element edges+centers, grid)
 *    and live guide lines (imperatively drawn — no setState in the hot path)
 *  • rotate/resize via Transformer, group members move together
 *  • double-click inline text editing (overlay textarea)
 *  • right-click & long-press context menu trigger
 */

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react"
import Konva from "konva"
import {
  Arrow as KArrow,
  Group,
  Image as KImage,
  Layer,
  Line as KLine,
  Path as KPath,
  Rect,
  Shape as KShape,
  Stage,
  Text as KText,
  Transformer,
} from "react-konva"
import type { DesignElement, ShapeElement, TextElement } from "@/lib/design/types"
import { ICON_LIBRARY } from "@/lib/design/icons"
import { computeSnap, type GuideLine } from "@/lib/editor/snapping"
import { layoutChart } from "@/lib/editor/charts"
import { measureTextBlockHeight, shapePathData, lineGeometry } from "@/lib/editor/geometry"
import type { CanvasApi, ElementPatch } from "./ui"
import { useProcessedImages, useQrImages } from "./use-canvas-assets"

const MIN_ZOOM = 0.04
const MAX_ZOOM = 8

interface StageViewProps {
  api: CanvasApi
  editingId: string | null
  onViewportResize: (w: number, h: number) => void
  onContextMenu: (screenX: number, screenY: number, elementId: string | null) => void
}

interface DragState {
  id: string
  groupId?: string
  orig: Map<string, { x: number; y: number }>
}

export function StageView({ api, editingId, onViewportResize, onContextMenu }: StageViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const contentLayerRef = useRef<Konva.Layer>(null)
  const overlayLayerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const marqueeRef = useRef<Konva.Rect>(null)

  const [size, setSize] = useState({ w: 800, h: 600 })
  const [editingRect, setEditingRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  const dragState = useRef<DragState | null>(null)
  const panState = useRef<{ active: boolean; lastX: number; lastY: number } | null>(null)
  const spaceDown = useRef(false)
  const marquee = useRef<{ active: boolean; startX: number; startY: number; additive: boolean } | null>(null)
  const longPress = useRef<{ timer: ReturnType<typeof setTimeout> | null; x: number; y: number; targetId: string | null } | null>(null)
  const gestureCommit = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewRef = useRef(api.view)
  useEffect(() => {
    viewRef.current = api.view
  }, [api.view])

  // unmount hygiene: drop pending gesture/long-press timers so they can never
  // fire into a torn-down stage (their closures are released immediately)
  useEffect(() => {
    return () => {
      if (gestureCommit.current) clearTimeout(gestureCommit.current)
      if (longPress.current?.timer) clearTimeout(longPress.current.timer)
    }
  }, [])

  const { doc, page, canEdit, selectedIds } = api
  const elements = page.elements
  const images = useProcessedImages(elements, page.background)
  const qrImages = useQrImages(elements)

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

  /* ------------------------- guides (imperative) ------------------------- */
  const drawGuides = useCallback((guides: GuideLine[]) => {
    const layer = overlayLayerRef.current
    if (!layer) return
    layer.destroyChildren()
    for (const g of guides) {
      const line = new Konva.Line({
        points: g.axis === "v" ? [g.pos, g.from, g.pos, g.to] : [g.from, g.pos, g.to, g.pos],
        stroke: "#ec4899",
        strokeWidth: 1 / (viewRef.current.zoom || 1),
        dash: [4 / (viewRef.current.zoom || 1), 4 / (viewRef.current.zoom || 1)],
        listening: false,
      })
      layer.add(line)
    }
    layer.batchDraw()
  }, [])

  const clearGuides = useCallback(() => {
    const layer = overlayLayerRef.current
    if (!layer) return
    layer.destroyChildren()
    layer.batchDraw()
  }, [])

  /* ------------------------- transformer sync ------------------------- */
  useEffect(() => {
    const layer = contentLayerRef.current
    const tr = trRef.current
    if (!layer || !tr) return
    const nodes = layer.getChildren((n: Konva.Node) => n.getAttr("elementId") && selectedIds.includes(String(n.getAttr("elementId"))))
    tr.nodes(nodes as Konva.Node[])
    tr.getLayer()?.batchDraw()
  }, [selectedIds, elements, size])

  /* ------------------------- keyboard: space pan cursor ------------------------- */
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

  /* ------------------------- commit gesture (pan/zoom) ------------------------- */
  const commitGesture = useCallback(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    if (gestureCommit.current) clearTimeout(gestureCommit.current)
    gestureCommit.current = setTimeout(() => {
      api.setView({
        zoom: layer.scaleX(),
        panX: layer.x(),
        panY: layer.y(),
      })
    }, 140)
  }, [api])

  /* keep layer transform in sync with view state when it changes externally */
  useEffect(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    layer.position({ x: api.view.panX, y: api.view.panY })
    layer.scale({ x: api.view.zoom, y: api.view.zoom })
    layer.batchDraw()
  }, [api.view.zoom, api.view.panX, api.view.panY])

  /* ------------------------- element handlers ------------------------- */

  const memberIdsOf = useCallback(
    (el: DesignElement): string[] => {
      if (!el.groupId) return [el.id]
      return elements.filter((m) => m.groupId === el.groupId).map((m) => m.id)
    },
    [elements],
  )

  const handleSelect = useCallback(
    (el: DesignElement, additive: boolean) => {
      const ids = el.groupId ? memberIdsOf(el) : [el.id]
      api.selectIds(ids, additive)
    },
    [api, memberIdsOf],
  )

  function onDragStart(e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) {
    const layer = contentLayerRef.current
    if (!layer) return
    const orig = new Map<string, { x: number; y: number }>()
    for (const id of memberIdsOf(el)) {
      const node = layer.findOne(`#${id}`)
      if (node) orig.set(id, { x: node.x(), y: node.y() })
    }
    dragState.current = { id: el.id, groupId: el.groupId, orig }
  }

  function onDragMove(e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) {
    const node = e.target
    const layer = contentLayerRef.current
    if (!layer) return
    const zoom = layer.scaleX() || 1
    const selectedSet = new Set(memberIdsOf(el))
    const others = elements
      .filter((o) => !o.hidden && !selectedSet.has(o.id))
      .map((o) => ({ id: o.id, x: o.x, y: o.y, width: o.width, height: o.height }))
    const snap = computeSnap(
      { id: el.id, x: node.x(), y: node.y(), width: el.width, height: el.height },
      others,
      {
        threshold: 6 / zoom,
        gridSize: api.view.snapToGrid ? api.view.gridSize : null,
        pageW: doc.width,
        pageH: doc.height,
      },
    )
    node.position({ x: node.x() + snap.dx, y: node.y() + snap.dy })
    drawGuides(snap.guides)

    const st = dragState.current
    if (st && el.groupId) {
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
    }
    layer.batchDraw()
  }

  function onDragEnd(e: Konva.KonvaEventObject<DragEvent>, el: DesignElement) {
    const node = e.target
    const patches: ElementPatch[] = []
    const st = dragState.current
    if (st && el.groupId) {
      const orig = st.orig.get(el.id)
      if (orig) {
        const dx = node.x() - orig.x
        const dy = node.y() - orig.y
        for (const [id, o] of st.orig) {
          if (id === el.id) patches.push({ id, patch: { x: Math.round(node.x()), y: Math.round(node.y()) } })
          else patches.push({ id, patch: { x: Math.round(o.x + dx), y: Math.round(o.y + dy) } })
        }
      }
    } else {
      patches.push({ id: el.id, patch: { x: Math.round(node.x()), y: Math.round(node.y()) } })
    }
    dragState.current = null
    clearGuides()
    api.updateElements(patches)
  }

  function onTransformEnd(e: Konva.KonvaEventObject<Event>, el: DesignElement) {
    const node = e.target
    const sx = node.scaleX()
    const sy = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    let width = Math.max(8, el.width * sx)
    let height = Math.max(8, el.height * sy)
    const patch: Record<string, unknown> = {
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: Math.round(width),
      height: Math.round(height),
      rotation: Math.round(node.rotation() * 10) / 10,
    }
    if (el.type === "text") {
      // keep font size constant while resizing the box; grow stored height if needed
      const t = el as TextElement
      const measured = measureTextBlockHeight(
        {
          text: t.text,
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          italic: t.italic,
          uppercase: t.uppercase,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          listStyle: t.listStyle,
        },
        patch.width as number,
      )
      patch.height = Math.max(measured, Math.round(height))
    }
    api.updateElements([{ id: el.id, patch: patch as Partial<DesignElement> }])
  }

  /* ------------------------- stage interactions ------------------------- */

  const getStagePos = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current
    if (!stage) return null
    const p = stage.getPointerPosition()
    return p ? { x: p.x, y: p.y } : null
  }, [])

  function beginPan(x: number, y: number) {
    panState.current = { active: true, lastX: x, lastY: y }
    if (wrapRef.current) wrapRef.current.style.cursor = "grabbing"
  }

  function movePan(x: number, y: number) {
    const layer = contentLayerRef.current
    const pan = panState.current
    if (!layer || !pan?.active) return
    layer.position({ x: layer.x() + (x - pan.lastX), y: layer.y() + (y - pan.lastY) })
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

  function onStageMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current
    if (!stage) return
    const pos = getStagePos()
    if (!pos) return
    const middleButton = e.evt.button === 1
    if (spaceDown.current || middleButton) {
      e.evt.preventDefault()
      beginPan(pos.x, pos.y)
      return
    }
    if (e.target === stage && canEdit) {
      // begin rubber-band selection
      const layer = contentLayerRef.current
      const rel = layer ? layer.getRelativePointerPosition() : null
      marquee.current = { active: true, startX: rel?.x ?? 0, startY: rel?.y ?? 0, additive: e.evt.shiftKey }
      const m = marqueeRef.current
      if (m) {
        m.position({ x: rel?.x ?? 0, y: rel?.y ?? 0 })
        m.size({ width: 0, height: 0 })
        m.visible(true)
        m.getLayer()?.batchDraw()
      }
    } else if (e.target === stage) {
      api.selectIds([])
    }
  }

  function onStageMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    const pos = getStagePos()
    if (!pos) return
    if (panState.current?.active) {
      movePan(pos.x, pos.y)
      return
    }
    const mq = marquee.current
    const m = marqueeRef.current
    if (mq?.active && m) {
      const layer = contentLayerRef.current
      const rel = layer ? layer.getRelativePointerPosition() : null
      if (!rel) return
      m.position({ x: Math.min(mq.startX, rel.x), y: Math.min(mq.startY, rel.y) })
      m.size({ width: Math.abs(rel.x - mq.startX), height: Math.abs(rel.y - mq.startY) })
      m.getLayer()?.batchDraw()
    }
    void e
  }

  function onStageMouseUp() {
    if (panState.current?.active) {
      endPan()
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
          .filter((el) => !el.hidden && !el.locked)
          .filter((el) => el.x < box.x + box.width && el.x + el.width > box.x && el.y < box.y + box.height && el.y + el.height > box.y)
          .flatMap((el) => (el.groupId ? memberIdsOf(el) : [el.id]))
        api.selectIds(Array.from(new Set(hits)), mq.additive)
      } else if (!mq.additive) {
        // simple click on empty canvas clears the selection
        api.selectIds([])
      }
    }
  }

  /* touch: pinch zoom + pan, long-press context menu */
  const touchGesture = useRef<{ startDist: number; startScale: number; startCenter: { x: number; y: number }; startLayerPos: { x: number; y: number } } | null>(null)

  function onStageTouchStart(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current
    if (!stage) return
    const touches = e.evt.touches
    const pos = getStagePos()
    // long-press
    if (pos && touches.length === 1) {
      const targetId = e.target === stage ? null : String((e.target as Konva.Node).getAttr("elementId") ?? "")
      longPress.current = {
        timer: setTimeout(() => {
          longPress.current = null
          onContextMenu(pos.x + (stage.container().getBoundingClientRect().left), pos.y + (stage.container().getBoundingClientRect().top), targetId)
          if (navigator.vibrate) navigator.vibrate(10)
        }, 600),
        x: pos.x,
        y: pos.y,
        targetId,
      }
    }
    if (touches.length === 2) {
      if (longPress.current?.timer) clearTimeout(longPress.current.timer)
      const [a, b] = [touches[0], touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const layer = contentLayerRef.current
      touchGesture.current = {
        startDist: dist || 1,
        startScale: layer?.scaleX() ?? 1,
        startCenter: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
        startLayerPos: { x: layer?.x() ?? 0, y: layer?.y() ?? 0 },
      }
    } else if (e.target === stage) {
      if (pos) beginPan(pos.x, pos.y)
    }
  }

  function onStageTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const stage = stageRef.current
    const pos = getStagePos()
    if (longPress.current && pos) {
      const moved = Math.hypot(pos.x - longPress.current.x, pos.y - longPress.current.y)
      if (moved > 8 && longPress.current.timer) {
        clearTimeout(longPress.current.timer)
        longPress.current = null
      }
    }
    const touches = e.evt.touches
    const layer = contentLayerRef.current
    if (touches.length === 2 && layer && touchGesture.current) {
      e.evt.preventDefault()
      const [a, b] = [touches[0], touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const scale = clamp(touchGesture.current.startScale * (dist / touchGesture.current.startDist), MIN_ZOOM, MAX_ZOOM)
      const rect = stage!.container().getBoundingClientRect()
      const cx = touchGesture.current.startCenter.x - rect.left
      const cy = touchGesture.current.startCenter.y - rect.top
      const g = touchGesture.current
      const docX = (cx - g.startLayerPos.x) / g.startScale
      const docY = (cy - g.startLayerPos.y) / g.startScale
      const curCenterX = (a.clientX + b.clientX) / 2 - rect.left
      const curCenterY = (a.clientY + b.clientY) / 2 - rect.top
      layer.scale({ x: scale, y: scale })
      layer.position({ x: curCenterX - docX * scale, y: curCenterY - docY * scale })
      layer.batchDraw()
      commitGesture()
      return
    }
    if (pos && panState.current?.active) movePan(pos.x, pos.y)
  }

  function onStageTouchEnd() {
    if (longPress.current?.timer) {
      clearTimeout(longPress.current.timer)
      longPress.current = null
    }
    touchGesture.current = null
    endPan()
  }

  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    const layer = contentLayerRef.current
    const stage = stageRef.current
    if (!layer || !stage) return
    e.evt.preventDefault()
    const pos = stage.getPointerPosition()
    if (!pos) return
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = layer.scaleX()
      const newScale = clamp(oldScale * Math.exp(-e.evt.deltaY * 0.0016), MIN_ZOOM, MAX_ZOOM)
      const docX = (pos.x - layer.x()) / oldScale
      const docY = (pos.y - layer.y()) / oldScale
      layer.scale({ x: newScale, y: newScale })
      layer.position({ x: pos.x - docX * newScale, y: pos.y - docY * newScale })
      layer.batchDraw()
      commitGesture()
    } else {
      layer.position({ x: layer.x() - e.evt.deltaX, y: layer.y() - e.evt.deltaY })
      layer.batchDraw()
      commitGesture()
    }
  }

  function onStageContextMenu(e: Konva.KonvaEventObject<PointerEvent>) {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const targetId = e.target === stage ? null : String((e.target as Konva.Node).getAttr("elementId") ?? "")
    if (targetId) {
      const el = elements.find((x) => x.id === targetId)
      if (el && !selectedIds.includes(el.id)) handleSelect(el, false)
    } else {
      api.selectIds([])
    }
    onContextMenu(e.evt.clientX, e.evt.clientY, targetId)
  }

  /* ------------------------- inline text editing ------------------------- */
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
  }, [editingId, api.view.zoom, api.view.panX, api.view.panY])

  const editingElement = useMemo(() => elements.find((el) => el.id === editingId), [elements, editingId])

  function commitEditing(value: string) {
    if (!editingElement) return
    const id = editingElement.id
    if (editingElement.type === "text" || editingElement.type === "sticky") {
      const t = editingElement as TextElement
      const measured = measureTextBlockHeight(
        {
          text: value,
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          italic: t.italic,
          uppercase: t.uppercase,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          listStyle: t.listStyle,
        },
        t.width,
      )
      api.updateElements([{ id, patch: { text: value, height: Math.max(t.height, measured) } as Partial<DesignElement> }])
    }
    api.selectIds([id])
  }

  /* ------------------------- node props ------------------------- */

  const nodeHandlers = (el: DesignElement) => ({
    id: el.id,
    elementId: el.id,
    visible: editingId !== el.id,
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true
      handleSelect(el, e.evt.shiftKey)
    },
    onTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true
      handleSelect(el, false)
    },
    onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true
      if (canEdit && (el.type === "text" || el.type === "sticky")) api.startInlineEdit(el.id)
    },
    onDblTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true
      if (canEdit && (el.type === "text" || el.type === "sticky")) api.startInlineEdit(el.id)
    },
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => onDragStart(e, el),
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(e, el),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onDragEnd(e, el),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => onTransformEnd(e, el),
  })

  const baseTransform = (el: DesignElement) => ({
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: canEdit && !el.locked && !editingId,
    listening: !el.locked,
  })

  /* ------------------------- renderers ------------------------- */

  function renderShape(el: ShapeElement) {
    if (el.variant === "line" || el.variant === "arrow") {
      const { x1, y1, x2, y2 } = lineGeometry(el.width, el.height)
      const color = el.fill === "transparent" ? el.stroke : el.fill
      if (el.variant === "arrow") {
        return (
          <KArrow
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            points={[x1, y1, x2, y2]}
            stroke={color}
            strokeWidth={Math.max(1, el.strokeWidth || 3)}
            fill={color}
            pointerLength={Math.max(8, (el.strokeWidth || 3) * 3.2)}
            pointerWidth={Math.max(8, (el.strokeWidth || 3) * 3.2)}
            lineCap="round"
            dash={el.dash ?? undefined}
            hitStrokeWidth={Math.max(12, el.strokeWidth * 2)}
          />
        )
      }
      return (
        <KLine
          {...baseTransform(el)}
          {...nodeHandlers(el)}
          points={[x1, y1, x2, y2]}
          stroke={color}
          strokeWidth={Math.max(1, el.strokeWidth || 3)}
          lineCap="round"
          dash={el.dash ?? undefined}
          hitStrokeWidth={Math.max(12, el.strokeWidth * 2)}
        />
      )
    }
    return (
      <KPath
        {...baseTransform(el)}
        {...nodeHandlers(el)}
        data={shapePathData(el.variant, el.width, el.height, el.cornerRadius)}
        fill={el.fill === "transparent" ? undefined : el.fill}
        stroke={el.stroke === "transparent" || el.strokeWidth === 0 ? undefined : el.stroke}
        strokeWidth={el.strokeWidth}
        dash={el.dash ?? undefined}
        shadowColor={el.shadow?.color}
        shadowBlur={el.shadow?.blur ?? 0}
        shadowOffset={el.shadow ? { x: el.shadow.offsetX, y: el.shadow.offsetY } : undefined}
      />
    )
  }

  function renderElement(el: DesignElement) {
    if (el.hidden) return null
    switch (el.type) {
      case "text": {
        const t = el as TextElement
        return (
          <KText
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            text={t.uppercase ? t.text.toUpperCase() : t.text}
            width={t.width}
            height={t.height}
            fontSize={t.fontSize}
            fontFamily={t.fontFamily}
            fontStyle={`${t.italic ? "italic " : ""}${t.fontWeight >= 600 ? "bold" : "normal"}`}
            textDecoration={`${t.underline ? "underline " : ""}${t.strike ? "line-through" : ""}`.trim() || "normal"}
            align={t.align}
            verticalAlign={t.vAlign ?? "top"}
            lineHeight={t.lineHeight}
            letterSpacing={t.letterSpacing}
            fill={t.color}
            shadowColor={t.shadow?.color}
            shadowBlur={t.shadow?.blur ?? 0}
            shadowOffset={t.shadow ? { x: t.shadow.offsetX, y: t.shadow.offsetY } : undefined}
            stroke={t.stroke && t.stroke.width > 0 ? t.stroke.color : undefined}
            strokeWidth={t.stroke ? t.stroke.width : 0}
            fillAfterStrokeEnabled
            padding={2}
          />
        )
      }
      case "shape":
        return renderShape(el as ShapeElement)
      case "image": {
        const proc = images[el.id]
        if (!proc) return null
        const img = el as Extract<DesignElement, { type: "image" }>
        const crop = img.crop
        return (
          <KImage
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            image={proc.source}
            width={img.width}
            height={img.height}
            cornerRadius={img.cornerRadius}
            crop={crop ? { x: crop.x * proc.natW, y: crop.y * proc.natH, width: crop.width * proc.natW, height: crop.height * proc.natH } : undefined}
            scaleX={img.flipH ? -1 : 1}
            scaleY={img.flipV ? -1 : 1}
          />
        )
      }
      case "icon": {
        const icon = el as Extract<DesignElement, { type: "icon" }>
        const paths = iconPaths(icon.icon)
        if (!paths) return null
        const s = Math.min(icon.width, icon.height) / 24
        return (
          <Group {...baseTransform(el)} {...nodeHandlers(el)}>
            <Group scaleX={s} scaleY={s}>
              {paths.map((d, i) => (
                <KPath key={i} data={d} stroke={icon.color} strokeWidth={2} lineCap="round" lineJoin="round" listening={false} />
              ))}
            </Group>
          </Group>
        )
      }
      case "chart":
        return <ChartNode el={el as Extract<DesignElement, { type: "chart" }>} base={baseTransform(el)} handlers={nodeHandlers(el)} />
      case "qr": {
        const img = qrImages[el.id]
        return img ? <KImage {...baseTransform(el)} {...nodeHandlers(el)} image={img} width={el.width} height={el.height} /> : null
      }
      case "table":
        return <TableNode el={el as Extract<DesignElement, { type: "table" }>} base={baseTransform(el)} handlers={nodeHandlers(el)} />
      case "frame": {
        const f = el as Extract<DesignElement, { type: "frame" }>
        return (
          <Group {...baseTransform(el)} {...nodeHandlers(el)}>
            <Rect width={f.width} height={f.height} cornerRadius={f.cornerRadius} fill={f.fill === "transparent" ? undefined : f.fill} stroke={f.stroke === "transparent" || f.strokeWidth === 0 ? undefined : f.stroke} strokeWidth={f.strokeWidth} dash={[10, 7]} listening={false} />
            {f.label ? (
              <KText text={f.label} width={f.width} height={f.height} align="center" verticalAlign="middle" fontSize={Math.max(14, Math.min(24, f.width / 12))} fontFamily="Inter" fill="rgba(60,60,70,0.75)" listening={false} />
            ) : null}
          </Group>
        )
      }
      case "sticky": {
        const st = el as Extract<DesignElement, { type: "sticky" }>
        return (
          <Group {...baseTransform(el)} {...nodeHandlers(el)}>
            <Rect width={st.width} height={st.height} cornerRadius={6} fill={st.color} shadowColor="rgba(0,0,0,0.2)" shadowBlur={10} shadowOffsetY={4} listening={false} />
            <KText
              text={st.text}
              width={st.width}
              height={st.height}
              padding={14}
              fontSize={st.fontSize}
              fontFamily={st.fontFamily}
              lineHeight={1.3}
              fill="#1f2937"
              listening={false}
            />
          </Group>
        )
      }
      case "freehand": {
        const fh = el as Extract<DesignElement, { type: "freehand" }>
        const pts: number[] = []
        for (let i = 0; i < fh.points.length; i += 2) pts.push(fh.points[i] - fh.x, fh.points[i + 1] - fh.y)
        return (
          <KLine
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            points={pts}
            stroke={fh.stroke}
            strokeWidth={fh.strokeWidth}
            lineCap="round"
            lineJoin="round"
            tension={0.3}
            globalCompositeOperation={fh.erase ? "destination-out" : undefined}
            hitStrokeWidth={Math.max(10, fh.strokeWidth * 2)}
          />
        )
      }
      case "connector": {
        const cn = el as Extract<DesignElement, { type: "connector" }>
        const pts = cn.points && cn.points.length >= 4 ? cn.points : [cn.x, cn.y, cn.x + cn.width, cn.y + cn.height]
        const rel: number[] = []
        for (let i = 0; i < pts.length; i += 2) rel.push(pts[i] - cn.x, pts[i + 1] - cn.y)
        return (
          <KArrow
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            points={rel}
            stroke={cn.stroke}
            strokeWidth={cn.strokeWidth}
            fill={cn.stroke}
            pointerLength={cn.arrowHead === "arrow" ? Math.max(8, cn.strokeWidth * 3.2) : 0}
            pointerWidth={cn.arrowHead === "arrow" ? Math.max(8, cn.strokeWidth * 3.2) : 0}
            dash={cn.dash ?? undefined}
            lineCap="round"
            hitStrokeWidth={Math.max(12, cn.strokeWidth * 2)}
          />
        )
      }
      case "media": {
        return (
          <Group {...baseTransform(el)} {...nodeHandlers(el)}>
            <Rect width={el.width} height={el.height} cornerRadius={12} fill="rgba(120,120,140,0.18)" stroke="#6b7280" strokeWidth={1.5} dash={[8, 6]} listening={false} />
            <KText text="Media clip" width={el.width} height={el.height} align="center" verticalAlign="middle" fontSize={16} fontFamily="Inter" fontStyle="bold" fill="#6b7280" listening={false} />
          </Group>
        )
      }
      default: {
        // group or unknown — neutral placeholder
        return (
          <Rect
            {...baseTransform(el)}
            {...nodeHandlers(el)}
            width={el.width}
            height={el.height}
            fill="rgba(139,92,246,0.14)"
            stroke="#8b5cf6"
            strokeWidth={2}
            dash={[6, 4]}
          />
        )
      }
    }
  }

  const zoom = api.view.zoom

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#f8fafc_0%_50%)] bg-[length:22px_22px]"
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
        onContextMenu={onStageContextMenu}
        onWheel={onWheel}
      >
        <Layer ref={contentLayerRef} x={api.view.panX} y={api.view.panY} scaleX={zoom} scaleY={zoom}>
          {/* page background */}
          <Rect id="__pagebg" width={doc.width} height={doc.height} fill={page.background.type === "solid" ? page.background.color ?? "#ffffff" : page.background.type === "transparent" ? undefined : "#ffffff"} listening={false} />
          {page.background.type === "gradient" && page.background.gradient ? (
            <Rect
              width={doc.width}
              height={doc.height}
              listening={false}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={gradientEnd(page.background.gradient.angle, doc.width, doc.height)}
              fillLinearGradientColorStops={[0, page.background.gradient.from, 1, page.background.gradient.to]}
            />
          ) : null}
          {page.background.type === "image" && images["__pagebg__"] ? (
            <BgImage info={images["__pagebg__"]} width={doc.width} height={doc.height} />
          ) : null}
          {api.view.showGrid ? <GridShape width={doc.width} height={doc.height} gridSize={api.view.gridSize} /> : null}
          {elements.map((el) => (
            <Fragment key={el.id}>{renderElement(el)}</Fragment>
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            flipEnabled={false}
            anchorSize={11}
            anchorCornerRadius={3}
            borderStroke="#8b5cf6"
            anchorStroke="#8b5cf6"
            anchorFill="#ffffff"
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
          />
        </Layer>
        <Layer ref={overlayLayerRef} x={api.view.panX} y={api.view.panY} scaleX={zoom} scaleY={zoom} listening={false}>
          {api.view.showSafe ? (
            <Rect
              x={doc.width * 0.1}
              y={doc.height * 0.1}
              width={doc.width * 0.8}
              height={doc.height * 0.8}
              stroke="rgba(236,72,153,0.55)"
              dash={[8, 6]}
              strokeWidth={1.5 / zoom}
            />
          ) : null}
          <Rect ref={marqueeRef} visible={false} fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" strokeWidth={1 / zoom} dash={[4 / zoom, 3 / zoom]} />
        </Layer>
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
            lineHeight: (editingElement as TextElement).lineHeight,
            color: (editingElement as TextElement).type === "text" ? (editingElement as TextElement).color : "#1f2937",
            textAlign: (editingElement as TextElement).type === "text" ? (editingElement as TextElement).align : "left",
            background: editingElement.type === "sticky" ? (editingElement as Extract<DesignElement, { type: "sticky" }>).color : undefined,
            padding: editingElement.type === "sticky" ? 12 * zoom : 2,
            transformOrigin: "top left",
          }}
        />
      ) : null}
    </div>
  )
}

/* ------------------------------ helpers ------------------------------ */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function isTextEntry(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
}

function gradientEnd(angleDeg: number, w: number, h: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  const dx = Math.cos(a)
  const dy = Math.sin(a)
  const len = Math.abs(dx) * w + Math.abs(dy) * h
  return { x: w / 2 + (dx * len) / 2, y: h / 2 + (dy * len) / 2 }
}

/** Icon path data (cached) from the shared ICON_LIBRARY. */
const iconPathCache = new Map<string, string[] | null>()
function iconPaths(name: string): string[] | null {
  if (iconPathCache.has(name)) return iconPathCache.get(name) ?? null
  const def = ICON_LIBRARY[name]
  iconPathCache.set(name, def ? def.paths : null)
  return def ? def.paths : null
}

function BgImage({ info, width, height }: { info: { source: HTMLCanvasElement | HTMLImageElement; natW: number; natH: number }; width: number; height: number }) {
  if (!info.natW || !info.natH) return null
  const ratio = Math.max(width / info.natW, height / info.natH)
  const dw = info.natW * ratio
  const dh = info.natH * ratio
  return <KImage image={info.source} x={(width - dw) / 2} y={(height - dh) / 2} width={dw} height={dh} listening={false} />
}

function GridShape({ width, height, gridSize }: { width: number; height: number; gridSize: number }) {
  return (
    <KShape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath()
        for (let x = gridSize; x < width; x += gridSize) {
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
        }
        for (let y = gridSize; y < height; y += gridSize) {
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
        }
        ctx.setAttr("strokeStyle", "rgba(100,100,130,0.18)")
        ctx.setAttr("lineWidth", 1)
        ctx.stroke()
      }}
      listening={false}
    />
  )
}

function ChartNode({ el, base, handlers }: { el: Extract<DesignElement, { type: "chart" }>; base: Record<string, unknown>; handlers: Record<string, unknown> }) {
  const items = useMemo(() => layoutChart(el), [el])
  return (
    <Group {...base} {...handlers}>
      <Rect width={el.width} height={el.height} fill="#ffffff" cornerRadius={8} listening={false} />
      {items.map((p, i) => {
        if (p.kind === "rect") {
          return <Rect key={i} x={p.x} y={p.y} width={p.width} height={p.height} fill={p.fill} cornerRadius={p.cornerRadius} listening={false} />
        }
        if (p.kind === "path") {
          return <KPath key={i} data={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.strokeWidth} listening={false} />
        }
        if (p.kind === "polyline") {
          return <KLine key={i} points={p.points} stroke={p.stroke} strokeWidth={p.strokeWidth} lineJoin="round" lineCap="round" listening={false} />
        }
        if (p.kind === "text") {
          return (
            <KText
              key={i}
              text={p.text}
              x={p.align === "center" ? p.x - 300 : p.align === "right" ? p.x - 600 : p.x}
              y={p.y - p.size}
              width={600}
              align={p.align}
              fontSize={p.size}
              fontFamily="Inter"
              fontStyle={p.weight && p.weight >= 600 ? "bold" : "normal"}
              fill={p.color}
              listening={false}
            />
          )
        }
        return <KLine key={i} points={[p.x1, p.y, p.x2, p.y]} stroke={p.stroke} strokeWidth={1} dash={p.dash} listening={false} />
      })}
    </Group>
  )
}

function TableNode({ el, base, handlers }: { el: Extract<DesignElement, { type: "table" }>; base: Record<string, unknown>; handlers: Record<string, unknown> }) {
  const cols = Math.max(...el.rows.map((r) => r.length), 1)
  const colW = el.width / cols
  const rowH = el.height / Math.max(1, el.rows.length)
  return (
    <Group {...base} {...handlers}>
      {el.rows.map((row, ri) =>
        row.map((cell, ci) => (
          <Group key={`${ri}-${ci}`} listening={false}>
            <Rect
              x={ci * colW}
              y={ri * rowH}
              width={colW}
              height={rowH}
              fill={el.headerRow && ri === 0 ? el.headerBg : ri % 2 === 1 ? el.altRowBg : el.rowBg}
              stroke={el.borderColor}
              strokeWidth={1}
            />
            <KText
              text={cell ?? ""}
              x={ci * colW + 8}
              y={ri * rowH}
              width={colW - 16}
              height={rowH}
              fontSize={el.fontSize}
              fontFamily={el.fontFamily}
              fontStyle={el.headerRow && ri === 0 ? "bold" : "normal"}
              fill={el.headerRow && ri === 0 ? el.headerColor : el.color}
              verticalAlign="middle"
              ellipsis
              wrap="none"
            />
          </Group>
        )),
      )}
    </Group>
  )
}
