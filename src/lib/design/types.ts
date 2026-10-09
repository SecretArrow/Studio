/**
 * Studio — Design Document Model (v1)
 * ------------------------------------
 * This is the single source of truth for every editor in the platform.
 * All editors (canvas, presentation, video, photo, doc, whiteboard, website,
 * email) serialize their content as a `DesignDoc` and persist it in
 * Project.contentJson. Templates use the same shape.
 *
 * Rules:
 *  - Plain JSON only (no class instances, no functions) so it is portable.
 *  - Every element has a stable `id`, `type`, transform and styling props.
 *  - Array order of `elements` inside a page = z-order (last = topmost).
 *  - Never break old documents: bump SCHEMA_VERSION and write migrations in
 *    src/lib/design/migrate.ts when changing shapes.
 */

export const SCHEMA_VERSION = 1

export type DocType =
  | "canvas"
  | "presentation"
  | "video"
  | "photo"
  | "doc"
  | "whiteboard"
  | "website"
  | "email"
  | "chart"

export type ElementVisibility = "visible" | "hidden" | "locked"

export interface BackgroundSpec {
  type: "solid" | "gradient" | "image" | "transparent"
  color?: string
  gradient?: { from: string; to: string; angle: number }
  imageUrl?: string
}

export interface BaseElement {
  id: string
  /** stable unique id (uuid). */
  type: string
  name?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked?: boolean
  hidden?: boolean
  /** groupId this element belongs to (flat grouping model). */
  groupId?: string
  /** id of frame this element is clipped into (image placeholders). */
  frameId?: string
}

export interface TextElement extends BaseElement {
  type: "text"
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  underline: boolean
  strike: boolean
  uppercase: boolean
  align: "left" | "center" | "right"
  vAlign?: "top" | "middle" | "bottom"
  lineHeight: number
  letterSpacing: number
  color: string
  bgColor?: string
  listStyle?: "none" | "bullet" | "number"
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number }
  stroke?: { color: string; width: number }
  /** width auto-fit content when true */
  autoWidth?: boolean
}

export type ShapeVariant =
  | "rect"
  | "ellipse"
  | "triangle"
  | "star"
  | "polygon"
  | "line"
  | "arrow"
  | "heart"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "badge"
  | "blob"

export interface ShapeElement extends BaseElement {
  type: "shape"
  variant: ShapeVariant
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
  /** for line/arrow: end style */
  arrowHead?: "none" | "arrow" | "dot"
  dash?: number[] | null
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number }
}

export interface ImageFilters {
  brightness: number // 0..200 (100 = neutral)
  contrast: number
  saturation: number
  hue: number // -180..180
  blur: number // 0..20
  grayscale: number // 0..100
  sepia: number // 0..100
  invert: number // 0..100
  vignette: number // 0..100 (custom)
}

export const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  vignette: 0,
}

export interface ImageElement extends BaseElement {
  type: "image"
  src: string
  /** crop within source image (normalized 0..1) */
  crop?: { x: number; y: number; width: number; height: number }
  filters?: ImageFilters
  cornerRadius: number
  flipH?: boolean
  flipV?: boolean
}

export interface IconElement extends BaseElement {
  type: "icon"
  icon: string // key inside src/lib/design/icons.ts set
  color: string
}

export interface ChartSeries {
  name: string
  color: string
  values: number[]
}

export interface ChartData {
  labels: string[]
  series: ChartSeries[]
}

export interface ChartElement extends BaseElement {
  type: "chart"
  chartType: "bar" | "column" | "line" | "area" | "pie" | "doughnut" | "progress"
  title?: string
  data: ChartData
  showLegend: boolean
  showGrid: boolean
  numberFormat?: string // e.g. "0", "0.0", "$0", "0%"
}

export interface TableElement extends BaseElement {
  type: "table"
  rows: string[][]
  headerRow: boolean
  fontFamily: string
  fontSize: number
  headerBg: string
  headerColor: string
  rowBg: string
  altRowBg: string
  borderColor: string
  color: string
}

export interface QrElement extends BaseElement {
  type: "qr"
  data: string
  fg: string
  bg: string
}

export interface MediaElement extends BaseElement {
  type: "media"
  mediaType: "video" | "audio"
  src: string
  poster?: string
  autoplay: boolean
  loop: boolean
  muted: boolean
  volume: number // 0..1
}

export interface FrameElement extends BaseElement {
  type: "frame"
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
  /** label shown on empty placeholder */
  label?: string
}

/** Group of elements (children referenced by groupId on members). */
export interface GroupElement extends BaseElement {
  type: "group"
  childIds: string[]
}

/* ---- Whiteboard-specific ---- */

export interface StickyElement extends BaseElement {
  type: "sticky"
  text: string
  color: string
  fontFamily: string
  fontSize: number
}

