"use client"

/**
 * SlideSorter — horizontal thumbnail strip under the stage.
 * Click to select, drag to reorder, add / duplicate / delete slides.
 */

import { useEffect, useState } from "react"
import type { DesignDoc, PageModel } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Copy, FilePlus2, Trash2 } from "lucide-react"

export interface SlideSorterProps {
  doc: DesignDoc
  pageIndex: number
  canEdit: boolean
  onSelect: (index: number) => void
  onAdd: () => void
  onDuplicate: () => void
  onDelete: (index: number) => void
  onMove: (from: number, to: number) => void
  renderThumb: (page: PageModel, width: number) => Promise<string>
}

function SlideThumb({ renderThumb, page, width, height }: { renderThumb: (p: PageModel, width: number) => Promise<string>; page: PageModel; width: number; height: number }) {
  const [thumb, setThumb] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      void renderThumb(page, 260).then((url) => {
        if (alive) setThumb(url)
      })
    }, 90)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [renderThumb, page])
  return (
    <div className="relative w-full overflow-hidden rounded-md border bg-white" style={{ aspectRatio: `${width} / ${height}` }}>
      {thumb ? (
        <img src={thumb} alt={`Slide ${page.name}`} className="h-full w-full object-contain" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
      )}
    </div>
  )
}

export function SlideSorter({ doc, pageIndex, canEdit, onSelect, onAdd, onDuplicate, onDelete, onMove, renderThumb }: SlideSorterProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null)

  return (
    <section className="shrink-0 border-t bg-card" aria-label="Slides">
      <div className="flex items-center gap-1 px-2 pt-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Slides</h3>
        {canEdit ? (
          <div className="ml-1 flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onAdd}>
              <FilePlus2 className="h-3.5 w-3.5" /> Add slide
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onDuplicate}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
          </div>
        ) : null}
        <span className="ml-auto pr-1 text-[11px] tabular-nums text-muted-foreground">
          {pageIndex + 1} / {doc.pages.length}
        </span>
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto px-2 pb-2 pt-1.5">
        {doc.pages.map((page, i) => {
          const current = i === pageIndex
          return (
            <div
              key={page.id}
              draggable={canEdit}
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) onMove(dragFrom, i)
                setDragFrom(null)
              }}
              className={cn(
                "group relative w-[128px] shrink-0 rounded-lg border-2 p-1 transition",
                current ? "border-primary bg-accent" : "border-transparent hover:border-border hover:bg-accent/50",
              )}
            >
              <button type="button" className="block w-full text-left" onClick={() => onSelect(i)} aria-label={`Go to slide ${i + 1}`} aria-current={current}>
                <SlideThumb renderThumb={renderThumb} page={page} width={doc.width} height={doc.height} />
              </button>
              <span className="mt-0.5 block text-center text-[10px] font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              {canEdit && doc.pages.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Delete slide ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(i)
                  }}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow transition focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
