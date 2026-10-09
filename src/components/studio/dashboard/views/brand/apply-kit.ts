"use client"

import type { DesignDoc, DesignElement, TextElement } from "@/lib/design/types"
import type { KitColor } from "./kit-types"

/** Studio default text styles an apply should touch (conservative — avoids butchering custom styling). */
export const DEFAULT_TEXT_FONT = "Inter"
export const DEFAULT_TEXT_COLORS = ["#111827", "#8b5cf6"] as const

export interface ApplyResult {
  doc: DesignDoc
  fontChanges: number
  colorChanges: number
}

/**
 * Apply a brand kit to a design doc:
 *  - text elements still using the Studio default font ("Inter") get the kit's primary font
 *  - text elements still using Studio default colors (#111827 / #8b5cf6) are recolored
 *    to the kit's first / second brand color
 * Custom fonts and custom colors are left untouched.
 */
export function applyKitToDoc(doc: DesignDoc, fonts: string[], colors: KitColor[]): ApplyResult {
  const kitFont = fonts[0]
  const map = new Map<string, string>()
  if (colors[0]) map.set(DEFAULT_TEXT_COLORS[0], colors[0].hex)
  if (colors[1]) map.set(DEFAULT_TEXT_COLORS[1], colors[1].hex)

  let fontChanges = 0
  let colorChanges = 0

  const transform = (el: DesignElement): DesignElement => {
    if (el.type !== "text") return el
    let next: TextElement = el
    if (kitFont && el.fontFamily === DEFAULT_TEXT_FONT && kitFont !== DEFAULT_TEXT_FONT) {
      next = { ...next, fontFamily: kitFont }
      fontChanges += 1
    }
    const replacement = map.get(el.color.toLowerCase())
    if (replacement && replacement.toLowerCase() !== el.color.toLowerCase()) {
      next = { ...next, color: replacement }
      colorChanges += 1
    }
    return next
  }

  const out: DesignDoc = {
    ...doc,
    pages: doc.pages.map((page) => ({ ...page, elements: page.elements.map(transform) })),
  }
  return { doc: out, fontChanges, colorChanges }
}
