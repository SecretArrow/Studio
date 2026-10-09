"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore, type AppView } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { DOC_CATEGORIES } from "@/lib/design/presets"
import { api } from "@/lib/studio/api-client"
import { localListProjects } from "@/lib/studio/local-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home, LayoutTemplate, FolderKanban, Trash2, Settings, ShieldCheck, Palette, Layers3, Plus, Search, X, Menu,
} from "lucide-react"
import { NewDesignDialog } from "./new-design-dialog"
import { ProjectCard } from "./project-card"
import { ProjectsView } from "./views/projects-view"
import { TrashView } from "./views/trash-view"
import { TemplatesView } from "./views/templates-view"
import { TemplateDetail } from "./views/template-detail"
import { BrandView } from "./views/brand-view"
import { BulkView } from "./views/bulk-view"
import { SettingsView } from "./views/settings-view"
import { AdminView } from "./views/admin-view"

interface ProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  favorite: boolean
  updatedAt: string
  local?: boolean
}

interface TemplateRow {
  id: string
  name: string
  category: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  featured: boolean
}

/* ------------------------------ Sidebar ------------------------------ */

export function Sidebar({ onNew }: { onNew: () => void }) {
  const { t } = useI18n()
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const items: { view: AppView; label: string; icon: React.ReactNode }[] = useMemo(
    () => [
      { view: { name: "home" }, label: t("nav.home"), icon: <Home className="h-4 w-4" /> },
      { view: { name: "projects" }, label: t("nav.projects"), icon: <FolderKanban className="h-4 w-4" /> },
      { view: { name: "templates" }, label: t("nav.templates"), icon: <LayoutTemplate className="h-4 w-4" /> },
      { view: { name: "brand" }, label: t("nav.brand"), icon: <Palette className="h-4 w-4" /> },
      { view: { name: "bulk" }, label: t("nav.bulk"), icon: <Layers3 className="h-4 w-4" /> },
      { view: { name: "trash" }, label: t("nav.trash"), icon: <Trash2 className="h-4 w-4" /> },
      { view: { name: "settings" }, label: t("nav.settings"), icon: <Settings className="h-4 w-4" /> },
      ...(user?.role === "admin" ? [{ view: { name: "admin" } as AppView, label: t("nav.admin"), icon: <ShieldCheck className="h-4 w-4" /> }] : []),
    ],
    [t, user],
  )

  return (
    <aside
      className={cn(
        "z-30 flex h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r bg-card transition-all duration-200",
        sidebarOpen ? "w-60" : "w-0 overflow-hidden md:w-14",
        "max-md:absolute max-md:bottom-0 max-md:left-0 max-md:top-14 max-md:z-40",
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {sidebarOpen && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workspace</span>}
        <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu className="h-4 w-4" />
        </Button>
        {sidebarOpen && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className={cn("px-3 pb-3", !sidebarOpen && "md:hidden")}>
        <Button className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4" /> {sidebarOpen ? t("nav.newDesign") : ""}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {items.map((item) => {
            const active = view.name === item.view.name
            return (
              <button
                key={item.view.name}
                onClick={() => navigate(item.view)}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  !sidebarOpen && "justify-center px-0",
                )}
                title={item.label}
              >
                {item.icon}
                {sidebarOpen && item.label}
              </button>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}

/* ------------------------------ Root shell ------------------------------ */

export function Dashboard() {
  const { t } = useI18n()
  const navigate = useAppStore((s) => s.navigate)
  const view = useAppStore((s) => s.view)
  const [search, setSearch] = useState("")
  const [newOpen, setNewOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 pt-[env(safe-area-inset-top)] md:px-4">
        <button className="flex items-center gap-2" onClick={() => navigate({ name: "home" })} aria-label="Studio home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers3 className="h-4 w-4" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">Studio</span>
        </button>
        <div className="relative ml-2 max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (view.name !== "projects") navigate({ name: "projects" })
            }}
            placeholder={t("projects.search")}
            className="pl-9"
            aria-label={t("projects.search")}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => setNewOpen(true)} size="sm" className="min-h-[36px]">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t("nav.newDesign")}</span>
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <Sidebar onNew={() => setNewOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          {view.name === "home" && <DashboardHome search={search} />}
          {view.name === "projects" && <ProjectsView folderId={view.folderId} search={search} />}
          {view.name === "trash" && <TrashView />}
          {view.name === "templates" && <TemplatesView search={search} />}
          {view.name === "templates-detail" && <TemplateDetail templateId={view.templateId} />}
          {view.name === "brand" && <BrandView />}
          {view.name === "bulk" && <BulkView />}
          {view.name === "settings" && <SettingsView />}
          {view.name === "admin" && <AdminView />}
        </main>
      </div>

      <NewDesignDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

/* ------------------------------ Home ------------------------------ */

function DashboardHome({ search }: { search: string }) {
  const { t } = useI18n()
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6">
      <section className="rounded-2xl border bg-card p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("home.startBlank")}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("app.tagline")}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {DOC_CATEGORIES.map((cat) => (
            <CategoryChip key={cat.id} label={cat.label} />
          ))}
        </div>
      </section>
      <ProjectsHomeSection search={search} />
      <FeaturedTemplatesSection />
    </div>
  )
}

function CategoryChip({ label }: { label: string }) {
  const navigate = useAppStore((s) => s.navigate)
  return (
    <button
      className="flex min-h-[44px] items-center justify-center rounded-xl border bg-background px-3 py-2 text-center text-sm font-medium transition-colors hover:border-primary hover:text-primary"
      onClick={() => navigate({ name: "templates" })}
    >
      {label}
    </button>
  )
}

function useLocalProjectsAsRows(search: string): ProjectRow[] {
  const [rows, setRows] = useState<ProjectRow[]>([])
  useEffect(() => {
    let alive = true
    localListProjects().then((ps) => {
      if (!alive) return
      setRows(
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
  }, [search])
  return rows
}

function ProjectsHomeSection({ search }: { search: string }) {
  const { t } = useI18n()
  const user = useAppStore((s) => s.user)

  const query = useQuery({
    queryKey: ["projects", "home", search],
    enabled: !!user,
    queryFn: () => api.get<{ projects: ProjectRow[] }>(`/api/projects?limit=8${search ? `&q=${encodeURIComponent(search)}` : ""}`),
  })

  const localRows = useLocalProjectsAsRows(search)
  const combined = [...localRows, ...(query.data?.projects ?? [])].slice(0, 12)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("home.recent")}</h2>
        <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().navigate({ name: "projects" })}>
          View all
        </Button>
      </div>
      {combined.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{t("home.empty")}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {combined.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function FeaturedTemplatesSection() {
  const { t } = useI18n()
  const navigate = useAppStore((s) => s.navigate)
  const query = useQuery({
    queryKey: ["templates", "featured"],
    queryFn: () => api.get<{ templates: TemplateRow[] }>("/api/templates?featured=1&limit=10"),
  })
  const templates = query.data?.templates ?? []
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("home.templates")}</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate({ name: "templates" })}>
          Browse all
        </Button>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Seeding templates…</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {templates.slice(0, 10).map((tpl) => (
            <button
              key={tpl.id}
              className="group overflow-hidden rounded-xl border bg-card text-left transition-shadow hover:shadow-md"
              onClick={() => navigate({ name: "templates-detail", templateId: tpl.id })}
            >
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                {tpl.thumbnail ? (
                  <img src={tpl.thumbnail} alt={tpl.name} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                ) : (
                  <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{tpl.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{tpl.category}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
