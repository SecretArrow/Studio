"use client"

/**
 * Shared contract between the canvas editor orchestrator (canvas-editor.tsx)
 * and its sub-panels (left rail, properties, pages, stage).
 * Plus tiny UI atoms used across the panels.
 */

import type { BackgroundSpec, DesignDoc, DesignElement, PageModel } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SWATCH_PALETTES } from "@/lib/design/presets"
import { Ban, Pipette } from "lucide-react"
import type { ReactNode } from "react"

export type ReorderDir = "front" | "forward" | "backward" | "back"

export interface ViewState {
  zoom: number
  panX: number
  panY: number
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  showRulers: boolean
  showSafe: boolean
  pagesOpen: boolean
}

export interface ElementPatch {
  id: string
  patch: Partial<DesignElement>
}

/** Everything a sub-panel may need from the editor. */
export interface CanvasApi {
  doc: DesignDoc
  page: PageModel
  pageIndex: number
  canEdit: boolean
  selectedIds: string[]
  selection: DesignElement[]
  /* mutations */
  addElements(els: DesignElement[], select?: boolean): void
  updateElements(patches: ElementPatch[], opts?: { coalesceKey?: string }): void
  deleteElements(ids: string[]): void
  duplicateElements(ids: string[]): void
  selectIds(ids: string[], additive?: boolean): void
  reorder(ids: string[], dir: ReorderDir): void
  groupSelected(): void
  ungroupSelected(): void
  renameElement(id: string, name: string): void
  /* clipboard */
  copySelection(cut?: boolean): void
  pasteClipboard(): void
  /* pages */
  setPageIndex(i: number): void
  addPage(duplicate: boolean): void
  deletePage(index: number): void
  movePage(from: number, to: number): void
  renamePage(index: number, name: string): void
  setPageBackground(bg: BackgroundSpec): void
  /* view */
  view: ViewState
  setView(patch: Partial<ViewState>): void
  fitToScreen(): void
  setZoom(z: number): void
  /* history */
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean
  /* misc */
  startInlineEdit(id: string): void
  renderThumb(page: PageModel, width: number): Promise<string>
  /** viewport-centered drop position for newly added elements of a given size */
  dropPos(w: number, h: number): { x: number; y: number }
}

export const DEFAULT_VIEW: ViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: false,
  gridSize: 20,
  snapToGrid: false,
  showRulers: false,
  showSafe: false,
  pagesOpen: false,
}

/* ------------------------------- UI atoms ------------------------------- */

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="border-b px-3 py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {right}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

export function IconBtn({
  label,
  onClick,
  children,
  active,
  disabled,
  className,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={`h-8 w-8 shrink-0 ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

/** Numeric input that commits immediately with a coalesce key per field. */
export function NumField({
  label,
  value,
  onCommit,
  min,
  max,
  step = 1,
  coalesceKey,
  className,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
  min?: number
  max?: number
  step?: number
  coalesceKey?: string
  className?: string
}) {
  return (
    <label className={`flex min-w-0 flex-1 flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <Input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!Number.isNaN(v)) onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)))
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        min={min}
        max={max}
        step={step}
        className="h-8 px-2 text-xs"
        aria-label={label}
        data-coalesce={coalesceKey}
      />
    </label>
  )
}

/** Color picker: native color input + hex field + studio swatch palettes. */
export function ColorField({ value, onChange, label, allowTransparent }: { value: string; onChange: (v: string) => void; label?: string; allowTransparent?: boolean }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#8b5cf6"
  return (
    <div className="space-y-1.5">
      {label ? <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span> : null}
      <div className="flex items-center gap-1.5">
        <label
          className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm"
          aria-label={`${label ?? "Color"} picker`}
          style={{ backgroundImage: value === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)" : undefined, backgroundSize: "8px 8px" }}
        >
          <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="absolute -left-1 -top-1 h-10 w-10 cursor-pointer border-0 bg-transparent p-0" />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 min-w-0 flex-1 px-2 font-mono text-xs" aria-label={`${label ?? "Color"} hex value`} />
        {allowTransparent ? (
          <Button variant={value === "transparent" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 shrink-0" onClick={() => onChange("transparent")} aria-label="Transparent" title="Transparent">
            <Ban className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 w-full justify-start gap-1.5 text-xs">
            <Pipette className="h-3 w-3" /> Swatches
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2" side="right" align="start">
          {SWATCH_PALETTES.map((p) => (
            <div key={p.name}>
              <p className="mb-1 text-[10px] font-medium text-muted-foreground">{p.name}</p>
              <div className="flex gap-1">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`${p.name} ${c}`}
                    className="h-6 w-6 rounded border border-black/10 shadow-sm transition hover:scale-110"
                    style={{ background: c }}
                    onClick={() => onChange(c)}
                  />
                ))}
              </div>
            </div>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
