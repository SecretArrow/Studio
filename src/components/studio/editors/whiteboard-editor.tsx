"use client"

/**
 * Whiteboard Editor
 * -----------------
 * Infinite-canvas whiteboard for doc.type "whiteboard".
 *
 * Owns: document state + history (undo/redo), selection, view (pan/zoom),
 * tools, templates, vote mode and the EditorHandle contract
 * (export PNG/PDF/JSON + getThumbnail, fitting the board's content bounds).
 * Rendering and interactions live in ./whiteboard/*; pure logic in
 * ./whiteboard/board-render.ts.
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ConnectorElement, DesignDoc, DesignElement, PageModel, ShapeVariant } from "@/lib/design/types"
import { createImage, uid } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { getThumbnail as renderThumbnail, renderPageToCanvas, exportDoc } from "@/lib/editor/export"
import { downloadBlob } from "@/lib/studio/api-client"
import type { EditorHandle, EditorProps, ExportRequest, ExportResult } from "./types"
import { useToast } from "@/hooks/use-toast"
import { BoardStage } from "./whiteboard/board-stage"
import { BoardMinimap } from "./whiteboard/board-minimap"
import { BoardToolbar, SelectionBar, TemplatesDialog, ZoomCluster, type AlignDir, type OrderDir } from "./whiteboard/board-toolbar"
import type { BoardTemplate } from "./whiteboard/templates"
import {
  buildWhiteboardExportDoc,
  clampZoom,
  connectorsBoundTo,
  connectorPatchesFor,
  contentBounds,
  elementBounds,
  unionBounds,
  withVoteDelta,
  type BoardTool,
  type BoardView,
  type Bounds,
} from "./whiteboard/board-render"

/* ------------------------------ export helpers ------------------------------ */

function boardBounds(doc: DesignDoc, page: PageModel, mode: "content" | "full"): Bounds {
  if (mode === "full") return { x: 0, y: 0, width: doc.width, height: doc.height }
  const cb = contentBounds(page.elements)
  if (!cb) return { x: 0, y: 0, width: doc.width, height: doc.height }
  const pad = 48
  return {
    x: cb.x - pad,
    y: cb.y - pad,
    width: cb.width + pad * 2,
    height: cb.height + pad * 2,
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Canvas export failed"))
      },
      mime,
      quality,
    )
  })
}

export async function exportBoard(
  doc: DesignDoc,
  page: PageModel,
  req: ExportRequest,
  mode: "content" | "full" = "content",
): Promise<ExportResult[]> {
  const base = (req.filenameBase || "whiteboard").replace(/[^\w.-]+/g, "-")
  const bounds = boardBounds(doc, page, mode)
  const tempDoc = buildWhiteboardExportDoc(doc, page, bounds)
  const tempPage = tempDoc.pages[0]
  const scale = Math.max(0.1, Math.min(3, req.scale ?? 1))
  const results: ExportResult[] = []

  if (req.format === "json") {
    results.push({
      filename: `${base}.studio.json`,
      blob: new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }),
    })
    return results
  }

  if (req.format === "svg") {
    // the shared vector builder handles every element type (rasterizing exotic ones)
    return exportDoc(tempDoc, { ...req, filenameBase: base })
  }

  if (req.format === "pdf") {
    const { jsPDF } = await import("jspdf")
    const canvas = await renderPageToCanvas(tempDoc, tempPage, { scale: Math.min(2, Math.max(1, scale)) })
    const pdf = new jsPDF({
      orientation: bounds.width >= bounds.height ? "landscape" : "portrait",
      unit: "px",
      format: [Math.round(bounds.width), Math.round(bounds.height)],
      compress: true,
    })
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, tempDoc.width, tempDoc.height)
    results.push({ filename: `${base}.pdf`, blob: pdf.output("blob"), note: "Board exported to PDF (content bounds)." })
    return results
  }

  if (req.format === "zip") {
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    const canvas = await renderPageToCanvas(tempDoc, tempPage, { scale })
    zip.file(`${base}.png`, await canvasToBlob(canvas, "image/png"))
    zip.file("project.json", JSON.stringify(doc, null, 2))
    results.push({ filename: `${base}-board.zip`, blob: await zip.generateAsync({ type: "blob" }), note: "PNG + editable project file zipped." })
    return results
  }

  const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
  const canvas = await renderPageToCanvas(tempDoc, tempPage, {
    scale,
    transparent: req.transparent === true && (req.format === "png" || req.format === "webp"),
  })
  const blob = await canvasToBlob(canvas, mime, req.quality ?? 0.92)
  const ext = req.format === "jpeg" ? "jpg" : req.format
  results.push({ filename: `${base}.${ext}`, blob })
  return results
}

