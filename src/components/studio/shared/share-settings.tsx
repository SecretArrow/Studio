"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Link2, Lock } from "lucide-react"

interface ShareModeResponse {
  shareMode: string
}

interface LinkRow {
  id: string
  token: string
  role: string
  revoked: boolean
  createdAt: string
}

export function ShareSettings({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)

  const links = useQuery({
    queryKey: ["share-links", projectId],
    queryFn: () => api.get<{ links: LinkRow[] }>(`/api/share?projectId=${projectId}`),
  })

  const mode = useQuery({
    queryKey: ["share-mode", projectId],
    queryFn: () => api.get<{ project: ShareModeResponse }>(`/api/projects/${projectId}`),
  })

  async function setMode(value: string) {
    setBusy(true)
    try {
      await api.patch(`/api/projects/${projectId}`, { shareMode: value })
      await qc.invalidateQueries({ queryKey: ["share-mode", projectId] })
      toast({ title: "Sharing updated" })
    } catch {
      toast({ title: "Could not update sharing", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id: string) {
    try {
      await api.patch(`/api/share/${id}`, { revoked: true })
      await links.refetch()
      toast({ title: "Link revoked" })
    } catch {
      toast({ title: "Revoke failed", variant: "destructive" })
    }
  }

  const currentMode = mode.data?.project.shareMode ?? "private"

  return (
    <div className="space-y-4">
      <RadioGroup value={currentMode} onValueChange={setMode} className="gap-2" disabled={busy}>
        {[
          { value: "private", label: "Private", desc: "Only you can open this project." },
          { value: "link-view", label: "Anyone with link — view", desc: "Open and read; no edits." },
          { value: "link-comment", label: "Anyone with link — comment", desc: "View and leave comments." },
          { value: "link-edit", label: "Anyone with link — edit", desc: "Live collaborative editing." },
        ].map((opt) => (
          <Label key={opt.value} htmlFor={`share-${opt.value}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent/50">
            <RadioGroupItem value={opt.value} id={`share-${opt.value}`} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="block text-xs text-muted-foreground">{opt.desc}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
      {busy && <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> Projects are private by default. Share links can be revoked at any time.
      </p>
      {links.data?.links && links.data.links.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Invite links</p>
          {links.data.links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <code className="min-w-0 flex-1 truncate">{`${typeof window !== "undefined" ? window.location.origin : ""}${typeof window !== "undefined" ? window.location.pathname : ""}#/editor/${projectId}?share=${link.token}`}</code>
              <span className="rounded bg-muted px-1.5 py-0.5 capitalize">{link.role}</span>
              {!link.revoked && (
                <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => revoke(link.id)}>
                  Revoke
                </Button>
              )}
              {link.revoked && <span className="text-muted-foreground">revoked</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
