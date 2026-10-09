"use client"

/**
 * Full brand kit editor dialog: colors (add/remove/reorder/name + WCAG contrast),
 * fonts (from FONT_LIBRARY), logo uploads, guidelines, and a live mini style-guide.
 */

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { FONT_LIBRARY, SWATCH_PALETTES } from "@/lib/design/presets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  ArrowDown, ArrowUp, Check, ImagePlus, Loader2, Plus, Trash2, Type, X,
} from "lucide-react"
import {
  contrastRatio, normalizeHex, parseColors, parseFonts, parseLogos, swatchTextColor, wcagGrade,
  type BrandKitRow, type KitColor, type KitLogo,
} from "./kit-types"

const MAX_COLORS = 12
const MAX_FONTS = 4

function GradeBadge({ ratio, against }: { ratio: number; against: string }) {
  const grade = wcagGrade(ratio)
  const ok = grade === "AA" || grade === "AAA"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1 py-px text-[10px] font-medium tabular-nums",
        grade === "AAA" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
        grade === "AA" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
        grade === "AA-L" && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        grade === "FAIL" && "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200",
      )}
      title={`Contrast vs ${against === "#ffffff" ? "white" : "black"}: ${ratio.toFixed(2)}:1 — WCAG ${grade === "FAIL" ? "fail" : grade}${grade === "AA-L" ? " (large text only)" : ""}`}
    >
      {against === "#ffffff" ? "W" : "B"} {ratio.toFixed(1)} {ok ? "✓" : grade === "AA-L" ? "~" : "✗"}
    </span>
  )
}

