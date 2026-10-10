/**
 * Presentation export helpers.
 * PDF / PNG / JSON reuse the shared headless renderer in src/lib/editor/export.ts
 * (so charts, tables and QR codes render exactly like the editor preview).
 * Only the ZIP bundle (PNG pages + PDF + README) is built here.
 */

import type { ExportResult } from "@/components/studio/editors/types"
import type { DesignDoc, DesignElement } from "@/lib/design/types"
import { exportDoc, renderPageToCanvas } from "@/lib/editor/export"

/** Rasterize one element via the shared canvas renderer (transparent bg). */
export async function rasterizeElementToDataUrl(doc: DesignDoc, el: DesignElement): Promise<string> {
  const tmp: DesignDoc = {
    ...doc,
    pages: [{ ...doc.pages[0], background: { type: "transparent" }, elements: [el] }],
  }
  const canvas = await renderPageToCanvas(tmp, tmp.pages[0], { transparent: true, scale: 2 })
  return canvas.toDataURL("image/png")
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png")
  })
}

/**
 * ZIP: one PNG per slide (1920px-wide render when the slide is smaller),
 * plus a full PDF and a README. Mirrors "ZIP (pngs + pdf)" contract.
 */
export async function zipPngsAndPdf(doc: DesignDoc, filenameBase: string, pageIndices?: number[]): Promise<ExportResult[]> {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()
  const base = (filenameBase || "presentation").replace(/[^\w\-. ]+/g, "_").slice(0, 60)
  const idx = pageIndices && pageIndices.length > 0 ? pageIndices : doc.pages.map((_, i) => i)
  const renderScale = Math.min(2, Math.max(1, 1920 / Math.max(1, doc.width)))

  for (let i = 0; i < idx.length; i += 1) {
    const page = doc.pages[idx[i]]
    if (!page) continue
    const canvas = await renderPageToCanvas(doc, page, { scale: renderScale })
    zip.file(`${base}-slide-${idx[i] + 1}.png`, await canvasToBlob(canvas))
  }

  const pdfResults = await exportDoc(doc, { format: "pdf", scale: 2, filenameBase: base })
  if (pdfResults[0]) zip.file(`${base}.pdf`, pdfResults[0].blob)

  zip.file(
    "README.txt",
    [
      `Studio presentation export — ${base}`,
      `Slides: ${idx.length}`,
      `Slide size: ${doc.width}×${doc.height}px (rendered at ${Math.round(renderScale * 100)}%)`,
      "",
      "slide-N.png — full-resolution slide images",
      `${base}.pdf — all slides as a PDF deck`,
    ].join("\n"),
  )

  return [
    {
      filename: `${base}-slides.zip`,
      blob: await zip.generateAsync({ type: "blob" }),
      note: `${idx.length} slide PNG(s) + PDF zipped.`,
    },
  ]
}
