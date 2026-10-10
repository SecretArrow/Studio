/**
 * Seasonal template helpers — shared builders for holiday packs.
 * ---------------------------------------------------------------
 * Used by seasonal-lebaran / seasonal-pengajian / seasonal-newyear /
 * seasonal-nasional / seasonal-festive / seasonal-sale modules.
 * All content is original (CC0). Elements are REAL editable primitives.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  gradient,
  img,
  page,
  rect,
  rule,
  shp,
  txt,
  type BackgroundSpec,
  type DesignDoc,
  type DesignElement,
} from "../template-builder"

export const IG = 1080
export const STORY_W = 1080
export const STORY_H = 1920
export const A4W = 1240
export const A4H = 1754
/** Spanduk / horizontal banner 3:1 */
export const BANNER_W = 1920
export const BANNER_H = 640

export const GOLD = "#d4a017"
export const GOLD_SOFT = "#fde68a"
export const EMERALD = "#047857"
export const EMERALD_DEEP = "#064e3b"
export const NIGHT = "#0f172a"
export const MERAH = "#c1121f"
export const MERAH_DEEP = "#7f1d1d"
export const CREAM = "#fdf8ef"

/* ------------------------------ composition helpers ------------------------------ */

/** Decorative dotted-corner frame (Islamic ornament vibe). Returns corner marks for one rect area. */
export function cornerOrnaments(x: number, y: number, w: number, h: number, color = GOLD): DesignElement[] {
  const s = 26
  const mk = (cx: number, cy: number): DesignElement[] => [
    rect({ x: cx - s / 2, y: cy - 2, w: s, h: 4, fill: color, r: 2 }),
    rect({ x: cx - 2, y: cy - s / 2, w: 4, h: s, fill: color, r: 2 }),
  ]
  return [
    ...mk(x, y),
    ...mk(x + w, y),
    ...mk(x, y + h),
    ...mk(x + w, y + h),
  ]
}

/** Scattered stars / sparkles decoration inside a region. */
export function starScatter(count: number, x: number, y: number, w: number, h: number, color = GOLD_SOFT, seed = 7): DesignElement[] {
  const els: DesignElement[] = []
  let s = seed
  const rnd = (n: number) => {
    s = (s * 9301 + 49297) % 233280
    return Math.floor((s / 233280) * n)
  }
  for (let i = 0; i < count; i++) {
    const size = 18 + rnd(30)
    els.push(
      shp("star", {
        x: x + rnd(w - size),
        y: y + rnd(h - size),
        w: size,
        h: size,
        fill: color,
        opacity: 0.35 + rnd(50) / 100,
        rotation: rnd(90),
      }),
    )
  }
  return els
}

/** Crescent moon built from two ellipses (editable shapes, not an image). */
export function crescentShape(x: number, y: number, size: number, color: string, bg: string): DesignElement[] {
  return [
    ellipse({ x, y, w: size, h: size, fill: color }),
    ellipse({ x: x - size * 0.18, y: y - size * 0.06, w: size * 0.92, h: size * 0.92, fill: bg }),
  ]
}

/** Ketupat hanging trio (image assets, editable/movable). */
export function ketupatRow(x: number, y: number, scale = 1): DesignElement[] {
  return [
    img(asset("ketupat-duo"), { x, y, w: 240 * scale, h: 240 * scale }),
  ]
}

/** Vertical hanging strings with ketupats for story borders. */
export function hangingKetupat(x: number, y: number, count: number, scale = 1): DesignElement[] {
  const els: DesignElement[] = []
  for (let i = 0; i < count; i++) {
    const w = 150 * scale
    els.push(img(asset("ketupat"), { x: x + i * (w + 30 * scale), y, w, h: w * 1.2, rotation: i % 2 === 0 ? -4 : 4 }))
  }
  return els
}

/* ------------------------------ greeting post family ------------------------------ */

export interface GreetStyle {
  slug: string
  name: string
  bg: BackgroundSpec
  band?: string
  titleColor: string
  subColor: string
  detailColor: string
  titleFont: string
  titleSize: number
  upper?: boolean
  ls?: number
  decorate: (els: DesignElement[]) => void
}

