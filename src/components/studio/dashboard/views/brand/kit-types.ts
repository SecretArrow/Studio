"use client"

/**
 * Brand kit shared types + JSON column parsing.
 * colorsJson supports two shapes: legacy `["#hex"]` (seeded kits) and
 * named `[{ name, hex }]` (kit editor output). Parsing normalizes both.
 */

export interface KitColor {
  name: string
  hex: string
}

export interface KitLogo {
  url: string
  name: string
}

export interface BrandKitRow {
  id: string
  name: string
  colorsJson: string
  fontsJson: string
  logosJson: string
  guidelines: string | null
  updatedAt?: string
}

export function parseColors(colorsJson: string): KitColor[] {
  try {
    const raw = JSON.parse(colorsJson) as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .map((c) => {
        if (typeof c === "string") return { name: "", hex: c }
        if (c && typeof c === "object" && typeof (c as KitColor).hex === "string") {
          return { name: typeof (c as KitColor).name === "string" ? (c as KitColor).name : "", hex: (c as KitColor).hex }
        }
        return null
      })
      .filter((c): c is KitColor => c !== null && /^#[0-9a-fA-F]{3,8}$/.test(c.hex))
  } catch {
    return []
  }
}

export function parseFonts(fontsJson: string): string[] {
  try {
    const raw = JSON.parse(fontsJson) as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((f): f is string => typeof f === "string")
  } catch {
    return []
  }
}

export function parseLogos(logosJson: string): KitLogo[] {
  try {
    const raw = JSON.parse(logosJson) as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .map((l) => {
        if (typeof l === "string") return { url: l, name: "logo" }
        if (l && typeof l === "object" && typeof (l as KitLogo).url === "string") {
          return { url: (l as KitLogo).url, name: typeof (l as KitLogo).name === "string" ? (l as KitLogo).name : "logo" }
        }
        return null
      })
      .filter((l): l is KitLogo => l !== null)
  } catch {
    return []
  }
}

/* ---------------- WCAG contrast helpers ---------------- */

export function luminance(hex: string): number {
  const m = hex.replace("#", "")
  const full = m.length === 3 ? m.split("").map((ch) => ch + ch).join("") : m
  const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  try {
    const l1 = luminance(a)
    const l2 = luminance(b)
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
    return (hi + 0.05) / (lo + 0.05)
  } catch {
    return 1
  }
}

/** WCAG grade for a ratio: AAA ≥ 7, AA ≥ 4.5, AA-large ≥ 3, else fail. */
export function wcagGrade(ratio: number): "AAA" | "AA" | "AA-L" | "FAIL" {
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return "AA"
  if (ratio >= 3) return "AA-L"
  return "FAIL"
}

/** Readable label color on top of a swatch. */
export function swatchTextColor(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= 3 ? "#ffffff" : "#111827"
}

export function normalizeHex(input: string): string | null {
  const v = input.trim()
  const m = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(v)
  if (!m) return null
  const raw = m[1]
  const full = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw
  return `#${full.toLowerCase()}`
}
