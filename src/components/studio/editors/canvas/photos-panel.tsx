"use client"

/**
 * Photos panel — multi-file upload (client-side, data URLs) plus browsing
 * uploaded assets from GET /api/assets?kind=image. If the endpoint is not
 * available (or errors) we show an honest empty state, never a crash.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { CanvasApi } from "./ui"
import { Section } from "./ui"
import { createImage } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ImagePlus, RefreshCcw, Upload } from "lucide-react"

interface RemoteAsset {
  id: string
  url: string
  name: string
}

export function PhotosPanel({ api }: { api: CanvasApi }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [remote, setRemote] = useState<RemoteAsset[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const loadRemote = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch("/api/assets?kind=image", { credentials: "same-origin" })
      if (!res.ok) throw new Error("unavailable")
      const body = (await res.json()) as { assets?: unknown } | unknown[]
      const list = Array.isArray(body) ? body : Array.isArray(body.assets) ? body.assets : []
      const mapped: RemoteAsset[] = []
      for (const raw of list) {
        const item = raw as Record<string, unknown>
        const url = (item.url ?? item.fileUrl ?? item.src ?? item.path) as string | undefined
        if (typeof url === "string" && url.length > 0) {
          mapped.push({
            id: String(item.id ?? url),
            url: url.startsWith("http") || url.startsWith("data:") || url.startsWith("/") ? url : `/${url}`,
            name: typeof item.name === "string" ? item.name : typeof item.label === "string" ? item.label : "Image",
          })
        }
      }
      setRemote(mapped)
    } catch {
      setFailed(true)
      setRemote([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRemote()
  }, [loadRemote])

  function addImageFromSrc(src: string, name: string, natural?: { w: number; h: number }) {
    const maxW = api.doc.width * 0.6
    const ratio = natural ? Math.min(1, maxW / natural.w) : 1
    const width = natural ? natural.w * ratio : Math.min(maxW, 480)
    const height = natural ? natural.h * ratio : (width * 2) / 3
    const pos = api.dropPos(width, height)
    const el = createImage({ src, x: pos.x, y: pos.y, width, height, name })
    api.addElements([el])
  }

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, 12)
    let added = 0
    for (const file of list) {
      if (!file.type.startsWith("image/")) continue
      const reader = new FileReader()
      reader.onload = () => {
        const src = String(reader.result)
        const probe = new Image()
        probe.onload = () => {
          added += 1
          // cascade multiple uploads so they do not perfectly overlap
          const maxW = api.doc.width * 0.6
          const ratio = Math.min(1, maxW / probe.naturalWidth)
          const width = probe.naturalWidth * ratio
          const height = probe.naturalHeight * ratio
          const basePos = api.dropPos(width, height)
          api.addElements([
            createImage({
              src,
              x: basePos.x + (added - 1) * 24,
              y: basePos.y + (added - 1) * 24,
              width,
              height,
              name: file.name,
            }),
          ])
        }
        probe.src = src
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <Section title="Upload">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-[92px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-card px-4 py-5 text-center transition hover:border-primary hover:bg-accent"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-semibold">Upload images</span>
          <span className="text-[11px] text-muted-foreground">PNG, JPG, WebP, GIF or SVG — pick several at once</span>
        </button>
      </Section>

      <Section
        title="Your uploads"
        right={
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => void loadRemote()} aria-label="Reload uploads">
            <RefreshCcw className="h-3 w-3" />
          </Button>
        }
      >
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
        ) : failed ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <ImagePlus className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">Can’t load your uploaded library right now.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Upload your own images above — everything works offline.</p>
          </div>
        ) : remote && remote.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {remote.map((asset) => (
              <button
                key={asset.id}
                type="button"
                title={asset.name}
                aria-label={`Add ${asset.name}`}
                onClick={() => {
                  const probe = new Image()
                  probe.onload = () => addImageFromSrc(asset.url, asset.name, { w: probe.naturalWidth, h: probe.naturalHeight })
                  probe.onerror = () => addImageFromSrc(asset.url, asset.name)
                  probe.src = asset.url
                }}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition hover:border-primary"
              >
                <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <ImagePlus className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">No uploaded images yet.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Upload your own images — they stay private to your account.</p>
          </div>
        )}
      </Section>
    </div>
  )
}
