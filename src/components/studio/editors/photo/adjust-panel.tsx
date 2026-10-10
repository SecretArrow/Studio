"use client"

/** Adjustments panel — every slider maps 1:1 onto the stored PhotoFilters. */

import type { PhotoApi } from "./api"
import type { PhotoFilters } from "./filters"
import { DEFAULT_PHOTO_FILTERS, computeAutoEnhance, isNeutralFilters, toPhotoFilters } from "./filters"
import { loadImage } from "@/lib/editor/export"
import { EmptyHint, PanelSection, SliderRow } from "./ui"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

interface AdjustmentDef {
  key: keyof PhotoFilters
  label: string
  min: number
  max: number
  step?: number
  hint?: string
}

const ADJUSTMENTS: AdjustmentDef[] = [
  { key: "exposure", label: "Exposure", min: -100, max: 100, hint: "brightness stops" },
  { key: "brightness", label: "Brightness", min: 0, max: 200 },
  { key: "contrast", label: "Contrast", min: 0, max: 200 },
  { key: "saturation", label: "Saturation", min: 0, max: 200 },
  { key: "temperature", label: "Temperature", min: -100, max: 100, hint: "color-grade approx" },
  { key: "hue", label: "Hue", min: -180, max: 180, hint: "hue shift" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, hint: "pixel curve" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, hint: "pixel curve" },
  { key: "gamma", label: "Gamma", min: 0.2, max: 2.4, step: 0.05, hint: "midtone curve" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, hint: "unsharp mask" },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5 },
  { key: "vignette", label: "Vignette", min: 0, max: 100 },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100 },
  { key: "sepia", label: "Sepia", min: 0, max: 100 },
  { key: "invert", label: "Invert", min: 0, max: 100 },
]

export function AdjustPanel({ api }: { api: PhotoApi }) {
  const subject = api.subject
  const filters = api.filters

  const onAutoEnhance = async () => {
    if (!subject) return
    const img = await loadImage(subject.src)
    if (!img) {
      toast.error("Image is not loaded yet — try again in a moment")
      return
    }
    const patch = computeAutoEnhance(img, subject.crop)
    api.updateFilters(patch)
    toast.success("Auto enhance applied — real histogram levels analysis (no AI)")
  }

  if (!subject) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <PanelSection title="Adjust">
          <EmptyHint title="Add a photo first" note="Adjustments appear as soon as a photo is on the canvas." />
        </PanelSection>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection
        title="Auto"
        right={
          !isNeutralFilters(filters) ? (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={api.resetFilters}>
              Reset all
            </Button>
          ) : null
        }
      >
        <Button size="sm" className="w-full gap-1.5" disabled={!api.canEdit} onClick={() => void onAutoEnhance()}>
          <Sparkles className="h-3.5 w-3.5" /> Auto enhance
        </Button>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Deterministic histogram levels analysis (0.4% percentile stretch + midtone gamma). Not AI — the same photo
          always yields the same result.
        </p>
      </PanelSection>

      <PanelSection title="Adjustments">
        {ADJUSTMENTS.map((adj) => (
          <SliderRow
            key={adj.key}
            label={adj.label}
            hint={adj.hint}
            value={filters[adj.key]}
            def={DEFAULT_PHOTO_FILTERS[adj.key]}
            min={adj.min}
            max={adj.max}
            step={adj.step ?? 1}
            disabled={!api.canEdit}
            coalesceKey={`adj:${adj.key}`}
            onCommit={(v) => api.updateFilters({ [adj.key]: v } as Partial<PhotoFilters>, `adj:${adj.key}`)}
          />
        ))}
        <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
          All adjustments are non-destructive: they are stored with the document and applied at preview/export time.
          {toPhotoFilters(subject.filters).blur > 0 ? " Blur edges feather out by design." : ""}
        </p>
      </PanelSection>
    </div>
  )
}
