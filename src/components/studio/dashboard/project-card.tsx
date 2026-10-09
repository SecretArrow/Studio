"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { localDeleteProject, localGetProject } from "@/lib/studio/local-store"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { MoreVertical, Star, Trash2, Pencil, Copy, CloudUpload, LayoutTemplate } from "lucide-react"

export interface ProjectCardData {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  favorite: boolean
  updatedAt: string
  local?: boolean
  deletedAt?: string | null
}

export function ProjectCard({ project, showTrashActions }: { project: ProjectCardData; showTrashActions?: boolean }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()
  const { toast } = useToast()
  const [renameOpen, setRenameOpen] = useState(false)
  const [name, setName] = useState(project.name)

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["projects"] })
  }

  async function open() {
    if (project.local) {
      const local = await localGetProject(project.id)
      if (!local) {
        toast({ title: "Draft not found", variant: "destructive" })
        return
      }
      // Local drafts open through the editor's local mode via sessionStorage bridge
      sessionStorage.setItem("studio:open-local", project.id)
      navigate({ name: "editor", projectId: project.id })
      return
    }
    navigate({ name: "editor", projectId: project.id })
  }

  async function toggleFavorite() {
    if (project.local) return
    try {
      await api.patch(`/api/projects/${project.id}`, { favorite: !project.favorite })
      await refresh()
    } catch {
      toast({ title: "Could not update favorite", variant: "destructive" })
    }
  }

  async function duplicate() {
    if (project.local) return
    try {
      await api.post(`/api/projects/${project.id}/duplicate`)
      await refresh()
      toast({ title: "Project duplicated" })
    } catch {
      toast({ title: "Duplicate failed", variant: "destructive" })
    }
  }

  async function rename() {
    if (!name.trim()) return
    if (project.local) return
    try {
      await api.patch(`/api/projects/${project.id}`, { name: name.trim() })
      setRenameOpen(false)
      await refresh()
    } catch {
      toast({ title: "Rename failed", variant: "destructive" })
    }
  }

  async function trash() {
    if (project.local) {
      await localDeleteProject(project.id)
      await refresh()
      return
    }
    try {
      await api.delete(`/api/projects/${project.id}`)
      await refresh()
      toast({ title: "Moved to trash" })
    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  async function restore() {
    try {
      await api.post(`/api/projects/${project.id}/restore`)
      await refresh()
      toast({ title: "Project restored" })
    } catch {
      toast({ title: "Restore failed", variant: "destructive" })
    }
  }

  async function deleteForever() {
    try {
      await api.delete(`/api/projects/${project.id}?hard=1`)
      await refresh()
      toast({ title: "Deleted permanently" })
    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  async function saveToCloud() {
    if (!user) {
      toast({ title: "Sign in first", description: "Create an account to sync drafts to the cloud." })
      return
    }
    const local = await localGetProject(project.id)
    if (!local) return
    const { migrateLocalToCloud } = await import("@/lib/studio/local-store")
    const cloudId = await migrateLocalToCloud(local)
    if (cloudId) {
      toast({ title: "Draft saved to cloud" })
      navigate({ name: "editor", projectId: cloudId })
    } else {
      toast({ title: "Cloud save failed", variant: "destructive" })
    }
  }

  const ratio = project.width / project.height
  const isWide = ratio > 1.5

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <button className="block w-full text-left" onClick={open} aria-label={`Open ${project.name}`}>
        <div className={`flex items-center justify-center overflow-hidden bg-muted ${isWide ? "aspect-video" : "aspect-[4/5]"}`}>
          {project.thumbnail ? (
            <img src={project.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
          ) : (
            <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
      </button>
      <div className="flex items-center gap-1 p-3">
        <button className="min-w-0 flex-1 text-left" onClick={open}>
          <p className="truncate text-sm font-medium">{project.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {project.local && <span className="mr-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Local draft</span>}
            <span className="capitalize">{project.type}</span> · {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Project actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showTrashActions ? (
              <>
                <DropdownMenuItem onClick={restore}><Pencil className="mr-2 h-4 w-4" /> Restore</DropdownMenuItem>
                <DropdownMenuItem onClick={deleteForever} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete forever</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={open}>Open</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                {!project.local && <DropdownMenuItem onClick={duplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>}
                {project.local && (
                  <DropdownMenuItem onClick={saveToCloud}><CloudUpload className="mr-2 h-4 w-4" /> Save to cloud</DropdownMenuItem>
                )}
                {!project.local && (
                  <DropdownMenuItem onClick={toggleFavorite}>
                    <Star className={`mr-2 h-4 w-4 ${project.favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    {project.favorite ? "Remove favorite" : "Favorite"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={trash} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={rename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
