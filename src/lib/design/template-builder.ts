/**
 * Template builder — compose DesignDocs programmatically (original CC0 content).
 * -----------------------------------------------------------------------
 * Pure helper layer on top of src/lib/design/types.ts factories:
 *  - `txt/rect/ellipse/shp/img/tbl/chart/qrEl/note` element shortcuts
 *  - `PALETTES` coherent 4-color palettes, `F` font family constants
 *  - layout helpers: centerX/centerY, vstack/hstack/grid, pill
 *  - `doc/page` doc composers
 *
 * The template library itself lives in ./templates/ (core + per-category modules),
 * aggregated as TPLS by ./templates/index.ts and consumed by prisma/seed.ts.
 *
 * Every template is a REAL editable DesignDoc: all text/shapes/tables/charts
 * are individual elements (never flattened images). Images only use data-URL
 * SVGs from src/lib/design/asset-library.ts or gradient/solid backgrounds.
 */

import {
  createChart,
  createImage,
  createPage,
  createQr,
  createShape,
  createSticky,
  createTable,
  createText,
  SCHEMA_VERSION,
  type BackgroundSpec,
  type ChartElement,
  type ChartSeries,
  type DesignDoc,
  type DesignElement,
  type DocType,
  type ImageElement,
  type PageModel,
  type QrElement,
  type ShapeElement,
  type ShapeVariant,
  type StickyElement,
  type TableElement,
  type TextElement,
} from "./types"
import { findAsset } from "./asset-library"

/** Re-export design-model types so template modules can `import type { ... } from "../template-builder"`. */
export type {
  BackgroundSpec,
  ChartElement,
  ChartSeries,
  DesignDoc,
  DesignElement,
  DocType,
  ImageElement,
  PageModel,
  QrElement,
  ShapeElement,
  ShapeVariant,
  StickyElement,
  TableElement,
  TextElement,
} from "./types"

/* ------------------------------ fonts & palettes ------------------------------ */

/** Font family constants (all bundled via fontsource, SIL OFL). */
export const F = {
  sans: "Inter",
  pop: "Poppins",
  serif: "Playfair Display",
  display: "Bebas Neue",
  cond: "Oswald",
  body: "Merriweather",
  script: "Dancing Script",
  hand: "Caveat",
  mono: "JetBrains Mono",
  marker: "Permanent Marker",
} as const

/** Coherent palette — bg surface + ink + primary + accent (max 4 colors). */
export interface Palette {
  bg: string
  ink: string
  primary: string
  accent: string
}

export const PALETTES = {
  violet: { bg: "#f5f3ff", ink: "#1f2937", primary: "#7c3aed", accent: "#fde68a" },
  berry: { bg: "#fdf2f8", ink: "#831843", primary: "#db2777", accent: "#f9a8d4" },
  sunset: { bg: "#fff7ed", ink: "#7c2d12", primary: "#f97316", accent: "#fde047" },
  forest: { bg: "#ecfdf5", ink: "#064e3b", primary: "#059669", accent: "#fbbf24" },
  coffee: { bg: "#fffbeb", ink: "#78350f", primary: "#b45309", accent: "#fcd34d" },
  cream: { bg: "#fdf8f1", ink: "#1f2937", primary: "#7c3aed", accent: "#f59e0b" },
  mono: { bg: "#f9fafb", ink: "#111827", primary: "#4b5563", accent: "#9ca3af" },
  night: { bg: "#111827", ink: "#f9fafb", primary: "#7c3aed", accent: "#fde047" },
  pop: { bg: "#fff7ed", ink: "#111827", primary: "#f97316", accent: "#22c55e" },
  teal: { bg: "#f0fdfa", ink: "#134e4a", primary: "#0d9488", accent: "#fbbf24" },
} as const satisfies Record<string, Palette>

/* ------------------------------ backgrounds ------------------------------ */

export function solid(color: string): BackgroundSpec {
  return { type: "solid", color }
}

export function gradient(from: string, to: string, angle = 160): BackgroundSpec {
  return { type: "gradient", gradient: { from, to, angle } }
}

/* ------------------------------ element shortcuts ------------------------------ */

