/**
 * Template builder — compose DesignDocs programmatically (original CC0 content).
 * -----------------------------------------------------------------------
 * Pure helper layer on top of src/lib/design/types.ts factories:
 *  - `txt/rect/ellipse/shp/img/tbl/chart/qrEl/note` element shortcuts
 *  - `PALETTES` coherent 4-color palettes, `F` font family constants
 *  - layout helpers: centerX/centerY, vstack/hstack/grid, pill
 *  - `doc/page` doc composers
 *  - `TPLS` — the full original template library consumed by prisma/seed.ts.
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

/* ------------------------------ template library ------------------------------ */

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

const V = "#7c3aed"

export const TPLS: TemplateSpec[] = [
  /* ============================== SOCIAL POSTS ============================== */
  {
    slug: "neon-sale-post",
    name: "Neon Sale — Instagram Post",
    category: "social",
    type: "canvas",
    tags: ["sale", "instagram", "promo", "square"],
    width: 1080,
    height: 1080,
    featured: true,
    build: () =>
      doc("canvas", 1080, 1080, "#111827", [
        page("Post", solid("#111827"), [
          rect({ x: 80, y: 80, w: 920, h: 920, fill: V, r: 48 }),
          txt("MEGA\nSALE", { x: 150, y: 280, w: 800, h: 490, size: 250, font: F.display, weight: 400, color: "#ffffff", lh: 0.95, ls: 4 }),
          txt("UP TO 70% OFF EVERYTHING", { x: 156, y: 800, w: 780, h: 60, size: 44, font: F.pop, weight: 600, color: "#fde68a" }),
          txt("This weekend only · Code STUDIO70", { x: 158, y: 878, w: 780, h: 44, size: 30, weight: 400, color: "#c4b5fd" }),
          ellipse({ x: 720, y: 150, w: 190, h: 190, fill: "#f59e0b" }),
          txt("-70%", { x: 720, y: 215, w: 190, h: 80, size: 60, font: F.display, weight: 400, color: "#111827", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "quote-minimal-post",
    name: "Minimal Quote — Instagram Post",
    category: "social",
    type: "canvas",
    tags: ["quote", "instagram", "minimal", "square"],
    width: 1080,
    height: 1080,
    build: () =>
      doc("canvas", 1080, 1080, "#fdf8f1", [
        page("Post", solid("#fdf8f1"), [
          rule(120, 310, 140, "#db2777"),
          txt("“Make it simple.\nThen make it\nbeautiful.”", { x: 118, y: 370, w: 830, h: 340, size: 92, font: F.serif, weight: 700, color: "#1f2937", lh: 1.15 }),
          txt("— design proverb", { x: 122, y: 760, w: 700, h: 70, size: 52, font: F.script, weight: 400, color: "#7c3aed" }),
          txt("STUDIO · DAILY INSPIRATION", { x: 122, y: 930, w: 700, h: 36, size: 24, weight: 600, color: "#9ca3af", ls: 4, upper: true }),
          shp("star", { x: 850, y: 140, w: 90, h: 90, fill: "#f59e0b", rotation: 15 }),
        ]),
      ]),
  },
  {
    slug: "tips-carousel-3",
    name: "5 Design Tips — Carousel (3 slides)",
    category: "social",
    type: "canvas",
    tags: ["carousel", "tips", "instagram", "education"],
    width: 1080,
    height: 1080,
    featured: true,
    build: () => {
      const tips = [
        "Hook readers in the first line",
        "One idea per post — no more",
        "High contrast type always wins",
        "Leave breathing room around text",
        "End every post with a question",
      ]
      const numbered: DesignElement[] = []
      tips.forEach((s, i) => {
        const badge = shp("badge", { x: 130, y: 360 + i * 118, w: 64, h: 64, fill: i % 2 ? "#fde68a" : "#7c3aed" })
        numbered.push(
          badge,
          txt(`${i + 1}`, { x: badge.x, y: badge.y, w: badge.width, h: badge.height, size: 32, font: F.display, weight: 400, color: i % 2 ? "#111827" : "#ffffff", align: "center", vAlign: "middle" }),
          txt(s, { x: 230, y: badge.y, w: 620, h: badge.height, size: 38, weight: 500, color: "#1f2937", vAlign: "middle" }),
        )
      })
      return doc("canvas", 1080, 1080, "#faf5ff", [
        page("Cover", solid("#faf5ff"), [
          ellipse({ x: 720, y: -120, w: 520, h: 520, fill: "#ddd6fe", opacity: 0.6 }),
          txt("5 DESIGN\nTIPS", { x: 110, y: 300, w: 860, h: 400, size: 170, font: F.display, weight: 400, color: "#1f2937", lh: 0.95 }),
          txt("for scroll-stopping posts", { x: 116, y: 720, w: 760, h: 70, size: 54, font: F.serif, weight: 400, italic: true, color: "#7c3aed" }),
          ...pill("SWIPE  →", { x: 116, y: 860, w: 300, h: 84, fill: "#1f2937", size: 34, color: "#ffffff" }),
          txt("1 / 3", { x: 900, y: 980, w: 120, h: 40, size: 26, font: F.mono, weight: 400, color: "#9ca3af", align: "right" }),
        ]),
        page("The tips", solid("#faf5ff"), [
          txt("THE 5 TIPS", { x: 130, y: 200, w: 700, h: 90, size: 80, font: F.cond, weight: 600, color: "#7c3aed", ls: 2, upper: true }),
          rule(134, 306, 120, "#fde68a", 8),
          ...numbered,
          txt("2 / 3", { x: 900, y: 980, w: 120, h: 40, size: 26, font: F.mono, weight: 400, color: "#9ca3af", align: "right" }),
        ]),
        page("CTA", solid("#7c3aed"), [
          ellipse({ x: -140, y: 700, w: 480, h: 480, fill: "#6d28d9" }),
          txt("SAVE THIS\nFOR LATER", { x: 0, y: 360, w: 1080, h: 340, size: 150, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1 }),
          txt("follow @yourstudio for weekly tips", { x: 0, y: 740, w: 1080, h: 70, size: 46, font: F.script, weight: 400, color: "#fde68a", align: "center" }),
          txt("3 / 3", { x: 900, y: 980, w: 120, h: 40, size: 26, font: F.mono, weight: 400, color: "#ddd6fe", align: "right" }),
        ]),
      ])
    },
  },
  {
    slug: "event-announce-post",
    name: "Jazz Night — Event Announcement",
    category: "social",
    type: "canvas",
    tags: ["event", "music", "announcement", "square"],
    width: 1080,
    height: 1080,
    build: () =>
      doc("canvas", 1080, 1080, "#7c2d12", [
        page("Post", solid("#7c2d12"), [
          rect({ x: 70, y: 70, w: 940, h: 940, fill: "transparent", stroke: "#fde047", sw: 6, r: 24 }),
          shp("star", { x: 120, y: 130, w: 80, h: 80, fill: "#f97316", rotation: 12 }),
          shp("star", { x: 880, y: 860, w: 100, h: 100, fill: "#f97316", rotation: -18 }),
          txt("SUMMER\nJAZZ NIGHT", { x: 0, y: 240, w: 1080, h: 300, size: 140, font: F.cond, weight: 600, color: "#fff7ed", align: "center", lh: 1.05, upper: true, ls: 2 }),
          ...pill("FRI · JUL 24 · 8 PM", { x: 290, y: 600, w: 500, h: 92, fill: "#f97316", size: 36, color: "#fff7ed" }),
          txt("Open-air stage · Riverside Park", { x: 0, y: 740, w: 1080, h: 50, size: 34, weight: 400, color: "#fde047", align: "center" }),
          txt("Tickets at the gate · families welcome", { x: 0, y: 810, w: 1080, h: 44, size: 26, weight: 400, color: "#ffedd5", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "motivational-post",
    name: "Do The Thing — Motivational Post",
    category: "social",
    type: "canvas",
    tags: ["motivation", "quote", "gradient", "square"],
    width: 1080,
    height: 1080,
    build: () =>
      doc("canvas", 1080, 1080, gradient("#7c3aed", "#db2777", 165), [
        page("Post", gradient("#7c3aed", "#db2777", 165), [
          ellipse({ x: 640, y: 640, w: 640, h: 640, fill: "#ffffff", opacity: 0.08 }),
          ellipse({ x: -160, y: -160, w: 460, h: 460, fill: "#ffffff", opacity: 0.08 }),
          txt("DO THE\nTHING.", { x: 100, y: 340, w: 880, h: 420, size: 190, font: F.marker, weight: 400, color: "#ffffff", lh: 1.05, rotation: -2 }),
          txt("— your future self", { x: 108, y: 800, w: 700, h: 60, size: 44, font: F.hand, weight: 400, color: "#fde68a" }),
          shp("star", { x: 830, y: 170, w: 90, h: 90, fill: "#fde047", rotation: 18 }),
        ]),
      ]),
  },
  {
    slug: "x-header",
    name: "Bold Marker — X (Twitter) Header",
    category: "social",
    type: "canvas",
    tags: ["twitter", "x", "header", "banner"],
    width: 1500,
    height: 500,
    build: () =>
      doc("canvas", 1500, 500, "#0f172a", [
        page("Header", solid("#0f172a"), [
          ellipse({ x: 1130, y: -140, w: 460, h: 460, fill: "#1e293b" }),
          shp("star", { x: 1330, y: 300, w: 70, h: 70, fill: "#fde047", rotation: 14 }),
          txt("designing in the open ✏️", { x: 90, y: 150, w: 1100, h: 120, size: 88, font: F.marker, weight: 400, color: "#ffffff" }),
          txt("@yourhandle · new work every friday · links below", { x: 94, y: 300, w: 1000, h: 44, size: 30, font: F.mono, weight: 400, color: "#94a3b8" }),
        ]),
      ]),
  },
  {
    slug: "pinterest-pin",
    name: "Morning Routine — Pinterest Pin",
    category: "social",
    type: "canvas",
    tags: ["pinterest", "routine", "listicle"],
    width: 1000,
    height: 1500,
    build: () => {
      const items = ["Stretch for five minutes", "Drink a full glass of water", "Write tomorrow's top task", "Ten deep breaths, no phone"].map((s, i) =>
        txt(`${i + 1}  ·  ${s}`, { x: 0, y: 0, w: 760, h: 56, size: 34, font: F.body, weight: 500, color: "#7c2d12" }),
      )
      return doc("canvas", 1000, 1500, "#fff7ed", [
        page("Pin", solid("#fff7ed"), [
          ellipse({ x: 620, y: -150, w: 330, h: 330, fill: "#fde047" }),
          shp("star", { x: 140, y: 90, w: 70, h: 70, fill: "#f97316", rotation: 12 }),
          txt("THE 10-MINUTE\nMORNING\nROUTINE", { x: 120, y: 300, w: 780, h: 380, size: 104, font: F.serif, weight: 700, color: "#7c2d12", lh: 1.12 }),
          rule(124, 730, 110, "#f97316"),
          ...vstack(120, 790, 34, items),
          ...pill("SAVE FOR LATER", { x: 120, y: 1280, w: 420, h: 88, fill: "#7c2d12", size: 32, color: "#ffedd5" }),
        ]),
      ])
    },
  },
  {
    slug: "podcast-cover",
    name: "Talk & Tea — Podcast Cover",
    category: "marketing",
    type: "canvas",
    tags: ["podcast", "cover", "audio", "square"],
    width: 1400,
    height: 1400,
    build: () =>
      doc("canvas", 1400, 1400, gradient("#7c2d12", "#f97316", 150), [
        page("Cover", gradient("#7c2d12", "#f97316", 150), [
          ellipse({ x: 880, y: 880, w: 700, h: 700, fill: "#fde047", opacity: 0.18 }),
          txt("TALK\n& TEA", { x: 120, y: 330, w: 1160, h: 620, size: 320, font: F.display, weight: 400, color: "#fff7ed", lh: 0.95 }),
          txt("weekly conversations over a warm cup", { x: 126, y: 990, w: 1000, h: 60, size: 44, weight: 400, color: "#ffedd5" }),
          txt("EP.001 — ON AIR · EVERY TUESDAY", { x: 126, y: 1120, w: 1000, h: 44, size: 28, font: F.mono, weight: 400, color: "#fde047", ls: 2 }),
        ]),
      ]),
  },
  {
    slug: "wallpaper-dream",
    name: "Dream Bigger — Phone Wallpaper",
    category: "photo",
    type: "canvas",
    tags: ["wallpaper", "phone", "gradient", "quote"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, gradient("#db2777", "#7c3aed", 170), [
        page("Wallpaper", gradient("#db2777", "#7c3aed", 170), [
          shp("star", { x: 160, y: 320, w: 60, h: 60, fill: "#ffffff", opacity: 0.5 }),
          shp("star", { x: 840, y: 480, w: 40, h: 40, fill: "#ffffff", opacity: 0.4, rotation: 20 }),
          shp("star", { x: 240, y: 1480, w: 44, h: 44, fill: "#ffffff", opacity: 0.4, rotation: -12 }),
          txt("dream\nbigger", { x: 0, y: 780, w: 1080, h: 380, size: 170, font: F.script, weight: 700, color: "#ffffff", align: "center", lh: 1.05 }),
          txt("— studio wallpapers · free forever", { x: 0, y: 1740, w: 1080, h: 40, size: 26, font: F.mono, weight: 400, color: "#ffffff", align: "center", opacity: 0.7 }),
        ]),
      ]),
  },

  /* ============================== STORIES ============================== */
  {
    slug: "fashion-story",
    name: "New Season Edit — Fashion Story",
    category: "story",
    type: "canvas",
    tags: ["story", "fashion", "sale", "elegant"],
    width: 1080,
    height: 1920,
    featured: true,
    build: () =>
      doc("canvas", 1080, 1920, "#fdf2f8", [
        page("Story", solid("#fdf2f8"), [
          img(asset("blob-1"), { x: 90, y: 480, w: 900, h: 900, opacity: 0.16, rotation: 40 }),
          txt("NEW COLLECTION", { x: 120, y: 260, w: 840, h: 44, size: 32, weight: 600, color: "#db2777", ls: 8, upper: true }),
          txt("AUTUMN\nEDIT ’26", { x: 110, y: 360, w: 860, h: 340, size: 130, font: F.serif, weight: 700, color: "#831843", lh: 1.1 }),
          txt("up to 50% off — this week only", { x: 116, y: 1120, w: 840, h: 80, size: 60, font: F.script, weight: 400, color: "#db2777" }),
          ...pill("SHOP THE EDIT", { x: 116, y: 1300, w: 460, h: 96, fill: "#831843", size: 34, color: "#fdf2f8" }),
          txt("Free shipping on orders over $50", { x: 120, y: 1660, w: 840, h: 40, size: 28, weight: 400, color: "#9d174d", opacity: 0.8 }),
          shp("star", { x: 820, y: 300, w: 80, h: 80, fill: "#f9a8d4", rotation: 16 }),
        ]),
      ]),
  },
  {
    slug: "food-story",
    name: "Taco Tuesday — Food Story",
    category: "story",
    type: "canvas",
    tags: ["story", "food", "restaurant", "promo"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, "#fffbeb", [
        page("Story", solid("#fffbeb"), [
          img(asset("ring"), { x: 620, y: 1180, w: 380, h: 380, opacity: 0.35 }),
          txt("EVERY TUESDAY", { x: 120, y: 300, w: 840, h: 44, size: 32, weight: 600, color: "#b45309", ls: 6, upper: true }),
          txt("TACO\nTUESDAY", { x: 110, y: 400, w: 860, h: 400, size: 190, font: F.display, weight: 400, color: "#78350f", lh: 0.95 }),
          txt("three fillings · handmade tortillas · live music", { x: 116, y: 850, w: 800, h: 110, size: 36, weight: 400, color: "#78350f", lh: 1.4 }),
          ellipse({ x: 120, y: 1060, w: 240, h: 240, fill: "#b45309" }),
          txt("$5", { x: 120, y: 1120, w: 240, h: 120, size: 96, font: F.display, weight: 400, color: "#fcd34d", align: "center" }),
          txt("PER PLATE", { x: 400, y: 1140, w: 300, h: 44, size: 30, weight: 600, color: "#78350f", vAlign: "middle" }),
          txt("Casa Verde Kitchen · 12–9 PM\n12 Riverside Walk", { x: 120, y: 1500, w: 840, h: 110, size: 30, weight: 400, color: "#78350f", align: "center", lh: 1.5 }),
          txt("· · · · · · · · · · · · · · · · · · · ·", { x: 120, y: 1440, w: 840, h: 40, size: 28, color: "#fcd34d", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "workout-story",
    name: "30-Day Challenge — Workout Story",
    category: "story",
    type: "canvas",
    tags: ["story", "fitness", "challenge", "bold"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, "#111827", [
        page("Story", solid("#111827"), [
          rect({ x: 90, y: 90, w: 900, h: 1740, fill: "#1f2937", r: 48 }),
          shp("star", { x: 780, y: 180, w: 110, h: 110, fill: "#22c55e", rotation: 18 }),
          txt("30-DAY\nCHALLENGE", { x: 150, y: 380, w: 800, h: 380, size: 150, font: F.cond, weight: 600, color: "#ffffff", lh: 1.05, upper: true }),
          txt("NO EQUIPMENT · 20 MIN A DAY", { x: 154, y: 820, w: 780, h: 46, size: 34, font: F.mono, weight: 400, color: "#22c55e", ls: 2 }),
          ...vstack(
            154,
            960,
            30,
            ["Week 1 — full body basics", "Week 2 — core & cardio", "Week 3 — strength build", "Week 4 — peak week"].map((s) =>
              txt(s, { x: 154, y: 0, w: 700, h: 56, size: 32, weight: 500, color: "#e5e7eb", vAlign: "middle" }),
            ),
          ),
          ...pill("START TODAY", { x: 154, y: 1560, w: 420, h: 96, fill: "#22c55e", size: 36, color: "#111827" }),
        ]),
      ]),
  },
  {
    slug: "minimal-quote-story",
    name: "Minimal Quote — Story",
    category: "story",
    type: "canvas",
    tags: ["story", "quote", "minimal"],
    width: 1080,
    height: 1920,
    featured: true,
    build: () =>
      doc("canvas", 1080, 1920, "#fdf8f1", [
        page("Story", solid("#fdf8f1"), [
          rule(124, 560, 160, V, 10),
          txt("“Design is\nthinking made\nvisual.”", { x: 120, y: 640, w: 840, h: 480, size: 110, font: F.serif, weight: 700, color: "#1f2937", align: "left", lh: 1.15 }),
          txt("— ALFRED NORTH WHITEHEAD", { x: 124, y: 1180, w: 840, h: 50, size: 32, weight: 600, color: V, align: "left", lh: 1.4, ls: 6, upper: true }),
          txt("save this reminder for later", { x: 124, y: 1700, w: 840, h: 44, size: 30, font: F.hand, weight: 400, color: "#9ca3af" }),
        ]),
      ]),
  },
  {
    slug: "story-flash-sale",
    name: "48 Hours Only — Flash Sale Story",
    category: "story",
    type: "canvas",
    tags: ["story", "sale", "flash", "bold"],
    width: 1080,
    height: 1920,
    build: () =>
      doc("canvas", 1080, 1920, "#111827", [
        page("Story", solid("#111827"), [
          ellipse({ x: 40, y: 520, w: 1000, h: 1000, fill: "#ec4899", opacity: 0.9 }),
          ellipse({ x: 340, y: 820, w: 400, h: 400, fill: "#fde047", opacity: 0.9 }),
          txt("48 HRS\nONLY", { x: 0, y: 700, w: 1080, h: 460, size: 210, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 0.95 }),
          ...pill("CODE: FLASH48", { x: 290, y: 1220, w: 500, h: 92, fill: "#111827", size: 34, color: "#fde047" }),
          txt("ends friday midnight — everything must go", { x: 0, y: 1380, w: 1080, h: 46, size: 30, weight: 400, color: "#111827", align: "center" }),
        ]),
      ]),
  },

  /* ============================== YOUTUBE ============================== */
  {
    slug: "bold-yt-thumbnail",
    name: "Bold Tutorial — YouTube Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "tutorial"],
    width: 1280,
    height: 720,
    featured: true,
    build: () =>
      doc("canvas", 1280, 720, "#0f172a", [
        page("Thumbnail", solid("#0f172a"), [
          ellipse({ x: 820, y: 120, w: 380, h: 380, fill: V }),
          txt("DESIGN\nFASTER ⚡", { x: 64, y: 140, w: 700, h: 300, size: 150, font: F.display, weight: 400, color: "#ffffff", align: "left", lh: 1 }),
          txt("5 STUDIO WORKFLOWS", { x: 70, y: 470, w: 640, h: 60, size: 42, font: F.pop, weight: 700, color: "#f59e0b", align: "left", lh: 1.2 }),
          txt("2026", { x: 900, y: 270, w: 220, h: 80, size: 90, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1 }),
        ]),
      ]),
  },
  {
    slug: "yt-thumbnail-gaming",
    name: "Boss Fight — Gaming Thumbnail",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "thumbnail", "gaming"],
    width: 1280,
    height: 720,
    build: () =>
      doc("canvas", 1280, 720, "#1f2937", [
        page("Thumbnail", solid("#1f2937"), [
          shp("triangle", { x: 760, y: 80, w: 460, h: 560, fill: "#ef4444", rotation: 14, opacity: 0.9 }),
          shp("star", { x: 1080, y: 90, w: 90, h: 90, fill: "#fde047", rotation: 18 }),
          txt("BOSS FIGHT\nSPEEDRUN", { x: 60, y: 140, w: 740, h: 300, size: 130, font: F.display, weight: 400, color: "#fde047", lh: 0.98 }),
          txt("NEW PERSONAL BEST?", { x: 66, y: 480, w: 700, h: 60, size: 44, font: F.pop, weight: 700, color: "#ffffff" }),
          ...pill("EP. 12", { x: 66, y: 580, w: 190, h: 70, fill: "#ef4444", size: 30, color: "#ffffff" }),
        ]),
      ]),
  },
  {
    slug: "yt-banner-channel",
    name: "Design Weekly — YouTube Banner",
    category: "youtube",
    type: "canvas",
    tags: ["youtube", "banner", "channel", "art"],
    width: 2560,
    height: 1440,
    build: () =>
      doc("canvas", 2560, 1440, gradient("#1f2937", "#7c3aed", 120), [
        page("Banner", gradient("#1f2937", "#7c3aed", 120), [
          img(asset("blob-1"), { x: 190, y: 220, w: 520, h: 520, opacity: 0.2, rotation: 30 }),
          img(asset("blob-2"), { x: 2020, y: 760, w: 560, h: 560, opacity: 0.2, rotation: -20 }),
          txt("DESIGN WEEKLY", { x: 0, y: 560, w: 2560, h: 200, size: 170, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 6 }),
          txt("New tutorials every tuesday — subscribe for free design lessons", { x: 0, y: 800, w: 2560, h: 60, size: 44, weight: 400, color: "#fde047", align: "center" }),
          txt("youtube.com/@designweekly", { x: 0, y: 900, w: 2560, h: 44, size: 30, font: F.mono, weight: 400, color: "#e5e7eb", align: "center" }),
        ]),
      ]),
  },

  /* ============================== PRESENTATIONS ============================== */
  {
    slug: "pitch-deck-5",
    name: "Seed Pitch Deck — 5 Slides",
    category: "presentation",
    type: "presentation",
    tags: ["pitch", "startup", "presentation", "deck"],
    width: 1920,
    height: 1080,
    featured: true,
    build: () =>
      doc("presentation", 1920, 1080, "#111827", [
        page(
          "Cover",
          solid("#111827"),
          [
            rect({ x: 120, y: 120, w: 1680, h: 840, fill: "#1f2937", r: 32 }),
            txt("STUDIO", { x: 220, y: 380, w: 800, h: 180, size: 170, font: F.display, weight: 400, color: "#ffffff", align: "left", lh: 1, ls: 8 }),
            txt("Free all-in-one visual design platform", { x: 226, y: 590, w: 900, h: 60, size: 44, weight: 400, color: "#c4b5fd", align: "left", lh: 1.3 }),
            ellipse({ x: 1350, y: 300, w: 330, h: 330, fill: V }),
            txt("Seed\nRound", { x: 1350, y: 395, w: 330, h: 140, size: 48, font: F.pop, weight: 700, color: "#ffffff", align: "center", lh: 1.2 }),
            txt("2026", { x: 226, y: 800, w: 300, h: 50, size: 30, weight: 400, color: "#6b7280", align: "left", lh: 1.3 }),
          ],
        ),
        page(
          "Agenda",
          solid("#f9fafb"),
          [
            txt("TODAY'S AGENDA", { x: 140, y: 130, w: 900, h: 100, size: 84, font: F.cond, weight: 600, color: "#111827", upper: true, ls: 2 }),
            rule(146, 250, 130, V, 10),
            ...vstack(
              146,
              330,
              44,
              ["The problem", "Market size", "Product demo", "Roadmap & ask"].map((s, i) =>
                txt(`0${i + 1}   ${s}`, { x: 146, y: 0, w: 800, h: 70, size: 46, weight: 600, color: i === 0 ? V : "#374151", vAlign: "middle" }),
              ),
            ),
            ellipse({ x: 1380, y: 560, w: 380, h: 380, fill: "#ede9fe" }),
            txt("“Make design\neffortless.”", { x: 1380, y: 680, w: 380, h: 140, size: 36, font: F.serif, weight: 400, italic: true, color: V, align: "center" }),
          ],
        ),
        page(
          "Market",
          solid("#f9fafb"),
          [
            txt("MARKET", { x: 140, y: 130, w: 900, h: 100, size: 84, font: F.cond, weight: 600, color: "#111827", upper: true, ls: 2 }),
            rule(146, 250, 130, V, 10),
            txt("Online design tool revenue, $B", { x: 150, y: 300, w: 900, h: 50, size: 34, weight: 400, color: "#6b7280" }),
            chart("column", ["2023", "2024", "2025", "2026"], [{ name: "Market", color: "#7c3aed", values: [12, 18, 27, 41] }, { name: "Our target", color: "#f59e0b", values: [2, 4, 8, 15] }], {
              x: 140,
              y: 380,
              w: 1000,
              h: 560,
              legend: true,
              grid: true,
            }),
            txt("$41B by 2026\n+38% CAGR", { x: 1260, y: 420, w: 480, h: 200, size: 64, font: F.pop, weight: 700, color: V, lh: 1.25 }),
            txt("Templates and stock assets are the #1\nacquisition channel in this category.", { x: 1260, y: 660, w: 500, h: 140, size: 30, weight: 400, color: "#374151", lh: 1.5 }),
          ],
        ),
        page(
          "Product",
          solid("#f9fafb"),
          [
            txt("PRODUCT", { x: 140, y: 130, w: 900, h: 100, size: 84, font: F.cond, weight: 600, color: "#111827", upper: true, ls: 2 }),
            rule(146, 250, 130, V, 10),
            img(asset("blob-2"), { x: 1320, y: 330, w: 460, h: 460, opacity: 0.9 }),
            ...["One canvas\nfor every format", "Real-time team\nwhiteboards", "Free exports\nno watermarks"].flatMap((s, i) => {
              const x = 140 + i * 560
              return [
                rect({ x, y: 380, w: 520, h: 300, fill: "#ffffff", r: 24, stroke: "#e5e7eb", sw: 2 }),
                txt(s, { x: x + 44, y: 450, w: 430, h: 180, size: 38, weight: 600, color: "#111827", lh: 1.4 }),
              ] as DesignElement[]
            }),
            txt("Everything runs in the browser — nothing to install.", { x: 146, y: 800, w: 1000, h: 50, size: 32, weight: 400, color: "#6b7280" }),
          ],
        ),
        page(
          "Closing",
          gradient("#7c3aed", "#db2777", 140),
          [
            txt("THANK YOU", { x: 0, y: 360, w: 1920, h: 220, size: 190, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 8 }),
            txt("hello@studio.app · studio.app/seed", { x: 0, y: 640, w: 1920, h: 60, size: 40, font: F.mono, weight: 400, color: "#fde68a", align: "center" }),
          ],
        ),
      ]),
  },

  /* ============================== PRINT ============================== */
  {
    slug: "poster-concert",
    name: "Midnight Echo — Concert Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "concert", "music", "event"],
    width: 1240,
    height: 1754,
    featured: true,
    build: () =>
      doc("canvas", 1240, 1754, "#111827", [
        page("Poster", solid("#111827"), [
          rect({ x: 60, y: 60, w: 1120, h: 1634, fill: "transparent", stroke: "#7c3aed", sw: 4, r: 16 }),
          shp("star", { x: 950, y: 140, w: 120, h: 120, fill: "#fde047", rotation: 16 }),
          shp("star", { x: 170, y: 240, w: 60, h: 60, fill: "#f97316", rotation: -14 }),
          txt("MIDNIGHT\nECHO", { x: 0, y: 300, w: 1240, h: 460, size: 220, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 0.95, ls: 6 }),
          txt("LIVE AT THE LOFT · ONE NIGHT ONLY", { x: 0, y: 800, w: 1240, h: 70, size: 54, font: F.cond, weight: 500, color: "#fde047", align: "center", upper: true, ls: 4 }),
          rect({ x: 420, y: 920, w: 400, h: 180, fill: V, r: 24 }),
          txt("SEP\n12", { x: 420, y: 930, w: 400, h: 160, size: 64, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1 }),
          txt("doors 21:00 — djs till late", { x: 0, y: 1160, w: 1240, h: 50, size: 34, weight: 400, color: "#c4b5fd", align: "center" }),
          ...pill("TICKETS $15 AT THE DOOR", { x: 320, y: 1420, w: 600, h: 90, fill: "#fde047", size: 30, color: "#111827" }),
          txt("the loft · 21 harbor street · presented by studio live", { x: 0, y: 1580, w: 1240, h: 44, size: 26, font: F.mono, weight: 400, color: "#6b7280", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "poster-workshop",
    name: "Watercolor Workshop — Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "workshop", "art", "class"],
    width: 1240,
    height: 1754,
    build: () =>
      doc("canvas", 1240, 1754, "#ecfdf5", [
        page("Poster", solid("#ecfdf5"), [
          img(asset("wave"), { x: 0, y: 1470, w: 1240, h: 284, opacity: 0.55 }),
          txt("SLOW SUNDAY SERIES", { x: 120, y: 200, w: 900, h: 44, size: 30, weight: 600, color: "#059669", ls: 8, upper: true }),
          txt("WATERCOLOR\nWORKSHOP", { x: 110, y: 290, w: 1000, h: 340, size: 110, font: F.serif, weight: 700, color: "#064e3b", lh: 1.12 }),
          img(asset("underline-scribble"), { x: 116, y: 660, w: 420, h: 70 }),
          ...vstack(
            120,
            790,
            36,
            ["Sunday · March 15 · 10:00–13:00", "Greenhouse Studio · Elm Lane 4", "All materials included · $35"].map((s) =>
              txt(s, { x: 120, y: 0, w: 900, h: 56, size: 36, font: F.body, weight: 500, color: "#064e3b", vAlign: "middle" }),
            ),
          ),
          ...pill("LIMITED TO 12 SEATS", { x: 120, y: 1120, w: 520, h: 92, fill: "#059669", size: 32, color: "#ecfdf5" }),
          txt("book at hello@greenhouse.studio", { x: 120, y: 1560, w: 900, h: 44, size: 30, font: F.hand, weight: 400, color: "#064e3b" }),
        ]),
      ]),
  },
  {
    slug: "menu-cafe",
    name: "Sunrise Café — Menu",
    category: "print",
    type: "canvas",
    tags: ["menu", "cafe", "price list", "food"],
    width: 1240,
    height: 1754,
    build: () => {
      const section = (title: string, items: [string, string][], y: number): DesignElement[] => {
        const out: DesignElement[] = [txt(title, { x: 140, y, w: 600, h: 60, size: 44, font: F.cond, weight: 600, color: "#b45309", upper: true, ls: 4 })]
        items.forEach(([name, price], i) => {
          const iy = y + 90 + i * 64
          out.push(txt(name, { x: 140, y: iy, w: 620, h: 50, size: 30, font: F.body, weight: 500, color: "#78350f", vAlign: "middle" }))
          out.push(txt(price, { x: 790, y: iy, w: 310, h: 50, size: 30, font: F.mono, weight: 400, color: "#b45309", align: "right", vAlign: "middle" }))
          out.push(rule(140, iy + 50, 960, "#fde68a", 3))
        })
        return out
      }
      return doc("canvas", 1240, 1754, "#fffbeb", [
        page("Menu", solid("#fffbeb"), [
          txt("SUNRISE CAFÉ", { x: 0, y: 160, w: 1240, h: 120, size: 96, font: F.serif, weight: 700, color: "#78350f", align: "center" }),
          txt("EST. 2019 · RIVERSIDE WALK", { x: 0, y: 300, w: 1240, h: 40, size: 26, font: F.mono, weight: 400, color: "#b45309", align: "center", ls: 6 }),
          ...section("Espresso bar", [["Espresso", "2.50"], ["Flat white", "3.80"], ["Caramel latte", "4.50"]], 420),
          ...section("Slow brews", [["V60 filter", "4.00"], ["Cold brew", "4.80"], ["Chai pot for two", "6.50"]], 810),
          ...section("From the oven", [["Butter croissant", "3.20"], ["Banana bread", "3.80"], ["Avocado toast", "7.50"]], 1200),
          txt("ask about today's specials", { x: 0, y: 1620, w: 1240, h: 44, size: 28, font: F.hand, weight: 400, color: "#78350f", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "calendar-month",
    name: "June 2026 — Calendar",
    category: "print",
    type: "canvas",
    tags: ["calendar", "month", "planner", "table"],
    width: 1240,
    height: 1754,
    build: () => {
      const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
      const weeks = [["1", "2", "3", "4", "5", "6", "7"], ["8", "9", "10", "11", "12", "13", "14"], ["15", "16", "17", "18", "19", "20", "21"], ["22", "23", "24", "25", "26", "27", "28"], ["29", "30", "", "", "", "", ""]]
      return doc("canvas", 1240, 1754, "#ffffff", [
        page("Calendar", solid("#ffffff"), [
          txt("JUNE", { x: 90, y: 120, w: 700, h: 170, size: 150, font: F.display, weight: 400, color: "#1f2937" }),
          txt("2026", { x: 90, y: 300, w: 400, h: 60, size: 44, font: F.mono, weight: 400, color: "#7c3aed", ls: 8 }),
          shp("star", { x: 1000, y: 150, w: 100, h: 100, fill: "#fde68a", rotation: 15 }),
          tbl([days, ...weeks], { x: 90, y: 460, w: 1060, h: 640, fontSize: 32, headerBg: V, headerColor: "#ffffff", rowBg: "#ffffff", altRowBg: "#f5f3ff", borderColor: "#e5e7eb", color: "#1f2937" }),
          txt("NOTES", { x: 90, y: 1200, w: 400, h: 50, size: 34, font: F.cond, weight: 600, color: "#7c3aed", ls: 4 }),
          rule(90, 1290, 1060, "#e5e7eb", 3),
          rule(90, 1390, 1060, "#e5e7eb", 3),
          rule(90, 1490, 1060, "#e5e7eb", 3),
          txt("print me · pin me · plan with me", { x: 90, y: 1600, w: 1060, h: 40, size: 26, font: F.hand, weight: 400, color: "#9ca3af" }),
        ]),
      ])
    },
  },
  {
    slug: "ebook-cover",
    name: "The Design Handbook — E-book Cover",
    category: "print",
    type: "canvas",
    tags: ["ebook", "cover", "book", "gradient"],
    width: 1600,
    height: 2560,
    build: () =>
      doc("canvas", 1600, 2560, gradient("#111827", "#7c3aed", 160), [
        page("Cover", gradient("#111827", "#7c3aed", 160), [
          ellipse({ x: 480, y: 180, w: 640, h: 640, fill: "#ffffff", opacity: 0.06 }),
          txt("THE\nDESIGN\nHANDBOOK", { x: 0, y: 560, w: 1600, h: 760, size: 190, font: F.serif, weight: 700, color: "#ffffff", align: "center", lh: 1.15 }),
          rule(700, 1400, 200, "#fde047", 8),
          txt("a practical guide to everyday\nvisual thinking", { x: 0, y: 1480, w: 1600, h: 160, size: 54, font: F.script, weight: 400, color: "#fde047", align: "center", lh: 1.3 }),
          txt("MAYA LINDHOLM", { x: 0, y: 2100, w: 1600, h: 60, size: 40, weight: 600, color: "#ffffff", align: "center", ls: 10 }),
          txt("second edition · free to share", { x: 0, y: 2200, w: 1600, h: 44, size: 28, font: F.mono, weight: 400, color: "#c4b5fd", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "sticker-sheet",
    name: "Happy Shapes — Sticker Sheet",
    category: "print",
    type: "canvas",
    tags: ["sticker", "shapes", "print", "kids"],
    width: 600,
    height: 600,
    build: () => {
      const stickers: DesignElement[] = []
      const defs: { v: ShapeVariant; fill: string; label: string }[] = [
        { v: "star", fill: "#fbbf24", label: "STAR" },
        { v: "heart", fill: "#ec4899", label: "LOVE" },
        { v: "blob", fill: "#34d399", label: "BLOB" },
        { v: "hexagon", fill: "#a855f7", label: "HEX" },
        { v: "diamond", fill: "#fde047", label: "GEM" },
        { v: "badge", fill: "#f97316", label: "WOW" },
      ]
      defs.forEach((d, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const cx = 60 + col * 270
        const cy = 60 + row * 180
        stickers.push(shp(d.v, { x: cx, y: cy, w: 110, h: 110, fill: d.fill, rotation: i % 2 ? -10 : 10 }))
        stickers.push(txt(d.label, { x: cx + 115, y: cy + 35, w: 140, h: 40, size: 22, font: F.mono, weight: 700, color: "#111827", vAlign: "middle" }))
      })
      return doc("canvas", 600, 600, "#ffffff", [
        page("Stickers", solid("#ffffff"), [
          rect({ x: 20, y: 20, w: 560, h: 560, fill: "transparent", stroke: "#e5e7eb", sw: 3, r: 20, dash: [14, 10] }),
          ...stickers,
        ]),
      ])
    },
  },

  /* ============================== MARKETING ============================== */
  {
    slug: "flyer-grand-opening",
    name: "Grand Opening — Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "opening", "store", "promo"],
    width: 1240,
    height: 1754,
    build: () =>
      doc("canvas", 1240, 1754, "#111827", [
        page("Flyer", solid("#111827"), [
          rect({ x: -80, y: -60, w: 1500, h: 240, fill: "#22c55e", rotation: -6 }),
          rect({ x: -80, y: 120, w: 1500, h: 200, fill: "#eab308", rotation: -6 }),
          rect({ x: -80, y: 300, w: 1500, h: 160, fill: "#ec4899", rotation: -6 }),
          txt("GRAND\nOPENING", { x: 0, y: 560, w: 1240, h: 420, size: 190, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 0.98 }),
          txt("SATURDAY · MARCH 7 · 9 AM", { x: 0, y: 1020, w: 1240, h: 70, size: 52, font: F.cond, weight: 500, color: "#eab308", align: "center", ls: 4, upper: true }),
          txt("Bloom & Co. Home Goods · 8 Meadow Road", { x: 0, y: 1120, w: 1240, h: 50, size: 34, weight: 400, color: "#e5e7eb", align: "center" }),
          ...pill("FIRST 50 GUESTS GET A FREE TOTE", { x: 270, y: 1240, w: 700, h: 88, fill: "#22c55e", size: 30, color: "#111827" }),
          qrEl("https://bloomandco.example/invite", { x: 540, y: 1400, size: 200, fg: "#111827", bg: "#ffffff" }),
          txt("scan for directions & RSVP", { x: 0, y: 1630, w: 1240, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "logo-monogram",
    name: "Atelier S — Monogram Logo",
    category: "marketing",
    type: "canvas",
    tags: ["logo", "monogram", "brand", "minimal"],
    width: 1000,
    height: 1000,
    build: () =>
      doc("canvas", 1000, 1000, "#ffffff", [
        page("Logo", solid("#ffffff"), [
          ellipse({ x: 250, y: 190, w: 500, h: 500, fill: "transparent", stroke: V, sw: 14 }),
          ellipse({ x: 282, y: 222, w: 436, h: 436, fill: "transparent", stroke: "#9ca3af", sw: 3, dash: [6, 10] }),
          txt("S", { x: 250, y: 230, w: 500, h: 420, size: 300, font: F.serif, weight: 700, color: V, align: "center", vAlign: "middle" }),
          txt("STUDIO ATELIER", { x: 0, y: 760, w: 1000, h: 60, size: 44, weight: 600, color: "#111827", align: "center", ls: 12 }),
          txt("EST. 2026", { x: 0, y: 840, w: 1000, h: 40, size: 26, font: F.mono, weight: 400, color: "#9ca3af", align: "center", ls: 8 }),
        ]),
      ]),
  },
  {
    slug: "logo-badge",
    name: "Brew Co. — Badge Logo",
    category: "marketing",
    type: "canvas",
    tags: ["logo", "badge", "coffee", "brand"],
    width: 1000,
    height: 1000,
    build: () =>
      doc("canvas", 1000, 1000, "#ecfdf5", [
        page("Logo", solid("#ecfdf5"), [
          shp("hexagon", { x: 230, y: 150, w: 540, h: 600, fill: "#059669", rotation: 0 }),
          txt("BREW\nCO.", { x: 230, y: 300, w: 540, h: 300, size: 110, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1 }),
          rule(400, 640, 200, "#fbbf24", 6),
          txt("FRESH ROASTED", { x: 230, y: 800, w: 540, h: 44, size: 30, weight: 600, color: "#064e3b", align: "center", ls: 8, upper: true }),
          txt("EST. 2019 · SMALL BATCH", { x: 230, y: 860, w: 540, h: 36, size: 22, font: F.mono, weight: 400, color: "#059669", align: "center", ls: 4 }),
        ]),
      ]),
  },
  {
    slug: "newsletter-header",
    name: "Studio Weekly — Newsletter",
    category: "marketing",
    type: "canvas",
    tags: ["newsletter", "email", "editorial"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, "#ffffff", [
        page("Newsletter", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1080, h: 16, fill: V }),
          txt("THE STUDIO WEEKLY", { x: 0, y: 110, w: 1080, h: 100, size: 78, font: F.serif, weight: 700, color: "#111827", align: "center" }),
          txt("ISSUE 24 · SATURDAY, JUNE 6", { x: 0, y: 230, w: 1080, h: 36, size: 22, font: F.mono, weight: 400, color: "#6b7280", align: "center", ls: 4 }),
          rule(90, 300, 900, "#e5e7eb", 3),
          rect({ x: 90, y: 360, w: 900, h: 260, fill: "#fde68a", r: 20 }),
          txt("IN THIS ISSUE", { x: 130, y: 400, w: 500, h: 44, size: 30, weight: 600, color: "#78350f", ls: 4 }),
          txt("→ Grid systems that survive real content\n→ Five free font pairings that just work\n→ Reader Q&A: pricing your first logo", { x: 130, y: 460, w: 820, h: 140, size: 28, weight: 400, color: "#78350f", lh: 1.6 }),
          txt("THE BIG IDEA", { x: 90, y: 700, w: 440, h: 44, size: 34, font: F.cond, weight: 600, color: V, ls: 2 }),
          txt("Whitespace is not empty — it is the\npause that makes your message land.\nThis week we rebuilt a crowded flyer\nby deleting a third of its words.", { x: 90, y: 760, w: 420, h: 260, size: 26, weight: 400, color: "#374151", lh: 1.65 }),
          txt("TOOL OF THE WEEK", { x: 560, y: 700, w: 430, h: 44, size: 34, font: F.cond, weight: 600, color: V, ls: 2 }),
          txt("Type scale calculators save hours.\nPick a ratio (1.25 is a safe start),\nset four sizes, and stop guessing\nfor the rest of the project.", { x: 560, y: 760, w: 430, h: 260, size: 26, weight: 400, color: "#374151", lh: 1.65 }),
          rect({ x: 0, y: 1240, w: 1080, h: 110, fill: "#f5f3ff" }),
          txt("studio.app/weekly — free forever · unsubscribe anytime", { x: 0, y: 1275, w: 1080, h: 40, size: 24, weight: 400, color: "#6b7280", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "ad-banner-web",
    name: "New Collection — Web Ad Banner",
    category: "marketing",
    type: "canvas",
    tags: ["ad", "banner", "web", "promo"],
    width: 1200,
    height: 628,
    build: () =>
      doc("canvas", 1200, 628, "#f5f3ff", [
        page("Banner", solid("#f5f3ff"), [
          rect({ x: 720, y: 0, w: 480, h: 628, fill: "#1f2937" }),
          img(asset("blob-2"), { x: 790, y: 90, w: 340, h: 340, opacity: 0.9 }),
          shp("star", { x: 1010, y: 440, w: 80, h: 80, fill: "#fde047", rotation: 18 }),
          txt("SS26", { x: 830, y: 210, w: 260, h: 100, size: 72, font: F.display, weight: 400, color: "#ffffff", align: "center" }),
          txt("MEET THE\nNEW COLLECTION", { x: 70, y: 130, w: 600, h: 240, size: 90, font: F.display, weight: 400, color: "#1f2937", lh: 1.02 }),
          txt("Fresh prints, honest prices, zero waste.", { x: 74, y: 390, w: 560, h: 44, size: 28, weight: 400, color: "#6b7280" }),
          ...pill("SHOP NOW", { x: 74, y: 470, w: 280, h: 80, fill: V, size: 30, color: "#ffffff" }),
        ]),
      ]),
  },
  {
    slug: "product-ad",
    name: "Aura Buds — Product Ad",
    category: "marketing",
    type: "canvas",
    tags: ["ad", "product", "audio", "web"],
    width: 1200,
    height: 628,
    build: () =>
      doc("canvas", 1200, 628, "#ffffff", [
        page("Ad", solid("#ffffff"), [
          ellipse({ x: 760, y: 60, w: 500, h: 500, fill: "#fce7f3" }),
          img(asset("badge-star"), { x: 980, y: 90, w: 130, h: 130 }),
          img(asset("sparkle"), { x: 820, y: 400, w: 90, h: 90 }),
          txt("AURA BUDS", { x: 70, y: 110, w: 500, h: 50, size: 38, font: F.mono, weight: 700, color: "#db2777", ls: 6 }),
          txt("HEAR EVERY\nDETAIL", { x: 66, y: 180, w: 560, h: 220, size: 92, font: F.display, weight: 400, color: "#111827", lh: 1 }),
          txt("24h battery · pocket case · USB-C", { x: 70, y: 420, w: 520, h: 40, size: 26, weight: 400, color: "#6b7280" }),
          txt("$49 — free shipping", { x: 70, y: 470, w: 400, h: 44, size: 32, font: F.pop, weight: 700, color: "#db2777" }),
        ]),
      ]),
  },

  /* ============================== BUSINESS ============================== */
  {
    slug: "business-card-minimal",
    name: "Minimal Business Card",
    category: "business",
    type: "canvas",
    tags: ["business card", "minimal", "print"],
    width: 1050,
    height: 600,
    build: () =>
      doc("canvas", 1050, 600, "#ffffff", [
        page("Front", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1050, h: 600, fill: "#ffffff", stroke: "#e5e7eb", sw: 2, r: 0 }),
          rect({ x: 0, y: 0, w: 14, h: 600, fill: V, r: 0 }),
          txt("ALEX MORGAN", { x: 70, y: 170, w: 600, h: 70, size: 52, font: F.pop, weight: 700, color: "#111827", align: "left", lh: 1.2, ls: 2 }),
          txt("Product Designer", { x: 72, y: 250, w: 500, h: 40, size: 28, weight: 400, color: V, align: "left", lh: 1.3 }),
          txt("alex@studio.app · +1 555 0100\nstudio.app", { x: 72, y: 380, w: 620, h: 90, size: 24, weight: 400, color: "#6b7280", align: "left", lh: 1.6 }),
          ellipse({ x: 800, y: 180, w: 160, h: 160, fill: "#ede9fe" }),
        ]),
      ]),
  },
  {
    slug: "business-card-dark",
    name: "Dark & Gold — Business Card",
    category: "business",
    type: "canvas",
    tags: ["business card", "dark", "elegant"],
    width: 1050,
    height: 600,
    build: () =>
      doc("canvas", 1050, 600, "#111827", [
        page("Front", solid("#111827"), [
          rect({ x: 40, y: 40, w: 970, h: 520, fill: "transparent", stroke: "#fcd34d", sw: 3, r: 12 }),
          txt("NOVA REYES", { x: 90, y: 150, w: 600, h: 80, size: 56, font: F.serif, weight: 700, color: "#ffffff", ls: 4 }),
          txt("ARCHITECT · SPACES THAT BREATHE", { x: 92, y: 250, w: 620, h: 40, size: 24, weight: 400, color: "#fcd34d", ls: 4, upper: true }),
          rule(92, 330, 90, "#fcd34d", 4),
          txt("nova@studiomb.co · +1 555 0184\nstudio mb · 4 cliff street", { x: 92, y: 380, w: 560, h: 90, size: 22, font: F.mono, weight: 400, color: "#9ca3af", lh: 1.7 }),
          shp("diamond", { x: 850, y: 240, w: 90, h: 90, fill: "transparent", stroke: "#fcd34d", sw: 4, rotation: 45 }),
        ]),
      ]),
  },
  {
    slug: "linkedin-banner",
    name: "Professional — LinkedIn Banner",
    category: "business",
    type: "canvas",
    tags: ["linkedin", "banner", "profile", "career"],
    width: 1584,
    height: 396,
    build: () =>
      doc("canvas", 1584, 396, gradient("#f9fafb", "#ede9fe", 90), [
        page("Banner", gradient("#f9fafb", "#ede9fe", 90), [
          ellipse({ x: 1240, y: -80, w: 320, h: 320, fill: V, opacity: 0.12 }),
          ellipse({ x: 1440, y: 180, w: 220, h: 220, fill: "#f59e0b", opacity: 0.15 }),
          rule(100, 110, 90, V, 8),
          txt("Alex Morgan", { x: 100, y: 140, w: 900, h: 90, size: 72, font: F.serif, weight: 700, color: "#111827" }),
          txt("Product Designer · design systems, tools & education", { x: 102, y: 250, w: 900, h: 50, size: 34, weight: 400, color: V }),
          txt("open to collaborations", { x: 1300, y: 300, w: 240, h: 40, size: 22, font: F.mono, weight: 400, color: "#6b7280", align: "right" }),
        ]),
      ]),
  },

  /* ============================== RESUMES ============================== */
  {
    slug: "clean-resume-a4",
    name: "Clean Resume — A4",
    category: "resume",
    type: "canvas",
    tags: ["resume", "cv", "professional"],
    width: 1240,
    height: 1754,
    featured: true,
    build: () =>
      doc("canvas", 1240, 1754, "#ffffff", [
        page("Resume", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 420, h: 1754, fill: "#1f2937", r: 0 }),
          txt("ALEX\nMORGAN", { x: 60, y: 140, w: 320, h: 160, size: 64, font: F.pop, weight: 700, color: "#ffffff", align: "left", lh: 1.1 }),
          txt("Product Designer", { x: 62, y: 320, w: 320, h: 40, size: 28, weight: 400, color: "#c4b5fd", align: "left", lh: 1.3 }),
          txt("CONTACT\n\nalex@studio.app\n+1 555 0100\nPortugal", { x: 62, y: 420, w: 320, h: 240, size: 24, weight: 400, color: "#e5e7eb", align: "left", lh: 1.5 }),
          txt("EXPERIENCE", { x: 500, y: 140, w: 640, h: 50, size: 34, font: F.pop, weight: 700, color: V, align: "left", lh: 1.3, ls: 4 }),
          txt("Senior Product Designer — Nova Labs (2022–now)\nLed design system used by 40+ engineers.\n\nProduct Designer — Bright (2019–2022)\nShipped 12 core features across web and mobile.", { x: 500, y: 210, w: 660, h: 260, size: 24, weight: 400, color: "#374151", align: "left", lh: 1.55 }),
          txt("EDUCATION", { x: 500, y: 560, w: 640, h: 50, size: 34, font: F.pop, weight: 700, color: V, align: "left", lh: 1.3, ls: 4 }),
          txt("BA Interaction Design — Porto Univ. (2019)", { x: 500, y: 630, w: 660, h: 60, size: 24, weight: 400, color: "#374151", align: "left", lh: 1.55 }),
          txt("SKILLS", { x: 500, y: 760, w: 640, h: 50, size: 34, font: F.pop, weight: 700, color: V, align: "left", lh: 1.3, ls: 4 }),
          txt("Figma · Prototyping · Design Systems · Motion", { x: 500, y: 830, w: 660, h: 60, size: 24, weight: 400, color: "#374151", align: "left", lh: 1.55 }),
        ]),
      ]),
  },
  {
    slug: "resume-creative",
    name: "Creative Header — Resume",
    category: "resume",
    type: "canvas",
    tags: ["resume", "cv", "creative", "colorful"],
    width: 1240,
    height: 1754,
    build: () => {
      const skill = (label: string, pct: number, y: number): DesignElement[] => [
        txt(label, { x: 760, y, w: 380, h: 40, size: 26, weight: 600, color: "#1f2937" }),
        rect({ x: 760, y: y + 48, w: 380, h: 16, fill: "#ede9fe", r: 8 }),
        rect({ x: 760, y: y + 48, w: Math.round(380 * pct), h: 16, fill: V, r: 8 }),
      ]
      return doc("canvas", 1240, 1754, "#ffffff", [
        page("Resume", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1240, h: 340, fill: V, r: 0 }),
          ellipse({ x: 980, y: -60, w: 320, h: 320, fill: "#6d28d9" }),
          txt("Maya Lindholm", { x: 80, y: 90, w: 800, h: 100, size: 76, font: F.serif, weight: 700, color: "#ffffff" }),
          txt("Illustrator & visual storyteller — 8 years of freelance practice", { x: 84, y: 210, w: 900, h: 50, size: 32, weight: 400, color: "#fde68a" }),
          txt("PROFILE", { x: 80, y: 430, w: 560, h: 46, size: 32, font: F.cond, weight: 600, color: V, ls: 4 }),
          txt("Editorial illustrator blending hand-drawn texture with clean layout. Clients include publishers, magazines and indie studios.", { x: 80, y: 490, w: 560, h: 150, size: 26, weight: 400, color: "#374151", lh: 1.6 }),
          txt("EXPERIENCE", { x: 80, y: 700, w: 560, h: 46, size: 32, font: F.cond, weight: 600, color: V, ls: 4 }),
          txt("2022–now  Lead illustrator — Papermoon Press\n2019–22   Freelance — 60+ editorial commissions\n2017–19   Junior designer — Kite Agency", { x: 80, y: 760, w: 580, h: 220, size: 26, weight: 400, color: "#374151", lh: 1.7 }),
          txt("EDUCATION", { x: 80, y: 1040, w: 560, h: 46, size: 32, font: F.cond, weight: 600, color: V, ls: 4 }),
          txt("BA Visual Communication — Arts Institute (2017)", { x: 80, y: 1100, w: 580, h: 60, size: 26, weight: 400, color: "#374151", lh: 1.6 }),
          ...skill("Illustration", 0.95, 420),
          ...skill("Layout & typography", 0.85, 540),
          ...skill("Motion basics", 0.6, 660),
          txt("STRENGTHS", { x: 760, y: 820, w: 380, h: 46, size: 32, font: F.cond, weight: 600, color: V, ls: 4 }),
          txt("Deadline-proof · client-friendly ·\ncomfortable leading reviews", { x: 760, y: 880, w: 380, h: 140, size: 26, weight: 400, color: "#374151", lh: 1.7 }),
          txt("maya@inkforest.example · @mayadraws", { x: 80, y: 1600, w: 1080, h: 44, size: 26, font: F.mono, weight: 400, color: "#6b7280" }),
        ]),
      ])
    },
  },

  /* ============================== EVENTS & CARDS ============================== */
  {
    slug: "invitation-wedding",
    name: "Emma & Noah — Wedding Invitation",
    category: "event",
    type: "canvas",
    tags: ["invitation", "wedding", "elegant"],
    width: 1050,
    height: 1500,
    featured: true,
    build: () =>
      doc("canvas", 1050, 1500, "#fdf8f1", [
        page("Invitation", solid("#fdf8f1"), [
          rect({ x: 60, y: 60, w: 930, h: 1380, fill: "#ffffff", stroke: "#db2777", sw: 4, r: 24 }),
          rect({ x: 84, y: 84, w: 882, h: 1332, fill: "transparent", stroke: "#f9a8d4", sw: 2, r: 16 }),
          img(asset("flower"), { x: 100, y: 110, w: 130, h: 130, opacity: 0.9 }),
          img(asset("flower"), { x: 820, y: 1260, w: 130, h: 130, opacity: 0.9, rotation: 180 }),
          txt("Together with their families", { x: 120, y: 280, w: 810, h: 60, size: 40, font: F.script, weight: 400, color: "#db2777", align: "center" }),
          txt("EMMA\n& NOAH", { x: 120, y: 400, w: 810, h: 280, size: 120, font: F.serif, weight: 700, color: "#1f2937", align: "center", lh: 1.12 }),
          txt("22 · 06 · 2026", { x: 120, y: 730, w: 810, h: 60, size: 40, font: F.mono, weight: 400, color: "#831843", align: "center", ls: 10 }),
          rule(455, 850, 140, "#f59e0b", 6),
          txt("The Rose Garden · four in the afternoon\ndinner & dancing to follow", { x: 120, y: 910, w: 810, h: 110, size: 32, weight: 400, color: "#6b7280", align: "center", lh: 1.6 }),
          txt("RSVP by May 1 · emma-noah@postbox.test", { x: 120, y: 1290, w: 810, h: 44, size: 26, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "invitation-birthday",
    name: "Leo Turns 7 — Birthday Invitation",
    category: "event",
    type: "canvas",
    tags: ["invitation", "birthday", "kids", "fun"],
    width: 1050,
    height: 1500,
    build: () =>
      doc("canvas", 1050, 1500, "#fff7ed", [
        page("Invitation", solid("#fff7ed"), [
          img(asset("confetti"), { x: 40, y: 60, w: 970, h: 300, opacity: 0.9 }),
          shp("blob", { x: -80, y: 1180, w: 380, h: 380, fill: "#22c55e", opacity: 0.25 }),
          shp("blob", { x: 780, y: -60, w: 340, h: 340, fill: "#f97316", opacity: 0.25 }),
          txt("YOU'RE INVITED!", { x: 0, y: 400, w: 1050, h: 110, size: 84, font: F.marker, weight: 400, color: "#f97316", align: "center", rotation: -2 }),
          txt("LEO TURNS 7", { x: 0, y: 560, w: 1050, h: 130, size: 110, font: F.cond, weight: 600, color: "#111827", align: "center", upper: true }),
          txt("Balloon games · dino cake · garden picnic", { x: 0, y: 740, w: 1050, h: 60, size: 38, font: F.hand, weight: 400, color: "#374151", align: "center" }),
          rect({ x: 240, y: 880, w: 570, h: 200, fill: "#ffffff", r: 24, stroke: "#f97316", sw: 4 }),
          txt("SAT · JUNE 13 · 2–5 PM\nSunshine Park, picnic area 3", { x: 240, y: 920, w: 570, h: 120, size: 34, weight: 600, color: "#111827", align: "center", lh: 1.6 }),
          txt("RSVP: mia@postbox.test · by June 1", { x: 0, y: 1300, w: 1050, h: 44, size: 28, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "event-ticket",
    name: "Admit One — Event Ticket",
    category: "event",
    type: "canvas",
    tags: ["ticket", "event", "print"],
    width: 1050,
    height: 600,
    build: () =>
      doc("canvas", 1050, 600, "#111827", [
        page("Ticket", solid("#111827"), [
          rect({ x: 30, y: 30, w: 990, h: 540, fill: "#1f2937", r: 24 }),
          rect({ x: 760, y: 60, w: 4, h: 480, fill: "transparent", stroke: "#4b5563", sw: 4, dash: [16, 14], r: 0 }),
          txt("MIDNIGHT ECHO", { x: 80, y: 110, w: 620, h: 70, size: 54, font: F.display, weight: 400, color: "#fde047", ls: 4 }),
          txt("LIVE · THE LOFT · SEP 12", { x: 84, y: 200, w: 600, h: 44, size: 30, weight: 500, color: "#e5e7eb", ls: 2 }),
          txt("DOORS 21:00", { x: 84, y: 270, w: 300, h: 40, size: 26, font: F.mono, weight: 400, color: "#9ca3af" }),
          ...pill("ADMIT ONE", { x: 80, y: 380, w: 320, h: 84, fill: "#fde047", size: 32, color: "#111827" }),
          txt("№\n001242", { x: 800, y: 200, w: 170, h: 120, size: 34, font: F.mono, weight: 700, color: "#fde047", align: "center", lh: 1.4 }),
          txt("KEEP THIS STUB", { x: 770, y: 480, w: 230, h: 36, size: 18, font: F.mono, weight: 400, color: "#6b7280", align: "center", ls: 2 }),
          shp("star", { x: 620, y: 90, w: 70, h: 70, fill: "#7c3aed", rotation: 15 }),
        ]),
      ]),
  },

  /* ============================== EDUCATION ============================== */
  {
    slug: "cert-of-achievement",
    name: "Certificate of Achievement",
    category: "education",
    type: "canvas",
    tags: ["certificate", "education", "award", "template"],
    width: 1754,
    height: 1240,
    featured: true,
    build: () =>
      doc("canvas", 1754, 1240, "#fffbeb", [
        page("Certificate", solid("#fffbeb"), [
          rect({ x: 60, y: 60, w: 1634, h: 1120, fill: "transparent", stroke: "#b45309", sw: 8, r: 24 }),
          rect({ x: 90, y: 90, w: 1574, h: 1060, fill: "transparent", stroke: "#f59e0b", sw: 2, r: 16 }),
          img(asset("badge-star"), { x: 807, y: 130, w: 140, h: 140 }),
          txt("CERTIFICATE", { x: 200, y: 310, w: 1354, h: 110, size: 96, font: F.serif, weight: 700, color: "#92400e", align: "center", lh: 1.2, ls: 10 }),
          txt("OF ACHIEVEMENT", { x: 200, y: 440, w: 1354, h: 60, size: 36, weight: 600, color: "#b45309", align: "center", lh: 1.4, ls: 14 }),
          txt("proudly presented to", { x: 200, y: 540, w: 1354, h: 50, size: 28, weight: 400, color: "#78350f", align: "center", lh: 1.4 }),
          txt("{{name}}", { x: 200, y: 610, w: 1354, h: 120, size: 96, font: F.script, weight: 700, color: "#1f2937", align: "center", lh: 1.2 }),
          rule(627, 760, 500, "#b45309", 3),
          txt("for outstanding completion of the {{course}} program", { x: 200, y: 800, w: 1354, h: 50, size: 28, weight: 400, color: "#78350f", align: "center", lh: 1.4 }),
          txt("Date: {{date}}", { x: 1100, y: 1020, w: 440, h: 50, size: 24, weight: 400, color: "#92400e", align: "center", lh: 1.4 }),
          txt("Studio Academy", { x: 210, y: 1030, w: 420, h: 40, size: 22, font: F.mono, weight: 400, color: "#92400e", ls: 2 }),
        ]),
      ]),
  },
  {
    slug: "education-flashcards",
    name: "Fruit Words — Flashcards",
    category: "education",
    type: "canvas",
    tags: ["flashcards", "language", "education", "study"],
    width: 1080,
    height: 1080,
    build: () => {
      const cards: DesignElement[] = []
      const words: [string, string][] = [
        ["APPLE", "la manzana"],
        ["PEAR", "la pera"],
        ["PLUM", "la ciruela"],
        ["PEACH", "el melocotón"],
      ]
      words.forEach(([en, es], i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const cx = 90 + col * 460
        const cy = 300 + row * 360
        cards.push(rect({ x: cx, y: cy, w: 400, h: 300, fill: "#f5f3ff", r: 24 }))
        cards.push(txt(`${i + 1}`, { x: cx + 20, y: cy + 16, w: 60, h: 44, size: 24, font: F.mono, weight: 700, color: "#c4b5fd" }))
        cards.push(txt(en, { x: cx, y: cy + 70, w: 400, h: 70, size: 52, weight: 700, color: "#1f2937", align: "center" }))
        cards.push(txt(es, { x: cx, y: cy + 160, w: 400, h: 80, size: 48, font: F.script, weight: 400, color: "#7c3aed", align: "center" }))
      })
      return doc("canvas", 1080, 1080, "#ffffff", [
        page("Flashcards", solid("#ffffff"), [
          txt("SPANISH · FRUIT", { x: 90, y: 100, w: 700, h: 60, size: 44, font: F.mono, weight: 700, color: "#7c3aed", ls: 4 }),
          txt("cover the right side, say it out loud", { x: 90, y: 175, w: 800, h: 44, size: 28, font: F.hand, weight: 400, color: "#6b7280" }),
          ...cards,
        ]),
      ])
    },
  },

  /* ============================== INFOGRAPHICS ============================== */
  {
    slug: "infographic-stats",
    name: "Remote Work — Stats Infographic",
    category: "infographic",
    type: "canvas",
    tags: ["infographic", "stats", "data", "work"],
    width: 1080,
    height: 1920,
    featured: true,
    build: () =>
      doc("canvas", 1080, 1920, "#f9fafb", [
        page("Infographic", solid("#f9fafb"), [
          rect({ x: 0, y: 0, w: 1080, h: 300, fill: V, r: 0 }),
          txt("REMOTE WORK\nBY THE NUMBERS", { x: 90, y: 60, w: 900, h: 190, size: 76, font: F.cond, weight: 600, color: "#ffffff", lh: 1.15, upper: true }),
          txt("68%", { x: 90, y: 400, w: 500, h: 170, size: 150, font: F.display, weight: 400, color: V }),
          txt("of teams keep at least one remote day\nper week after 2025", { x: 94, y: 590, w: 800, h: 110, size: 32, weight: 400, color: "#374151", lh: 1.5 }),
          rect({ x: 90, y: 750, w: 900, h: 3, fill: "#e5e7eb", r: 0 }),
          txt("4.2×", { x: 90, y: 830, w: 500, h: 170, size: 150, font: F.display, weight: 400, color: "#db2777" }),
          txt("growth in async video updates since 2023", { x: 94, y: 1020, w: 800, h: 60, size: 32, weight: 400, color: "#374151" }),
          txt("WHERE PEOPLE WORK", { x: 90, y: 1150, w: 700, h: 50, size: 36, font: F.cond, weight: 600, color: "#111827", ls: 3 }),
          chart("progress", ["Hybrid", "Fully remote", "On-site"], [{ name: "Share", color: "#7c3aed", values: [42, 31, 27] }], { x: 90, y: 1230, w: 900, h: 320, legend: false, fmt: "0%" }),
          rect({ x: 90, y: 1660, w: 900, h: 3, fill: "#e5e7eb", r: 0 }),
          txt("source: studio annual workplace survey (illustrative)", { x: 90, y: 1700, w: 900, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af" }),
          shp("star", { x: 880, y: 400, w: 90, h: 90, fill: "#fde68a", rotation: 15 }),
        ]),
      ]),
  },
  {
    slug: "infographic-steps",
    name: "How Brewing Works — Steps Infographic",
    category: "infographic",
    type: "canvas",
    tags: ["infographic", "process", "steps", "how-to"],
    width: 1080,
    height: 1920,
    build: () => {
      const steps: DesignElement[] = []
      const data: [string, string, string][] = [
        ["GRIND", "Coarse grind, like sea salt", "#0d9488"],
        ["BLOOM", "Wet the grounds, wait 30 seconds", "#fbbf24"],
        ["POUR", "Slow circles, twice around", "#0d9488"],
        ["ENJOY", "Four minutes total, then pour", "#fbbf24"],
      ]
      data.forEach(([title, desc, color], i) => {
        const y = 340 + i * 380
        steps.push(ellipse({ x: 120, y, w: 160, h: 160, fill: color }))
        steps.push(txt(`${i + 1}`, { x: 120, y: y + 30, w: 160, h: 100, size: 64, font: F.display, weight: 400, color: i % 2 ? "#111827" : "#ffffff", align: "center" }))
        steps.push(txt(title, { x: 340, y: y + 10, w: 640, h: 70, size: 56, font: F.cond, weight: 600, color: "#134e4a", upper: true, ls: 2 }))
        steps.push(txt(desc, { x: 342, y: y + 90, w: 640, h: 50, size: 30, weight: 400, color: "#475569" }))
        if (i < 3) steps.push(shp("arrow", { x: 176, y: y + 190, w: 48, h: 120, fill: "#99f6e4", rotation: 90 }))
      })
      return doc("canvas", 1080, 1920, "#f0fdfa", [
        page("Infographic", solid("#f0fdfa"), [
          txt("HOW BREWING\nWORKS", { x: 110, y: 120, w: 860, h: 180, size: 84, font: F.cond, weight: 600, color: "#134e4a", lh: 1.1, upper: true }),
          img(asset("underline-scribble"), { x: 116, y: 320, w: 300, h: 50 }),
          ...steps,
          txt("save this for your next slow morning", { x: 110, y: 1800, w: 860, h: 44, size: 28, font: F.hand, weight: 400, color: "#134e4a" }),
        ]),
      ])
    },
  },

  /* ============================== PHOTO & WHITEBOARD ============================== */
  {
    slug: "photo-collage",
    name: "Gallery Wall — Photo Collage",
    category: "photo",
    type: "canvas",
    tags: ["collage", "photos", "gallery", "frames"],
    width: 1080,
    height: 1350,
    build: () => {
      const frames: DesignElement[] = []
      const art = [asset("blob-1"), asset("wave"), asset("triangle"), asset("half-circle")]
      const placements = [
        { x: 90, y: 150, w: 420, h: 420 },
        { x: 570, y: 150, w: 420, h: 420 },
        { x: 90, y: 630, w: 420, h: 420 },
        { x: 570, y: 630, w: 420, h: 420 },
      ]
      placements.forEach((p, i) => {
        frames.push(rect({ x: p.x - 12, y: p.y - 12, w: p.w + 24, h: p.h + 24, fill: "#ffffff", stroke: "#e5e7eb", sw: 2, r: 8 }))
        frames.push(img(art[i] ?? asset("blob-1"), { x: p.x, y: p.y, w: p.w, h: p.h, opacity: 0.9 }))
      })
      return doc("canvas", 1080, 1350, "#fafaf9", [
        page("Collage", solid("#fafaf9"), [
          ...frames,
          txt("gallery wall", { x: 0, y: 1130, w: 1080, h: 90, size: 72, font: F.script, weight: 400, color: "#1f2937", align: "center" }),
          txt("swap the abstract prints for your favorite photos", { x: 0, y: 1240, w: 1080, h: 40, size: 26, weight: 400, color: "#9ca3af", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "whiteboard-sprint",
    name: "Sprint Planning — Whiteboard",
    category: "whiteboard",
    type: "whiteboard",
    tags: ["whiteboard", "sprint", "planning", "team"],
    width: 2400,
    height: 1600,
    build: () => {
      const cols = ["To do", "In progress", "Review", "Done"]
      const notes: string[][] = [
        ["User research recap", "Empty states audit", "Icon set refresh"],
        ["Onboarding flow v3", "Billing page cleanup"],
        ["Dark mode contrast", "Export dialog copy"],
        ["Autosave shipped ✓", "Style guide v2 ✓"],
      ]
      const els: DesignElement[] = [
        txt("Sprint 12 — Planning", { x: 100, y: 80, w: 900, h: 80, size: 64, font: F.cond, weight: 600, color: "#1f2937" }),
        txt("drag the notes as work moves across", { x: 104, y: 170, w: 900, h: 44, size: 30, font: F.hand, weight: 400, color: "#6b7280" }),
      ]
      const stickyColors = ["#fde68a", "#bbf7d0", "#fbcfe8", "#e9d5ff"]
      cols.forEach((c, ci) => {
        const x = 100 + ci * 560
        els.push(txt(c, { x, y: 300, w: 300, h: 60, size: 44, weight: 600, color: "#374151" }))
        els.push(rect({ x, y: 380, w: 480, h: 1100, fill: "#ffffff", stroke: "#e5e7eb", sw: 3, r: 16, opacity: 0.8 }))
        notes[ci]?.forEach((n, ni) => {
          els.push(note(n, { x: x + 40, y: 440 + ni * 320, w: 400, h: 260, color: stickyColors[(ci + ni) % 4], size: 34, rotation: ni % 2 ? -2 : 2 }))
        })
      })
      els.push(note("goal: demo on friday", { x: 100, y: 1400, w: 480, h: 140, color: "#fde047", size: 40 }))
      return doc("whiteboard", 2400, 1600, "#f8f7f4", [page("Board", solid("#f8f7f4"), els)])
    },
  },
]

/* ------------------------------ seed-facing helpers ------------------------------ */

/** Category ids used by TPLS (subset of TEMPLATE_CATEGORIES, plus aliases). */
export const TPL_CATEGORY_IDS = Array.from(new Set(TPLS.map((t) => t.category)))

/** Deterministic template count by category (for docs/logs). */
export function tplCountByCategory(): Record<string, number> {
  return TPLS.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})
}
