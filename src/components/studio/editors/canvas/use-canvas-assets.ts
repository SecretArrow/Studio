"use client"

/**
 * Asset preparation hooks for the canvas stage:
 *  - useProcessedImages: loads image elements and bakes CSS-style filters
 *    (brightness/contrast/…/vignette) into offscreen canvases so the Konva
 *    stage matches the export renderer 1:1.
 *  - useQrImages: renders QR elements to images via the shared qrDataUrl
 *    helper (dynamically imports `qrcode` — keeps the main bundle lean).
 */

import { useEffect, useState } from "react"
import type { BackgroundSpec, DesignElement, ImageElement, QrElement } from "@/lib/design/types"
import { DEFAULT_IMAGE_FILTERS } from "@/lib/design/types"
import { loadImage, qrDataUrl } from "@/lib/editor/export"

export interface ProcessedImage {
  source: HTMLCanvasElement | HTMLImageElement
  natW: number
  natH: number
}

const filterCanvasCache = new Map<string, Promise<ProcessedImage | null>>()

function getProcessed(el: ImageElement): Promise<ProcessedImage | null> {
  const key = `${el.src}|${JSON.stringify(el.filters ?? DEFAULT_IMAGE_FILTERS)}`
  const hit = filterCanvasCache.get(key)
  if (hit) return hit
  const p = loadImage(el.src).then((img) => {
    if (!img) return null
    const natW = img.naturalWidth || 1
    const natH = img.naturalHeight || 1
    const f = el.filters
    const hasFilters = f && JSON.stringify(f) !== JSON.stringify(DEFAULT_IMAGE_FILTERS)
    if (!hasFilters) return { source: img, natW, natH }
    const canvas = document.createElement("canvas")
    canvas.width = natW
    canvas.height = natH
    const ctx = canvas.getContext("2d")
    if (!ctx) return { source: img, natW, natH }
    const parts: string[] = []
    if (f && f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
    if (f && f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
    if (f && f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`)
    if (f && f.hue) parts.push(`hue-rotate(${f.hue}deg)`)
    if (f && f.blur) parts.push(`blur(${f.blur}px)`)
    if (f && f.grayscale) parts.push(`grayscale(${f.grayscale}%)`)
    if (f && f.sepia) parts.push(`sepia(${f.sepia}%)`)
    if (f && f.invert) parts.push(`invert(${f.invert}%)`)
    if (parts.length > 0) ctx.filter = parts.join(" ")
    ctx.drawImage(img, 0, 0)
    ctx.filter = "none"
    if (f && f.vignette > 0) {
      const grad = ctx.createRadialGradient(natW / 2, natH / 2, Math.min(natW, natH) * 0.35, natW / 2, natH / 2, Math.max(natW, natH) * 0.72)
      grad.addColorStop(0, "rgba(0,0,0,0)")
      grad.addColorStop(1, `rgba(0,0,0,${(f.vignette / 100) * 0.85})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, natW, natH)
    }
    return { source: canvas, natW, natH }
  })
  filterCanvasCache.set(key, p)
  return p
}

/** Loads + filters all image elements on the page (and the page background image). */
export function useProcessedImages(elements: DesignElement[], pageBackground: BackgroundSpec): Record<string, ProcessedImage> {
  const [images, setImages] = useState<Record<string, ProcessedImage>>({})

  useEffect(() => {
    let alive = true
    const imageEls = elements.filter((e): e is ImageElement => e.type === "image" && !!e.src)
    const bgSrc = pageBackground.type === "image" ? pageBackground.imageUrl : undefined
    const pending: Promise<void>[] = []
    const next: Record<string, ProcessedImage> = {}

    for (const el of imageEls) {
      pending.push(
        getProcessed(el).then((res) => {
          if (res && alive) next[el.id] = res
        }),
      )
    }
    if (bgSrc) {
      pending.push(
        loadImage(bgSrc).then((img) => {
          if (img && alive) next["__pagebg__"] = { source: img, natW: img.naturalWidth, natH: img.naturalHeight }
        }),
      )
    }
    void Promise.all(pending).then(() => {
      if (alive) setImages(next)
    })
    return () => {
      alive = false
    }
  }, [elements, pageBackground])

  return images
}

/** Renders QR elements to loaded images keyed by element id. */
export function useQrImages(elements: DesignElement[]): Record<string, HTMLImageElement> {
  const [qrImages, setQrImages] = useState<Record<string, HTMLImageElement>>({})
  useEffect(() => {
    let alive = true
    const qrEls = elements.filter((e): e is QrElement => e.type === "qr" && !!e.data)
    if (qrEls.length === 0) {
      const t = setTimeout(() => setQrImages({}), 0)
      return () => clearTimeout(t)
    }
    const next: Record<string, HTMLImageElement> = {}
    void Promise.all(
      qrEls.map((el) =>
        qrDataUrl(el.data, el.fg, el.bg).then(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image()
              img.onload = () => {
                if (alive) next[el.id] = img
                resolve()
              }
              img.onerror = () => resolve()
              img.src = url
            }),
        ),
      ),
    ).then(() => {
      if (alive) setQrImages(next)
    })
    return () => {
      alive = false
    }
  }, [elements])
  return qrImages
}
