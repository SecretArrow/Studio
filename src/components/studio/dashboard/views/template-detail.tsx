"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type {
  BackgroundSpec,
  ChartElement,
  DesignDoc,
  DesignElement,
  ImageElement,
  QrElement,
  ShapeElement,
  StickyElement,
  TableElement,
  TextElement,
} from "@/lib/design/types"
import {
  ArrowLeft, Check, FileText, Layers, Loader2, Pencil, Presentation, ShieldCheck, Square,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TemplatePreviewBox } from "./templates-card"

interface TemplateDetailRow {
  id: string
  slug: string
  name: string
  category: string
  type: string
  tags: string
  width: number
  height: number
  contentJson: string
  thumbnail: string | null
  license: string
}

/* ------------------------------- mini renderer ------------------------------- */

function bgStyle(bg: BackgroundSpec | undefined, fallback = "#ffffff"): CSSProperties {
  if (!bg || bg.type === "transparent") return { backgroundColor: fallback }
  if (bg.type === "gradient" && bg.gradient) {
    return { backgroundImage: `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})` }
  }
  if (bg.type === "image" && bg.imageUrl) {
    return { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
  }
  return { backgroundColor: bg.color ?? fallback }
}

const CLIP_PATHS: Record<string, string> = {
  triangle: "polygon(50% 0%, 100% 100%, 0% 100%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  pentagon: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
  hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  heart: "polygon(50% 100%, 0% 40%, 0% 15%, 15% 0%, 35% 0%, 50% 15%, 65% 0%, 85% 0%, 100% 15%, 100% 40%)",
  badge:
    "polygon(50% 0%, 59% 12%, 73% 6%, 76% 21%, 91% 21%, 87% 36%, 100% 43%, 91% 55%, 98% 68%, 83% 72%, 83% 88%, 68% 85%, 59% 98%, 50% 88%, 41% 98%, 32% 85%, 17% 88%, 17% 72%, 2% 68%, 9% 55%, 0% 43%, 13% 36%, 9% 21%, 24% 21%, 27% 6%, 41% 12%)",
}

function shapeStyle(el: ShapeElement): CSSProperties {
  const base: CSSProperties = {
    background: el.fill !== "transparent" ? el.fill : "transparent",
    opacity: el.opacity,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    border: el.strokeWidth > 0 && el.stroke !== "transparent" ? `${el.strokeWidth}px ${el.dash?.length ? "dashed" : "solid"} ${el.stroke}` : undefined,
  }
  if (el.variant === "ellipse") return { ...base, borderRadius: "50%" }
  if (el.variant === "rect") return { ...base, borderRadius: el.cornerRadius }
  if (el.variant === "blob") return { ...base, borderRadius: "42% 58% 55% 45% / 48% 42% 58% 52%" }
  if (el.variant === "badge") return { ...base, borderRadius: "50%" }
  const clip = CLIP_PATHS[el.variant]
  if (clip) return { ...base, clipPath: clip }
  // line / arrow fallback: thin bar
  return { ...base, background: el.fill !== "transparent" ? el.fill : el.stroke, height: Math.max(4, el.height * 0.08) }
}

function PreviewImage({ el }: { el: ImageElement }) {
  return (
    <img
      src={el.src}
      alt=""
      loading="lazy"
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        objectFit: "fill", borderRadius: el.cornerRadius || 0, opacity: el.opacity,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    />
  )
}

function PreviewText({ el }: { el: TextElement }) {
  const deco = [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ")
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color,
        lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, textAlign: el.align,
        fontStyle: el.italic ? "italic" : "normal", textTransform: el.uppercase ? "uppercase" : "none",
        textDecoration: deco || "none", whiteSpace: "pre-wrap", overflow: "hidden",
        display: "flex", flexDirection: "column",
        justifyContent: el.vAlign === "middle" ? "center" : el.vAlign === "bottom" ? "flex-end" : "flex-start",
        backgroundColor: el.bgColor || undefined, opacity: el.opacity,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      {el.text}
    </div>
  )
}

function PreviewShape({ el }: { el: ShapeElement }) {
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height, ...shapeStyle(el),
      }}
    />
  )
}

