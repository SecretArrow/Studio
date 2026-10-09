"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { useI18n } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type AdminProjectRow, formatDate, timeAgo, useApiErrorToast } from "./admin-shared"

export function ProjectsTab() {
  const { t } = useI18n()
  const projects = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => api.get<{ projects: AdminProjectRow[] }>("/api/admin/projects"),
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(projects.error)

  const rows = projects.data?.projects ?? []

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("admin.projects.hint")}</p>
      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.projects.name")}</TableHead>
              <TableHead>{t("admin.projects.owner")}</TableHead>
              <TableHead>{t("admin.projects.type")}</TableHead>
              <TableHead>{t("admin.projects.size")}</TableHead>
              <TableHead>{t("admin.projects.updated")}</TableHead>
              <TableHead>{t("admin.projects.created")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-52 truncate">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.deletedAt && <Badge variant="secondary">trash</Badge>}
                  </span>
                </TableCell>
                <TableCell className="max-w-48 truncate text-xs">{p.owner?.name || p.owner?.email || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{p.type}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs tabular-nums">{p.width}×{p.height}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground" title={new Date(p.updatedAt).toLocaleString()}>
                  {timeAgo(p.updatedAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!projects.isLoading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("admin.projects.empty")}</p>
        )}
      </div>
    </div>
  )
}
