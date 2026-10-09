"use client"

/**
 * Context menu — right-click (desktop) and long-press (touch) menu with
 * clipboard, z-order, lock and rename actions for the clicked element.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CanvasApi } from "./ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Copy,
  Group,
  Lock,
  LockOpen,
  Pencil,
  Scissors,
  Trash2,
  Ungroup,
  ClipboardPaste,
} from "lucide-react"

interface Position {
  x: number
  y: number
}

export function CanvasContextMenu({
  api,
  menu,
  onClose,
  onRename,
}: {
  api: CanvasApi
  menu: { x: number; y: number; elementId: string | null } | null
  onClose: () => void
  onRename: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Position | null>(null)

  useLayoutEffect(() => {
    if (!menu) {
      const t = setTimeout(() => setPos(null), 0)
      return () => clearTimeout(t)
    }
    const el = ref.current
    const w = el?.offsetWidth ?? 220
    const h = el?.offsetHeight ?? 320
    const r = requestAnimationFrame(() => {
      setPos({
        x: Math.max(8, Math.min(menu.x, window.innerWidth - w - 8)),
        y: Math.max(8, Math.min(menu.y, window.innerHeight - h - 8)),
      })
    })
    return () => cancelAnimationFrame(r)
  }, [menu])

  useEffect(() => {
    if (!menu) return
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("mousedown", onDown)
    window.addEventListener("touchstart", onDown, { passive: true })
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onClose)
    return () => {
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("touchstart", onDown)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onClose)
    }
  }, [menu, onClose])

  if (!menu || !pos) return null
  const hasTarget = !!menu.elementId
  const target = api.page.elements.find((e) => e.id === menu.elementId)
  const isGroup = !!target?.groupId

  type Item = { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; separatorBefore?: boolean }

  const items: Item[] = [
    { label: "Copy", icon: <Copy className="h-3.5 w-3.5" />, onClick: () => api.copySelection(false), disabled: !hasTarget },
    { label: "Cut", icon: <Scissors className="h-3.5 w-3.5" />, onClick: () => api.copySelection(true), disabled: !hasTarget || !api.canEdit },
    { label: "Paste here", icon: <ClipboardPaste className="h-3.5 w-3.5" />, onClick: () => api.pasteClipboard(), disabled: !api.canEdit },
    { label: "Duplicate", icon: <Copy className="h-3.5 w-3.5" />, onClick: () => api.duplicateElements(api.selectedIds), disabled: !hasTarget || !api.canEdit, separatorBefore: true },
    { label: "Rename…", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => menu.elementId && onRename(menu.elementId), disabled: !hasTarget || !api.canEdit },
    { label: target?.locked ? "Unlock" : "Lock", icon: target?.locked ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />, onClick: () => target && api.updateElements([{ id: target.id, patch: { locked: !target.locked } }]), disabled: !hasTarget || !api.canEdit },
    { label: isGroup ? "Ungroup" : "Group", icon: isGroup ? <Ungroup className="h-3.5 w-3.5" /> : <Group className="h-3.5 w-3.5" />, onClick: () => (isGroup ? api.ungroupSelected() : api.groupSelected()), disabled: !hasTarget || !api.canEdit, separatorBefore: true },
    { label: "Bring to front", icon: <ArrowUpToLine className="h-3.5 w-3.5" />, onClick: () => api.reorder(api.selectedIds, "front"), disabled: !hasTarget || !api.canEdit },
    { label: "Bring forward", icon: <ArrowUp className="h-3.5 w-3.5" />, onClick: () => api.reorder(api.selectedIds, "forward"), disabled: !hasTarget || !api.canEdit },
    { label: "Send backward", icon: <ArrowDown className="h-3.5 w-3.5" />, onClick: () => api.reorder(api.selectedIds, "backward"), disabled: !hasTarget || !api.canEdit },
    { label: "Send to back", icon: <ArrowDownToLine className="h-3.5 w-3.5" />, onClick: () => api.reorder(api.selectedIds, "back"), disabled: !hasTarget || !api.canEdit, separatorBefore: false },
    { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => api.deleteElements(api.selectedIds), disabled: !hasTarget || !api.canEdit, danger: true, separatorBefore: true },
  ]

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Canvas context menu"
      className="fixed z-50 min-w-[210px] rounded-xl border bg-popover p-1 shadow-xl"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item, i) => (
        <div key={item.label}>
          {item.separatorBefore && i > 0 ? <div className="my-1 h-px bg-border" role="separator" /> : null}
          <Button
            variant="ghost"
            size="sm"
            role="menuitem"
            disabled={item.disabled}
            className={cn("h-8 w-full justify-start gap-2 px-2 text-xs font-normal", item.danger && "text-destructive hover:bg-destructive/10 hover:text-destructive")}
            onClick={() => {
              item.onClick()
              onClose()
            }}
          >
            {item.icon}
            {item.label}
          </Button>
        </div>
      ))}
      {!hasTarget ? (
        <p className="px-2 pb-1 pt-1.5 text-[10px] text-muted-foreground">Right-click an element for more actions.</p>
      ) : null}
    </div>
  )
}
