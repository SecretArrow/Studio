"use client"

/**
 * Elements panel — icons (ICON_LIBRARY), vector assets (ALL_ASSET_COLLECTIONS),
 * lines/arrows, tables, charts and QR codes. Click-to-add.
 */

import { useMemo, useState } from "react"
import type { CanvasApi } from "./ui"
import { Section } from "./ui"
import { ICON_CATEGORIES, ICON_LIBRARY } from "@/lib/design/icons"
import { ALL_ASSET_COLLECTIONS, type AssetDef } from "@/lib/design/asset-library"
import { createChart, createQr, createShape, createTable, type ChartElement, type ShapeVariant } from "@/lib/design/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChartBar, ChartColumn, Table2, QrCode, ArrowRight, Minus, LineChart, PieChart, Target, Activity } from "lucide-react"

/** Parse natural size from an asset's encoded SVG data URL. */
function assetNaturalSize(def: AssetDef): { w: number; h: number } {
  try {
    const body = def.svg.startsWith("data:image/svg+xml;utf8,") ? decodeURIComponent(def.svg.slice("data:image/svg+xml;utf8,".length)) : ""
    const vb = body.match(/viewBox="([\d.\-]+) ([\d.\-]+) ([\d.\-]+) ([\d.\-]+)"/)
    if (vb) {
      const w = Number(vb[3])
      const h = Number(vb[4])
      if (w > 0 && h > 0) return { w, h }
    }
  } catch {
    /* fall through */
  }
  return { w: 200, h: 200 }
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-4 gap-1.5">{children}</div>
}

function TileButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={`Add ${label}`}
      className="flex aspect-square min-h-[44px] items-center justify-center rounded-lg border bg-card p-1.5 text-foreground transition hover:border-primary hover:bg-accent hover:shadow-sm active:scale-95"
    >
      {children}
    </button>
  )
}

export function ElementsPanel({ api }: { api: CanvasApi }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("basic")
  const [collection, setCollection] = useState<string>("shapes")
  const [qrText, setQrText] = useState("https://studio.design")

  const icons = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(ICON_LIBRARY).filter(([key, def]) => {
      const inCat = category === "all" || def.category === category
      const matches = q === "" || key.toLowerCase().includes(q) || def.label.toLowerCase().includes(q)
      return inCat && matches
    })
  }, [query, category])

  const activeCollection = ALL_ASSET_COLLECTIONS.find((c) => c.id === collection) ?? ALL_ASSET_COLLECTIONS[0]

  function addIcon(key: string) {
    const pos = api.dropPos(96, 96)
    api.addElements([
      {
        id: `icon_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        type: "icon",
        icon: key,
        color: "#111827",
        x: pos.x,
        y: pos.y,
        width: 96,
        height: 96,
        rotation: 0,
        opacity: 1,
      },
    ])
  }

  function addAsset(def: AssetDef) {
    const { w, h } = assetNaturalSize(def)
    const maxSide = Math.min(api.doc.width * 0.5, 420)
    const ratio = Math.min(1, maxSide / Math.max(w, h))
    const width = w * ratio
    const height = h * ratio
    const pos = api.dropPos(width, height)
    api.addElements([
      {
        id: `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        type: "image",
        src: def.svg,
        name: def.label,
        x: pos.x,
        y: pos.y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        cornerRadius: 0,
      },
    ])
  }

  function addLineVariant(variant: "line" | "arrow") {
    const width = Math.round(api.doc.width * 0.3)
    const pos = api.dropPos(width, 8)
    api.addElements([
      createShape({
        x: pos.x,
        y: pos.y,
        variant: variant as ShapeVariant,
        width,
        height: 8,
        fill: "#111827",
        strokeWidth: 4,
        name: variant === "line" ? "Line" : "Arrow",
      }),
    ])
  }

  function addChart(chartType: ChartElement["chartType"]) {
    const pos = api.dropPos(560, 360)
    api.addElements([createChart({ x: pos.x, y: pos.y, chartType, width: 560, height: 360 })])
  }

  function addTable() {
    const pos = api.dropPos(640, 220)
    api.addElements([createTable({ x: pos.x, y: pos.y })])
  }

  function addQr() {
    const pos = api.dropPos(200, 200)
    api.addElements([createQr({ x: pos.x, y: pos.y, data: qrText.trim() || "https://studio.design" })])
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Icons">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons" className="h-8 pl-8 text-xs" aria-label="Search icons" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: "all", label: "All" }, ...ICON_CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${category === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="max-h-56 overflow-y-auto pr-0.5">
          <Grid>
            {icons.map(([key, def]) => (
              <TileButton key={key} label={def.label} onClick={() => addIcon(key)}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {def.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </svg>
              </TileButton>
            ))}
            {icons.length === 0 && <p className="col-span-4 py-4 text-center text-xs text-muted-foreground">No icons match “{query}”.</p>}
          </Grid>
        </div>
      </Section>

      <Section title="Graphics">
        <div className="flex flex-wrap gap-1">
          {ALL_ASSET_COLLECTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCollection(c.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${collection === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Grid>
          {activeCollection.assets.map((def) => (
            <TileButton key={def.id} label={def.label} onClick={() => addAsset(def)}>
              <img src={def.svg} alt={def.label} className="h-full w-full object-contain" loading="lazy" />
            </TileButton>
          ))}
        </Grid>
      </Section>

      <Section title="Lines & shapes">
        <Grid>
          <TileButton label="Line" onClick={() => addLineVariant("line")}>
            <Minus className="h-6 w-6" />
          </TileButton>
          <TileButton label="Arrow" onClick={() => addLineVariant("arrow")}>
            <ArrowRight className="h-6 w-6" />
          </TileButton>
        </Grid>
      </Section>

      <Section title="Data">
        <Grid>
          <TileButton label="Table" onClick={addTable}>
            <Table2 className="h-6 w-6" />
          </TileButton>
          <TileButton label="Column chart" onClick={() => addChart("column")}>
            <ChartColumn className="h-6 w-6" />
          </TileButton>
          <TileButton label="Bar chart" onClick={() => addChart("bar")}>
            <ChartBar className="h-6 w-6" />
          </TileButton>
          <TileButton label="Line chart" onClick={() => addChart("line")}>
            <LineChart className="h-6 w-6" />
          </TileButton>
          <TileButton label="Area chart" onClick={() => addChart("area")}>
            <Activity className="h-6 w-6" />
          </TileButton>
          <TileButton label="Pie chart" onClick={() => addChart("pie")}>
            <PieChart className="h-6 w-6" />
          </TileButton>
          <TileButton label="Doughnut chart" onClick={() => addChart("doughnut")}>
            <Target className="h-6 w-6" />
          </TileButton>
          <TileButton label="Progress" onClick={() => addChart("progress")}>
            <Activity className="h-6 w-6 -rotate-90" />
          </TileButton>
        </Grid>
      </Section>

      <Section title="QR code">
        <Input value={qrText} onChange={(e) => setQrText(e.target.value)} placeholder="URL or text" className="h-8 text-xs" aria-label="QR code content" />
        <Button size="sm" className="h-8 w-full gap-1.5 text-xs" onClick={addQr}>
          <QrCode className="h-3.5 w-3.5" /> Add QR code
        </Button>
      </Section>
    </div>
  )
}
