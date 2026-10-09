"use client"

/**
 * Shared contract between the photo editor orchestrator (photo-editor.tsx)
 * and its sub-panels / stage (src/components/studio/editors/photo/*).
 * Modeled after the canvas editor's CanvasApi pattern.
 */

import type { BackgroundSpec, DesignDoc, DesignElement, ImageElement, PageModel, ShapeElement, ShapeVariant, TextElement } from "@/lib/design/types"
import type { FilterPreset, PhotoFilters } from "./filters"

export type CollageLayoutId = "2x1" | "2x2" | "3x1" | "1+3"

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

/** Everything a photo sub-panel or the stage may need from the editor. */
export interface PhotoApi {
  doc: DesignDoc
  page: PageModel
  canEdit: boolean
  /** first image element on the page (the photo being edited) */
  subject: ImageElement | null
  /** overlays = every non-image element, in z-order */
  overlays: DesignElement[]
  selectedId: string | null

  /* subject */
  replaceSubject(src: string, natural: { width: number; height: number }): void
  removeSubject(): void

  /* adjustments */
  filters: PhotoFilters
  updateFilters(patch: Partial<PhotoFilters>, coalesceKey?: string): void
  resetFilters(): void
  applyPreset(preset: FilterPreset): void
  autoEnhance(): void

  /* transform */
  rotate90(dir: 1 | -1): void
  toggleFlip(axis: "h" | "v"): void
  straighten: number
  setStraighten(deg: number): void

  /* crop */
  cropMode: boolean
  cropRect: CropRect | null
  setCropMode(open: boolean): void
  setCropRect(rect: CropRect): void
  cropAspect: string
  setCropAspect(aspect: string): void
  applyCrop(): void

  /* overlays */
  selectOverlay(id: string | null): void
  addOverlayText(): void
  addOverlayShape(variant: ShapeVariant): void
  updateOverlay(id: string, patch: Partial<TextElement> & Partial<ShapeElement>, coalesceKey?: string): void
  deleteOverlay(id: string): void

  /* collage */
  pool: string[]
  addToPool(srcs: string[]): void
  buildCollage(layout: CollageLayoutId): void

  /* page background */
  setBackground(bg: BackgroundSpec): void

  /* history */
  undo(): void
  redo(): void
  canUndo: boolean
  canRedo: boolean

  /* view */
  compare: boolean
  setCompare(v: boolean): void
  /** short label while a long operation (crop bake / collage build) runs */
  busy: string | null
}
