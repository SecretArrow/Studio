"use client"

/**
 * Text panel — heading/subheading/body presets, font picker from
 * FONT_LIBRARY, size + color before adding to the canvas.
 */

import { useState } from "react"
import type { CanvasApi } from "./ui"
import { Section } from "./ui"
import { FONT_LIBRARY } from "@/lib/design/presets"
import { createSticky, createText, type TextElement } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ColorField } from "./ui"
import { StickyNote, Type } from "lucide-react"

const PRESETS: { id: string; label: string; sample: (s: number) => string; apply: (base: number) => Partial<TextElement> }[] = [
  {
    id: "heading",
    label: "Add a heading",
    sample: (s) => `${Math.max(18, Math.round(s * 0.06))}px`,
    apply: (base) => ({ fontSize: Math.max(24, Math.round(base * 0.062)), fontWeight: 800, text: "Add a heading" }),
  },
  {
    id: "subheading",
    label: "Add a subheading",
    sample: (s) => `${Math.max(14, Math.round(s * 0.035))}px`,
    apply: (base) => ({ fontSize: Math.max(18, Math.round(base * 0.035)), fontWeight: 600, text: "Add a subheading" }),
  },
  {
    id: "body",
    label: "Add body text",
    sample: (s) => `${Math.max(12, Math.round(s * 0.02))}px`,
    apply: (base) => ({ fontSize: Math.max(14, Math.round(base * 0.02)), fontWeight: 400, text: "Add a little bit of body text" }),
  },
]

export function TextPanel({ api }: { api: CanvasApi }) {
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState(Math.max(18, Math.round(api.doc.width * 0.035)))
  const [color, setColor] = useState("#111827")
  const base = Math.min(api.doc.width, api.doc.height)

  function addText(preset: (typeof PRESETS)[number]) {
    const partial = preset.apply(base)
    const w = Math.min(api.doc.width * 0.7, 640)
    const pos = api.dropPos(w, (partial.fontSize ?? fontSize) * 1.4)
    const el = createText({
      ...partial,
      x: pos.x,
      y: pos.y,
      width: w,
      fontFamily,
      color,
    })
    api.addElements([el])
  }

  function addSticky() {
    const pos = api.dropPos(220, 220)
    api.addElements([createSticky({ x: pos.x, y: pos.y, color: "#fde68a" })])
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Text styles">
        <div className="space-y-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addText(p)}
              className="flex h-[52px] w-full items-center justify-between rounded-lg border bg-card px-4 text-left transition hover:border-primary hover:bg-accent active:scale-[0.99]"
            >
              <span className="font-semibold leading-tight">{p.label}</span>
              <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{p.sample(base)}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={addSticky}
            className="flex h-[52px] w-full items-center gap-2 rounded-lg border bg-card px-4 text-left transition hover:border-primary hover:bg-accent active:scale-[0.99]"
          >
            <StickyNote className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">Add a sticky note</span>
          </button>
        </div>
      </Section>

      <Section
        title="Default font"
        right={
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
        }
      >
        <Select value={fontFamily} onValueChange={setFontFamily}>
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
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={fontSize}
            min={8}
            max={400}
            onChange={(e) => setFontSize(Math.max(8, Math.min(400, Number(e.target.value) || 8)))}
            className="h-8 w-20 text-xs"
            aria-label="Font size"
          />
          <div className="flex flex-1 flex-wrap gap-1">
            {[16, 24, 32, 48, 64].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFontSize(s)}
                className={cn("h-7 min-w-[32px] rounded-md border px-1.5 text-[11px] transition", fontSize === s ? "border-primary bg-accent" : "bg-card hover:bg-accent")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <ColorField label="Color" value={color} onChange={setColor} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Pick a style above to place text at the center of your view. Double-click any text on the canvas to edit it inline.
        </p>
      </Section>
    </div>
  )
}
