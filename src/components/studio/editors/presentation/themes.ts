/**
 * Presentation design system: theme presets, background gradients and
 * slide layout presets. Pure data + factories — no React.
 */

import type { BackgroundSpec, DesignElement, TextElement } from "@/lib/design/types"
import { createText } from "@/lib/design/types"

/* ------------------------------ themes ------------------------------ */

export interface SlideTheme {
  id: string
  name: string
  background: BackgroundSpec
  headingFont: string
  bodyFont: string
  headingColor: string
  bodyColor: string
  accent: string
}

export const SLIDE_THEMES: SlideTheme[] = [
  {
    id: "violet",
    name: "Studio Violet",
    background: { type: "gradient", gradient: { from: "#f5f3ff", to: "#ede9fe", angle: 160 } },
    headingFont: "Poppins",
    bodyFont: "Inter",
    headingColor: "#4c1d95",
    bodyColor: "#3f3f46",
    accent: "#8b5cf6",
  },
  {
    id: "editorial",
    name: "Editorial",
    background: { type: "solid", color: "#fafaf9" },
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    headingColor: "#1c1917",
    bodyColor: "#57534e",
    accent: "#d97706",
  },
  {
    id: "dark-stage",
    name: "Dark Stage",
    background: { type: "solid", color: "#18181b" },
    headingFont: "Oswald",
    bodyFont: "Inter",
    headingColor: "#fafafa",
    bodyColor: "#d4d4d8",
    accent: "#a78bfa",
  },
  {
    id: "sunrise",
    name: "Sunrise",
    background: { type: "gradient", gradient: { from: "#fff7ed", to: "#ffedd5", angle: 135 } },
    headingFont: "Merriweather",
    bodyFont: "Inter",
    headingColor: "#7c2d12",
    bodyColor: "#57534e",
    accent: "#ea580c",
  },
  {
    id: "forest",
    name: "Forest",
    background: { type: "gradient", gradient: { from: "#f0fdf4", to: "#dcfce7", angle: 120 } },
    headingFont: "Poppins",
    bodyFont: "Inter",
    headingColor: "#14532d",
    bodyColor: "#374151",
    accent: "#16a34a",
  },
  {
    id: "mono",
    name: "Mono",
    background: { type: "solid", color: "#ffffff" },
    headingFont: "Bebas Neue",
    bodyFont: "Inter",
    headingColor: "#111827",
    bodyColor: "#4b5563",
    accent: "#6b7280",
  },
]

export function getTheme(id: string | undefined): SlideTheme | undefined {
  return SLIDE_THEMES.find((t) => t.id === id)
}

/**
 * Restyle one page with a theme: page background + text fonts/colors.
 * Decorative shapes / images are left untouched (honest, non-destructive).
 */
export function applyThemeToElements(elements: DesignElement[], theme: SlideTheme): DesignElement[] {
  return elements.map((el) => {
    if (el.type !== "text") return el
    const t = el as TextElement
    const isHeading = t.fontSize >= 32
    return {
      ...t,
      fontFamily: isHeading ? theme.headingFont : theme.bodyFont,
      color: isHeading ? theme.headingColor : theme.bodyColor,
    }
  })
}

/* ------------------------------ gradients ------------------------------ */

export interface GradientPreset {
  name: string
  from: string
  to: string
  angle: number
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "Violet mist", from: "#f5f3ff", to: "#ddd6fe", angle: 160 },
  { name: "Plum", from: "#8b5cf6", to: "#3b0764", angle: 150 },
  { name: "Sunrise", from: "#fff7ed", to: "#fdba74", angle: 135 },
  { name: "Ember", from: "#fb923c", to: "#7c2d12", angle: 150 },
  { name: "Mint", from: "#ecfdf5", to: "#a7f3d0", angle: 120 },
  { name: "Rose", from: "#fff1f2", to: "#fecdd3", angle: 140 },
  { name: "Slate", from: "#f8fafc", to: "#cbd5e1", angle: 150 },
  { name: "Night", from: "#312e81", to: "#09090b", angle: 165 },
  { name: "Sand", from: "#fefce8", to: "#fde68a", angle: 130 },
  { name: "Ocean teal", from: "#f0fdfa", to: "#99f6e4", angle: 125 },
]

