"use client"

/**
 * Left-rail panels for the presentation editor:
 *   TextPanel   — add title/subtitle/body, style the selected text box
 *   ShapesPanel — add shapes, style the selected shape
 *   PhotosPanel — upload images + reuse uploaded assets
 *   DataPanel   — charts (with data editor), tables (mini editor), QR codes
 *
 * All panels receive the same PresentationPanelApi contract from the editor.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { ChartElement, DesignDoc, DesignElement, ImageElement, PageModel, ShapeElement, ShapeVariant, TableElement, TextElement } from "@/lib/design/types"
import { createChart, createImage, createQr, createShape, createTable, createText } from "@/lib/design/types"
import type { ElementPatch } from "./slide-stage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ColorField, NumField, Section } from "@/components/studio/editors/canvas/ui"
import { FONT_LIBRARY, SWATCH_PALETTES } from "@/lib/design/presets"
import { cn } from "@/lib/utils"
import { BarChart3, Table2, QrCode, ImagePlus, RefreshCcw, Upload, Plus, Trash2 } from "lucide-react"

export interface PresentationPanelApi {
  doc: DesignDoc
  page: PageModel
  pageIndex: number
  canEdit: boolean
  selectedIds: string[]
  selection: DesignElement[]
  addElements: (els: DesignElement[]) => void
  updateElements: (patches: ElementPatch[], opts?: { coalesceKey?: string }) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  dropPos: (w: number, h: number) => { x: number; y: number }
  startEdit: (id: string) => void
}

function firstOf<T extends DesignElement>(selection: DesignElement[]): T | undefined {
  return selection.length === 1 ? (selection[0] as T) : undefined
}

/* -------------------------------- text -------------------------------- */

const SHAPE_GRID: ShapeVariant[] = ["rect", "ellipse", "triangle", "star", "diamond", "pentagon", "hexagon", "heart", "blob", "badge", "line", "arrow"]