/* ------------------------------ component ------------------------------ */

const WhiteboardEditor = forwardRef<EditorHandle, EditorProps>(function WhiteboardEditor(
  { initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const canEdit = role === "owner" || role === "editor"
  const { toast } = useToast()

  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [view, setViewState] = useState<BoardView>({ zoom: 0.9, panX: 140, panY: 100 })
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [tool, setToolState] = useState<BoardTool>("select")
  const [penColor, setPenColor] = useState<string>("#111827")
  const [penWidth, setPenWidth] = useState(4)
  const [stickyColor, setStickyColor] = useState<string>("#fde68a")
  const [shapeVariant, setShapeVariant] = useState<ShapeVariant>("rect")
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [voteMode, setVoteMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [connectorSourceId, setConnectorSourceId] = useState<string | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  const docRef = useRef<DesignDoc>(initialDoc)
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  const viewportRef = useRef(viewport)
  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])
  const toolRef = useRef(tool)
  useEffect(() => {
    toolRef.current = tool
  }, [tool])

  const [history] = useState(() => new HistoryStore(initialDoc, 80))
  const clipboard = useRef<DesignElement[] | null>(null)
  const dirtyRef = useRef(false)
  const firstFitDone = useRef(false)

  const page: PageModel = doc.pages[0] ?? doc.pages[doc.pages.length - 1]
  const selection = useMemo(() => page.elements.filter((e) => selectedIds.includes(e.id)), [page, selectedIds])

  const syncHistoryState = useCallback(() => {
    setHistoryState({ canUndo: history.canUndo, canRedo: history.canRedo })
  }, [history])

  /* ------------------------- core mutations ------------------------- */

  const commit = useCallback(
    (next: DesignDoc, coalesceKey?: string) => {
      docRef.current = next
      dirtyRef.current = true
      setDoc(next)
      history.push(next, coalesceKey)
      syncHistoryState()
      onDocChange(next)
    },
    [history, onDocChange, syncHistoryState],
  )

  const mutatePage = useCallback(
    (fn: (p: PageModel) => PageModel, coalesceKey?: string) => {
      const prev = docRef.current
      const next: DesignDoc = {
        ...prev,
        pages: prev.pages.map((p, i) => (i === 0 ? fn(p) : p)),
      }
      commit(next, coalesceKey)
    },
    [commit],
  )

  const addElements = useCallback(
    (els: DesignElement[]): string[] => {
      if (!canEdit || els.length === 0) return []
      const ids = els.map((e) => e.id)
      mutatePage((p) => {
        // frames go to the back so they never cover their content
        const frames = els.filter((e) => e.type === "frame")
        const rest = els.filter((e) => e.type !== "frame")
        return { ...p, elements: [...frames, ...p.elements, ...rest] }
      })
      setSelectedIds(ids)
      return ids
    },
    [canEdit, mutatePage],
  )

  const updateElements = useCallback(
    (patches: { id: string; patch: Partial<DesignElement> }[], coalesceKey?: string) => {
      if (!canEdit || patches.length === 0) return
      const map = new Map(patches.map((p) => [p.id, p.patch]))
      mutatePage(
        (p) => ({
          ...p,
          elements: p.elements.map((el) => {
            const patch = map.get(el.id)
            return patch ? ({ ...el, ...patch } as DesignElement) : el
          }),
        }),
        coalesceKey,
      )
    },
    [canEdit, mutatePage],
  )

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (!canEdit || ids.length === 0) return
      const els = docRef.current.pages[0].elements
      const all = new Set([...ids, ...connectorsBoundTo(els, ids)])
      mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => !all.has(e.id)) }))
      setSelectedIds((prev) => prev.filter((id) => !all.has(id)))
      setEditingId(null)
    },
    [canEdit, mutatePage],
  )

  const cloneWithOffset = useCallback(
    (source: DesignElement[], idMap: Map<string, string>, dx: number, dy: number): DesignElement[] => {
      const clones = source.map((el) => ({ ...el, id: idMap.get(el.id)!, x: el.x + dx, y: el.y + dy }) as DesignElement)
      // keep bound connectors inside the cloned set wired to the clones
      for (let i = 0; i < source.length; i += 1) {
        const el = source[i]
        if (el.type !== "connector") continue
        const cn = el as ConnectorElement
        if (cn.fromId && cn.toId && idMap.has(cn.fromId) && idMap.has(cn.toId)) {
          const clone = clones[i] as ConnectorElement
          clone.fromId = idMap.get(cn.fromId)
          clone.toId = idMap.get(cn.toId)
        }
      }
      return clones
    },
    [],
  )

  const duplicateElements = useCallback(
    (ids: string[]) => {
      if (!canEdit || ids.length === 0) return
      const set = new Set(ids)
      const source = docRef.current.pages[0].elements.filter((e) => set.has(e.id))
      if (source.length === 0) return
      const idMap = new Map<string, string>()
      for (const el of source) idMap.set(el.id, uid("dup"))
      addElements(cloneWithOffset(source, idMap, 24, 24))
    },
    [addElements, canEdit, cloneWithOffset],
  )

  const copySelection = useCallback(
    (cut = false) => {
      if (selection.length === 0) return
      clipboard.current = JSON.parse(JSON.stringify(selection)) as DesignElement[]
      if (cut) deleteElements(selectedIds)
    },
    [deleteElements, selection, selectedIds],
  )

  const pasteClipboard = useCallback(() => {
    const clip = clipboard.current
    if (!canEdit || !clip || clip.length === 0) return
    const idMap = new Map<string, string>()
    for (const el of clip) idMap.set(el.id, uid("paste"))
    addElements(cloneWithOffset(clip, idMap, 24, 24))
  }, [addElements, canEdit, cloneWithOffset])

  const reorder = useCallback(
    (ids: string[], dir: OrderDir) => {
      if (!canEdit || ids.length === 0) return
      const set = new Set(ids)
      mutatePage((p) => {
        let elements = [...p.elements]
        if (dir === "front") {
          const picked = elements.filter((e) => set.has(e.id))
          elements = [...elements.filter((e) => !set.has(e.id)), ...picked]
        } else if (dir === "back") {
          const picked = elements.filter((e) => set.has(e.id))
          elements = [...picked, ...elements.filter((e) => !set.has(e.id))]
        } else if (dir === "forward") {
          for (let i = elements.length - 2; i >= 0; i -= 1) {
            if (set.has(elements[i].id) && !set.has(elements[i + 1].id)) {
              ;[elements[i], elements[i + 1]] = [elements[i + 1], elements[i]]
            }
          }
        } else {
          for (let i = 1; i < elements.length; i += 1) {
            if (set.has(elements[i].id) && !set.has(elements[i - 1].id)) {
              ;[elements[i], elements[i - 1]] = [elements[i - 1], elements[i]]
            }
          }
        }
        return { ...p, elements }
      })
    },
    [canEdit, mutatePage],
  )

  const alignSelected = useCallback(
    (dir: AlignDir) => {
      if (!canEdit || selection.length < 2) return
      const boxes = selection.map((el) => ({ el, b: elementBounds(el) }))
      const u = unionBounds(boxes.map((x) => x.b))
      if (!u) return
      const patches = boxes.map(({ el, b }) => {
        let tx = el.x
        let ty = el.y
        if (dir === "left") tx = el.x + (u.x - b.x)
        else if (dir === "right") tx = el.x + (u.x + u.width - (b.x + b.width))
        else if (dir === "hcenter") tx = el.x + (u.x + u.width / 2 - (b.x + b.width / 2))
        else if (dir === "top") ty = el.y + (u.y - b.y)
        else if (dir === "bottom") ty = el.y + (u.y + u.height - (b.y + b.height))
        else ty = el.y + (u.y + u.height / 2 - (b.y + b.height / 2))
        return { id: el.id, patch: { x: Math.round(tx), y: Math.round(ty) } }
      })
      // keep bound connectors attached
      const movedIds = patches.map((p) => p.id)
      updateElements(patches)
      const patched = docRef.current.pages[0].elements.map((el) => {
        const patch = patches.find((p) => p.id === el.id)
        return patch ? ({ ...el, x: patch.patch.x as number, y: patch.patch.y as number } as DesignElement) : el
      })
      const connPatches = connectorPatchesFor(patched, movedIds)
      if (connPatches.length > 0) updateElements(connPatches)
    },
    [canEdit, selection, updateElements],
  )

  const voteSticky = useCallback(
    (id: string) => {
      const el = docRef.current.pages[0].elements.find((e) => e.id === id)
      if (!el || el.type !== "sticky") return
      updateElements([{ id, patch: { name: withVoteDelta(el, 1) } }])
    },
    [updateElements],
  )

  const selectIds = useCallback((ids: string[], additive = false) => {
    setEditingId(null)
    setSelectedIds((prev) => {
      if (!additive) return ids
      const set = new Set(prev)
      for (const id of ids) {
        if (set.has(id)) set.delete(id)
        else set.add(id)
      }
      return Array.from(set)
    })
  }, [])

  /* ------------------------- undo / redo ------------------------- */

  const undo = useCallback(() => {
    const restored = history.undo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
    setSelectedIds((prev) => prev.filter((id) => restored.pages.some((p) => p.elements.some((e) => e.id === id))))
  }, [history, onDocChange, syncHistoryState])

  const redo = useCallback(() => {
    const restored = history.redo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
    setSelectedIds((prev) => prev.filter((id) => restored.pages.some((p) => p.elements.some((e) => e.id === id))))
  }, [history, onDocChange, syncHistoryState])

  /* ------------------------- view ------------------------- */

  const setTool = useCallback((t: BoardTool) => {
    setToolState(t)
    if (t !== "connector") setConnectorSourceId(null)
  }, [])

  const setView = useCallback((patch: Partial<BoardView>) => {
    setViewState((prev) => ({ ...prev, ...patch }))
  }, [])

  const onViewportResize = useCallback((w: number, h: number) => {
    setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
  }, [])

  const fitToContent = useCallback(() => {
    if (viewportRef.current.w <= 0 || viewportRef.current.h <= 0) return
    const d = docRef.current
    const cb = contentBounds(d.pages[0].elements)
    const pad = 80
    let bx = 0
    let by = 0
    let bw = d.width
    let bh = d.height
    if (cb) {
      bx = cb.x - pad
      by = cb.y - pad
      bw = cb.width + pad * 2
      bh = cb.height + pad * 2
    }
    const zoom = clampZoom(Math.min(viewportRef.current.w / bw, viewportRef.current.h / bh))
    setViewState({ zoom, panX: (viewportRef.current.w - bw * zoom) / 2 - bx * zoom, panY: (viewportRef.current.h - bh * zoom) / 2 - by * zoom })
  }, [])

  useEffect(() => {
    if (firstFitDone.current || viewport.w <= 0) return
    firstFitDone.current = true
    const t = setTimeout(() => fitToContent(), 0)
    return () => clearTimeout(t)
  }, [viewport, fitToContent])

  const setZoom = useCallback((z: number) => {
    const target = clampZoom(z)
    const v = viewRef.current
    const vp = viewportRef.current.w > 0 ? viewportRef.current : { w: 900, h: 600 }
    const docX = (vp.w / 2 - v.panX) / v.zoom
    const docY = (vp.h / 2 - v.panY) / v.zoom
    setViewState({ zoom: target, panX: vp.w / 2 - docX * target, panY: vp.h / 2 - docY * target })
  }, [])

  const zoomBy = useCallback(
    (factor: number) => {
      setZoom(viewRef.current.zoom * factor)
    },
    [setZoom],
  )

  const panTo = useCallback((docX: number, docY: number) => {
    const vp = viewportRef.current
    setViewState((prev) => ({ ...prev, panX: vp.w / 2 - docX * prev.zoom, panY: vp.h / 2 - docY * prev.zoom }))
  }, [])

  /* ------------------------- tools: image / templates / export ------------------------- */

  const onImageUpload = useCallback(
    (file: File) => {
      if (!canEdit) return
      const reader = new FileReader()
      reader.onload = () => {
        const src = String(reader.result)
        const img = new Image()
        img.onload = () => {
          const maxSide = 480
          const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
          const w = Math.max(40, Math.round((img.naturalWidth || maxSide) * ratio))
          const h = Math.max(40, Math.round((img.naturalHeight || maxSide) * ratio))
          const vp = viewportRef.current
          const v = viewRef.current
          const cx = (vp.w / 2 - v.panX) / v.zoom
          const cy = (vp.h / 2 - v.panY) / v.zoom
          addElements([createImage({ x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), src, width: w, height: h })])
        }
        img.onerror = () => {
          toast({ title: "Could not read that image", variant: "destructive" })
        }
        img.src = src
      }
      reader.onerror = () => {
        toast({ title: "Could not read that file", variant: "destructive" })
      }
      reader.readAsDataURL(file)
    },
    [addElements, canEdit, toast],
  )

  const insertTemplate = useCallback(
    (t: BoardTemplate) => {
      if (!canEdit) return
      const vp = viewportRef.current
      const v = viewRef.current
      const cx = (vp.w / 2 - v.panX) / v.zoom
      const cy = (vp.h / 2 - v.panY) / v.zoom
      const els = t.build({ x: Math.round(cx), y: Math.round(cy) })
      addElements(els)
      toast({ title: `${t.name} inserted`, description: "All elements are editable." })
    },
    [addElements, canEdit, toast],
  )

  const doExport = useCallback(
    async (req: ExportRequest, mode: "content" | "full" = "content") => {
      try {
        const results = await exportBoard(docRef.current, docRef.current.pages[0], req, mode)
        for (const r of results) downloadBlob(r.blob, r.filename)
        toast({ title: "Exported", description: results[0]?.note ?? results.map((r) => r.filename).join(", ") })
      } catch (err) {
        toast({ title: "Export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
      }
    },
    [toast],
  )

  /* ------------------------- keyboard ------------------------- */

  useEffect(() => {
    function isTextEntry(t: EventTarget | null): boolean {
      const el = t as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    function onKey(e: KeyboardEvent) {
      if (isTextEntry(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key
      if (key === "Escape") {
        if (connectorSourceId) setConnectorSourceId(null)
        else if (toolRef.current !== "select") setTool("select")
        else setSelectedIds([])
        return
      }
      if (mod && key.toLowerCase() === "a") {
        e.preventDefault()
        selectIds(page.elements.filter((el) => !el.locked && el.type !== "frame").map((el) => el.id))
        return
      }
      if (!canEdit) return
      if (mod && key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && (key.toLowerCase() === "y" || (key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (mod && key.toLowerCase() === "c") {
        e.preventDefault()
        copySelection(false)
        return
      }
      if (mod && key.toLowerCase() === "x") {
        e.preventDefault()
        copySelection(true)
        return
      }
      if (mod && key.toLowerCase() === "v") {
        e.preventDefault()
        pasteClipboard()
        return
      }
      if (mod && key.toLowerCase() === "d") {
        e.preventDefault()
        duplicateElements(selectedIds)
        return
      }
      if (mod && key === "]") {
        e.preventDefault()
        reorder(selectedIds, "front")
        return
      }
      if (mod && key === "[") {
        e.preventDefault()
        reorder(selectedIds, "back")
        return
      }
      if (key === "]") {
        reorder(selectedIds, "forward")
        return
      }
      if (key === "[") {
        reorder(selectedIds, "backward")
        return
      }
      if (key === "Delete" || key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault()
          deleteElements(selectedIds)
        }
        return
      }
      if (key.startsWith("Arrow") && selectedIds.length > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0
        const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0
        updateElements(
          selection.map((el) => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } })),
          "nudge",
        )
        return
      }
      if (mod) return
      // tool shortcuts
      const toolKeys: Record<string, BoardTool> = {
        v: "select",
        p: "pen",
        e: "eraser",
        s: "sticky",
        r: "shape",
        l: "line",
        a: "arrow",
        t: "text",
        c: "connector",
        f: "frame",
      }
      const t = toolKeys[key.toLowerCase()]
      if (t) {
        setTool(t)
        return
      }
      if (key === "+" || key === "=") {
        zoomBy(1.15)
        return
      }
      if (key === "-" || key === "_") {
        zoomBy(1 / 1.15)
        return
      }
      if (key === "0") {
        fitToContent()
        return
      }
      if (key === "1") {
        setZoom(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    canEdit, connectorSourceId, copySelection, deleteElements, duplicateElements, fitToContent, page.elements,
    pasteClipboard, redo, reorder, selectIds, selectedIds, selection, setTool, setZoom, undo, updateElements, zoomBy,
  ])

  /* ------------------------- editor handle ------------------------- */

  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req) => exportBoard(docRef.current, docRef.current.pages[0], req, "content"),
      getThumbnail: async () => {
        try {
          const d = docRef.current
          const bounds = boardBounds(d, d.pages[0], "content")
          const tempDoc = buildWhiteboardExportDoc(d, d.pages[0], bounds)
          return await renderThumbnail(tempDoc, tempDoc.pages[0])
        } catch {
          return null
        }
      },
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [registerHandle])

  const boardBg = doc.background.type === "solid" ? doc.background.color ?? "#f8f7f4" : "#f8f7f4"

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <BoardToolbar
        canEdit={canEdit}
        tool={tool}
        setTool={setTool}
        penColor={penColor}
        setPenColor={setPenColor}
        penWidth={penWidth}
        setPenWidth={setPenWidth}
        stickyColor={stickyColor}
        setStickyColor={setStickyColor}
        shapeVariant={shapeVariant}
        setShapeVariant={setShapeVariant}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
        voteMode={voteMode}
        setVoteMode={setVoteMode}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        undo={undo}
        redo={redo}
        onTemplates={() => setTemplatesOpen(true)}
        onExport={(kind) => {
          if (kind === "png-content") void doExport({ format: "png", scale: 2 }, "content")
          else if (kind === "png-full") void doExport({ format: "png", scale: 2 }, "full")
          else if (kind === "pdf") void doExport({ format: "pdf" }, "content")
          else void doExport({ format: "json" }, "content")
        }}
        onImageUpload={onImageUpload}
      />

      <div className="relative min-h-0 flex-1">
        <BoardStage
          doc={doc}
          page={page}
          canEdit={canEdit}
          selectedIds={selectedIds}
          view={view}
          tool={tool}
          penColor={penColor}
          penWidth={penWidth}
          stickyColor={stickyColor}
          shapeVariant={shapeVariant}
          snapToGrid={snapToGrid}
          voteMode={voteMode}
          editingId={editingId}
          connectorSourceId={connectorSourceId}
          onViewportResize={onViewportResize}
          onSelect={selectIds}
          onAddElements={addElements}
          onUpdateElements={updateElements}
          onDeleteElements={deleteElements}
          onSetView={setView}
          onStartEditing={setEditingId}
          onToolDone={() => setTool("select")}
          onConnectorSource={setConnectorSourceId}
          onVote={voteSticky}
        />

        {voteMode ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
            Vote mode — click sticky notes to add votes
          </div>
        ) : null}
        {connectorSourceId ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border bg-card px-3 py-1 text-xs font-medium shadow">
            Connecting — click a second element (Esc to cancel)
          </div>
        ) : null}

        <ZoomCluster
          zoom={view.zoom}
          onZoomIn={() => zoomBy(1.15)}
          onZoomOut={() => zoomBy(1 / 1.15)}
          onFit={fitToContent}
          onReset={() => setZoom(1)}
        />

        {canEdit && !voteMode ? (
          <SelectionBar
            count={selection.length}
            onDuplicate={() => duplicateElements(selectedIds)}
            onDelete={() => deleteElements(selectedIds)}
            onAlign={alignSelected}
            onOrder={(d) => reorder(selectedIds, d)}
          />
        ) : null}

        <div className="absolute bottom-3 right-3 z-20 hidden sm:block">
          <BoardMinimap
            elements={page.elements}
            view={view}
            viewport={viewport}
            docBackground={boardBg}
            onPanTo={panTo}
          />
        </div>
      </div>

      <TemplatesDialog open={templatesOpen} onOpenChange={setTemplatesOpen} onPick={insertTemplate} />
    </div>
  )
})

export default WhiteboardEditor
