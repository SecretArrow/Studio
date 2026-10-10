"use client"

/**
 * BlockSurface — the document editing surface: A4 pages stacked vertically
 * with absolutely-positioned blocks.
 *
 *  • Text blocks: click to edit (contentEditable, raw text), decorated view
 *    (bullets, [text](url) links, quote background) when not editing.
 *  • Images / tables render natively; charts, QR and any other element type
 *    render through the shared headless renderer (same pixels as export).
 *  • Selected blocks show a drag grip (touch-friendly, ≥44px target).
 *  • Derived header/footer/page numbers render as read-only ghosts.
 */

import { useEffect, useRef, useState } from "react"
import type { DesignDoc, DesignElement, ImageElement, ShapeElement, TableElement, TextElement } from "@/lib/design/types"
import { filtersToCss, renderPageToCanvas } from "@/lib/editor/export"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { contentWidth, isTocBlock, marginsOf, printExtras } from "./model"

export interface BlockSurfaceProps {
  doc: DesignDoc
  canEdit: boolean
  zoom: number
  selectedId: string | null
  editingId: string | null
  onSelect: (id: string | null) => void
  onStartEdit: (id: string | null) => void
  onTextChange: (id: string, text: string) => void
  onMoveElement: (id: string, x: number, y: number) => void
}

/* --------------------------- rasterized elements --------------------------- */

const rasterCache = new Map<string, string>()

async function cachedRaster(doc: DesignDoc, el: DesignElement): Promise<string> {
  const key = `${doc.width}x${doc.height}|${JSON.stringify(el)}`
  const hit = rasterCache.get(key)
  if (hit) return hit
  const tmp: DesignDoc = { ...doc, pages: [{ ...doc.pages[0], background: { type: "transparent" }, elements: [el] }] }
  const canvas = await renderPageToCanvas(tmp, tmp.pages[0], { transparent: true, scale: 2 })
  const url = canvas.toDataURL("image/png")
  if (rasterCache.size > 140) rasterCache.clear()
  rasterCache.set(key, url)
  return url
}

const RASTER_TYPES = new Set(["chart", "qr", "icon", "media", "sticky", "freehand", "connector", "frame"])

function useRasterizedUrls(doc: DesignDoc, elements: DesignElement[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    let alive = true
    const targets = elements.filter((el) => RASTER_TYPES.has(el.type))
    const t = setTimeout(() => {
      if (targets.length === 0) {
        if (alive) setUrls((prev) => (Object.keys(prev).length > 0 ? {} : prev))
        return
      }
      void Promise.all(targets.map(async (el) => [el.id, await cachedRaster(doc, el)] as const)).then((entries) => {
        if (alive) setUrls(Object.fromEntries(entries))
      })
    }, 0)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [doc, elements])
  return urls
}

/* ------------------------------ link decoration ------------------------------ */

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g