export function TextPanel({ api }: { api: PresentationPanelApi }) {
  const text = firstOf<TextElement>(api.selection.filter((e) => e.type === "text"))
  const accent = SWATCH_PALETTES[0]?.colors ?? []

  function add(kind: "title" | "subtitle" | "body") {
    const W = api.doc.width
    const s = W / 1920
    const pos = api.dropPos(Math.round(W * 0.7), Math.round(90 * s))
    if (kind === "title") {
      api.addElements([createText({ text: "Your heading", x: pos.x, y: pos.y, width: Math.round(W * 0.7), height: Math.round(90 * s), fontSize: Math.round(56 * s), fontWeight: 700, name: "Heading" })])
    } else if (kind === "subtitle") {
      api.addElements([createText({ text: "Subtitle", x: pos.x, y: pos.y, width: Math.round(W * 0.6), height: Math.round(50 * s), fontSize: Math.round(32 * s), fontWeight: 500, name: "Subtitle" })])
    } else {
      api.addElements([createText({ text: "Body text — click to edit", x: pos.x, y: pos.y, width: Math.round(W * 0.55), height: Math.round(120 * s), fontSize: Math.round(26 * s), fontWeight: 400, lineHeight: 1.45, name: "Body" })])
    }
  }

  if (!text) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <Section title="Add text">
          <div className="grid gap-2">
            <Button variant="outline" className="h-11 justify-start text-sm" disabled={!api.canEdit} onClick={() => add("title")}>
              Heading
            </Button>
            <Button variant="outline" className="h-11 justify-start text-sm" disabled={!api.canEdit} onClick={() => add("subtitle")}>
              Subtitle
            </Button>
            <Button variant="outline" className="h-11 justify-start text-sm" disabled={!api.canEdit} onClick={() => add("body")}>
              Body text
            </Button>
          </div>
        </Section>
        <p className="px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">Select a text box on the slide to style it. Double-click any text box to edit its content.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Font">
        <Select
          value={text.fontFamily}
          disabled={!api.canEdit}
          onValueChange={(v) => api.updateElements([{ id: text.id, patch: { fontFamily: v } }])}
        >
          <SelectTrigger className="h-9 text-xs" aria-label="Font family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_LIBRARY.map((f) => (
              <SelectItem key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <NumField label="Size" value={text.fontSize} min={8} max={400} onCommit={(v) => api.updateElements([{ id: text.id, patch: { fontSize: v } }], { coalesceKey: `fs:${text.id}` })} />
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Weight</span>
            <Select value={String(text.fontWeight)} disabled={!api.canEdit} onValueChange={(v) => api.updateElements([{ id: text.id, patch: { fontWeight: Number(v) } }])}>
              <SelectTrigger className="h-8 text-xs" aria-label="Font weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["Bold", "b", (t: TextElement) => ({ fontWeight: t.fontWeight >= 700 ? 400 : 700 })],
              ["Italic", "i", (t: TextElement) => ({ italic: !t.italic })],
              ["Underline", "U", (t: TextElement) => ({ underline: !t.underline })],
              ["Strikethrough", "S", (t: TextElement) => ({ strike: !t.strike })],
              ["Uppercase", "AA", (t: TextElement) => ({ uppercase: !t.uppercase })],
            ] as const
          ).map(([label, glyph, patchOf]) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              disabled={!api.canEdit}
              aria-pressed={label === "Bold" ? text.fontWeight >= 700 : label === "Italic" ? text.italic : label === "Underline" ? text.underline : label === "Strikethrough" ? text.strike : text.uppercase}
              className={cn("h-9 min-w-[40px] px-2", label === "Italic" && "italic", label === "Underline" && "underline", label === "Strikethrough" && "line-through", label === "Uppercase" && "uppercase")}
              onClick={() => api.updateElements([{ id: text.id, patch: patchOf(text) }])}
            >
              {glyph}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Alignment">
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <Button
              key={a}
              variant={text.align === a ? "secondary" : "outline"}
              size="sm"
              disabled={!api.canEdit}
              className="h-9 flex-1 capitalize"
              onClick={() => api.updateElements([{ id: text.id, patch: { align: a } }])}
            >
              {a}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Vertical align</span>
          <Select value={text.vAlign ?? "top"} disabled={!api.canEdit} onValueChange={(v) => api.updateElements([{ id: text.id, patch: { vAlign: v as "top" | "middle" | "bottom" } }])}>
            <SelectTrigger className="h-8 text-xs" aria-label="Vertical align">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">List style</span>
          <Select value={text.listStyle ?? "none"} disabled={!api.canEdit} onValueChange={(v) => api.updateElements([{ id: text.id, patch: { listStyle: v as "none" | "bullet" | "number" } }])}>
            <SelectTrigger className="h-8 text-xs" aria-label="List style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bullet">Bullets</SelectItem>
              <SelectItem value="number">Numbered</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex gap-2">
          <NumField label="Line height" value={text.lineHeight} min={0.8} max={3} step={0.05} onCommit={(v) => api.updateElements([{ id: text.id, patch: { lineHeight: v } }], { coalesceKey: `lh:${text.id}` })} />
          <NumField label="Letter spacing" value={text.letterSpacing} min={-5} max={40} onCommit={(v) => api.updateElements([{ id: text.id, patch: { letterSpacing: v } }], { coalesceKey: `ls:${text.id}` })} />
        </div>
      </Section>

      <Section title="Color">
        <ColorField value={text.color} onChange={(c) => api.updateElements([{ id: text.id, patch: { color: c } }], { coalesceKey: `color:${text.id}` })} />
        <div className="flex flex-wrap gap-1">
          {accent.map((c) => (
            <button key={c} type="button" aria-label={`Text color ${c}`} className="h-7 w-7 rounded border border-black/10 shadow-sm transition hover:scale-110" style={{ background: c }} onClick={() => api.updateElements([{ id: text.id, patch: { color: c } }])} />
          ))}
        </div>
      </Section>

      <Section title="Arrange">
        <NumField label="Opacity" value={Math.round(text.opacity * 100)} min={5} max={100} onCommit={(v) => api.updateElements([{ id: text.id, patch: { opacity: v / 100 } }], { coalesceKey: `op:${text.id}` })} />
        <Button variant="outline" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.duplicateSelected}>
          Duplicate text box
        </Button>
        <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
          Delete text box
        </Button>
      </Section>
    </div>
  )
}

