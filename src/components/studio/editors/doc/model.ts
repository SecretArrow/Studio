/**
 * Document editor model helpers: page margins, derived print elements
 * (header / footer / page numbers), block style presets, TOC builder and
 * the Word-compatible / clean HTML exporters.
 *
 * Blocks are absolutely-positioned text elements; "margins" define the
 * content area where blocks are placed (and re-flow when changed).
 * Page numbers + header/footer are *derived at render/export time* from
 * doc.meta — never stored as elements — so they stay in sync everywhere.
 */

import type { DesignDoc, DesignElement, PageModel, TableElement, TextElement } from "@/lib/design/types"
import { createText } from "@/lib/design/types"
import { renderPageToCanvas, filtersToCss } from "@/lib/editor/export"
import { measureTextBlockHeight } from "@/lib/editor/geometry"

/* ------------------------------ margins ------------------------------ */

export type MarginKind = "normal" | "narrow" | "wide"

export interface MarginSpec {
  x: number
  top: number
  bottom: number
  label: string
}

export const MARGIN_PRESETS: Record<MarginKind, MarginSpec> = {
  narrow: { x: 48, top: 48, bottom: 56, label: "Narrow" },
  normal: { x: 96, top: 96, bottom: 96, label: "Normal" },
  wide: { x: 144, top: 144, bottom: 144, label: "Wide" },
}

export interface DocMeta {
  margin: MarginKind
  pageNumbers: boolean
  header: string
  footer: string
}

export function getDocMeta(doc: DesignDoc): DocMeta {
  const m = (doc.meta ?? {}) as Record<string, unknown>
  const margin = m.margin === "narrow" || m.margin === "wide" ? m.margin : "normal"
  return {
    margin,
    pageNumbers: m.pageNumbers === true,
    header: typeof m.header === "string" ? m.header : "",
    footer: typeof m.footer === "string" ? m.footer : "",
  }
}

export function marginsOf(doc: DesignDoc): MarginSpec {
  return MARGIN_PRESETS[getDocMeta(doc).margin]
}

export function contentWidth(doc: DesignDoc): number {
  return Math.max(80, doc.width - marginsOf(doc).x * 2)
}

/* --------------------------- derived print elements --------------------------- */

/** Header / footer / page-number elements for one page (derived, not stored). */
export function printExtras(doc: DesignDoc, pageIndex: number, totalPages: number): DesignElement[] {
  const meta = getDocMeta(doc)
  const m = MARGIN_PRESETS[meta.margin]
  const W = doc.width
  const H = doc.height
  const out: DesignElement[] = []
  const base = {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: 400,
    italic: false,
    underline: false,
    strike: false,
    uppercase: false,
    lineHeight: 1.3,
    letterSpacing: 0,
    rotation: 0,
    opacity: 1,
  }
  if (meta.header.trim()) {
    out.push(
      createText({
        ...base,
        text: meta.header,
        name: "__print_header",
        x: m.x,
        y: Math.max(12, Math.round(m.top / 2) - 9),
        width: W - m.x * 2,
        height: 18,
        align: "center",
        color: "#6b7280",
      }),
    )
  }
  if (meta.footer.trim()) {
    out.push(
      createText({
        ...base,
        text: meta.footer,
        name: "__print_footer",
        x: m.x,
        y: H - Math.max(20, Math.round(m.bottom / 2) + 9),
        width: W - m.x * 2,
        height: 18,
        align: "left",
        color: "#6b7280",
      }),
    )
  }
  if (meta.pageNumbers) {
    out.push(
      createText({
        ...base,
        text: `${pageIndex + 1} / ${totalPages}`,
        name: "__print_pagenum",
        x: m.x,
        y: H - Math.max(20, Math.round(m.bottom / 2) + 9),
        width: W - m.x * 2,
        height: 18,
        align: "center",
        color: "#6b7280",
      }),
    )
  }
  return out
}

/** Doc with derived print elements baked in — used by preview + exports. */
export function buildPrintDoc(doc: DesignDoc): DesignDoc {
  return {
    ...doc,
    pages: doc.pages.map((page, i) => ({ ...page, elements: [...page.elements, ...printExtras(doc, i, doc.pages.length)] })),
  }
}

/* ------------------------------ block styles ------------------------------ */

export type TextStyleKind = "h1" | "h2" | "h3" | "body" | "quote"

export const TEXT_STYLES: Record<TextStyleKind, { label: string; fontSize: number; fontWeight: number; italic?: boolean; bgColor?: string; color: string; lineHeight: number }> = {
  h1: { label: "Heading 1", fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1.3 },
  h2: { label: "Heading 2", fontSize: 25, fontWeight: 700, color: "#1f2937", lineHeight: 1.35 },
  h3: { label: "Heading 3", fontSize: 19, fontWeight: 600, color: "#1f2937", lineHeight: 1.4 },
  body: { label: "Body text", fontSize: 16, fontWeight: 400, color: "#374151", lineHeight: 1.6 },
  quote: { label: "Quote", fontSize: 15, fontWeight: 400, italic: true, bgColor: "#f4f4f5", color: "#52525b", lineHeight: 1.6 },
}

