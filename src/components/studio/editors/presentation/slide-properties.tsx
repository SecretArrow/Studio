"use client"

/**
 * SlideProperties — right-hand panel for the current slide:
 * transition, autoplay duration, presenter notes, layout presets,
 * background (solid + gradient presets) and the theme picker dialog
 * (apply to all slides or only to future slides).
 */

import { useState } from "react"
import type { DesignDoc, PageModel } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ColorField, Section } from "@/components/studio/editors/canvas/ui"
import { cn } from "@/lib/utils"
import { Palette } from "lucide-react"
import { GRADIENT_PRESETS, LAYOUT_KINDS, SLIDE_THEMES, applyThemeToElements, gradientBackground, type LayoutKind, type SlideTheme } from "./themes"

export interface SlidePropertiesProps {
  doc: DesignDoc
  page: PageModel
  pageIndex: number
  canEdit: boolean
  onPatchPage: (patch: Partial<PageModel>, coalesceKey?: string) => void
  /** theme application may restyle elements of existing slides too */
  onApplyTheme: (theme: SlideTheme, scope: "all" | "new") => void
  onApplyLayout: (kind: LayoutKind) => void
}

const TRANSITIONS = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "zoom", label: "Zoom" },
] as const

export function SlideProperties({ doc, page, pageIndex, canEdit, onPatchPage, onApplyTheme, onApplyLayout }: SlidePropertiesProps) {
  const [themeOpen, setThemeOpen] = useState(false)
  const [themeScope, setThemeScope] = useState<"all" | "new">("all")
  const [pendingTheme, setPendingTheme] = useState<SlideTheme | null>(null)

  const bg = page.background

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Transition">
        <div className="grid grid-cols-2 gap-2">
          {TRANSITIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!canEdit}
              onClick={() => onPatchPage({ transition: t.id })}
              aria-pressed={page.transition === t.id}
              className={cn(
                "min-h-[40px] rounded-lg border px-2 text-xs font-medium transition disabled:opacity-60",
                (page.transition ?? "none") === t.id ? "border-primary bg-accent text-primary" : "hover:bg-accent/60",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground" htmlFor="slide-duration">
            Autoplay
          </Label>
          <div className="flex items-center gap-1">
            <input
              id="slide-duration"
              type="number"
              min={1}
              max={60}
              disabled={!canEdit}
              value={Math.max(1, Math.round((page.durationMs ?? 5000) / 1000))}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!Number.isNaN(v)) onPatchPage({ durationMs: Math.max(1, Math.min(60, v)) * 1000 }, `duration:${page.id}`)
              }}
              className="h-8 w-16 rounded-md border bg-background px-2 text-xs"
            />
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        </div>
      </Section>

      <Section title="Presenter notes">
        <Textarea
          value={page.notes ?? ""}
          disabled={!canEdit}
          onChange={(e) => onPatchPage({ notes: e.target.value }, `notes:${page.id}`)}
          placeholder="Notes are visible in presenter view and included in the notes export…"
          className="min-h-[110px] text-xs"
          aria-label={`Presenter notes for slide ${pageIndex + 1}`}
        />
      </Section>

      <Section title="Layout">
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_KINDS.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={!canEdit}
              onClick={() => onApplyLayout(l.id)}
              title={l.hint}
              className="min-h-[64px] rounded-lg border px-2 py-2 text-left text-[11px] font-medium transition hover:border-primary hover:bg-accent/60 disabled:opacity-60"
            >
              <span className="block">{l.label}</span>
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{l.hint}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">Layouts insert placeholder text boxes on this slide.</p>
      </Section>

      <Section title="Background">
        {bg.type === "gradient" && bg.gradient ? (
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 shrink-0 rounded-md border shadow-sm" style={{ background: `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})` }} aria-hidden />
            <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" disabled={!canEdit} onClick={() => onPatchPage({ background: { type: "solid", color: "#ffffff" } })}>
              Switch to solid color
            </Button>
          </div>
        ) : (
          <ColorField
            value={bg.type === "solid" ? bg.color ?? "#ffffff" : "#ffffff"}
            onChange={(c) => onPatchPage({ background: { type: "solid", color: c } }, `bg:${page.id}`)}
            label="Solid color"
          />
        )}
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Gradients</p>
          <div className="grid grid-cols-5 gap-1.5">
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g.name}
                type="button"
                disabled={!canEdit}
                aria-label={`Background gradient ${g.name}`}
                title={g.name}
                onClick={() => onPatchPage({ background: gradientBackground(g) })}
                className="h-8 rounded-md border border-black/10 shadow-sm transition hover:scale-105 disabled:opacity-60"
                style={{ background: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` }}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Theme">
        <Button variant="outline" size="sm" className="h-9 w-full gap-1.5 text-xs" disabled={!canEdit} onClick={() => setThemeOpen(true)}>
          <Palette className="h-3.5 w-3.5" /> Choose theme…
        </Button>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Themes set the slide background plus heading/body font pairing and colors. Your shapes and images are never modified.
        </p>
      </Section>

      <Section title="Slides">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Total slides</Label>
          <span className="text-xs tabular-nums text-muted-foreground">{doc.pages.length}</span>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">Add, duplicate, reorder and delete slides from the strip below the slide.</p>
      </Section>

      {/* theme picker dialog */}
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SLIDE_THEMES.map((t) => {
              const active = pendingTheme?.id === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPendingTheme(t)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border-2 p-2 text-left transition",
                    active ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <span
                    className="block h-14 w-full rounded-md border border-black/10"
                    style={{
                      background:
                        t.background.type === "gradient" && t.background.gradient
                          ? `linear-gradient(${t.background.gradient.angle}deg, ${t.background.gradient.from}, ${t.background.gradient.to})`
                          : t.background.color,
                    }}
                    aria-hidden
                  />
                  <span className="mt-1.5 block text-xs font-semibold" style={{ fontFamily: t.headingFont, color: t.headingColor }}>
                    {t.name}
                  </span>
                  <span className="block text-[10px] text-muted-foreground" style={{ fontFamily: t.bodyFont }}>
                    {t.headingFont} + {t.bodyFont}
                  </span>
                </button>
              )
            })}
          </div>
          <RadioGroup value={themeScope} onValueChange={(v) => setThemeScope(v as "all" | "new")} className="mt-1 gap-2">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="all" /> Apply to all {doc.pages.length} slide(s) now
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="new" /> Only set as theme for new slides
            </label>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThemeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pendingTheme || !canEdit}
              onClick={() => {
                if (!pendingTheme) return
                onApplyTheme(pendingTheme, themeScope)
                setThemeOpen(false)
              }}
            >
              Apply theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Theme application shared by the editor (restyles existing slides' elements). */
export function themedPageElements(elements: PageModel["elements"], theme: SlideTheme): PageModel["elements"] {
  return applyThemeToElements(elements, theme)
}
