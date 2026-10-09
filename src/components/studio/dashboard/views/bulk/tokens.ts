"use client"

/**
 * Token scanning + row application for bulk generation.
 * All functions are pure (no React) so they are safe inside useMemo.
 */

import type { DesignDoc, DesignElement } from "@/lib/design/types"
import { createImage } from "@/lib/design/types"
import type { BulkField, RowError } from "./bulk-types"

/** {{token}} — token allows letters, digits, underscore, dot, dash. */
export const TOKEN_RE = /\{\{\s*([\w.-]+)\s*\}\}/g

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Scan a doc for {{token}} fields across all text elements. */
export function scanFields(doc: DesignDoc): BulkField[] {
  const counts = new Map<string, number>()
  const entire = new Set<string>()
  for (const page of doc.pages) {
    for (const el of page.elements) {
      if (el.type !== "text") continue
      TOKEN_RE.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = TOKEN_RE.exec(el.text)) !== null) {
        const token = m[1]
        counts.set(token, (counts.get(token) ?? 0) + 1)
        if (el.text.trim() === m[0]) entire.add(token)
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([token, count]) => ({ token, count, entireValue: entire.has(token), isImage: false, column: null }))
}

/** Replace every {{token}} for mapped fields with the row value (uppercase-aware). */
export function applyRow(doc: DesignDoc, fields: BulkField[], row: Record<string, string>): DesignDoc {
  const clone: DesignDoc = JSON.parse(JSON.stringify(doc))
  const imageFields = fields.filter((f): f is BulkField & { column: string } => f.isImage && f.column !== null)

  for (const page of clone.pages) {
    const elements: DesignElement[] = []
    for (const el of page.elements) {
      if (el.type !== "text") {
        elements.push(el)
        continue
      }

      // image replacement: the token is the element's entire text and a value exists
      let replacedWithImage = false
      for (const f of imageFields) {
        const value = (row[f.column] ?? "").trim()
        const full = new RegExp(`^\\{\\{\\s*${escapeRe(f.token)}\\s*\\}\\}$`)
        if (value && full.test(el.text.trim())) {
          elements.push(
            createImage({
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              rotation: el.rotation,
              opacity: el.opacity,
              src: value,
            }),
          )
          replacedWithImage = true
          break
        }
      }
      if (replacedWithImage) continue

      let text = el.text
      let touched = false
      for (const f of fields) {
        if (!f.column) continue
        const value = row[f.column] ?? ""
        const re = new RegExp(`\\{\\{\\s*${escapeRe(f.token)}\\s*\\}\\}`, "g")
        if (re.test(text)) {
          touched = true
          text = text.replace(re, el.uppercase ? value.toUpperCase() : value)
        }
      }
      elements.push(touched ? { ...el, text } : el)
    }
    page.elements = elements
  }
  return clone
}

/* ---------------- demo data (guest story) ---------------- */

const DEMO_VALUES: Record<string, string[]> = {
  name: ["Ava Chen", "Liam Patel", "Sofia Reyes"],
  course: ["Advanced Watercolor", "Data Storytelling", "Public Speaking"],
  date: ["June 1, 2025", "June 8, 2025", "June 15, 2025"],
  event: ["Spring Showcase", "Open Studio Night", "Winter Gala"],
  location: ["Studio Academy", "Riverside Hall", "The Loft"],
}

/** Build 3 demo rows covering every detected field. */
export function demoRows(fields: BulkField[]): Record<string, string>[] {
  const columns = fields.map((f) => f.token)
  return [0, 1, 2].map((i) =>
    Object.fromEntries(
      columns.map((token) => {
        const preset = DEMO_VALUES[token.toLowerCase()]
        return [token, preset ? preset[i] : `Sample ${token} ${i + 1}`]
      }),
    ),
  )
}

/* ---------------- CSV row helpers ---------------- */

/** Normalized key for exact-duplicate detection (case/whitespace insensitive). */
export function rowKey(row: Record<string, string>): string {
  return JSON.stringify(
    Object.entries(row)
      .map(([k, v]) => [k.toLowerCase(), v.trim().toLowerCase()] as const)
      .sort((a, b) => a[0].localeCompare(b[0])),
  )
}

/** Indexes (0-based) of rows that exactly duplicate an earlier row. */
export function findDuplicates(rows: Record<string, string>[]): Set<number> {
  const seen = new Set<string>()
  const dups = new Set<number>()
  rows.forEach((row, i) => {
    const key = rowKey(row)
    if (seen.has(key)) dups.add(i)
    else seen.add(key)
  })
  return dups
}

/** Rows with at least one empty mapped value → { rowIndex0: missingColumns[] }. */
export function findMissing(rows: Record<string, string>[], fields: BulkField[]): Map<number, string[]> {
  const out = new Map<number, string[]>()
  rows.forEach((row, i) => {
    const missing = fields.filter((f) => f.column && !(row[f.column] ?? "").trim()).map((f) => f.column as string)
    if (missing.length > 0) out.set(i, missing)
  })
  return out
}

export function sanitizeFileBase(s: string): string {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return base || "design"
}

/** Yield to the browser so long batches keep the UI responsive. */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Canvas export failed (image may be too large)"))
    }, "image/png")
  })
}

export function describeErrors(errors: RowError[]): string {
  if (errors.length === 0) return ""
  return `${errors.length} row${errors.length === 1 ? "" : "s"} failed`
}