export function gradientBackground(p: GradientPreset): BackgroundSpec {
  return { type: "gradient", gradient: { from: p.from, to: p.to, angle: p.angle } }
}

/* ------------------------------ layouts ------------------------------ */

export type LayoutKind = "title" | "title-content" | "two-columns" | "blank"

export const LAYOUT_KINDS: { id: LayoutKind; label: string; hint: string }[] = [
  { id: "title", label: "Title slide", hint: "Big centered title + subtitle" },
  { id: "title-content", label: "Title + content", hint: "Heading and a bullet list" },
  { id: "two-columns", label: "Two columns", hint: "Heading and two text columns" },
  { id: "blank", label: "Blank", hint: "Nothing — start fresh" },
]

/**
 * Placeholder text boxes for a layout, sized relative to the slide so both
 * 16:9 (1920×1080) and 4:3 (1440×1080) documents look right.
 */
export function layoutElements(kind: LayoutKind, docW: number, docH: number, theme?: SlideTheme): TextElement[] {
  if (kind === "blank") return []
  const s = docW / 1920 // scale factor vs the reference 16:9 slide
  const headingFont = theme?.headingFont ?? "Poppins"
  const bodyFont = theme?.bodyFont ?? "Inter"
  const headingColor = theme?.headingColor ?? "#1c1917"
  const bodyColor = theme?.bodyColor ?? "#3f3f46"
  const accent = theme?.accent ?? "#8b5cf6"
  const W = docW
  const H = docH

  if (kind === "title") {
    return [
      createText({
        text: "Your title here",
        name: "Title",
        x: W * 0.1,
        y: H * 0.36,
        width: W * 0.8,
        height: Math.round(110 * s),
        fontSize: Math.round(84 * s),
        fontWeight: 700,
        fontFamily: headingFont,
        color: headingColor,
        align: "center",
        vAlign: "top",
      }),
      createText({
        text: "Add a subtitle",
        name: "Subtitle",
        x: W * 0.2,
        y: H * 0.55,
        width: W * 0.6,
        height: Math.round(48 * s),
        fontSize: Math.round(32 * s),
        fontWeight: 400,
        fontFamily: bodyFont,
        color: accent,
        align: "center",
      }),
    ]
  }

  if (kind === "title-content") {
    return [
      createText({
        text: "Slide heading",
        name: "Heading",
        x: W * 0.08,
        y: H * 0.1,
        width: W * 0.84,
        height: Math.round(80 * s),
        fontSize: Math.round(52 * s),
        fontWeight: 700,
        fontFamily: headingFont,
        color: headingColor,
      }),
      createText({
        text: "First point goes here\nSecond point\nThird point",
        name: "Body",
        x: W * 0.08,
        y: H * 0.32,
        width: W * 0.84,
        height: Math.round(360 * s),
        fontSize: Math.round(30 * s),
        fontWeight: 400,
        fontFamily: bodyFont,
        color: bodyColor,
        lineHeight: 1.5,
        listStyle: "bullet",
      }),
    ]
  }

  // two-columns
  return [
    createText({
      text: "Slide heading",
      name: "Heading",
      x: W * 0.08,
      y: H * 0.1,
      width: W * 0.84,
      height: Math.round(80 * s),
      fontSize: Math.round(52 * s),
      fontWeight: 700,
      fontFamily: headingFont,
      color: headingColor,
    }),
    createText({
      text: "Left column text",
      name: "Left column",
      x: W * 0.08,
      y: H * 0.32,
      width: W * 0.4,
      height: Math.round(360 * s),
      fontSize: Math.round(26 * s),
      fontWeight: 400,
      fontFamily: bodyFont,
      color: bodyColor,
      lineHeight: 1.5,
    }),
    createText({
      text: "Right column text",
      name: "Right column",
      x: W * 0.52,
      y: H * 0.32,
      width: W * 0.4,
      height: Math.round(360 * s),
      fontSize: Math.round(26 * s),
      fontWeight: 400,
      fontFamily: bodyFont,
      color: bodyColor,
      lineHeight: 1.5,
    }),
  ]
}
