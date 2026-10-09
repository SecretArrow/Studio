"use client"

/**
 * Brand Kits dashboard view — full CRUD over brand kits with a style-guide
 * preview per kit, WCAG contrast checking, and "apply to design".
 */

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { SWATCH_PALETTES } from "@/lib/design/presets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Check, Loader2, MoreVertical, Palette, Pencil, PencilLine, Plus, SwatchBook, Trash2, Type,
} from "lucide-react"
import {
  contrastRatio, parseColors, parseFonts, parseLogos, swatchTextColor, wcagGrade, type BrandKitRow, type KitColor,
} from "./brand/kit-types"
import { KitEditorDialog } from "./brand/kit-editor"
import { ApplyKitDialog } from "./brand/apply-dialog"

/* ---- kept for backward compatibility with earlier imports ---- */
export { contrastRatio } from "./brand/kit-types"

export function ContrastBadge({ a, b }: { a: string; b: string }) {
  const ratio = contrastRatio(a, b)
  const grade = wcagGrade(ratio)
  const pass = grade === "AA" || grade === "AAA"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
        pass
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
      )}
    >
      <Check className="h-3 w-3" /> {ratio.toFixed(1)}:1 {grade !== "FAIL" ? grade : ""}
    </span>
  )
}

export function BrandSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin text-primary" />
}

function ColorsStrip({ colors }: { colors: KitColor[] }) {
  if (colors.length === 0) {
    return <div className="flex h-10 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">No colors yet</div>
  }
  return (
    <div className="flex h-10 overflow-hidden rounded-lg">
      {colors.map((c, i) => (
        <div key={`${c.hex}-${i}`} className="flex flex-1 items-end justify-center pb-1" style={{ background: c.hex }} title={c.name ? `${c.name} ${c.hex}` : c.hex}>
          <span className="text-[9px] font-medium" style={{ color: swatchTextColor(c.hex) }}>{c.name || c.hex}</span>
        </div>
      ))}
    </div>
  )
}