function PreviewTable({ el }: { el: TableElement }) {
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        opacity: el.opacity, transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontFamily: el.fontFamily, fontSize: el.fontSize, color: el.color }}>
        <tbody>
          {el.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const isHeader = el.headerRow && ri === 0
                return (
                  <td
                    key={ci}
                    style={{
                      border: `1px solid ${el.borderColor}`, padding: "0.35em 0.6em", overflow: "hidden",
                      background: isHeader ? el.headerBg : ri % 2 === 1 ? el.rowBg : el.altRowBg,
                      color: isHeader ? el.headerColor : el.color,
                      fontWeight: isHeader ? 700 : 400,
                    }}
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PreviewChart({ el }: { el: ChartElement }) {
  const max = Math.max(1, ...el.data.series.flatMap((s) => s.values))
  const isProgress = el.chartType === "progress"
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        opacity: el.opacity, display: "flex", flexDirection: "column", gap: 10, padding: 18,
      }}
    >
      {el.title && <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{el.title}</div>}
      {isProgress ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          {el.data.labels.map((label, li) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#374151", marginBottom: 6 }}>
                <span>{label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{el.data.series[0]?.values[li] ?? 0}{el.numberFormat?.includes("%") ? "%" : ""}</span>
              </div>
              <div style={{ height: 18, borderRadius: 9, background: "#e5e7eb", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, ((el.data.series[0]?.values[li] ?? 0) / max) * 100)}%`, height: "100%", borderRadius: 9, background: el.data.series[0]?.color ?? "#8b5cf6" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 14, borderBottom: "2px solid #e5e7eb" }}>
          {el.data.labels.map((label, li) => (
            <div key={label} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, width: "100%", justifyContent: "center", flex: 1 }}>
                {el.data.series.map((s) => (
                  <div
                    key={s.name}
                    title={s.name}
                    style={{
                      width: Math.min(52, Math.floor((el.width / Math.max(el.data.labels.length, 1)) / (el.data.series.length + 1))),
                      height: `${((s.values[li] ?? 0) / max) * 100}%`,
                      minHeight: 4, background: s.color, borderRadius: "4px 4px 0 0",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 15, color: "#6b7280", whiteSpace: "nowrap" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
      {el.showLegend && !isProgress && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 15, color: "#6b7280" }}>
          {el.data.series.map((s) => (
            <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewQr({ el }: { el: QrElement }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    import("qrcode")
      .then((m) => m.toDataURL(el.data || " ", { width: 256, margin: 1, color: { dark: el.fg, light: el.bg } }))
      .then((url) => {
        if (alive) setSrc(url)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [el.data, el.fg, el.bg])
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        background: el.bg, display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", opacity: el.opacity, transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      {src ? <img src={src} alt="QR code" style={{ width: "100%", height: "100%" }} /> : <span style={{ fontSize: 16, color: "#9ca3af", fontFamily: "Inter, sans-serif" }}>QR</span>}
    </div>
  )
}

function PreviewSticky({ el }: { el: StickyElement }) {
  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        background: el.color, borderRadius: 6, padding: 14, boxShadow: "2px 4px 10px rgba(0,0,0,0.12)",
        fontFamily: el.fontFamily, fontSize: el.fontSize, lineHeight: 1.3, color: "#1f2937",
        whiteSpace: "pre-wrap", overflow: "hidden", opacity: el.opacity,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
      }}
    >
      {el.text}
    </div>
  )
}

function PreviewElement({ el }: { el: DesignElement }) {
  switch (el.type) {
    case "text":
      return <PreviewText el={el as TextElement} />
    case "shape":
      return <PreviewShape el={el as ShapeElement} />
    case "image":
      return <PreviewImage el={el as ImageElement} />
    case "table":
      return <PreviewTable el={el as TableElement} />
    case "chart":
      return <PreviewChart el={el as ChartElement} />
    case "qr":
      return <PreviewQr el={el as QrElement} />
    case "sticky":
      return <PreviewSticky el={el as StickyElement} />
    case "frame":
      return (
        <div
          style={{
            position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
            background: el.fill !== "transparent" ? el.fill : "transparent",
            border: `${Math.max(2, el.strokeWidth)}px solid ${el.stroke === "transparent" ? "#e5e7eb" : el.stroke}`,
            borderRadius: el.cornerRadius, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", fontSize: Math.min(24, el.height / 8), opacity: el.opacity,
          }}
        >
          {el.label}
        </div>
      )
    default:
      return null
  }
}

/** Renders one page of a real DesignDoc, scaled to fit the container (native element styles, CSS-scaled). */
function MiniDocPreview({ doc, pageIndex = 0 }: { doc: DesignDoc; pageIndex?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width)
    })
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const page = doc.pages[Math.min(Math.max(pageIndex, 0), doc.pages.length - 1)]
  const scale = w > 0 && doc.width > 0 ? w / doc.width : 0

  return (
    <div ref={ref} className="w-full">
      {page && scale > 0 && (
        <div
          className="relative overflow-hidden rounded-lg border shadow-sm"
          style={{ width: "100%", aspectRatio: `${doc.width} / ${doc.height}`, ...bgStyle(page.background ?? doc.background) }}
          role="img"
          aria-label={`Preview of ${doc.meta?.name ?? "template"}${doc.pages.length > 1 ? `, page ${pageIndex + 1}` : ""}`}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: doc.width, height: doc.height, transform: `scale(${scale})` }}
          >
            {page.elements.map((el) => (
              <PreviewElement key={el.id} el={el} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------- detail view ------------------------------- */

function orientationOf(w: number, h: number): string {
  const r = w / h
  if (r > 1.05) return "Landscape"
  if (r < 0.95) return "Portrait"
  return "Square"
}

const TYPE_ICON: Record<string, ReactNode> = {
  canvas: <Square className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
  whiteboard: <Pencil className="h-4 w-4" />,
  doc: <FileText className="h-4 w-4" />,
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [authPrompt, setAuthPrompt] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)

  const query = useQuery({
    queryKey: ["templates", "detail", templateId],
    queryFn: () => api.get<{ template: TemplateDetailRow }>(`/api/templates/${templateId}`),
  })

  const tpl = query.data?.template
  const doc = useMemo<DesignDoc | null>(() => {
    if (!tpl) return null
    try {
      return JSON.parse(tpl.contentJson) as DesignDoc
    } catch {
      return null
    }
  }, [tpl])

  const tags = useMemo<string[]>(() => {
    try {
      return tpl ? (JSON.parse(tpl.tags) as string[]) : []
    } catch {
      return []
    }
  }, [tpl])

  function backToTemplates() {
    navigate({ name: "templates" })
  }

  async function useTemplate() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    setBusy(true)
    try {
      const res = await api.post<{ project: { id: string } }>(`/api/templates/${templateId}/use`)
      await qc.invalidateQueries({ queryKey: ["projects"] })
      navigate({ name: "editor", projectId: res.project.id })
    } catch {
      toast({ title: "Could not use template", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <Button variant="ghost" size="sm" className="min-h-[36px] -ml-2" onClick={backToTemplates}>
        <ArrowLeft className="h-4 w-4" /> All templates
      </Button>

      {query.isLoading ? (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ) : query.isError || !tpl ? (
        <div className="mt-6 rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm font-medium">Template not found.</p>
          <p className="mt-1 text-sm text-muted-foreground">It may have been removed from the library.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={backToTemplates}>
            <ArrowLeft className="h-4 w-4" /> Back to templates
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Preview column */}
          <div className="min-w-0">
            <div className="max-w-3xl">
              {doc ? <MiniDocPreview doc={doc} pageIndex={pageIdx} /> : tpl.thumbnail ? (
                <img src={tpl.thumbnail} alt={tpl.name} className="w-full rounded-lg border" />
              ) : (
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border">
                  <TemplatePreviewBox template={tpl} />
                </div>
              )}
            </div>
            {doc && doc.pages.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3" role="tablist" aria-label="Template pages">
                {doc.pages.map((p, i) => (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={pageIdx === i}
                    onClick={() => setPageIdx(i)}
                    className={cn(
                      "w-28 overflow-hidden rounded-md border-2 bg-card transition-colors",
                      pageIdx === i ? "border-primary" : "border-transparent hover:border-muted-foreground/40",
                    )}
                    aria-label={`Show page ${i + 1}: ${p.name}`}
                  >
                    <div className="[&>div>div]:rounded-none [&>div>div]:border-0 [&>div>div]:shadow-none">
                      <MiniDocPreview doc={doc} pageIndex={i} />
                    </div>
                    <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                      {i + 1}. {p.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{tpl.category}</Badge>
                <Badge variant="outline" className="gap-1">
                  {TYPE_ICON[tpl.type] ?? <Square className="h-4 w-4" />}
                  <span className="capitalize">{tpl.type}</span>
                </Badge>
                {doc && doc.pages.length > 1 && (
                  <Badge variant="outline" className="gap-1">
                    <Layers className="h-4 w-4" /> {doc.pages.length} pages
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">{tpl.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tpl.width} × {tpl.height} px · {orientationOf(tpl.width, tpl.height)}
              </p>
            </div>

            <Separator />

            <div className="rounded-lg border bg-card p-4">
              <p className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold">CC0</span> — free for personal and commercial use, no attribution required.
                </span>
              </p>
            </div>

            <Button className="w-full min-h-[44px] text-base" onClick={useTemplate} disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Pencil className="h-5 w-5" />}
              Use this template
            </Button>
            <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
              Opens as a fully editable copy in your workspace — every text, shape, color, table and chart stays a real object you
              can change. Nothing is flattened.
            </p>

            {tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" /> Original artwork created for Studio — no stock or brand assets.
            </div>
          </aside>
        </div>
      )}

      <Dialog open={authPrompt} onOpenChange={setAuthPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to use this template</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Templates are free for everyone. A free account keeps your customized copy in the cloud.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAuthPrompt(false); navigate({ name: "auth" }) }}>Sign in / Register</Button>
            <Button variant="ghost" onClick={() => setAuthPrompt(false)}>Not now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