/**
 * Build a square greeting post (1080×1080) from a style + content tuple.
 * Layout: small kicker, big greeting, sub line, detail block at bottom.
 */
export function greetingPost(
  style: GreetStyle,
  c: { kicker: string; title: string; sub: string; detail: string },
): DesignDoc {
  const els: DesignElement[] = [
    txt(c.kicker, {
      x: 0, y: 208, w: IG, h: 44, size: 26, font: F.sans, weight: 600,
      color: style.subColor, align: "center", upper: true, ls: 6,
    }),
    txt(c.title, {
      x: 90, y: 286, w: IG - 180, h: 420, size: style.titleSize, font: style.titleFont, weight: 800,
      color: style.titleColor, align: "center", vAlign: "middle", upper: style.upper, ls: style.ls ?? 0, lh: 1.08,
    }),
    txt(c.sub, {
      x: 140, y: 736, w: IG - 280, h: 60, size: 30, font: F.body, weight: 400,
      color: style.subColor, align: "center", italic: true,
    }),
  ]
  if (style.band) {
    els.unshift(rect({ x: 0, y: 856, w: IG, h: 224, fill: style.band, r: 0 }))
  }
  // detail block bottom
  els.push(
    rule(style.band ? 390 : 440, 906, 200, style.detailColor, 5),
    txt(c.detail, {
      x: 60, y: 936, w: IG - 120, h: 110, size: 26, font: F.sans, weight: 500,
      color: style.detailColor, align: "center",
    }),
  )
  style.decorate(els)
  return doc("canvas", IG, IG, style.bg, [page(style.slug, style.bg, els)])
}

/* ------------------------------ event poster family (pengajian & open house) ------------------------------ */

export interface EventInfo {
  kicker: string
  title: string
  speakerLabel: string
  speaker: string
  dateLine: string
  timeLine: string
  placeLine: string
  note: string
  footer: string
}

/**
 * A4 portrait event poster with info rows (date/time/place) + speaker card.
 * Palette: bg + primary + accent + ink. Decoration hook for pack-specific art.
 */
export function eventPoster(
  style: {
    slug: string
    bg: BackgroundSpec
    headerFill: string
    headerInk: string
    cardFill: string
    cardInk: string
    accent: string
    ink: string
    titleFont?: string
    titleSize?: number
  },
  info: EventInfo,
  decorateHeader: (els: DesignElement[]) => void,
): DesignDoc {
  const rows: [string, string][] = [
    ["📅", info.dateLine],
    ["🕐", info.timeLine],
    ["📍", info.placeLine],
  ]
  const rowEls: DesignElement[] = []
  rows.forEach(([icon, line], i) => {
    const y = 1180 + i * 110
    rowEls.push(
      ellipse({ x: 90, y, w: 76, h: 76, fill: style.accent }),
      txt(icon, { x: 90, y, w: 76, h: 76, size: 34, align: "center", vAlign: "middle", font: F.sans }),
      txt(line, { x: 196, y, w: A4W - 290, h: 76, size: 31, font: F.sans, weight: 600, color: style.ink, vAlign: "middle" }),
    )
  })
  return doc("canvas", A4W, A4H, style.bg, [
    page(style.slug, style.bg, [
      // header band
      rect({ x: 0, y: 0, w: A4W, h: 560, fill: style.headerFill, r: 0 }),
      ...(() => {
        const d: DesignElement[] = []
        decorateHeader(d)
        return d
      })(),
      txt(info.kicker, { x: 0, y: 92, w: A4W, h: 44, size: 26, font: F.sans, weight: 600, color: style.headerInk, align: "center", upper: true, ls: 8, opacity: 0.92 }),
      txt(info.title, {
        x: 80, y: 156, w: A4W - 160, h: 300, size: style.titleSize ?? 74, font: style.titleFont ?? F.pop,
        weight: 800, color: style.headerInk, align: "center", vAlign: "middle", lh: 1.1,
      }),
      // speaker card
      rect({ x: 110, y: 640, w: A4W - 220, h: 420, fill: style.cardFill, r: 24 }),
      txt(info.speakerLabel, { x: 150, y: 686, w: A4W - 300, h: 44, size: 25, font: F.sans, weight: 700, color: style.accent, align: "center", upper: true, ls: 5 }),
      txt(info.speaker, { x: 150, y: 742, w: A4W - 300, h: 200, size: 54, font: F.serif, weight: 700, color: style.cardInk, align: "center", vAlign: "middle", lh: 1.15 }),
      rule(470, 986, 300, style.accent, 6),
      // info rows
      ...rowEls,
      // note + footer
      txt(info.note, { x: 110, y: 1536, w: A4W - 220, h: 90, size: 27, font: F.body, weight: 400, color: style.ink, align: "center", italic: true, lh: 1.35 }),
      txt(info.footer, { x: 0, y: 1664, w: A4W, h: 50, size: 25, font: F.sans, weight: 600, color: style.accent, align: "center" }),
    ]),
  ])
}

