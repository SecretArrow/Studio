"use client"

/**
 * Properties panel — context-sensitive inspector for the current selection:
 * transform (X/Y/W/H, rotation, opacity), alignment & distribution,
 * plus per-type editors (text, shape, image filters, chart data grid,
 * table editor, QR, icon, sticky, frame).
 */

import { useMemo, useRef } from "react"
import type { CanvasApi, ElementPatch } from "./ui"
import { ColorField, IconBtn, NumField, Section } from "./ui"
import type { ChartElement, DesignElement, ImageElement, ShapeElement, TableElement, TextElement } from "@/lib/design/types"
import { DEFAULT_IMAGE_FILTERS } from "@/lib/design/types"
import { FONT_LIBRARY } from "@/lib/design/presets"
import { alignPatches, distributePatches, type AlignMode } from "@/lib/editor/alignment"
import { measureTextBlockHeight } from "@/lib/editor/geometry"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalSpaceAround,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Bold,
  CaseUpper,
  FlipHorizontal,
  FlipVertical,
  Italic,
  List,
  ListOrdered,
  Lock,
  Replace,
  RotateCcw,
  Strikethrough,
  Underline,
  Ungroup,
  Group,
} from "lucide-react"
import { cn } from "@/lib/utils"

function SliderRow({ label, value, min, max, step = 1, onCommit, coalesceKey, suffix }: { label: string; value: number; min: number; max: number; step?: number; onCommit: (v: number) => void; coalesceKey: string; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {Math.round(value * 10) / 10}
          {suffix}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onCommit(v)} aria-label={label} data-coalesce={coalesceKey} />
    </div>
  )
}

export function PropertiesPanel({ api }: { api: CanvasApi }) {
  const sel = api.selection
  const single = sel.length === 1 ? sel[0] : null
  const multi = sel.length > 1

  const applySel = (patch: Partial<DesignElement>, coalesceKey?: string) => {
    api.updateElements(sel.map((el) => ({ id: el.id, patch })), { coalesceKey })
  }

  const applyAlignment = (mode: AlignMode) => {
    const patches = alignPatches(sel, mode, api.doc.width, api.doc.height).filter((p) => Object.keys(p.patch).length > 0)
    if (patches.length > 0) api.updateElements(patches)
  }

  const applyDistribute = (axis: "h" | "v") => {
    const patches = distributePatches(sel, axis)
    if (patches.length > 0) api.updateElements(patches)
  }

  const isText = sel.length > 0 && sel.every((e) => e.type === "text")

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {sel.length === 0 ? (
        <EmptyState api={api} />
      ) : (
        <>
          <Section
            title={multi ? `${sel.length} elements selected` : single?.name || labelFor(single)}
            right={
              api.canEdit ? (
                <div className="flex gap-0.5">
                  <IconBtn label="Group" disabled={sel.length < 2} onClick={api.groupSelected}>
                    <Group className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Ungroup" disabled={!sel.every((e) => e.groupId)} onClick={api.ungroupSelected}>
                    <Ungroup className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label={single?.locked ? "Unlock" : "Lock"} onClick={() => single && applySel({ locked: !single.locked })}>
                    <Lock className={cn("h-4 w-4", single?.locked && "text-primary")} />
                  </IconBtn>
                </div>
              ) : null
            }
          >
            {single ? (
              <>
                <div className="flex gap-2">
                  <NumField label="X" value={single.x} onCommit={(v) => applySel({ x: v }, `x:${single.id}`)} coalesceKey={`x:${single.id}`} />
                  <NumField label="Y" value={single.y} onCommit={(v) => applySel({ y: v }, `y:${single.id}`)} coalesceKey={`y:${single.id}`} />
                </div>
                <div className="flex gap-2">
                  <NumField label="W" value={single.width} min={4} onCommit={(v) => applySel({ width: v }, `w:${single.id}`)} coalesceKey={`w:${single.id}`} />
                  <NumField label="H" value={single.height} min={4} onCommit={(v) => applySel({ height: v }, `h:${single.id}`)} coalesceKey={`h:${single.id}`} />
                </div>
                <SliderRow label="Rotation" value={single.rotation} min={-180} max={180} onCommit={(v) => applySel({ rotation: v }, `rot:${single.id}`)} suffix="°" coalesceKey={`rot:${single.id}`} />
              </>
            ) : null}
            <SliderRow label="Opacity" value={(sel[0]?.opacity ?? 1) * 100} min={0} max={100} onCommit={(v) => applySel({ opacity: v / 100 }, `op:${sel[0]?.id}`)} suffix="%" coalesceKey={`op:${sel[0]?.id}`} />
            <div className="flex flex-wrap items-center gap-0.5">
              <AlignButtons onAlign={applyAlignment} onDistribute={applyDistribute} canDistribute={sel.length >= 3} />
            </div>
            {api.canEdit ? (
              <div className="flex items-center gap-0.5">
                <IconBtn label="Bring to front" onClick={() => api.reorder(api.selectedIds, "front")}>
                  <ArrowUpToLine className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Bring forward" onClick={() => api.reorder(api.selectedIds, "forward")}>
                  <ArrowUp className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Send backward" onClick={() => api.reorder(api.selectedIds, "backward")}>
                  <ArrowDown className="h-4 w-4" />
                </IconBtn>
                <IconBtn label="Send to back" onClick={() => api.reorder(api.selectedIds, "back")}>
                  <ArrowDownToLine className="h-4 w-4" />
                </IconBtn>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive" onClick={() => api.deleteElements(api.selectedIds)}>
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}
          </Section>

          {single?.type === "text" ? <TextEditor api={api} el={single as TextElement} /> : null}
          {isText && multi ? <MultiTextEditor api={api} sel={sel as TextElement[]} /> : null}
          {single?.type === "shape" ? <ShapeEditor api={api} el={single as ShapeElement} /> : null}
          {single?.type === "image" ? <ImageEditor api={api} el={single as ImageElement} /> : null}
          {single?.type === "chart" ? <ChartEditor api={api} el={single as ChartElement} /> : null}
          {single?.type === "table" ? <TableEditor api={api} el={single as TableElement} /> : null}
          {single?.type === "qr" ? <QrEditor api={api} el={single as Extract<DesignElement, { type: "qr" }>} /> : null}
          {single?.type === "icon" ? <IconEditor api={api} el={single as Extract<DesignElement, { type: "icon" }>} /> : null}
          {single?.type === "sticky" ? <StickyEditor api={api} el={single as Extract<DesignElement, { type: "sticky" }>} /> : null}
          {single?.type === "frame" ? <FrameEditor api={api} el={single as Extract<DesignElement, { type: "frame" }>} /> : null}
        </>
      )}
    </div>
  )
}