interface Props {
  kit: BrandKitRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KitEditorDialog({ kit, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState(kit.name)
  const [colors, setColors] = useState<KitColor[]>(() => parseColors(kit.colorsJson))
  const [fonts, setFonts] = useState<string[]>(() => parseFonts(kit.fontsJson))
  const [logos, setLogos] = useState<KitLogo[]>(() => parseLogos(kit.logosJson))
  const [guidelines, setGuidelines] = useState(kit.guidelines ?? "")
  const [hexDraft, setHexDraft] = useState<{ index: number; value: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  function updateColor(index: number, patch: Partial<KitColor>) {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function moveColor(index: number, dir: -1 | 1) {
    setColors((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      const tmp = next[index]
      next[index] = next[j]
      next[j] = tmp
      return next
    })
  }

  function addColor(hex: string) {
    setColors((prev) => (prev.length >= MAX_COLORS || prev.some((c) => c.hex === hex) ? prev : [...prev, { name: "", hex }]))
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await api.upload<{ asset: { url: string; filename: string } }>("/api/assets", form)
      setLogos((prev) => [...prev, { url: res.asset.url, name: res.asset.filename }])
    } catch (err) {
      toast({ title: "Logo upload failed", description: err instanceof Error ? err.message : "Try a PNG, JPG, SVG or WebP under 30MB", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await api.patch(`/api/brandkits/${kit.id}`, {
        name: name.trim(),
        colorsJson: JSON.stringify(colors),
        fontsJson: JSON.stringify(fonts),
        logosJson: JSON.stringify(logos),
        guidelines,
      })
      await qc.invalidateQueries({ queryKey: ["brandkits"] })
      toast({ title: "Brand kit saved" })
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Could not save kit", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit brand kit</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* live mini style-guide */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              {logos[0] ? (
                <img src={logos[0].url} alt={`${name} logo`} className="h-10 w-10 rounded-lg border object-contain p-1" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">—</div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name || "Untitled kit"}</p>
                <p className="truncate text-xs text-muted-foreground">{fonts[0] ?? "No font selected"}{fonts[1] ? ` · ${fonts[1]}` : ""}</p>
              </div>
            </div>
            <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
              {colors.length === 0 ? (
                <div className="flex flex-1 items-center justify-center bg-muted text-[11px] text-muted-foreground">No colors yet</div>
              ) : (
                colors.map((c, i) => (
                  <div key={`${c.hex}-${i}`} className="flex flex-1 items-end justify-center pb-0.5" style={{ background: c.hex }}>
                    <span className="text-[9px] font-medium" style={{ color: swatchTextColor(c.hex) }}>{c.name || c.hex}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* kit name */}
          <div className="space-y-1.5">
            <Label htmlFor="kit-name">Kit name</Label>
            <Input id="kit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>

          {/* colors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Colors ({colors.length}/{MAX_COLORS})</Label>
              <div className="flex items-center gap-1">
                {SWATCH_PALETTES.slice(0, 4).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => p.colors.forEach((h) => addColor(h))}
                    title={`Add "${p.name}" palette`}
                    className="flex h-6 w-10 overflow-hidden rounded border"
                    aria-label={`Add ${p.name} palette`}
                  >
                    {p.colors.slice(0, 5).map((h) => (
                      <span key={h} className="flex-1" style={{ background: h }} />
                    ))}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {colors.map((c, i) => (
                <div key={`${i}-${c.hex}`} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"}
                    onChange={(e) => updateColor(i, { hex: e.target.value })}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border bg-transparent p-0"
                    aria-label={`Color picker for ${c.name || c.hex}`}
                  />
                  <Input
                    className="w-24 font-mono text-xs"
                    value={hexDraft?.index === i ? hexDraft.value : c.hex}
                    onChange={(e) => {
                      setHexDraft({ index: i, value: e.target.value })
                      const norm = normalizeHex(e.target.value)
                      if (norm) updateColor(i, { hex: norm })
                    }}
                    onBlur={() => setHexDraft(null)}
                    aria-label={`Hex value for ${c.name || c.hex}`}
                  />
                  <Input
                    className="min-w-0 flex-1 text-sm"
                    placeholder="Color name (e.g. Brand violet)"
                    value={c.name}
                    onChange={(e) => updateColor(i, { name: e.target.value.slice(0, 40) })}
                    aria-label={`Name for color ${c.hex}`}
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <GradeBadge ratio={contrastRatio(c.hex, "#ffffff")} against="#ffffff" />
                    <GradeBadge ratio={contrastRatio(c.hex, "#111827")} against="#111827" />
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveColor(i, -1)} disabled={i === 0} aria-label="Move color up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveColor(i, 1)} disabled={i === colors.length - 1} aria-label="Move color down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setColors((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove color">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => addColor("#8b5cf6")} disabled={colors.length >= MAX_COLORS}>
              <Plus className="h-3.5 w-3.5" /> Add color
            </Button>
            <p className="text-xs text-muted-foreground">
              W = contrast vs white, B = vs black. ✓ AA ≥ 4.5:1, ✓ AAA ≥ 7:1, ~ large text only (≥ 3:1).
            </p>
          </div>

          {/* fonts */}
          <div className="space-y-2">
            <Label>Fonts (first is primary)</Label>
            <Select
              value=""
              onValueChange={(family) => setFonts((prev) => (prev.includes(family) || prev.length >= MAX_FONTS ? prev : [...prev, family]))}
            >
              <SelectTrigger className="w-full sm:w-72" aria-label="Add a font to the kit">
                <SelectValue placeholder={`Add a font (${fonts.length}/${MAX_FONTS})`} />
              </SelectTrigger>
              <SelectContent>
                {FONT_LIBRARY.map((f) => (
                  <SelectItem key={f.family} value={f.family} disabled={fonts.includes(f.family)}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {fonts.length === 0 && <p className="text-xs text-muted-foreground">No fonts selected yet.</p>}
              {fonts.map((f, i) => (
                <span key={f} className="inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-1.5 text-xs">
                  <Type className="h-3 w-3 text-primary" />
                  <span style={{ fontFamily: f }}>{f}</span>
                  {i === 0 && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">primary</span>}
                  <button
                    type="button"
                    onClick={() => setFonts((prev) => prev.filter((x) => x !== f))}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                    aria-label={`Remove font ${f}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* logos */}
          <div className="space-y-2">
            <Label>Logos</Label>
            {logos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {logos.map((l, i) => (
                  <div key={`${l.url}-${i}`} className="group relative h-14 w-14 overflow-hidden rounded-lg border bg-white">
                    <img src={l.url} alt={l.name} className="h-full w-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => setLogos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute inset-x-0 bottom-0 hidden bg-black/60 py-0.5 text-center text-[10px] text-white group-hover:block"
                      aria-label={`Remove logo ${l.name}`}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {uploading ? "Uploading…" : "Upload logo (PNG, JPG, SVG, WebP)"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadLogo(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>

          {/* guidelines */}
          <div className="space-y-1.5">
            <Label htmlFor="kit-guidelines">Brand guidelines</Label>
            <Textarea
              id="kit-guidelines"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value.slice(0, 10_000))}
              rows={4}
              placeholder="How the kit should be used — logo clearspace, when to use each color, tone of voice…"
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">{guidelines.length}/10,000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save kit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
