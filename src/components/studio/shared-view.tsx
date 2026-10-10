"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"
import { api, ApiClientError } from "@/lib/studio/api-client"
import type { DesignDoc } from "@/lib/design/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Eye, MessageSquare } from "lucide-react"

interface SharedPayload {
  project: { id: string; name: string; type: string; width: number; height: number; contentJson: string; thumbnail: string | null }
  role: "viewer" | "commenter" | "editor"
}

/** Landing for shared links (?share=token). Read-only preview + open-in-editor. */
export function SharedView({ token }: { token: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<SharedPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get<{ project: SharedPayload["project"]; role: SharedPayload["role"] }>(`/api/share-link/${token}`)
      .then((res) => {
        if (alive) setData(res)
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiClientError ? err.message : "Link invalid")
      })
    return () => {
      alive = false
    }
  }, [token])

  if (error) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold">{error}</p>
        <Button variant="outline" onClick={() => navigate({ name: "home" })}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
      </div>
    )
  }
  if (!data) {
    return <div className="flex h-[100dvh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const doc = JSON.parse(data.project.contentJson) as DesignDoc

  return (
    <div className="flex h-[100dvh] flex-col bg-muted">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ name: "home" })} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="font-semibold">{data.project.name}</p>
        <span className="ml-2 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> Shared with you — {data.role}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => navigate({ name: "editor", projectId: data.project.id, share: token })}>
            {data.role === "editor" ? "Open in editor" : user ? "Open" : "Open preview"}
          </Button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="max-h-[75dvh] overflow-hidden rounded-lg border bg-white shadow-lg" style={{ aspectRatio: `${doc.width} / ${doc.height}` }}>
            {data.project.thumbnail ? (
              <img src={data.project.thumbnail} alt={data.project.name} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No preview yet</div>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" /> {doc.pages.length} page(s) · {data.project.type}
          </p>
        </div>
      </main>
    </div>
  )
}
