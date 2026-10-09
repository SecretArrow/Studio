"use client"

/**
 * "Apply to design" — pick one of the user's projects, preview what the brand kit
 * will change (honestly), then overwrite that project's doc via PATCH.
 */

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import type { DesignDoc } from "@/lib/design/types"
import { ArrowLeft, Check, FileWarning, Loader2, Palette, Search } from "lucide-react"
import { parseColors, parseFonts, type BrandKitRow } from "./kit-types"
import { applyKitToDoc } from "./apply-kit"

interface ProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  updatedAt: string
}

interface Props {
  kit: BrandKitRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplyKitDialog({ kit, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ProjectRow | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [plan, setPlan] = useState<{ fontChanges: number; colorChanges: number; contentJson: string } | null>(null)

  const projectsQuery = useQuery({
    queryKey: ["projects", "for-apply"],
    enabled: open,
    queryFn: () => api.get<{ projects: ProjectRow[] }>("/api/projects?limit=100&sort=recent"),
  })

  const fonts = useMemo(() => parseFonts(kit.fontsJson), [kit.fontsJson])
  const colors = useMemo(() => parseColors(kit.colorsJson), [kit.colorsJson])

  const projects = (projectsQuery.data?.projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  async function pick(project: ProjectRow) {
    setSelected(project)
    setDocLoading(true)
    setPlan(null)
    try {
      const res = await api.get<{ project: { contentJson: string } }>(`/api/projects/${project.id}`)
      const doc = JSON.parse(res.project.contentJson) as DesignDoc
      const result = applyKitToDoc(doc, fonts, colors)
      if (result.fontChanges === 0 && result.colorChanges === 0) {
        toast({
          title: "Nothing to change in this design",
          description: "No text elements use the Studio default font/colors, so this kit would not alter it.",
        })
        setSelected(null)
        return
      }
      setPlan({ fontChanges: result.fontChanges, colorChanges: result.colorChanges, contentJson: JSON.stringify(result.doc) })
    } catch (err) {
      toast({ title: "Could not load design", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
      setSelected(null)
    } finally {
      setDocLoading(false)
    }
  }

  async function apply() {
    if (!selected || !plan) return
    setApplying(true)
    try {
      await api.patch(`/api/projects/${selected.id}`, { contentJson: plan.contentJson })
      await qc.invalidateQueries({ queryKey: ["projects"] })
      toast({ title: "Brand kit applied", description: `"${selected.name}" now uses your kit colors and font.` })
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Could not apply kit", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setApplying(false)
    }
  }

  function close(next: boolean) {
    if (!next) {
      setSelected(null)
      setPlan(null)
      setSearch("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Apply “{kit.name}” to a design
          </DialogTitle>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your designs…" className="pl-9" aria-label="Search projects" />
            </div>
            <ScrollArea className="h-72 rounded-lg border">
              {projectsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading designs…
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
                  <FileWarning className="h-5 w-5" />
                  No designs found. Create a design first, then apply your kit.
                </div>
              ) : (
                <div className="divide-y">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void pick(p)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted"
                    >
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded border object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted text-[10px] uppercase text-muted-foreground">{p.type.slice(0, 3)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.width}×{p.height} · {p.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-3">
            {docLoading || !plan ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing design…
              </div>
            ) : (
              <>
                <div className="rounded-lg border bg-card p-4 text-sm">
                  <p className="font-medium">{selected.name}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      {plan.fontChanges > 0
                        ? `${plan.fontChanges} text element${plan.fontChanges === 1 ? "" : "s"} will switch to the kit font ${fonts[0]}.`
                        : "No text elements use the default Studio font."}
                    </li>
                    <li>
                      {plan.colorChanges > 0
                        ? `${plan.colorChanges} text element${plan.colorChanges === 1 ? "" : "s"} using Studio default colors will be recolored to your kit.`
                        : "No text elements use the default Studio colors."}
                    </li>
                    <li>Custom fonts and custom colors are left untouched.</li>
                  </ul>
                </div>
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  This overwrites the design&apos;s saved copy in the cloud (autosave versions aside). If it looks wrong afterwards, use Project → Versions to restore.
                </p>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {selected ? (
            <>
              <Button variant="outline" onClick={() => { setSelected(null); setPlan(null) }} disabled={applying || docLoading}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => void apply()} disabled={applying || docLoading || !plan}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Apply &amp; save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => close(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