function labelFor(el: DesignElement | null): string {
  if (!el) return "Properties"
  const map: Record<string, string> = {
    text: "Text",
    shape: "Shape",
    image: "Image",
    icon: "Icon",
    chart: "Chart",
    table: "Table",
    qr: "QR code",
    frame: "Frame",
    sticky: "Sticky note",
    media: "Media",
    freehand: "Drawing",
    connector: "Connector",
    group: "Group",
  }
  return map[el.type] ?? "Element"
}

function EmptyState({ api }: { api: CanvasApi }) {
  return (
    <>
      <Section title="Nothing selected">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Select an element on the canvas to edit its properties — position, size, colors, effects and content.
        </p>
      </Section>
      <Section title="Page">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border bg-card p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Canvas</p>
            <p className="font-semibold">
              {api.doc.width} × {api.doc.height}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Page</p>
            <p className="truncate font-semibold">{api.page.name}</p>
          </div>
          <div className="rounded-lg border bg-card p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Elements</p>
            <p className="font-semibold">{api.page.elements.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pages</p>
            <p className="font-semibold">{api.doc.pages.length}</p>
          </div>
        </div>
      </Section>
      <Section title="Keyboard shortcuts">
        <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
          <li><kbd className="rounded bg-muted px-1">V</kbd> drag to pan · <kbd className="rounded bg-muted px-1">Ctrl+wheel</kbd> zoom</li>
          <li><kbd className="rounded bg-muted px-1">Ctrl+D</kbd> duplicate · <kbd className="rounded bg-muted px-1">Ctrl+G</kbd> group</li>
          <li><kbd className="rounded bg-muted px-1">Ctrl+Z</kbd> undo · <kbd className="rounded bg-muted px-1">Ctrl+Y</kbd> redo</li>
          <li><kbd className="rounded bg-muted px-1">[ ]</kbd> send back / bring forward</li>
          <li><kbd className="rounded bg-muted px-1">0</kbd> fit · <kbd className="rounded bg-muted px-1">1</kbd> 100%</li>
        </ul>
      </Section>
    </>
  )
}

function AlignButtons({ onAlign, onDistribute, canDistribute }: { onAlign: (m: AlignMode) => void; onDistribute: (a: "h" | "v") => void; canDistribute: boolean }) {
  const items: { mode: AlignMode; icon: React.ReactNode; label: string }[] = [
    { mode: "left", icon: <AlignLeft className="h-4 w-4" />, label: "Align left" },
    { mode: "center-h", icon: <AlignHorizontalJustifyCenter className="h-4 w-4" />, label: "Align horizontal centers" },
    { mode: "right", icon: <AlignRight className="h-4 w-4" />, label: "Align right" },
    { mode: "top", icon: <AlignCenter className="h-4 w-4 -rotate-90" />, label: "Align top" },
    { mode: "middle", icon: <AlignVerticalJustifyCenter className="h-4 w-4" />, label: "Align vertical centers" },
    { mode: "bottom", icon: <AlignCenter className="h-4 w-4 rotate-90" />, label: "Align bottom" },
  ]
  return (
    <>
      {items.map((it) => (
        <IconBtn key={it.mode} label={it.label} onClick={() => onAlign(it.mode)}>
          {it.icon}
        </IconBtn>
      ))}
      <IconBtn label="Distribute horizontally" disabled={!canDistribute} onClick={() => onDistribute("h")}>
        <AlignHorizontalSpaceAround className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Distribute vertically" disabled={!canDistribute} onClick={() => onDistribute("v")}>
        <AlignVerticalSpaceAround className="h-4 w-4" />
      </IconBtn>
    </>
  )
}

/* ------------------------------ text ------------------------------ */

function MultiTextEditor({ api, sel }: { api: CanvasApi; sel: TextElement[] }) {
  const first = sel[0]
  const apply = (patch: Partial<TextElement>, key?: string) =>
    api.updateElements(sel.map((el) => ({ id: el.id, patch } as ElementPatch)), { coalesceKey: key })
  return (
    <Section title="Text (multi)">
      <Select value={first.fontFamily} onValueChange={(v) => apply({ fontFamily: v }, `font:${first.id}`)}>
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
      <div className="flex flex-wrap gap-0.5">
        <IconBtn label="Bold" active={first.fontWeight >= 600} onClick={() => apply({ fontWeight: first.fontWeight >= 600 ? 400 : 700 }, `b:${first.id}`)}>
          <Bold className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Italic" active={first.italic} onClick={() => apply({ italic: !first.italic }, `i:${first.id}`)}>
          <Italic className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Uppercase" active={first.uppercase} onClick={() => apply({ uppercase: !first.uppercase }, `up:${first.id}`)}>
          <CaseUpper className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Align left" active={first.align === "left"} onClick={() => apply({ align: "left" }, `al:${first.id}`)}>
          <AlignLeft className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Align center" active={first.align === "center"} onClick={() => apply({ align: "center" }, `al:${first.id}`)}>
          <AlignCenter className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Align right" active={first.align === "right"} onClick={() => apply({ align: "right" }, `al:${first.id}`)}>
          <AlignRight className="h-4 w-4" />
        </IconBtn>
      </div>
      <ColorField label="Color" value={first.color} onChange={(v) => apply({ color: v }, `col:${first.id}`)} />
    </Section>
  )
}

function TextEditor({ api, el }: { api: CanvasApi; el: TextElement }) {
  const fontDef = FONT_LIBRARY.find((f) => f.family === el.fontFamily)
  const weights = fontDef?.weights ?? [400, 700]
  const apply = (patch: Partial<TextElement>, key?: string) => {
    const merged = { ...el, ...patch }
    // keep stored height in sync with wrapped content
    const needsMeasure = ["text", "fontSize", "fontFamily", "fontWeight", "italic", "uppercase", "lineHeight", "letterSpacing", "listStyle"].some((k) => k in patch)
    if (needsMeasure) {
      merged.height = measureTextBlockHeight(
        {
          text: merged.text,
          fontFamily: merged.fontFamily,
          fontSize: merged.fontSize,
          fontWeight: merged.fontWeight,
          italic: merged.italic,
          uppercase: merged.uppercase,
          lineHeight: merged.lineHeight,
          letterSpacing: merged.letterSpacing,
          listStyle: merged.listStyle,
        },
        merged.width,
      )
    }
    api.updateElements([{ id: el.id, patch: merged as Partial<DesignElement> }], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  }
  return (
    <>
      <Section title="Typography">
        <Select value={el.fontFamily} onValueChange={(v) => apply({ fontFamily: v, fontWeight: FONT_LIBRARY.find((f) => f.family === v)?.weights.includes(el.fontWeight) ? el.fontWeight : FONT_LIBRARY.find((f) => f.family === v)?.weights[0] ?? 400 }, "font")}>
          <SelectTrigger className="h-8 text-xs" aria-label="Font family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_LIBRARY.map((f) => (
              <SelectItem key={f.family} value={f.family} style={{ fontFamily: f.family }}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <NumField label="Size" value={el.fontSize} min={4} max={400} onCommit={(v) => apply({ fontSize: v }, "size")} coalesceKey="size" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Weight</span>
            <Select value={String(el.fontWeight)} onValueChange={(v) => apply({ fontWeight: Number(v) }, "weight")}>
              <SelectTrigger className="h-8 text-xs" aria-label="Font weight">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weights.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-0.5">
          <IconBtn label="Bold" active={el.fontWeight >= 600} onClick={() => apply({ fontWeight: el.fontWeight >= 600 ? 400 : 700 }, "b")}>
            <Bold className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Italic" active={el.italic} onClick={() => apply({ italic: !el.italic }, "i")}>
            <Italic className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Underline" active={el.underline} onClick={() => apply({ underline: !el.underline }, "u")}>
            <Underline className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Strikethrough" active={el.strike} onClick={() => apply({ strike: !el.strike }, "s")}>
            <Strikethrough className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Uppercase" active={el.uppercase} onClick={() => apply({ uppercase: !el.uppercase }, "up")}>
            <CaseUpper className="h-4 w-4" />
          </IconBtn>
        </div>
        <div className="flex gap-0.5">
          <IconBtn label="Align left" active={el.align === "left"} onClick={() => apply({ align: "left" }, "al")}>
            <AlignLeft className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Align center" active={el.align === "center"} onClick={() => apply({ align: "center" }, "al")}>
            <AlignCenter className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Align right" active={el.align === "right"} onClick={() => apply({ align: "right" }, "al")}>
            <AlignRight className="h-4 w-4" />
          </IconBtn>
          <div className="mx-1 h-5 w-px bg-border" />
          <IconBtn label="Vertical align top" active={el.vAlign === "top"} onClick={() => apply({ vAlign: "top" }, "va")}>
            <AlignLeft className="h-4 w-4 -rotate-90" />
          </IconBtn>
          <IconBtn label="Vertical align middle" active={el.vAlign === "middle"} onClick={() => apply({ vAlign: "middle" }, "va")}>
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Vertical align bottom" active={el.vAlign === "bottom"} onClick={() => apply({ vAlign: "bottom" }, "va")}>
            <AlignLeft className="h-4 w-4 rotate-90" />
          </IconBtn>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn label="No list" active={!el.listStyle || el.listStyle === "none"} onClick={() => apply({ listStyle: "none" }, "ls")}>
            <List className="h-4 w-4 opacity-40" />
          </IconBtn>
          <IconBtn label="Bullet list" active={el.listStyle === "bullet"} onClick={() => apply({ listStyle: "bullet" }, "ls")}>
            <List className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Numbered list" active={el.listStyle === "number"} onClick={() => apply({ listStyle: "number" }, "ls")}>
            <ListOrdered className="h-4 w-4" />
          </IconBtn>
        </div>
      </Section>
      <Section title="Spacing">
        <SliderRow label="Line height" value={el.lineHeight} min={0.7} max={3} step={0.05} onCommit={(v) => apply({ lineHeight: v }, "lh")} coalesceKey="lh" />
        <SliderRow label="Letter spacing" value={el.letterSpacing} min={-5} max={30} step={0.5} onCommit={(v) => apply({ letterSpacing: v }, "ls2")} coalesceKey="ls2" />
      </Section>
      <Section title="Colors">
        <ColorField label="Text color" value={el.color} onChange={(v) => apply({ color: v }, "col")} />
        <ColorField label="Highlight background" value={el.bgColor ?? "transparent"} allowTransparent onChange={(v) => apply({ bgColor: v === "transparent" ? undefined : v }, "bg")} />
      </Section>
      <Section title="Shadow & outline">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Shadow</Label>
          <Switch checked={!!el.shadow} onCheckedChange={(on) => apply(on ? { shadow: { color: "rgba(0,0,0,0.45)", blur: 8, offsetX: 2, offsetY: 3 } } : { shadow: undefined }, "sh")} aria-label="Toggle shadow" />
        </div>
        {el.shadow ? (
          <>
            <ColorField label="Shadow color" value={el.shadow.color === "rgba(0,0,0,0.45)" ? "#000000" : el.shadow.color} onChange={(v) => apply({ shadow: { ...el.shadow!, color: v } }, "shc")} />
            <SliderRow label="Blur" value={el.shadow.blur} min={0} max={40} onCommit={(v) => apply({ shadow: { ...el.shadow!, blur: v } }, "shb")} coalesceKey="shb" />
            <div className="flex gap-2">
              <NumField label="Offset X" value={el.shadow.offsetX} onCommit={(v) => apply({ shadow: { ...el.shadow!, offsetX: v } }, "shx")} coalesceKey="shx" />
              <NumField label="Offset Y" value={el.shadow.offsetY} onCommit={(v) => apply({ shadow: { ...el.shadow!, offsetY: v } }, "shy")} coalesceKey="shy" />
            </div>
          </>
        ) : null}
        <div className="flex items-center justify-between pt-1">
          <Label className="text-xs">Outline</Label>
          <Switch checked={!!el.stroke && el.stroke.width > 0} onCheckedChange={(on) => apply(on ? { stroke: { color: "#ffffff", width: 3 } } : { stroke: undefined }, "st")} aria-label="Toggle outline" />
        </div>
        {el.stroke && el.stroke.width > 0 ? (
          <div className="flex items-end gap-2">
            <ColorField label="Outline color" value={el.stroke.color} onChange={(v) => apply({ stroke: { ...el.stroke!, color: v } }, "stc")} />
            <NumField label="Width" value={el.stroke.width} min={0.5} max={20} step={0.5} onCommit={(v) => apply({ stroke: { ...el.stroke!, width: v } }, "stw")} coalesceKey="stw" />
          </div>
        ) : null}
      </Section>
      <Section title="Content">
        <Textarea
          defaultValue={el.text}
          className="min-h-[72px] text-xs"
          aria-label="Text content"
          onBlur={(e) => e.target.value !== el.text && apply({ text: e.target.value })}
        />
        <Button variant="outline" size="sm" className="h-7 w-full gap-1.5 text-xs" onClick={() => api.startInlineEdit(el.id)}>
          Edit on canvas
        </Button>
      </Section>
    </>
  )
}

/* ------------------------------ shape ------------------------------ */

function ShapeEditor({ api, el }: { api: CanvasApi; el: ShapeElement }) {
  const apply = (patch: Partial<ShapeElement>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  return (
    <>
      <Section title="Fill & stroke">
        <ColorField label="Fill" value={el.fill} allowTransparent onChange={(v) => apply({ fill: v }, "fill")} />
        <ColorField label="Stroke" value={el.stroke} allowTransparent onChange={(v) => apply({ stroke: v }, "stroke")} />
        <NumField label="Stroke width" value={el.strokeWidth} min={0} max={80} onCommit={(v) => apply({ strokeWidth: v }, "sw")} coalesceKey="sw" />
        {el.variant === "rect" ? (
          <NumField label="Corner radius" value={el.cornerRadius} min={0} max={Math.min(el.width, el.height) / 2} onCommit={(v) => apply({ cornerRadius: v }, "cr")} coalesceKey="cr" />
        ) : null}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Dash style</span>
          <Select value={el.dash ? (el.dash[0] <= 3 ? "dotted" : "dashed") : "none"} onValueChange={(v) => apply({ dash: v === "none" ? null : v === "dashed" ? [12, 8] : [2, 6] }, "dash")}>
            <SelectTrigger className="h-8 text-xs" aria-label="Dash style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>
      <Section title="Shadow">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Shadow</Label>
          <Switch checked={!!el.shadow} onCheckedChange={(on) => apply(on ? { shadow: { color: "rgba(0,0,0,0.3)", blur: 12, offsetX: 3, offsetY: 5 } } : { shadow: undefined }, "sh")} aria-label="Toggle shadow" />
        </div>
        {el.shadow ? (
          <SliderRow label="Blur" value={el.shadow.blur} min={0} max={60} onCommit={(v) => apply({ shadow: { ...el.shadow!, blur: v } }, "shb")} coalesceKey="shb" />
        ) : null}
      </Section>
    </>
  )
}

/* ------------------------------ image ------------------------------ */

const FILTER_DEFS: { key: keyof typeof DEFAULT_IMAGE_FILTERS; label: string; min: number; max: number; suffix?: string }[] = [
  { key: "brightness", label: "Brightness", min: 0, max: 200, suffix: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 200, suffix: "%" },
  { key: "saturation", label: "Saturation", min: 0, max: 200, suffix: "%" },
  { key: "hue", label: "Hue", min: -180, max: 180, suffix: "°" },
  { key: "blur", label: "Blur", min: 0, max: 20, suffix: "px" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, suffix: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, suffix: "%" },
  { key: "invert", label: "Invert", min: 0, max: 100, suffix: "%" },
  { key: "vignette", label: "Vignette", min: 0, max: 100, suffix: "%" },
]

function ImageEditor({ api, el }: { api: CanvasApi; el: ImageElement }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const filters = el.filters ?? DEFAULT_IMAGE_FILTERS
  const apply = (patch: Partial<ImageElement>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  const setFilter = (key: keyof typeof DEFAULT_IMAGE_FILTERS, v: number) => apply({ filters: { ...filters, [key]: v } }, `f:${key}`)
  return (
    <>
      <Section title="Replace image">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => apply({ src: String(reader.result) })
            reader.readAsDataURL(file)
          }}
        />
        <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 text-xs" onClick={() => fileRef.current?.click()}>
          <Replace className="h-3.5 w-3.5" /> Upload replacement
        </Button>
      </Section>
      <Section
        title="Filters"
        right={
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => apply({ filters: { ...DEFAULT_IMAGE_FILTERS } }, "freset")}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        }
      >
        {FILTER_DEFS.map((f) => (
          <SliderRow key={f.key} label={f.label} value={filters[f.key]} min={f.min} max={f.max} onCommit={(v) => setFilter(f.key, v)} suffix={f.suffix} coalesceKey={`f:${f.key}`} />
        ))}
      </Section>
      <Section title="Frame">
        <NumField label="Corner radius" value={el.cornerRadius} min={0} max={Math.min(el.width, el.height) / 2} onCommit={(v) => apply({ cornerRadius: v }, "cr")} coalesceKey="cr" />
        <div className="flex gap-1">
          <Button variant={el.flipH ? "secondary" : "outline"} size="sm" className="h-8 flex-1 gap-1.5 text-xs" onClick={() => apply({ flipH: !el.flipH }, "fh")}>
            <FlipHorizontal className="h-3.5 w-3.5" /> Flip H
          </Button>
          <Button variant={el.flipV ? "secondary" : "outline"} size="sm" className="h-8 flex-1 gap-1.5 text-xs" onClick={() => apply({ flipV: !el.flipV }, "fv")}>
            <FlipVertical className="h-3.5 w-3.5" /> Flip V
          </Button>
        </div>
      </Section>
    </>
  )
}

/* ------------------------------ chart ------------------------------ */

const CHART_TYPES: { value: ChartElement["chartType"]; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "doughnut", label: "Doughnut" },
  { value: "progress", label: "Progress" },
]

