"use client"

/**
 * Photo filter model & pixel pipeline.
 *
 * Extends the shared ImageFilters contract with extra numeric fields
 * (exposure, temperature, gamma, highlights, shadows, sharpness). The extra
 * keys ride along inside ImageElement.filters during JSON serialization so
 * documents stay valid for every editor without a schema bump.
 *
 * Rendering approach (one consistent pipeline for preview AND export):
 *  1. CSS filter string applied via ctx.filter while drawing the subject.
 *  2. Pixel-level pass (gamma / highlights / shadows LUT + sharpness
 *     convolution) on the isolated subject canvas.
 *  3. Temperature color-grade overlay (blend-mode layer).
 *  4. Vignette radial-gradient overlay.
 */

import type { ImageElement, ImageFilters } from "@/lib/design/types"
import { DEFAULT_IMAGE_FILTERS } from "@/lib/design/types"

export interface PhotoFilters extends ImageFilters {
  /** -100..100 — extra brightness stops (multiplicative), 0 = neutral */
  exposure: number
  /** -100..100 — warm/cool color grade overlay (approximation) */
  temperature: number
  /** 0.2..2.4 — midtone gamma, 1 = neutral (pixel LUT) */
  gamma: number
  /** -100..100 — brighten (+) / recover (−) bright tones (pixel LUT) */
  highlights: number
  /** -100..100 — lift (+) / crush (−) dark tones (pixel LUT) */
  shadows: number
  /** 0..100 — unsharp-mask strength (convolution) */
  sharpness: number
}

export const DEFAULT_PHOTO_FILTERS: PhotoFilters = {
  ...DEFAULT_IMAGE_FILTERS,
  exposure: 0,
  temperature: 0,
  gamma: 1,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
}

/** Merge (possibly partial / legacy) stored filters onto the defaults. */
export function toPhotoFilters(f?: Partial<PhotoFilters> | null): PhotoFilters {
  return { ...DEFAULT_PHOTO_FILTERS, ...(f ?? {}) }
}

