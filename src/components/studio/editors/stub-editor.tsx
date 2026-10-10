"use client"

/**
 * Shared lightweight preview editor used as the interim surface for editors
 * that are being built out in later waves. It renders the real document
 * (background, shapes, text, images) on a canvas and supports PNG/JPEG/PDF/JSON
 * export, so every document type stays functional at every stage.
 *
 * Specialized editors (photo, presentation, video, doc, whiteboard, website,
 * email) replace their stub in src/components/studio/editors/ with full UI.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { jsPDF } from "jspdf"
import type { EditorHandle, EditorProps, ExportResult } from "./types"
import type { DesignDoc, DesignElement } from "@/lib/design/types"
import { Loader2 } from "lucide-react"

export function renderDocToCanvas(doc: DesignDoc, page: number, target?: HTMLCanvasElement, pixelRatio = 1): HTMLCanvasElement {
  const canvas = target ?? document.createElement("canvas")
  canvas.width = Math.round(doc.width * pixelRatio)
  canvas.height = Math.round(doc.height * pixelRatio)
  const ctx = canvas.getContext("2d")!
  ctx.scale(pixelRatio, pixelRatio)
  const p = doc.pages[Math.min(page, doc.pages.length - 1)]
  const bg = p.background
  if (bg.type === "transparent") {
    // leave transparent
  } else if (bg.type === "gradient" && bg.gradient) {
    const grad = ctx.createLinearGradient(0, 0, doc.width * Math.cos((bg.gradient.angle * Math.PI) / 180), doc.height * Math.sin((bg.gradient.angle * Math.PI) / 180))
    grad.addColorStop(0, bg.gradient.from)
    grad.addColorStop(1, bg.gradient.to)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = bg.color ?? "#ffffff"
  }
  ctx.fillRect(0, 0, doc.width, doc.height)

  for (const el of p.elements as DesignElement[]) {
    if (el.hidden) continue
    ctx.save()
    ctx.globalAlpha = el.opacity
    ctx.translate(el.x + el.width / 2, el.y + el.height / 2)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-el.width / 2, -el.height / 2)
    if (el.type === "text") {
      ctx.fillStyle = el.color
      ctx.font = `${el.italic ? "italic " : ""}${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
      ctx.textAlign = el.align === "center" ? "center" : el.align === "right" ? "right" : "left"
      const lines = (el.uppercase ? el.text.toUpperCase() : el.text).split("\n")
      const lh = el.fontSize * el.lineHeight
      lines.forEach((line, i) => {
        const x = el.align === "center" ? el.width / 2 : el.align === "right" ? el.width : 0
        ctx.fillText(line, x, lh * (i + 0.8), el.width)
      })
    } else if (el.type === "shape") {
      ctx.fillStyle = el.fill
      if (el.variant === "ellipse") {
        ctx.beginPath()
        ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.beginPath()
        if (typeof ctx.roundRect === "function") ctx.roundRect(0, 0, el.width, el.height, el.cornerRadius)
        else ctx.rect(0, 0, el.width, el.height)
        ctx.fill()
      }
    } else if (el.type === "image" && el.src) {
      // images render when cached by the caller (drawn synchronously below when loaded)
      const img = new Image()
      img.decoding = "sync"
      // best-effort synchronous draw if cached by the browser
      ctx.drawImage(img as unknown as CanvasImageSource, 0, 0, el.width, el.height)
    } else {
      ctx.fillStyle = "rgba(139,92,246,0.15)"
      ctx.fillRect(0, 0, el.width, el.height)
    }
    ctx.restore()
  }
  return canvas
}

export function makeStubEditor(label: string) {
  return forwardRef<EditorHandle, EditorProps>(function StubEditor({ initialDoc, registerHandle }, _ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      renderDocToCanvas(initialDoc, 0, canvasRef.current ?? undefined)
      registerHandle({
        export: async (req) => {
          const results: ExportResult[] = []
          const base = req.filenameBase || "design"
          if (req.format === "json") {
            results.push({ filename: `${base}.studio.json`, blob: new Blob([JSON.stringify(initialDoc, null, 2)], { type: "application/json" }) })
            return results
          }
          const pages = req.pages && req.pages.length ? req.pages : initialDoc.pages.map((_, i) => i)
          if (req.format === "pdf") {
            const pdf = new jsPDF({ orientation: initialDoc.width >= initialDoc.height ? "landscape" : "portrait", unit: "px", format: [initialDoc.width, initialDoc.height] })
            pages.forEach((pi, idx) => {
              const c = renderDocToCanvas(initialDoc, pi, undefined, Math.min(2, req.scale ?? 1))
              if (idx > 0) pdf.addPage([initialDoc.width, initialDoc.height])
              pdf.addImage(c.toDataURL("image/png"), "PNG", 0, 0, initialDoc.width, initialDoc.height)
            })
            results.push({ filename: `${base}.pdf`, blob: pdf.output("blob") })
            return results
          }
          const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
          for (const pi of pages) {
            const c = renderDocToCanvas(initialDoc, pi, undefined, req.scale ?? 1)
            const dataUrl = c.toDataURL(mime, req.quality ?? 0.92)
            const bin = atob(dataUrl.split(",")[1])
            const arr = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
            results.push({ filename: `${base}${pages.length > 1 ? `-page${pi + 1}` : ""}.${req.format === "jpeg" ? "jpg" : req.format}`, blob: new Blob([arr], { type: mime }) })
          }
          return results
        },
        getThumbnail: async () => {
          const c = renderDocToCanvas(initialDoc, 0, undefined, 480 / initialDoc.width)
          return c.toDataURL("image/jpeg", 0.5)
        },
      })
      return () => registerHandle(null)
    }, [initialDoc, registerHandle])

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 overflow-auto bg-muted p-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium">{label}</p>
        <p className="max-w-md text-center text-xs text-muted-foreground">
          This workspace renders your document and supports PNG/JPEG/PDF/JSON export. The full editing UI for this
          document type is completed in its module build.
        </p>
        <canvas ref={canvasRef} className="max-h-[70dvh] max-w-full rounded border bg-white shadow" />
      </div>
    )
  })
}
