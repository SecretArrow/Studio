"use client"

/**
 * Canvas Editor — full visual editor for DesignDoc documents.
 *
 * Owns: document state + history (undo/redo), selection, pages, view
 * (pan/zoom/grid/rulers), left rail panels, properties panel, context menu
 * and the EditorHandle contract (export / getThumbnail / isDirty).
 * Rendering and interactions live in ./canvas/stage-view.tsx; pure logic in
 * src/lib/editor/*.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { BackgroundSpec, DesignDoc, DesignElement, PageModel, TextElement } from "@/lib/design/types"
import { createPage, uid } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { exportDoc, getThumbnail as renderThumbnail, renderPageThumbnail } from "@/lib/editor/export"
import { measureTextBlockHeight } from "@/lib/editor/geometry"
import { StageView } from "./canvas/stage-view"
import { ElementsPanel } from "./canvas/elements-panel"
import { TextPanel } from "./canvas/text-panel"
import { PhotosPanel } from "./canvas/photos-panel"
import { LayersPanel } from "./canvas/layers-panel"
import { BackgroundPanel } from "./canvas/background-panel"
import { PagesPanel } from "./canvas/pages-panel"
import { PropertiesPanel } from "./canvas/properties-panel"
import { CanvasContextMenu } from "./canvas/context-menu"
import { DEFAULT_VIEW, IconBtn, type CanvasApi, type ElementPatch, type ViewState } from "./canvas/ui"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize,
  Minus,
  Palette,
  Plus,
  Redo2,
  Ruler as RulerIcon,
  Shapes,
  Settings2,
  Type,
  Undo2,
  X,
  Files,
  Magnet,
  Grid2x2,
  SquareDashed,
  SlidersHorizontal,
} from "lucide-react"

type TabId = "elements" | "text" | "photos" | "layers" | "background"

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "elements", label: "Elements", icon: <Shapes className="h-5 w-5" /> },
  { id: "text", label: "Text", icon: <Type className="h-5 w-5" /> },
  { id: "photos", label: "Photos", icon: <ImageIcon className="h-5 w-5" /> },
  { id: "layers", label: "Layers", icon: <Layers className="h-5 w-5" /> },
  { id: "background", label: "Background", icon: <Palette className="h-5 w-5" /> },
]

const MIN_ZOOM = 0.04
const MAX_ZOOM = 8

function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
}

interface Clipboard {
  elements: DesignElement[]
}

const CanvasEditor = forwardRef<EditorHandle, EditorProps>(function CanvasEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const canEdit = role === "owner" || role === "editor"
  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [pageIndex, setPageIndexState] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [view, setViewState] = useState<ViewState>({ ...DEFAULT_VIEW })
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [propsSheetOpen, setPropsSheetOpen] = useState(false)

  const docRef = useRef<DesignDoc>(initialDoc)
  const pageIndexRef = useRef(0)
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  const [history] = useState(() => new HistoryStore(initialDoc, 60))
  const clipboard = useRef<Clipboard | null>(null)
  const dirtyRef = useRef(false)
  const firstFitDone = useRef(false)

  const page: PageModel = doc.pages[Math.min(pageIndex, doc.pages.length - 1)] ?? doc.pages[0]
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
    (fn: (page: PageModel) => PageModel, coalesceKey?: string) => {
      const prev = docRef.current
      const next: DesignDoc = {
        ...prev,
        pages: prev.pages.map((p, i) => (i === pageIndexRef.current ? fn(p) : p)),
      }
      commit(next, coalesceKey)
    },
    [commit],
  )

  const ensureTextHeight = (el: DesignElement): DesignElement => {
    if (el.type !== "text") return el
    const t = el as TextElement
    const h = measureTextBlockHeight(
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
      t.width,
    )
    return { ...t, height: Math.max(t.height, Math.round(h)) }
  }

  const updateElements = useCallback(
    (patches: ElementPatch[], opts?: { coalesceKey?: string }) => {
      if (!canEdit || patches.length === 0) return
      const map = new Map(patches.map((p) => [p.id, p.patch]))
      mutatePage(
        (p) => ({
          ...p,
          elements: p.elements.map((el) => {
            const patch = map.get(el.id)
            if (!patch) return el
            const merged = { ...el, ...patch } as DesignElement
            const textKeys = ["text", "fontSize", "fontFamily", "fontWeight", "italic", "uppercase", "lineHeight", "letterSpacing", "listStyle", "width"]
            if (merged.type === "text" && textKeys.some((k) => k in patch)) return ensureTextHeight(merged)
            return merged
          }),
        }),
        opts?.coalesceKey,
      )
    },
    [canEdit, mutatePage],
  )

  const dropPos = useCallback(
    (w: number, h: number) => {
      const v = viewRef.current
      const vp = viewport.w > 0 ? viewport : { w: 900, h: 600 }
      const cx = (vp.w / 2 - v.panX) / v.zoom
      const cy = (vp.h / 2 - v.panY) / v.zoom
      return {
        x: Math.max(12, Math.round(cx - w / 2)),
        y: Math.max(12, Math.round(cy - h / 2)),
      }
    },
    [viewport],
  )

  const addElements = useCallback(
    (els: DesignElement[], select = true) => {
      if (!canEdit || els.length === 0) return
      const prepared = els.map(ensureTextHeight)
      mutatePage((p) => ({ ...p, elements: [...p.elements, ...prepared] }))
      if (select) setSelectedIds(prepared.map((el) => el.id))
    },
    [canEdit, mutatePage],
  )

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (!canEdit || ids.length === 0) return
      const set = new Set(ids)
      mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => !set.has(e.id)) }))
      setSelectedIds((prev) => prev.filter((id) => !set.has(id)))
      setEditingId(null)
    },
    [canEdit, mutatePage],
  )

  const duplicateElements = useCallback(
    (ids: string[]) => {
      if (!canEdit || ids.length === 0) return
      const set = new Set(ids)
      const source = page.elements.filter((e) => set.has(e.id))
      if (source.length === 0) return
      const gidMap = new Map<string, string>()
      const clones = source.map((el) => {
        let groupId = el.groupId
        if (groupId) {
          if (!gidMap.has(groupId)) gidMap.set(groupId, uid("grp"))
          groupId = gidMap.get(groupId)
        }
        return { ...el, id: uid("dup"), x: el.x + 24, y: el.y + 24, groupId } as DesignElement
      })
      mutatePage((p) => ({ ...p, elements: [...p.elements, ...clones] }))
      setSelectedIds(clones.map((c) => c.id))
    },
    [canEdit, mutatePage, page.elements],
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

  const reorder = useCallback(
    (ids: string[], dir: "front" | "forward" | "backward" | "back") => {
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

  const groupSelected = useCallback(() => {
    if (!canEdit || selection.length < 2) return
    const gid = uid("grp")
    updateElements(selection.map((e) => ({ id: e.id, patch: { groupId: gid } })))
  }, [canEdit, selection, updateElements])

  const ungroupSelected = useCallback(() => {
    if (!canEdit || selection.length === 0) return
    updateElements(selection.map((e) => ({ id: e.id, patch: { groupId: undefined } })))
  }, [canEdit, selection, updateElements])

  const renameElement = useCallback(
    (id: string, name: string) => {
      updateElements([{ id, patch: { name: name.trim() || undefined } }])
    },
    [updateElements],
  )

  /* ------------------------- clipboard ------------------------- */

  const copySelection = useCallback(
    (cut = false) => {
      if (selection.length === 0) return
      clipboard.current = { elements: JSON.parse(JSON.stringify(selection)) as DesignElement[] }
      if (cut) deleteElements(selectedIds)
    },
    [deleteElements, selection, selectedIds],
  )

  const pasteClipboard = useCallback(() => {
    const clip = clipboard.current
    if (!canEdit || !clip || clip.elements.length === 0) return
    const gidMap = new Map<string, string>()
    const clones = clip.elements.map((el) => {
      let groupId = el.groupId
      if (groupId) {
        if (!gidMap.has(groupId)) gidMap.set(groupId, uid("grp"))
        groupId = gidMap.get(groupId)
      }
      return { ...el, id: uid("paste"), x: el.x + 24, y: el.y + 24, groupId } as DesignElement
    })
    addElements(clones)
  }, [addElements, canEdit])

  /* ------------------------- pages ------------------------- */

  const setPageIndex = useCallback((i: number) => {
    const docCurrent = docRef.current
    const clamped = Math.max(0, Math.min(i, docCurrent.pages.length - 1))
    pageIndexRef.current = clamped
    setPageIndexState(clamped)
    setSelectedIds([])
    setEditingId(null)
  }, [])

  const addPage = useCallback(
    (duplicate: boolean) => {
      if (!canEdit) return
      const prev = docRef.current
      const current = prev.pages[pageIndexRef.current]
      let newPage: PageModel
      if (duplicate) {
        const gidMap = new Map<string, string>()
        newPage = {
          ...current,
          id: uid("page"),
          name: `${current.name} copy`,
          elements: current.elements.map((el) => {
            let groupId = el.groupId
            if (groupId) {
              if (!gidMap.has(groupId)) gidMap.set(groupId, uid("grp"))
              groupId = gidMap.get(groupId)
            }
            return { ...el, id: uid("el"), groupId } as DesignElement
          }),
        }
      } else {
        newPage = createPage({ name: `Page ${prev.pages.length + 1}`, background: current.background })
      }
      const pages = [...prev.pages]
      pages.splice(pageIndexRef.current + 1, 0, newPage)
      commit({ ...prev, pages })
      setPageIndex(pageIndexRef.current + 1)
    },
    [canEdit, commit, setPageIndex],
  )

  const deletePage = useCallback(
    (index: number) => {
      if (!canEdit) return
      const prev = docRef.current
      if (prev.pages.length <= 1) return
      const pages = prev.pages.filter((_, i) => i !== index)
      commit({ ...prev, pages })
      setPageIndex(Math.max(0, Math.min(pageIndexRef.current > index ? pageIndexRef.current - 1 : pageIndexRef.current, pages.length - 1)))
    },
    [canEdit, commit, setPageIndex],
  )

  const movePage = useCallback(
    (from: number, to: number) => {
      if (!canEdit || from === to) return
      const prev = docRef.current
      const pages = [...prev.pages]
      const [moved] = pages.splice(from, 1)
      pages.splice(to, 0, moved)
      commit({ ...prev, pages })
      if (pageIndexRef.current === from) setPageIndex(to)
      else setPageIndex(pageIndexRef.current)
    },
    [canEdit, commit, setPageIndex],
  )

  const renamePage = useCallback(
    (index: number, name: string) => {
      if (!canEdit) return
      const prev = docRef.current
      commit({
        ...prev,
        pages: prev.pages.map((p, i) => (i === index ? { ...p, name } : p)),
      })
    },
    [canEdit, commit],
  )

  const setPageBackground = useCallback(
    (bg: BackgroundSpec) => {
      if (!canEdit) return
      mutatePage((p) => ({ ...p, background: bg }))
    },
    [canEdit, mutatePage],
  )

  /* ------------------------- view ------------------------- */

  const setView = useCallback((patch: Partial<ViewState>) => {
    setViewState((prev) => ({ ...prev, ...patch }))
  }, [])

  const onViewportResize = useCallback((w: number, h: number) => {
    setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
  }, [])

  const fitToScreen = useCallback(() => {
    if (viewport.w <= 0 || viewport.h <= 0) return
    const d = docRef.current
    const pad = 56
    const zoom = clampZoom(Math.min((viewport.w - pad) / d.width, (viewport.h - pad) / d.height))
    setViewState((prev) => ({
      ...prev,
      zoom,
      panX: (viewport.w - d.width * zoom) / 2,
      panY: (viewport.h - d.height * zoom) / 2,
    }))
  }, [viewport])

  useEffect(() => {
    if (!firstFitDone.current && viewport.w > 0) {
      firstFitDone.current = true
      fitToScreen()
    }
  }, [viewport, fitToScreen])

  const setZoom = useCallback(
    (z: number) => {
      const target = clampZoom(z)
      const v = viewRef.current
      const vp = viewport.w > 0 ? viewport : { w: 900, h: 600 }
      const cx = vp.w / 2
      const cy = vp.h / 2
      const docX = (cx - v.panX) / v.zoom
      const docY = (cy - v.panY) / v.zoom
      setViewState((prev) => ({ ...prev, zoom: target, panX: cx - docX * target, panY: cy - docY * target }))
    },
    [viewport],
  )

  const zoomBy = useCallback(
    (factor: number) => {
      setZoom(viewRef.current.zoom * factor)
    },
    [setZoom],
  )

  const renderThumb = useCallback((p: PageModel, width: number) => renderPageThumbnail(docRef.current, p, width), [])

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

  /* ------------------------- api object ------------------------- */

  const api = useMemo<CanvasApi>(
    () => ({
      doc,
      page,
      pageIndex,
      canEdit,
      selectedIds,
      selection,
      addElements,
      updateElements,
      deleteElements,
      duplicateElements,
      selectIds,
      reorder,
      groupSelected,
      ungroupSelected,
      renameElement,
      copySelection,
      pasteClipboard,
      setPageIndex,
      addPage,
      deletePage,
      movePage,
      renamePage,
      setPageBackground,
      view,
      setView,
      fitToScreen,
      setZoom,
      undo,
      redo,
      canUndo: historyState.canUndo,
      canRedo: historyState.canRedo,
      startInlineEdit: (id: string) => setEditingId(id),
      renderThumb,
      dropPos,
    }),
    [
      doc, page, pageIndex, canEdit, selectedIds, selection, addElements, updateElements, deleteElements,
      duplicateElements, selectIds, reorder, groupSelected, ungroupSelected, renameElement, copySelection,
      pasteClipboard, setPageIndex, addPage, deletePage, movePage, renamePage, setPageBackground, view,
      setView, fitToScreen, setZoom, undo, redo, historyState, renderThumb, dropPos,
    ],
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
        if (contextMenu) setContextMenu(null)
        else if (activeTab) setActiveTab(null)
        else setSelectedIds([])
        return
      }
      if (!canEdit) {
        if (mod && key.toLowerCase() === "a") {
          e.preventDefault()
          setSelectedIds(page.elements.filter((el) => !el.locked).map((el) => el.id))
        }
        return
      }
      // clipboard & history & tools
      if (mod && key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (mod && (key.toLowerCase() === "y" || (key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); return }
      if (mod && key.toLowerCase() === "c") { e.preventDefault(); copySelection(false); return }
      if (mod && key.toLowerCase() === "x") { e.preventDefault(); copySelection(true); return }
      if (mod && key.toLowerCase() === "v") { e.preventDefault(); pasteClipboard(); return }
      if (mod && key.toLowerCase() === "d") { e.preventDefault(); duplicateElements(selectedIds); return }
      if (mod && key.toLowerCase() === "a") { e.preventDefault(); selectIds(page.elements.map((el) => el.id)); return }
      if (mod && key.toLowerCase() === "g" && !e.shiftKey) { e.preventDefault(); groupSelected(); return }
      if (mod && key.toLowerCase() === "g" && e.shiftKey) { e.preventDefault(); ungroupSelected(); return }
      if (mod && key === "]") { e.preventDefault(); reorder(selectedIds, "front"); return }
      if (mod && key === "[") { e.preventDefault(); reorder(selectedIds, "back"); return }
      if (key === "]") { reorder(selectedIds, "forward"); return }
      if (key === "[") { reorder(selectedIds, "backward"); return }
      if (key === "Delete" || key === "Backspace") { if (selectedIds.length > 0) { e.preventDefault(); deleteElements(selectedIds) } return }
      // nudging
      if (key.startsWith("Arrow") && selectedIds.length > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0
        const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0
        updateElements(
          selection.map((el) => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } })),
          { coalesceKey: "nudge" },
        )
        return
      }
      // zoom
      if (key === "+" || key === "=") { zoomBy(1.15); return }
      if (key === "-" || key === "_") { zoomBy(1 / 1.15); return }
      if (key === "0") { fitToScreen(); return }
      if (key === "1") { setZoom(1); return }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [
    activeTab, canEdit, contextMenu, deleteElements, duplicateElements, fitToScreen, groupSelected,
    page.elements, pasteClipboard, redo, reorder, copySelection, selection, selectIds, selectedIds,
    setZoom, undo, ungroupSelected, updateElements, zoomBy,
  ])

  /* ------------------------- editor handle ------------------------- */

  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req): Promise<ExportResult[]> => exportDoc(docRef.current, req),
      getThumbnail: async () => {
        const current = docRef.current
        const p = current.pages[Math.min(pageIndexRef.current, current.pages.length - 1)]
        return renderThumbnail(current, p)
      },
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [registerHandle])

  /* keep refs in sync */
  useEffect(() => {
    pageIndexRef.current = pageIndex
  }, [pageIndex])

  const showPagesStrip = view.pagesOpen || doc.pages.length > 1

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* ---------------- left rail ---------------- */}
      <nav
        className="z-40 flex shrink-0 flex-row items-center gap-0.5 overflow-x-auto border-b bg-card px-1.5 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-1.5 md:py-2"
        aria-label="Editor tools"
      >
        {TABS.map((tab) => (
          <IconBtn
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            disabled={!canEdit && (tab.id === "elements" || tab.id === "text" || tab.id === "photos")}
            className="h-11 w-11"
            onClick={() => setActiveTab((prev) => (prev === tab.id ? null : tab.id))}
          >
            {tab.icon}
          </IconBtn>
        ))}
        <div className="mx-1 h-6 w-px bg-border md:my-1 md:h-px md:w-6" />
        <IconBtn label="Undo" disabled={!historyState.canUndo} onClick={undo} className="h-11 w-11">
          <Undo2 className="h-5 w-5" />
        </IconBtn>
        <IconBtn label="Redo" disabled={!historyState.canRedo} onClick={redo} className="h-11 w-11">
          <Redo2 className="h-5 w-5" />
        </IconBtn>
        <div className="mx-1 h-6 w-px bg-border md:my-1 md:h-px md:w-6" />
        <IconBtn
          label={view.pagesOpen ? "Hide pages" : "Show pages"}
          active={view.pagesOpen}
          className="h-11 w-11"
          onClick={() => setView({ pagesOpen: !view.pagesOpen })}
        >
          <Files className="h-5 w-5" />
        </IconBtn>
        <ViewOptions api={api} />
        {/* mobile: properties trigger */}
        <div className="lg:hidden">
          <IconBtn label="Properties" active={propsSheetOpen} className="h-11 w-11" onClick={() => setPropsSheetOpen((v) => !v)}>
            <SlidersHorizontal className="h-5 w-5" />
          </IconBtn>
        </div>
      </nav>

      {/* ---------------- left panel ---------------- */}
      {activeTab !== null ? (
        <aside
          className="absolute bottom-0 left-0 top-[52px] z-30 flex w-[300px] max-w-[86vw] flex-col border-r bg-card shadow-2xl md:static md:shadow-none"
          aria-label={`${TABS.find((t) => t.id === activeTab)?.label} panel`}
        >
          <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{TABS.find((t) => t.id === activeTab)?.label}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveTab(null)} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "elements" && <ElementsPanel api={api} />}
            {activeTab === "text" && <TextPanel api={api} />}
            {activeTab === "photos" && <PhotosPanel api={api} />}
            {activeTab === "layers" && <LayersPanel api={api} />}
            {activeTab === "background" && <BackgroundPanel api={api} />}
          </div>
        </aside>
      ) : null}

      {/* ---------------- canvas column ---------------- */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1">
          {view.showRulers && viewport.w > 0 ? (
            <Ruler axis="v" zoom={view.zoom} pan={view.panY} docSize={doc.height} size={viewport.h} />
          ) : null}
          <div className="relative min-w-0 flex-1">
            {view.showRulers && viewport.w > 0 ? (
              <div className="absolute inset-x-0 top-0 z-10 border-b bg-card">
                <Ruler axis="h" zoom={view.zoom} pan={view.panX} docSize={doc.width} size={viewport.w} />
              </div>
            ) : null}
            <div className={cn("h-full w-full", view.showRulers && "pt-[22px]")}>
              <StageView
                api={api}
                editingId={editingId}
                onViewportResize={onViewportResize}
                onContextMenu={(x, y, elementId) => setContextMenu({ x, y, elementId })}
              />
            </div>
          </div>

          {/* zoom controls */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-lg border bg-card/95 p-1 shadow-md backdrop-blur">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1 / 1.15)} aria-label="Zoom out">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              className="w-12 text-center text-xs tabular-nums hover:underline"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom to 100%"
              title="Reset to 100%"
            >
              {Math.round(view.zoom * 100)}%
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => zoomBy(1.15)} aria-label="Zoom in">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={fitToScreen}>
              <Maximize className="h-3.5 w-3.5" /> Fit
            </Button>
          </div>
        </div>

        {/* pages strip */}
        {showPagesStrip ? <PagesPanel api={api} onClose={doc.pages.length > 1 ? undefined : () => setView({ pagesOpen: false })} /> : null}

        {/* mobile properties bottom sheet */}
        {propsSheetOpen ? (
          <div className="absolute inset-0 z-30 flex flex-col justify-end lg:hidden" onClick={() => setPropsSheetOpen(false)}>
            <div className="flex max-h-[55%] flex-col rounded-t-2xl border-t bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPropsSheetOpen(false)} aria-label="Close properties">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PropertiesPanel api={api} />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------------- properties (desktop) ---------------- */}
      <aside className="hidden w-[300px] shrink-0 border-l bg-card lg:block" aria-label="Properties">
        <PropertiesPanel api={api} />
      </aside>

      <CanvasContextMenu
        api={api}
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onRename={() => {
          setActiveTab("layers")
        }}
      />
    </div>
  )
})

