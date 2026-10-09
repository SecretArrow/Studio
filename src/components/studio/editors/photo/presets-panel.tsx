"use client"

/**
 * Filter presets panel — 12 real parametric presets rendered as honest
 * thumbnails (the actual pipeline applied to a small copy of the subject).
 */

import { useEffect, useState } from "react"
import type { PhotoApi } from "./api"
import { DEFAULT_PHOTO_FILTERS, FILTER_PRESETS, toPhotoFilters, type PhotoFilters } from "./filters"
import { loadImage } from "@/lib/editor/export"
import { renderPresetThumb } from "./render"
import { EmptyHint, PanelSection } from "./ui"

function PresetCard({
  img,
  preset,
  disabled,
  active,
  onApply,
}: {
  img: HTMLImageElement
  preset: { id: string; name: string; values: Partial<PhotoFilters> }
  disabled: boolean
  active: boolean
  onApply: () => void
}) {
  const [thumb, setThumb] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const f: PhotoFilters = { ...DEFAULT_PHOTO_FILTERS, ...preset.values }
    void renderPresetThumb(img, f, 132).then((url) => {
      if (!cancelled) setThumb(url)
    })
    return () => {
      cancelled = true
    }
  }, [img, preset])

  return (
    <button
      type="button"
      className="group overflow-hidden rounded-lg border text-left transition hover:border-primary disabled:opacity-50"
      disabled={disabled}
      onClick={onApply}
      aria-label={`Apply ${preset.name} filter`}
    >
      <div className="relative aspect-square w-full bg-muted">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-muted" />
        )}
        {active ? <div className="absolute inset-0 ring-2 ring-inset ring-primary" /> : null}
      </div>
      <div className="px-2 py-1.5 text-xs font-medium">{preset.name}</div>
    </button>
  )
}

export function PresetsPanel({ api }: { api: PhotoApi }) {
  const subject = api.subject
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => setImg(null), 0)
    if (!subject?.src) return () => clearTimeout(t)
    void loadImage(subject.src).then((loaded) => {
      if (!cancelled) setImg(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [subject?.src])

  if (!subject) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <PanelSection title="Filters">
          <EmptyHint title="Add a photo first" note="Filter presets appear as soon as a photo is on the canvas." />
        </PanelSection>
      </div>
    )
  }

  const current = toPhotoFilters(subject.filters)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Filter presets">
        {!img ? <div className="h-16 w-full animate-pulse rounded-lg bg-muted" /> : null}
        {img ? (
          <div className="grid grid-cols-2 gap-2">
            {FILTER_PRESETS.map((preset) => {
              const f: PhotoFilters = { ...DEFAULT_PHOTO_FILTERS, ...preset.values }
              const active = (Object.keys(DEFAULT_PHOTO_FILTERS) as (keyof PhotoFilters)[]).every(
                (k) => current[k] === f[k],
              )
              return (
                <PresetCard
                  key={preset.id}
                  img={img}
                  preset={preset}
                  disabled={!api.canEdit}
                  active={active}
                  onApply={() => api.applyPreset(preset)}
                />
              )
            })}
          </div>
        ) : null}
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Presets are real combinations of the adjustment sliders. Applying one replaces the current adjustment values
          (undo works as usual).
        </p>
      </PanelSection>
    </div>
  )
}
