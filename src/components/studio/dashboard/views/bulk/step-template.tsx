"use client"

/** Step 1 — pick the design to mass-produce: one of your projects or a public template. */

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { DesignDoc } from "@/lib/design/types"
import { FileText, Layers, Loader2, LogIn } from "lucide-react"
import type { BulkSource } from "./bulk-types"

interface TemplateRow {
  id: string
  name: string
  category: string
  type: string
  width: number
  height: number
  thumbnail: string | null
}

interface ProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
}

interface Props {
  selected: BulkSource | null
  onSelect: (source: BulkSource, doc: DesignDoc) => void
}

function Thumb({ src, name, type }: { src: string | null; name: string; type: string }) {
  if (src) {
    return <img src={src} alt={`Preview of ${name}`} className="h-28 w-full rounded-t-lg border-b bg-white object-contain" />
  }
  return (
    <div className="flex h-28 w-full items-center justify-center rounded-t-lg border-b bg-muted/50">
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
  )
}

function SelectableCard({
  name, meta, thumbnail, busy, active, onClick, disabled,
}: {
  name: string
  meta: string
  thumbnail: string | null
  busy: boolean
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-pressed={active}
      className={cn(
        "group overflow-hidden rounded-lg border bg-card text-left transition",
        active ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50",
        "disabled:cursor-wait disabled:opacity-70",
      )}
    >
      <div className="relative">
        <Thumb src={thumbnail} name={name} type="canvas" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </button>
  )
}

export function StepTemplate({ selected, onSelect }: Props) {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const { toast } = useToast()
  const [tab, setTab] = useState<"projects" | "templates">(user ? "projects" : "templates")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const projectsQuery = useQuery({
    queryKey: ["projects", "bulk"],
    enabled: !!user && tab === "projects",
    queryFn: () => api.get<{ projects: ProjectRow[] }>("/api/projects?limit=100&sort=recent"),
  })
  const templatesQuery = useQuery({
    queryKey: ["templates", "bulk"],
    enabled: tab === "templates",
    queryFn: () => api.get<{ templates: TemplateRow[] }>("/api/templates?limit=100"),
  })

  async function loadAndSelect(source: Omit<BulkSource, "thumbnail"> & { thumbnail?: string | null }, docPath: string, pick: (body: Record<string, unknown>) => string) {
    setLoadingId(source.id)
    try {
      const res = await api.get<Record<string, unknown>>(docPath)
      const contentJson = pick(res)
      const doc = JSON.parse(contentJson) as DesignDoc
      if (!doc || !Array.isArray(doc.pages)) throw new Error("This design has no readable content")
      onSelect({ ...source, thumbnail: source.thumbnail ?? null }, doc)
    } catch (err) {
      toast({ title: "Could not load that design", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "projects" | "templates")}>
        <TabsList>
          <TabsTrigger value="projects">My designs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          {!user ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
              <LogIn className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sign in to bulk-generate from your own saved designs. You can still use the Templates tab right now —
                everything runs in your browser.
              </p>
              <Button size="sm" onClick={() => navigate({ name: "auth" })}>Sign in</Button>
            </div>
          ) : projectsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your designs…
            </div>
          ) : (projectsQuery.data?.projects.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
              <Layers className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No saved designs yet — create one in the editor first, or pick a template.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {projectsQuery.data!.projects.map((p) => (
                <SelectableCard
                  key={p.id}
                  name={p.name}
                  meta={`${p.width}×${p.height} · ${p.type}`}
                  thumbnail={p.thumbnail}
                  busy={loadingId === p.id}
                  active={selected?.kind === "project" && selected.id === p.id}
                  onClick={() =>
                    void loadAndSelect(
                      { kind: "project", id: p.id, name: p.name, width: p.width, height: p.height, thumbnail: p.thumbnail },
                      `/api/projects/${p.id}`,
                      (body) => (body.project as { contentJson: string } | undefined)?.contentJson ?? "",
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {templatesQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {(templatesQuery.data?.templates ?? []).map((t) => (
                <SelectableCard
                  key={t.id}
                  name={t.name}
                  meta={`${t.width}×${t.height} · ${t.category}`}
                  thumbnail={t.thumbnail}
                  busy={loadingId === t.id}
                  active={selected?.kind === "template" && selected.id === t.id}
                  onClick={() =>
                    void loadAndSelect(
                      { kind: "template", id: t.id, name: t.name, width: t.width, height: t.height, thumbnail: t.thumbnail },
                      `/api/templates/${t.id}`,
                      (body) => (body.template as { contentJson: string } | undefined)?.contentJson ?? "",
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
