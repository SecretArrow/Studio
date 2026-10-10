"use client"

import type { DesignDoc } from "@/lib/design/types"

/**
 * Editor plugin contract
 * ----------------------
 * Every editor (canvas, presentation, video, photo, doc, whiteboard, website,
 * email) registers a component in src/components/studio/editors/registry.tsx.
 * The EditorShell owns loading/saving; editors own the document model UI.
 */

export interface EditorProjectMeta {
  id: string
  name: string
  type: string
  width: number
  height: number
}

export type ExportFormat =
  | "png"
  | "jpeg"
  | "webp"
  | "pdf"
  | "svg"
  | "json"
  | "zip"
  | "webm"
  | "mp4"
  | "html"
  | "csv"

export interface ExportRequest {
  format: ExportFormat
  scale?: number
  quality?: number
  transparent?: boolean
  /** 0-based page indices; empty = all pages */
  pages?: number[]
  filenameBase?: string
}

export interface ExportResult {
  filename: string
  blob: Blob
  /** human note, e.g. when a format is approximated */
  note?: string
}

export interface EditorHandle {
  export(req: ExportRequest): Promise<ExportResult[]>
  /** current thumbnail dataURL (small, ≤ 64KB) */
  getThumbnail(): Promise<string | null>
  /** enter presentation/fullscreen mode when the editor supports it */
  present?(): void
  /** true when the editor has unsaved changes */
  isDirty?(): boolean
}

export interface EditorProps {
  project: EditorProjectMeta
  initialDoc: DesignDoc
  /** owner | editor | commenter | viewer — editors must disable mutation for commenter/viewer */
  role: "owner" | "editor" | "commenter" | "viewer"
  /** called whenever the doc changes (autosave + ctrl+S flow handled by shell) */
  onDocChange: (doc: DesignDoc) => void
  /** low-frequency save hook (flush immediately, e.g. before navigation) */
  registerHandle: (handle: EditorHandle | null) => void
}

export type EditorKind = "canvas" | "presentation" | "video" | "photo" | "doc" | "whiteboard" | "website" | "email"
