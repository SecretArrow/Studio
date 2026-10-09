"use client"

/** Photo source panel: upload / replace, load from URL, pool management. */

import { useRef, useState } from "react"
import type { PhotoApi } from "./api"
import { EmptyHint, PanelSection } from "./ui"
import { importImageFile, importImageUrl } from "./upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImagePlus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

export function PhotoPanel({ api }: { api: PhotoApi }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlValue, setUrlValue] = useState("")
  const [busy, setBusy] = useState(false)

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !api.canEdit) return
    setBusy(true)
    try {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 12)
      const imported: { src: string; width: number; height: number }[] = []
      for (const file of list) {
        try {
          const one = await importImageFile(file)
          if (one) imported.push(one)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Could not import ${file.name}`)
        }
      }
      if (imported.length === 0) {
        toast.error("No usable image files found")
        return
      }
      api.replaceSubject(imported[0].src, imported[0])
      api.addToPool(imported.map((i) => i.src))
      toast.success(imported.length > 1 ? `${imported.length} photos added` : "Photo replaced")
    } finally {
      setBusy(false)
    }
  }

  const onUrl = async () => {
    if (!api.canEdit || !urlValue.trim()) return
    setBusy(true)
    try {
      const one = await importImageUrl(urlValue)
      if (!one) {
        toast.error("Could not load that URL")
        return
      }
      api.replaceSubject(one.src, one)
      api.addToPool([one.src])
      setUrlValue("")
      toast.success("Image loaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load that URL")
    } finally {
      setBusy(false)
    }
  }

  const replaceFromPool = async (src: string) => {
    const { loadImage } = await import("@/lib/editor/export")
    const img = await loadImage(src)
    if (!img) {
      toast.error("That image could not be loaded anymore")
      return
    }
    api.replaceSubject(src, { width: img.naturalWidth, height: img.naturalHeight })
    toast.success("Subject replaced")
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Photo">
        {busy ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" /> Importing image…
          </div>
        ) : null}
        <label className="flex min-h-[88px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-center transition hover:border-primary hover:bg-accent">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold">{api.subject ? "Replace photo" : "Upload a photo"}</span>
          <span className="text-[11px] text-muted-foreground">Pick several at once — extras go to the collage pool</span>
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
        {api.subject ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            disabled={!api.canEdit}
            onClick={() => {
              api.removeSubject()
              toast.success("Photo removed")
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove photo
          </Button>
        ) : (
          <EmptyHint title="No photo yet" note="Upload an image above or load one from a URL — then adjust, filter, crop and export it." />
        )}
      </PanelSection>

      <PanelSection title="From URL">
        <div className="flex items-center gap-2">
          <Input
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onUrl()
            }}
            placeholder="https://…/photo.jpg"
            className="h-8 text-xs"
            aria-label="Image URL"
          />
          <Button size="sm" className="h-8" disabled={busy || !urlValue.trim() || !api.canEdit} onClick={() => void onUrl()}>
            Load
          </Button>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          The host must allow cross-origin loading, otherwise uploads are the reliable option.
        </p>
      </PanelSection>

      {api.pool.length > 0 ? (
        <PanelSection title="Collage pool" right={<span className="text-[10px] text-muted-foreground">{api.pool.length}</span>}>
          <div className="grid grid-cols-3 gap-2">
            {api.pool.map((src, i) => (
              <button
                key={`${src.slice(0, 42)}-${i}`}
                type="button"
                aria-label={`Use pool image ${i + 1} as subject`}
                title="Use as subject"
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition hover:border-primary disabled:opacity-50"
                disabled={!api.canEdit || busy}
                onClick={() => void replaceFromPool(src)}
              >
                <img src={src} alt={`Pool image ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
              </button>
            ))}
          </div>
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
            <ImagePlus className="mt-0.5 h-3 w-3 shrink-0" />
            These images are available for the collage builder. Click one to make it the subject.
          </p>
        </PanelSection>
      ) : null}
    </div>
  )
}
