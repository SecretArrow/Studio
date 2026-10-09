"use client"

/**
 * Board chrome: top toolbar (tools + contextual options), templates dialog,
 * floating selection action bar and the zoom cluster.
 */

import { useRef } from "react"
import type { ShapeVariant } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  BringToFront,
  Circle,
  Copy,
  Diamond,
  Download,
  Eraser,
  FileJson,
  Frame,
  Image as ImageIcon,
  ImagePlus,
  LayoutTemplate,
  Maximize,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Redo2,
  SendToBack,
  Spline,
  Square,
  StickyNote,
  ThumbsUp,
  Trash2,
  Type,
  Undo2,
} from "lucide-react"
import { BOARD_TEMPLATES, type BoardTemplate } from "./templates"
import { PEN_COLORS, PEN_WIDTHS, STICKY_COLORS, type BoardTool } from "./board-render"

/* ------------------------------ toolbar ------------------------------ */

export interface BoardToolbarProps {
  canEdit: boolean
  tool: BoardTool
  setTool: (t: BoardTool) => void
  penColor: string
  setPenColor: (c: string) => void
  penWidth: number
  setPenWidth: (w: number) => void
  stickyColor: string
  setStickyColor: (c: string) => void
  shapeVariant: ShapeVariant
  setShapeVariant: (v: ShapeVariant) => void
  snapToGrid: boolean
  setSnapToGrid: (v: boolean) => void
  voteMode: boolean
  setVoteMode: (v: boolean) => void
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  onTemplates: () => void
  onExport: (kind: "png-content" | "png-full" | "pdf" | "json") => void
  onImageUpload: (file: File) => void
}

