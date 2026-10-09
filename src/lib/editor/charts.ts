/**
 * Chart layout — pure computation producing primitive shapes that both the
 * Konva stage and the headless export renderer draw identically.
 */

import type { ChartElement } from "@/lib/design/types"

export type ChartPrimitive =
  | { kind: "rect"; x: number; y: number; width: number; height: number; fill?: string; stroke?: string; strokeWidth?: number; cornerRadius?: number }
  | { kind: "path"; d: string; fill?: string; stroke?: string; strokeWidth?: number }
  | { kind: "polyline"; points: number[]; stroke: string; strokeWidth: number }
  | { kind: "text"; text: string; x: number; y: number; size: number; color: string; align: "left" | "center" | "right"; weight?: number }
  | { kind: "hline"; y: number; x1: number; x2: number; stroke: string; dash?: number[] }

const PAD = { left: 46, right: 18, top: 18, bottom: 30 }
const GRID_LINES = 4

function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

function fmt(v: number): string {
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v))
  return String(Math.round(v * 100) / 100)
}

/** Layout a chart into drawable primitives in the element's local 0..w × 0..h box. */
export function layoutChart(chart: ChartElement): ChartPrimitive[] {
  const { width: w, height: h, data } = chart
  const items: ChartPrimitive[] = []
  const labels = data.labels.length > 0 ? data.labels : ["—"]
  const series = data.series.slice(0, 8)
  const titleSpace = chart.title ? 26 : 0
  const legendSpace = chart.showLegend && series.length > 0 && chart.chartType !== "progress" ? 26 : 0

  const top = PAD.top + titleSpace
  const bottom = h - PAD.bottom - legendSpace
  const left = PAD.left
  const right = w - PAD.right
  const plotW = Math.max(10, right - left)
  const plotH = Math.max(10, bottom - top)

  if (chart.title) {
    items.push({ kind: "text", text: chart.title, x: w / 2, y: PAD.top + 4, size: Math.min(20, w / 24), color: "#374151", align: "center", weight: 600 })
  }

  const allValues = series.flatMap((s) => s.values)
  const maxVal = niceMax(Math.max(...allValues, 1))
  const palette = ["#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1"]

  /* ---- grid + y labels for cartesian charts ---- */
  const cartesian = chart.chartType === "column" || chart.chartType === "line" || chart.chartType === "area"
  const horizontalBars = chart.chartType === "bar"
  if ((cartesian || horizontalBars) && chart.showGrid) {
    for (let i = 0; i <= GRID_LINES; i += 1) {
      const t = i / GRID_LINES
      const y = bottom - t * plotH
      items.push({ kind: "hline", y, x1: left, x2: right, stroke: "#e5e7eb" })
      items.push({ kind: "text", text: fmt(maxVal * t), x: left - 8, y: y + 4, size: 11, color: "#9ca3af", align: "right" })
    }
  }

  if (cartesian) {
    const band = plotW / labels.length
    const groupW = band * 0.7
    const barW = series.length > 0 ? groupW / series.length : groupW
    labels.forEach((label, li) => {
      const bandX = left + li * band
      items.push({ kind: "text", text: label, x: bandX + band / 2, y: bottom + 16, size: 11, color: "#6b7280", align: "center" })
      series.forEach((s, si) => {
        const v = s.values[li] ?? 0
        const barH = (v / maxVal) * plotH
        const x = bandX + (band - groupW) / 2 + si * barW
        if (chart.chartType === "column") {
          items.push({ kind: "rect", x, y: bottom - barH, width: Math.max(2, barW - Math.min(4, barW * 0.2)), height: barH, fill: s.color || palette[si % palette.length] })
        }
      })
    })
    if (chart.chartType === "line" || chart.chartType === "area") {
      series.forEach((s) => {
        const pts: number[] = []
        labels.forEach((_, li) => {
          const v = s.values[li] ?? 0
          pts.push(left + li * band + band / 2, bottom - (v / maxVal) * plotH)
        })
        if (chart.chartType === "area") {
          const d = `M${pts[0]} ${bottom}L${chunkToPath(pts)}L${pts[pts.length - 2]} ${bottom}Z`
          items.push({ kind: "path", d, fill: withAlpha(s.color || palette[0], 0.25) })
        }
        items.push({ kind: "polyline", points: pts, stroke: s.color || palette[0], strokeWidth: 3 })
        for (let i = 0; i < pts.length; i += 2) {
          items.push({ kind: "rect", x: pts[i] - 3.5, y: pts[i + 1] - 3.5, width: 7, height: 7, fill: s.color || palette[0], cornerRadius: 3.5 })
        }
      })
    }
  }

  if (horizontalBars) {
    const band = plotH / labels.length
    const barH = Math.min(band * 0.6, 36)
    labels.forEach((label, li) => {
      const bandY = top + li * band
      items.push({ kind: "text", text: label, x: left - 8, y: bandY + band / 2 + 4, size: 11, color: "#6b7280", align: "right" })
      series.forEach((s, si) => {
        const v = s.values[li] ?? 0
        const barW = (v / maxVal) * plotW
        const y = bandY + (band - barH) / 2 + (si - (series.length - 1) / 2) * Math.min(barH * 0.5, 8)
        items.push({ kind: "rect", x: left, y, width: barW, height: Math.max(3, barH / Math.max(1, series.length) - 2), fill: s.color || palette[si % palette.length] })
      })
    })
  }

  if (chart.chartType === "pie" || chart.chartType === "doughnut") {
    const cx = left + plotW / 2
    const cy = top + plotH / 2
    const r = Math.min(plotW, plotH) / 2 - 8
    const rInner = chart.chartType === "doughnut" ? r * 0.58 : 0
    const source = series[0] ?? { name: "", color: palette[0], values: [] }
    const values = labels.map((_, li) => Math.max(0, source.values[li] ?? 0))
    const total = values.reduce((a, b) => a + b, 0) || 1
    let angle = -Math.PI / 2
    values.forEach((v, li) => {
      const sweep = (v / total) * Math.PI * 2
      if (sweep > 0.0001) {
        const d = sectorPathD(cx, cy, r, rInner, angle, angle + sweep)
        items.push({ kind: "path", d, fill: source.color || palette[0], stroke: "#ffffff", strokeWidth: 2 })
      }
      angle += sweep
    })
    if (chart.showLegend && series.length > 0) {
      // legend shows slice labels for pie using first series
      labels.forEach((label, li) => {
        const lx = left + (li % 4) * (plotW / 4)
        const ly = h - legendSpace + 12 + Math.floor(li / 4) * 16
        items.push({ kind: "rect", x: lx, y: ly - 8, width: 10, height: 10, fill: source.color || palette[0], cornerRadius: 2 })
        items.push({ kind: "text", text: label, x: lx + 15, y: ly + 1, size: 11, color: "#6b7280", align: "left" })
      })
    }
  } else if (chart.showLegend && series.length > 0) {
    const totalW = plotW
    const per = Math.min(totalW / series.length, 150)
    const startX = left + (plotW - per * series.length) / 2
    series.forEach((s, si) => {
      const lx = startX + si * per
      items.push({ kind: "rect", x: lx, y: h - legendSpace + 10, width: 12, height: 12, fill: s.color || palette[si % palette.length], cornerRadius: 3 })
      items.push({ kind: "text", text: s.name, x: lx + 17, y: h - legendSpace + 20, size: 11, color: "#6b7280", align: "left" })
    })
  }

  if (chart.chartType === "progress") {
    const source = series[0]
    const v = source ? source.values[0] ?? 0 : 0
    const pct = Math.max(0, Math.min(100, maxVal > 0 ? (v / maxVal) * 100 : 0))
    const barH = Math.min(28, plotH)
    const y = top + plotH / 2 - barH / 2
    items.push({ kind: "rect", x: left, y, width: plotW, height: barH, fill: "#e5e7eb", cornerRadius: barH / 2 })
    items.push({ kind: "rect", x: left, y, width: Math.max(barH, (pct / 100) * plotW), height: barH, fill: source?.color || "#8b5cf6", cornerRadius: barH / 2 })
    items.push({ kind: "text", text: `${Math.round(pct)}%`, x: left + plotW / 2, y: y + barH / 2 + 5, size: Math.min(16, barH * 0.6), color: "#ffffff", align: "center", weight: 700 })
  }

  return items
}