/* -------------------------------- shapes -------------------------------- */

export function ShapesPanel({ api }: { api: PresentationPanelApi }) {
  const shape = firstOf<ShapeElement>(api.selection.filter((e) => e.type === "shape"))

  function addShape(variant: ShapeVariant) {
    const size = Math.round(api.doc.width / 8)
    const pos = api.dropPos(size, variant === "line" || variant === "arrow" ? 12 : size)
    api.addElements([createShape({ variant, x: pos.x, y: pos.y, width: variant === "line" || variant === "arrow" ? Math.round(api.doc.width / 4) : size, height: variant === "line" || variant === "arrow" ? 12 : size })])
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Shapes">
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPE_GRID.map((v) => (
            <button
              key={v}
              type="button"
              disabled={!api.canEdit}
              aria-label={`Add ${v} shape`}
              title={`Add ${v}`}
              onClick={() => addShape(v)}
              className="flex h-14 items-center justify-center rounded-lg border transition hover:border-primary hover:bg-accent disabled:opacity-60"
            >
              <ShapeGlyph variant={v} />
            </button>
          ))}
        </div>
      </Section>
      {shape ? (
        <Section title="Style shape">
          <ColorField value={shape.fill} allowTransparent onChange={(c) => api.updateElements([{ id: shape.id, patch: { fill: c } }], { coalesceKey: `fill:${shape.id}` })} label="Fill" />
          <ColorField value={shape.stroke} allowTransparent onChange={(c) => api.updateElements([{ id: shape.id, patch: { stroke: c } }], { coalesceKey: `stroke:${shape.id}` })} label="Stroke" />
          <div className="flex gap-2">
            <NumField label="Stroke width" value={shape.strokeWidth} min={0} max={60} onCommit={(v) => api.updateElements([{ id: shape.id, patch: { strokeWidth: v } }], { coalesceKey: `sw:${shape.id}` })} />
            {shape.variant === "rect" ? <NumField label="Corner radius" value={shape.cornerRadius} min={0} max={200} onCommit={(v) => api.updateElements([{ id: shape.id, patch: { cornerRadius: v } }], { coalesceKey: `cr:${shape.id}` })} /> : null}
          </div>
          <NumField label="Opacity" value={Math.round(shape.opacity * 100)} min={5} max={100} onCommit={(v) => api.updateElements([{ id: shape.id, patch: { opacity: v / 100 } }], { coalesceKey: `op:${shape.id}` })} />
          <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
            Delete shape
          </Button>
        </Section>
      ) : null}
    </div>
  )
}

function ShapeGlyph({ variant }: { variant: ShapeVariant }) {
  const cls = "h-6 w-6"
  const s = { fill: "currentColor" } as const
  switch (variant) {
    case "rect":
      return <svg className={cls} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" {...s} /></svg>
    case "ellipse":
      return <svg className={cls} viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="7" {...s} /></svg>
    case "triangle":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 4 21 20H3Z" {...s} /></svg>
    case "star":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8Z" {...s} /></svg>
    case "diamond":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 2 22 12 12 22 2 12Z" {...s} /></svg>
    case "pentagon":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 3 21 9.5 17.6 20H6.4L3 9.5Z" {...s} /></svg>
    case "hexagon":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M8 3h8l5 9-5 9H8l-5-9Z" {...s} /></svg>
    case "heart":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 21C7 16.6 2 12.9 2 8.6 2 5.5 4.4 3 7.5 3c1.8 0 3.4.8 4.5 2.2C13.1 3.8 14.7 3 16.5 3 19.6 3 22 5.5 22 8.6c0 4.3-5 8-10 12.4Z" {...s} /></svg>
    case "blob":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M6 5C9 2 15 2 18 5s3 7 1 11-7 5-11 3-4-11-2-14Z" {...s} /></svg>
    case "badge":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M12 2l1.8 1.4 2.2-.4 1 2 2.2.6-.2 2.3 1.8 1.5-1.2 2 1.2 2-1.8 1.5.2 2.3-2.2.6-1 2-2.2-.4L12 22l-1.8-1.4-2.2.4-1-2-2.2-.6.2-2.3L3.2 14l1.2-2-1.2-2 1.8-1.5-.2-2.3 2.2-.6 1-2 2.2.4Z" {...s} /></svg>
    case "line":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M3 12h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
    case "arrow":
      return <svg className={cls} viewBox="0 0 24 24"><path d="M3 12h15m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
    default:
      return null
  }
}