export function BoardToolbar(props: BoardToolbarProps) {
  const { canEdit, tool, setTool } = props
  const fileRef = useRef<HTMLInputElement>(null)

  const tools: { id: BoardTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "select", label: "Select", icon: <MousePointer2 className="h-4.5 w-4.5" />, shortcut: "V" },
    { id: "pen", label: "Pen", icon: <Pencil className="h-4.5 w-4.5" />, shortcut: "P" },
    { id: "eraser", label: "Eraser", icon: <Eraser className="h-4.5 w-4.5" />, shortcut: "E" },
    { id: "sticky", label: "Sticky note", icon: <StickyNote className="h-4.5 w-4.5" />, shortcut: "S" },
    { id: "shape", label: "Shape", icon: <Square className="h-4.5 w-4.5" />, shortcut: "R" },
    { id: "line", label: "Line", icon: <Minus className="h-4.5 w-4.5" />, shortcut: "L" },
    { id: "arrow", label: "Arrow", icon: <ArrowUp className="h-4.5 w-4.5" />, shortcut: "A" },
    { id: "text", label: "Text", icon: <Type className="h-4.5 w-4.5" />, shortcut: "T" },
    { id: "connector", label: "Connect two elements", icon: <Spline className="h-4.5 w-4.5" />, shortcut: "C" },
    { id: "frame", label: "Frame / section", icon: <Frame className="h-4.5 w-4.5" />, shortcut: "F" },
  ]

  return (
    <div className="z-30 flex shrink-0 items-center gap-0.5 overflow-x-auto border-b bg-card px-2 py-1.5" role="toolbar" aria-label="Whiteboard tools">
      {tools.map((t) => (
        <Button
          key={t.id}
          variant={tool === t.id ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!canEdit}
          onClick={() => setTool(t.id)}
          aria-pressed={tool === t.id}
          aria-label={`${t.label} (${t.shortcut})`}
          title={`${t.label} (${t.shortcut})`}
        >
          {t.icon}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={!canEdit} aria-label="Insert image" title="Insert image">
            <ImagePlus className="h-4.5 w-4.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="bottom" align="start">
          <p className="mb-2 text-xs text-muted-foreground">Add an image from your device. It becomes a movable board element.</p>
          <Button className="w-full gap-2" onClick={() => fileRef.current?.click()}>
            <ImageIcon className="h-4 w-4" /> Choose file…
          </Button>
        </PopoverContent>
      </Popover>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) props.onImageUpload(f)
          e.target.value = ""
        }}
      />

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

      {/* contextual: pen options */}
      {tool === "pen" ? (
        <div className="flex shrink-0 items-center gap-1" aria-label="Pen options">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Pen color ${c}`}
              aria-pressed={props.penColor === c}
              className={cn("h-6 w-6 shrink-0 rounded-full border shadow-sm transition", props.penColor === c ? "ring-2 ring-primary ring-offset-1" : "hover:scale-110")}
              style={{ background: c }}
              onClick={() => props.setPenColor(c)}
            />
          ))}
          <div className="ml-1 flex shrink-0 items-center gap-0.5">
            {PEN_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                aria-label={`Pen width ${w}`}
                aria-pressed={props.penWidth === w}
                className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md border", props.penWidth === w ? "border-primary bg-secondary" : "border-transparent hover:bg-accent")}
                onClick={() => props.setPenWidth(w)}
              >
                <span className="rounded-full bg-foreground" style={{ width: Math.min(12, w), height: Math.min(12, w) }} />
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />
        </div>
      ) : null}

      {/* contextual: sticky colors */}
      {tool === "sticky" ? (
        <div className="flex shrink-0 items-center gap-1" aria-label="Sticky colors">
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Sticky color ${c}`}
              aria-pressed={props.stickyColor === c}
              className={cn("h-6 w-6 shrink-0 rounded border border-black/10 shadow-sm transition", props.stickyColor === c ? "ring-2 ring-primary ring-offset-1" : "hover:scale-110")}
              style={{ background: c }}
              onClick={() => props.setStickyColor(c)}
            />
          ))}
          <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />
        </div>
      ) : null}

      {/* contextual: shape variants */}
      {tool === "shape" ? (
        <div className="flex shrink-0 items-center gap-0.5" aria-label="Shape variants">
          {(
            [
              { v: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
              { v: "ellipse", icon: <Circle className="h-4 w-4" />, label: "Ellipse" },
              { v: "diamond", icon: <Diamond className="h-4 w-4" />, label: "Diamond" },
            ] as { v: ShapeVariant; icon: React.ReactNode; label: string }[]
          ).map((s) => (
            <Button
              key={s.v}
              variant={props.shapeVariant === s.v ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => props.setShapeVariant(s.v)}
              aria-label={s.label}
              aria-pressed={props.shapeVariant === s.v}
              title={s.label}
            >
              {s.icon}
            </Button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />
        </div>
      ) : null}

      <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 px-2.5 text-xs" onClick={props.onTemplates} aria-label="Insert a board template">
        <LayoutTemplate className="h-4 w-4" /> <span className="hidden sm:inline">Templates</span>
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={!props.canUndo} onClick={props.undo} aria-label="Undo" title="Undo (Ctrl+Z)">
        <Undo2 className="h-4.5 w-4.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={!props.canRedo} onClick={props.redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
        <Redo2 className="h-4.5 w-4.5" />
      </Button>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
        <Button
          variant={props.snapToGrid ? "secondary" : "ghost"}
          size="sm"
          className="h-9 shrink-0 gap-1.5 px-2.5 text-xs"
          onClick={() => props.setSnapToGrid(!props.snapToGrid)}
          aria-pressed={props.snapToGrid}
          aria-label="Snap to grid"
          title="Snap to grid (24px)"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 3h18v18H3z" opacity="0" />
            <circle cx="5" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="19" cy="5" r="1" fill="currentColor" />
            <circle cx="5" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="19" cy="12" r="1" fill="currentColor" />
            <circle cx="5" cy="19" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
            <circle cx="19" cy="19" r="1" fill="currentColor" />
          </svg>
          <span className="hidden md:inline">Snap</span>
        </Button>
        <Button
          variant={props.voteMode ? "secondary" : "ghost"}
          size="sm"
          className="h-9 shrink-0 gap-1.5 px-2.5 text-xs"
          disabled={!canEdit}
          onClick={() => props.setVoteMode(!props.voteMode)}
          aria-pressed={props.voteMode}
          aria-label="Vote mode"
          title="Vote mode — click sticky notes to add a vote"
        >
          <ThumbsUp className="h-4 w-4" /> <span className="hidden md:inline">Vote</span>
        </Button>
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 px-2.5 text-xs" aria-label="Export board">
                <Download className="h-4 w-4" /> <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Download board</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => props.onExport("png-content")}>PNG (fit content)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onExport("png-full")}>PNG (full board size)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onExport("pdf")}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => props.onExport("json")}>
                <FileJson className="h-4 w-4" /> Project file (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------ templates dialog ------------------------------ */

function TemplatePreview({ template }: { template: BoardTemplate }) {
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-md border bg-[#f8f7f4]" aria-hidden="true">
      {template.id === "brainstorm" ? (
        <div className="grid h-full w-full grid-cols-3 gap-1 p-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={cn("rounded-[2px]", ["bg-amber-200", "bg-green-200", "bg-pink-200"][i % 3])} />
          ))}
        </div>
      ) : template.id === "flowchart" ? (
        <div className="flex h-full w-full flex-col items-center justify-between p-2">
          <div className="h-2.5 w-10 rounded-full bg-lime-300" />
          <div className="h-2.5 w-14 rounded-sm border border-zinc-400 bg-white" />
          <div className="h-3.5 w-3.5 rotate-45 bg-amber-200" />
          <div className="h-2.5 w-10 rounded-full bg-pink-300" />
        </div>
      ) : template.id === "mindmap" ? (
        <div className="relative h-full w-full">
          <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-md bg-primary" />
          {[["8%", "12%"], ["68%", "12%"], ["8%", "68%"], ["68%", "68%"]].map(([l, t], i) => (
            <div key={i} className="absolute h-4 w-8 rounded-[2px] bg-green-200" style={{ left: l, top: t }} />
          ))}
        </div>
      ) : (
        <div className="flex h-full w-full gap-1.5 p-2">
          {["bg-green-200", "bg-amber-200", "bg-pink-200"].map((c, i) => (
            <div key={i} className="flex h-full flex-1 flex-col gap-1 rounded-sm border border-dashed border-primary/50 p-1">
              <div className={cn("h-1.5 w-8 rounded-full", c)} />
              <div className={cn("h-4 rounded-[2px]", c)} />
              <div className={cn("h-4 rounded-[2px]", c)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TemplatesDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (t: BoardTemplate) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Board templates</DialogTitle>
          <DialogDescription>Templates insert real, fully editable elements at the center of your view.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BOARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="group rounded-lg border p-3 text-left transition hover:border-primary hover:bg-accent"
              onClick={() => {
                onPick(t)
                onOpenChange(false)
              }}
            >
              <TemplatePreview template={t} />
              <p className="mt-2 text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ selection action bar ------------------------------ */

export type AlignDir = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom"
export type OrderDir = "front" | "forward" | "backward" | "back"

export function SelectionBar({
  count,
  onDuplicate,
  onDelete,
  onAlign,
  onOrder,
}: {
  count: number
  onDuplicate: () => void
  onDelete: () => void
  onAlign: (d: AlignDir) => void
  onOrder: (d: OrderDir) => void
}) {
  if (count === 0) return null
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-card/95 p-1 shadow-md backdrop-blur" role="toolbar" aria-label="Selection actions">
      <span className="px-1.5 text-[11px] font-medium text-muted-foreground">{count} selected</span>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} aria-label="Duplicate" title="Duplicate (Ctrl+D)">
        <Copy className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Align" title="Align">
            <AlignIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" side="top" align="center">
          <div className="grid grid-cols-3 gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("left")} aria-label="Align left" title="Align left"><AlignLeftIcon /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("hcenter")} aria-label="Align horizontal centers" title="Horizontal centers"><AlignCenterHIcon /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("right")} aria-label="Align right" title="Align right"><AlignRightIcon /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("top")} aria-label="Align top" title="Align top"><ArrowUpToLine className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("vcenter")} aria-label="Align vertical centers" title="Vertical centers"><AlignCenterVIcon /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign("bottom")} aria-label="Align bottom" title="Align bottom"><ArrowDownToLine className="h-4 w-4" /></Button>
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Layer order" title="Layer order">
            <LayersIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5" side="top" align="center">
          <div className="grid grid-cols-2 gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOrder("front")} aria-label="Bring to front" title="Bring to front"><BringToFront className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOrder("back")} aria-label="Send to back" title="Send to back"><SendToBack className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOrder("forward")} aria-label="Move forward" title="Move forward"><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOrder("backward")} aria-label="Move backward" title="Move backward"><ArrowDown className="h-4 w-4" /></Button>
          </div>
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Delete" title="Delete (Del)">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

/* tiny inline alignment/order glyphs (avoid icon-name drift) */
function AlignIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 5v14" />
      <rect x="8" y="7" width="12" height="4" rx="1" />
      <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
  )
}
function AlignLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4v16" />
      <rect x="7" y="7" width="13" height="4" rx="1" />
      <rect x="7" y="14" width="8" height="4" rx="1" />
    </svg>
  )
}
function AlignRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M20 4v16" />
      <rect x="4" y="7" width="13" height="4" rx="1" />
      <rect x="9" y="14" width="8" height="4" rx="1" />
    </svg>
  )
}
function AlignCenterHIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v18" />
      <rect x="4" y="7" width="16" height="4" rx="1" />
      <rect x="7" y="14" width="10" height="4" rx="1" />
    </svg>
  )
}
function AlignCenterVIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M3 12h18" />
      <rect x="7" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="7" width="4" height="10" rx="1" />
    </svg>
  )
}
function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  )
}

/* ------------------------------ zoom cluster ------------------------------ */

export function ZoomCluster({ zoom, onZoomIn, onZoomOut, onFit, onReset }: { zoom: number; onZoomIn: () => void; onZoomOut: () => void; onFit: () => void; onReset: () => void }) {
  return (
    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-0.5 rounded-lg border bg-card/95 p-1 shadow-md backdrop-blur" role="group" aria-label="Zoom controls">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} aria-label="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <button type="button" className="w-12 text-center text-xs tabular-nums hover:underline" onClick={onReset} aria-label="Reset zoom to 100%" title="Reset to 100%">
        {Math.round(zoom * 100)}%
      </button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} aria-label="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onFit} aria-label="Fit content" title="Fit content">
        <Maximize className="h-3.5 w-3.5" /> Fit
      </Button>
    </div>
  )
}