export function isNeutralFilters(f: PhotoFilters): boolean {
  return (Object.keys(DEFAULT_PHOTO_FILTERS) as (keyof PhotoFilters)[]).every((k) => f[k] === DEFAULT_PHOTO_FILTERS[k])
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/* ------------------------------ CSS filter stage ------------------------------ */

/**
 * CSS `filter` string for the parametric parts of the pipeline.
 * Drawn with ctx.filter so preview and export behave identically.
 */
export function cssFilterString(f: PhotoFilters): string {
  const parts: string[] = []
  const exposureMult = f.exposure !== 0 ? Math.pow(2, f.exposure / 100) : null
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
  if (exposureMult !== null) parts.push(`brightness(${(exposureMult * 100).toFixed(2)}%)`)
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
  if (f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`)
  if (f.hue) parts.push(`hue-rotate(${f.hue}deg)`)
  if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`)
  if (f.sepia) parts.push(`sepia(${f.sepia}%)`)
  if (f.invert) parts.push(`invert(${f.invert}%)`)
  if (f.blur) parts.push(`blur(${f.blur}px)`)
  return parts.length > 0 ? parts.join(" ") : "none"
}

/** True when the pixel-level pass must run (gamma / highlights / shadows / sharpness). */
export function hasPixelPass(f: PhotoFilters): boolean {
  return f.gamma !== 1 || f.highlights !== 0 || f.shadows !== 0 || f.sharpness > 0
}

/* ------------------------------ pixel-level stage ------------------------------ */

/** Combined per-channel transfer LUT for gamma + highlights + shadows. */
function buildToneLut(f: PhotoFilters): Uint8Array | null {
  if (f.gamma === 1 && f.highlights === 0 && f.shadows === 0) return null
  const lut = new Uint8Array(256)
  const gamma = clamp(f.gamma, 0.2, 2.4)
  const sh = f.shadows / 100
  const hi = f.highlights / 100
  for (let i = 0; i < 256; i += 1) {
    let v = i / 255
    if (gamma !== 1) v = Math.pow(v, 1 / gamma)
    if (sh !== 0) {
      const mask = (1 - v) * (1 - v) // strongest in the shadows
      v += sh * 0.45 * mask
    }
    if (hi !== 0) {
      const mask = v * v // strongest in the highlights
      v += hi * 0.45 * mask
    }
    lut[i] = clamp(v, 0, 1) * 255
  }
  return lut
}

/**
 * Apply the pixel-level stage in-place on a canvas region.
 * Used with identical parameters for the interactive preview and exports.
 */
export function applyPixelPass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: PhotoFilters): void {
  if (w < 1 || h < 1) return
  const lut = buildToneLut(f)
  const needSharp = f.sharpness > 0
  if (!lut && !needSharp) return
  let image: ImageData
  try {
    image = ctx.getImageData(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  } catch {
    return // tainted canvas — cannot read pixels (cross-origin without CORS)
  }
  const d = image.data
  if (lut) {
    for (let i = 0; i < d.length; i += 4) {
      d[i] = lut[d[i]]
      d[i + 1] = lut[d[i + 1]]
      d[i + 2] = lut[d[i + 2]]
    }
  }
  if (needSharp) {
    const a = clamp(f.sharpness, 0, 100) / 100
    const iw = image.width
    const ih = image.height
    const src = new Uint8ClampedArray(d) // snapshot for neighbor reads
    for (let py = 1; py < ih - 1; py += 1) {
      for (let px = 1; px < iw - 1; px += 1) {
        const idx = (py * iw + px) * 4
        for (let c = 0; c < 3; c += 1) {
          const o = idx + c
          const conv =
            5 * src[o] -
            src[o - 4] -
            src[o + 4] -
            src[o - iw * 4] -
            src[o + iw * 4]
          d[o] = src[o] * (1 - a) + conv * a
        }
      }
    }
  }
  ctx.putImageData(image, Math.round(x), Math.round(y))
}

/* ------------------------------ overlay stages ------------------------------ */

/** Temperature approximation: warm/cool color grade via a blend-mode layer. */
export function drawTemperatureTint(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number): void {
  if (!t) return
  ctx.save()
  ctx.globalCompositeOperation = "overlay"
  ctx.globalAlpha = (Math.abs(clamp(t, -100, 100)) / 100) * 0.4
  ctx.fillStyle = t > 0 ? "#ff8a2a" : "#3f8cff"
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

/** Vignette radial gradient (matches the shared export engine's look). */
export function drawVignette(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, amount: number): void {
  const amt = clamp(amount, 0, 100)
  if (amt <= 0) return
  const grad = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    Math.min(w, h) * 0.35,
    x + w / 2,
    y + h / 2,
    Math.max(w, h) * 0.72,
  )
  grad.addColorStop(0, "rgba(0,0,0,0)")
  grad.addColorStop(1, `rgba(0,0,0,${(amt / 100) * 0.85})`)
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)
}

/* ------------------------------ presets ------------------------------ */

export interface FilterPreset {
  id: string
  name: string
  values: Partial<PhotoFilters>
}

/** 12 real filter combos — each is a full parametric preset, never a fake label. */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: "original", name: "Original", values: {} },
  { id: "vivid", name: "Vivid", values: { saturation: 142, contrast: 114, brightness: 103 } },
  { id: "mono", name: "Mono", values: { grayscale: 100, contrast: 112 } },
  { id: "fade", name: "Fade", values: { contrast: 84, brightness: 110, saturation: 78 } },
  { id: "warm", name: "Warm", values: { temperature: 48, saturation: 108 } },
  { id: "cool", name: "Cool", values: { temperature: -48, saturation: 104, brightness: 102 } },
  { id: "drama", name: "Drama", values: { contrast: 142, brightness: 92, saturation: 116, vignette: 35 } },
  { id: "vintage", name: "Vintage", values: { sepia: 45, contrast: 92, brightness: 108, saturation: 85, vignette: 22 } },
  { id: "noir", name: "Noir", values: { grayscale: 100, contrast: 152, brightness: 90, vignette: 55 } },
  { id: "sunset", name: "Sunset", values: { temperature: 66, saturation: 126, exposure: 8 } },
  { id: "punch", name: "Punch", values: { contrast: 124, saturation: 134, sharpness: 45 } },
  { id: "dreamy", name: "Dreamy", values: { blur: 1.4, brightness: 108, saturation: 92, exposure: 6, vignette: 14 } },
]

