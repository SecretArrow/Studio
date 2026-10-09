"use client"

/**
 * Email Designer — doc.type "email", doc.config = EmailConfig.
 *
 * Owns: document state + undo/redo history, block palette, live table-based
 * email preview (desktop/mobile), per-block editors, email settings and the
 * EditorHandle (export html / json / png, thumbnail).
 *
 * Honesty: there is NO "send email" feature in this free build. "Test render"
 * opens the generated HTML in a new tab — a real validation aid, clearly labeled.
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { EditorHandle, EditorProps, ExportRequest, ExportResult } from "./types"
import type { DesignDoc, EmailBlock, EmailConfig } from "@/lib/design/types"
import { uid } from "@/lib/design/types"
import { HistoryStore } from "@/lib/editor/history"
import { useToast } from "@/hooks/use-toast"
import { downloadBlob } from "@/lib/studio/api-client"
import { cn } from "@/lib/utils"
import {
  ClipboardCopy, Code, Columns2, ExternalLink, Heading1, Image as ImageIcon, Minus, Monitor, MousePointerClick,
  MoveVertical, Redo2, Share2, Smartphone, Trash2, Type, Undo2, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { normalizeEmailConfig, makeBlock, fontStack } from "./email/model"
import type { BlockKind } from "./email/model"
import { BLOCK_DEFS } from "./email/model"
import { EmailPreview } from "./email/blocks"
import { BlockEditor, EmailSettings } from "./email/block-editor"
import { buildEmailHtml } from "./email/email-html"
import { rasterizeElement } from "./website/site-export"

const KIND_ICONS: Record<BlockKind, typeof Type> = {
  heading: Heading1, text: Type, image: ImageIcon, button: MousePointerClick, divider: Minus,
  spacer: MoveVertical, social: Share2, columns: Columns2, html: Code,
}

function dataUrlToBlob(dataUrl: string): Blob {
  const bin = atob(dataUrl.split(",")[1])
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: "image/png" })
}

const EmailEditor = forwardRef<EditorHandle, EditorProps>(function EmailEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  void project
  const canEdit = role === "owner" || role === "editor"
  const { toast } = useToast()

  const [doc, setDoc] = useState<DesignDoc>(initialDoc)
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [railTab, setRailTab] = useState<"blocks" | "settings">("blocks")
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })
  const [busy, setBusy] = useState(false)

  const docRef = useRef(doc)
  const dirtyRef = useRef(false)
  const emailCardRef = useRef<HTMLDivElement>(null)
  const thumbCache = useRef<{ key: string; url: string } | null>(null)
  const [history] = useState(() => new HistoryStore(initialDoc, 60))

  /* ------------------------------ document plumbing ------------------------------ */

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
    (fn: (c: EmailConfig) => EmailConfig, coalesceKey?: string) => {
      const prev = docRef.current
      commit({ ...prev, config: fn(normalizeEmailConfig(prev.config)) }, coalesceKey)
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

  /* ---------------------------------- derived ---------------------------------- */

  const config = useMemo(() => normalizeEmailConfig(doc.config), [doc.config])
  const selected = useMemo(() => config.blocks.find((b) => b.id === selectedId) ?? null, [config.blocks, selectedId])

  /* -------------------------------- block actions -------------------------------- */

  const patchBlocks = useCallback(
    (fn: (blocks: EmailBlock[]) => EmailBlock[], coalesceKey?: string) => {
      patchConfig((c) => ({ ...c, blocks: fn(c.blocks) }), coalesceKey)
    },
    [patchConfig],
  )

  const addBlock = useCallback(
    (kind: BlockKind) => {
      if (!canEdit) return
      const blk = makeBlock(kind)
      patchBlocks((b) => [...b, blk])
      setSelectedId(blk.id)
      setRailTab("blocks")
    },
    [canEdit, patchBlocks],
  )

  const patchBlockProps = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      patchBlocks((b) => b.map((blk) => (blk.id === id ? { ...blk, props: { ...blk.props, ...patch } } : blk)), `blk:${id}`)
    },
    [patchBlocks],
  )

  const moveBlock = useCallback(
    (id: string, delta: number) => {
      patchBlocks((b) => {
        const i = b.findIndex((x) => x.id === id)
        const j = i + delta
        if (i < 0 || j < 0 || j >= b.length) return b
        const next = [...b]
        ;[next[i], next[j]] = [next[j], next[i]]
        return next
      })
    },
    [patchBlocks],
  )

  const duplicateBlock = useCallback(
    (id: string) => {
      if (!canEdit) return
      const newId = uid("blk")
      patchBlocks((b) => {
        const i = b.findIndex((x) => x.id === id)
        if (i < 0) return b
        const clone: EmailBlock = { ...b[i], id: newId, props: JSON.parse(JSON.stringify(b[i].props)) }
        return [...b.slice(0, i + 1), clone, ...b.slice(i + 1)]
      })
      setSelectedId(newId)
    },
    [canEdit, patchBlocks],
  )

  const deleteBlock = useCallback(
    (id: string) => {
      patchBlocks((b) => b.filter((x) => x.id !== id))
      setSelectedId((cur) => (cur === id ? null : cur))
    },
    [patchBlocks],
  )

  /* ------------------------------ preview & helpers ------------------------------ */

  const handlePreviewLink = useCallback((href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (/^https?:\/\//i.test(href)) window.open(href, "_blank", "noopener,noreferrer")
    else if (/^mailto:/i.test(href)) window.location.href = href
  }, [])

  const previewCtx = useMemo(
    () => ({ mode: "preview" as const, onLinkClick: handlePreviewLink }),
    [handlePreviewLink],
  )

  const currentHtml = useCallback(() => buildEmailHtml(normalizeEmailConfig(docRef.current.config)), [])

  const copyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentHtml())
      toast({ title: "Email HTML copied", description: "Paste it into any email tool — it is fully table-based with inline styles." })
    } catch {
      toast({ title: "Could not access the clipboard", description: "Use Export → Email HTML to download the file instead.", variant: "destructive" })
    }
  }, [currentHtml, toast])

  const testRender = useCallback(() => {
    const blob = new Blob([currentHtml()], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank", "noopener")
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    toast({ title: "Test render opened in a new tab", description: "This is the exact generated HTML — sending is not available in this free build." })
  }, [currentHtml, toast])

  /* ---------------------------------- export ---------------------------------- */

  const exportAs = useCallback(
    async (req: ExportRequest): Promise<ExportResult[]> => {
      const cfg = normalizeEmailConfig(docRef.current.config)
      const base = (req.filenameBase || "email").replace(/[/\\?%*:|"<>]/g, "-")
      if (req.format === "json") {
        return [{ filename: `${base}.studio.json`, blob: new Blob([JSON.stringify(docRef.current, null, 2)], { type: "application/json" }) }]
      }
      if (req.format === "html") {
        return [{ filename: `${base}.html`, blob: new Blob([buildEmailHtml(cfg)], { type: "text/html;charset=utf-8" }), note: "Email-safe HTML: tables + inline styles, preheader included." }]
      }
      if (req.format === "png") {
        const el = emailCardRef.current
        if (!el) throw new Error("Preview is not ready yet — try again in a moment.")
        const dataUrl = await rasterizeElement(el, { targetWidth: Math.round((cfg.width + 24) * (req.scale ?? 1)) })
        return [{ filename: `${base}-preview.png`, blob: dataUrlToBlob(dataUrl), note: "Rendered in-browser via SVG rasterization." }]
      }
      throw new Error(`The email designer exports HTML, PNG and JSON — not "${req.format}".`)
    },
    [],
  )

  const getThumbnail = useCallback(async (): Promise<string | null> => {
    const cfg = normalizeEmailConfig(docRef.current.config)
    const key = JSON.stringify(cfg)
    if (thumbCache.current?.key === key) return thumbCache.current.url
    const el = emailCardRef.current
    if (!el) return null
    try {
      const url = await rasterizeElement(el, { targetWidth: 480 })
      thumbCache.current = { key, url }
      return url
    } catch {
      return null
    }
  }, [])

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
    async (format: "html" | "png" | "json") => {
      setBusy(true)
      try {
        const results = await exportAs({ format, filenameBase: config.subject || "email" })
        for (const r of results) downloadBlob(r.blob, r.filename)
        if (results[0]?.note) toast({ title: "Export ready", description: results[0].note })
      } catch (err) {
        toast({ title: "Export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
      } finally {
        setBusy(false)
      }
    },
    [config.subject, exportAs, toast],
  )

  /* ---------------------------------- render ---------------------------------- */

  const cardOuter = device === "mobile" ? 399 : config.width + 24

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-card px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-xs text-muted-foreground" title={config.subject}>
            <span className="font-semibold text-foreground">Subject:</span> {config.subject || "(none)"}
          </span>
          {!canEdit && <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Read-only</span>}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-md border p-0.5" role="group" aria-label="Preview width">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Desktop preview" aria-pressed={device === "desktop"} className={cn("rounded p-1.5", device === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")} onClick={() => setDevice("desktop")}>
                    <Monitor className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Desktop width ({config.width}px card)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Mobile preview" aria-pressed={device === "mobile"} className={cn("rounded p-1.5", device === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")} onClick={() => setDevice("mobile")}>
                    <Smartphone className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Mobile (~375px)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={busy} onClick={copyHtml}>
            <ClipboardCopy className="h-3.5 w-3.5" /> Copy HTML
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={busy} onClick={testRender}>
            <ExternalLink className="h-3.5 w-3.5" /> Test render
          </Button>
          {canEdit && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Undo" disabled={!historyState.canUndo} onClick={undo}><Undo2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Redo" disabled={!historyState.canRedo} onClick={redo}><Redo2 className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* left rail: palette + block list / settings */}
        <aside className="flex max-h-[38%] shrink-0 flex-col border-b lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 border-b">
            {(["blocks", "settings"] as const).map((tab) => (
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
            {railTab === "blocks" ? (
              <div className="space-y-2 p-2">
                <div className="space-y-1.5">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Add block</p>
                  {BLOCK_DEFS.map((def) => {
                    const Icon = KIND_ICONS[def.kind]
                    return (
                      <button
                        key={def.kind}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => addBlock(def.kind)}
                        className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-50"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium">{def.label}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{def.hint}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="space-y-1 border-t pt-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">In this email ({config.blocks.length})</p>
                  {config.blocks.length === 0 && <p className="px-1 text-[11px] text-muted-foreground">Nothing yet — add your first block above.</p>}
                  {config.blocks.map((b, i) => {
                    const Icon = KIND_ICONS[b.kind]
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={cn(
                          "flex min-h-[36px] w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
                          b.id === selectedId ? "bg-primary/10 font-semibold text-primary" : "hover:bg-accent",
                        )}
                        onClick={() => setSelectedId(b.id)}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{i + 1}. {b.kind}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <EmailSettings config={config} canEdit={canEdit} onPatch={(patch) => patchConfig((c) => ({ ...c, ...patch }))} />
            )}
          </ScrollArea>
        </aside>

        {/* preview */}
        <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-muted p-4">
          <div className="mx-auto" style={{ width: "100%", maxWidth: cardOuter }}>
            <div
              ref={emailCardRef}
              style={{ fontFamily: fontStack(config.fontFamily) }}
              aria-label="Email preview"
            >
              <EmailPreview config={config} ctx={previewCtx} />
            </div>
            <p className="pt-3 text-center text-[10px] text-muted-foreground">
              Live preview rendered with real email-safe HTML (tables + inline styles). {device === "mobile" ? "Narrow view — columns stack where supported." : `Card width ${config.width}px.`}
            </p>
          </div>
        </main>

        {/* right: block editor */}
        <aside className="flex max-h-[42%] shrink-0 flex-col border-t lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l">
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold capitalize">{selected ? `${selected.kind} block` : "Block settings"}</span>
            {selected && (
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Deselect block" onClick={() => setSelectedId(null)}><X className="h-3.5 w-3.5" /></Button>
            )}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            {selected ? (
              <div className="space-y-4 p-3">
                <BlockEditor block={selected} config={config} canEdit={canEdit} onPatch={(patch) => patchBlockProps(selected.id, patch)} />
              </div>
            ) : (
              <div className="p-4 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">Nothing selected</p>
                Add a block from the left, then click it in the list (or in the preview&apos;s block list) to edit it.
                Every block exports as table-based email-safe HTML.
              </div>
            )}
          </ScrollArea>
          {selected && (
            <div className="shrink-0 border-t p-2">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit || selected.id === config.blocks[0]?.id} onClick={() => moveBlock(selected.id, -1)}>Up</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit || selected.id === config.blocks[config.blocks.length - 1]?.id} onClick={() => moveBlock(selected.id, 1)}>Down</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit} onClick={() => duplicateBlock(selected.id)}>Duplicate</Button>
                <Button variant="outline" size="sm" className="h-8 flex-1 text-xs text-destructive" disabled={!canEdit} onClick={() => deleteBlock(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
})

export default EmailEditor