/* ------------------------------ banner family ------------------------------ */

/**
 * Horizontal spanduk (1920×640) — header left, message center, detail right.
 */
export function banner(
  style: { slug: string; bg: BackgroundSpec; strip: string; ink: string; accent: string; sub: string },
  c: { left: string; main: string; sub: string; right: string },
  decorate: (els: DesignElement[]) => void,
): DesignDoc {
  const els: DesignElement[] = [
    rect({ x: 0, y: 0, w: BANNER_W, h: 26, fill: style.strip, r: 0 }),
    rect({ x: 0, y: BANNER_H - 26, w: BANNER_W, h: 26, fill: style.strip, r: 0 }),
    txt(c.left, { x: 90, y: 110, w: 460, h: 110, size: 40, font: F.sans, weight: 700, color: style.accent, upper: true, ls: 4 }),
    txt(c.main, { x: 560, y: 90, w: 820, h: 250, size: 96, font: F.display, weight: 400, color: style.ink, upper: true, lh: 1.02 }),
    txt(c.sub, { x: 560, y: 380, w: 820, h: 130, size: 34, font: F.body, weight: 400, color: style.sub, lh: 1.3 }),
    txt(c.right, { x: 1430, y: 110, w: 400, h: 420, size: 30, font: F.sans, weight: 600, color: style.accent, align: "right", vAlign: "middle", lh: 1.5 }),
  ]
  decorate(els)
  return doc("canvas", BANNER_W, BANNER_H, style.bg, [page(style.slug, style.bg, els)])
}

/* ------------------------------ story family ------------------------------ */

/**
 * Vertical story (1080×1920) — top kicker, huge center message, bottom detail card.
 */
export function storyTemplate(
  style: { slug: string; bg: BackgroundSpec; ink: string; sub: string; card: string; cardInk: string; accent: string; font?: string },
  c: { top: string; main: string; sub: string; card: string },
  decorate: (els: DesignElement[]) => void,
): DesignDoc {
  const els: DesignElement[] = [
    txt(c.top, { x: 90, y: 170, w: STORY_W - 180, h: 50, size: 30, font: F.sans, weight: 600, color: style.sub, upper: true, ls: 6 }),
    txt(c.main, {
      x: 70, y: 560, w: STORY_W - 140, h: 520, size: 118, font: style.font ?? F.display, weight: 400,
      color: style.ink, align: "center", vAlign: "middle", lh: 1.02, upper: true,
    }),
    txt(c.sub, { x: 130, y: 1120, w: STORY_W - 260, h: 90, size: 34, font: F.body, weight: 400, color: style.sub, align: "center", italic: true, lh: 1.3 }),
    rect({ x: 90, y: 1420, w: STORY_W - 180, h: 330, fill: style.card, r: 28 }),
    txt(c.card, { x: 150, y: 1470, w: STORY_W - 300, h: 230, size: 32, font: F.sans, weight: 600, color: style.cardInk, align: "center", vAlign: "middle", lh: 1.45 }),
  ]
  decorate(els)
  return doc("canvas", STORY_W, STORY_H, style.bg, [page(style.slug, style.bg, els)])
}

/** Gradient shortcut re-export for pack modules. */
export const grad = gradient