function ChartEditor({ api, el }: { api: CanvasApi; el: ChartElement }) {
  const apply = (patch: Partial<ChartElement>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  const setData = (data: ChartElement["data"]) => apply({ data })

  function setLabel(i: number, v: string) {
    const labels = [...el.data.labels]
    labels[i] = v
    setData({ ...el.data, labels })
  }
  function addLabel() {
    const labels = [...el.data.labels, `Item ${el.data.labels.length + 1}`]
    const series = el.data.series.map((s) => ({ ...s, values: [...s.values, 0] }))
    setData({ labels, series })
  }
  function removeLabel(i: number) {
    const labels = el.data.labels.filter((_, idx) => idx !== i)
    const series = el.data.series.map((s) => ({ ...s, values: s.values.filter((_, idx) => idx !== i) }))
    setData({ labels: labels.length > 0 ? labels : ["—"], series })
  }
  function setSeries(si: number, patch: Partial<ChartElement["data"]["series"][number]>) {
    const series = el.data.series.map((s, idx) => (idx === si ? { ...s, ...patch } : s))
    setData({ ...el.data, series })
  }
  function addSeries() {
    const palette = ["#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#f97316"]
    setData({
      ...el.data,
      series: [
        ...el.data.series,
        {
          name: `Series ${el.data.series.length + 1}`,
          color: palette[el.data.series.length % palette.length],
          values: el.data.labels.map(() => Math.round(Math.random() * 80) + 10),
        },
      ],
    })
  }
  function removeSeries(si: number) {
    setData({ ...el.data, series: el.data.series.filter((_, idx) => idx !== si) })
  }

  return (
    <>
      <Section title="Chart type">
        <Select value={el.chartType} onValueChange={(v) => apply({ chartType: v as ChartElement["chartType"] }, "ct")}>
          <SelectTrigger className="h-8 text-xs" aria-label="Chart type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={el.title ?? ""} onChange={(e) => apply({ title: e.target.value }, "title")} placeholder="Chart title (optional)" className="h-8 text-xs" aria-label="Chart title" />
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show legend</Label>
          <Switch checked={el.showLegend} onCheckedChange={(v) => apply({ showLegend: v }, "lg")} aria-label="Show legend" />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show grid</Label>
          <Switch checked={el.showGrid} onCheckedChange={(v) => apply({ showGrid: v }, "grid")} aria-label="Show grid" />
        </div>
      </Section>
      <Section
        title="Labels"
        right={
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" onClick={addLabel}>
            + Add
          </Button>
        }
      >
        {el.data.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input value={label} onChange={(e) => setLabel(i, e.target.value)} className="h-7 text-xs" aria-label={`Label ${i + 1}`} />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeLabel(i)} aria-label={`Remove label ${i + 1}`}>
              ×
            </Button>
          </div>
        ))}
      </Section>
      <Section
        title="Series"
        right={
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" disabled={el.data.series.length >= 6} onClick={addSeries}>
            + Add
          </Button>
        }
      >
        {el.data.series.map((s, si) => (
          <div key={si} className="space-y-1.5 rounded-lg border bg-card p-2">
            <div className="flex items-center gap-1.5">
              <label className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border" aria-label={`Series ${s.name} color`}>
                <input type="color" value={s.color} onChange={(e) => setSeries(si, { color: e.target.value })} className="absolute -left-1 -top-1 h-9 w-9 cursor-pointer border-0 p-0" />
              </label>
              <Input value={s.name} onChange={(e) => setSeries(si, { name: e.target.value })} className="h-7 text-xs" aria-label={`Series ${si + 1} name`} />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" disabled={el.data.series.length <= 1} onClick={() => removeSeries(si)} aria-label={`Remove series ${s.name}`}>
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {el.data.labels.map((_, li) => (
                <Input
                  key={li}
                  type="number"
                  value={s.values[li] ?? 0}
                  onChange={(e) => {
                    const values = [...s.values]
                    values[li] = Number(e.target.value) || 0
                    setSeries(si, { values })
                  }}
                  className="h-7 px-1.5 text-[11px]"
                  aria-label={`${s.name} value for ${el.data.labels[li]}`}
                />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </>
  )
}

/* ------------------------------ table ------------------------------ */

function TableEditor({ api, el }: { api: CanvasApi; el: TableElement }) {
  const apply = (patch: Partial<TableElement>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  const rows = el.rows
  const colCount = Math.max(...rows.map((r) => r.length), 1)

  function setCell(ri: number, ci: number, v: string) {
    const next = rows.map((r) => [...r])
    next[ri][ci] = v
    apply({ rows: next }, `cell`)
  }
  function addRow(at: number | "end") {
    const next = [...rows.map((r) => [...r])]
    const row = new Array(colCount).fill("")
    if (at === "end") next.push(row)
    else next.splice(at + 1, 0, row)
    apply({ rows: next })
  }
  function removeRow(ri: number) {
    if (rows.length <= 1) return
    apply({ rows: rows.filter((_, idx) => idx !== ri) })
  }
  function addCol() {
    apply({ rows: rows.map((r) => [...r, ""]) })
  }
  function removeCol(ci: number) {
    if (colCount <= 1) return
    apply({ rows: rows.map((r) => r.filter((_, idx) => idx !== ci)) })
  }

  return (
    <>
      <Section
        title="Structure"
        right={
          <Label className="flex items-center gap-1.5 text-xs">
            <Switch checked={el.headerRow} onCheckedChange={(v) => apply({ headerRow: v }, "hr")} aria-label="Header row" /> Header
          </Label>
        }
      >
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => addRow("end")}>
            + Row
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={rows.length <= 1} onClick={() => removeRow(rows.length - 1)}>
            − Row
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addCol}>
            + Column
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled={colCount <= 1} onClick={() => removeCol(colCount - 1)}>
            − Column
          </Button>
        </div>
      </Section>
      <Section title="Cells">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full space-y-1">
            {rows.map((row, ri) => (
              <div key={ri} className="flex items-center gap-1">
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    role="textbox"
                    tabIndex={0}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const v = (e.target as HTMLElement).textContent ?? ""
                      if (v !== cell) setCell(ri, ci, v)
                    }}
                    className={cn(
                      "min-h-[30px] min-w-[76px] max-w-[140px] truncate rounded border px-1.5 py-1 text-[11px] outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                      el.headerRow && ri === 0 ? "bg-primary/10 font-semibold" : "bg-card",
                    )}
                  >
                    {cell}
                  </div>
                ))}
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeRow(ri)} aria-label={`Delete row ${ri + 1}`}>
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section title="Style">
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Header bg" value={el.headerBg} onChange={(v) => apply({ headerBg: v }, "hbg")} />
          <ColorField label="Header text" value={el.headerColor} onChange={(v) => apply({ headerColor: v }, "hc")} />
          <ColorField label="Row bg" value={el.rowBg} onChange={(v) => apply({ rowBg: v }, "rbg")} />
          <ColorField label="Alt row bg" value={el.altRowBg} onChange={(v) => apply({ altRowBg: v }, "abg")} />
          <ColorField label="Border" value={el.borderColor} onChange={(v) => apply({ borderColor: v }, "bc")} />
          <ColorField label="Text" value={el.color} onChange={(v) => apply({ color: v }, "tc")} />
        </div>
        <div className="flex gap-2">
          <NumField label="Font size" value={el.fontSize} min={8} max={72} onCommit={(v) => apply({ fontSize: v }, "fs")} coalesceKey="fs" />
        </div>
      </Section>
    </>
  )
}

