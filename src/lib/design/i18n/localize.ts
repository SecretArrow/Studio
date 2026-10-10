/**
 * Template-text localization transformer.
 * ----------------------------------------
 * Pure, dependency-free functions that localize the translatable strings of a
 * DesignDoc against a flat dictionary (original string → translated string,
 * as shipped in public/i18n/templates/{locale}.json).
 *
 * Rules:
 *  - Never mutates the input doc, its pages, or its shared element objects:
 *    replaced elements are shallow-copied, everything else is passed through
 *    by reference (safe, because nothing is ever written to).
 *  - Only "text" (el.text), "sticky" (el.text) and "table" (every cell in
 *    el.rows) elements are considered translatable.
 *  - Lookup key is the TRIMMED original string; identity entries
 *    (value === key) are ignored so untranslated/identity dictionaries never
 *    rewrite a doc.
 */

import type { DesignDoc, DesignElement } from "@/lib/design/types"

/** Returns the translated string for `raw`, or null when it must stay as-is. */
function lookup(dict: Record<string, string>, raw: string): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null
  const key = raw.trim()
  if (!key) return null
  const value = dict[key]
  // Only replace when a genuinely different translation exists (identity
  // placeholders — value equal to the key — are skipped).
  return typeof value === "string" && value.length > 0 && value !== key ? value : null
}

/**
 * Localize every translatable string in the doc. Returns a NEW doc; the input
 * is never mutated. When nothing translates, the returned doc is a shallow
 * clone that still shares the original (untouched) page/element objects.
 */
export function localizeDesignDoc(doc: DesignDoc, dict: Record<string, string>): DesignDoc {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.pages)) return doc
  let changed = false
  const pages = doc.pages.map((page) => {
    if (!page || !Array.isArray(page.elements)) return page
    let pageChanged = false
    const elements = page.elements.map((el: DesignElement): DesignElement => {
      if (!el || typeof el !== "object") return el
      if ((el.type === "text" || el.type === "sticky") && typeof el.text === "string") {
        const next = lookup(dict, el.text)
        if (next === null) return el
        pageChanged = true
        return { ...el, text: next }
      }
      if (el.type === "table" && Array.isArray(el.rows)) {
        let tableChanged = false
        const rows = el.rows.map((row) => {
          if (!Array.isArray(row)) return row
          const cells = row.map((cell) => {
            const next = lookup(dict, cell)
            if (next === null) return cell
            tableChanged = true
            return next
          })
          if (!tableChanged) return row
          return cells
        })
        if (!tableChanged) return el
        pageChanged = true
        return { ...el, rows }
      }
      return el
    })
    if (!pageChanged) return page
    changed = true
    return { ...page, elements }
  })
  if (!changed) return { ...doc, pages }
  return { ...doc, pages }
}

/**
 * Collect the doc's translatable strings (trimmed, unique, first-occurrence
 * order). Empty/whitespace-only strings are skipped — they can never be
 * translated.
 */
export function collectDocStrings(doc: DesignDoc): string[] {
  const seen = new Set<string>()
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.pages)) return []
  for (const page of doc.pages) {
    if (!page || !Array.isArray(page.elements)) continue
    for (const el of page.elements) {
      if (!el || typeof el !== "object") continue
      if ((el.type === "text" || el.type === "sticky") && typeof el.text === "string") {
        const key = el.text.trim()
        if (key) seen.add(key)
      } else if (el.type === "table" && Array.isArray(el.rows)) {
        for (const row of el.rows) {
          if (!Array.isArray(row)) continue
          for (const cell of row) {
            if (typeof cell !== "string") continue
            const key = cell.trim()
            if (key) seen.add(key)
          }
        }
      }
    }
  }
  return Array.from(seen)
}

/**
 * How many of the doc's strings have a DIFFERENT translation in the dict.
 * `total` = unique translatable strings in the doc, `covered` = those with a
 * genuinely different dictionary value.
 */
export function dictionaryCoverage(doc: DesignDoc, dict: Record<string, string>): { covered: number; total: number } {
  const strings = collectDocStrings(doc)
  let covered = 0
  for (const s of strings) {
    const value = dict[s]
    if (typeof value === "string" && value.length > 0 && value !== s) covered += 1
  }
  return { covered, total: strings.length }
}
