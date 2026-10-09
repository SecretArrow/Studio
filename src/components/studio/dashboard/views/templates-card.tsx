"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export interface TemplateRow {
  id: string
  slug: string
  name: string
  category: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  featured: boolean
  license: string
}

export function TemplateCard({ template }: { template: TemplateRow }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const qc = useQueryClient()
  const [authPrompt, setAuthPrompt] = useState(false)
  const [busy, setBusy] = useState(false)

  function openDetail() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    navigate({ name: "templates-detail", templateId: template.id })
  }

  async function useTemplate() {
    if (!user) {
      setAuthPrompt(true)
      return
    }
    setBusy(true)
    try {
      const res = await api.post<{ project: { id: string } }>(`/api/templates/${template.id}/use`)
      await qc.invalidateQueries({ queryKey: ["projects"] })
      navigate({ name: "editor", projectId: res.project.id })
    } catch {
      toast({ title: "Could not use template", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const ratio = template.width / template.height
  return (
    <>
      <div className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
        <button className="block w-full text-left" onClick={openDetail} aria-label={`Open template ${template.name}`}>
          <div className={`flex items-center justify-center overflow-hidden bg-muted ${ratio > 1.4 ? "aspect-video" : "aspect-[4/5]"}`}>
            {template.thumbnail ? (
              <img src={template.thumbnail} alt={template.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 p-3">
          <button className="min-w-0 flex-1 text-left" onClick={openDetail}>
            <p className="truncate text-sm font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{template.category} · {template.width}×{template.height}</p>
          </button>
          <Button size="sm" variant="secondary" className="h-8 shrink-0" onClick={useTemplate} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            Customize
          </Button>
        </div>
      </div>
      <Dialog open={authPrompt} onOpenChange={setAuthPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to customize templates</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Templates are free for everyone. A free account keeps your customized copy in the cloud.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAuthPrompt(false); navigate({ name: "auth" }) }}>Sign in / Register</Button>
            <Button variant="ghost" onClick={() => setAuthPrompt(false)}>Not now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
