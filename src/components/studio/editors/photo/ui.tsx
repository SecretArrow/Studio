"use client"

/** Small UI atoms shared by the photo editor panels. */

import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

export function PanelSection({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b px-3 py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {right}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export function EmptyHint({ title, note }: { title: string; note?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-center">
      <p className="text-xs font-medium">{title}</p>
      {note ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  )
}

/**
 * Adjustment row: slider + numeric input + per-control reset.
 * `onCommit` fires for both the slider and the numeric field; the editor
 * coalesces rapid changes into a single history entry via coalesceKey.
 */
export function SliderRow({
  label,
  hint,
  value,
  def,
  min,
  max,
  step = 1,
  disabled,
  coalesceKey,
  onCommit,
}: {
  label: string
  hint?: string
  value: number
  def: number
  min: number
  max: number
  step?: number
  disabled?: boolean
  coalesceKey: string
  onCommit: (v: number) => void
}) {
  const dirty = Math.abs(value - def) > 1e-6
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="flex min-w-0 items-baseline gap-1.5" htmlFor={`slider-${coalesceKey}`}>
          <span className="truncate text-xs font-medium">{label}</span>
          {hint ? <span className="truncate text-[10px] text-muted-foreground">{hint}</span> : null}
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="number"
            value={Math.round(value * 100) / 100}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!Number.isNaN(v)) onCommit(Math.min(max, Math.max(min, v)))
            }}
            className="h-7 w-16 px-1.5 text-right text-xs tabular-nums"
            aria-label={`${label} value`}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled || !dirty}
            onClick={() => onCommit(def)}
            aria-label={`Reset ${label}`}
            title={`Reset ${label}`}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Slider
        id={`slider-${coalesceKey}`}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(vals) => onCommit(vals[0] ?? def)}
        aria-label={label}
      />
    </div>
  )
}
