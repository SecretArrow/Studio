"use client"

/**
 * VersionsPanel — snapshot history for a project.
 * Backend: GET/POST /api/projects/{id}/versions, POST .../versions/{versionId}/restore.
 * Owner/editor can save snapshots and restore; others get read-only history.
 * Restoring reloads the editor doc via a full page refresh (hash route preserved).
 */

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, ApiClientError } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { CollabRole } from "./comments-panel"
import { History, HistoryIcon, ImageOff, Loader2, RotateCcw, Save } from "lucide-react"

interface VersionRow {
  id: string
  label: string
  thumbnail: string | null
  createdAt: string
  createdBy: { name: string | null } | null
}

interface VersionsPanelProps {
  projectId: string
  role: CollabRole
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  })
}

export function VersionsPanel({ projectId, role }: VersionsPanelProps) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [label, setLabel] = useState("")

  const canMutate = role === "owner" || role === "editor"

  const versionsQuery = useQuery({
    queryKey: ["versions", projectId] as const,
    queryFn: () => api.get<{ versions: VersionRow[] }>(`/api/projects/${encodeURIComponent(projectId)}/versions`),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["versions", projectId] })

  const saveSnapshot = useMutation({
    mutationFn: (name?: string) =>
      api.post(`/api/projects/${encodeURIComponent(projectId)}/versions`, name ? { label: name } : {}),
    onSuccess: () => {
      setLabel("")
      void invalidate()
      toast({ title: "Snapshot saved", description: "You can restore it at any time." })
    },
    onError: (err) => {
      toast({ title: "Could not save snapshot", description: err instanceof ApiClientError ? err.message : "Please try again", variant: "destructive" })
    },
  })

  const restoreVersion = useMutation({
    mutationFn: (versionId: string) =>
      api.post(`/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/restore`),
    onSuccess: () => {
      void invalidate()
      toast({ title: "Version restored", description: "Reloading the editor with the restored content…" })
      setTimeout(() => window.location.reload(), 800)
    },
    onError: (err) => {
      toast({ title: "Could not restore version", description: err instanceof ApiClientError ? err.message : "Please try again", variant: "destructive" })
    },
  })

  const versions = versionsQuery.data?.versions ?? []
  const busy = saveSnapshot.isPending || restoreVersion.isPending

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {canMutate && (
        <form
          className="shrink-0 space-y-2 border-b pb-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!busy) saveSnapshot.mutate(label.trim() || undefined)
          }}
        >
          <label htmlFor="version-label" className="text-sm font-medium">
            Save a snapshot
          </label>
          <div className="flex gap-2">
            <Input
              id="version-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Snapshot name (optional)"
              maxLength={120}
              className="h-9 text-sm"
            />
            <Button type="submit" size="sm" className="min-h-[36px]" disabled={saveSnapshot.isPending}>
              {saveSnapshot.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-1 h-4 w-4" aria-hidden />}
              Save
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Captures the project exactly as it is saved right now.</p>
        </form>
      )}

      <div className="collab-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {versionsQuery.isPending && (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border p-2">
                <Skeleton className="h-10 w-14 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {versionsQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium">Could not load version history</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {versionsQuery.error instanceof ApiClientError ? versionsQuery.error.message : "Please try again."}
            </p>
            <Button size="sm" variant="outline" className="mt-2 min-h-[36px]" onClick={() => void versionsQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!versionsQuery.isPending && !versionsQuery.isError && versions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">No snapshots yet</p>
            <p className="max-w-[240px] text-xs text-muted-foreground">
              {canMutate
                ? "Save a snapshot before big changes so you can always go back."
                : "The owner and editors can save snapshots here."}
            </p>
          </div>
        )}

        {versions.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-lg border p-2">
            {v.thumbnail ? (
              <img src={v.thumbnail} alt={`Thumbnail for ${v.label}`} className="h-10 w-14 shrink-0 rounded border object-cover" />
            ) : (
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground" aria-hidden>
                <ImageOff className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{v.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(v.createdAt)}
                {v.createdBy?.name ? ` · ${v.createdBy.name}` : ""}
              </p>
            </div>
            {canMutate && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="min-h-[36px]" disabled={busy}>
                    {restoreVersion.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden />}
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4" aria-hidden /> Restore “{v.label}”?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The project will be rolled back to this snapshot. Your current version is saved automatically as
                      “Before restore”, so nothing is lost. The editor reloads afterwards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="min-h-[36px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="min-h-[36px]"
                      onClick={() => restoreVersion.mutate(v.id)}
                    >
                      Restore version
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>

      {!canMutate && (
        <p className="shrink-0 border-t pt-3 text-xs text-muted-foreground">
          Only the project owner and editors can save snapshots or restore versions.
        </p>
      )}
    </div>
  )
}
