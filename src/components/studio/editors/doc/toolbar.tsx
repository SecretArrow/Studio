"use client"

/**
 * DocToolbar — formatting toolbar + insert menu + page setup for the
 * document editor. Text styling targets the selected text block; inserts
 * act on the page that holds the selection.
 */

import { useState } from "react"
import type { TextElement } from "@/lib/design/types"
import type { DocMeta, TextStyleKind } from "./model"
import { TEXT_STYLES } from "./model"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bold, ChevronDown, Eye, Italic, Link2, List, ListOrdered, Redo2, RefreshCcw, Table2, Underline, Undo2, AlignLeft, AlignCenter, AlignRight, Minus, Plus, BarChart3, SeparatorHorizontal, Scissors, BookOpenText, Settings2, ImagePlus } from "lucide-react"

export type InsertKind = "image" | "table" | "chart" | "divider" | "page-break" | "toc" | "link"

export interface DocToolbarApi {
  canEdit: boolean
  hasSelection: boolean
  selectedText: TextElement | null
  selectedIsToc: boolean
  preview: boolean
  zoom: number
  canUndo: boolean
  canRedo: boolean
  meta: DocMeta
  undo(): void
  redo(): void
  applyStyle(kind: TextStyleKind): void
  toggle(key: "bold" | "italic" | "underline"): void
  setAlign(a: "left" | "center" | "right"): void
  setList(style: "none" | "bullet" | "number"): void
  setColor(c: string): void
  setFontSize(n: number): void
  setMeta(patch: Partial<DocMeta>): void
  togglePreview(): void
  setZoom(z: number): void
  insert(kind: InsertKind): void
  refreshToc(): void
  insertLink(label: string, url: string): void
}

const SWATCHES = ["#111827", "#374151", "#6b7280", "#8b5cf6", "#7c3aed", "#d97706", "#16a34a", "#dc2626", "#ffffff"]