function linkify(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  LINK_RE.lastIndex = 0
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <span key={`${m.index}-${m[2]}`} className="underline" style={{ color: "#7c3aed" }} title={m[2]}>
        {m[1]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function decorate(el: TextElement): React.ReactNode {
  const paragraphs = el.text.split("\n")
  let counter = 1
  return paragraphs.map((para, i) => {
    let prefix: React.ReactNode = null
    if (el.listStyle === "bullet" && para.trim() !== "") prefix = "•  "
    else if (el.listStyle === "number" && para.trim() !== "") {
      prefix = `${counter}.  `
      counter += 1
    }
    const isEmpty = para === ""
    return (
      <div key={i}>
        {isEmpty && !prefix ? (
          <br />
        ) : (
          <>
            {prefix}
            {linkify(para)}
          </>
        )}
      </div>
    )
  })
}

function textStyle(el: TextElement): React.CSSProperties {
  return {
    fontFamily: `'${el.fontFamily}', sans-serif`,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    fontStyle: el.italic ? "italic" : "normal",
    textDecoration: [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ") || "none",
    textAlign: el.align,
    textTransform: el.uppercase ? "uppercase" : "none",
    color: el.color,
    background: el.bgColor,
    lineHeight: el.lineHeight,
    letterSpacing: el.letterSpacing,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    padding: 2,
    borderRadius: el.bgColor ? 6 : 0,
  }
}

/* --------------------------------- surface --------------------------------- */

export function BlockSurface({ doc, canEdit, zoom, selectedId, editingId, onSelect, onStartEdit, onTextChange, onMoveElement }: BlockSurfaceProps) {
  const m = marginsOf(doc)
  const W = contentWidth(doc)
  const scrollRef = useRef<HTMLDivElement>(null)

  // raster urls for chart/qr/etc — collected across all pages
  const allElements: DesignElement[] = []
  for (const page of doc.pages) allElements.push(...page.elements)
  const rasterUrls = useRasterizedUrls(doc, allElements)

  const containerW = doc.width * zoom

  return (
    <div ref={scrollRef} className="h-full overflow-auto bg-muted/60 px-3 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto" style={{ width: containerW }}>
        {doc.pages.map((page, pi) => {
          const extras = printExtras(doc, pi, doc.pages.length)
          return (
            <div
              key={page.id}
              data-page-index={pi}
              className="relative mb-8 bg-white shadow-md ring-1 ring-black/10"
              style={{ width: containerW, height: doc.height * zoom }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onSelect(null)
                  onStartEdit(null)
                }
              }}
            >
              <div className="absolute left-0 top-0 origin-top-left" style={{ width: doc.width, height: doc.height, transform: `scale(${zoom})` }}>
                {/* margin guide */}
                <div className="pointer-events-none absolute rounded-sm border border-dashed border-primary/25" style={{ left: m.x, top: m.top, width: W, height: Math.max(20, doc.height - m.top - m.bottom) }} aria-hidden />

                {/* derived print elements (read-only ghosts) */}
                {extras.map((el) => (
                  <div key={el.id} className="pointer-events-none absolute select-none" style={{ left: el.x, top: el.y, width: el.width, ...textStyle(el as TextElement) }}>
                    {el.type === "text" ? (el as TextElement).text : ""}
                  </div>
                ))}

                {/* user elements */}
                {page.elements.map((el) => (
                  <BlockNode
                    key={el.id}
                    el={el}
                    doc={doc}
                    canEdit={canEdit}
                    selected={selectedId === el.id}
                    editing={editingId === el.id}
                    rasterUrls={rasterUrls}
                    onSelect={onSelect}
                    onStartEdit={onStartEdit}
                    onTextChange={onTextChange}
                    onMoveElement={onMoveElement}
                  />
                ))}
              </div>
              <span className="absolute -bottom-6 right-0 text-[10px] text-muted-foreground">
                Page {pi + 1} of {doc.pages.length}
              </span>
            </div>
          )
        })}
        <div className="h-6" />
      </div>
    </div>
  )
}

/* -------------------------------- block node -------------------------------- */

interface BlockNodeProps {
  el: DesignElement
  doc: DesignDoc
  canEdit: boolean
  selected: boolean
  editing: boolean
  rasterUrls: Record<string, string>
  onSelect: (id: string | null) => void
  onStartEdit: (id: string | null) => void
  onTextChange: (id: string, text: string) => void
  onMoveElement: (id: string, x: number, y: number) => void
}

function BlockNode({ el, doc, canEdit, selected, editing, rasterUrls, onSelect, onStartEdit, onTextChange, onMoveElement }: BlockNodeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
  const interactive = canEdit && !el.locked && !el.hidden

  const beginDrag = (e: React.PointerEvent) => {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, moved: false }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const moveDrag = (e: React.PointerEvent) => {
    const d = dragRef.current
    const node = wrapRef.current
    if (!d || !node) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return
    d.moved = true
    node.style.left = `${d.origX + dx}px`
    node.style.top = `${d.origY + dy}px`
  }
  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    if (d.moved) {
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      onMoveElement(el.id, Math.round(d.origX + dx), Math.round(d.origY + dy))
      const node = wrapRef.current
      if (node) {
        node.style.left = `${d.origX}px`
        node.style.top = `${d.origY}px`
      }
    }
  }

  const isText = el.type === "text"
  const isToc = isTocBlock(el)

  const inner = (() => {
    if (el.hidden) return null
    switch (el.type) {
      case "text": {
        const t = el as TextElement
        if (editing && canEdit) {
          return (
            <div
              ref={(node) => {
                if (node && node.innerText !== t.text) node.innerText = t.text
              }}
              contentEditable
              suppressContentEditableWarning
              className="outline-none ring-2 ring-primary"
              style={{ ...textStyle(t), minHeight: t.height, cursor: "text" }}
              onInput={(e) => onTextChange(el.id, (e.target as HTMLDivElement).innerText)}
              onBlur={() => onStartEdit(null)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              data-toc={isToc || undefined}
            />
          )
        }
        return (
          <div style={{ ...textStyle(t), minHeight: t.height, cursor: interactive ? "text" : "default" }}>
            {isToc ? <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary/60">TOC</span> : null}
            {decorate(t)}
          </div>
        )
      }
      case "image": {
        const img = el as ImageElement
        return (
          <img
            src={img.src}
            alt={img.name ?? "Image"}
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
            style={{ borderRadius: img.cornerRadius, filter: filtersToCss(img) !== "none" ? filtersToCss(img) : undefined, objectFit: "fill" }}
          />
        )
      }
      case "table": {
        const tb = el as TableElement
        return (
          <table className="pointer-events-none h-full w-full border-collapse select-none" style={{ fontFamily: `'${tb.fontFamily}', sans-serif`, fontSize: tb.fontSize }}>
            <tbody>
              {tb.rows.map((row, ri) => {
                const isHeader = tb.headerRow && ri === 0
                return (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border px-2 py-1"
                        style={{
                          borderColor: tb.borderColor,
                          background: isHeader ? tb.headerBg : ri % 2 === 1 ? tb.altRowBg : tb.rowBg,
                          color: isHeader ? tb.headerColor : tb.color,
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      }
      case "shape": {
        const s = el as ShapeElement
        if (s.variant === "line" || s.variant === "arrow") {
          return <div className="pointer-events-none w-full" style={{ borderTop: `${Math.max(1, s.strokeWidth || 2)}px solid ${s.fill === "transparent" ? s.stroke : s.fill}`, marginTop: s.height / 2 - 1 }} />
        }
        return <div className="pointer-events-none h-full w-full" style={{ background: s.fill, borderRadius: s.cornerRadius, border: s.strokeWidth > 0 && s.stroke !== "transparent" ? `${s.strokeWidth}px solid ${s.stroke}` : undefined }} />
      }
      default: {
        const url = rasterUrls[el.id]
        if (!url) return <div className="pointer-events-none h-full w-full animate-pulse rounded bg-primary/10" />
        return <img src={url} alt={el.name ?? el.type} draggable={false} className="pointer-events-none h-full w-full select-none" />
      }
    }
  })()

  return (
    <div
      ref={wrapRef}
      className={cn("absolute", selected && interactive && "outline outline-2 outline-primary/70 -outline-offset-2", el.hidden && "hidden")}
      style={{ left: el.x, top: el.y, width: el.width, minHeight: isText ? undefined : el.height, height: isText ? undefined : el.height, opacity: Math.max(0.1, Math.min(1, el.opacity)) }}
      onPointerDown={() => {
        if (interactive && !editing) onSelect(el.id)
      }}
    >
      {inner}
      {selected && interactive && !editing ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label={`Move ${el.name ?? el.type}`}
          className="absolute -left-3 -top-3 z-10 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow active:cursor-grabbing"
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  )
}