export interface FreehandElement extends BaseElement {
  type: "freehand"
  points: number[] // flattened [x1,y1,x2,y2,...] in doc coordinates
  stroke: string
  strokeWidth: number
  erase?: boolean
}

export interface ConnectorElement extends BaseElement {
  type: "connector"
  fromId?: string
  toId?: string
  points?: number[] // manual waypoints when not bound
  stroke: string
  strokeWidth: number
  arrowHead: "none" | "arrow" | "dot"
  dash?: number[] | null
  label?: string
}

/* ---- Website builder ---- */

export interface WebsiteSection {
  id: string
  kind:
    | "nav"
    | "hero"
    | "features"
    | "gallery"
    | "video"
    | "testimonials"
    | "pricing"
    | "faq"
    | "cta"
    | "contact"
    | "footer"
    | "richText"
    | "logos"
    | "stats"
  props: Record<string, unknown> // section-specific, validated by website module
}

export interface WebsiteConfig {
  siteName: string
  pages: { id: string; name: string; path: string; sections: WebsiteSection[] }[]
  theme: {
    primary: string
    accent: string
    background: string
    text: string
    headingFont: string
    bodyFont: string
    radius: number
  }
  seo: { title: string; description: string; favicon?: string; socialImage?: string }
  customCss?: string
}

/* ---- Email designer ---- */

export interface EmailBlock {
  id: string
  kind:
    | "heading"
    | "text"
    | "image"
    | "button"
    | "divider"
    | "spacer"
    | "social"
    | "columns"
    | "html"
  props: Record<string, unknown>
}

export interface EmailConfig {
  subject: string
  preheader: string
  backgroundColor: string
  contentBackground: string
  fontFamily: string
  textColor: string
  accentColor: string
  width: number // usually 600
  blocks: EmailBlock[]
}

/* ---- Video timeline ---- */

export interface VideoClip {
  id: string
  trackId: string
  kind: "video" | "audio" | "text" | "sticker" | "image"
  src?: string
  /** timeline position in ms */
  start: number
  duration: number
  /** trim within source in ms */
  inPoint: number
  outPoint: number
  speed: number
  volume: number // 0..1
  muted: boolean
  fadeIn: number
  fadeOut: number
  transitionIn?: "none" | "fade" | "slide"
  transitionOut?: "none" | "fade" | "slide"
  /** for text/sticker clips */
  element?: Partial<TextElement> | Record<string, unknown>
  name: string
}

export interface VideoTrack {
  id: string
  kind: "video" | "overlay" | "audio"
  name: string
  muted: boolean
  hidden: boolean
  height: number
}

export interface VideoConfig {
  canvas: { width: number; height: number; background: string }
  clips: VideoClip[]
  tracks: VideoTrack[]
  subtitles?: { start: number; end: number; text: string }[]
}

export type DesignElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | IconElement
  | ChartElement
  | TableElement
  | QrElement
  | MediaElement
  | FrameElement
  | GroupElement
  | StickyElement
  | FreehandElement
  | ConnectorElement

export interface PageModel {
  id: string
  name: string
  background: BackgroundSpec
  elements: DesignElement[]
  /** presentation presenter notes */
  notes?: string
  /** presentation transition */
  transition?: "none" | "fade" | "slide" | "zoom"
  /** video editor only: scene duration in ms */
  durationMs?: number
}

export interface DesignDoc {
  schemaVersion: number
  type: DocType
  width: number
  height: number
  /** default page background */
  background: BackgroundSpec
  pages: PageModel[]
  /** type-specific extras: website → WebsiteConfig, email → EmailConfig, video → VideoConfig */
  config?: WebsiteConfig | EmailConfig | VideoConfig | Record<string, unknown>
  meta?: Record<string, unknown>
}

/* ---------- factories (shared by all editors) ---------- */

let idCounter = 0
export function uid(prefix = "el"): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function defaultBackground(color = "#ffffff"): BackgroundSpec {
  return { type: "solid", color }
}

export function createPage(partial: Partial<PageModel> = {}): PageModel {
  return {
    id: uid("page"),
    name: partial.name ?? "Page",
    background: partial.background ?? defaultBackground(),
    elements: partial.elements ?? [],
    notes: partial.notes ?? "",
    transition: partial.transition ?? "none",
    durationMs: partial.durationMs ?? 5000,
  }
}

export function createDoc(type: DocType, width: number, height: number, name?: string): DesignDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    type,
    width,
    height,
    background: defaultBackground(type === "whiteboard" ? "#f8f7f4" : "#ffffff"),
    pages: [createPage({ name: type === "presentation" ? "Slide 1" : "Page 1" })],
    meta: name ? { name } : undefined,
  }
}

