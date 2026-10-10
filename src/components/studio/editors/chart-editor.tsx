"use client"

/**
 * Chart Editor — data-driven graphics with a live chart.js visualization.
 * Document model: DesignDoc type "chart" holding one ChartElement (+ optional
 * title text element). Data edits update the chart immediately (data-linked).
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2"
import { jsPDF } from "jspdf"
import Papa from "papaparse"
import type { EditorHandle, EditorProps } from "./types"
import type { ChartElement, ChartData, DesignDoc, TextElement } from "@/lib/design/types"
import { createText, uid } from "@/lib/design/types"
import { SWATCH_PALETTES } from "@/lib/design/presets"
import { renderDocToCanvas } from "./stub-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Table2, Plus, Trash2, Download, ClipboardPaste, Palette, Type as TypeIcon } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const CHART_TYPES: { id: ChartElement["chartType"]; label: string }[] = [
  { id: "column", label: "Column" },
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "pie", label: "Pie" },
  { id: "doughnut", label: "Doughnut" },
  { id: "progress", label: "Progress" },
]

function defaultChart(): ChartElement {
  return {
    id: uid("chart"),
    type: "chart",
    chartType: "column",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { name: "Revenue", color: "#8b5cf6", values: [120, 150, 180, 210] },
        { name: "Costs", color: "#f59e0b", values: [80, 90, 100, 110] },
      ],
    },
    showLegend: true,
    showGrid: true,
    x: 80,
    y: 120,
    width: 920,
    height: 640,
    rotation: 0,
    opacity: 1,
  }
}

export const ChartEditor = forwardRef<import("./types").EditorHandle, EditorProps>(function ChartEditor(
  { project, initialDoc, role, onDocChange, registerHandle },
  _ref,
) {
  const canEdit = role === "owner" || role === "editor"
  const { toast } = useToast()
  const [doc, setDoc] = useState<DesignDoc>(() => initialDoc.type === "chart" ? initialDoc : { ...initialDoc, type: "chart" })
  const dirty = useRef(false)

  useEffect(() => {
    if (!doc.pages[0]) return
    // nothing — placeholder for future sync
  }, [doc])

  const chartEl = useMemo<ChartElement | null>(() => {
    const page = doc.pages[0]
    return (page?.elements.find((e): e is ChartElement => e.type === "chart") ?? null)
  }, [doc])

  const titleEl = useMemo<TextElement | null>(() => {
    const page = doc.pages[0]
    return (page?.elements.find((e): e is TextElement => e.type === "text") ?? null)
  }, [doc])

  const commit = useCallback(
    (next: DesignDoc) => {
      setDoc(next)
      dirty.current = true
      onDocChange(next)
    },
    [onDocChange],
  )

  const patchChart = useCallback(
    (patch: Partial<ChartElement>) => {
      if (!chartEl || !canEdit) return
      const next: DesignDoc = {
        ...doc,
        pages: doc.pages.map((p) => ({
          ...p,
          elements: p.elements.map((e) => (e.id === chartEl.id ? ({ ...e, ...patch } as ChartElement) : e)),
        })),
      }
      commit(next)
    },
    [chartEl, canEdit, commit, doc],
  )

  const patchData = useCallback(
    (data: ChartData) => patchChart({ data }),
    [patchChart],
  )

  /* ---------------- title ---------------- */
  const [titleText, setTitleText] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setTitleText(titleEl?.text ?? ""), 0)
    return () => clearTimeout(t)
  }, [titleEl])

  const commitTitle = useCallback(
    (text: string) => {
      const page = doc.pages[0]
      if (!page) return
      let elements = [...page.elements]
      if (titleEl) {
        elements = elements.map((e) => (e.id === titleEl.id ? ({ ...e, text } as TextElement) : e))
      } else if (text.trim()) {
        elements.unshift(createText({ x: 80, y: 36, width: doc.width - 160, text, fontSize: 44, fontWeight: 800, align: "center", color: "#111827" }))
      }
      commit({ ...doc, pages: [{ ...page, elements }] })
    },
    [commit, doc, titleEl],
  )

  /* ---------------- data grid ---------------- */
  const grid = useMemo(() => {
    if (!chartEl) return null
    const { labels, series } = chartEl.data
    return { labels, series }
  }, [chartEl])

  const setLabel = useCallback(
    (i: number, value: string) => {
      if (!grid) return
      const labels = grid.labels.map((l, idx) => (idx === i ? value : l))
      patchData({ ...grid, labels })
    },
    [grid, patchData],
  )

  const addRow = useCallback(() => {
    if (!grid) return
    patchData({ labels: [...grid.labels, `Item ${grid.labels.length + 1}`], series: grid.series.map((s) => ({ ...s, values: [...s.values, 0] })) })
  }, [grid, patchData])

  const removeRow = useCallback(
    (i: number) => {
      if (!grid || grid.labels.length <= 1) return
      patchData({
        labels: grid.labels.filter((_, idx) => idx !== i),
        series: grid.series.map((s) => ({ ...s, values: s.values.filter((_, idx) => idx !== i) })),
      })
    },
    [grid, patchData],
  )

  const setValue = useCallback(
    (si: number, ri: number, raw: string) => {
      if (!grid) return
      const num = parseFloat(raw)
      const series = grid.series.map((s, idx) =>
        idx === si ? { ...s, values: s.values.map((v, vidx) => (vidx === ri ? (Number.isFinite(num) ? num : 0) : v)) } : s,
      )
      patchData({ ...grid, series })
    },
    [grid, patchData],
  )

  const addSeries = useCallback(() => {
    if (!grid) return
    const palette = SWATCH_PALETTES[0].colors
    patchData({
      ...grid,
      series: [...grid.series, { name: `Series ${grid.series.length + 1}`, color: palette[grid.series.length % palette.length], values: grid.labels.map(() => 0) }],
    })
  }, [grid, patchData])

  const removeSeries = useCallback(
    (si: number) => {
      if (!grid || grid.series.length <= 1) return
      patchData({ ...grid, series: grid.series.filter((_, idx) => idx !== si) })
    },
    [grid, patchData],
  )

  const renameSeries = useCallback(
    (si: number, name: string) => {
      if (!grid) return
      patchData({ ...grid, series: grid.series.map((s, idx) => (idx === si ? { ...s, name } : s)) })
    },
    [grid, patchData],
  )

  const setSeriesColor = useCallback(
    (si: number, color: string) => {
      if (!grid) return
      patchData({ ...grid, series: grid.series.map((s, idx) => (idx === si ? { ...s, color } : s)) })
    },
    [grid, patchData],
  )

  /* ---------------- CSV import ---------------- */
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvText, setCsvText] = useState("")

  const importCsv = useCallback(
    (text: string) => {
      const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
      const rows = parsed.data
      if (rows.length < 2) {
        toast({ title: "CSV needs a header row and at least one data row", variant: "destructive" })
        return
      }
      const [header, ...body] = rows
      const labels = body.map((r) => r[0] ?? "")
      const series = header.slice(1).map((name, si) => ({
        name: name || `Series ${si + 1}`,
        color: SWATCH_PALETTES[0].colors[si % SWATCH_PALETTES[0].colors.length],
        values: body.map((r) => {
          const n = parseFloat(r[si + 1])
          return Number.isFinite(n) ? n : 0
        }),
      }))
      patchData({ labels, series })
      setCsvOpen(false)
      setCsvText("")
      toast({ title: `Imported ${labels.length} rows × ${series.length} series` })
    },
    [patchData, toast],
  )

  /* ---------------- chart.js data ---------------- */
  const chartJs = useMemo(() => {
    if (!chartEl) return null
    const { labels, series } = chartEl.data
    const isCircular = chartEl.chartType === "pie" || chartEl.chartType === "doughnut"
    const datasets = isCircular
      ? [
          {
            label: series[0]?.name ?? "",
            data: series[0]?.values ?? [],
            backgroundColor: series.map((s) => s.color),
            borderWidth: 2,
          },
        ]
      : series.map((s) => ({
          label: s.name,
          data: s.values,
          backgroundColor: chartEl.chartType === "line" || chartEl.chartType === "area" ? `${s.color}33` : s.color,
          borderColor: s.color,
          borderWidth: 2,
          fill: chartEl.chartType === "area",
          tension: 0.35,
          pointRadius: 3,
        }))
    return { labels, datasets }
  }, [chartEl])

  const options = useMemo<Record<string, unknown>>(() => {
    if (!chartEl) return {}
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: chartEl.chartType === "bar" ? "y" : "x",
      plugins: {
        legend: { display: chartEl.showLegend && chartEl.chartType !== "progress", position: "bottom", labels: { boxWidth: 12, font: { size: 12 } } },
      },
      scales:
        chartEl.chartType === "pie" || chartEl.chartType === "doughnut" || chartEl.chartType === "progress"
          ? {}
          : {
              x: { grid: { display: chartEl.showGrid && chartEl.chartType === "bar" }, ticks: { font: { size: 11 } } },
              y: { grid: { display: chartEl.showGrid }, ticks: { font: { size: 11 } }, beginAtZero: true },
            },
    }
  }, [chartEl])

  /* ---------------- export ---------------- */
  const chartRef = useRef<HTMLDivElement>(null)

  const renderToCanvas = useCallback(
    (pixelRatio: number): HTMLCanvasElement => renderDocToCanvas(doc, 0, undefined, pixelRatio),
    [doc],
  )

  useEffect(() => {
    const handle: import("./types").EditorHandle = {
      export: async (req) => {
        const results: import("./types").ExportResult[] = []
        const base = req.filenameBase || "chart"
        if (req.format === "json") {
          results.push({ filename: `${base}.studio.json`, blob: new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }) })
          return results
        }
        if (req.format === "pdf") {
          const canvas = renderToCanvas(2)
          const pdf = new jsPDF({ orientation: doc.width >= doc.height ? "landscape" : "portrait", unit: "px", format: [doc.width, doc.height] })
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, doc.width, doc.height)
          results.push({ filename: `${base}.pdf`, blob: pdf.output("blob") })
          return results
        }
        if (req.format === "csv" && chartEl) {
          const rows = [["", ...chartEl.data.series.map((s) => s.name)]]
          chartEl.data.labels.forEach((l, i) => rows.push([l, ...chartEl.data.series.map((s) => String(s.values[i] ?? ""))]))
          results.push({ filename: `${base}.csv`, blob: new Blob([Papa.unparse(rows)], { type: "text/csv" }) })
          return results
        }
        const canvas = renderToCanvas(req.scale ?? 1)
        const mime = req.format === "jpeg" ? "image/jpeg" : req.format === "webp" ? "image/webp" : "image/png"
        const dataUrl = canvas.toDataURL(mime, req.quality ?? 0.95)
        const bin = atob(dataUrl.split(",")[1])
        const arr = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i)
        results.push({ filename: `${base}.${req.format === "jpeg" ? "jpg" : req.format}`, blob: new Blob([arr], { type: mime }) })
        return results
      },
      getThumbnail: async () => {
        const canvas = renderToCanvas(480 / doc.width)
        return canvas.toDataURL("image/jpeg", 0.5)
      },
    }
    registerHandle(handle)
    return () => registerHandle(null)
  }, [doc, registerHandle, renderToCanvas, chartEl])

  if (!chartEl || !grid || !chartJs) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-sm font-medium">No chart in this document</p>
          <Button
            className="mt-3"
            onClick={() => {
              const el = defaultChart()
              commit({ ...doc, pages: [{ ...doc.pages[0], elements: [...doc.pages[0].elements, el] }] })
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Insert chart
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* chart type rail */}
      <div className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b bg-card px-2 py-1.5 md:flex-col md:border-b-0 md:border-r md:py-3">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.id}
            disabled={!canEdit}
            onClick={() => patchChart({ chartType: ct.id })}
            className={cn(
              "min-h-[40px] shrink-0 rounded-lg px-3 text-xs font-medium transition-colors",
              chartEl.chartType === ct.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* preview */}
      <div className="relative min-h-0 flex-1 overflow-auto bg-muted p-6">
        <div
          className="mx-auto flex max-w-full flex-col rounded-xl border bg-white shadow-sm"
          style={{ width: Math.min(doc.width, 900), height: Math.min(doc.height, 700) }}
          ref={chartRef}
        >
          <div className="flex items-center gap-2 px-6 pt-5">
            <Input
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={(e) => commitTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              placeholder="Chart title…"
              className="border-transparent bg-transparent text-lg font-bold hover:border-border"
              disabled={!canEdit}
            />
          </div>
          <div className="min-h-0 flex-1 p-6">
            {chartEl.chartType === "line" || chartEl.chartType === "area" ? (
              <Line data={chartJs} options={options} />
            ) : chartEl.chartType === "pie" ? (
              <Pie data={chartJs} options={options} />
            ) : chartEl.chartType === "doughnut" ? (
              <Doughnut data={chartJs} options={options} />
            ) : chartEl.chartType === "progress" ? (
              <ProgressRender series={chartEl.data.series} />
            ) : (
              <Bar data={chartJs} options={options} />
            )}
          </div>
        </div>
      </div>

      {/* data panel — capped height below md so the preview keeps room (scrolls internally) */}
      <div className="flex max-md:max-h-[45%] w-full shrink-0 flex-col border-t bg-card md:w-80 md:border-l md:border-t-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Table2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Data</span>
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="outline" className="h-8" disabled={!canEdit} onClick={() => setCsvOpen((v) => !v)}>
              <ClipboardPaste className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="h-8" disabled={!canEdit} onClick={addSeries}>
              <Plus className="h-3.5 w-3.5" /> Series
            </Button>
          </div>
        </div>

        {csvOpen && (
          <div className="space-y-2 border-b bg-muted/50 p-3">
            <Label className="text-xs">Paste CSV (first column = labels)</Label>
            <Textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} className="h-24 font-mono text-xs" placeholder={"Month,Revenue,Costs\nJan,120,80\nFeb,150,90"} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => importCsv(csvText)} disabled={!csvText.trim()}>Import</Button>
              <Button size="sm" variant="ghost" onClick={() => setCsvOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-3">
            {/* series config */}
            {grid.series.map((s, si) => (
              <div key={si} className="rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => setSeriesColor(si, e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border"
                    aria-label={`${s.name} color`}
                    disabled={!canEdit}
                  />
                  <Input value={s.name} onChange={(e) => renameSeries(si, e.target.value)} className="h-8 text-xs" disabled={!canEdit} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeSeries(si)} disabled={!canEdit || grid.series.length <= 1} aria-label="Remove series">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {s.values.map((v, ri) => (
                    <div key={ri} className="flex items-center gap-1.5">
                      <span className="w-14 shrink-0 truncate text-[10px] text-muted-foreground">{grid.labels[ri]}</span>
                      <Input type="number" value={v} onChange={(e) => setValue(si, ri, e.target.value)} className="h-7 text-xs" disabled={!canEdit} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Separator />

            {/* labels */}
            <div className="space-y-1">
              <p className="text-xs font-semibold">Labels</p>
              {grid.labels.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input value={l} onChange={(e) => setLabel(i, e.target.value)} className="h-7 text-xs" disabled={!canEdit} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeRow(i)} disabled={!canEdit || grid.labels.length <= 1} aria-label="Remove row">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="h-8 w-full text-xs" onClick={addRow} disabled={!canEdit}>
                <Plus className="h-3.5 w-3.5" /> Add row
              </Button>
            </div>

            <Separator />

            {/* options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold">Options</p>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Legend</Label>
                <Switch checked={chartEl.showLegend} onCheckedChange={(v) => patchChart({ showLegend: v })} disabled={!canEdit} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Grid lines</Label>
                <Switch checked={chartEl.showGrid} onCheckedChange={(v) => patchChart({ showGrid: v })} disabled={!canEdit} />
              </div>
              <div>
                <Label className="text-xs">Chart size</Label>
                <Slider
                  value={[chartEl.width]}
                  min={400}
                  max={doc.width - 80}
                  step={20}
                  onValueChange={([w]) => patchChart({ width: w, height: Math.round((w * 2) / 3) })}
                  disabled={!canEdit}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="flex gap-1">
                  {SWATCH_PALETTES.slice(0, 5).map((p) => (
                    <button
                      key={p.name}
                      className="h-6 w-6 rounded border"
                      style={{ background: p.colors[0] }}
                      title={`Apply ${p.name}`}
                      disabled={!canEdit}
                      onClick={() =>
                        patchData({ ...grid, series: grid.series.map((s, i) => ({ ...s, color: p.colors[i % p.colors.length] })) })
                      }
                    />
                  ))}
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 w-full text-xs" disabled={!canEdit} onClick={() => commitTitle("")}>
                <TypeIcon className="h-3.5 w-3.5" /> Clear title
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <p className="text-center text-[10px] text-muted-foreground">
            Chart stays linked to the data — edits update the graphic instantly. Export via the top bar (PNG/PDF/CSV).
          </p>
        </div>
      </div>
    </div>
  )
})

function ProgressRender({ series }: { series: ChartData["series"] }) {
  const total = series.reduce((acc, s) => acc + s.values.reduce((a, b) => a + b, 0), 0) || 1
  return (
    <div className="flex h-full flex-col justify-center gap-4 overflow-auto">
      {series.map((s) => {
        const sum = s.values.reduce((a, b) => a + b, 0)
        const pct = Math.round((sum / total) * 100)
        return (
          <div key={s.name}>
            <div className="mb-1 flex justify-between text-xs font-medium">
              <span>{s.name}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: s.color }} />
            </div>
          </div>
        )
      })}
      <p className="text-center text-[10px] text-muted-foreground">Progress = each series share of the total. Edit values in the Data panel.</p>
    </div>
  )
}

export default ChartEditor
