"use client"

/**
 * Website Editor — doc.type "website", doc.config = WebsiteConfig.
 *
 * Owns: document state + undo/redo history, multi-page tabs, section palette,
 * device-width live preview of REAL section components, per-section props
 * panel, theme/SEO/custom-CSS editor and the honest Publish panel.
 *
 * Exports (EditorHandle): html (single self-contained file), zip (pages +
 * assets/NOTES.txt), png (in-browser SVG raster of the current page),
 * json (project). There is intentionally NO "published" state — see PublishPanel.
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportRequest, ExportResult } from "./types"
import type { DesignDoc, WebsiteConfig, WebsiteSection } from "@/lib/design/types"
import { uid } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/studio/api-client"
import { cn } from "@/lib/utils"
import {
  AlignLeft, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BarChart3, Building2, Copy, Eye, EyeOff, HelpCircle,
  Image as ImageIcon, LayoutGrid, Mail, Megaphone, Monitor, Navigation, PanelBottom, Pencil, Play, Plus, Quote,
  Redo2, Smartphone, Star, Tablet, Tag, Trash2, Undo2, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { makeSection, normalizeWebsiteConfig, pageSlug, DEVICE_WIDTH } from "./website/model"
import type { Device, SectionKind } from "./website/model"
import { SectionBody, anchorFor } from "./website/sections"
import { SectionPropsEditor } from "./website/props-editor"
import { ThemeEditor, PublishPanel } from "./website/panels"
import { buildSiteCss } from "./website/site-css"
import { buildSiteHtml, buildSiteZip, rasterizeElement } from "./website/site-export"

const KIND_ICONS: Record<SectionKind, typeof Navigation> = {
  nav: Navigation, hero: Star, features: LayoutGrid, gallery: ImageIcon, video: Play, testimonials: Quote,
  pricing: Tag, faq: HelpCircle, cta: Megaphone, contact: Mail, footer: PanelBottom, richText: AlignLeft,
  logos: Building2, stats: BarChart3,
}

function dataUrlToBlob(dataUrl: string): Blob {
  const bin = atob(dataUrl.split(",")[1])
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: "image/png" })
}

const WebsiteEditor = forwardRef<EditorHandle, EditorProps>(function WebsiteEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  void project
  const canEdit = role === "owner" || role === "editor"
  const { toast } = useToast()

  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [device, setDevice] = useState<Device>("desktop")
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [railTab, setRailTab] = useState<"sections" | "theme" | "publish">("sections")
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)

  const docRef = useRef(doc)
  const dirtyRef = useRef(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const previewRootRef = useRef<HTMLDivElement>(null)
  const thumbCache = useRef<{ key: string; url: string } | null>(null)
  const [history] = useState(() => new HistoryStore(initialDoc, 60))

  /* --------------------------- document plumbing --------------------------- */

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

  const patchConfig = useCallback(
    (fn: (c: WebsiteConfig) => WebsiteConfig, coalesceKey?: string) => {
      const prev = docRef.current
      const cfg = normalizeWebsiteConfig(prev.config)
      commit({ ...prev, config: fn(cfg) }, coalesceKey)
    },
    [commit],
  )

  const undo = useCallback(() => {
    const restored = history.undo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    syncHistoryState()
    onDocChange(restored)
  }, [history, onDocChange, syncHistoryState])

  const redo = useCallback(() => {
    const restored = history.redo() as DesignDoc | null
    if (!restored) return
    docRef.current = restored
    dirtyRef.current = true
    setDoc(restored)
    syncHistoryState()
    onDocChange(restored)
  }, [history, onDocChange, syncHistoryState])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)
      if (typing) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  /* ------------------------------ derived data ------------------------------ */

  const config = useMemo(() => normalizeWebsiteConfig(doc.config), [doc.config])
  const safeIndex = Math.min(Math.max(pageIndex, 0), config.pages.length - 1)
  const page = config.pages[safeIndex]
  const selected = useMemo(() => page?.sections.find((s) => s.id === selectedId) ?? null, [page, selectedId])
  const css = useMemo(() => buildSiteCss(config.theme, config.customCss ?? ""), [config.theme, config.customCss])

  /* ------------------------------ page actions ------------------------------ */

  const setPageCount = config.pages.length

  const addPage = useCallback(() => {
    if (!canEdit) return
    const n = setPageCount + 1
    patchConfig((c) => ({
      ...c,
      pages: [...c.pages, { id: uid("page"), name: `Page ${n}`, path: `/page-${n}`, sections: [] }],
    }))
    setPageIndex(setPageCount)
    setSelectedId(null)
  }, [canEdit, patchConfig, setPageCount])

  const renamePage = useCallback(
    (id: string, name: string, path: string) => {
      patchConfig((c) => ({
        ...c,
        pages: c.pages.map((pg) => (pg.id === id ? { ...pg, name: name.trim() || pg.name, path: path.startsWith("/") ? path : `/${path}` } : pg)),
      }), `page:${id}`)
    },
    [patchConfig],
  )

  const deletePage = useCallback(
    (id: string) => {
      if (!canEdit || setPageCount <= 1) return
      if (!window.confirm("Delete this page and all of its sections? This can be undone with Ctrl+Z.")) return
      patchConfig((c) => ({ ...c, pages: c.pages.filter((pg) => pg.id !== id) }))
      setPageIndex((i) => Math.max(0, Math.min(i, setPageCount - 2)))
      setSelectedId(null)
    },
    [canEdit, patchConfig, setPageCount],
  )

  /* ---------------------------- section actions ---------------------------- */

  const patchSections = useCallback(
    (fn: (sections: WebsiteSection[]) => WebsiteSection[], coalesceKey?: string) => {
      patchConfig((c) => ({
        ...c,
        pages: c.pages.map((pg, i) => (i === safeIndex ? { ...pg, sections: fn(pg.sections) } : pg)),
      }), coalesceKey)
    },
    [patchConfig, safeIndex],
  )

  const addSection = useCallback(
    (kind: SectionKind) => {
      if (!canEdit) return
      const sec = makeSection(kind)
      patchSections((s) => [...s, sec])
      setSelectedId(sec.id)
      toast({ title: `${kind} section added`, description: "Click it on the canvas to edit its content." })
    },
    [canEdit, patchSections, toast],
  )

  const patchSectionProps = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      patchSections(
        (s) => s.map((sec) => (sec.id === id ? { ...sec, props: { ...sec.props, ...patch } } : sec)),
        `props:${id}`,
      )
    },
    [patchSections],
  )

  const moveSection = useCallback(
    (id: string, delta: number) => {
      patchSections((s) => {
        const i = s.findIndex((x) => x.id === id)
        const j = i + delta
        if (i < 0 || j < 0 || j >= s.length) return s
        const next = [...s]
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      })
    },
    [patchSections],
  )

  const duplicateSection = useCallback(
    (id: string) => {
      if (!canEdit) return
      const copyId = uid("sec")
      patchSections((s) => {
        const i = s.findIndex((x) => x.id === id)
        if (i < 0) return s
        const clone: WebsiteSection = { ...s[i], id: copyId, props: JSON.parse(JSON.stringify(s[i].props)) }
        return [...s.slice(0, i + 1), clone, ...s.slice(i + 1)]
      })
      setSelectedId(copyId)
    },
    [canEdit, patchSections],
  )

  const deleteSection = useCallback(
    (id: string) => {
      patchSections((s) => s.filter((x) => x.id !== id))
      setSelectedId((cur) => (cur === id ? null : cur))
    },
    [patchSections],
  )

  const toggleHidden = useCallback(
    (id: string) => {
      patchSections((s) =>
        s.map((sec) => {
          if (sec.id !== id) return sec
          const props = { ...sec.props } as Record<string, unknown>
          if (props._hidden) delete props._hidden
          else props._hidden = true
          return { ...sec, props }
        }),
      )
    },
    [patchSections],
  )

  /* --------------------------- preview interactions --------------------------- */

  const handlePreviewLink = useCallback(
    (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (href.startsWith("#/")) {
        const path = href.slice(1) || "/"
        const idx = config.pages.findIndex((p) => p.path === path)
        if (idx >= 0) {
          setPageIndex(idx)
          setSelectedId(null)
          previewRootRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          toast({ title: `No page with path ${path}`, description: "Add one from the page tabs above the canvas." })
        }
        return
      }
      if (href.startsWith("#") && href.length > 1) {
        const name = href.slice(1)
        const el = pageRef.current?.querySelector(`[data-anchor="${name}"]`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }
      if (/^https?:\/\//i.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer")
        return
      }
      if (/^mailto:/i.test(href)) {
        window.location.href = href
      }
    },
    [config.pages, toast],
  )

  const previewCtx = useMemo(
    () => ({ device, linkHref: (href: string) => href, onLinkClick: handlePreviewLink }),
    [device, handlePreviewLink],
  )

  /* --------------------------------- export --------------------------------- */

  const exportAs = useCallback(
    async (req: ExportRequest): Promise<ExportResult[]> => {
      const cfg = normalizeWebsiteConfig(docRef.current.config)
      const base = (req.filenameBase || "site").replace(/[/\\?%*:|"<>]/g, "-")
      if (req.format === "json") {
        return [{ filename: `${base}.studio.json`, blob: new Blob([JSON.stringify(docRef.current, null, 2)], { type: "application/json" }) }]
      }
      if (req.format === "zip") {
        const blob = await buildSiteZip(cfg)
        return [{ filename: `${base}-site.zip`, blob, note: "Static site archive — deployment guide inside assets/NOTES.txt." }]
      }
      if (req.format === "html") {
        const blob = new Blob([buildSiteHtml(cfg)], { type: "text/html;charset=utf-8" })
        return [{ filename: "index.html", blob, note: "Self-contained static site: open it locally or upload to any host." }]
      }
      if (req.format === "png") {
        const el = pageRef.current
        if (!el) throw new Error("Preview is not ready yet — try again in a moment.")
        const prevSel = selectedId
        setSelectedId(null)
        try {
          await new Promise((r) => setTimeout(r, 80))
          const dataUrl = await rasterizeElement(el, { css, targetWidth: Math.round(1200 * (req.scale ?? 1)) })
          const name = page ? pageSlug(page.path) : "page"
          return [{ filename: `${base}-${name}.png`, blob: dataUrlToBlob(dataUrl), note: "Rendered in-browser via SVG rasterization." }]
        } finally {
          setSelectedId(prevSel)
        }
      }
      throw new Error(`The website editor exports HTML, ZIP, PNG and JSON — not "${req.format}".`)
    },
    [css, page, selectedId],
  )

  const getThumbnail = useCallback(async (): Promise<string | null> => {
    const cfg = normalizeWebsiteConfig(docRef.current.config)
    const key = JSON.stringify(cfg)
    if (thumbCache.current?.key === key) return thumbCache.current.url
    const el = pageRef.current
    if (!el) return null
    try {
      const prevSel = selectedId
      setSelectedId(null)
      await new Promise((r) => setTimeout(r, 60))
      const url = await rasterizeElement(el, { css, targetWidth: 480 })
      setSelectedId(prevSel)
      thumbCache.current = { key, url }
      return url
    } catch {
      return null // honest: thumbnails are optional; saving continues without one
    }
  }, [css, selectedId])

  useEffect(() => {
    const handle: EditorHandle = {
      export: exportAs,
      getThumbnail,
      isDirty: () => dirtyRef.current,
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [exportAs, getThumbnail, registerHandle])

  const runExport = useCallback(
    async (format: "zip" | "png" | "json") => {
      setBusy(true)
      try {
        const results = await exportAs({ format, filenameBase: config.siteName || "site" })
        for (const r of results) downloadBlob(r.blob, r.filename)
        if (results[0]?.note) toast({ title: "Export ready", description: results[0].note })
      } catch (err) {
        toast({ title: "Export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
      } finally {
        setBusy(false)
      }
    },
    [config.siteName, exportAs, toast],
  )

  /* ---------------------------------- render ---------------------------------- */

  if (!page) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">This document has no website content.</div>
  }

  const deviceWidth = DEVICE_WIDTH[device]

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar: pages + device + history */}
      <div className="flex shrink-0 items-center gap-2 border-b bg-card px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {config.pages.map((pg, i) => (
            <div key={pg.id} className={cn("group flex shrink-0 items-center rounded-md border text-xs", i === safeIndex ? "border-primary/60 bg-primary/10" : "border-transparent hover:bg-accent")}>
              {renaming === pg.id ? (
                <Input
                  autoFocus
                  value={pg.name}
                  disabled={!canEdit}
                  onChange={(e) => renamePage(pg.id, e.target.value, pg.path)}
                  onBlur={() => setRenaming(null)}
                  onKeyDown={(e) => e.key === "Enter" && setRenaming(null)}
                  className="h-7 w-28 text-xs"
                  aria-label="Page name"
                />
              ) : (
                <button
                  type="button"
                  className="min-h-[32px] px-3 py-1.5 font-medium"
                  onClick={() => { setPageIndex(i); setSelectedId(null) }}
                  onDoubleClick={() => canEdit && setRenaming(pg.id)}
                  title={`${pg.name} — ${pg.path} (double-click to rename)`}
                >
                  {pg.name}
                </button>
              )}
              {canEdit && renaming !== pg.id && (
                <button type="button" aria-label={`Rename ${pg.name}`} className="mr-0.5 rounded p-1 opacity-0 hover:bg-accent group-hover:opacity-70" onClick={() => setRenaming(pg.id)}>
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Add page" onClick={addPage}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {canEdit && setPageCount > 1 && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" aria-label={`Delete ${page.name}`} onClick={() => deletePage(page.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {renaming && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Cancel rename" onClick={() => setRenaming(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!canEdit && <span className="mr-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Read-only</span>}
          <div className="flex rounded-md border p-0.5" role="group" aria-label="Preview device width">
            <TooltipProvider delayDuration={200}>
              {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([dev, Icon]) => (
                <Tooltip key={dev}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${dev} preview`}
                      aria-pressed={device === dev}
                      className={cn("rounded p-1.5", device === dev ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
                      onClick={() => setDevice(dev)}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{dev === "desktop" ? "Desktop (fluid)" : `${dev} (${DEVICE_WIDTH[dev]})px`}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          {canEdit && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Undo" disabled={!historyState.canUndo} onClick={undo}><Undo2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Redo" disabled={!historyState.canRedo} onClick={redo}><Redo2 className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left rail */}
        <aside className="flex max-h-[38%] shrink-0 flex-col border-b lg:max-h-none lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 border-b">
            {(["sections", "theme", "publish"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn("min-h-[36px] flex-1 px-2 text-xs font-semibold capitalize", railTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:bg-accent")}
                onClick={() => setRailTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {railTab === "sections" && (
              <div className="grid grid-cols-2 gap-1.5 p-2 lg:grid-cols-1">
                {(Object.keys(KIND_ICONS) as SectionKind[]).map((kind) => {
                  const Icon = KIND_ICONS[kind]
                  return (
                    <button
                      key={kind}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => addSection(kind)}
                      className="flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="capitalize">{kind === "richText" ? "Rich text" : kind === "cta" ? "Call to action" : kind}</span>
                    </button>
                  )
                })}
                {!canEdit && <p className="col-span-2 mt-1 text-center text-[10px] text-muted-foreground lg:col-span-1">Viewers cannot add sections.</p>}
              </div>
            )}
            {railTab === "theme" && <ThemeEditor config={config} canEdit={canEdit} onPatch={(patch) => patchConfig((c) => ({ ...c, ...patch }))} />}
            {railTab === "publish" && <PublishPanel busy={busy} onZip={() => runExport("zip")} onPng={() => runExport("png")} onJson={() => runExport("json")} />}
          </ScrollArea>
        </aside>

        {/* canvas */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-muted" ref={previewRootRef}>
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <div className="mx-auto w-full px-0 py-4" style={{ maxWidth: deviceWidth === 1200 ? "100%" : deviceWidth }}>
            <div
              ref={pageRef}
              className="ws-root mx-auto shadow-sm"
              style={{ width: deviceWidth === 1200 ? "100%" : deviceWidth, background: config.theme.background }}
              data-page={page.path}
            >
              {page.sections.length === 0 && (
                <div className="p-10 text-center text-sm opacity-60">
                  Empty page — add sections from the <strong>Sections</strong> panel.
                </div>
              )}
              {page.sections.map((sec) => {
                const hidden = Boolean((sec.props as Record<string, unknown>)._hidden)
                const anchor = anchorFor(sec.kind)
                const isSel = sec.id === selectedId
                return (
                  <div
                    key={sec.id}
                    className={cn("group relative", isSel && "outline outline-2 outline-offset-[-2px] outline-primary", hidden && "opacity-50")}
                    onClick={() => setSelectedId(sec.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(sec.id) }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${sec.kind} section${hidden ? " (hidden)" : ""}`}
                    data-anchor={anchor}
                  >
                    {hidden ? (
                      <div className="flex items-center justify-center gap-2 border border-dashed py-6 text-xs opacity-70">
                        Hidden {sec.kind} section
                      </div>
                    ) : (
                      <section className="ws-section" data-section={sec.kind} style={{ paddingTop: sec.kind === "nav" ? 18 : undefined }}>
                        <div className="ws-container">
                          <SectionBody kind={sec.kind} props={sec.props} theme={config.theme} ctx={previewCtx} />
                        </div>
                      </section>
                    )}
                    {canEdit && (
                      <div
                        data-chrome
                        className={cn(
                          "absolute right-2 top-2 z-10 gap-0.5 rounded-lg border bg-card/95 p-0.5 shadow-sm",
                          isSel ? "flex" : "hidden group-hover:flex",
                        )}
                      >
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" disabled={sec.id === page.sections[0]?.id} onClick={(e) => { e.stopPropagation(); moveSection(sec.id, -1) }}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" disabled={sec.id === page.sections[page.sections.length - 1]?.id} onClick={(e) => { e.stopPropagation(); moveSection(sec.id, 1) }}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Duplicate section" onClick={(e) => { e.stopPropagation(); duplicateSection(sec.id) }}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={hidden ? "Show section" : "Hide section"} onClick={(e) => { e.stopPropagation(); toggleHidden(sec.id) }}>
                          {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Delete section" onClick={(e) => { e.stopPropagation(); deleteSection(sec.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="py-4 text-center text-[10px] text-muted-foreground">
              Live preview — {device === "desktop" ? "fluid desktop width" : `${deviceWidth}px ${device} width`}. Links are clickable and navigate pages.
            </p>
          </div>
        </main>

        {/* right props panel */}
        <aside className="flex max-h-[42%] shrink-0 flex-col border-t lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l">
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold capitalize">{selected ? `${selected.kind} settings` : "Section settings"}</span>
            {selected && (
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Deselect section" onClick={() => setSelectedId(null)}><X className="h-3.5 w-3.5" /></Button>
            )}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {selected ? (
              <div className="space-y-4 p-3">
                <SectionPropsEditor section={selected} canEdit={canEdit} onPatch={(patch) => patchSectionProps(selected.id, patch)} />
              </div>
            ) : (
              <div className="p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">Nothing selected</p>
                Click a section on the canvas to edit its content, or add one from the Sections panel. Sections stack
                top-to-bottom exactly like the exported site.
              </div>
            )}
          </ScrollArea>
          {selected && (
            <div className="shrink-0 border-t p-2">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit || selected.id === page.sections[0]?.id} onClick={() => moveSection(selected.id, -1)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> Up
                </Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit || selected.id === page.sections[page.sections.length - 1]?.id} onClick={() => moveSection(selected.id, 1)}>
                  Down <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit} onClick={() => duplicateSection(selected.id)}>Duplicate</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs text-destructive" disabled={!canEdit} onClick={() => deleteSection(selected.id)}>Delete</Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
})

export default WebsiteEditor