export function classifyBlock(el: TextElement): TextStyleKind {
  if (el.bgColor && el.italic) return "quote"
  if (el.fontSize >= 30) return "h1"
  if (el.fontSize >= 23) return "h2"
  if (el.fontSize >= 18) return "h3"
  return "body"
}

/** Heading level for the TOC (matches the style presets). 0 = not a heading. */
export function headingLevel(el: DesignElement): 0 | 1 | 2 {
  if (el.type !== "text" || el.hidden) return 0
  const t = el as TextElement
  if (t.fontSize >= 30) return 1
  if (t.fontSize >= 23) return 2
  return 0
}

/* ------------------------------ TOC ------------------------------ */

export const TOC_NAME = "Table of contents"

export function isTocBlock(el: DesignElement | null | undefined): boolean {
  return !!el && el.type === "text" && el.name === TOC_NAME
}

/** Build TOC text: one line per H1/H2 with its (approximate) page number. */
export function buildTocText(doc: DesignDoc): string {
  const lines: string[] = []
  doc.pages.forEach((page, pi) => {
    for (const el of page.elements) {
      const level = headingLevel(el)
      if (level === 0) continue
      const t = el as TextElement
      const title = t.text.split("\n")[0].trim() || "Untitled"
      const indent = level === 2 ? "    " : ""
      lines.push(`${indent}${title}  —  p.${pi + 1}`)
    }
  })
  return lines.length > 0 ? lines.join("\n") : "No headings yet — add Heading 1 / Heading 2 blocks first."
}

/* ------------------------------ block placement ------------------------------ */

/** Y position for the next block: below the lowest element, inside margins. */
export function nextBlockY(page: PageModel, doc: DesignDoc): number {
  const m = marginsOf(doc)
  let bottom = m.top
  for (const el of page.elements) {
    if (el.name === TOC_NAME) continue
    bottom = Math.max(bottom, el.y + el.height)
  }
  return bottom === m.top ? m.top : bottom + 14
}

/** Measure the height a block needs with the current style. */
export function measureBlockHeight(el: TextElement): number {
  return Math.max(
    24,
    Math.round(
      measureTextBlockHeight(
        {
          text: el.text,
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          italic: el.italic,
          uppercase: el.uppercase,
          lineHeight: el.lineHeight,
          letterSpacing: el.letterSpacing,
          listStyle: el.listStyle,
        },
        el.width,
        2,
      ),
    ),
  )
}

export function createBlock(doc: DesignDoc, partial: Partial<TextElement> & { y: number; text: string }): TextElement {
  const W = contentWidth(doc)
  return createText({
    x: marginsOf(doc).x,
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: 400,
    italic: false,
    underline: false,
    strike: false,
    uppercase: false,
    align: "left",
    vAlign: "top",
    lineHeight: 1.6,
    letterSpacing: 0,
    color: "#374151",
    width: W,
    height: 24,
    name: "Paragraph",
    ...partial,
  })
}

/**
 * Re-flow block-level content into the new margins (text + tables follow the
 * content area; images / charts / QR stay where the user put them).
 */
export function reflowToMargins(doc: DesignDoc, margin: MarginKind): DesignDoc {
  const spec = MARGIN_PRESETS[margin]
  const W = Math.max(80, doc.width - spec.x * 2)
  return {
    ...doc,
    meta: { ...doc.meta, margin },
    pages: doc.pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
        if (el.type === "text") {
          const t = el as TextElement
          if (t.name === TOC_NAME || t.name === "Paragraph" || t.name?.startsWith("Heading") || t.name === "Quote") {
            return { ...t, x: spec.x, width: W }
          }
          // unknown/custom text: keep x, clamp width into the content area
          return { ...t, width: Math.min(t.width, W) }
        }
        if (el.type === "table") {
          return { ...(el as TableElement), x: spec.x, width: Math.min((el as TableElement).width, W) }
        }
        return el
      }),
    })),
  }
}

/* ------------------------------ HTML / Word export ------------------------------ */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Markdown-style links `[text](url)` → <a>; everything else escaped. */
function inlineHtml(text: string): string {
  const escaped = esc(text)
  return escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
}

