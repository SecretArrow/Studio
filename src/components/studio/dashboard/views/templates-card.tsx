"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, Loader2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface TemplateRow {
  id: string
  slug: string
  name: string
  category: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  featured: boolean
  license: string
}

/* ------------------------- library preview placeholder ------------------------- */

const PREVIEW_GRADIENTS: [string, string][] = [
  ["#7c3aed", "#db2777"],
  ["#f97316", "#fde047"],
  ["#059669", "#a7f3d0"],
  ["#db2777", "#f9a8d4"],
  ["#0d9488", "#134e4a"],
  ["#b45309", "#fcd34d"],
  ["#111827", "#7c3aed"],
  ["#f43f5e", "#fb923c"],
  ["#6d28d9", "#f5f3ff"],
  ["#78350f", "#fbbf24"],
]

function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0
  return Math.abs(h)
}

function orientationLabel(w: number, h: number): string {
  const r = w / h
  if (r > 1.05) return "Landscape"
  if (r < 0.95) return "Portrait"
  return "Square"
}

/**
 * Deterministic gradient placeholder for the LIBRARY GRID only (no thumbnails
 * are generated at seed time). The real design always opens fully editable.
 */
export function TemplatePreviewBox({
  template,
  className,
}: {
  template: Pick<TemplateRow, "slug" | "name" | "category" | "width" | "height">
  className?: string
}) {
  const [c1, c2] = PREVIEW_GRADIENTS[hashSlug(template.slug) % PREVIEW_GRADIENTS.length]
  return (
    <div
      className={cn("relative flex h-full w-full flex-col justify-between p-3 text-white", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
          {template.category}
        </span>
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium">
          {orientationLabel(template.width, template.height)} · {template.width}×{template.height}
        </span>
      </div>
      <p className="line-clamp-3 text-sm font-semibold leading-snug drop-shadow-sm">{template.name}</p>
    </div>
  )
}

/* --------------------------------- card --------------------------------- */

export function TemplateCard({ template }: { template: TemplateRow }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [authPrompt, setAuthPrompt] = useState(false)
  const [busy, setBusy] = useState(false)

  function openDetail() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    navigate({ name: "templates-detail", templateId: template.id })
  }

  async function useTemplate() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    setBusy(true)
    try {
      const res = await api.post<{ project: { id: string } }>(`/api/templates/${template.id}/use`)
      await qc.invalidateQueries({ queryKey: ["projects"] })
      navigate({ name: "editor", projectId: res.project.id })
    } catch {
      toast({ title: "Could not use template", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const ratio = template.width / template.height
  const aspect = ratio > 1.4 ? "aspect-video" : ratio < 0.75 ? "aspect-[3/4]" : "aspect-[4/5]"

  return (
    <>
      <div className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
        <div className={cn("relative overflow-hidden bg-muted", aspect)}>
          <button
            className="block h-full w-full text-left"
            onClick={openDetail}
            aria-label={`Open template ${template.name}`}
          >
            {template.thumbnail ? (
              <img
                src={template.thumbnail}
                alt={template.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            ) : (
              <TemplatePreviewBox template={template} />
            )}
          </button>
          {/* Hover overlay — desktop / keyboard; touch users tap the card for Preview */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
            <Button size="sm" variant="secondary" onClick={openDetail} className="min-h-[36px]">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button size="sm" onClick={useTemplate} disabled={busy} className="min-h-[36px]">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
              Customize
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3">
          <button className="min-w-0 flex-1 text-left" onClick={openDetail}>
            <p className="truncate text-sm font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {template.category} · {template.width}×{template.height}
            </p>
          </button>
          <Button size="sm" variant="secondary" className="h-8 shrink-0 sm:hidden" onClick={useTemplate} disabled={busy} aria-label="Customize template">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <Dialog open={authPrompt} onOpenChange={setAuthPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to customize templates</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Templates are free for everyone. A free account keeps your customized copy in the cloud.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAuthPrompt(false); navigate({ name: "auth" }) }}>Sign in / Register</Button>
            <Button variant="ghost" onClick={() => setAuthPrompt(false)}>Not now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Skeleton placeholder matching the card shape, for loading grids. */
export function TemplateCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className={cn("bg-muted/60", "aspect-[4/5]")}>
        <div className="h-full w-full animate-pulse bg-gradient-to-br from-muted to-muted/30" />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
