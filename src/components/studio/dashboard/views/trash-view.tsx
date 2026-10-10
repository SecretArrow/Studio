"use client"

import { useQuery } from "@tanstack/react-query"
import { useI18n } from "@/lib/i18n"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { ProjectCard } from "../project-card"

interface ProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnail: string | null
  favorite: boolean
  updatedAt: string
  deletedAt: string | null
}

export function TrashView() {
  const { t } = useI18n()
  const user = useAppStore((s) => s.user)
  const query = useQuery({
    queryKey: ["projects", "trash"],
    enabled: !!user,
    queryFn: () => api.get<{ projects: ProjectRow[] }>("/api/projects?trash=1&limit=120"),
  })
  const rows = query.data?.projects ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">{t("nav.trash")}</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{t("trash.subtitle")}</p>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">{t("trash.empty")}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => (
            <ProjectCard key={p.id} project={p} showTrashActions />
          ))}
        </div>
      )}
    </div>
  )
}
