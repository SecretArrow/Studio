"use client"

/**
 * Photo Editor — full non-destructive photo editing for DesignDoc type "photo".
 *
 * Owns: document state + history, subject image ops (replace/remove),
 * adjustments (stored in ImageElement.filters), transform (rotate/flip/
 * straighten/crop bake), filter presets, overlays (text/shapes), collage
 * builder, background and the EditorHandle contract (export / thumbnail).
 * Rendering lives in ./photo/render.ts, panels in ./photo/*.
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { BackgroundSpec, DesignDoc, DesignElement, ImageElement, ImageFilters, PageModel, ShapeVariant, TextElement, ShapeElement } from "@/lib/design/types"
import { createImage, createShape, createText } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { loadImage } from "@/lib/editor/export"
import {
  computeAutoEnhance,
  DEFAULT_PHOTO_FILTERS,
  toPhotoFilters,
  type FilterPreset,
  type PhotoFilters,
} from "./photo/filters"
import { bakeSubjectCrop, exportPhotoDoc, photoThumbnail } from "./photo/render"
import { importImageBlob } from "./photo/upload"
import type { CollageLayoutId, CropRect, PhotoApi } from "./photo/api"
import { PhotoStage } from "./photo/stage"
import { PhotoPanel } from "./photo/photo-panel"
import { AdjustPanel } from "./photo/adjust-panel"
import { PresetsPanel } from "./photo/presets-panel"
import { TransformPanel } from "./photo/transform-panel"
import { OverlaysPanel } from "./photo/overlays-panel"
import { CollagePanel } from "./photo/collage-panel"
import { ExportPanel } from "./photo/export-panel"
import { Button } from "@/components/ui/button"
import { IconBtn } from "./canvas/ui"
import { toast } from "sonner"
import {
  Crop,
  Download,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Redo2,
  SlidersHorizontal,
  Sticker,
  Undo2,
  Wand2,
  X,
} from "lucide-react"

type TabId = "photo" | "adjust" | "filters" | "transform" | "overlays" | "collage" | "export"

const TABS: { id: TabId; label: string; icon: React.ReactNode; needsSubject?: boolean }[] = [
  { id: "photo", label: "Photo", icon: <ImageIcon className="h-5 w-5" /> },
  { id: "adjust", label: "Adjust", icon: <SlidersHorizontal className="h-5 w-5" />, needsSubject: true },
  { id: "filters", label: "Filters", icon: <Wand2 className="h-5 w-5" />, needsSubject: true },
  { id: "transform", label: "Transform", icon: <Crop className="h-5 w-5" />, needsSubject: true },
  { id: "overlays", label: "Overlay", icon: <Sticker className="h-5 w-5" /> },
  { id: "collage", label: "Collage", icon: <LayoutGrid className="h-5 w-5" /> },
  { id: "export", label: "Canvas", icon: <Download className="h-5 w-5" /> },
]

const COLLAGE_SIZE = 1080
/** fixed frames (x, y, w, h) on the 1080×1080 collage canvas, 12px gaps */
const COLLAGE_CELLS: Record<CollageLayoutId, [number, number, number, number][]> = {
  "2x1": [
    [0, 0, 534, 1080],
    [546, 0, 534, 1080],
  ],
  "2x2": [
    [0, 0, 534, 534],
    [546, 0, 534, 534],
    [0, 546, 534, 534],
    [546, 546, 534, 534],
  ],
  "3x1": [
    [0, 0, 352, 1080],
    [364, 0, 352, 1080],
    [728, 0, 352, 1080],
  ],
  "1+3": [
    [0, 0, 640, 1080],
    [652, 0, 428, 352],
    [652, 364, 428, 352],
    [652, 728, 428, 352],
  ],
}

function readPool(doc: DesignDoc): string[] {
  const cfg = doc.config as { pool?: unknown } | null | undefined
  if (cfg && Array.isArray(cfg.pool)) {
    return cfg.pool.filter((s): s is string => typeof s === "string" && s.length > 0)
  }
  return []
}

function coverCrop(nw: number, nh: number, aspect: number): NonNullable<ImageElement["crop"]> {
  const srcAspect = nw / Math.max(1, nh)
  let w = 1
  let h = 1
  if (srcAspect > aspect) w = aspect / srcAspect
  else h = srcAspect / aspect
  return { x: (1 - w) / 2, y: (1 - h) / 2, width: w, height: h }
}

function firstImageIndex(p: { elements: DesignElement[] }): number {
  return p.elements.findIndex((el) => el.type === "image")
}

