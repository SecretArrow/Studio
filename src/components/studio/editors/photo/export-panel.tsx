"use client"

/**
 * Export panel: page background controls + the "Resize & compress" dialog
 * with a real rendered-size estimate. Standard formats export through the
 * editor toolbar's export menu (EditorHandle).
 */

import { useEffect, useState } from "react"
import type { PhotoApi } from "./api"
import { PanelSection } from "./ui"
import { renderPhotoDoc } from "./render"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorField } from "../canvas/ui"
import { downloadBlob } from "@/lib/studio/api-client"
import type { BackgroundSpec } from "@/lib/design/types"
import { Download, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

type BgKind = "solid" | "transparent" | "gradient"

function kindOf(bg: BackgroundSpec): BgKind {
  if (bg.type === "transparent") return "transparent"
  if (bg.type === "gradient") return "gradient"
  return "solid"
}

export function ExportPanel({ api, filenameBase }: { api: PhotoApi; filenameBase: string }) {
  const bg = api.page.background
  const kind = kindOf(bg)
  const [dialogOpen, setDialogOpen] = useState(false)

  const setKind = (k: BgKind) => {
    if (k === "transparent") api.setBackground({ type: "transparent" })
    else if (k === "gradient")
      api.setBackground({ type: "gradient", gradient: { from: "#f5f3ff", to: "#ddd6fe", angle: 90 } })
    else api.setBackground({ type: "solid", color: bg.type === "solid" && bg.color ? bg.color : "#ffffff" })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Canvas background">
        <Select value={kind} onValueChange={(v) => setKind(v as BgKind)} disabled={!api.canEdit}>
          <SelectTrigger className="h-8 text-xs" aria-label="Background type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid color</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="transparent">Transparent</SelectItem>
          </SelectContent>
        </Select>
        {kind === "solid" ? (
          <ColorField
            value={bg.type === "solid" && bg.color ? bg.color : "#ffffff"}
            onChange={(v) => api.setBackground({ type: "solid", color: v })}
            label="Color"
          />
        ) : null}
        {kind === "gradient" && bg.type === "gradient" && bg.gradient ? (
          <div className="space-y-2">
            <ColorField
              value={bg.gradient.from}
              onChange={(v) => api.setBackground({ type: "gradient", gradient: { ...bg.gradient!, from: v } })}
              label="From"
            />
            <ColorField
              value={bg.gradient.to}
              onChange={(v) => api.setBackground({ type: "gradient", gradient: { ...bg.gradient!, to: v } })}
              label="To"
            />
          </div>
        ) : null}
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Transparent background + PNG export keeps the pixels see-through. JPEG and PDF always get an opaque backdrop.
        </p>
      </PanelSection>

      <PanelSection title="Export">
        <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => setDialogOpen(true)}>
          <FileDown className="h-3.5 w-3.5" /> Resize &amp; compress…
        </Button>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          PNG / JPEG / WebP / PDF / JSON export lives in the download menu of the top toolbar. The dialog here gives you
          exact pixel sizes and compression control.
        </p>
      </PanelSection>

      <ResizeDialog api={api} open={dialogOpen} onOpenChange={setDialogOpen} filenameBase={filenameBase} />
    </div>
  )
}

