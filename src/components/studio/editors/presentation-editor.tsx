"use client"

/**
 * Presentation Editor — slide-based editor for doc.type "presentation".
 *
 * Owns: document state + undo/redo history, slide sorter, lightweight Konva
 * slide stage, per-slide properties (transition / notes / layout / background /
 * themes), present mode (F5) and the EditorHandle contract
 * (export / getThumbnail / present / isDirty).
 *
 * Rendering + export share the headless renderer in src/lib/editor/export.ts,
 * so slides look identical in the editor, present mode and every export.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { DesignDoc, DesignElement, PageModel, TextElement } from "@/lib/design/types"
import { createPage, defaultBackground, uid } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { exportDoc, getThumbnail as renderThumbnail, renderPageThumbnail } from "@/lib/editor/export"
import { measureTextBlockHeight } from "@/lib/editor/geometry"
import { BarChart3, Image as ImageIcon, Shapes, SlidersHorizontal, Type, Undo2, Redo2, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SlideStage, type ElementPatch } from "./presentation/slide-stage"
import { SlideSorter } from "./presentation/slide-sorter"
import { SlideProperties } from "./presentation/slide-properties"
import { DataPanel, PhotosPanel, ShapesPanel, TextPanel, type PresentationPanelApi } from "./presentation/panels"
import { PresentMode } from "./presentation/present-mode"
import { zipPngsAndPdf } from "./presentation/exports"
import { applyThemeToElements, getTheme, layoutElements, type LayoutKind, type SlideTheme } from "./presentation/themes"

type TabId = "text" | "shapes" | "photos" | "data" | "slide"

const PresentationEditor = forwardRef<EditorHandle, EditorProps>(function PresentationEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  void project
  const canEdit = role === "owner" || role === "editor"
  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [pageIndex, setPageIndexState] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [activeTab, setActiveTab] = useState<TabId | null>(null)
  const [panelOpenMobile, setPanelOpenMobile] = useState<TabId | null>(null)

  const docRef = useRef<DesignDoc>(initialDoc)
  const pageIndexRef = useRef(0)
  const presentingRef = useRef(false)
  const dirtyRef = useRef(false)
  const [history] = useState(() => new HistoryStore(initialDoc, 60))

  const safeIndex = Math.min(pageIndex, doc.pages.length - 1)
  const page: PageModel = doc.pages[safeIndex] ?? doc.pages[0]
  const selection = useMemo(() => page.elements.filter((e) => selectedIds.includes(e.id)), [page.elements, selectedIds])

  useEffect(() => {
    presentingRef.current = presenting
  }, [presenting])
  useEffect(() => {
    pageIndexRef.current = safeIndex
  }, [safeIndex])

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
      const idx = Math.min(pageIndexRef.current, prev.pages.length - 1)
      commit({ ...prev, pages: prev.pages.map((p, i) => (i === idx ? fn(p) : p)) }, coalesceKey)
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

  const addElements = useCallback(
    (els: DesignElement[]) => {
      if (!canEdit || els.length === 0) return
      const prepared = els.map(ensureTextHeight)
      mutatePage((p) => ({ ...p, elements: [...p.elements, ...prepared] }))
      setSelectedIds(prepared.map((el) => el.id))
    },
    [canEdit, mutatePage],
  )

  const deleteSelected = useCallback(() => {
    if (!canEdit || selectedIds.length === 0) return
    const set = new Set(selectedIds)
    mutatePage((p) => ({ ...p, elements: p.elements.filter((e) => !set.has(e.id)) }))
    setSelectedIds([])
    setEditingId(null)
  }, [canEdit, mutatePage, selectedIds])

  const duplicateSelected = useCallback(() => {
    if (!canEdit || selection.length === 0) return
    const clones = selection.map((el) => ({ ...el, id: uid("dup"), x: el.x + 32, y: el.y + 32 }) as DesignElement)
    mutatePage((p) => ({ ...p, elements: [...p.elements, ...clones] }))
    setSelectedIds(clones.map((c) => c.id))
  }, [canEdit, mutatePage, selection])

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

  const dropPos = useCallback(
    (w: number, h: number) => ({
      x: Math.max(8, Math.round((doc.width - w) / 2)),
      y: Math.max(8, Math.round((doc.height - h) / 2)),
    }),
    [doc.width, doc.height],
  )

  const startEdit = useCallback((id: string) => {
    setEditingId(id)
  }, [])

  /* ------------------------------ slides ------------------------------ */

  const metaThemeId = typeof doc.meta?.themeId === "string" ? doc.meta.themeId : undefined
  const currentTheme = getTheme(metaThemeId)

  const setPageIndex = useCallback((i: number) => {
    const d = docRef.current
    const clamped = Math.max(0, Math.min(i, d.pages.length - 1))
    pageIndexRef.current = clamped
    setPageIndexState(clamped)
    setSelectedIds([])
    setEditingId(null)
  }, [])

  const addSlide = useCallback(
    (duplicate = false) => {
      if (!canEdit) return
      const prev = docRef.current
      const current = prev.pages[Math.min(pageIndexRef.current, prev.pages.length - 1)]
      let newPage: PageModel
      if (duplicate) {
        newPage = {
          ...current,
          id: uid("page"),
          name: `${current.name} copy`,
          elements: current.elements.map((el) => ({ ...el, id: uid("el") }) as DesignElement),
        }
      } else {
        newPage = createPage({
          name: `Slide ${prev.pages.length + 1}`,
          background: currentTheme?.background ?? defaultBackground("#ffffff"),
        })
      }
      const pages = [...prev.pages]
      pages.splice(pageIndexRef.current + 1, 0, newPage)
      commit({ ...prev, pages })
      setPageIndex(pageIndexRef.current + 1)
    },
    [canEdit, commit, currentTheme?.background, setPageIndex],
  )

  const deleteSlide = useCallback(
    (index: number) => {
      if (!canEdit) return
      const prev = docRef.current
      if (prev.pages.length <= 1) return
      const pages = prev.pages.filter((_, i) => i !== index)
      commit({ ...prev, pages })
      setPageIndex(pageIndexRef.current > index ? pageIndexRef.current - 1 : pageIndexRef.current)
    },
    [canEdit, commit, setPageIndex],
  )

  const moveSlide = useCallback(
    (from: number, to: number) => {
      if (!canEdit || from === to) return
      const prev = docRef.current
      const pages = [...prev.pages]
      const [moved] = pages.splice(from, 1)
      pages.splice(to, 0, moved)
      commit({ ...prev, pages })
      setPageIndex(pageIndexRef.current === from ? to : pageIndexRef.current)
    },
    [canEdit, commit, setPageIndex],
  )

  const patchPage = useCallback(
    (patch: Partial<PageModel>, coalesceKey?: string) => {
      if (!canEdit) return
      mutatePage((p) => ({ ...p, ...patch }), coalesceKey)
    },
    [canEdit, mutatePage],
  )

  const applyTheme = useCallback(
    (theme: SlideTheme, scope: "all" | "new") => {
      if (!canEdit) return
      const prev = docRef.current
      if (scope === "all") {
        commit({
          ...prev,
          meta: { ...prev.meta, themeId: theme.id },
          pages: prev.pages.map((p) => ({
            ...p,
            background: theme.background,
            elements: applyThemeToElements(p.elements, theme),
          })),
        })
      } else {
        commit({ ...prev, meta: { ...prev.meta, themeId: theme.id } })
      }
    },
    [canEdit, commit],
  )

  const applyLayout = useCallback(
    (kind: LayoutKind) => {
      if (!canEdit) return
      const els = layoutElements(kind, docRef.current.width, docRef.current.height, currentTheme)
      if (els.length === 0) return
      addElements(els)
    },
    [addElements, canEdit, currentTheme],
  )

  const changePresentNotes = useCallback(
    (index: number, notes: string) => {
      const prev = docRef.current
      commit({ ...prev, pages: prev.pages.map((p, i) => (i === index ? { ...p, notes } : p)) }, `present-notes:${index}`)
    },
    [commit],
  )

  /* ------------------------------ undo / redo ------------------------------ */

  const undo = useCallback(() => {
    const restored = history.undo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
  }, [history, onDocChange, syncHistoryState])

  const redo = useCallback(() => {
    const restored = history.redo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    onDocChange(restored)
    syncHistoryState()
  }, [history, onDocChange, syncHistoryState])

  /* ------------------------------ present ------------------------------ */

  const presentNow = useCallback(() => {
    setEditingId(null)
    setPresenting(true)
  }, [])

  const exitPresent = useCallback(() => {
    setPresenting(false)
  }, [])

  const renderThumb = useCallback((p: PageModel, width: number) => renderPageThumbnail(docRef.current, p, width), [])

  /* ------------------------------ keyboard ------------------------------ */

  useEffect(() => {
    function isTextEntry(t: EventTarget | null): boolean {
      const el = t as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    function onKey(e: KeyboardEvent) {
      if (presentingRef.current) return // PresentMode owns the keyboard while active
      if (isTextEntry(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (e.key === "F5") {
        e.preventDefault()
        presentNow()
        return
      }
      if (e.key === "Escape") {
        if (editingId) setEditingId(null)
        else if (selectedIds.length > 0) setSelectedIds([])
        else if (activeTab) setActiveTab(null)
        return
      }
      if (!canEdit) return
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault()
        duplicateSelected()
        return
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault()
        deleteSelected()
        return
      }
      if (!mod && selectedIds.length === 0) {
        if (e.key === "ArrowRight" || e.key === "PageDown") {
          e.preventDefault()
          setPageIndex(pageIndexRef.current + 1)
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault()
          setPageIndex(pageIndexRef.current - 1)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeTab, canEdit, deleteSelected, duplicateSelected, editingId, presentNow, redo, selectedIds.length, setPageIndex, undo])

  /* ------------------------------ editor handle ------------------------------ */

  useImperativeHandle(
    _ref,
    () => ({
      export: async (req): Promise<ExportResult[]> => {
        if (req.format === "zip") return zipPngsAndPdf(docRef.current, req.filenameBase ?? "presentation", req.pages)
        return exportDoc(docRef.current, req)
      },
      getThumbnail: async () => {
        const current = docRef.current
        const p = current.pages[Math.min(pageIndexRef.current, current.pages.length - 1)]
        return renderThumbnail(current, p)
      },
      present: presentNow,
      isDirty: () => dirtyRef.current,
    }),
    [presentNow],
  )

  // the shell persists via registerHandle (same handle as the imperative ref)
  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req): Promise<ExportResult[]> => {
        if (req.format === "zip") return zipPngsAndPdf(docRef.current, req.filenameBase ?? "presentation", req.pages)
        return exportDoc(docRef.current, req)
      },
      getThumbnail: async () => {
        const current = docRef.current
        const p = current.pages[Math.min(pageIndexRef.current, current.pages.length - 1)]
        return renderThumbnail(current, p)
      },
      present: presentNow,
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [presentNow, registerHandle])

  /* ------------------------------ panel api ------------------------------ */

  const api = useMemo<PresentationPanelApi>(
    () => ({
      doc,
      page,
      pageIndex: safeIndex,
      canEdit,
      selectedIds,
      selection,
      addElements,
      updateElements,
      deleteSelected,
      duplicateSelected,
      dropPos,
      startEdit,
    }),
    [addElements, canEdit, deleteSelected, doc, dropPos, duplicateSelected, page, safeIndex, selection, selectedIds, startEdit, updateElements],
  )

  const TABS: { id: TabId; label: string; icon: React.ReactNode; mobileOnly?: boolean }[] = [
    { id: "text", label: "Text", icon: <Type className="h-5 w-5" /> },
    { id: "shapes", label: "Shapes", icon: <Shapes className="h-5 w-5" /> },
    { id: "photos", label: "Photos", icon: <ImageIcon className="h-5 w-5" /> },
    { id: "data", label: "Charts & data", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "slide", label: "Slide", icon: <SlidersHorizontal className="h-5 w-5" />, mobileOnly: true },
  ]

  const openTab: TabId | null = panelOpenMobile ?? activeTab

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1">
        {/* left rail */}
        <nav className="z-40 flex shrink-0 flex-row items-center gap-0.5 overflow-x-auto border-b bg-card px-1.5 py-1 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-1.5 md:py-2" aria-label="Presentation tools">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={openTab === tab.id ? "secondary" : "ghost"}
              size="icon"
              className={cn("h-11 w-11 shrink-0", tab.mobileOnly && "lg:hidden")}
              onClick={() => {
                if (tab.mobileOnly) setPanelOpenMobile((p) => (p === tab.id ? null : tab.id))
                else setActiveTab((p) => (p === tab.id ? null : tab.id))
              }}
              aria-label={tab.label}
              aria-pressed={openTab === tab.id}
              title={tab.label}
            >
              {tab.icon}
            </Button>
          ))}
          <div className="mx-1 h-6 w-px bg-border md:my-1 md:h-px md:w-6" />
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={undo} disabled={!historyState.canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={redo} disabled={!historyState.canRedo} aria-label="Redo" title="Redo (Ctrl+Y)">
            <Redo2 className="h-5 w-5" />
          </Button>
          <div className="mx-1 h-6 w-px bg-border md:my-1 md:h-px md:w-6" />
          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-primary" onClick={presentNow} aria-label="Present (F5)" title="Present (F5)">
            <Play className="h-5 w-5" />
          </Button>
        </nav>

        {/* left panel */}
        {openTab !== null ? (
          <aside
            className="absolute inset-y-0 left-[52px] z-30 flex w-[300px] max-w-[86vw] flex-col border-r bg-card shadow-2xl md:static md:left-auto md:z-auto md:shadow-none"
            aria-label={`${TABS.find((t) => t.id === openTab)?.label} panel`}
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{TABS.find((t) => t.id === openTab)?.label}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setPanelOpenMobile(null)
                  setActiveTab(null)
                }}
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {openTab === "text" && <TextPanel api={api} />}
              {openTab === "shapes" && <ShapesPanel api={api} />}
              {openTab === "photos" && <PhotosPanel api={api} />}
              {openTab === "data" && <DataPanel api={api} />}
              {openTab === "slide" && (
                <SlideProperties doc={doc} page={page} pageIndex={safeIndex} canEdit={canEdit} onPatchPage={patchPage} onApplyTheme={applyTheme} onApplyLayout={applyLayout} />
              )}
            </div>
          </aside>
        ) : null}

        {/* stage */}
        <div className="relative min-w-0 flex-1">
          <SlideStage
            doc={doc}
            page={page}
            canEdit={canEdit}
            selectedIds={selectedIds}
            onSelectIds={selectIds}
            onUpdateElements={updateElements}
            editingId={editingId}
            onStartEdit={setEditingId}
          />
          {/* mobile slide properties trigger note */}
          <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground shadow-sm lg:hidden">
            Slide settings → toolbar
          </div>
        </div>

        {/* right properties (desktop) */}
        <aside className="hidden w-[300px] shrink-0 border-l bg-card lg:block" aria-label="Slide properties">
          <SlideProperties doc={doc} page={page} pageIndex={safeIndex} canEdit={canEdit} onPatchPage={patchPage} onApplyTheme={applyTheme} onApplyLayout={applyLayout} />
        </aside>
      </div>

      {/* slide sorter */}
      <SlideSorter
        doc={doc}
        pageIndex={safeIndex}
        canEdit={canEdit}
        onSelect={setPageIndex}
        onAdd={() => addSlide(false)}
        onDuplicate={() => addSlide(true)}
        onDelete={deleteSlide}
        onMove={moveSlide}
        renderThumb={renderThumb}
      />

      {/* present mode overlay */}
      {presenting ? <PresentMode doc={doc} pageIndex={safeIndex} onIndexChange={setPageIndex} onExit={exitPresent} onNotesChange={changePresentNotes} /> : null}
    </div>
  )
})

export default PresentationEditor