export function createText(partial: Partial<TextElement> & { x: number; y: number }): TextElement {
  return {
    id: uid("text"),
    type: "text",
    text: "Your text here",
    fontFamily: "Inter",
    fontSize: 48,
    fontWeight: 700,
    italic: false,
    underline: false,
    strike: false,
    uppercase: false,
    align: "left",
    vAlign: "top",
    lineHeight: 1.25,
    letterSpacing: 0,
    color: "#111827",
    width: 480,
    height: 60,
    rotation: 0,
    opacity: 1,
    autoWidth: false,
    ...partial,
  } as TextElement
}

export function createShape(
  partial: Partial<ShapeElement> & { x: number; y: number; variant: ShapeVariant },
): ShapeElement {
  return {
    id: uid("shape"),
    type: "shape",
    fill: "#8b5cf6",
    stroke: "transparent",
    strokeWidth: 0,
    cornerRadius: 8,
    width: 240,
    height: 240,
    rotation: 0,
    opacity: 1,
    arrowHead: partial.variant === "arrow" ? "arrow" : "none",
    dash: null,
    ...partial,
  } as ShapeElement
}

export function createImage(partial: Partial<ImageElement> & { x: number; y: number; src: string }): ImageElement {
  return {
    id: uid("img"),
    type: "image",
    width: 480,
    height: 320,
    rotation: 0,
    opacity: 1,
    cornerRadius: 0,
    filters: { ...DEFAULT_IMAGE_FILTERS },
    ...partial,
  } as ImageElement
}

export function createIcon(partial: Partial<IconElement> & { x: number; y: number; icon: string }): IconElement {
  return {
    id: uid("icon"),
    type: "icon",
    width: 96,
    height: 96,
    rotation: 0,
    opacity: 1,
    color: "#111827",
    ...partial,
  } as IconElement
}

export function createSticky(partial: Partial<StickyElement> & { x: number; y: number }): StickyElement {
  return {
    id: uid("sticky"),
    type: "sticky",
    text: "Note…",
    color: "#fde68a",
    fontFamily: "Caveat",
    fontSize: 28,
    width: 220,
    height: 220,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as StickyElement
}

export function createFreehand(partial: Partial<FreehandElement> & { x: number; y: number; points: number[] }): FreehandElement {
  return {
    id: uid("pen"),
    type: "freehand",
    stroke: "#111827",
    strokeWidth: 4,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as FreehandElement
}

export function createConnector(partial: Partial<ConnectorElement> & { x: number; y: number }): ConnectorElement {
  return {
    id: uid("conn"),
    type: "connector",
    width: 160,
    height: 0,
    rotation: 0,
    opacity: 1,
    stroke: "#111827",
    strokeWidth: 3,
    arrowHead: "arrow",
    dash: null,
    ...partial,
  } as ConnectorElement
}

export function createChart(partial: Partial<ChartElement> & { x: number; y: number }): ChartElement {
  return {
    id: uid("chart"),
    type: "chart",
    chartType: "column",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr"],
      series: [
        { name: "Revenue", color: "#8b5cf6", values: [42, 61, 55, 78] },
        { name: "Costs", color: "#f59e0b", values: [30, 38, 35, 44] },
      ],
    },
    showLegend: true,
    showGrid: true,
    width: 560,
    height: 360,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as ChartElement
}

export function createTable(partial: Partial<TableElement> & { x: number; y: number }): TableElement {
  return {
    id: uid("table"),
    type: "table",
    rows: [
      ["Feature", "Free", "Pro"],
      ["Projects", "Unlimited", "Unlimited"],
      ["Export", "All formats", "All formats"],
    ],
    headerRow: true,
    fontFamily: "Inter",
    fontSize: 20,
    headerBg: "#8b5cf6",
    headerColor: "#ffffff",
    rowBg: "#ffffff",
    altRowBg: "#f3f0ff",
    borderColor: "#e5e7eb",
    color: "#111827",
    width: 640,
    height: 220,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as TableElement
}

export function createQr(partial: Partial<QrElement> & { x: number; y: number; data: string }): QrElement {
  return {
    id: uid("qr"),
    type: "qr",
    fg: "#111827",
    bg: "#ffffff",
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    ...partial,
  } as QrElement
}

/* ---------- utilities ---------- */

export function findElement(doc: DesignDoc, elementId: string): DesignElement | undefined {
  for (const page of doc.pages) {
    const el = page.elements.find((e) => e.id === elementId)
    if (el) return el
  }
  return undefined
}

export function mapElements(doc: DesignDoc, fn: (el: DesignElement) => DesignElement): DesignDoc {
  return {
    ...doc,
    pages: doc.pages.map((page) => ({ ...page, elements: page.elements.map(fn) })),
  }
}

export function elementBounds(el: DesignElement): { x: number; y: number; width: number; height: number } {
  return { x: el.x, y: el.y, width: el.width, height: el.height }
}

export function isTextLike(el: DesignElement): el is TextElement | StickyElement {
  return el.type === "text" || el.type === "sticky"
}
