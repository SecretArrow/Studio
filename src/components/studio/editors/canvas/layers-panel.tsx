"use client"

/**
 * Layers panel — reverse z-order list of the current page's elements.
 * Click to select (group-aware), double-click name to rename, visibility +
 * lock toggles, reorder up/down + HTML5 drag, delete, group/ungroup.
 */

import { useState } from "react"
import type { CanvasApi } from "./ui"
import { IconBtn } from "./ui"
import type { DesignElement } from "@/lib/design/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Eye,
  EyeOff,
  Group,
  Lock,
  LockOpen,
  Trash2,
  Ungroup,
} from "lucide-react"

const TYPE_ICON: Record<string, string> = {
  text: "T",
  shape: "◆",
  image: "🖼",
  icon: "✦",
  chart: "📊",
  table: "▦",
  qr: "▩",
  frame: "▭",
  sticky: "🗒",
  freehand: "✎",
  connector: "⤳",
  media: "▶",
}

function elementLabel(el: DesignElement, index: number): string {
  if (el.name) return el.name
  switch (el.type) {
    case "text":
      return (el as { text?: string }).text?.slice(0, 22) || `Text ${index}`
    case "sticky":
      return (el as { text?: string }).text?.slice(0, 22) || "Sticky"
    case "shape":
      return `Shape (${(el as { variant?: string }).variant ?? "rect"})`
    case "chart":
      return `Chart (${(el as { chartType?: string }).chartType ?? "column"})`
    case "icon":
      return `Icon ${(el as { icon?: string }).icon ?? ""}`
    case "qr":
      return "QR code"
    default:
      return `${el.type[0].toUpperCase()}${el.type.slice(1)} ${index}`
  }
}

export function LayersPanel({ api }: { api: CanvasApi }) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const elements = api.page.elements
  const reversed = [...elements].map((el, i) => ({ el, index: i })).reverse()
  const hasSelection = api.selection.length > 0
  const singleSelectedGroup = api.selection.length > 0 && api.selection.every((e) => e.groupId && e.groupId === api.selection[0].groupId)

  function select(el: DesignElement, shift: boolean) {
    if (el.groupId) {
      const members = elements.filter((e) => e.groupId === el.groupId).map((e) => e.id)
      api.selectIds(members, shift)
      return
    }
    api.selectIds([el.id], shift)
  }

  function move(index: number, dir: -1 | 1) {
    const el = reversed[index]?.el
    if (!el) return
    api.reorder([el.id], dir === -1 ? "forward" : "backward")
  }

  function onDrop(targetIndex: number) {
    if (!dragId) return
    // reversed index → actual z position
    const targetEl = reversed[targetIndex]?.el
    setDragId(null)
    if (!targetEl || targetEl.id === dragId) return
    const dragIdx = elements.findIndex((e) => e.id === dragId)
    const targetIdx = elements.findIndex((e) => e.id === targetEl.id)
    if (dragIdx === -1 || targetIdx === -1) return
    api.reorder([dragId], targetIdx > dragIdx ? "backward" : "forward")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <IconBtn label="Bring forward" disabled={!hasSelection || !api.canEdit} onClick={() => api.reorder(api.selectedIds, "forward")}>
          <ArrowUp className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Send backward" disabled={!hasSelection || !api.canEdit} onClick={() => api.reorder(api.selectedIds, "backward")}>
          <ArrowDown className="h-4 w-4" />
        </IconBtn>
        <div className="mx-0.5 h-5 w-px bg-border" />
        <IconBtn label="Group selection" disabled={!hasSelection || api.selection.length < 2 || !api.canEdit} onClick={api.groupSelected}>
          <Group className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Ungroup" disabled={!singleSelectedGroup || !api.canEdit} onClick={api.ungroupSelected}>
          <Ungroup className="h-4 w-4" />
        </IconBtn>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive" disabled={!hasSelection || !api.canEdit} onClick={() => api.deleteElements(api.selectedIds)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-1.5" aria-label="Layers">
        {reversed.map(({ el, index }, viewIndex) => {
          const selected = api.selectedIds.includes(el.id)
          const groupMembers = el.groupId ? elements.filter((e) => e.groupId === el.groupId).length : 0
          return (
            <li
              key={el.id}
              draggable={api.canEdit && renamingId !== el.id}
              onDragStart={() => setDragId(el.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(viewIndex)}
              className={cn(
                "group flex min-h-[44px] items-center gap-1 rounded-lg border px-1.5 py-1 transition",
                selected ? "border-primary bg-accent" : "border-transparent hover:bg-accent/60",
                el.hidden && "opacity-50",
              )}
            >
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                {el.groupId ? <Boxes className="h-3.5 w-3.5 text-primary" /> : <span>{TYPE_ICON[el.type] ?? "?"}</span>}
              </span>
              {renamingId === el.id ? (
                <Input
                  autoFocus
                  defaultValue={el.name ?? elementLabel(el, index + 1)}
                  className="h-7 text-xs"
                  aria-label="Layer name"
                  onBlur={(e) => {
                    api.renameElement(el.id, e.target.value)
                    setRenamingId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                    if (e.key === "Escape") setRenamingId(null)
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={cn("min-w-0 flex-1 truncate rounded px-1 text-left text-xs", groupMembers > 1 && "font-medium")}
                  onClick={(e) => select(el, e.shiftKey)}
                  onDoubleClick={() => api.canEdit && setRenamingId(el.id)}
                  title={`${elementLabel(el, index + 1)}${groupMembers > 1 ? ` (group of ${groupMembers})` : ""}`}
                >
                  {elementLabel(el, index + 1)}
                </button>
              )}
              <IconBtn
                label={el.hidden ? "Show layer" : "Hide layer"}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 max-md:opacity-100"
                disabled={!api.canEdit}
                onClick={() => api.updateElements([{ id: el.id, patch: { hidden: !el.hidden } }])}
              >
                {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </IconBtn>
              <IconBtn
                label={el.locked ? "Unlock layer" : "Lock layer"}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 max-md:opacity-100"
                disabled={!api.canEdit}
                onClick={() => api.updateElements([{ id: el.id, patch: { locked: !el.locked } }])}
              >
                {el.locked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
              </IconBtn>
            </li>
          )
        })}
        {elements.length === 0 && (
          <li className="px-3 py-8 text-center text-xs text-muted-foreground">
            This page is empty.
            <br />
            Add elements from the left panel.
          </li>
        )}
      </ul>
      <p className="border-t px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
        Tip: double-click a layer to rename it. Drag layers to reorder. Grouped layers move together.
      </p>
    </div>
  )
}