function ResizeDialog({
  api,
  open,
  onOpenChange,
  filenameBase,
}: {
  api: PhotoApi
  open: boolean
  onOpenChange: (v: boolean) => void
  filenameBase: string
}) {
  const [width, setWidth] = useState(String(api.doc.width))
  const [height, setHeight] = useState(String(api.doc.height))
  const [lockAspect, setLockAspect] = useState(true)
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg")
  const [quality, setQuality] = useState(90)
  const [sizeLabel, setSizeLabel] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)

  const w = Math.max(8, Math.min(8000, Math.round(Number(width) || 0)))
  const h = Math.max(8, Math.min(8000, Math.round(Number(height) || 0)))
  const ratio = api.doc.width / api.doc.height
  const stretched = Math.abs(w / h - ratio) > 0.01

  // re-render the estimate whenever settings change (debounced)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRendering(true)
    const t = setTimeout(async () => {
      try {
        const canvas = await renderPhotoDoc(api.doc, api.page, {
          scale: 1,
          scaleX: w / api.doc.width,
          scaleY: h / api.doc.height,
          transparent: format === "png" && api.page.background.type === "transparent",
          forceOpaque: format === "jpeg",
        })
        const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png"
        const out = await new Promise<Blob | null>((resolve) => {
          try {
            canvas.toBlob((b) => resolve(b), mime, format === "png" ? undefined : quality / 100)
          } catch {
            resolve(null)
          }
        })
        if (cancelled) return
        setBlob(out)
        if (out) setSizeLabel(`${(out.size / 1024).toFixed(0)} KB`)
        else setSizeLabel("unavailable (CORS-blocked image)")
      } catch {
        if (!cancelled) setSizeLabel("render failed")
      } finally {
        if (!cancelled) setRendering(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, w, h, format, quality, api.doc, api.page])

  const onWidth = (v: number) => {
    setWidth(String(v))
    if (lockAspect) setHeight(String(Math.max(8, Math.round(v / ratio))))
  }
  const onHeight = (v: number) => {
    setHeight(String(v))
    if (lockAspect) setWidth(String(Math.max(8, Math.round(v * ratio))))
  }

  const onDownload = () => {
    if (!blob) return
    const ext = format === "jpeg" ? "jpg" : format
    downloadBlob(blob, `${filenameBase}-${w}x${h}.${ext}`)
    toast.success(`Downloaded ${w}×${h} ${format.toUpperCase()}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resize &amp; compress</DialogTitle>
          <DialogDescription>
            Renders the photo at an exact pixel size with your filters applied — the preview size below is the real
            encoded size.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <label className="flex-1 space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Width (px)</span>
              <Input
                type="number"
                min={8}
                max={8000}
                value={width}
                onChange={(e) => onWidth(Math.max(8, Math.min(8000, Number(e.target.value) || 8)))}
                className="h-9 text-sm"
                aria-label="Target width in pixels"
              />
            </label>
            <label className="flex-1 space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Height (px)</span>
              <Input
                type="number"
                min={8}
                max={8000}
                value={height}
                onChange={(e) => onHeight(Math.max(8, Math.min(8000, Number(e.target.value) || 8)))}
                className="h-9 text-sm"
                aria-label="Target height in pixels"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs" htmlFor="lock-aspect">
              Lock aspect ratio
            </Label>
            <Switch id="lock-aspect" checked={lockAspect} onCheckedChange={setLockAspect} aria-label="Lock aspect ratio" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs" htmlFor="rz-format">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "jpeg" | "png" | "webp")}>
              <SelectTrigger id="rz-format" className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {format !== "png" ? (
            <div className="flex items-center gap-3">
              <Label className="w-16 shrink-0 text-xs" htmlFor="rz-quality">Quality</Label>
              <Slider
                id="rz-quality"
                value={[quality]}
                min={10}
                max={100}
                step={1}
                onValueChange={(vals) => setQuality(vals[0] ?? 90)}
                className="flex-1"
                aria-label="Compression quality"
              />
              <span className="w-10 text-right text-xs tabular-nums">{quality}%</span>
            </div>
          ) : null}
          {stretched ? (
            <p className="rounded-md border border-amber-300/60 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-400">
              Target aspect differs from the photo — the image will be stretched to fit.
            </p>
          ) : null}
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              {w} × {h} · {format.toUpperCase()}
              {format !== "png" ? ` · ${quality}%` : ""}
            </span>
            <span className="flex items-center gap-1.5 font-semibold tabular-nums">
              {rendering ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : null}
              {sizeLabel ?? "…"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="gap-1.5" disabled={!blob || rendering} onClick={onDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