function CompactColor({ value, onChange, disabled }: { value: string; onChange: (c: string) => void; disabled?: boolean }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#374151"
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-10 p-0" disabled={disabled} aria-label="Text color" title="Text color">
          <span className="h-5 w-5 rounded border border-black/15" style={{ background: value }} aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 space-y-2">
        <label className="flex items-center gap-2 text-xs">
          <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border p-0" aria-label="Custom color" />
          <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 flex-1 font-mono text-xs" aria-label="Color hex" />
        </label>
        <div className="flex flex-wrap gap-1">
          {SWATCHES.map((c) => (
            <button key={c} type="button" aria-label={`Color ${c}`} className="h-6 w-6 rounded border border-black/10 shadow-sm transition hover:scale-110" style={{ background: c }} onClick={() => onChange(c)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function DocToolbar({ api }: { api: DocToolbarApi }) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("https://")
  const t = api.selectedText

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-card px-2 py-1.5" role="toolbar" aria-label="Document formatting">
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={api.undo} disabled={!api.canUndo} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={api.redo} disabled={!api.canRedo} aria-label="Redo (Ctrl+Y)" title="Redo (Ctrl+Y)">
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      {/* paragraph style */}
      <Select
        value={t ? styleKindOf(t) : "body"}
        disabled={!api.canEdit || !t}
        onValueChange={(v) => api.applyStyle(v as TextStyleKind)}
      >
        <SelectTrigger className="h-9 w-[128px] text-xs" aria-label="Paragraph style">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(TEXT_STYLES) as TextStyleKind[]).map((k) => (
            <SelectItem key={k} value={k}>
              {TEXT_STYLES[k].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      <Button variant="outline" size="sm" className="h-9 min-w-9 px-2 font-bold" disabled={!api.canEdit || !t} aria-pressed={!!t && t.fontWeight >= 700} onClick={() => api.toggle("bold")} aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-9 min-w-9 px-2 italic" disabled={!api.canEdit || !t} aria-pressed={!!t?.italic} onClick={() => api.toggle("italic")} aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-9 min-w-9 px-2 underline" disabled={!api.canEdit || !t} aria-pressed={!!t?.underline} onClick={() => api.toggle("underline")} aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      <Button variant={t?.align === "left" ? "secondary" : "outline"} size="sm" className="h-9 min-w-9 px-2" disabled={!api.canEdit || !t} onClick={() => api.setAlign("left")} aria-label="Align left">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button variant={t?.align === "center" ? "secondary" : "outline"} size="sm" className="h-9 min-w-9 px-2" disabled={!api.canEdit || !t} onClick={() => api.setAlign("center")} aria-label="Align center">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button variant={t?.align === "right" ? "secondary" : "outline"} size="sm" className="h-9 min-w-9 px-2" disabled={!api.canEdit || !t} onClick={() => api.setAlign("right")} aria-label="Align right">
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      <Button variant={(t?.listStyle ?? "none") === "bullet" ? "secondary" : "outline"} size="sm" className="h-9 min-w-9 px-2" disabled={!api.canEdit || !t} onClick={() => api.setList((t?.listStyle ?? "none") === "bullet" ? "none" : "bullet")} aria-label="Bullet list" aria-pressed={(t?.listStyle ?? "none") === "bullet"}>
        <List className="h-4 w-4" />
      </Button>
      <Button variant={(t?.listStyle ?? "none") === "number" ? "secondary" : "outline"} size="sm" className="h-9 min-w-9 px-2" disabled={!api.canEdit || !t} onClick={() => api.setList((t?.listStyle ?? "none") === "number" ? "none" : "number")} aria-label="Numbered list" aria-pressed={(t?.listStyle ?? "none") === "number"}>
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      <CompactColor value={t?.color ?? "#374151"} disabled={!api.canEdit || !t} onChange={api.setColor} />

      <div className="flex items-center gap-0.5" aria-label="Font size">
        <Button variant="outline" size="icon" className="h-9 w-8" disabled={!api.canEdit || !t} onClick={() => api.setFontSize(Math.max(8, (t?.fontSize ?? 16) - 1))} aria-label="Decrease font size">
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-xs tabular-nums" aria-live="polite">
          {t?.fontSize ?? "–"}
        </span>
        <Button variant="outline" size="icon" className="h-9 w-8" disabled={!api.canEdit || !t} onClick={() => api.setFontSize(Math.min(96, (t?.fontSize ?? 16) + 1))} aria-label="Increase font size">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {api.selectedIsToc ? (
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" disabled={!api.canEdit} onClick={api.refreshToc}>
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh TOC
        </Button>
      ) : null}

      <div className="mx-1 h-6 w-px bg-border" aria-hidden />

      {/* insert menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1 text-xs" disabled={!api.canEdit}>
            Insert <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Insert</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => api.insert("image")}>
            <ImagePlus className="mr-2 h-4 w-4" /> Image…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => api.insert("table")}>
            <Table2 className="mr-2 h-4 w-4" /> Table
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => api.insert("chart")}>
            <BarChart3 className="mr-2 h-4 w-4" /> Chart
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => api.insert("divider")}>
            <SeparatorHorizontal className="mr-2 h-4 w-4" /> Divider line
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => api.insert("toc")}>
            <BookOpenText className="mr-2 h-4 w-4" /> Table of contents
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLinkOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" /> Link…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => api.insert("page-break")}>
            <Scissors className="mr-2 h-4 w-4" /> Page break
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-1">
        {/* page setup */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" disabled={!api.canEdit}>
              <Settings2 className="h-4 w-4" /> <span className="hidden md:inline">Page setup</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Margins</Label>
              <Select value={api.meta.margin} onValueChange={(v) => api.setMeta({ margin: v as DocMeta["margin"] })}>
                <SelectTrigger className="h-8 text-xs" aria-label="Margins">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrow">Narrow</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Text blocks and tables re-flow into the new margins.</p>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Page numbers</Label>
              <Switch checked={api.meta.pageNumbers} onCheckedChange={(v) => api.setMeta({ pageNumbers: v })} aria-label="Toggle page numbers" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="doc-header">
                Header text
              </Label>
              <Input id="doc-header" value={api.meta.header} onChange={(e) => api.setMeta({ header: e.target.value })} placeholder="Shown at the top of every page" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="doc-footer">
                Footer text
              </Label>
              <Input id="doc-footer" value={api.meta.footer} onChange={(e) => api.setMeta({ footer: e.target.value })} placeholder="Shown at the bottom of every page" className="h-8 text-xs" />
            </div>
          </PopoverContent>
        </Popover>

        {/* zoom */}
        <Select value={String(api.zoom)} onValueChange={(v) => api.setZoom(Number(v))}>
          <SelectTrigger className="h-9 w-[76px] text-xs" aria-label="Zoom">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0.5, 0.75, 1, 1.25].map((z) => (
              <SelectItem key={z} value={String(z)}>
                {Math.round(z * 100)}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant={api.preview ? "secondary" : "outline"} size="sm" className="h-9 gap-1.5 text-xs" onClick={api.togglePreview} aria-pressed={api.preview}>
          <Eye className="h-4 w-4" />
          <span className="hidden md:inline">{api.preview ? "Editing" : "Preview"}</span>
        </Button>
      </div>

      {/* link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="link-label">
                Link text
              </Label>
              <Input id="link-label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Read the docs" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="link-url">
                URL
              </Label>
              <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" className="h-9" />
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Links are stored as <code className="rounded bg-muted px-1">[text](url)</code> in the text. They render as clickable links in the HTML / Word exports and appear underlined in preview. PDF export shows the plain text.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!linkLabel.trim() || !linkUrl.trim()}
              onClick={() => {
                api.insertLink(linkLabel.trim(), linkUrl.trim())
                setLinkLabel("")
                setLinkUrl("https://")
                setLinkOpen(false)
              }}
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function styleKindOf(t: TextElement): TextStyleKind {
  if (t.bgColor && t.italic) return "quote"
  if (t.fontSize >= 30) return "h1"
  if (t.fontSize >= 23) return "h2"
  if (t.fontSize >= 18) return "h3"
  return "body"
}
