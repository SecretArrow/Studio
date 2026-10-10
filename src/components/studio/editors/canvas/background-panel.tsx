"use client"

/**
 * Background panel — solid color (picker + palettes), gradient (from/to/angle),
 * image (upload / URL) or transparent checkerboard, per current page.
 */

import { useRef, useState } from "react"
import type { CanvasApi } from "./ui"
import { ColorField, Section } from "./ui"
import type { BackgroundSpec } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Check, Droplet, Grid3x3, ImageIcon, Square, SquareDashed } from "lucide-react"

const QUICK_COLORS = ["#ffffff", "#f8f7f4", "#ede9fe", "#fce7f3", "#dcfce7", "#dbeafe", "#fef3c7", "#111827", "#1f2937", "#8b5cf6", "#f97316", "#10b981"]

export function BackgroundPanel({ api }: { api: CanvasApi }) {
  const bg = api.page.background
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState(bg.imageUrl ?? "")

  function set(patch: Partial<BackgroundSpec>) {
    api.setPageBackground({ ...bg, ...patch })
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set({ type: "image", imageUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const types: { id: BackgroundSpec["type"]; label: string; icon: React.ReactNode }[] = [
    { id: "solid", label: "Solid", icon: <Square className="h-3.5 w-3.5" /> },
    { id: "gradient", label: "Gradient", icon: <Droplet className="h-3.5 w-3.5" /> },
    { id: "image", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { id: "transparent", label: "None", icon: <SquareDashed className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Background type">
        <div className="grid grid-cols-4 gap-1.5">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!api.canEdit}
              onClick={() => set({ type: t.id })}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition",
                bg.type === t.id ? "border-primary bg-accent" : "bg-card hover:bg-accent/60",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      {bg.type === "solid" && (
        <Section title="Solid color">
          <ColorField label="Color" value={bg.color ?? "#ffffff"} onChange={(v) => set({ color: v })} />
          <div className="grid grid-cols-6 gap-1.5">
            {QUICK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Set background ${c}`}
                onClick={() => set({ color: c })}
                className="relative h-8 rounded-md border shadow-sm transition hover:scale-105"
                style={{ background: c }}
              >
                {bg.color === c && <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-muted-foreground mix-blend-difference" />}
              </button>
            ))}
          </div>
        </Section>
      )}

      {bg.type === "gradient" && (
        <Section title="Gradient">
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="From" value={bg.gradient?.from ?? "#8b5cf6"} onChange={(v) => set({ gradient: { from: v, to: bg.gradient?.to ?? "#f0abfc", angle: bg.gradient?.angle ?? 45 } })} />
            <ColorField label="To" value={bg.gradient?.to ?? "#f0abfc"} onChange={(v) => set({ gradient: { from: bg.gradient?.from ?? "#8b5cf6", to: v, angle: bg.gradient?.angle ?? 45 } })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Angle · {Math.round(bg.gradient?.angle ?? 45)}°</Label>
            <Slider
              value={[bg.gradient?.angle ?? 45]}
              min={0}
              max={360}
              step={1}
              onValueChange={([v]) => set({ gradient: { from: bg.gradient?.from ?? "#8b5cf6", to: bg.gradient?.to ?? "#f0abfc", angle: v } })}
              aria-label="Gradient angle"
            />
          </div>
          <div
            className="h-16 w-full rounded-lg border shadow-inner"
            style={{ background: `linear-gradient(${(bg.gradient?.angle ?? 45) - 90}deg, ${bg.gradient?.from ?? "#8b5cf6"}, ${bg.gradient?.to ?? "#f0abfc"})` }}
            aria-hidden
          />
        </Section>
      )}

      {bg.type === "image" && (
        <Section title="Background image">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = "" }} />
          <Button variant="outline" size="sm" className="h-8 w-full text-xs" disabled={!api.canEdit} onClick={() => fileRef.current?.click()}>
            Upload image
          </Button>
          <div className="flex gap-1.5">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL"
              className="h-8 text-xs"
              aria-label="Background image URL"
            />
            <Button size="sm" className="h-8 shrink-0 text-xs" disabled={!api.canEdit} onClick={() => urlInput.trim() && set({ imageUrl: urlInput.trim() })}>
              Apply
            </Button>
          </div>
          {bg.imageUrl ? (
            <div className="space-y-1.5">
              <img src={bg.imageUrl} alt="Background preview" className="h-24 w-full rounded-lg border object-cover" />
              <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-destructive hover:text-destructive" disabled={!api.canEdit} onClick={() => set({ imageUrl: undefined })}>
                Remove image
              </Button>
            </div>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            <Grid3x3 className="mr-1 inline h-3 w-3" />
            Images cover the page. Exports include the background.
          </p>
        </Section>
      )}

      {bg.type === "transparent" && (
        <Section title="Transparent">
          <div
            className="h-20 w-full rounded-lg border"
            style={{ backgroundImage: "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)", backgroundSize: "14px 14px" }}
            aria-hidden
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            No background. PNG and WebP exports will keep full transparency.
          </p>
        </Section>
      )}

      <Section title="Applies to">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          This background is set on <strong>{api.page.name}</strong>. Open the Pages panel to set different backgrounds per page.
        </p>
      </Section>
    </div>
  )
}
