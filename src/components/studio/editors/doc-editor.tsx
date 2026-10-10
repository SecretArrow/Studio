"use client"

/**
 * Doc Editor — block-based A4 document editor for doc.type "doc".
 *
 * Owns: document state + undo/redo history, the stacked-pages editing
 * surface, formatting toolbar, insert menu (image/table/chart/divider/
 * page break/TOC/link), page setup (margins, page numbers, header/footer),
 * print preview, and the EditorHandle contract (export / getThumbnail /
 * isDirty). Autosave flows through onDocChange on every commit.
 *
 * Export: PDF (with headers/footers/page numbers via the derived print doc),
 * Word-compatible HTML (.doc) + clean HTML, JSON, plus the generic raster
 * formats via the shared renderer.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { DesignDoc, DesignElement, ImageElement, PageModel, TextElement } from "@/lib/design/types"
import { createImage, createPage, createShape, createChart, createTable } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { exportDoc, getThumbnail as renderThumbnail, renderPageToCanvas } from "@/lib/editor/export"
import { Loader2, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BlockSurface } from "./doc/block-surface"
import { DocToolbar, type DocToolbarApi, type InsertKind } from "./doc/toolbar"
import { DocPropertiesPanel, type DocPanelApi } from "./doc/properties-panel"
import { buildDocHtml, buildPrintDoc, buildTocText, contentWidth, createBlock, getDocMeta, marginsOf, measureBlockHeight, nextBlockY, reflowToMargins, TEXT_STYLES, TOC_NAME, type DocMeta, type TextStyleKind } from "./doc/model"

const DocEditor = forwardRef<EditorHandle, EditorProps>(function DocEditor({ project, initialDoc, role, onDocChange, registerHandle }, _ref) {
  void project
  const canEdit = role === "owner" || role === "editor"
  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [zoom, setZoomState] = useState(1)
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [panelOpen, setPanelOpen] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<{ pages: string[]; done: boolean }>({ pages: [], done: false })

  const docRef = useRef<DesignDoc>(initialDoc)
  const dirtyRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [history] = useState(() => new HistoryStore(initialDoc, 60))

  const meta = useMemo(() => getDocMeta(doc), [doc])

  /* ------------------------- helpers ------------------------- */

  const syncHistoryState = useCallback(() => {
    setHistoryState({ canUndo: history.canUndo, canRedo: history.canRedo })
  }, [history])

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

  const pageIndexOfElement = useCallback((id: string | null): number => {
    if (!id) return 0
    const d = docRef.current
    return Math.max(
      0,
      d.pages.findIndex((p) => p.elements.some((e) => e.id === id)),
    )
  }, [])

  const findElement = useCallback((id: string | null): { el: DesignElement; page: PageModel; pageIndex: number } | null => {
    if (!id) return null
    const d = docRef.current
    for (let i = 0; i < d.pages.length; i += 1) {
      const el = d.pages[i].elements.find((e) => e.id === id)
      if (el) return { el, page: d.pages[i], pageIndex: i }
    }
    return null
  }, [])

  const updateElement = useCallback(
    (id: string, patch: Partial<DesignElement>, coalesceKey?: string) => {
      if (!canEdit) return
      const prev = docRef.current
      commit(
        {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            elements: page.elements.map((el) => {
              if (el.id !== id) return el
              const merged = { ...el, ...patch } as DesignElement
              if (merged.type === "text") {
                const t = merged as TextElement
                return { ...t, height: measureBlockHeight(t) }
              }
              return merged
            }),
          })),
        },
        coalesceKey,
      )
    },
    [canEdit, commit],
  )

  const onTextChange = useCallback(
    (id: string, text: string) => {
      updateElement(id, { text }, `text:${id}`)
    },
    [updateElement],
  )

  const onMoveElement = useCallback(
    (id: string, x: number, y: number) => {
      updateElement(id, { x: Math.max(0, x), y: Math.max(0, y) })
    },
    [updateElement],
  )

  /* ------------------------- fit zoom (deferred) ------------------------- */

  useEffect(() => {
    const t = setTimeout(() => {
      const container = containerRef.current
      if (!container) return
      const w = container.clientWidth - 48
      if (w > 200) setZoomState(Math.min(1, Math.max(0.4, w / docRef.current.width)))
    }, 0)
    return () => clearTimeout(t)
  }, [])

  /* ------------------------- inserts ------------------------- */

  const scrollToPage = useCallback((idx: number) => {
    setTimeout(() => {
      containerRef.current?.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)
  }, [])

  /** Place a block, creating a new page when it would overflow the content area. */
  const placeBlock = useCallback(
    (el: DesignElement, estimatedHeight: number, name: string): string => {
      const prev = docRef.current
      const m = marginsOf(prev)
      let pageIndex = pageIndexOfElement(selectedId)
      let page = prev.pages[pageIndex] ?? prev.pages[0]
      let y = nextBlockY(page, prev)
      if (y + estimatedHeight > prev.height - m.bottom) {
        const newPage = createPage({ name: `Page ${prev.pages.length + 1}`, background: page.background })
        const pages = [...prev.pages]
        pages.splice(pageIndex + 1, 0, newPage)
        const next = { ...prev, pages }
        commit(next)
        pageIndex += 1
        page = newPage
        y = m.top
        scrollToPage(pageIndex)
        const placed = { ...el, y }
        commit(
          {
            ...next,
            pages: next.pages.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, placed] } : p)),
          },
          undefined,
        )
        setSelectedId(el.id)
        if (el.type === "text") setEditingId(el.id)
        return el.id
      }
      const placed = { ...el, y, name }
      commit({ ...prev, pages: prev.pages.map((p, i) => (i === pageIndex ? { ...p, elements: [...p.elements, placed] } : p)) })
      setSelectedId(el.id)
      if (el.type === "text") setEditingId(el.id)
      return el.id
    },
    [commit, pageIndexOfElement, scrollToPage, selectedId],
  )

  const insertBlock = useCallback(
    (kind: InsertKind) => {
      if (!canEdit) return
      const d = docRef.current
      const W = contentWidth(d)
      const m = marginsOf(d)
      switch (kind) {
        case "image": {
          fileRef.current?.click()
          break
        }
        case "table": {
          const rows = Array.from({ length: 4 }, () => ["", "", ""])
          const el = createTable({ x: m.x, y: 0, width: W, height: 40 * rows.length, rows, fontSize: 13 })
          placeBlock(el, el.height, "Table")
          break
        }
        case "chart": {
          const el = createChart({ x: m.x, y: 0, width: Math.round(W * 0.85), height: Math.round(W * 0.5) })
          placeBlock(el, el.height, "Chart")
          break
        }
        case "divider": {
          const el = createShape({ variant: "line", x: m.x, y: 0, width: W, height: 10, fill: "#d4d4d8", strokeWidth: 2, cornerRadius: 0 })
          placeBlock(el, el.height, "Divider")
          break
        }
        case "page-break": {
          const pageIndex = pageIndexOfElement(selectedId)
          const newPage = createPage({ name: `Page ${d.pages.length + 1}`, background: d.pages[pageIndex]?.background ?? d.background })
          const pages = [...d.pages]
          pages.splice(pageIndex + 1, 0, newPage)
          commit({ ...d, pages })
          scrollToPage(pageIndex + 1)
          break
        }
        case "toc": {
          const el = createBlock(d, { text: buildTocText(d), y: 0, name: TOC_NAME, fontSize: 15, lineHeight: 1.8, color: "#374151" })
          el.height = measureBlockHeight(el)
          placeBlock(el, el.height, TOC_NAME)
          break
        }
        case "link":
          break
      }
    },
    [canEdit, pageIndexOfElement, placeBlock, scrollToPage, selectedId, commit],
  )

  const onImageFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file.type.startsWith("image/")) return
      const reader = new FileReader()
      reader.onload = () => {
        const src = String(reader.result)
        const probe = new Image()
        probe.onload = () => {
          const d = docRef.current
          const W = contentWidth(d)
          const width = Math.min(Math.round(W * 0.85), probe.naturalWidth)
          const height = Math.round((probe.naturalHeight / probe.naturalWidth) * width)
          const el = createImage({ src, x: marginsOf(d).x, y: 0, width, height, name: file.name } as Partial<ImageElement> & { x: number; y: number; src: string })
          placeBlock(el, height, file.name)
        }
        probe.src = src
      }
      reader.readAsDataURL(file)
    },
    [placeBlock],
  )

  const insertLink = useCallback(
    (label: string, url: string) => {
      if (!canEdit) return
      const found = findElement(selectedId)
      if (found && found.el.type === "text") {
        const t = found.el as TextElement
        const next = `${t.text}${t.text.endsWith("\n") || t.text === "" ? "" : "\n"}[${label}](${url})`
        updateElement(t.id, { text: next, height: measureBlockHeight({ ...t, text: next }) })
        return
      }
      const d = docRef.current
      const el = createBlock(d, { text: `[${label}](${url})`, y: 0, color: "#7c3aed", underline: true })
      el.height = measureBlockHeight(el)
      placeBlock(el, el.height, "Paragraph")
    },
    [canEdit, findElement, placeBlock, selectedId, updateElement],
  )

  const refreshToc = useCallback(() => {
    const found = findElement(selectedId)
    if (!found || found.el.type !== "text") return
    const t = found.el as TextElement
    const text = buildTocText(docRef.current)
    updateElement(t.id, { text, height: measureBlockHeight({ ...t, text }) })
  }, [findElement, selectedId, updateElement])

  /* ------------------------- formatting ------------------------- */

  const selectedText = useMemo(() => {
    for (const page of doc.pages) {
      const el = page.elements.find((e) => e.id === selectedId)
      if (el) return el.type === "text" ? (el as TextElement) : null
    }
    return null
  }, [doc, selectedId])

  const applyStyle = useCallback(
    (kind: TextStyleKind) => {
      const t = selectedText
      if (!canEdit || !t) return
      const s = TEXT_STYLES[kind]
      const names: Record<TextStyleKind, string> = { h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", body: "Paragraph", quote: "Quote" }
      updateElement(t.id, {
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        italic: !!s.italic,
        bgColor: s.bgColor,
        color: s.color,
        lineHeight: s.lineHeight,
        name: names[kind],
      })
    },
    [canEdit, selectedText, updateElement],
  )

  const toggleFormat = useCallback(
    (key: "bold" | "italic" | "underline") => {
      const t = selectedText
      if (!canEdit || !t) return
      if (key === "bold") updateElement(t.id, { fontWeight: t.fontWeight >= 700 ? 400 : 700 })
      else if (key === "italic") updateElement(t.id, { italic: !t.italic })
      else updateElement(t.id, { underline: !t.underline })
    },
    [canEdit, selectedText, updateElement],
  )

  const setMeta = useCallback(
    (patch: Partial<DocMeta>) => {
      if (!canEdit) return
      const prev = docRef.current
      const current = getDocMeta(prev)
      if (patch.margin && patch.margin !== current.margin) {
        commit(reflowToMargins(prev, patch.margin))
        return
      }
      commit({ ...prev, meta: { ...prev.meta, ...patch } })
    },
    [canEdit, commit],
  )

  /* ------------------------- undo / redo / delete ------------------------- */

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

  const deleteSelected = useCallback(() => {
    if (!canEdit || !selectedId) return
    const prev = docRef.current
    commit({ ...prev, pages: prev.pages.map((p) => ({ ...p, elements: p.elements.filter((e) => e.id !== selectedId) })) })
    setSelectedId(null)
    setEditingId(null)
  }, [canEdit, commit, selectedId])

  /* ------------------------- keyboard ------------------------- */

  useEffect(() => {
    function isTextEntry(t: EventTarget | null): boolean {
      const el = t as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    function onKey(e: KeyboardEvent) {
      if (isTextEntry(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault()
        deleteSelected()
      } else if (e.key === "Escape") {
        setEditingId(null)
        setSelectedId(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [deleteSelected, redo, selectedId, undo])

  /* ------------------------- print preview rendering ------------------------- */

  useEffect(() => {
    if (!preview) return
    let alive = true
    const t = setTimeout(() => {
      setPreviewUrls({ pages: [], done: false })
      void (async () => {
        const print = buildPrintDoc(docRef.current)
        const urls: string[] = []
        for (const page of print.pages) {
          const canvas = await renderPageToCanvas(print, page, { maxSide: 1000 })
          urls.push(canvas.toDataURL("image/jpeg", 0.85))
        }
        if (alive) setPreviewUrls({ pages: urls, done: true })
      })()
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [doc, preview])

  /* ------------------------------ editor handle ------------------------------ */

  useImperativeHandle(
    _ref,
    () => ({
      export: async (req): Promise<ExportResult[]> => {
        const base = (req.filenameBase ?? "document").replace(/[^\w\-. ]+/g, "_").slice(0, 60)
        if (req.format === "html") {
          const { html, notes } = await buildDocHtml(docRef.current)
          return [
            {
              filename: `${base}.doc`,
              blob: new Blob([html], { type: "application/msword" }),
              note: notes.length > 0 ? `Word-compatible .doc + clean .html exported. ${notes[0]}` : "Word-compatible .doc + clean .html exported.",
            },
            { filename: `${base}.html`, blob: new Blob([html], { type: "text/html" }) },
          ]
        }
        if (req.format === "json") return exportDoc(docRef.current, req)
        // pdf / png / jpeg / webp / zip / svg render the derived print doc
        return exportDoc(buildPrintDoc(docRef.current), req)
      },
      getThumbnail: async () => {
        const current = docRef.current
        const idx = selectedId ? Math.max(0, current.pages.findIndex((p) => p.elements.some((e) => e.id === selectedId))) : 0
        const page = current.pages[idx] ?? current.pages[0]
        return renderThumbnail(current, page)
      },
      isDirty: () => dirtyRef.current,
    }),
    [selectedId],
  )

  useEffect(() => {
    const handle: EditorHandle = {
      export: async (req): Promise<ExportResult[]> => {
        const base = (req.filenameBase ?? "document").replace(/[^\w\-. ]+/g, "_").slice(0, 60)
        if (req.format === "html") {
          const { html, notes } = await buildDocHtml(docRef.current)
          return [
            {
              filename: `${base}.doc`,
              blob: new Blob([html], { type: "application/msword" }),
              note: notes.length > 0 ? `Word-compatible .doc + clean .html exported. ${notes[0]}` : "Word-compatible .doc + clean .html exported.",
            },
            { filename: `${base}.html`, blob: new Blob([html], { type: "text/html" }) },
          ]
        }
        if (req.format === "json") return exportDoc(docRef.current, req)
        return exportDoc(buildPrintDoc(docRef.current), req)
      },
      getThumbnail: async () => {
        const current = docRef.current
        const idx = selectedId ? Math.max(0, current.pages.findIndex((p) => p.elements.some((e) => e.id === selectedId))) : 0
        const page = current.pages[idx] ?? current.pages[0]
        return renderThumbnail(current, page)
      },
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [registerHandle, selectedId])

  /* ------------------------------ panel apis ------------------------------ */

  const selectedElement = useMemo(() => {
    for (const page of doc.pages) {
      const el = page.elements.find((e) => e.id === selectedId)
      if (el) return el
    }
    return null
  }, [doc, selectedId])

  const toolbarApi = useMemo<DocToolbarApi>(
    () => ({
      canEdit,
      hasSelection: !!selectedId,
      selectedText,
      selectedIsToc: selectedElement?.type === "text" && selectedElement.name === TOC_NAME,
      preview,
      zoom,
      canUndo: historyState.canUndo,
      canRedo: historyState.canRedo,
      meta,
      undo,
      redo,
      applyStyle,
      toggle: toggleFormat,
      setAlign: (a) => selectedText && updateElement(selectedText.id, { align: a }),
      setList: (style) => selectedText && updateElement(selectedText.id, { listStyle: style }),
      setColor: (c) => selectedText && updateElement(selectedText.id, { color: c }, `color:${selectedText.id}`),
      setFontSize: (n) => selectedText && updateElement(selectedText.id, { fontSize: n }, `fs:${selectedText.id}`),
      setMeta,
      togglePreview: () => setPreview((p) => !p),
      setZoom: setZoomState,
      insert: insertBlock,
      refreshToc,
      insertLink,
    }),
    [applyStyle, canEdit, historyState.canRedo, historyState.canUndo, insertBlock, insertLink, meta, preview, redo, refreshToc, selectedElement, selectedId, selectedText, setMeta, toggleFormat, undo, updateElement, zoom],
  )

  const panelApi = useMemo<DocPanelApi>(
    () => ({
      doc,
      selected: selectedElement,
      canEdit,
      updateElement,
      deleteSelected,
      refreshToc,
    }),
    [canEdit, deleteSelected, doc, refreshToc, selectedElement, updateElement],
  )

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <DocToolbar api={toolbarApi} />

      <div className="relative flex min-h-0 flex-1">
        <div ref={containerRef} className="relative min-w-0 flex-1">
          {preview ? (
            <div className="h-full overflow-auto bg-muted/60 px-3 py-6">
              <div className="mx-auto flex flex-col items-center gap-6" style={{ width: Math.max(240, doc.width * zoom) }}>
                {!previewUrls.done ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-xs">Rendering pages exactly as they will print…</p>
                  </div>
                ) : (
                  previewUrls.pages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Page ${i + 1} preview`}
                      className="w-full rounded-sm bg-white shadow-md ring-1 ring-black/10"
                      style={{ width: doc.width * zoom }}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
            <BlockSurface
              doc={doc}
              canEdit={canEdit}
              zoom={zoom}
              selectedId={selectedId}
              editingId={editingId}
              onSelect={setSelectedId}
              onStartEdit={setEditingId}
              onTextChange={onTextChange}
              onMoveElement={onMoveElement}
            />
          )}

          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(e) => {
            onImageFiles(e.target.files)
            e.target.value = ""
          }} />
        </div>

        {/* properties — desktop */}
        <aside className="hidden w-[300px] shrink-0 border-l bg-card xl:block" aria-label="Element properties">
          <DocPropertiesPanel api={panelApi} />
        </aside>

        {/* properties — mobile sheet */}
        {panelOpen ? (
          <div className="absolute inset-0 z-30 flex flex-col justify-end xl:hidden" onClick={() => setPanelOpen(false)}>
            <div className="flex max-h-[62%] flex-col rounded-t-2xl border-t bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPanelOpen(false)} aria-label="Close properties">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <DocPropertiesPanel api={panelApi} />
              </div>
            </div>
          </div>
        ) : null}

        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 h-11 w-11 shadow-lg xl:hidden"
          onClick={() => setPanelOpen((p) => !p)}
          aria-label="Toggle properties panel"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
})

export default DocEditor