/* -------------------------------- photos -------------------------------- */

interface RemoteAsset {
  id: string
  url: string
  name: string
}

export function PhotosPanel({ api }: { api: PresentationPanelApi }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [remote, setRemote] = useState<RemoteAsset[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const loadRemote = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch("/api/assets?kind=image", { credentials: "same-origin" })
      if (!res.ok) throw new Error("unavailable")
      const body = (await res.json()) as { assets?: unknown } | unknown[]
      const list = Array.isArray(body) ? body : Array.isArray(body.assets) ? body.assets : []
      const mapped: RemoteAsset[] = []
      for (const raw of list) {
        const item = raw as Record<string, unknown>
        const url = (item.url ?? item.fileUrl ?? item.src ?? item.path) as string | undefined
        if (typeof url === "string" && url.length > 0) {
          mapped.push({
            id: String(item.id ?? url),
            url: url.startsWith("http") || url.startsWith("data:") || url.startsWith("/") ? url : `/${url}`,
            name: typeof item.name === "string" ? item.name : "Image",
          })
        }
      }
      setRemote(mapped)
    } catch {
      setFailed(true)
      setRemote([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      if (alive) void loadRemote()
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [loadRemote])

  function addFromSrc(src: string, name: string, natural?: { w: number; h: number }) {
    const maxW = api.doc.width * 0.55
    const ratio = natural ? Math.min(1, maxW / natural.w) : 1
    const width = natural ? natural.w * ratio : Math.min(maxW, 800)
    const height = natural ? natural.h * ratio : (width * 2) / 3
    const pos = api.dropPos(width, height)
    api.addElements([createImage({ src, x: pos.x, y: pos.y, width, height, name })])
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files).slice(0, 8)) {
      if (!file.type.startsWith("image/")) continue
      const reader = new FileReader()
      reader.onload = () => {
        const src = String(reader.result)
        const probe = new Image()
        probe.onload = () => addFromSrc(src, file.name, { w: probe.naturalWidth, h: probe.naturalHeight })
        probe.onerror = () => addFromSrc(src, file.name)
        probe.src = src
      }
      reader.readAsDataURL(file)
    }
  }

  const selectedImage = firstOf<ImageElement>(api.selection.filter((e) => e.type === "image"))

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Upload">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <button
          type="button"
          disabled={!api.canEdit}
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-center transition hover:border-primary hover:bg-accent disabled:opacity-60"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold">Upload images</span>
          <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP, GIF or SVG</span>
        </button>
      </Section>

      {selectedImage ? (
        <Section title="Selected image">
          <NumField label="Opacity" value={Math.round(selectedImage.opacity * 100)} min={5} max={100} onCommit={(v) => api.updateElements([{ id: selectedImage.id, patch: { opacity: v / 100 } }], { coalesceKey: `op:${selectedImage.id}` })} />
          <NumField label="Corner radius" value={selectedImage.cornerRadius} min={0} max={400} onCommit={(v) => api.updateElements([{ id: selectedImage.id, patch: { cornerRadius: v } }], { coalesceKey: `cr:${selectedImage.id}` })} />
          <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
            Delete image
          </Button>
        </Section>
      ) : null}

      <Section
        title="Your uploads"
        right={
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => void loadRemote()} aria-label="Reload uploads">
            <RefreshCcw className="h-3 w-3" />
          </Button>
        }
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
        ) : failed ? (
          <div className="rounded-lg border border-dashed p-3 text-center">
            <ImagePlus className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">Can’t load your uploaded library right now.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Uploads above still work — everything stays on your device if offline.</p>
          </div>
        ) : remote && remote.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {remote.map((asset) => (
              <button
                key={asset.id}
                type="button"
                title={asset.name}
                aria-label={`Add ${asset.name}`}
                disabled={!api.canEdit}
                onClick={() => {
                  const probe = new Image()
                  probe.onload = () => addFromSrc(asset.url, asset.name, { w: probe.naturalWidth, h: probe.naturalHeight })
                  probe.onerror = () => addFromSrc(asset.url, asset.name)
                  probe.src = asset.url
                }}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition hover:border-primary disabled:opacity-60"
              >
                <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-center">
            <ImagePlus className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">No uploaded images yet.</p>
          </div>
        )}
      </Section>
    </div>
  )
}

