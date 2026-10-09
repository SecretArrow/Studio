"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle } from "lucide-react"
import { type BulkJobRow, formatDate, JobStatusBadge, timeAgo, useApiErrorToast } from "./admin-shared"

export function JobsTab() {
  const { t } = useI18n()
  const jobs = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: () => api.get<{ jobs: BulkJobRow[]; failed: number }>("/api/admin/jobs"),
    refetchInterval: 15_000,
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(jobs.error)

  const rows = jobs.data?.jobs ?? []
  const failed = jobs.data?.failed ?? 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={failed > 0 ? "h-4 w-4 text-destructive" : "h-4 w-4 text-muted-foreground"} aria-hidden="true" />
            {t("admin.jobs.failedTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums">{jobs.isLoading ? <Skeleton className="h-8 w-12" /> : failed}</p>
        </CardContent>
      </Card>

      <div className="max-h-96 overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.jobs.owner")}</TableHead>
              <TableHead>{t("admin.jobs.status")}</TableHead>
              <TableHead className="min-w-36">{t("admin.jobs.progress")}</TableHead>
              <TableHead>{t("admin.audit.target")}</TableHead>
              <TableHead>{t("admin.jobs.created")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {rows.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="max-w-44 truncate text-xs">{job.owner?.email ?? "—"}</TableCell>
                <TableCell><JobStatusBadge status={job.status} /></TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Progress value={job.total > 0 ? Math.round((job.done / job.total) * 100) : 0} className="h-1.5 w-24" />
                    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{job.done}/{job.total}</span>
                  </span>
                </TableCell>
                <TableCell className="max-w-40 truncate text-xs" title={job.error ?? job.projectId ?? undefined}>
                  {job.error ?? job.projectId ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground" title={formatDate(job.createdAt)}>
                  {timeAgo(job.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!jobs.isLoading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("admin.jobs.empty")}</p>
        )}
      </div>
    </div>
  )
}