/* ------------------------------ view options popover ------------------------------ */

function ViewOptions({ api }: { api: CanvasApi }) {
  const { view, setView } = api
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="View options" title="Rulers, grid & snapping">
          <Settings2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-60 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            <RulerIcon className="h-3.5 w-3.5" /> Rulers
          </Label>
          <Switch checked={view.showRulers} onCheckedChange={(v) => setView({ showRulers: v })} aria-label="Toggle rulers" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            <Grid2x2 className="h-3.5 w-3.5" /> Grid
          </Label>
          <Switch checked={view.showGrid} onCheckedChange={(v) => setView({ showGrid: v })} aria-label="Toggle grid" />
        </div>
        {view.showGrid ? (
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Grid size</Label>
            <Select value={String(view.gridSize)} onValueChange={(v) => setView({ gridSize: Number(v) })}>
              <SelectTrigger className="h-7 w-20 text-xs" aria-label="Grid size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            <Magnet className="h-3.5 w-3.5" /> Snap to grid
          </Label>
          <Switch checked={view.snapToGrid} onCheckedChange={(v) => setView({ snapToGrid: v })} aria-label="Toggle snap to grid" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            <SquareDashed className="h-3.5 w-3.5" /> Safe margins
          </Label>
          <Switch checked={view.showSafe} onCheckedChange={(v) => setView({ showSafe: v })} aria-label="Toggle safe margins" />
        </div>
        <p className="border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
          Snapping is always on while dragging: elements snap to page center/edges and to other elements.
        </p>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------ rulers ------------------------------ */

function Ruler({ axis, zoom, pan, docSize, size }: { axis: "h" | "v"; zoom: number; pan: number; docSize: number; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const thickness = 22
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (axis === "h") {
      canvas.width = Math.max(1, size * dpr)
      canvas.height = thickness * dpr
    } else {
      canvas.width = thickness * dpr
      canvas.height = Math.max(1, size * dpr)
    }
    canvas.style.width = axis === "h" ? `${size}px` : `${thickness}px`
    canvas.style.height = axis === "h" ? `${thickness}px` : `${size}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, thickness)
    const styles = getComputedStyle(canvas)
    const fg = styles.color || "#6b7280"
    ctx.strokeStyle = fg
    ctx.fillStyle = fg
    ctx.font = "9px Inter, sans-serif"
    // choose a tick step that gives ≥ 56px spacing
    const steps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
    const step = steps.find((s) => s * zoom >= 56) ?? 10000
    const startDoc = Math.max(0, Math.floor((0 - pan) / zoom / step) * step)
    const endDoc = Math.min(docSize, Math.ceil((size - pan) / zoom / step) * step)
    for (let d = startDoc; d <= endDoc; d += step) {
      const s = d * zoom + pan
      ctx.beginPath()
      if (axis === "h") {
        ctx.moveTo(s, thickness - 8)
        ctx.lineTo(s, thickness)
        ctx.fillText(String(d), s + 3, 9)
      } else {
        ctx.moveTo(thickness - 8, s)
        ctx.lineTo(thickness, s)
        ctx.save()
        ctx.translate(9, s - 3)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(String(d), 0, 0)
        ctx.restore()
      }
      ctx.stroke()
    }
  }, [axis, zoom, pan, docSize, size])
  return <canvas ref={canvasRef} className="block bg-card text-muted-foreground" role="img" aria-label={`${axis === "h" ? "Horizontal" : "Vertical"} ruler in pixels`} />
}

export default CanvasEditor
