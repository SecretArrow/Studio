"use client"

/**
 * DocPropertiesPanel — context panel for the selected document element.
 * Tables get a mini editor, charts a data editor, images get size controls,
 * and every element can be removed. Text styling lives in the toolbar.
 */

import type { ChartElement, DesignDoc, DesignElement, ImageElement, ShapeElement, TableElement, TextElement } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumField, ColorField, Section } from "@/components/studio/editors/canvas/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FONT_LIBRARY } from "@/lib/design/presets"
import { Plus, RefreshCcw, Trash2 } from "lucide-react"
import { isTocBlock } from "./model"

export interface DocPanelApi {
  doc: DesignDoc
  selected: DesignElement | null
  canEdit: boolean
  updateElement: (id: string, patch: Partial<DesignElement>, coalesceKey?: string) => void
  deleteSelected: () => void
  refreshToc: () => void
}

export function DocPropertiesPanel({ api }: { api: DocPanelApi }) {
  const el = api.selected

  if (!el) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <Section title="Selected element">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Click a block on the page to edit it. Formatting lives in the toolbar; this panel shows details for tables, charts and images.
          </p>
        </Section>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {el.type === "text" ? <TextSection api={api} el={el as TextElement} /> : null}
      {el.type === "image" ? <ImageSection api={api} el={el as ImageElement} /> : null}
      {el.type === "table" ? <TableSection api={api} el={el as TableElement} /> : null}
      {el.type === "chart" ? <ChartSection api={api} el={el as ChartElement} /> : null}
      {el.type === "shape" ? <ShapeSection api={api} el={el as ShapeElement} /> : null}
      <Section title="Arrange">
        <NumField label="X" value={el.x} onCommit={(v) => api.updateElement(el.id, { x: v }, `x:${el.id}`)} />
        <NumField label="Y" value={el.y} onCommit={(v) => api.updateElement(el.id, { y: v }, `y:${el.id}`)} />
        <NumField label="Width" value={el.width} min={20} onCommit={(v) => api.updateElement(el.id, { width: v }, `w:${el.id}`)} />
        <NumField label="Opacity" value={Math.round(el.opacity * 100)} min={5} max={100} onCommit={(v) => api.updateElement(el.id, { opacity: v / 100 }, `op:${el.id}`)} />
        <Button variant="destructive" size="sm" className="h-9" disabled={!api.canEdit} onClick={api.deleteSelected}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete element
        </Button>
      </Section>
    </div>
  )
}

