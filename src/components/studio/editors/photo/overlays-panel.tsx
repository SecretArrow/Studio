"use client"

/** Overlays panel: add text / shapes on top of the photo and edit the selection. */

import type { PhotoApi } from "./api"
import { EmptyHint, PanelSection } from "./ui"
import { ColorField } from "../canvas/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FONT_LIBRARY } from "@/lib/design/presets"
import { Circle, Square, Star, Trash2, Triangle, Type } from "lucide-react"
import { toast } from "sonner"

export function OverlaysPanel({ api }: { api: PhotoApi }) {
  const selected = api.overlays.find((o) => o.id === api.selectedId) ?? null
  const isText = selected?.type === "text"
  const isShape = selected?.type === "shape"

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Add overlay">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit} onClick={api.addOverlayText}>
            <Type className="h-3.5 w-3.5" /> Text
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 justify-start px-2" disabled={!api.canEdit} onClick={() => api.addOverlayShape("rect")}>
            <Square className="h-3.5 w-3.5" /> Rect
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 justify-start px-2" disabled={!api.canEdit} onClick={() => api.addOverlayShape("ellipse")}>
            <Circle className="h-3.5 w-3.5" /> Circle
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 justify-start px-2" disabled={!api.canEdit} onClick={() => api.addOverlayShape("triangle")}>
            <Triangle className="h-3.5 w-3.5" /> Triangle
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 justify-start px-2" disabled={!api.canEdit} onClick={() => api.addOverlayShape("star")}>
            <Star className="h-3.5 w-3.5" /> Star
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Overlays render above the photo and export with it. Drag on canvas to move, drag a corner to scale, Del to
          remove.
        </p>
      </PanelSection>

      {api.overlays.length > 0 && !selected ? (
        <PanelSection title="Layers">
          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {[...api.overlays].reverse().map((el) => (
              <button
                key={el.id}
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition hover:border-primary hover:bg-accent"
                onClick={() => api.selectOverlay(el.id)}
              >
                <span className="truncate font-medium">{el.type === "text" ? (el as { text?: string }).text || "Text" : (el as { variant?: string }).variant || "Shape"}</span>
                <span className="shrink-0 text-[10px] uppercase text-muted-foreground">{el.type}</span>
              </button>
            ))}
          </div>
        </PanelSection>
      ) : null}

      {selected && isText ? (
        <PanelSection title="Text" right={<DeleteBtn api={api} id={selected.id} />}>
          <Textarea
            value={(selected as { text: string }).text}
            onChange={(e) => api.updateOverlay(selected.id, { text: e.target.value }, `text:${selected.id}`)}
            className="min-h-16 text-xs"
            disabled={!api.canEdit}
            aria-label="Text content"
          />
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-font">Font</Label>
            <Select
              value={(selected as { fontFamily: string }).fontFamily}
              onValueChange={(v) => api.updateOverlay(selected.id, { fontFamily: v })}
              disabled={!api.canEdit}
            >
              <SelectTrigger id="ov-font" className="h-8 flex-1 text-xs">
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
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-size">Size</Label>
            <Slider
              id="ov-size"
              value={[(selected as { fontSize: number }).fontSize]}
              min={8}
              max={400}
              step={1}
              disabled={!api.canEdit}
              onValueChange={(vals) => api.updateOverlay(selected.id, { fontSize: vals[0] ?? 24 }, `fontSize:${selected.id}`)}
              className="flex-1"
              aria-label="Font size"
            />
            <span className="w-10 text-right text-xs tabular-nums">{Math.round((selected as { fontSize: number }).fontSize)}</span>
          </div>
          <ColorField
            value={(selected as { color: string }).color}
            onChange={(v) => api.updateOverlay(selected.id, { color: v }, `color:${selected.id}`)}
            label="Color"
          />
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-weight">Weight</Label>
            <Select
              value={String((selected as { fontWeight: number }).fontWeight)}
              onValueChange={(v) => api.updateOverlay(selected.id, { fontWeight: Number(v) })}
              disabled={!api.canEdit}
            >
              <SelectTrigger id="ov-weight" className="h-8 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[400, 500, 600, 700, 800].map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(selected as { align: "left" | "center" | "right" }).align}
              onValueChange={(v) => api.updateOverlay(selected.id, { align: v as "left" | "center" | "right" })}
              disabled={!api.canEdit}
            >
              <SelectTrigger className="h-8 w-24 text-xs" aria-label="Text alignment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PanelSection>
      ) : null}

      {selected && isShape ? (
        <PanelSection title="Shape" right={<DeleteBtn api={api} id={selected.id} />}>
          <ColorField
            value={(selected as { fill: string }).fill}
            onChange={(v) => api.updateOverlay(selected.id, { fill: v }, `fill:${selected.id}`)}
            label="Fill"
          />
          {(selected as { variant: string }).variant === "rect" ? (
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-radius">Radius</Label>
              <Input
                id="ov-radius"
                type="number"
                min={0}
                max={200}
                value={(selected as { cornerRadius: number }).cornerRadius}
                onChange={(e) => api.updateOverlay(selected.id, { cornerRadius: Math.max(0, Number(e.target.value) || 0) }, `radius:${selected.id}`)}
                className="h-8 flex-1 text-xs"
                disabled={!api.canEdit}
              />
            </div>
          ) : null}
        </PanelSection>
      ) : null}

      {selected ? (
        <PanelSection title="Transform (overlay)">
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-rot">Rotation</Label>
            <Slider
              id="ov-rot"
              value={[(selected as { rotation: number }).rotation]}
              min={-180}
              max={180}
              step={1}
              disabled={!api.canEdit}
              onValueChange={(vals) => api.updateOverlay(selected.id, { rotation: vals[0] ?? 0 }, `rot:${selected.id}`)}
              className="flex-1"
              aria-label="Overlay rotation"
            />
            <span className="w-10 text-right text-xs tabular-nums">{Math.round((selected as { rotation: number }).rotation)}°</span>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-16 shrink-0 text-[10px] text-muted-foreground" htmlFor="ov-op">Opacity</Label>
            <Slider
              id="ov-op"
              value={[Math.round((selected as { opacity: number }).opacity * 100)]}
              min={5}
              max={100}
              step={1}
              disabled={!api.canEdit}
              onValueChange={(vals) => api.updateOverlay(selected.id, { opacity: (vals[0] ?? 100) / 100 }, `op:${selected.id}`)}
              className="flex-1"
              aria-label="Overlay opacity"
            />
            <span className="w-10 text-right text-xs tabular-nums">{Math.round((selected as { opacity: number }).opacity * 100)}%</span>
          </div>
        </PanelSection>
      ) : null}

      {!selected ? (
        <PanelSection title="Selection">
          <EmptyHint
            title={api.overlays.length > 0 ? "Select an overlay" : "No overlays yet"}
            note="Click a text or shape on the canvas to edit it, or add a new one above."
          />
        </PanelSection>
      ) : null}
    </div>
  )
}

function DeleteBtn({ api, id }: { api: PhotoApi; id: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-destructive hover:text-destructive"
      disabled={!api.canEdit}
      aria-label="Delete overlay"
      title="Delete overlay"
      onClick={() => {
        api.deleteOverlay(id)
        toast.success("Overlay deleted")
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