function textToHtml(el: TextElement): string {
  const style = [
    `font-family:'${el.fontFamily}',sans-serif`,
    `font-size:${el.fontSize}px`,
    `font-weight:${el.fontWeight}`,
    el.italic ? "font-style:italic" : "",
    el.underline ? "text-decoration:underline" : "",
    `color:${el.color}`,
    el.bgColor ? `background:${el.bgColor}` : "",
    `line-height:${el.lineHeight}`,
    el.letterSpacing ? `letter-spacing:${el.letterSpacing}px` : "",
    `text-align:${el.align}`,
    "white-space:pre-wrap",
  ]
    .filter(Boolean)
    .join(";")
  const paragraphs = el.text.split("\n")
  let counter = 1
  const body = paragraphs
    .map((para) => {
      let prefix = ""
      if (el.listStyle === "bullet" && para.trim() !== "") prefix = "•  "
      else if (el.listStyle === "number" && para.trim() !== "") {
        prefix = `${counter}.  `
        counter += 1
      }
      const content = inlineHtml(prefix + para)
      return `<div>${content || "<br/>"}</div>`
    })
    .join("")
  return `<div style="${style}">${body}</div>`
}

function tableToHtml(el: TableElement): string {
  const rows = el.rows
    .map((row, ri) => {
      const isHeader = el.headerRow && ri === 0
      const cells = row
        .map(
          (cell) =>
            `<td style="border:1px solid ${el.borderColor};padding:6px 10px;background:${isHeader ? el.headerBg : ri % 2 === 1 ? el.altRowBg : el.rowBg};color:${isHeader ? el.headerColor : el.color};font-family:'${el.fontFamily}',sans-serif;font-size:${el.fontSize}px">${esc(cell ?? "")}</td>`,
        )
        .join("")
      return `<tr>${cells}</tr>`
    })
    .join("")
  return `<table style="border-collapse:collapse;width:${Math.round(el.width)}px;height:${Math.round(el.height)}px">${rows}</table>`
}

export interface HtmlBuildResult {
  html: string
  notes: string[]
}

/** Build the full HTML for a doc (async: charts/QR are rasterized). */
export async function buildDocHtml(doc: DesignDoc): Promise<HtmlBuildResult> {
  const print = buildPrintDoc(doc)
  const notes: string[] = []
  const pagesHtml: string[] = []

  for (let pi = 0; pi < print.pages.length; pi += 1) {
    const page = print.pages[pi]
    const bg = page.background.type === "solid" && page.background.color ? page.background.color : "#ffffff"
    const parts: string[] = []
    for (const el of page.elements) {
      if (el.hidden) continue
      const pos = `position:absolute;left:${Math.round(el.x)}px;top:${Math.round(el.y)}px;width:${Math.round(el.width)}px;`
      switch (el.type) {
        case "text":
          parts.push(`<div style="${pos}height:auto;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ""}">${textToHtml(el as TextElement)}</div>`)
          break
        case "table":
          parts.push(`<div style="${pos}height:${Math.round(el.height)}px;">${tableToHtml(el as TableElement)}</div>`)
          break
        case "image": {
          const img = el as import("@/lib/design/types").ImageElement
          parts.push(
            `<img src="${esc(img.src)}" style="${pos}height:${Math.round(el.height)}px;object-fit:fill;border-radius:${img.cornerRadius}px;${filtersToCss(img) !== "none" ? `filter:${filtersToCss(img)};` : ""}" alt=""/>`,
          )
          break
        }
        case "shape": {
          const s = el as import("@/lib/design/types").ShapeElement
          if (s.variant === "line") {
            parts.push(`<div style="${pos}height:0;border-top:${Math.max(1, s.strokeWidth || 2)}px solid ${s.fill === "transparent" ? s.stroke : s.fill}"></div>`)
          } else {
            parts.push(`<div style="${pos}height:${Math.round(el.height)}px;background:${s.fill};border-radius:${s.cornerRadius}px;"></div>`)
          }
          break
        }
        default: {
          try {
            const tmp: DesignDoc = { ...doc, pages: [{ ...page, background: { type: "transparent" }, elements: [el] }] }
            const canvas = await renderPageToCanvas(tmp, tmp.pages[0], { transparent: true, scale: 2 })
            parts.push(`<img src="${canvas.toDataURL("image/png")}" style="${pos}height:${Math.round(el.height)}px" alt=""/>`)
          } catch {
            notes.push(`Element "${el.name || el.id}" could not be rendered for HTML export.`)
          }
        }
      }
    }
    pagesHtml.push(
      `<div style="position:relative;width:${doc.width}px;height:${doc.height}px;background:${bg};overflow:hidden;margin:0 auto 24px auto;page-break-after:always;box-shadow:0 1px 6px rgba(0,0,0,.15)">${parts.join("\n")}</div>`,
    )
  }

  const title = typeof doc.meta?.name === "string" ? doc.meta.name : "Document"
  const html = [
    "<!DOCTYPE html>",
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
    "<head>",
    '<meta charset="utf-8"/>',
    `<title>${esc(title)}</title>`,
    "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->",
    `<style>@page{size:${doc.width}px ${doc.height}px;margin:0} body{margin:0;background:#f1f1f1}</style>`,
    "</head>",
    "<body>",
    ...pagesHtml,
    "</body>",
    "</html>",
  ].join("\n")

  return { html, notes }
}