export interface TxtOpts {
  x: number
  y: number
  w?: number
  h?: number
  size: number
  font?: string
  weight?: number
  color?: string
  align?: TextElement["align"]
  vAlign?: TextElement["vAlign"]
  lh?: number
  ls?: number
  italic?: boolean
  upper?: boolean
  opacity?: number
  rotation?: number
  bgColor?: string
}

export function txt(s: string, o: TxtOpts): TextElement {
  const lh = o.lh ?? 1.2
  const lines = s.split("\n").length
  return createText({
    text: s,
    x: o.x,
    y: o.y,
    width: o.w ?? 600,
    height: o.h ?? Math.ceil(lines * o.size * lh) + 6,
    fontFamily: o.font ?? F.sans,
    fontSize: o.size,
    fontWeight: o.weight ?? 700,
    color: o.color ?? "#111827",
    align: o.align ?? "left",
    vAlign: o.vAlign ?? "top",
    lineHeight: lh,
    letterSpacing: o.ls ?? 0,
    italic: o.italic ?? false,
    uppercase: o.upper ?? false,
    opacity: o.opacity ?? 1,
    rotation: o.rotation ?? 0,
    bgColor: o.bgColor,
  })
}

export interface BoxOpts {
  x: number
  y: number
  w: number
  h: number
  fill?: string
  r?: number
  stroke?: string
  sw?: number
  opacity?: number
  rotation?: number
  dash?: number[] | null
}

export function rect(o: BoxOpts): ShapeElement {
  return createShape({
    variant: "rect",
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
    fill: o.fill ?? "transparent",
    cornerRadius: o.r ?? 0,
    stroke: o.stroke ?? "transparent",
    strokeWidth: o.sw ?? 0,
    opacity: o.opacity ?? 1,
    rotation: o.rotation ?? 0,
    dash: o.dash ?? null,
  })
}

export function ellipse(o: BoxOpts): ShapeElement {
  return createShape({
    variant: "ellipse",
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
    fill: o.fill ?? "transparent",
    stroke: o.stroke ?? "transparent",
    strokeWidth: o.sw ?? 0,
    opacity: o.opacity ?? 1,
    rotation: o.rotation ?? 0,
    cornerRadius: 0,
  })
}

export function shp(variant: ShapeVariant, o: BoxOpts): ShapeElement {
  return createShape({
    variant,
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
    fill: o.fill ?? "transparent",
    stroke: o.stroke ?? "transparent",
    strokeWidth: o.sw ?? 0,
    opacity: o.opacity ?? 1,
    rotation: o.rotation ?? 0,
    cornerRadius: 0,
    dash: o.dash ?? null,
  })
}

export function img(src: string, o: { x: number; y: number; w: number; h: number; r?: number; opacity?: number; rotation?: number }): ImageElement {
  return createImage({
    src,
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
    cornerRadius: o.r ?? 0,
    opacity: o.opacity ?? 1,
    rotation: o.rotation ?? 0,
  })
}

/** Resolve an asset-library id to its data-URL svg. */
export function asset(id: string): string {
  return findAsset(id)?.svg ?? ""
}

export interface TblOpts {
  x: number
  y: number
  w: number
  h?: number
  fontSize?: number
  font?: string
  headerBg?: string
  headerColor?: string
  rowBg?: string
  altRowBg?: string
  borderColor?: string
  color?: string
}

export function tbl(rows: string[][], o: TblOpts): TableElement {
  return createTable({
    rows,
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h ?? rows.length * 76,
    fontFamily: o.font ?? F.sans,
    fontSize: o.fontSize ?? 28,
    headerBg: o.headerBg ?? "#7c3aed",
    headerColor: o.headerColor ?? "#ffffff",
    rowBg: o.rowBg ?? "#ffffff",
    altRowBg: o.altRowBg ?? "#f5f3ff",
    borderColor: o.borderColor ?? "#e5e7eb",
    color: o.color ?? "#111827",
  })
}

export function chart(
  kind: ChartElement["chartType"],
  labels: string[],
  series: ChartSeries[],
  o: { x: number; y: number; w: number; h: number; title?: string; legend?: boolean; grid?: boolean; fmt?: string },
): ChartElement {
  return createChart({
    chartType: kind,
    title: o.title,
    data: { labels, series },
    showLegend: o.legend ?? true,
    showGrid: o.grid ?? false,
    numberFormat: o.fmt,
    x: o.x,
    y: o.y,
    width: o.w,
    height: o.h,
  })
}