/* --------------------------------- data --------------------------------- */

const CHART_TYPES: ChartElement["chartType"][] = ["column", "bar", "line", "area", "pie", "doughnut", "progress"]

export function DataPanel({ api }: { api: PresentationPanelApi }) {
  const chart = firstOf<ChartElement>(api.selection.filter((e) => e.type === "chart"))
  const table = firstOf<TableElement>(api.selection.filter((e) => e.type === "table"))
  const [qrData, setQrData] = useState("https://studio.local")

  function addChart(chartType: ChartElement["chartType"]) {
    const w = Math.round(api.doc.width * 0.42)
    const h = Math.round(api.doc.height * 0.55)
    const pos = api.dropPos(w, h)
    api.addElements([createChart({ chartType, x: pos.x, y: pos.y, width: w, height: h })])
  }

  function addTable() {
    const w = Math.round(api.doc.width * 0.5)
    const pos = api.dropPos(w, 220)
    api.addElements([createTable({ x: pos.x, y: pos.y, width: w, height: Math.round(api.doc.height * 0.28) })])
  }

  function addQr() {
    const size = Math.round(api.doc.height * 0.3)
    const pos = api.dropPos(size, size)
    api.addElements([createQr({ data: qrData, x: pos.x, y: pos.y, width: size, height: size })])
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Charts">
        <div className="flex flex-wrap gap-1.5">
          {CHART_TYPES.map((ct) => (
            <Button key={ct} variant="outline" size="sm" className="h-9 gap-1.5 capitalize" disabled={!api.canEdit} onClick={() => addChart(ct)}>
              <BarChart3 className="h-3.5 w-3.5" /> {ct}
            </Button>
          ))}
        </div>
      </Section>

      {chart ? (
        <Section title="Chart data">
          <Input
            value={chart.title ?? ""}
            disabled={!api.canEdit}
            placeholder="Chart title"
            className="h-8 text-xs"
            aria-label="Chart title"
            onChange={(e) => api.updateElements([{ id: chart.id, patch: { title: e.target.value } }], { coalesceKey: `ct:${chart.id}` })}
          />
          <Input
            value={chart.data.labels.join(", ")}
            disabled={!api.canEdit}
            placeholder="Labels, comma separated"
            className="h-8 text-xs"
            aria-label="Chart labels"
            onChange={(e) => {
              const labels = e.target.value.split(",").map((s) => s.trim())
              api.updateElements([{ id: chart.id, patch: { data: { ...chart.data, labels } } }], { coalesceKey: `cl:${chart.id}` })
            }}
          />
          {chart.data.series.map((s, si) => (
            <div key={si} className="space-y-1 rounded-lg border p-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(s.color) ? s.color : "#8b5cf6"}
                  disabled={!api.canEdit}
                  aria-label={`Series ${si + 1} color`}
                  className="h-7 w-7 cursor-pointer rounded border p-0"
                  onChange={(e) => {
                    const series = chart.data.series.map((x, i) => (i === si ? { ...x, color: e.target.value } : x))
                    api.updateElements([{ id: chart.id, patch: { data: { ...chart.data, series } } }], { coalesceKey: `cc:${chart.id}` })
                  }}
                />
                <Input
                  value={s.name}
                  disabled={!api.canEdit}
                  className="h-7 flex-1 text-xs"
                  aria-label={`Series ${si + 1} name`}
                  onChange={(e) => {
                    const series = chart.data.series.map((x, i) => (i === si ? { ...x, name: e.target.value } : x))
                    api.updateElements([{ id: chart.id, patch: { data: { ...chart.data, series } } }], { coalesceKey: `cn:${chart.id}` })
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  disabled={!api.canEdit || chart.data.series.length <= 1}
                  aria-label={`Remove series ${si + 1}`}
                  onClick={() => api.updateElements([{ id: chart.id, patch: { data: { ...chart.data, series: chart.data.series.filter((_, i) => i !== si) } } }])}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={s.values.join(", ")}
                disabled={!api.canEdit}
                placeholder="Values, comma separated"
                className="h-7 text-xs"
                aria-label={`Series ${si + 1} values`}
                onChange={(e) => {
                  const values = e.target.value.split(",").map((v) => Number(v.trim()) || 0)
                  const series = chart.data.series.map((x, i) => (i === si ? { ...x, values } : x))
                  api.updateElements([{ id: chart.id, patch: { data: { ...chart.data, series } } }], { coalesceKey: `cv:${chart.id}` })
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={!api.canEdit}
            onClick={() =>
              api.updateElements([
                { id: chart.id, patch: { data: { ...chart.data, series: [...chart.data.series, { name: `Series ${chart.data.series.length + 1}`, color: "#f59e0b", values: chart.data.labels.map(() => 10) }] } } },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add series
          </Button>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Legend</Label>
            <Switch checked={chart.showLegend} disabled={!api.canEdit} onCheckedChange={(v) => api.updateElements([{ id: chart.id, patch: { showLegend: v } }])} aria-label="Toggle legend" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Grid lines</Label>
            <Switch checked={chart.showGrid} disabled={!api.canEdit} onCheckedChange={(v) => api.updateElements([{ id: chart.id, patch: { showGrid: v } }])} aria-label="Toggle grid" />
          </div>
          <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
            Delete chart
          </Button>
        </Section>
      ) : null}

      <Section title="Tables">
        <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit} onClick={addTable}>
          <Table2 className="h-3.5 w-3.5" /> Add table
        </Button>
        {table ? <TableMiniEditor api={api} table={table} /> : null}
      </Section>

      <Section title="QR code">
        <div className="flex gap-1.5">
          <Input value={qrData} onChange={(e) => setQrData(e.target.value)} className="h-9 flex-1 text-xs" aria-label="QR code content" placeholder="URL or text" />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit || !qrData.trim()} onClick={addQr}>
            <QrCode className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </Section>
    </div>
  )
}

function TableMiniEditor({ api, table }: { api: PresentationPanelApi; table: TableElement }) {
  const text = table.rows.map((r) => r.join(" | ")).join("\n")
  return (
    <div className="space-y-2 pt-1">
      <Textarea
        defaultValue={text}
        disabled={!api.canEdit}
        className="min-h-[110px] font-mono text-[11px]"
        aria-label="Table rows — separate cells with |"
        onBlur={(e) => {
          const rows = e.target.value
            .split("\n")
            .map((line) => line.split("|").map((c) => c.trim()))
            .filter((r) => r.length > 0)
          if (rows.length > 0) api.updateElements([{ id: table.id, patch: { rows } }])
        }}
      />
      <p className="text-[10px] text-muted-foreground">One row per line, cells separated by “|”. Changes apply when you click outside.</p>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Header row</Label>
        <Switch checked={table.headerRow} disabled={!api.canEdit} onCheckedChange={(v) => api.updateElements([{ id: table.id, patch: { headerRow: v } }])} aria-label="Toggle header row" />
      </div>
      <ColorField value={table.headerBg} onChange={(c) => api.updateElements([{ id: table.id, patch: { headerBg: c } }], { coalesceKey: `hb:${table.id}` })} label="Header background" />
      <ColorField value={table.borderColor} onChange={(c) => api.updateElements([{ id: table.id, patch: { borderColor: c } }], { coalesceKey: `bc:${table.id}` })} label="Borders" />
      <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
        Delete table
      </Button>
    </div>
  )
}
