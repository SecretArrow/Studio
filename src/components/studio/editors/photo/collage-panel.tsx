"use client"

/** Collage panel: layout picker + pool uploader for multi-photo compositions. */

import type { CollageLayoutId, PhotoApi } from "./api"
import { EmptyHint, PanelSection } from "./ui"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

const LAYOUTS: { id: CollageLayoutId; label: string; cols: number; rows: number; onePlusThree?: boolean }[] = [
  { id: "2x1", label: "2 × 1", cols: 2, rows: 1 },
  { id: "2x2", label: "2 × 2", cols: 2, rows: 2 },
  { id: "3x1", label: "3 × 1", cols: 3, rows: 1 },
  { id: "1+3", label: "1 + 3", cols: 2, rows: 3, onePlusThree: true },
]

export function CollagePanel({ api }: { api: PhotoApi }) {
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !api.canEdit) return
    const { importImageFile } = await import("./upload")
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 12)
    const srcs: string[] = []
    for (const file of list) {
      try {
        const one = await importImageFile(file)
        if (one) srcs.push(one.src)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Could not import ${file.name}`)
      }
    }
    if (srcs.length === 0) {
      toast.error("No usable image files found")
      return
    }
    if (!api.subject) {
      // first upload with an empty canvas becomes the subject as well
      const { loadImage } = await import("@/lib/editor/export")
      const img = await loadImage(srcs[0])
      if (img) api.replaceSubject(srcs[0], { width: img.naturalWidth, height: img.naturalHeight })
    }
    api.addToPool(srcs)
    toast.success(`${srcs.length} photo${srcs.length > 1 ? "s" : ""} added to the pool`)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Photos">
        {api.pool.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {api.pool.map((src, i) => (
              <div key={`${src.slice(0, 42)}-${i}`} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <img src={src} alt={`Pool image ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint title="Pool is empty" note="Upload photos here — they fill the collage frames in order." />
        )}
        <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 text-xs font-semibold transition hover:border-primary hover:bg-accent">
          <Upload className="h-4 w-4" /> Add photos
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => {
              void onFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </label>
      </PanelSection>

      <PanelSection title="New collage">
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map((l) => (
            <Button
              key={l.id}
              variant="outline"
              size="sm"
              className="h-auto flex-col gap-1.5 py-2.5"
              disabled={!api.canEdit || api.pool.length === 0 || api.busy === "collage"}
              onClick={() => api.buildCollage(l.id)}
              aria-label={`Build ${l.label} collage`}
            >
              {api.busy === "collage" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LayoutPreview cols={l.cols} rows={l.rows} onePlusThree={l.onePlusThree} />
              )}
              <span className="text-[11px] font-medium">{l.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Builds a 1080×1080 collage from the pool (images repeat if there are fewer than frames). Each frame gets a
          center cover-crop; individual photos stay editable afterwards.
        </p>
      </PanelSection>
    </div>
  )
}

function LayoutPreview({ cols, rows, onePlusThree }: { cols: number; rows: number; onePlusThree?: boolean }) {
  if (onePlusThree) {
    return (
      <div className="grid h-8 w-10 grid-cols-2 grid-rows-3 gap-0.5">
        <div className="row-span-3 rounded-[2px] bg-primary/70" />
        <div className="rounded-[2px] bg-primary/40" />
        <div className="rounded-[2px] bg-primary/40" />
        <div className="rounded-[2px] bg-primary/40" />
      </div>
    )
  }
  return (
    <div className="grid h-8 w-10 gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <div key={i} className="rounded-[2px] bg-primary/50" />
      ))}
    </div>
  )
}