/* ------------------------------ auto enhance ------------------------------ */

/**
 * Deterministic auto-levels ("Auto enhance"): analyzes the image histogram
 * (0.4% / 99.6% percentile stretch) and maps the result onto the parametric
 * brightness / contrast / gamma controls. No AI, no randomness — the same
 * image always produces the same values.
 */
export function computeAutoEnhance(img: HTMLImageElement, crop: ImageElement["crop"]): { brightness: number; contrast: number; gamma: number } {
  const maxSide = 160
  const cw = Math.max(1, Math.round(maxSide * Math.min(1, img.naturalWidth / Math.max(1, img.naturalHeight))))
  const ch = Math.max(1, Math.round(maxSide * Math.min(1, img.naturalHeight / Math.max(1, img.naturalWidth))))
  const c = document.createElement("canvas")
  c.width = cw
  c.height = ch
  const ctx = c.getContext("2d", { willReadFrequently: true })
  if (!ctx) return { brightness: 100, contrast: 100, gamma: 1 }
  const cr = crop ?? { x: 0, y: 0, width: 1, height: 1 }
  ctx.drawImage(
    img,
    cr.x * img.naturalWidth,
    cr.y * img.naturalHeight,
    Math.max(1, cr.width * img.naturalWidth),
    Math.max(1, cr.height * img.naturalHeight),
    0,
    0,
    cw,
    ch,
  )
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, cw, ch).data
  } catch {
    return { brightness: 100, contrast: 100, gamma: 1 }
  }

  // per-channel histogram
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)]
  const total = (data.length / 4) * 3
  let meanSum = 0
  for (let i = 0; i < data.length; i += 4) {
    hist[0][data[i]] += 1
    hist[1][data[i + 1]] += 1
    hist[2][data[i + 2]] += 1
    meanSum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  const mean = meanSum / total / 255

  // percentile stretch per channel, averaged
  let kSum = 0
  let loSum = 0
  for (let ch2 = 0; ch2 < 3; ch2 += 1) {
    const loTarget = total * 0.004
    const hiTarget = total * 0.996
    let acc = 0
    let lo = 0
    let hi = 255
    for (let i = 0; i < 256; i += 1) {
      acc += hist[ch2][i]
      if (acc >= loTarget) {
        lo = i
        break
      }
    }
    acc = 0
    for (let i = 255; i >= 0; i -= 1) {
      acc += hist[ch2][i]
      if (acc >= total - hiTarget) {
        hi = i
        break
      }
    }
    if (hi - lo < 24) {
      lo = Math.max(0, lo - 12)
      hi = Math.min(255, hi + 12)
    }
    kSum += 255 / Math.max(1, hi - lo)
    loSum += lo / 255
  }
  const k = kSum / 3 // levels slope: out = in*k + m
  const m = -(loSum / 3) * k

  // map linear stretch onto contrast(a) ∘ brightness(b): a*b = k, 0.5*b - 0.5*a*b = m
  let contrast = 1
  let brightness = 1
  if (m < -0.001) {
    contrast = clamp(1 / (1 + (2 * m) / k), 1, 2.2)
    brightness = clamp(k / contrast, 0.5, 1.6)
  } else {
    contrast = clamp(k, 1, 1.8)
    brightness = 1
  }

  // gamma from mean luminance: after the stretch, nudge mids toward 0.5
  const meanAfter = clamp(mean * k + m, 0.02, 0.98)
  let gamma = 1
  if (Math.abs(meanAfter - 0.5) > 0.04) {
    gamma = clamp(Math.log(0.5) / Math.log(meanAfter), 0.65, 1.55)
  }

  return {
    brightness: Math.round(brightness * 100),
    contrast: Math.round(contrast * 100),
    gamma: Math.round(gamma * 100) / 100,
  }
}