export function qrEl(data: string, o: { x: number; y: number; size: number; fg?: string; bg?: string }): QrElement {
  return createQr({
    data,
    x: o.x,
    y: o.y,
    width: o.size,
    height: o.size,
    fg: o.fg ?? "#111827",
    bg: o.bg ?? "#ffffff",
  })
}

export function note(text: string, o: { x: number; y: number; w?: number; h?: number; color?: string; font?: string; size?: number; rotation?: number }): StickyElement {
  return createSticky({
    text,
    x: o.x,
    y: o.y,
    width: o.w ?? 240,
    height: o.h ?? 240,
    color: o.color ?? "#fde68a",
    fontFamily: o.font ?? F.hand,
    fontSize: o.size ?? 30,
    rotation: o.rotation ?? 0,
  })
}

/* ------------------------------ layout helpers ------------------------------ */

/** x position to horizontally center a box of width w in a doc of width docW. */
export function centerX(docW: number, w: number): number {
  return Math.round((docW - w) / 2)
}

/** y position to vertically center a box of height h in a doc of height docH. */
export function centerY(docH: number, h: number): number {
  return Math.round((docH - h) / 2)
}

/** Position elements in a vertical stack starting at (x, y) with fixed gap. Mutates and returns the elements. */
export function vstack(x: number, y: number, gap: number, els: DesignElement[]): DesignElement[] {
  let cursor = y
  for (const el of els) {
    el.x = x
    el.y = cursor
    cursor += el.height + gap
  }
  return els
}

/** Position elements in a horizontal row starting at (x, y) with fixed gap. Mutates and returns the elements. */
export function hstack(x: number, y: number, gap: number, els: DesignElement[]): DesignElement[] {
  let cursor = x
  for (const el of els) {
    el.x = cursor
    el.y = y
    cursor += el.width + gap
  }
  return els
}

/** Position elements in a row-major grid (cols wide, fixed cell size + gaps). Mutates and returns the elements. */
export function grid(
  x: number,
  y: number,
  cols: number,
  cellW: number,
  cellH: number,
  gapX: number,
  gapY: number,
  els: DesignElement[],
): DesignElement[] {
  els.forEach((el, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    el.x = x + col * (cellW + gapX)
    el.y = y + row * (cellH + gapY)
  })
  return els
}

/** Rounded "pill" button/label — returns [background shape, centered label]. */
export function pill(
  label: string,
  o: { x: number; y: number; w: number; h?: number; fill?: string; color?: string; size?: number; font?: string; weight?: number },
): DesignElement[] {
  const h = o.h ?? Math.round((o.size ?? 36) * 2)
  return [
    rect({ x: o.x, y: o.y, w: o.w, h, fill: o.fill ?? "#7c3aed", r: h / 2 }),
    txt(label, {
      x: o.x,
      y: o.y,
      w: o.w,
      h,
      size: o.size ?? 36,
      font: o.font ?? F.sans,
      weight: o.weight ?? 600,
      color: o.color ?? "#ffffff",
      align: "center",
      vAlign: "middle",
    }),
  ]
}

/** Thin horizontal rule. */
export function rule(x: number, y: number, w: number, color: string, thickness = 6, dash?: number[]): ShapeElement {
  return rect({ x, y, w, h: thickness, fill: color, r: thickness / 2, dash })
}

/* ------------------------------ doc composers ------------------------------ */

export function page(name: string, background: string | BackgroundSpec, elements: DesignElement[]): PageModel {
  return createPage({
    name,
    background: typeof background === "string" ? solid(background) : background,
    elements,
  })
}

export function doc(type: DocType, width: number, height: number, background: string | BackgroundSpec, pages: PageModel[]): DesignDoc {
  const bg = typeof background === "string" ? solid(background) : background
  return {
    schemaVersion: SCHEMA_VERSION,
    type,
    width,
    height,
    background: bg,
    pages,
  }
}

export interface TemplateSpec {
  slug: string
  name: string
  category: string
  type: DocType
  tags: string[]
  width: number
  height: number
  featured?: boolean
  build: () => DesignDoc
}


export const V = "#7c3aed"