function chunkToPath(pts: number[]): string {
  let d = ""
  for (let i = 0; i < pts.length; i += 2) {
    d += `${i === 0 ? "M" : "L"}${round2(pts[i])} ${round2(pts[i + 1])}`
  }
  return d
}

function sectorPathD(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const p0 = { x: cx + rOuter * Math.cos(a0), y: cy + rOuter * Math.sin(a0) }
  const p1 = { x: cx + rOuter * Math.cos(a1), y: cy + rOuter * Math.sin(a1) }
  if (rInner <= 0.01) {
    return `M${round2(cx)} ${round2(cy)}L${round2(p0.x)} ${round2(p0.y)}A${round2(rOuter)} ${round2(rOuter)} 0 ${large} 1 ${round2(p1.x)} ${round2(p1.y)}Z`
  }
  const p2 = { x: cx + rInner * Math.cos(a1), y: cy + rInner * Math.sin(a1) }
  const p3 = { x: cx + rInner * Math.cos(a0), y: cy + rInner * Math.sin(a0) }
  return `M${round2(p0.x)} ${round2(p0.y)}A${round2(rOuter)} ${round2(rOuter)} 0 ${large} 1 ${round2(p1.x)} ${round2(p1.y)}L${round2(p2.x)} ${round2(p2.y)}A${round2(rInner)} ${round2(rInner)} 0 ${large} 0 ${round2(p3.x)} ${round2(p3.y)}Z`
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace("#", "")
  if (m.length !== 6) return hex
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
