"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { SWATCH_PALETTES } from "@/lib/design/presets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Palette, Check, Loader2 } from "lucide-react"

interface BrandKitRow {
  id: string
  name: string
  colorsJson: string
  fontsJson: string
  logosJson: string
  guidelines: string | null
}

/** Contrast ratio helpers (WCAG) */
function luminance(hex: string): number {
  const m = hex.replace("#", "")
  const rgb = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

export function BrandView() {
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")

  const query = useQuery({
    queryKey: ["brandkits"],
    enabled: !!user,
    queryFn: () => api.get<{ kits: BrandKitRow[] }>("/api/brandkits"),
  })

  async function createKit() {
    if (!name.trim()) return
    try {
      await api.post("/api/brandkits", { name: name.trim(), colorsJson: JSON.stringify(["#8b5cf6", "#111827", "#f9fafb"]) })
      setName("")
      setCreateOpen(false)
      await qc.invalidateQueries({ queryKey: ["brandkits"] })
    } catch (err) {
      toast({ title: "Sign in to save brand kits", variant: "destructive" })
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-bold">Brand Kits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Brand kits keep your logos, colors and fonts in one place and apply them to any design. Sign in to create your first kit — you can also start with a palette below.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SWATCH_PALETTES.map((p) => (
            <div key={p.name} className="rounded-xl border p-3">
              <p className="mb-2 text-xs font-medium">{p.name}</p>
              <div className="flex h-8 overflow-hidden rounded-md">
                {p.colors.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const kits = query.data?.kits ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-bold">Brand Kits</h1>
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No brand kits yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {kits.map((kit) => {
            const colors = (() => { try { return JSON.parse(kit.colorsJson) as string[] } catch { return [] } })()
            return (
              <Card key={kit.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-primary" /> {kit.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-10 overflow-hidden rounded-lg">
                    {colors.map((c) => (
                      <div key={c} className="flex flex-1 items-end justify-center pb-1" style={{ background: c }}>
                        <span className="text-[10px]" style={{ color: contrastRatio(c, "#ffffff") > 3 ? "#fff" : "#111" }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Contrast vs white: {colors[0] ? contrastRatio(colors[0], "#ffffff").toFixed(1) : "—"}:1
                    {colors[0] && contrastRatio(colors[0], "#ffffff") >= 4.5 ? " (AA ✓)" : ""}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New brand kit</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Personal Brand" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createKit} disabled={!name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ContrastBadge({ a, b }: { a: string; b: string }) {
  const ratio = contrastRatio(a, b)
  const pass = ratio >= 4.5
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${pass ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"}`}>
      <Check className="h-3 w-3" /> {ratio.toFixed(1)}:1
    </span>
  )
}

export function BrandSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin text-primary" />
}