export function BrandView() {
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const qc = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [starter, setStarter] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editing, setEditing] = useState<BrandKitRow | null>(null)
  const [applying, setApplying] = useState<BrandKitRow | null>(null)
  const [renaming, setRenaming] = useState<BrandKitRow | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleting, setDeleting] = useState<BrandKitRow | null>(null)

  const query = useQuery({
    queryKey: ["brandkits"],
    enabled: !!user,
    queryFn: () => api.get<{ kits: BrandKitRow[] }>("/api/brandkits"),
  })

  async function createKit() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const palette = SWATCH_PALETTES.find((p) => p.name === starter)
      await api.post("/api/brandkits", {
        name: newName.trim(),
        colorsJson: JSON.stringify(palette ? palette.colors.map((hex) => ({ name: "", hex })) : []),
        fontsJson: JSON.stringify([]),
        logosJson: JSON.stringify([]),
      })
      setNewName("")
      setStarter(null)
      setCreateOpen(false)
      await qc.invalidateQueries({ queryKey: ["brandkits"] })
      toast({ title: "Brand kit created" })
    } catch (err) {
      toast({ title: "Could not create kit", description: err instanceof Error ? err.message : "Sign in to save brand kits", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  async function renameKit() {
    if (!renaming || !renameValue.trim()) return
    try {
      await api.patch(`/api/brandkits/${renaming.id}`, { name: renameValue.trim() })
      await qc.invalidateQueries({ queryKey: ["brandkits"] })
      toast({ title: "Kit renamed" })
    } catch (err) {
      toast({ title: "Could not rename kit", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setRenaming(null)
    }
  }

  async function deleteKit() {
    if (!deleting) return
    try {
      await api.delete(`/api/brandkits/${deleting.id}`)
      await qc.invalidateQueries({ queryKey: ["brandkits"] })
      toast({ title: "Kit deleted", description: `"${deleting.name}" was removed.` })
    } catch (err) {
      toast({ title: "Could not delete kit", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-bold">Brand Kits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Brand kits keep your logos, colors and fonts in one place, check contrast for accessibility, and apply them to
          any design in one click. Sign in to create your first kit — or start from a palette below.
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
        <div className="mt-6">
          <Button onClick={() => useAppStore.getState().navigate({ name: "auth" })}>Sign in to create brand kits</Button>
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
          <Plus /> New kit
        </Button>
      </div>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <SwatchBook className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No brand kits yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Create a kit with your colors, fonts and logos — then apply it to any design or check text contrast for
            accessibility.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus /> Create your first kit
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {kits.map((kit) => {
            const colors = parseColors(kit.colorsJson)
            const fonts = parseFonts(kit.fontsJson)
            const logos = parseLogos(kit.logosJson)
            const primary = colors[0]
            return (
              <Card key={kit.id} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                  <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                    {logos[0] ? (
                      <img src={logos[0].url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />
                    ) : (
                      <Palette className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="truncate">{kit.name}</span>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Actions for ${kit.name}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{kit.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setEditing(kit) }}>
                        <Pencil className="h-4 w-4" /> Edit kit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setRenaming(kit); setRenameValue(kit.name) }}>
                        <PencilLine className="h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(kit)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <ColorsStrip colors={colors} />
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Type className="h-3 w-3" />
                    {fonts.length === 0 ? (
                      <span>No fonts selected</span>
                    ) : (
                      fonts.map((f, i) => (
                        <span key={f} className="rounded bg-muted px-1.5 py-0.5" style={{ fontFamily: f }}>
                          {f}{i === 0 ? " ★" : ""}
                        </span>
                      ))
                    )}
                  </div>
                  {kit.guidelines && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{kit.guidelines}</p>
                  )}
                  {primary && (
                    <p className="text-xs text-muted-foreground">
                      Primary contrast — white {contrastRatio(primary.hex, "#ffffff").toFixed(1)}:1
                      {wcagGrade(contrastRatio(primary.hex, "#ffffff")) === "AA" || wcagGrade(contrastRatio(primary.hex, "#ffffff")) === "AAA" ? " (AA ✓)" : ""} ·
                      black {contrastRatio(primary.hex, "#111827").toFixed(1)}:1
                      {wcagGrade(contrastRatio(primary.hex, "#111827")) === "AA" || wcagGrade(contrastRatio(primary.hex, "#111827")) === "AAA" ? " (AA ✓)" : ""}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(kit)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" onClick={() => setApplying(kit)}>
                    <SwatchBook className="h-3.5 w-3.5" /> Apply to design
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New brand kit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Personal Brand" maxLength={80} aria-label="Kit name" />
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Start from a palette (optional)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SWATCH_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setStarter((prev) => (prev === p.name ? null : p.name))}
                    className={cn(
                      "rounded-lg border p-2 text-left transition",
                      starter === p.name ? "border-primary ring-2 ring-primary/30" : "hover:border-muted-foreground/40",
                    )}
                    aria-pressed={starter === p.name}
                  >
                    <span className="mb-1 block truncate text-[10px] font-medium">{p.name}</span>
                    <span className="flex h-5 overflow-hidden rounded">
                      {p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void createKit()} disabled={creating || !newName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename kit</DialogTitle></DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={80}
            aria-label="New kit name"
            onKeyDown={(e) => { if (e.key === "Enter") void renameKit() }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={() => void renameKit()} disabled={!renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the kit. Designs it was applied to keep their current colors and fonts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void deleteKit()}>
              Delete kit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editing && <KitEditorDialog key={editing.id} kit={editing} open onOpenChange={(open) => !open && setEditing(null)} />}
      {applying && <ApplyKitDialog key={`apply-${applying.id}`} kit={applying} open onOpenChange={(open) => !open && setApplying(null)} />}
    </div>
  )
}
