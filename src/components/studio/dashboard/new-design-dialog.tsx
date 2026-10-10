"use client"

import { useMemo, useState } from "react"
import { DOC_CATEGORIES, DOC_PRESETS } from "@/lib/design/presets"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { newLocalProjectId, localSaveProject } from "@/lib/studio/local-store"
import { createDoc, type DocType, type DesignDoc } from "@/lib/design/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const CUSTOM_W = 0

export function NewDesignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const [category, setCategory] = useState("social")
  const [busy, setBusy] = useState(false)
  const [customW, setCustomW] = useState(1080)
  const [customH, setCustomH] = useState(1080)

  const presets = useMemo(() => DOC_PRESETS.filter((p) => p.category === category), [category])

  async function createLocal(type: DocType, width: number, height: number, name: string): Promise<DesignDoc> {
    const doc = createDoc(type, width, height, name)
    const id = newLocalProjectId()
    const local = {
      id, name, type, width, height, doc, createdAt: Date.now(), updatedAt: Date.now(),
    }
    await localSaveProject(local)
    sessionStorage.setItem("studio:open-local", id)
    navigate({ name: "editor", projectId: id })
    return doc
  }

  async function create(presetId?: string) {
    setBusy(true)
    try {
      if (presetId === "custom") {
        if (!user) {
          await createLocal("canvas", customW, customH, "Custom design")
        } else {
          const res = await api.post<{ project: { id: string } }>("/api/projects", { name: "Custom design", doc: createDoc("canvas", customW, customH) })
          navigate({ name: "editor", projectId: res.project.id })
        }
      } else if (!user) {
        const preset = DOC_PRESETS.find((p) => p.id === presetId)
        if (!preset) return
        await createLocal(preset.type, preset.width, preset.height, preset.label)
      } else {
        const res = await api.post<{ project: { id: string; type: string } }>("/api/projects", { presetId })
        navigate({ name: "editor", projectId: res.project.id })
      }
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Could not create design", description: String(err instanceof Error ? err.message : err), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] w-[95vw] max-w-4xl flex-col p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>Create a new design</DialogTitle>
          <DialogDescription>
            {user ? "Pick a size preset to start from scratch." : "You are a guest — designs are stored locally in this browser. Sign in to sync to the cloud."}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={category} onValueChange={setCategory} className="flex min-h-0 flex-1 flex-col px-6">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 pb-3">
            {DOC_CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {presets.map((p) => (
              <button
                key={p.id}
                disabled={busy}
                onClick={() => create(p.id)}
                className="group flex min-h-[44px] flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <PreviewThumb w={p.width} h={p.height} />
                )}
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.width} × {p.height}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Custom size:</span>
            <input
              type="number" min={50} max={8000} value={customW}
              onChange={(e) => setCustomW(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-md border bg-transparent px-2 py-1 text-sm" aria-label="Width in pixels"
            />
            <span className="text-muted-foreground">×</span>
            <input
              type="number" min={50} max={8000} value={customH}
              onChange={(e) => setCustomH(parseInt(e.target.value, 10) || 0)}
              className="w-24 rounded-md border bg-transparent px-2 py-1 text-sm" aria-label="Height in pixels"
            />
            <button
              disabled={busy || customW < 50 || customH < 50}
              onClick={() => create("custom")}
              className="min-h-[36px] rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Create {customW}×{customH}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewThumb({ w, h }: { w: number; h: number }) {
  const maxW = 64
  const maxH = 64
  const scale = Math.min(maxW / w, maxH / h)
  return (
    <div className="flex h-16 w-16 items-center justify-center">
      <div
        className="rounded border-2 border-primary/40 bg-primary/10"
        style={{ width: Math.max(10, w * scale), height: Math.max(10, h * scale) }}
      />
    </div>
  )
}