const PhotoEditor = forwardRef<EditorHandle, EditorProps>(function PhotoEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const canEdit = role === "owner" || role === "editor"
  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const docRef = useRef<DesignDoc>(initialDoc)
  const dirtyRef = useRef(false)
  const [history] = useState(() => new HistoryStore(initialDoc, 60))
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId | null>(() =>
    (initialDoc.pages[0]?.elements ?? []).some((el) => el.type === "image") ? "adjust" : "photo",
  )
  const [cropMode, setCropModeState] = useState(false)
  const [cropRect, setCropRectState] = useState<CropRect | null>(null)
  const cropRectRef = useRef<CropRect | null>(null)
  const [cropAspect, setCropAspect] = useState("free")
  const [compare, setCompare] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    cropRectRef.current = cropRect
  }, [cropRect])

  const page = doc.pages[0] ?? doc.pages[doc.pages.length - 1]
  const subject = useMemo(
    () => page?.elements.find((el): el is ImageElement => el.type === "image") ?? null,
    [page],
  )
  const overlays = useMemo(() => page?.elements.filter((el) => el.type !== "image") ?? [], [page])
  const pool = useMemo(() => readPool(doc), [doc])
  const filters = useMemo<PhotoFilters>(() => toPhotoFilters(subject?.filters), [subject])

  const syncHistoryState = useCallback(() => {
    setHistoryState({ canUndo: history.canUndo, canRedo: history.canRedo })
  }, [history])

  /* ------------------------- core mutations ------------------------- */

  const commit = useCallback(
    (next: DesignDoc, coalesceKey?: string) => {
      if (!canEdit) return
      docRef.current = next
      dirtyRef.current = true
      setDoc(next)
      history.push(next, coalesceKey)
      syncHistoryState()
      onDocChange(next)
    },
    [canEdit, history, onDocChange, syncHistoryState],
  )

  const mutatePage = useCallback(
    (fn: (p: PageModel) => PageModel, coalesceKey?: string) => {
      const prev = docRef.current
      const pages = prev.pages.map((p, i) => (i === 0 ? fn(p) : p))
      commit({ ...prev, pages }, coalesceKey)
    },
    [commit],
  )

  const mutateSubject = useCallback(
    (fn: (el: ImageElement) => ImageElement, coalesceKey?: string) => {
      const prev = docRef.current
      const p0 = prev.pages[0]
      if (!p0) return
      const idx = firstImageIndex(p0)
      if (idx < 0) return
      const next: DesignDoc = {
        ...prev,
        pages: prev.pages.map((p, i) =>
          i === 0
            ? { ...p, elements: p.elements.map((el, j) => (j === idx ? fn(el as ImageElement) : el)) }
            : p,
        ),
      }
      commit(next, coalesceKey)
    },
    [commit],
  )

  /* ------------------------- subject ------------------------- */

  const replaceSubject = useCallback(
    (src: string, natural: { width: number; height: number }) => {
      if (!canEdit) return
      const prev = docRef.current
      const k = Math.min(1, 2400 / Math.max(1, natural.width, natural.height))
      const width = Math.max(1, Math.round(natural.width * k))
      const height = Math.max(1, Math.round(natural.height * k))
      const el = createImage({ src, x: 0, y: 0, width, height, name: "Photo" })
      const p0 = prev.pages[0]
      const hadSubject = p0 ? firstImageIndex(p0) >= 0 : false
      const next: DesignDoc = {
        ...prev,
        width,
        height,
        pages: prev.pages.map((p, i) =>
          i === 0
            ? {
                ...p,
                elements: hadSubject
                  ? p.elements.map((e2) => (e2.type === "image" ? el : e2))
                  : [el, ...p.elements],
              }
            : p,
        ),
      }
      commit(next)
      setSelectedId(null)
      setCropModeState(false)
    },
    [canEdit, commit],
  )

  const removeSubject = useCallback(() => {
    mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => e.type !== "image") }))
    setCropModeState(false)
    setCropRectState(null)
  }, [mutatePage])

  /* ------------------------- adjustments ------------------------- */

  const updateFilters = useCallback(
    (patch: Partial<PhotoFilters>, coalesceKey?: string) => {
      mutateSubject(
        (el) => ({ ...el, filters: { ...toPhotoFilters(el.filters), ...patch } as ImageFilters }),
        coalesceKey,
      )
    },
    [mutateSubject],
  )

  const resetFilters = useCallback(() => {
    mutateSubject((el) => ({ ...el, filters: { ...DEFAULT_PHOTO_FILTERS } as ImageFilters }))
  }, [mutateSubject])

  const applyPreset = useCallback(
    (preset: FilterPreset) => {
      mutateSubject((el) => ({ ...el, filters: { ...DEFAULT_PHOTO_FILTERS, ...preset.values } as ImageFilters }))
      toast.success(`${preset.name} filter applied`)
    },
    [mutateSubject],
  )

  const autoEnhance = useCallback(async () => {
    const el = docRef.current.pages[0]?.elements.find((e): e is ImageElement => e.type === "image")
    if (!el) return
    const img = await loadImage(el.src)
    if (!img) {
      toast.error("Image is not loaded yet — try again in a moment")
      return
    }
    const patch = computeAutoEnhance(img, el.crop)
    mutateSubject(
      (e2) => ({ ...e2, filters: { ...toPhotoFilters(e2.filters), ...patch } as ImageFilters }),
      "auto-enhance",
    )
    toast.success("Auto enhance applied — histogram levels analysis (no AI)")
  }, [mutateSubject])

  /* ------------------------- transform ------------------------- */

  const rotate90 = useCallback(
    (dir: 1 | -1) => {
      const prev = docRef.current
      const p0 = prev.pages[0]
      if (!p0) return
      const idx = firstImageIndex(p0)
      if (idx < 0) return
      const el = p0.elements[idx] as ImageElement
      const rot = (((el.rotation + dir * 90) % 360) + 360) % 360
      const fillsDoc =
        Math.abs(el.x) < 0.5 && Math.abs(el.y) < 0.5 && Math.abs(el.width - prev.width) < 1 && Math.abs(el.height - prev.height) < 1
      const next: DesignDoc = {
        ...prev,
        width: fillsDoc ? prev.height : prev.width,
        height: fillsDoc ? prev.width : prev.height,
        pages: prev.pages.map((p, i) =>
          i === 0
            ? {
                ...p,
                elements: p.elements.map((e2, j) =>
                  j === idx ? { ...el, rotation: rot, width: el.height, height: el.width } : e2,
                ),
              }
            : p,
        ),
      }
      commit(next)
    },
    [commit],
  )

  const toggleFlip = useCallback(
    (axis: "h" | "v") => {
      mutateSubject(
        (el) => (axis === "h" ? { ...el, flipH: !el.flipH } : { ...el, flipV: !el.flipV }),
        `flip:${axis}`,
      )
    },
    [mutateSubject],
  )

  const setStraighten = useCallback(
    (deg: number) => {
      mutateSubject((el) => {
        const quarter = Math.round(el.rotation / 90) * 90
        return { ...el, rotation: quarter + Math.max(-15, Math.min(15, deg)) }
      }, "straighten")
    },
    [mutateSubject],
  )

  const straighten = useMemo(() => {
    if (!subject) return 0
    return Math.max(-15, Math.min(15, subject.rotation - Math.round(subject.rotation / 90) * 90))
  }, [subject])

  /* ------------------------- crop ------------------------- */

  const setCropMode = useCallback(
    (open: boolean) => {
      if (open) {
        const el = docRef.current.pages[0]?.elements.find((e): e is ImageElement => e.type === "image")
        if (!el) {
          toast.error("Add a photo first")
          return
        }
        setCropRectState({ x: el.x, y: el.y, width: el.width, height: el.height })
        setCropModeState(true)
      } else {
        setCropModeState(false)
      }
    },
    [],
  )

  const setCropRect = useCallback((rect: CropRect) => setCropRectState(rect), [])

  const applyCrop = useCallback(async () => {
    const prev = docRef.current
    const p0 = prev.pages[0]
    const el = p0?.elements.find((e): e is ImageElement => e.type === "image")
    const rect = cropRectRef.current
    if (!canEdit || !el || !rect) return
    setBusy("crop")
    try {
      const baked = await bakeSubjectCrop(el, rect)
      if (!baked) {
        toast.error("Could not process the crop — the image may be cross-origin blocked. Upload the file instead.")
        return
      }
      let src: string | null = null
      if (baked.blob) {
        const imported = await importImageBlob(baked.blob, "crop.webp")
        if (imported) src = imported.src
      } else if (baked.dataUrl) {
        src = baked.dataUrl
      }
      if (!src) {
        toast.error("Could not encode the cropped image")
        return
      }
      const width = baked.width
      const height = baked.height
      const next: DesignDoc = {
        ...prev,
        width,
        height,
        pages: prev.pages.map((p, i) =>
          i === 0
            ? {
                ...p,
                elements: p.elements.map((e2) =>
                  e2.id === el.id
                    ? { ...e2, src, x: 0, y: 0, width, height, rotation: 0, flipH: false, flipV: false, crop: undefined }
                    : e2,
                ),
              }
            : p,
        ),
      }
      commit(next)
      setCropModeState(false)
      setCropRectState(null)
      toast.success("Crop applied — rotation, straighten and flip baked in, filters stay editable")
    } finally {
      setBusy(null)
    }
  }, [canEdit, commit])

  /* ------------------------- overlays ------------------------- */

  const selectOverlay = useCallback((id: string | null) => setSelectedId(id), [])

  const addOverlayText = useCallback(() => {
    const prev = docRef.current
    const width = Math.min(480, Math.round(prev.width * 0.7))
    const fontSize = Math.max(24, Math.round(prev.width / 14))
    const el = createText({
      x: Math.round((prev.width - width) / 2),
      y: Math.max(8, Math.round(prev.height / 2 - fontSize)),
      width,
      fontSize,
      text: "Your text",
      color: "#ffffff",
      shadow: { color: "rgba(0,0,0,0.35)", blur: 8, offsetX: 0, offsetY: 2 },
    })
    mutatePage((p) => ({ ...p, elements: [...p.elements, el] }))
    setSelectedId(el.id)
  }, [mutatePage])

  const addOverlayShape = useCallback(
    (variant: ShapeVariant) => {
      const prev = docRef.current
      const size = Math.min(240, Math.round(prev.width * 0.3))
      const el = createShape({
        variant,
        x: Math.round((prev.width - size) / 2),
        y: Math.round((prev.height - size) / 2),
        width: size,
        height: size,
        fill: "#8b5cf6",
      })
      mutatePage((p) => ({ ...p, elements: [...p.elements, el] }))
      setSelectedId(el.id)
    },
    [mutatePage],
  )

  const updateOverlay = useCallback(
    (id: string, patch: Partial<TextElement> & Partial<ShapeElement>, coalesceKey?: string) => {
      mutatePage(
        (p) => ({
          ...p,
          elements: p.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as DesignElement) : e)),
        }),
        coalesceKey,
      )
    },
    [mutatePage],
  )

  const deleteOverlay = useCallback(
    (id: string) => {
      mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) }))
      setSelectedId((prev) => (prev === id ? null : prev))
    },
    [mutatePage],
  )

  /* ------------------------- pool & collage ------------------------- */

  const addToPool = useCallback(
    (srcs: string[]) => {
      if (srcs.length === 0 || !canEdit) return
      const prev = docRef.current
      const existing = readPool(prev)
      const merged = [...existing]
      for (const s of srcs) {
        if (!merged.includes(s)) merged.push(s)
      }
      if (merged.length === existing.length) return
      commit({ ...prev, config: { ...(prev.config ?? {}), pool: merged } as DesignDoc["config"] })
    },
    [canEdit, commit],
  )

  const buildCollage = useCallback(
    async (layout: CollageLayoutId) => {
      if (!canEdit) return
      const prev = docRef.current
      const srcs = readPool(prev)
      if (srcs.length === 0) {
        toast.error("Add photos to the pool first")
        return
      }
      setBusy("collage")
      try {
        const cells = COLLAGE_CELLS[layout]
        const imgs = await Promise.all(srcs.map((s) => loadImage(s)))
        const usable = srcs
          .map((src, i) => ({ src, img: imgs[i] }))
          .filter((x): x is { src: string; img: HTMLImageElement } => !!x.img)
        if (usable.length === 0) {
          toast.error("None of the pool images could be loaded")
          return
        }
        const elements = cells.map((cell, i) => {
          const pick = usable[i % usable.length]
          return createImage({
            src: pick.src,
            x: cell[0],
            y: cell[1],
            width: cell[2],
            height: cell[3],
            crop: coverCrop(pick.img.naturalWidth, pick.img.naturalHeight, cell[2] / cell[3]),
            name: `Photo ${i + 1}`,
          })
        })
        const next: DesignDoc = {
          ...prev,
          width: COLLAGE_SIZE,
          height: COLLAGE_SIZE,
          background: { type: "solid", color: "#ffffff" },
          config: { ...(prev.config ?? {}), pool: usable.map((u) => u.src) } as DesignDoc["config"],
          pages: prev.pages.map((p, i) =>
            i === 0 ? { ...p, background: { type: "solid", color: "#ffffff" }, elements } : p,
          ),
        }
        commit(next)
        setSelectedId(null)
        setCropModeState(false)
        toast.success(`Collage created — ${cells.length} frames from ${usable.length} photo${usable.length > 1 ? "s" : ""}`)
      } finally {
        setBusy(null)
      }
    },
    [canEdit, commit],
  )

  /* ------------------------- background & history ------------------------- */

  const setBackground = useCallback(
    (bg: BackgroundSpec) => {
      mutatePage((p) => ({ ...p, background: bg }))
    },
    [mutatePage],
  )

  const undo = useCallback(() => {
    const restored = history.undo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
    setCropModeState(false)
    setSelectedId((prev) => (restored.pages[0]?.elements.some((e) => e.id === prev) ? prev : null))
  }, [history, onDocChange, syncHistoryState])

  const redo = useCallback(() => {
    const restored = history.redo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
    setCropModeState(false)
    setSelectedId((prev) => (restored.pages[0]?.elements.some((e) => e.id === prev) ? prev : null))
  }, [history, onDocChange, syncHistoryState])

  /* ------------------------- api object ------------------------- */

  const api = useMemo<PhotoApi>(
    () => ({
      doc,
      page,
      canEdit,
      subject,
      overlays,
      selectedId,
      replaceSubject,
      removeSubject,
      filters,
      updateFilters,
      resetFilters,
      applyPreset,
      autoEnhance,
      rotate90,
      toggleFlip,
      straighten,
      setStraighten,
      cropMode,
      cropRect,
      setCropMode,
      setCropRect,
      cropAspect,
      setCropAspect,
      applyCrop,
      selectOverlay,
      addOverlayText,
      addOverlayShape,
      updateOverlay,
      deleteOverlay,
      pool,
      addToPool,
      buildCollage,
      setBackground,
      undo,
      redo,
      canUndo: historyState.canUndo,
      canRedo: historyState.canRedo,
      compare,
      setCompare,
      busy,
    }),
    [
      doc, page, canEdit, subject, overlays, selectedId, replaceSubject, removeSubject, filters,
      updateFilters, resetFilters, applyPreset, autoEnhance, rotate90, toggleFlip, straighten,
      setStraighten, cropMode, cropRect, setCropMode, setCropRect, cropAspect, setCropAspect, applyCrop,
      selectOverlay, addOverlayText, addOverlayShape, updateOverlay, deleteOverlay, pool,
      addToPool, buildCollage, setBackground, undo, redo, historyState, compare, busy,
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
      if (!canEdit) return
      if (key === "Escape") {
        if (cropMode) setCropModeState(false)
        else setSelectedId(null)
        return
      }
      if ((key === "Delete" || key === "Backspace") && selectedId) {
        e.preventDefault()
        deleteOverlay(selectedId)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canEdit, cropMode, deleteOverlay, redo, selectedId, undo])

  /* ------------------------- editor handle ------------------------- */

  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req): Promise<ExportResult[]> => exportPhotoDoc(docRef.current, req),
      getThumbnail: async () => {
        const d = docRef.current
        const p = d.pages[0] ?? d.pages[d.pages.length - 1]
        return p ? photoThumbnail(d, p) : null
      },
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [registerHandle])

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? ""

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* ---------------- left rail ---------------- */}
      <nav
        className="z-40 flex shrink-0 flex-row items-center gap-0.5 overflow-x-auto border-b bg-card px-1.5 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-1.5 md:py-2"
        aria-label="Photo tools"
      >
        {TABS.map((tab) => (
          <IconBtn
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            disabled={(!canEdit && (tab.id === "photo" || tab.id === "overlays" || tab.id === "collage")) || (!!tab.needsSubject && !subject)}
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
      </nav>

      {/* ---------------- left panel ---------------- */}
      {activeTab !== null ? (
        <aside
          className="absolute bottom-0 left-0 top-[52px] z-30 flex w-[300px] max-w-[86vw] flex-col border-r bg-card shadow-2xl md:static md:shadow-none"
          aria-label={`${activeLabel} panel`}
        >
          <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{activeLabel}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveTab(null)} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "photo" && <PhotoPanel api={api} />}
            {activeTab === "adjust" && <AdjustPanel api={api} />}
            {activeTab === "filters" && <PresetsPanel api={api} />}
            {activeTab === "transform" && <TransformPanel api={api} />}
            {activeTab === "overlays" && <OverlaysPanel api={api} />}
            {activeTab === "collage" && <CollagePanel api={api} />}
            {activeTab === "export" && <ExportPanel api={api} filenameBase={project.name || "photo"} />}
          </div>
        </aside>
      ) : null}

      {/* ---------------- canvas column ---------------- */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <PhotoStage api={api} />
        {busy ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card/95 px-3 py-1.5 text-xs shadow-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {busy === "crop" ? "Baking crop…" : "Building collage…"}
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default PhotoEditor