function TextSection({ api, el }: { api: DocPanelApi; el: TextElement }) {
  const isToc = isTocBlock(el)
  return (
    <Section title={isToc ? "Table of contents" : "Text block"}>
      {isToc ? (
        <>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit} onClick={api.refreshToc}>
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh TOC
          </Button>
          <p className="text-[10px] leading-relaxed text-muted-foreground">TOC lists Heading 1 / Heading 2 blocks with their page numbers. Refresh it after moving content between pages.</p>
        </>
      ) : (
        <>
          <Select value={el.fontFamily} disabled={!api.canEdit} onValueChange={(v) => api.updateElement(el.id, { fontFamily: v })}>
            <SelectTrigger className="h-8 text-xs" aria-label="Font family">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_LIBRARY.map((f) => (
                <SelectItem key={f.family} value={f.family}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between">
            <Label className="text-xs">List style</Label>
            <Select value={el.listStyle ?? "none"} disabled={!api.canEdit} onValueChange={(v) => api.updateElement(el.id, { listStyle: v as "none" | "bullet" | "number" })}>
              <SelectTrigger className="h-8 w-28 text-xs" aria-label="List style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bullet">Bullets</SelectItem>
                <SelectItem value="number">Numbered</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ColorField value={el.bgColor ?? "#f4f4f5"} allowTransparent onChange={(c) => api.updateElement(el.id, { bgColor: c === "transparent" ? undefined : c }, `bg:${el.id}`)} label="Block background (quotes)" />
          <div className="flex gap-2">
            <NumField label="Line height" value={el.lineHeight} min={0.9} max={3} step={0.05} onCommit={(v) => api.updateElement(el.id, { lineHeight: v }, `lh:${el.id}`)} />
            <NumField label="Size" value={el.fontSize} min={8} max={96} onCommit={(v) => api.updateElement(el.id, { fontSize: v }, `fs:${el.id}`)} />
          </div>
        </>
      )}
    </Section>
  )
}

function ImageSection({ api, el }: { api: DocPanelApi; el: ImageElement }) {
  return (
    <Section title="Image">
      <div className="flex gap-2">
        <NumField label="Width" value={el.width} min={20} onCommit={(v) => api.updateElement(el.id, { width: v }, `w:${el.id}`)} />
        <NumField label="Height" value={el.height} min={20} onCommit={(v) => api.updateElement(el.id, { height: v }, `h:${el.id}`)} />
      </div>
      <NumField label="Corner radius" value={el.cornerRadius} min={0} max={200} onCommit={(v) => api.updateElement(el.id, { cornerRadius: v }, `cr:${el.id}`)} />
    </Section>
  )
}

function TableSection({ api, el }: { api: DocPanelApi; el: TableElement }) {
  return (
    <Section title="Table">
      <Textarea
        defaultValue={el.rows.map((r) => r.join(" | ")).join("\n")}
        disabled={!api.canEdit}
        className="min-h-[120px] font-mono text-[11px]"
        aria-label="Table rows — cells separated by |"
        onBlur={(e) => {
          const rows = e.target.value
            .split("\n")
            .map((line) => line.split("|").map((c) => c.trim()))
            .filter((r) => r.length > 0)
          if (rows.length > 0) api.updateElement(el.id, { rows })
        }}
      />
      <p className="text-[10px] text-muted-foreground">One row per line, cells separated by “|”. Changes apply when you click outside.</p>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Header row</Label>
        <Switch checked={el.headerRow} disabled={!api.canEdit} onCheckedChange={(v) => api.updateElement(el.id, { headerRow: v })} aria-label="Toggle header row" />
      </div>
      <div className="flex gap-2">
        <NumField label="Font size" value={el.fontSize} min={8} max={48} onCommit={(v) => api.updateElement(el.id, { fontSize: v }, `fs:${el.id}`)} />
        <NumField label="Height" value={el.height} min={40} onCommit={(v) => api.updateElement(el.id, { height: v }, `h:${el.id}`)} />
      </div>
      <ColorField value={el.headerBg} onChange={(c) => api.updateElement(el.id, { headerBg: c }, `hb:${el.id}`)} label="Header background" />
      <ColorField value={el.rowBg} onChange={(c) => api.updateElement(el.id, { rowBg: c }, `rb:${el.id}`)} label="Row background" />
      <ColorField value={el.borderColor} onChange={(c) => api.updateElement(el.id, { borderColor: c }, `bc:${el.id}`)} label="Borders" />
    </Section>
  )
}

function ChartSection({ api, el }: { api: DocPanelApi; el: ChartElement }) {
  return (
    <Section title="Chart">
      <Input
        value={el.title ?? ""}
        disabled={!api.canEdit}
        placeholder="Chart title"
        className="h-8 text-xs"
        aria-label="Chart title"
        onChange={(e) => api.updateElement(el.id, { title: e.target.value }, `ct:${el.id}`)}
      />
      <Input
        value={el.data.labels.join(", ")}
        disabled={!api.canEdit}
        placeholder="Labels, comma separated"
        className="h-8 text-xs"
        aria-label="Chart labels"
        onChange={(e) => {
          const labels = e.target.value.split(",").map((s) => s.trim())
          api.updateElement(el.id, { data: { ...el.data, labels } }, `cl:${el.id}`)
        }}
      />
      {el.data.series.map((s, si) => (
        <div key={si} className="space-y-1 rounded-lg border p-2">
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(s.color) ? s.color : "#8b5cf6"}
              disabled={!api.canEdit}
              aria-label={`Series ${si + 1} color`}
              className="h-7 w-7 cursor-pointer rounded border p-0"
              onChange={(e) => {
                const series = el.data.series.map((x, i) => (i === si ? { ...x, color: e.target.value } : x))
                api.updateElement(el.id, { data: { ...el.data, series } }, `cc:${el.id}`)
              }}
            />
            <Input
              value={s.name}
              disabled={!api.canEdit}
              className="h-7 flex-1 text-xs"
              aria-label={`Series ${si + 1} name`}
              onChange={(e) => {
                const series = el.data.series.map((x, i) => (i === si ? { ...x, name: e.target.value } : x))
                api.updateElement(el.id, { data: { ...el.data, series } }, `cn:${el.id}`)
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={!api.canEdit || el.data.series.length <= 1}
              aria-label={`Remove series ${si + 1}`}
              onClick={() => api.updateElement(el.id, { data: { ...el.data, series: el.data.series.filter((_, i) => i !== si) } })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            value={s.values.join(", ")}
            disabled={!api.canEdit}
            placeholder="Values, comma separated"
            className="h-7 text-xs"
            aria-label={`Series ${si + 1} values`}
            onChange={(e) => {
              const values = e.target.value.split(",").map((v) => Number(v.trim()) || 0)
              const series = el.data.series.map((x, i) => (i === si ? { ...x, values } : x))
              api.updateElement(el.id, { data: { ...el.data, series } }, `cv:${el.id}`)
            }}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        disabled={!api.canEdit}
        onClick={() =>
          api.updateElement(el.id, {
            data: { ...el.data, series: [...el.data.series, { name: `Series ${el.data.series.length + 1}`, color: "#f59e0b", values: el.data.labels.map(() => 10) }] },
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Add series
      </Button>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Legend</Label>
        <Switch checked={el.showLegend} disabled={!api.canEdit} onCheckedChange={(v) => api.updateElement(el.id, { showLegend: v })} aria-label="Toggle legend" />
      </div>
    </Section>
  )
}

function ShapeSection({ api, el }: { api: DocPanelApi; el: ShapeElement }) {
  return (
    <Section title={el.variant === "line" ? "Divider" : "Shape"}>
      <ColorField value={el.fill} allowTransparent onChange={(c) => api.updateElement(el.id, { fill: c }, `fill:${el.id}`)} label="Color" />
      <NumField label="Thickness" value={el.strokeWidth} min={1} max={20} onCommit={(v) => api.updateElement(el.id, { strokeWidth: v, height: Math.max(el.height, v + 4) }, `sw:${el.id}`)} />
    </Section>
  )
}
