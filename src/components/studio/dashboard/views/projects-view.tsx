"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api } from "@/lib/studio/api-client"
import { localListProjects } from "@/lib/studio/local-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Plus, FolderPlus } from "lucide-react"
import { ProjectCard } from "../project-card"
import { NewDesignDialog } from "../new-design-dialog"
import { useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface ProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  favorite: boolean
  folderId?: string | null
  updatedAt: string
  local?: boolean
}

interface FolderRow { id: string; name: string }

export function ProjectsView({ folderId, search }: { folderId?: string; search: string }) {
  const { t } = useI18n()
  const user = useAppStore((s) => s.user)
  const qc = useQueryClient()
  const [sort, setSort] = useState("recent")
  const [favOnly, setFavOnly] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [folderDlgOpen, setFolderDlgOpen] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [localRows, setLocalRows] = useState<ProjectRow[]>([])

  const query = useQuery({
    queryKey: ["projects", "list", folderId, search, sort, favOnly],
    enabled: !!user,
    queryFn: () =>
      api.get<{ projects: ProjectRow[] }>(
        `/api/projects?sort=${sort}&limit=120${folderId ? `&folderId=${folderId}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}${favOnly ? "&favorite=1" : ""}`,
      ),
  })

  const folders = useQuery({
    queryKey: ["folders"],
    enabled: !!user,
    queryFn: () => api.get<{ folders: FolderRow[] }>("/api/folders"),
  })

  useEffect(() => {
    let alive = true
    localListProjects().then((ps) => {
      if (!alive) return
      setLocalRows(
        ps
          .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
          .map((p) => ({
            id: p.id, name: p.name, type: p.type, width: p.width, height: p.height,
            thumbnail: p.thumbnail ?? null, favorite: false, updatedAt: new Date(p.updatedAt).toISOString(), local: true,
          })),
      )
    })
    return () => {
      alive = false
    }
  }, [search, user])

  const cloudRows = query.data?.projects ?? []
  const rows = [...localRows, ...cloudRows]

  async function createFolder() {
    if (!folderName.trim()) return
    try {
      await api.post("/api/folders", { name: folderName.trim() })
      setFolderName("")
      setFolderDlgOpen(false)
      await qc.invalidateQueries({ queryKey: ["folders"] })
    } catch {
      // folders require an account
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">{t("nav.projects")}</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]" aria-label="Sort projects">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t("projects.sortRecent")}</SelectItem>
              <SelectItem value="name">{t("projects.sortName")}</SelectItem>
              <SelectItem value="created">{t("projects.sortCreated")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={favOnly ? "secondary" : "outline"} size="sm" className="min-h-[36px]" onClick={() => setFavOnly((v) => !v)}>
            <Star className={`h-4 w-4 ${favOnly ? "fill-amber-400 text-amber-400" : ""}`} /> Favorites
          </Button>
          {user && (
            <Button variant="outline" size="sm" className="min-h-[36px]" onClick={() => setFolderDlgOpen(true)}>
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>
          )}
          <Button size="sm" className="min-h-[36px]" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {folders.data?.folders && folders.data.folders.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            className={`min-h-[36px] rounded-full border px-4 text-sm ${!folderId ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
            onClick={() => useAppStore.getState().navigate({ name: "projects" })}
          >
            All projects
          </button>
          {folders.data.folders.map((f) => (
            <button
              key={f.id}
              className={`min-h-[36px] rounded-full border px-4 text-sm ${folderId === f.id ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
              onClick={() => useAppStore.getState().navigate({ name: "projects", folderId: f.id })}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("home.empty")}</p>
          <Button className="mt-4" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> {t("nav.newDesign")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <NewDesignDialog open={newOpen} onOpenChange={setNewOpen} />
      <Dialog open={folderDlgOpen} onOpenChange={setFolderDlgOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Folder name" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDlgOpen(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
