"use client"

/**
 * Pages panel — bottom strip with live thumbnails, add/duplicate/delete,
 * reorder (drag or arrows), rename (double-click). Shown when toggled or
 * when the document has more than one page.
 */

import { useEffect, useState } from "react"
import type { CanvasApi } from "./ui"
import type { PageModel } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Copy, FilePlus2, Trash2, X } from "lucide-react"

function PageThumb({ renderThumb, page, width, height }: { renderThumb: (p: PageModel, width: number) => Promise<string>; page: PageModel; width: number; height: number }) {
  const [thumb, setThumb] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      void renderThumb(page, 240).then((url) => {
        if (alive) setThumb(url)
      })
    }, 120)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [renderThumb, page])
  return (
    <div
      className="relative w-full overflow-hidden rounded-md border bg-white"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {thumb ? (
        <img src={thumb} alt={`Preview of ${page.name}`} className="h-full w-full object-contain" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
    </div>
  )
}

export function PagesPanel({ api, onClose }: { api: CanvasApi; onClose?: () => void }) {
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const pages = api.doc.pages

  if (!api.view.pagesOpen) return null

  return (
    <section className="border-t bg-card" aria-label="Pages">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pages</h3>
        <div className="ml-1 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!api.canEdit} onClick={() => api.addPage(false)}>
            <FilePlus2 className="h-3.5 w-3.5" /> Add page
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!api.canEdit} onClick={() => api.addPage(true)}>
            <Copy className="h-3.5 w-3.5" /> Duplicate current
          </Button>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={onClose} aria-label="Hide pages panel">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto px-2 pb-2.5">
        {pages.map((page, i) => {
          const current = i === api.pageIndex
          return (
            <div
              key={page.id}
              draggable={api.canEdit}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) api.movePage(dragFrom, i)
                setDragFrom(null)
              }}
              className={cn(
                "group relative w-[132px] shrink-0 rounded-lg border-2 p-1.5 pb-1 transition",
                current ? "border-primary bg-accent" : "border-transparent hover:border-border hover:bg-accent/50",
              )}
            >
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => api.setPageIndex(i)}
                aria-label={`Switch to ${page.name}`}
                aria-current={current}
              >
                <PageThumb renderThumb={api.renderThumb} page={page} width={api.doc.width} height={api.doc.height} />
              </button>
              {renamingIndex === i ? (
                <Input
                  autoFocus
                  defaultValue={page.name}
                  className="mt-1 h-6 text-[11px]"
                  aria-label="Page name"
                  onBlur={(e) => {
                    api.renamePage(i, e.target.value || page.name)
                    setRenamingIndex(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                    if (e.key === "Escape") setRenamingIndex(null)
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="mt-1 block w-full truncate rounded px-0.5 text-center text-[11px] font-medium"
                  onClick={() => api.setPageIndex(i)}
                  onDoubleClick={() => api.canEdit && setRenamingIndex(i)}
                  title="Double-click to rename"
                >
                  {page.name}
                </button>
              )}
              {pages.length > 1 && api.canEdit && (
                <>
                  <button
                    type="button"
                    aria-label="Move page left"
                    disabled={i === 0}
                    onClick={() => api.movePage(i, i - 1)}
                    className="absolute left-0.5 top-2.5 flex h-6 w-5 items-center justify-center rounded-md bg-background/90 opacity-0 shadow transition group-hover:opacity-100 max-md:opacity-100 disabled:opacity-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move page right"
                    disabled={i === pages.length - 1}
                    onClick={() => api.movePage(i, i + 1)}
                    className="absolute right-0.5 top-2.5 flex h-6 w-5 items-center justify-center rounded-md bg-background/90 opacity-0 shadow transition group-hover:opacity-100 max-md:opacity-100 disabled:opacity-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${page.name}`}
                    onClick={() => api.deletePage(i)}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow transition group-hover:opacity-100 max-md:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}



