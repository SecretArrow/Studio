"use client"

import { lazy, Suspense } from "react"
import type { ComponentType, LazyExoticComponent } from "react"
import type { EditorProps } from "./types"
import { Loader2 } from "lucide-react"

/**
 * Editor registry. Editors are code-split so the dashboard stays light.
 * Each module must default-export a React.forwardRef component matching
 * EditorProps (see ./types.ts).
 */

type EditorComponent = LazyExoticComponent<ComponentType<EditorProps>>

const CanvasEditor = lazy(() => import("./canvas-editor")) as unknown as EditorComponent
const PresentationEditor = lazy(() => import("./presentation-editor")) as unknown as EditorComponent
const VideoEditor = lazy(() => import("./video-editor")) as unknown as EditorComponent
const PhotoEditor = lazy(() => import("./photo-editor")) as unknown as EditorComponent
const DocEditor = lazy(() => import("./doc-editor")) as unknown as EditorComponent
const WhiteboardEditor = lazy(() => import("./whiteboard-editor")) as unknown as EditorComponent
const WebsiteEditor = lazy(() => import("./website-editor")) as unknown as EditorComponent
const EmailEditor = lazy(() => import("./email-editor")) as unknown as EditorComponent
const ChartEditor = lazy(() => import("./chart-editor")) as unknown as EditorComponent

export function getEditor(kind: string): EditorComponent {
  const loaders: Record<string, EditorComponent> = {
    canvas: CanvasEditor,
    presentation: PresentationEditor,
    video: VideoEditor,
    photo: PhotoEditor,
    doc: DocEditor,
    whiteboard: WhiteboardEditor,
    website: WebsiteEditor,
    email: EmailEditor,
    chart: ChartEditor,
  }
  return loaders[kind] ?? CanvasEditor
}

export function EditorSuspense() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading editor…</p>
      </div>
    </div>
  )
}

export { Suspense }