/* ------------------------------ qr / icon / sticky / frame ------------------------------ */

function QrEditor({ api, el }: { api: CanvasApi; el: Extract<DesignElement, { type: "qr" }> }) {
  const apply = (patch: Partial<Extract<DesignElement, { type: "qr" }>>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  return (
    <Section title="QR code">
      <Textarea
        defaultValue={el.data}
        className="min-h-[64px] font-mono text-xs"
        aria-label="QR content"
        onBlur={(e) => e.target.value !== el.data && apply({ data: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="Code color" value={el.fg} onChange={(v) => apply({ fg: v }, "fg")} />
        <ColorField label="Background" value={el.bg} onChange={(v) => apply({ bg: v }, "bg")} />
      </div>
      <p className="text-[11px] text-muted-foreground">The QR regenerates automatically. Test scan it after changing colors — keep strong contrast.</p>
    </Section>
  )
}

function IconEditor({ api, el }: { api: CanvasApi; el: Extract<DesignElement, { type: "icon" }> }) {
  return (
    <Section title="Icon">
      <ColorField label="Color" value={el.color} onChange={(v) => api.updateElements([{ id: el.id, patch: { color: v } }], { coalesceKey: `col:${el.id}` })} />
      <p className="text-[11px] text-muted-foreground">Crisp vector strokes — scale freely, export keeps them sharp (SVG and PDF).</p>
    </Section>
  )
}

function StickyEditor({ api, el }: { api: CanvasApi; el: Extract<DesignElement, { type: "sticky" }> }) {
  const STICKY_COLORS = ["#fde68a", "#fca5a5", "#a7f3d0", "#bfdbfe", "#e9d5ff", "#f8f7f4"]
  return (
    <Section title="Sticky note">
      <Textarea
        defaultValue={el.text}
        className="min-h-[80px] text-sm"
        aria-label="Sticky text"
        style={{ fontFamily: el.fontFamily }}
        onBlur={(e) => e.target.value !== el.text && api.updateElements([{ id: el.id, patch: { text: e.target.value } }], { coalesceKey: `txt:${el.id}` })}
      />
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Color</span>
        <div className="mt-1 flex gap-1.5">
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Sticky color ${c}`}
              onClick={() => api.updateElements([{ id: el.id, patch: { color: c } }])}
              className={cn("h-7 w-7 rounded-md border shadow-sm transition hover:scale-110", el.color === c && "ring-2 ring-primary ring-offset-1")}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <NumField label="Font size" value={el.fontSize} min={10} max={96} onCommit={(v) => api.updateElements([{ id: el.id, patch: { fontSize: v } }], { coalesceKey: `fs:${el.id}` })} coalesceKey="fs" />
      <Button variant="outline" size="sm" className="h-7 w-full text-xs" onClick={() => api.startInlineEdit(el.id)}>
        Edit on canvas
      </Button>
    </Section>
  )
}

function FrameEditor({ api, el }: { api: CanvasApi; el: Extract<DesignElement, { type: "frame" }> }) {
  const apply = (patch: Partial<Extract<DesignElement, { type: "frame" }>>, key?: string) => api.updateElements([{ id: el.id, patch } as ElementPatch], { coalesceKey: key ? `${key}:${el.id}` : undefined })
  return (
    <Section title="Frame">
      <ColorField label="Fill" value={el.fill} allowTransparent onChange={(v) => apply({ fill: v }, "fill")} />
      <ColorField label="Stroke" value={el.stroke} allowTransparent onChange={(v) => apply({ stroke: v }, "stroke")} />
      <NumField label="Stroke width" value={el.strokeWidth} min={0} max={40} onCommit={(v) => apply({ strokeWidth: v }, "sw")} coalesceKey="sw" />
      <NumField label="Corner radius" value={el.cornerRadius} min={0} max={200} onCommit={(v) => apply({ cornerRadius: v }, "cr")} coalesceKey="cr" />
      <Input defaultValue={el.label ?? ""} placeholder="Placeholder label" className="h-8 text-xs" aria-label="Frame label" onBlur={(e) => apply({ label: e.target.value })} />
    </Section>
  )
}
